import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { MatchResult } from "@/lib/types";

const region = process.env.AWS_REGION ?? "us-east-1";
const modelId =
  process.env.BEDROCK_MODEL_ID ??
  "global.anthropic.claude-haiku-4-5-20251001-v1:0";

const client = new BedrockRuntimeClient({ region });

function buildPrompt(result: MatchResult) {
  const { opportunity, score, decision, strengths, gaps } = result;

  return [
    "You are the reasoning layer for Alchemy Opportunity Agent.",
    "The deterministic scoring engine has already evaluated this vacancy.",
    "Do not change the score or decision. Explain them clearly and practically.",
    "Keep the response to two short sentences and avoid hype.",
    "",
    `Role: ${opportunity.title}`,
    `Company: ${opportunity.company}`,
    `Work mode: ${opportunity.workMode}`,
    `Score: ${score}%`,
    `Decision: ${decision}`,
    `Evidence: ${strengths.join("; ") || "None"}`,
    `Gaps: ${gaps.join("; ") || "No material gaps"}`,
  ].join("\n");
}

function extractText(output: unknown): string | null {
  if (!output || typeof output !== "object") return null;

  const message = (output as { message?: { content?: Array<{ text?: string }> } })
    .message;

  const text = message?.content?.find((item) => typeof item.text === "string")?.text;
  return text?.trim() || null;
}

export async function enrichWithBedrock(
  result: MatchResult,
): Promise<MatchResult> {
  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: "user",
        content: [{ text: buildPrompt(result) }],
      },
    ],
    inferenceConfig: {
      maxTokens: 180,
      temperature: 0.2,
      topP: 0.9,
    },
  });

  const response = await client.send(command);
  const reasoning = extractText(response.output);

  return reasoning ? { ...result, reasoning } : result;
}

export function getBedrockConfig() {
  return { region, modelId };
}
