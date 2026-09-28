import { NextRequest, NextResponse } from "next/server";
import { demoProfile } from "@/lib/data";
import { discoverOpportunities } from "@/lib/discovery";
import { analyseOpportunity } from "@/lib/scoring";
import { enrichWithBedrock, getBedrockConfig } from "@/lib/bedrock";
import type { CandidateProfile, MatchResult } from "@/lib/types";

type AnalyzeRequest = {
  profile?: Partial<CandidateProfile>;
  query?: string;
  useDemo?: boolean;
};

function cleanStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function boolOrFallback(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
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
    remotePreferred: boolOrFallback(input?.remotePreferred, demoProfile.remotePreferred),
    hybridAccepted: boolOrFallback(input?.hybridAccepted, demoProfile.hybridAccepted),
    onSiteAccepted: boolOrFallback(input?.onSiteAccepted, demoProfile.onSiteAccepted),
    willingToRelocate: boolOrFallback(input?.willingToRelocate, demoProfile.willingToRelocate),
    workAuthorizedCountries: cleanStringArray(
      input?.workAuthorizedCountries,
      demoProfile.workAuthorizedCountries,
    ),
  };
}

function decisionPriority(result: MatchResult) {
  if (result.decision === "APPLY") return 3;
  if (result.decision === "STRETCH") return 2;
  return 1;
}

function preferredRolePriority(result: MatchResult) {
  if (result.strengths.includes("Role family directly matches one of your stated target roles")) return 3;
  if (result.strengths.includes("Role is within your broader software-development target family")) return 2;
  if (result.gaps.includes("Role family is adjacent to, but outside, your stated target roles")) return 0;
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
  const discovery = await discoverOpportunities(query, body.useDemo === true);

  const scored = discovery.opportunities
    .map((opportunity, discoveryIndex) => ({
      result: analyseOpportunity(profile, opportunity),
      discoveryIndex,
    }))
    .sort((a, b) => {
      const decisionDelta = decisionPriority(b.result) - decisionPriority(a.result);
      if (decisionDelta !== 0) return decisionDelta;

      const targetRoleDelta = preferredRolePriority(b.result) - preferredRolePriority(a.result);
      if (targetRoleDelta !== 0) return targetRoleDelta;

      const relevanceDelta = a.discoveryIndex - b.discoveryIndex;
      if (relevanceDelta !== 0) return relevanceDelta;

      return b.result.score - a.result.score;
    })
    .slice(0, 12)
    .map(({ result }) => result);

  const bedrockEnabled = process.env.BEDROCK_ENABLED === "true";
  const rankingNote =
    "Final ordering prioritises decision quality, then the candidate's stated target role families, then discovery relevance.";

  if (!bedrockEnabled) {
    return NextResponse.json({
      profile,
      query,
      results: scored,
      mode: "deterministic-fallback",
      sourceMode: discovery.sourceMode,
      note: `${discovery.note} ${rankingNote} Candidate qualifications, work-mode tolerance, relocation preference, and work authorization remain part of the guarded scoring engine. Bedrock is disabled, so deterministic scoring and explanations are active.`,
    });
  }

  // Keep the live demo responsive and bound model usage: explain the top three
  // actionable matches, while all other cards retain deterministic reasoning.
  const selected = scored
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => result.decision !== "SKIP")
    .slice(0, 3);
  const settled = await Promise.allSettled(selected.map(({ result }) => enrichWithBedrock(result)));
  const results = [...scored];
  let enrichedCount = 0;
  settled.forEach((outcome, selectedIndex) => {
    if (outcome.status === "fulfilled" && outcome.value.reasoning !== selected[selectedIndex].result.reasoning) {
      results[selected[selectedIndex].index] = outcome.value;
      enrichedCount++;
    } else if (outcome.status === "rejected") {
      console.error("Bedrock reasoning failed for one result; using deterministic explanation.", outcome.reason);
    }
  });
  const config = getBedrockConfig();

  return NextResponse.json({
    profile,
    query,
    results,
    mode: enrichedCount ? "aws-bedrock" : "deterministic-fallback",
    sourceMode: discovery.sourceMode,
    ...(enrichedCount ? { model: config.modelId, region: config.region } : {}),
    note: `${discovery.note} ${rankingNote} Scores and decisions are deterministic. Bedrock explained ${enrichedCount} of ${selected.length} selected actionable matches; the other results use deterministic explanations.`,
  });
}
