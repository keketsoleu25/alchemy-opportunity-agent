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

function appearsSouthAfrican(value: string) {
  return /south africa|gauteng|cape town|johannesburg|pretoria|durban|western cape|kwazulu|sandton|midrand|centurion/i.test(
    value,
  );
}

function locationFit(profile: CandidateProfile, opportunity: Opportunity) {
  const candidateLocation = profile.location.toLowerCase();
  const opportunityLocation = opportunity.location.toLowerCase();
  const candidateCity = candidateLocation.split(",")[0].trim();
  const sameCity = candidateCity.length > 2 && opportunityLocation.includes(candidateCity);
  const candidateGroup = locationGroup(profile.location);
  const opportunityGroup = locationGroup(opportunity.location);
  const sameRegion = Boolean(candidateGroup && opportunityGroup && candidateGroup === opportunityGroup);
  const inSouthAfrica = appearsSouthAfrican(opportunity.location);

  if (opportunity.workMode === "Remote") {
    return {
      score: profile.remotePreferred ? 1 : 0.9,
      strength: profile.remotePreferred
        ? "Remote work matches your stated preference"
        : "Remote work keeps location flexible",
      hardConflict: false,
    };
  }

  if (opportunity.workMode === "Hybrid" && !profile.hybridAccepted) {
    return {
      score: 0.2,
      gap: "Hybrid work conflicts with your stated work-mode preference",
      hardConflict: true,
    };
  }

  if (opportunity.workMode === "On-site" && !profile.onSiteAccepted) {
    return {
      score: 0.1,
      gap: "On-site work conflicts with your stated work-mode preference",
      hardConflict: true,
    };
  }

  if (sameCity) {
    return {
      score: 1,
      strength: `${opportunity.workMode} role is in your current city`,
      hardConflict: false,
    };
  }

  if (sameRegion) {
    return {
      score: opportunity.workMode === "Hybrid" ? 0.9 : 0.82,
      strength: `${opportunity.workMode} role is within your broader region`,
      hardConflict: false,
    };
  }

  if (inSouthAfrica) {
    if (profile.willingToRelocate) {
      return {
        score: opportunity.workMode === "Hybrid" ? 0.78 : 0.7,
        strength: `You indicated willingness to relocate for a suitable ${opportunity.workMode.toLowerCase()} role`,
        hardConflict: false,
      };
    }

    return {
      score: opportunity.workMode === "Hybrid" ? 0.5 : 0.3,
      gap:
        opportunity.workMode === "Hybrid"
          ? "Hybrid role is in another South African region and you have not indicated willingness to relocate"
          : "On-site role is in another South African region and you have not indicated willingness to relocate",
      hardConflict: opportunity.workMode === "On-site",
    };
  }

  return {
    score: opportunity.workMode === "Hybrid" ? 0.4 : 0.2,
    gap: `${opportunity.workMode} location is outside your current region`,
    hardConflict: opportunity.workMode === "On-site" && !profile.willingToRelocate,
  };
}

function qualificationFit(profile: CandidateProfile, opportunity: Opportunity) {
  if (!opportunity.qualificationRequired) {
    return { score: 1, strength: undefined as string | undefined, gap: undefined as string | undefined };
  }

  const requirement = normalise(opportunity.qualificationRequired);
  const qualifications = profile.qualifications.map(normalise);
  const asksForDegree = /bachelor|degree|bsc|b\.sc/.test(requirement);
  const hasDegree = qualifications.some((item) => /bachelor|degree|bsc|b\.sc/.test(item));
  const mentionsEquivalent = requirement.includes("equivalent experience");
  const hasEquivalentEvidence = profile.yearsExperience >= 2 || qualifications.some((item) => item.includes("software"));

  if ((asksForDegree && hasDegree) || (mentionsEquivalent && hasEquivalentEvidence)) {
    return {
      score: 1,
      strength: `Qualification profile reasonably aligns with: ${opportunity.qualificationRequired}`,
      gap: undefined,
    };
  }

  return {
    score: 0.35,
    strength: undefined,
    gap: `Qualification requirement may not be met: ${opportunity.qualificationRequired}`,
  };
}

type RoleFamily =
  | "frontend"
  | "backend"
  | "fullstack"
  | "software"
  | "mobile"
  | "qa"
  | "data"
  | "platform"
  | "devops";

function roleFamilies(value: string) {
  const text = normalise(value);
  const families = new Set<RoleFamily>();

  if (/front[ -]?end/.test(text)) families.add("frontend");
  if (/back[ -]?end/.test(text)) families.add("backend");
  if (/full[ -]?stack/.test(text)) families.add("fullstack");
  if (/software (developer|engineer)|application developer|web developer/.test(text)) families.add("software");
  if (/mobile|android|ios/.test(text)) families.add("mobile");
  if (/qa|quality|test automation|tester/.test(text)) families.add("qa");
  if (/data engineer|data developer/.test(text)) families.add("data");
  if (/platform|cloud engineer/.test(text)) families.add("platform");
  if (/devops|site reliability|sre/.test(text)) families.add("devops");

  // Frontend/backend/full-stack titles are software-development roles even when
  // the literal word "software" is absent.
  if (families.has("frontend") || families.has("backend") || families.has("fullstack")) {
    families.add("software");
  }

  return families;
}

function preferredRoleFit(profile: CandidateProfile, opportunity: Opportunity) {
  const targetFamilies = new Set<RoleFamily>();
  profile.preferredRoles.forEach((role) => {
    roleFamilies(role).forEach((family) => targetFamilies.add(family));
  });

  if (!targetFamilies.size) {
    return {
      score: 0.8,
      strength: undefined as string | undefined,
      gap: undefined as string | undefined,
    };
  }

  const opportunityFamilies = roleFamilies(opportunity.title);
  const exactMatches = [...opportunityFamilies].filter((family) => targetFamilies.has(family));

  if (exactMatches.some((family) => family !== "software")) {
    return {
      score: 1,
      strength: "Role family directly matches one of your stated target roles",
      gap: undefined,
    };
  }

  if (exactMatches.includes("software")) {
    return {
      score: 0.9,
      strength: "Role is within your broader software-development target family",
      gap: undefined,
    };
  }

  const adjacentFamilies: RoleFamily[] = ["qa", "data", "platform", "devops", "mobile"];
  const isAdjacent = [...opportunityFamilies].some((family) => adjacentFamilies.includes(family));

  if (isAdjacent) {
    return {
      score: 0.42,
      strength: undefined,
      gap: "Role family is adjacent to, but outside, your stated target roles",
    };
  }

  return {
    score: 0.58,
    strength: undefined,
    gap: "Role title does not closely match your stated target roles",
  };
}

function authorizationFit(profile: CandidateProfile, opportunity: Opportunity) {
  if (!appearsSouthAfrican(opportunity.location)) {
    return { score: 0.75, strength: undefined as string | undefined, gap: undefined as string | undefined };
  }

  const authorized = profile.workAuthorizedCountries.some((country) =>
    normalise(country).includes("south africa"),
  );

  return authorized
    ? { score: 1, strength: "You indicated work authorization for South Africa", gap: undefined }
    : {
        score: 0.15,
        strength: undefined,
        gap: "South African work authorization is not confirmed in your profile",
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
  const qualification = qualificationFit(profile, opportunity);
  const roleFit = preferredRoleFit(profile, opportunity);
  const authorization = authorizationFit(profile, opportunity);

  const score = Math.round(
    (requiredRatio * 0.4 +
      preferredRatio * 0.09 +
      experienceScore * 0.16 +
      location.score * 0.12 +
      qualification.score * 0.08 +
      roleFit.score * 0.1 +
      authorization.score * 0.05) *
      100,
  );

  let decision: MatchResult["decision"] = "SKIP";
  if (score >= 75 && missingRequired.length <= 1 && experienceGap <= 1) decision = "APPLY";
  else if (score >= 55 && experienceGap <= 2) decision = "STRETCH";

  if (location.hardConflict && decision === "APPLY") decision = "STRETCH";
  if (authorization.score < 0.5) decision = "SKIP";
  if (roleFit.score < 0.5 && decision === "APPLY") decision = "STRETCH";

  const strengths = [
    ...matchedRequired.map((skill) => `Matches required skill: ${skill}`),
    ...matchedPreferred.map((skill) => `Matches preferred skill: ${skill}`),
  ];

  if (experienceGap === 0) strengths.push("Meets the stated experience requirement");
  if (location.strength) strengths.push(location.strength);
  if (qualification.strength) strengths.push(qualification.strength);
  if (roleFit.strength) strengths.push(roleFit.strength);
  if (authorization.strength) strengths.push(authorization.strength);

  const gaps = [...missingRequired.map((skill) => `Missing required skill: ${skill}`)];
  if (experienceGap > 0) gaps.push(`Experience gap: role asks for ${opportunity.minYearsExperience}+ years`);
  if (location.gap) gaps.push(location.gap);
  if (qualification.gap) gaps.push(qualification.gap);
  if (roleFit.gap) gaps.push(roleFit.gap);
  if (authorization.gap) gaps.push(authorization.gap);

  const reasoning =
    decision === "APPLY"
      ? "The candidate covers most core requirements and the role family, eligibility, location, and work-mode constraints are realistic for an application."
      : decision === "STRETCH"
        ? "There is meaningful alignment, but the application should directly address the identified skill, role-family, experience, qualification, or mobility gaps."
        : "The current eligibility or fit gaps are too large, so effort is better spent on a closer opportunity.";

  const nextAction =
    decision === "APPLY"
      ? "Tailor the CV to the matched requirements and prepare a focused application."
      : decision === "STRETCH"
        ? "Apply only if you can address the listed gaps and the role direction and work arrangement are genuinely workable."
        : "Skip this role for now and prioritise opportunities that fit your skills, target role family, eligibility, and mobility constraints.";

  return { opportunity, score, decision, strengths, gaps, reasoning, nextAction };
}
