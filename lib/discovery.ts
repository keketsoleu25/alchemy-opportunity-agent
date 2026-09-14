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

const seniorTitleTerms = [
  "senior",
  "sr ",
  "sr.",
  "lead",
  "team lead",
  "principal",
  "staff",
  "manager",
  "head of",
  "director",
  "architect",
  "vp ",
  "vice president",
];

const midLevelTitleTerms = [
  "intermediate",
  "mid-level",
  "mid level",
  "midlevel",
  "level ii",
  "level 2",
];

const juniorPreferredTitleTerms = [
  "junior",
  "graduate",
  "entry level",
  "entry-level",
  "associate",
  "intern",
  "internship",
  "early career",
  "early-career",
  "trainee",
  "apprentice",
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

function hasJuniorIntent(query: string) {
  const lower = query.toLowerCase();
  return ["junior", "entry level", "entry-level", "graduate", "intern", "internship", "early career", "early-career"].some(
    (term) => lower.includes(term),
  );
}

function isSoftwareOpportunity(opportunity: Opportunity) {
  const title = opportunity.title.toLowerCase();
  const summary = opportunity.summary.toLowerCase();

  if (softwareRoleTerms.some((term) => title.includes(term))) return true;

  if (/(early careers?|graduate|intern(ship)?)/i.test(opportunity.title)) {
    return softwareRoleTerms.some((term) => summary.includes(term));
  }

  return false;
}

function isCompatibleWithJuniorIntent(opportunity: Opportunity) {
  const title = opportunity.title.toLowerCase();

  if (seniorTitleTerms.some((term) => title.includes(term))) return false;
  if (midLevelTitleTerms.some((term) => title.includes(term))) return false;

  // Neutral software titles can still be genuinely entry-level, but a role that
  // explicitly asks for 4+ years is not a realistic junior target.
  return opportunity.minYearsExperience <= 3;
}

function rankByQuery(opportunities: Opportunity[], query: string, juniorIntent: boolean) {
  const terms = queryTerms(query);

  return opportunities
    .map((opportunity) => {
      const title = opportunity.title.toLowerCase();
      const text = `${opportunity.title} ${opportunity.summary} ${opportunity.location}`.toLowerCase();
      const hits = terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
      const juniorBonus =
        juniorIntent && juniorPreferredTitleTerms.some((term) => title.includes(term)) ? 4 : 0;
      const lowExperienceBonus = juniorIntent && opportunity.minYearsExperience <= 1 ? 2 : 0;

      return {
        opportunity,
        rankScore: hits + juniorBonus + lowExperienceBonus,
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
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
  const juniorIntent = hasJuniorIntent(query);

  const softwareRelevant = softwareIntent ? unique.filter(isSoftwareOpportunity) : unique;
  const seniorityRelevant = juniorIntent
    ? softwareRelevant.filter(isCompatibleWithJuniorIntent)
    : softwareRelevant;

  const ranked = rankByQuery(seniorityRelevant, query, juniorIntent).slice(0, 40);

  const notes: string[] = [];
  if (softwareIntent) {
    notes.push(
      `Filtered ${unique.length} imported vacancies down to ${softwareRelevant.length} software-relevant roles before scoring.`,
    );
  }
  if (juniorIntent) {
    notes.push(
      `Removed senior, lead, manager, intermediate, and high-experience titles, leaving ${seniorityRelevant.length} junior-compatible roles.`,
    );
    notes.push("Junior/graduate/associate titles and roles requiring 0-1 years are prioritised.");
  }

  return {
    opportunities: ranked,
    sourceMode: "live-greenhouse",
    note: `Imported live vacancies from configured Greenhouse boards.${notes.length ? ` ${notes.join(" ")}` : ""}`,
  };
}
