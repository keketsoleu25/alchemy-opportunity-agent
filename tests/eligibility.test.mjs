import assert from "node:assert/strict";
import test from "node:test";
import { inferExperience, inferWorkMode } from "../lib/sources/greenhouse.ts";
import { analyseOpportunity } from "../lib/scoring.ts";
import { isCompatibleWithJuniorIntent } from "../lib/junior-eligibility.ts";
import { demoOpportunities, demoProfile } from "../lib/data.ts";

const profile = {
  name: "Candidate",
  location: "Johannesburg, South Africa",
  yearsExperience: 1,
  skills: ["TypeScript", "React", "Git"],
  qualifications: ["Software development training"],
  preferredRoles: ["Full-Stack Developer"],
  remotePreferred: true,
  hybridAccepted: true,
  onSiteAccepted: true,
  willingToRelocate: false,
  workAuthorizedCountries: ["South Africa"],
};

function opportunity(overrides = {}) {
  return {
    id: "example",
    title: "Full-Stack Developer",
    company: "Example",
    location: "Johannesburg, South Africa",
    workMode: "Hybrid",
    minYearsExperience: 1,
    requiredSkills: ["TypeScript", "React"],
    preferredSkills: ["Git"],
    summary: "Build web applications.",
    ...overrides,
  };
}

test("benefits copy cannot turn a Cape Town vacancy into a remote role", () => {
  assert.equal(inferWorkMode("Cape Town", "Python Software Engineer"), "Unspecified");
  assert.equal(inferWorkMode("Cape Town (Remote)", "Python Software Engineer"), "Remote");
});

test("multiple experience requirements use the stricter explicit bar", () => {
  assert.equal(inferExperience("1+ years of Java; 5+ years of software development experience"), 5);
});

test("generic title with explicit mid/senior opening is excluded from junior discovery", () => {
  assert.equal(isCompatibleWithJuniorIntent(opportunity({
    title: "Python Software Engineer",
    summary: "We are looking for a Mid-level and Senior Software Engineer.",
  })), false);
});

test("a Seattle role is skipped when work authorization is unconfirmed", () => {
  const result = analyseOpportunity(profile, opportunity({
    location: "Seattle, Washington",
    workMode: "Unspecified",
  }));
  assert.equal(result.decision, "SKIP");
  assert.match(result.gaps.join(" "), /work authorization/i);
});

test("unstated work mode remains a gap for a local role", () => {
  const result = analyseOpportunity(profile, opportunity({ workMode: "Unspecified" }));
  assert.match(result.gaps.join(" "), /work arrangement is not stated/i);
});

test("guided example shows apply, stretch and skip decisions", () => {
  assert.deepEqual(demoOpportunities.map((item) => analyseOpportunity(demoProfile, item).decision), [
    "APPLY", "STRETCH", "SKIP",
  ]);
});

test("inferred listing skills are labelled as signals, not stated requirements", () => {
  const result = analyseOpportunity(profile, opportunity({
    skillEvidence: "inferred",
    requiredSkills: ["TypeScript", "Python"],
    experienceRequirementKnown: false,
  }));
  assert.match(result.strengths.join(" "), /Detected skill match: TypeScript/);
  assert.match(result.gaps.join(" "), /Detected skill to verify: Python/);
  assert.doesNotMatch(result.strengths.join(" "), /meets the stated experience/i);
  assert.ok(result.whatIf?.score > result.score);
});

test("an incomplete degree is not counted as a completed degree", () => {
  const result = analyseOpportunity({ ...profile, qualifications: ["BSc incomplete"] }, opportunity({
    qualificationRequired: "Bachelor's degree",
  }));
  assert.match(result.gaps.join(" "), /Qualification requirement may not be met/);
});
