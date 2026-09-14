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
  workMode: "Remote" | "Hybrid" | "On-site";
  minYearsExperience: number;
  requiredSkills: string[];
  preferredSkills: string[];
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
};
