"use client";

import { useState } from "react";
import type { MatchResult } from "@/lib/types";

type ApiResponse = {
  results: MatchResult[];
  mode: string;
};

export default function Home() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Find realistic junior software opportunities that match my profile.",
  );

  async function runAgent() {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", { method: "POST" });
      const data: ApiResponse = await response.json();
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  }

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
        <div className="status"><span /> Agent demo online</div>
      </header>

      <section className="hero">
        <div className="eyebrow">ALEXA+ STYLE AGENTIC EXPERIENCE</div>
        <h1>Find the right opportunity.<br />Know your fit. <em>Take the next step.</em></h1>
        <p>
          An opportunity intelligence agent for job seekers. It evaluates fit, explains gaps,
          and turns job discovery into a clear action decision.
        </p>
      </section>

      <section className="workspace">
        <div className="conversation panel">
          <div className="panelTitle">Conversation</div>
          <div className="agentMessage">
            <div className="avatar">A+</div>
            <div>
              <b>Opportunity Agent</b>
              <p>What kind of opportunity should I analyse for you?</p>
            </div>
          </div>
          <label htmlFor="prompt">Your request</label>
          <textarea id="prompt" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={runAgent} disabled={loading}>
            {loading ? "Analysing opportunities…" : "Run opportunity analysis"}
          </button>
          <small>Demo milestone 1: deterministic matching. AWS reasoning layer comes next.</small>
        </div>

        <div className="results panel">
          <div className="panelTitle">Decision workspace</div>
          {results.length === 0 ? (
            <div className="empty">
              <div className="orbit">◎</div>
              <h2>Ready to reason</h2>
              <p>Run the agent to rank opportunities by realistic fit.</p>
            </div>
          ) : (
            <div className="cards">
              {results.map((result) => (
                <article className="jobCard" key={result.opportunity.id}>
                  <div className="jobTop">
                    <div>
                      <h3>{result.opportunity.title}</h3>
                      <p>{result.opportunity.company} · {result.opportunity.workMode}</p>
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
                  <div className="next"><b>Next action:</b> {result.nextAction}</div>
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
