# Alchemy Opportunity Agent

**Find the right opportunity. Know your fit. Take the next step.**

Alchemy Opportunity Agent is an agentic career-assistance project being built for the **Build, Ship, Shape: Amazon Developer Hackathon 2026**.

The project focuses on a practical problem: job seekers do not only need more job listings; they need help deciding which opportunities are realistic and what action to take next.

## Current milestone

Milestone 2 wires **Amazon Bedrock Runtime** into the opportunity-analysis API while preserving deterministic scoring as a guardrail.

Current workflow:

`Profile -> Discover -> Check eligibility -> Match -> Decide -> Bedrock explanation -> Act`

The deterministic engine owns the score and APPLY / STRETCH / SKIP decision. Bedrock adds concise user-facing reasoning without being allowed to overwrite those core rules.

If Bedrock is disabled or invocation fails, the API falls back to the deterministic explanation so the application remains usable.

## Architecture

- Next.js + React + TypeScript
- Alexa+-style simulated agent experience
- deterministic eligibility and matching engine
- Amazon Bedrock Runtime via the AWS SDK for JavaScript v3
- Bedrock Converse API for model reasoning
- safe deterministic fallback
- public open-source repository
- friction log documenting real onboarding and integration issues

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell you can use:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`.

By default, `BEDROCK_ENABLED=false`, so the app runs safely without AWS credentials.

## Enable Amazon Bedrock

Configure AWS credentials using the AWS SDK credential chain, then edit `.env.local`:

```env
BEDROCK_ENABLED=true
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=global.anthropic.claude-haiku-4-5-20251001-v1:0
```

Do not commit AWS credentials to GitHub.

The model ID is configurable because model availability and access can differ by AWS account and region.

## Build

```bash
npm run build
npm start
```

## Repository structure

```text
app/                  Next.js UI and API routes
lib/                  matching engine and Bedrock reasoning integration
docs/                 architecture notes and hackathon friction log
```

## Open-source mini challenge

This repository is a new open-source project created during the hackathon window. See [LICENSE](./LICENSE).

## AWS Builder mini challenge

Amazon Bedrock Runtime is now integrated in code. The next milestone is to verify a live Bedrock invocation with the hackathon AWS account, document the real onboarding experience, and extend the agent workflow beyond a single reasoning step.

## License

MIT
