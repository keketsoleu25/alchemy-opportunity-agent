export type Decision = "APPLY" | "STRETCH" | "SKIP";

export type CandidateProfile = {
  name: string;
  location: string;
  yearsExperience: number;
  skills: string[];
  qualifications: string[];
  preferredRoles: string[];
  remotePreferred: boolean;
  hybridAccepted: boolean;
  onSiteAccepted: boolean;
  willingToRelocate: boolean;
  workAuthorizedCountries: string[];
};

export type Opportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site" | "Unspecified";
  minYearsExperience: number;
  experienceRequirementKnown?: boolean;
  requiredSkills: string[];
  preferredSkills: string[];
  skillEvidence?: "explicit" | "inferred";
  qualificationRequired?: string;
  summary: string;
  source?: string;
  sourceUrl?: string;
  postedAt?: string;
};

export type MatchResult = {
  opportunity: Opportunity;
  score: number;
  decision: Decision;
  strengths: string[];
  gaps: string[];
  reasoning: string;
  nextAction: string;
  applicationBrief: string[];
  whatIf?: { skill: string; score: number; decision: Decision };
};
