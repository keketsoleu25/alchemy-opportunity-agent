import { demoOpportunities } from "@/lib/data";
import { fetchGreenhouseBoard } from "@/lib/sources/greenhouse";
import type { Opportunity } from "@/lib/types";

export type DiscoveryResult = {
  opportunities: Opportunity[];
  sourceMode: "live-greenhouse" | "demo-fallback";
  note: string;
};

function tokensFromEnv() {
  return (process.env.GREENHOUSE_BOARD_TOKENS ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function queryTerms(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((term) => term.length >= 3 && !["find", "realistic", "software", "opportunities", "match", "profile"].includes(term));
}

function rankByQuery(opportunities: Opportunity[], query: string) {
  const terms = queryTerms(query);
  if (!terms.length) return opportunities;

  return opportunities
    .map((opportunity) => {
      const text = `${opportunity.title} ${opportunity.summary} ${opportunity.location}`.toLowerCase();
      const hits = terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
      return { opportunity, hits };
    })
    .sort((a, b) => b.hits - a.hits)
    .map(({ opportunity }) => opportunity);
}

export async function discoverOpportunities(query: string): Promise<DiscoveryResult> {
  const tokens = tokensFromEnv();

  if (!tokens.length) {
    return {
      opportunities: demoOpportunities,
      sourceMode: "demo-fallback",
      note: "No live job-board sources are configured yet; using demo opportunities.",
    };
  }

  const settled = await Promise.allSettled(tokens.map(fetchGreenhouseBoard));
  const live = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  if (!live.length) {
    return {
      opportunities: demoOpportunities,
      sourceMode: "demo-fallback",
      note: "Configured live sources returned no usable vacancies, so demo opportunities were used.",
    };
  }

  const unique = Array.from(new Map(live.map((job) => [job.sourceUrl ?? job.id, job])).values());
  const ranked = rankByQuery(unique, query).slice(0, 40);

  return {
    opportunities: ranked,
    sourceMode: "live-greenhouse",
    note: `Imported ${ranked.length} live vacancies from configured Greenhouse boards.`,
  };
}
