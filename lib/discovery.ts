import { demoOpportunities } from "@/lib/data";
import { fetchGreenhouseBoard } from "@/lib/sources/greenhouse";
import type { Opportunity } from "@/lib/types";

export type DiscoveryResult = {
  opportunities: Opportunity[];
  sourceMode: "live-greenhouse" | "demo-fallback";
  note: string;
};

const softwareIntentTerms = [
  "software",
  "developer",
  "frontend",
  "front-end",
  "backend",
  "back-end",
  "full-stack",
  "full stack",
  "engineer",
  "engineering",
  "programmer",
  "web developer",
  "devops",
  "cloud",
  "platform",
];

const softwareRoleTerms = [
  "software",
  "developer",
  "engineer",
  "engineering",
  "frontend",
  "front-end",
  "backend",
  "back-end",
  "full-stack",
  "full stack",
  "web developer",
  "application developer",
  "mobile developer",
  "android",
  "ios",
  "devops",
  "platform",
  "cloud engineer",
  "qa engineer",
  "quality engineer",
  "test automation",
  "data engineer",
  "graduate developer",
  "graduate engineer",
];

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
    .filter(
      (term) =>
        term.length >= 3 &&
        !["find", "realistic", "opportunities", "match", "profile", "that", "with", "role", "roles"].includes(term),
    );
}

function hasSoftwareIntent(query: string) {
  const lower = query.toLowerCase();
  return softwareIntentTerms.some((term) => lower.includes(term));
}

function isSoftwareOpportunity(opportunity: Opportunity) {
  const title = opportunity.title.toLowerCase();
  const summary = opportunity.summary.toLowerCase();

  if (softwareRoleTerms.some((term) => title.includes(term))) return true;

  // Generic graduate / early-career titles are only accepted when the description
  // clearly places the role inside software or engineering.
  if (/(early careers?|graduate|intern(ship)?)/i.test(opportunity.title)) {
    return softwareRoleTerms.some((term) => summary.includes(term));
  }

  return false;
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
  const softwareIntent = hasSoftwareIntent(query);
  const relevant = softwareIntent ? unique.filter(isSoftwareOpportunity) : unique;
  const ranked = rankByQuery(relevant, query).slice(0, 40);

  const filterNote = softwareIntent
    ? ` Filtered ${unique.length} imported vacancies down to ${relevant.length} software-relevant roles before scoring.`
    : "";

  return {
    opportunities: ranked,
    sourceMode: "live-greenhouse",
    note: `Imported live vacancies from configured Greenhouse boards.${filterNote}`,
  };
}
