import type { Opportunity } from "@/lib/types";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  location?: { name?: string };
  content?: string;
};

type GreenhouseResponse = {
  jobs?: GreenhouseJob[];
};

const skillCatalog = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "SQL",
  "REST APIs",
  "GraphQL",
  "Docker",
  "AWS",
  "Azure",
  "Git",
  "CSS",
  "HTML",
  "Testing",
  "Playwright",
  "Vitest",
  "Python",
  "C#",
  ".NET",
  "Java",
  "Kubernetes",
  "Terraform",
  "Go",
];

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function includesSkill(text: string, skill: string) {
  const haystack = text.toLowerCase();
  const aliases: Record<string, string[]> = {
    "REST APIs": ["rest api", "restful"],
    "Node.js": ["node.js", "nodejs"],
    "Next.js": ["next.js", "nextjs"],
    ".NET": [".net", "dotnet"],
    "C#": ["c#", "c sharp"],
  };

  return (aliases[skill] ?? [skill.toLowerCase()]).some((term) => haystack.includes(term));
}

function inferSkills(text: string) {
  return skillCatalog.filter((skill) => includesSkill(text, skill));
}

function inferExperience(text: string) {
  const matches = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 20);

  return matches.length ? Math.min(...matches) : 0;
}

function inferWorkMode(location: string, text: string): Opportunity["workMode"] {
  const combined = `${location} ${text}`.toLowerCase();
  if (combined.includes("remote")) return "Remote";
  if (combined.includes("hybrid")) return "Hybrid";
  return "On-site";
}

function inferQualification(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("bachelor") || lower.includes("degree")) {
    return "Bachelor's degree or equivalent experience";
  }
  return undefined;
}

function companyLabel(boardToken: string) {
  return boardToken
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function fetchGreenhouseBoard(boardToken: string): Promise<Opportunity[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Greenhouse board ${boardToken} returned ${response.status}`);
  }

  const data = (await response.json()) as GreenhouseResponse;
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  return jobs.map((job) => {
    const location = job.location?.name?.trim() || "Location not specified";
    const content = stripHtml(job.content ?? "");
    const skills = inferSkills(`${job.title} ${content}`);

    return {
      id: `greenhouse-${boardToken}-${job.id}`,
      title: job.title,
      company: companyLabel(boardToken),
      location,
      workMode: inferWorkMode(location, content),
      minYearsExperience: inferExperience(content),
      requiredSkills: skills.slice(0, 6),
      preferredSkills: skills.slice(6, 10),
      qualificationRequired: inferQualification(content),
      summary: content.slice(0, 280) || "Imported from a public Greenhouse job board.",
      source: "Greenhouse",
      sourceUrl: job.absolute_url,
      postedAt: job.updated_at,
    } satisfies Opportunity;
  });
}
