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
};

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

  function updateProfile<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function runAgent() {
    setLoading(true);
    setNote("Discovering and analysing opportunities…");

    try {
      const candidate = {
        ...profile,
        skills: skillsText
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
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
              <input
                id="name"
                value={profile.name}
                onChange={(event) => updateProfile("name", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="experience">Years experience</label>
              <input
                id="experience"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={profile.yearsExperience}
                onChange={(event) => updateProfile("yearsExperience", Number(event.target.value))}
              />
            </div>
          </div>

          <label htmlFor="location">Location</label>
          <input
            id="location"
            value={profile.location}
            onChange={(event) => updateProfile("location", event.target.value)}
          />

          <label htmlFor="skills">Skills (comma separated)</label>
          <textarea
            id="skills"
            className="compactTextarea"
            value={skillsText}
            onChange={(event) => setSkillsText(event.target.value)}
          />

          <label className="toggleRow" htmlFor="remotePreferred">
            <input
              id="remotePreferred"
              type="checkbox"
              checked={profile.remotePreferred}
              onChange={(event) => updateProfile("remotePreferred", event.target.checked)}
            />
            <span>Prefer remote opportunities</span>
          </label>

          <label htmlFor="prompt">Your request</label>
          <textarea id="prompt" value={message} onChange={(event) => setMessage(event.target.value)} />

          <button onClick={runAgent} disabled={loading}>
            {loading ? "Discovering opportunities…" : "Run opportunity analysis"}
          </button>
          <small>Milestone 4: live-source ingestion feeds the same guarded decision engine.</small>
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
            <div className="cards">
              {results.map((result) => (
                <article className="jobCard" key={result.opportunity.id}>
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
                  <div className="scoreRow">
                    <strong>{result.score}% match</strong>
                    <div className="scoreTrack"><div style={{ width: `${result.score}%` }} /></div>
                  </div>
                  <p className="reasoning">{result.reasoning}</p>
                  <div className="columns">
                    <div>
                      <h4>Evidence</h4>
                      {result.strengths.slice(0, 3).map((item) => <span className="good" key={item}>✓ {item}</span>)}
                    </div>
                    <div>
                      <h4>Gaps</h4>
                      {(result.gaps.length ? result.gaps : ["No material gaps found"]).slice(0, 3).map((item) => <span className="gap" key={item}>• {item}</span>)}
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
              ))}
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
