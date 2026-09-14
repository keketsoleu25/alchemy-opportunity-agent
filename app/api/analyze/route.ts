import { NextRequest, NextResponse } from "next/server";
import { demoProfile } from "@/lib/data";
import { discoverOpportunities } from "@/lib/discovery";
import { analyseOpportunity } from "@/lib/scoring";
import { enrichWithBedrock, getBedrockConfig } from "@/lib/bedrock";
import type { CandidateProfile, MatchResult } from "@/lib/types";

type AnalyzeRequest = {
  profile?: Partial<CandidateProfile>;
  query?: string;
};

function cleanStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function buildProfile(input?: Partial<CandidateProfile>): CandidateProfile {
  const yearsExperience = Number(input?.yearsExperience);

  return {
    name: typeof input?.name === "string" && input.name.trim() ? input.name.trim() : demoProfile.name,
    location:
      typeof input?.location === "string" && input.location.trim()
        ? input.location.trim()
        : demoProfile.location,
    yearsExperience:
      Number.isFinite(yearsExperience) && yearsExperience >= 0
        ? Math.min(yearsExperience, 50)
        : demoProfile.yearsExperience,
    skills: cleanStringArray(input?.skills, demoProfile.skills),
    qualifications: cleanStringArray(input?.qualifications, demoProfile.qualifications),
    preferredRoles: cleanStringArray(input?.preferredRoles, demoProfile.preferredRoles),
    remotePreferred:
      typeof input?.remotePreferred === "boolean"
        ? input.remotePreferred
        : demoProfile.remotePreferred,
  };
}

function decisionPriority(result: MatchResult) {
  if (result.decision === "APPLY") return 3;
  if (result.decision === "STRETCH") return 2;
  return 1;
}

export async function POST(request: NextRequest) {
  let body: AnalyzeRequest = {};

  try {
    body = await request.json();
  } catch {
    // Empty or malformed JSON falls back to the demo profile so the app remains usable.
  }

  const profile = buildProfile(body.profile);
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const discovery = await discoverOpportunities(query);

  // Discovery has already ranked the vacancies by request relevance and seniority.
  // Preserve that ordering inside each decision tier instead of discarding it with
  // a global score-only sort. Match percentage is used as a tie-breaker only.
  const scored = discovery.opportunities
    .map((opportunity, discoveryIndex) => ({
      result: analyseOpportunity(profile, opportunity),
      discoveryIndex,
    }))
    .sort((a, b) => {
      const decisionDelta = decisionPriority(b.result) - decisionPriority(a.result);
      if (decisionDelta !== 0) return decisionDelta;

      const relevanceDelta = a.discoveryIndex - b.discoveryIndex;
      if (relevanceDelta !== 0) return relevanceDelta;

      return b.result.score - a.result.score;
    })
    .slice(0, 12)
    .map(({ result }) => result);

  const bedrockEnabled = process.env.BEDROCK_ENABLED === "true";

  if (!bedrockEnabled) {
    return NextResponse.json({
      profile,
      query,
      results: scored,
      mode: "deterministic-fallback",
      sourceMode: discovery.sourceMode,
      note: `${discovery.note} Final ordering prioritises APPLY, then STRETCH, then SKIP while preserving discovery relevance. Bedrock is disabled, so deterministic scoring and explanations are active.`,
    });
  }

  try {
    const results = await Promise.all(scored.map(enrichWithBedrock));
    const config = getBedrockConfig();

    return NextResponse.json({
      profile,
      query,
      results,
      mode: "aws-bedrock",
      sourceMode: discovery.sourceMode,
      model: config.modelId,
      region: config.region,
      note: `${discovery.note} Final ordering prioritises APPLY, then STRETCH, then SKIP while preserving discovery relevance. Deterministic scoring is preserved; Amazon Bedrock generates the user-facing reasoning.`,
    });
  } catch (error) {
    console.error("Bedrock reasoning failed; using deterministic fallback.", error);

    return NextResponse.json({
      profile,
      query,
      results: scored,
      mode: "deterministic-fallback",
      sourceMode: discovery.sourceMode,
      note: `${discovery.note} Final ordering prioritises APPLY, then STRETCH, then SKIP while preserving discovery relevance. Bedrock invocation failed, so the agent safely returned deterministic results.`,
    });
  }
}
