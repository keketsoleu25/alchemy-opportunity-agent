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

const coreSoftwareTitleTerms = [
  "software engineer",
  "software developer",
  "developer",
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
  "platform engineer",
  "cloud engineer",
  "qa engineer",
  "quality engineer",
  "test automation",
  "data engineer",
  "graduate developer",
  "graduate engineer",
];

const adjacentTechnicalTitleTerms = [
  "technical services",
  "technical support",
  "support engineer",
  "solutions engineer",
  "solution engineer",
  "solutions architect",
  "sales engineer",
  "customer engineer",
  "implementation engineer",
  "integration engineer",
  "professional services",
  "technical consultant",
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

type RoleFamily = "core-software" | "adjacent-technical" | "other";

function classifyRoleFamily(opportunity: Opportunity): RoleFamily {
  const title = opportunity.title.toLowerCase();
  const summary = opportunity.summary.toLowerCase();

  if (adjacentTechnicalTitleTerms.some((term) => title.includes(term))) {
    return "adjacent-technical";
  }

  if (coreSoftwareTitleTerms.some((term) => title.includes(term))) {
    return "core-software";
  }

  // Generic engineer titles are only treated as core when their description
  // clearly points to software development rather than services/support work.
  if (title.includes("engineer")) {
    const softwareSignals = [
      "software development",
      "application development",
      "web application",
      "frontend",
      "backend",
      "full stack",
      "full-stack",
      "codebase",
      "coding",
      "programming",
    ];
    if (softwareSignals.some((term) => summary.includes(term))) return "core-software";
  }

  if (/(early careers?|graduate|intern(ship)?)/i.test(opportunity.title)) {
    const softwareSignals = ["software", "developer", "engineering", "programming", "coding"];
    if (softwareSignals.some((term) => summary.includes(term))) return "core-software";
  }

  return "other";
}

function isCompatibleWithJuniorIntent(opportunity: Opportunity) {
  const title = opportunity.title.toLowerCase();

  if (seniorTitleTerms.some((term) => title.includes(term))) return false;
  if (midLevelTitleTerms.some((term) => title.includes(term))) return false;

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

  let roleRelevant = unique;
  let coreCount = 0;
  let adjacentCount = 0;

  if (softwareIntent) {
    const core = unique.filter((opportunity) => classifyRoleFamily(opportunity) === "core-software");
    const adjacent = unique.filter((opportunity) => classifyRoleFamily(opportunity) === "adjacent-technical");
    coreCount = core.length;
    adjacentCount = adjacent.length;

    // Keep the main feed development-focused. Adjacent technical roles are only
    // used as fallback inventory when the core software pool is too small.
    roleRelevant = core.length >= 8 ? core : [...core, ...adjacent];
  }

  const seniorityRelevant = juniorIntent
    ? roleRelevant.filter(isCompatibleWithJuniorIntent)
    : roleRelevant;

  const ranked = rankByQuery(seniorityRelevant, query, juniorIntent).slice(0, 40);

  const notes: string[] = [];
  if (softwareIntent) {
    notes.push(
      `Classified ${unique.length} imported vacancies into ${coreCount} core software roles and ${adjacentCount} adjacent technical roles.`,
    );
    if (coreCount >= 8) {
      notes.push("Main results are restricted to core software-development roles; adjacent technical roles are held back.");
    } else {
      notes.push("Adjacent technical roles were retained only because the core software pool was small.");
    }
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
