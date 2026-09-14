"use client";

import { useState } from "react";
import type { CandidateProfile, MatchResult } from "@/lib/types";

type ApiResponse = {
  profile: CandidateProfile;
  results: MatchResult[];
  mode: string;
  sourceMode?: string;
  note?: string;
  model?: string;
};

const initialProfile: CandidateProfile = {
  name: "Demo Candidate",
  location: "Johannesburg, South Africa",
  yearsExperience: 1,
  skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "REST APIs", "Docker", "Git"],
  qualifications: ["Software development training", "Matric"],
  preferredRoles: ["Junior Software Developer", "Frontend Developer", "Full-Stack Developer"],
  remotePreferred: true,
  hybridAccepted: true,
  onSiteAccepted: true,
  willingToRelocate: false,
  workAuthorizedCountries: ["South Africa"],
};

function isPrimaryTarget(result: MatchResult) {
  return result.strengths.some((item) =>
    item.toLowerCase().includes("role family directly matches"),
  );
}

function rankingSignals(result: MatchResult) {
  const signals: string[] = [];
  const strengths = result.strengths.join(" ").toLowerCase();
  const gaps = result.gaps.join(" ").toLowerCase();

  if (strengths.includes("role family directly matches")) signals.push("Target role match");
  else if (gaps.includes("adjacent to your stated target")) signals.push("Adjacent role");

  const skillMatches = result.strengths.filter((item) =>
    item.toLowerCase().includes("matches required skill"),
  ).length;
  if (skillMatches >= 3) signals.push("Strong skills match");
  else if (skillMatches >= 1) signals.push("Some skills match");

  if (strengths.includes("remote work matches")) signals.push("Remote fit");
  else if (strengths.includes("current city") || strengths.includes("broader region")) {
    signals.push("Location fit");
  }

  if (strengths.includes("meets the stated experience requirement")) signals.push("Experience fit");
  else if (gaps.includes("experience gap")) signals.push("Experience stretch");

  if (gaps.includes("location") || gaps.includes("relocat") || gaps.includes("work-mode")) {
    signals.push("Mobility constraint");
  }

  return signals.slice(0, 3);
}

function ResultCard({ result }: { result: MatchResult }) {
  const signals = rankingSignals(result);

  return (
    <article className="jobCard">
      <div className="jobTop">
        <div>
          <h3>{result.opportunity.title}</h3>
          <p>
            {result.opportunity.company} · {result.opportunity.workMode}
            {result.opportunity.source ? ` · ${result.opportunity.source}` : ""}
          </p>
        </div>
        <div className={`decision ${result.decision.toLowerCase()}`}>{result.decision}</div>
      </div>

      {signals.length ? (
        <div className="rankSignals" aria-label="Why ranked here">
          <span className="rankLabel">Why ranked here</span>
          {signals.map((signal) => (
            <span className="rankChip" key={signal}>{signal}</span>
          ))}
        </div>
      ) : null}

      <div className="scoreRow">
        <strong>{result.score}% match</strong>
        <div className="scoreTrack"><div style={{ width: `${result.score}%` }} /></div>
      </div>
      <p className="reasoning">{result.reasoning}</p>
      <div className="columns">
        <div>
          <h4>Evidence</h4>
          {result.strengths.slice(0, 4).map((item) => <span className="good" key={item}>✓ {item}</span>)}
        </div>
        <div>
          <h4>Gaps</h4>
          {(result.gaps.length ? result.gaps : ["No material gaps found"]).slice(0, 4).map((item) => <span className="gap" key={item}>• {item}</span>)}
        </div>
      </div>
      <div className="next">
        <b>Next action:</b> {result.nextAction}
        {result.opportunity.sourceUrl ? (
          <>
            {" "}
            <a href={result.opportunity.sourceUrl} target="_blank" rel="noreferrer">View vacancy ↗</a>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default function Home() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("ready");
  const [sourceMode, setSourceMode] = useState("demo-fallback");
  const [note, setNote] = useState("Ready to analyse your profile.");
  const [message, setMessage] = useState(
    "Find realistic junior software opportunities that match my profile.",
  );
  const [profile, setProfile] = useState(initialProfile);
  const [skillsText, setSkillsText] = useState(initialProfile.skills.join(", "));
  const [qualificationsText, setQualificationsText] = useState(initialProfile.qualifications.join(", "));
  const [preferredRolesText, setPreferredRolesText] = useState(initialProfile.preferredRoles.join(", "));
  const [authorizationText, setAuthorizationText] = useState(
    initialProfile.workAuthorizedCountries.join(", "),
  );

  function updateProfile<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function parseList(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function runAgent() {
    setLoading(true);
    setNote("Discovering and analysing opportunities…");

    try {
      const candidate: CandidateProfile = {
        ...profile,
        skills: parseList(skillsText),
        qualifications: parseList(qualificationsText),
        preferredRoles: parseList(preferredRolesText),
        workAuthorizedCountries: parseList(authorizationText),
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: candidate, query: message }),
      });

      if (!response.ok) throw new Error(`Analysis failed with status ${response.status}`);

      const data: ApiResponse = await response.json();
      setResults(data.results);
      setMode(data.mode);
      setSourceMode(data.sourceMode ?? "demo-fallback");
      setNote(data.note ?? "Analysis complete.");
    } catch (error) {
      console.error(error);
      setMode("error");
      setNote("Analysis request failed. Check the local server and try again.");
    } finally {
      setLoading(false);
    }
  }

  const statusLabel =
    mode === "aws-bedrock"
      ? "AWS Bedrock reasoning active"
      : mode === "deterministic-fallback"
        ? "Deterministic fallback active"
        : mode === "error"
          ? "Agent needs attention"
          : "Agent demo online";

  const recommendedResults = results.filter((result) => result.decision !== "SKIP");
  const primaryTargets = recommendedResults.filter(isPrimaryTarget);
  const adjacentOpportunities = recommendedResults.filter((result) => !isPrimaryTarget(result));
  const notRecommended = results.filter((result) => result.decision === "SKIP");

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">A</div>
          <div>
            <strong>Alchemy Opportunity Agent</strong>
            <span>Amazon Developer Hackathon 2026</span>
          </div>
        </div>
        <div className="status"><span /> {statusLabel}</div>
      </header>

      <section className="hero">
        <div className="eyebrow">ALEXA+ STYLE AGENTIC EXPERIENCE</div>
        <h1>Find the right opportunity.<br />Know your fit. <em>Take the next step.</em></h1>
        <p>
          An opportunity intelligence agent for job seekers. It discovers roles, evaluates fit,
          explains gaps, and turns job discovery into a clear action decision.
        </p>
      </section>

      <section className="workspace">
        <div className="conversation panel">
          <div className="panelTitle">Candidate + request</div>

          <div className="agentMessage">
            <div className="avatar">A+</div>
            <div>
              <b>Opportunity Agent</b>
              <p>Give me the essentials and I&apos;ll rank each role by realistic fit.</p>
            </div>
          </div>

          <div className="profileGrid">
            <div>
              <label htmlFor="name">Name</label>
              <input id="name" value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} />
            </div>
            <div>
              <label htmlFor="experience">Years experience</label>
              <input id="experience" type="number" min="0" max="50" step="0.5" value={profile.yearsExperience} onChange={(event) => updateProfile("yearsExperience", Number(event.target.value))} />
            </div>
          </div>

          <label htmlFor="location">Location</label>
          <input id="location" value={profile.location} onChange={(event) => updateProfile("location", event.target.value)} />

          <label htmlFor="skills">Skills (comma separated)</label>
          <textarea id="skills" className="compactTextarea" value={skillsText} onChange={(event) => setSkillsText(event.target.value)} />

          <label htmlFor="qualifications">Qualifications (comma separated)</label>
          <textarea id="qualifications" className="compactTextarea" value={qualificationsText} onChange={(event) => setQualificationsText(event.target.value)} />

          <label htmlFor="preferredRoles">Target roles (comma separated)</label>
          <textarea id="preferredRoles" className="compactTextarea" value={preferredRolesText} onChange={(event) => setPreferredRolesText(event.target.value)} />

          <label htmlFor="authorization">Work authorization (comma separated countries)</label>
          <input id="authorization" value={authorizationText} onChange={(event) => setAuthorizationText(event.target.value)} />

          <label className="toggleRow" htmlFor="remotePreferred">
            <input id="remotePreferred" type="checkbox" checked={profile.remotePreferred} onChange={(event) => updateProfile("remotePreferred", event.target.checked)} />
            <span>Prefer remote opportunities</span>
          </label>
          <label className="toggleRow" htmlFor="hybridAccepted">
            <input id="hybridAccepted" type="checkbox" checked={profile.hybridAccepted} onChange={(event) => updateProfile("hybridAccepted", event.target.checked)} />
            <span>Hybrid work is acceptable</span>
          </label>
          <label className="toggleRow" htmlFor="onSiteAccepted">
            <input id="onSiteAccepted" type="checkbox" checked={profile.onSiteAccepted} onChange={(event) => updateProfile("onSiteAccepted", event.target.checked)} />
            <span>On-site work is acceptable</span>
          </label>
          <label className="toggleRow" htmlFor="willingToRelocate">
            <input id="willingToRelocate" type="checkbox" checked={profile.willingToRelocate} onChange={(event) => updateProfile("willingToRelocate", event.target.checked)} />
            <span>Willing to relocate for the right role</span>
          </label>

          <label htmlFor="prompt">Your request</label>
          <textarea id="prompt" value={message} onChange={(event) => setMessage(event.target.value)} />

          <button onClick={runAgent} disabled={loading}>
            {loading ? "Discovering opportunities…" : "Run opportunity analysis"}
          </button>
          <small>Milestone 6: results now explain ranking and separate primary targets from adjacent opportunities.</small>
          <small>Source mode: {sourceMode === "live-greenhouse" ? "Live Greenhouse boards" : "Demo fallback"}</small>
          {note ? <small>{note}</small> : null}
        </div>

        <div className="results panel">
          <div className="panelTitle">Decision workspace</div>
          {results.length === 0 ? (
            <div className="empty">
              <div className="orbit">◎</div>
              <h2>Ready to reason</h2>
              <p>Run the agent to discover and rank opportunities by realistic fit.</p>
            </div>
          ) : (
            <div className="resultGroups">
              {primaryTargets.length ? (
                <section className="resultGroup">
                  <div className="groupHeading">
                    <div>
                      <span>Primary targets</span>
                      <p>Closest to your stated role direction.</p>
                    </div>
                    <b>{primaryTargets.length}</b>
                  </div>
                  <div className="cards">
                    {primaryTargets.map((result) => <ResultCard result={result} key={result.opportunity.id} />)}
                  </div>
                </section>
              ) : null}

              {adjacentOpportunities.length ? (
                <section className="resultGroup adjacentGroup">
                  <div className="groupHeading">
                    <div>
                      <span>Adjacent opportunities</span>
                      <p>Realistic alternatives with transferable-skill overlap.</p>
                    </div>
                    <b>{adjacentOpportunities.length}</b>
                  </div>
                  <div className="cards">
                    {adjacentOpportunities.map((result) => <ResultCard result={result} key={result.opportunity.id} />)}
                  </div>
                </section>
              ) : null}

              {notRecommended.length ? (
                <details className="rejectedGroup">
                  <summary>
                    <div>
                      <span>Not recommended</span>
                      <p>{notRecommended.length} roles were ruled out so you can focus on stronger opportunities.</p>
                    </div>
                    <b>{notRecommended.length}</b>
                  </summary>
                  <div className="rejectedIntro">
                    These roles stay available for transparency, but the agent recommends spending application effort elsewhere.
                  </div>
                  <div className="cards">
                    {notRecommended.map((result) => <ResultCard result={result} key={result.opportunity.id} />)}
                  </div>
                </details>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="flow">
        {['Profile', 'Discover', 'Check eligibility', 'Match', 'Decide', 'Act'].map((step, index) => (
          <div key={step}><span>0{index + 1}</span>{step}</div>
        ))}
      </section>
    </main>
  );
}
