import type { Opportunity } from "./types";

const seniorTitleTerms = [
  "senior", "sr ", "sr.", "lead", "team lead", "principal", "staff",
  "manager", "head of", "director", "architect", "vp ", "vice president",
];

const midLevelTitleTerms = [
  "intermediate", "mid-level", "mid level", "midlevel", "level ii", "level 2",
];

export function isCompatibleWithJuniorIntent(opportunity: Opportunity) {
  const title = opportunity.title.toLowerCase();
  const opening = opportunity.summary.toLowerCase();

  if (seniorTitleTerms.some((term) => title.includes(term))) return false;
  if (midLevelTitleTerms.some((term) => title.includes(term))) return false;
  if (/\b(?:looking for|hiring|seeking|as a)\s+(?:an?\s+)?(?:mid[ -]?level|senior)\b/.test(opening)) return false;

  return opportunity.minYearsExperience <= 3;
}
