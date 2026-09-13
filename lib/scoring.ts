import { CandidateProfile, MatchResult, Opportunity } from "./types";

const normalise = (value: string) => value.trim().toLowerCase();

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

  const locationScore =
    opportunity.workMode === "Remote" ||
    opportunity.location.toLowerCase().includes(profile.location.split(",")[0].toLowerCase())
      ? 1
      : opportunity.workMode === "Hybrid"
        ? 0.75
        : 0.55;

  const score = Math.round(
    (requiredRatio * 0.55 + preferredRatio * 0.15 + experienceScore * 0.2 + locationScore * 0.1) *
      100,
  );

  let decision: MatchResult["decision"] = "SKIP";
  if (score >= 75 && missingRequired.length <= 1 && experienceGap <= 1) decision = "APPLY";
  else if (score >= 55 && experienceGap <= 2) decision = "STRETCH";

  const strengths = [
    ...matchedRequired.map((skill) => `Matches required skill: ${skill}`),
    ...matchedPreferred.map((skill) => `Matches preferred skill: ${skill}`),
  ];

  if (experienceGap === 0) strengths.push("Meets the stated experience requirement");
  if (opportunity.workMode === "Remote" && profile.remotePreferred) {
    strengths.push("Work mode matches remote preference");
  }

  const gaps = [...missingRequired.map((skill) => `Missing required skill: ${skill}`)];
  if (experienceGap > 0) {
    gaps.push(`Experience gap: role asks for ${opportunity.minYearsExperience}+ years`);
  }

  const reasoning =
    decision === "APPLY"
      ? "The candidate covers most core requirements and the remaining gaps are realistic for an application."
      : decision === "STRETCH"
        ? "There is meaningful alignment, but the application should directly address the identified gaps."
        : "The current gaps are too large relative to the role requirements, so effort is better spent elsewhere.";

  const nextAction =
    decision === "APPLY"
      ? "Tailor the CV to the matched requirements and prepare a focused application."
      : decision === "STRETCH"
        ? "Apply only if you can show adjacent evidence for the missing requirements; otherwise prioritise stronger matches."
        : "Skip this role for now and target opportunities closer to your current level.";

  return { opportunity, score, decision, strengths, gaps, reasoning, nextAction };
}
