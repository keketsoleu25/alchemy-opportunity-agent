import { NextResponse } from "next/server";
import { demoOpportunities, demoProfile } from "@/lib/data";
import { analyseOpportunity } from "@/lib/scoring";
import { enrichWithBedrock, getBedrockConfig } from "@/lib/bedrock";

export async function POST() {
  const scored = demoOpportunities
    .map((opportunity) => analyseOpportunity(demoProfile, opportunity))
    .sort((a, b) => b.score - a.score);

  const bedrockEnabled = process.env.BEDROCK_ENABLED === "true";

  if (!bedrockEnabled) {
    return NextResponse.json({
      profile: demoProfile,
      results: scored,
      mode: "deterministic-fallback",
      note: "Bedrock is wired in but disabled. Set BEDROCK_ENABLED=true after AWS credentials and model access are configured.",
    });
  }

  try {
    const results = await Promise.all(scored.map(enrichWithBedrock));
    const config = getBedrockConfig();

    return NextResponse.json({
      profile: demoProfile,
      results,
      mode: "aws-bedrock",
      model: config.modelId,
      region: config.region,
      note: "Deterministic scoring is preserved; Amazon Bedrock generates the user-facing reasoning.",
    });
  } catch (error) {
    console.error("Bedrock reasoning failed; using deterministic fallback.", error);

    return NextResponse.json({
      profile: demoProfile,
      results: scored,
      mode: "deterministic-fallback",
      note: "Bedrock invocation failed, so the agent safely returned deterministic results. Check AWS credentials, region, model access, and BEDROCK_MODEL_ID.",
    });
  }
}
