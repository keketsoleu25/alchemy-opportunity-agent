# Alchemy Opportunity Agent

**Find the right opportunity. Know your fit. Take the next step.**

Alchemy Opportunity Agent is an agentic career-assistance project being built for the **Build, Ship, Shape: Amazon Developer Hackathon 2026**.

The project focuses on a practical problem: job seekers do not only need more job listings; they need help deciding which opportunities are realistic and what action to take next.

## Current milestone

Milestone 1 ships a deterministic opportunity-matching workflow and an Alexa+-style conversational web experience. It demonstrates the product flow before the AWS-powered reasoning layer is connected.

Current workflow:

`Profile -> Discover -> Check eligibility -> Match -> Decide -> Act`

## Why this is not just a chatbot

The application separates candidate context, eligibility checks, matching, decision logic, and next-action guidance. The current implementation intentionally keeps the eligibility and scoring layer deterministic so later AI reasoning can add explanation and orchestration without replacing core business rules.

## Planned hackathon architecture

- Next.js + React + TypeScript
- Alexa+-style simulated agent experience
- Amazon Bedrock reasoning layer
- AWS agent/orchestration service(s) selected during implementation
- Public open-source repository
- Friction log documenting real onboarding and integration issues

> AWS integrations will only be marked complete here once they are implemented and demonstrated in code.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Repository structure

```text
app/                  Next.js UI and API routes
lib/                  candidate/job types and deterministic match engine
docs/                 architecture notes and hackathon friction log
```

## Open-source mini challenge

This repository is being created as a new open-source project during the hackathon window. See [LICENSE](./LICENSE).

## AWS Builder mini challenge

AWS integration is the next milestone. The README will document exact services, setup steps, runtime usage, and architecture once integrated.

## License

MIT
