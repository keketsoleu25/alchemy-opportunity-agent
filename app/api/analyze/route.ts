import { NextResponse } from "next/server";
import { demoOpportunities, demoProfile } from "@/lib/data";
import { analyseOpportunity } from "@/lib/scoring";

export async function POST() {
  const results = demoOpportunities
    .map((opportunity) => analyseOpportunity(demoProfile, opportunity))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    profile: demoProfile,
    results,
    mode: "deterministic-demo",
    note: "AWS Bedrock orchestration will replace the narrative reasoning layer in the next milestone.",
  });
}
