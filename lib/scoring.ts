import { CandidateProfile, MatchResult, Opportunity } from "./types";

const normalise = (value: string) => value.trim().toLowerCase();

const saLocationGroups: Record<string, string[]> = {
  gauteng: [
    "johannesburg",
    "joburg",
    "sandton",
    "randburg",
    "midrand",
    "roodepoort",
    "randfontein",
    "pretoria",
    "centurion",
    "kempton park",
    "boksburg",
    "germiston",
    "gauteng",
  ],
  westernCape: ["cape town", "stellenbosch", "bellville", "western cape"],
  kwazuluNatal: ["durban", "umhlanga", "pinetown", "kwazulu-natal", "kwazulu natal", "kzn"],
};

function locationGroup(value: string) {
  const lower = value.toLowerCase();

  for (const [group, terms] of Object.entries(saLocationGroups)) {
    if (terms.some((term) => lower.includes(term))) return group;
  }

  return undefined;
}

function locationFit(profile: CandidateProfile, opportunity: Opportunity) {
  const candidateLocation = profile.location.toLowerCase();
  const opportunityLocation = opportunity.location.toLowerCase();
  const candidateCity = candidateLocation.split(",")[0].trim();
  const sameCity = candidateCity.length > 2 && opportunityLocation.includes(candidateCity);
  const candidateGroup = locationGroup(profile.location);
  const opportunityGroup = locationGroup(opportunity.location);
  const sameRegion = Boolean(candidateGroup && opportunityGroup && candidateGroup === opportunityGroup);
  const appearsSouthAfrican = /south africa|gauteng|cape town|johannesburg|pretoria|durban|western cape|kwazulu/i.test(
    opportunity.location,
  );

  if (opportunity.workMode === "Remote") {
    return {
      score: profile.remotePreferred ? 1 : 0.9,
      strength: profile.remotePreferred
        ? "Remote work matches your stated preference"
        : "Remote work keeps location flexible",
    };
  }

  if (sameCity) {
    return {
      score: 1,
      strength: `${opportunity.workMode} role is in your current city`,
    };
  }

  if (sameRegion) {
    return {
      score: opportunity.workMode === "Hybrid" ? 0.9 : 0.82,
      strength: `${opportunity.workMode} role is within your broader region`,
    };
  }

  if (appearsSouthAfrican) {
    if (opportunity.workMode === "Hybrid") {
      return {
        score: 0.58,
        gap: "Hybrid role is in another South African region and may require relocation or regular travel",
      };
    }

    return {
      score: 0.35,
      gap: "On-site role is in another South African region and likely requires relocation",
    };
  }

  return {
    score: opportunity.workMode === "Hybrid" ? 0.45 : 0.25,
    gap: `${opportunity.workMode} location is outside your current region`,
  };
}

export function analyseOpportunity(
  profile: CandidateProfile,
  opportunity: Opportunity,
): MatchResult {
  const candidateSkills = new Set(profile.skills.map(normalise));
  const matchedRequired = opportunity.requiredSkills.filter((skill) =>
    candidateSkills.has(normalise(skill)),
  );
  const missingRequired = opportunity.requiredSkills.filter(
    (skill) => !candidateSkills.has(normalise(skill)),
  );
  const matchedPreferred = opportunity.preferredSkills.filter((skill) =>
    candidateSkills.has(normalise(skill)),
  );

  const requiredRatio = opportunity.requiredSkills.length
    ? matchedRequired.length / opportunity.requiredSkills.length
    : 1;
  const preferredRatio = opportunity.preferredSkills.length
    ? matchedPreferred.length / opportunity.preferredSkills.length
    : 1;

  const experienceGap = Math.max(0, opportunity.minYearsExperience - profile.yearsExperience);
  const experienceScore = experienceGap === 0 ? 1 : experienceGap === 1 ? 0.65 : 0.15;
  const location = locationFit(profile, opportunity);

  const score = Math.round(
    (requiredRatio * 0.5 + preferredRatio * 0.15 + experienceScore * 0.2 + location.score * 0.15) *
      100,
  );

  let decision: MatchResult["decision"] = "SKIP";
  if (score >= 75 && missingRequired.length <= 1 && experienceGap <= 1) decision = "APPLY";
  else if (score >= 55 && experienceGap <= 2) decision = "STRETCH";

  // A distant on-site role should not be presented as an easy APPLY even if the
  // technical match is otherwise strong. It remains a possible stretch if relocation is realistic.
  if (opportunity.workMode === "On-site" && location.score < 0.5 && decision === "APPLY") {
    decision = "STRETCH";
  }

  const strengths = [
    ...matchedRequired.map((skill) => `Matches required skill: ${skill}`),
    ...matchedPreferred.map((skill) => `Matches preferred skill: ${skill}`),
  ];

  if (experienceGap === 0) strengths.push("Meets the stated experience requirement");
  if (location.strength) strengths.push(location.strength);

  const gaps = [...missingRequired.map((skill) => `Missing required skill: ${skill}`)];
  if (experienceGap > 0) {
    gaps.push(`Experience gap: role asks for ${opportunity.minYearsExperience}+ years`);
  }
  if (location.gap) gaps.push(location.gap);

  const reasoning =
    decision === "APPLY"
      ? "The candidate covers most core requirements and the location/work-mode fit is realistic for an application."
      : decision === "STRETCH"
        ? "There is meaningful alignment, but the application should directly address the identified skill, experience, or location gaps."
        : "The current gaps are too large relative to the role requirements, so effort is better spent elsewhere.";

  const nextAction =
    decision === "APPLY"
      ? "Tailor the CV to the matched requirements and prepare a focused application."
      : decision === "STRETCH"
        ? "Apply only if you can show adjacent evidence for the missing requirements and the location is workable; otherwise prioritise stronger matches."
        : "Skip this role for now and target opportunities closer to your current level and location constraints.";

  return { opportunity, score, decision, strengths, gaps, reasoning, nextAction };
}
