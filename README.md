# Alchemy Opportunity Agent

**Find the right opportunity. Know your fit. Take the next step.**

Alchemy Opportunity Agent is an agentic career-assistance project being built for the **Build, Ship, Shape: Amazon Developer Hackathon 2026**.

The project focuses on a practical problem: job seekers do not only need more job listings; they need help deciding which opportunities are realistic, why they fit or do not fit, and what action to take next.

## Current milestone

**Milestone 6 is complete.** The product now combines live opportunity discovery, realistic candidate constraints, guarded APPLY / STRETCH / SKIP decisions, role-family prioritization, and an explainable decision workspace.

Current workflow:

`Candidate profile -> Discover live vacancies -> Normalize -> Filter role family/seniority -> Check eligibility -> Match -> Decide -> Optional Bedrock explanation -> Act`

The deterministic engine owns the score and APPLY / STRETCH / SKIP decision. Amazon Bedrock Runtime is integrated as an optional reasoning layer and is not allowed to overwrite those guarded rules.

If a live source fails or Bedrock is unavailable, the application falls back safely so the core experience remains usable and explainable.

## What works now

- Editable candidate profile
- Skills, qualifications, years of experience, target roles, location and work authorization
- Remote, hybrid, on-site and relocation preferences
- Live public Greenhouse vacancy ingestion
- Vacancy normalization and source links
- Junior / entry-level seniority filtering
- Core software-role filtering with adjacent technical roles held back
- South Africa-aware location and work-mode scoring
- Qualification and work-authorization checks
- Target-role family weighting
- Deterministic APPLY / STRETCH / SKIP decisions
- Evidence, gaps and next-action explanations
- Primary Targets vs Adjacent Opportunities
- Collapsed Not Recommended section for ruled-out roles
- "Why ranked here" signals such as target-role match, skills match, remote fit, experience fit and mobility constraints
- Safe deterministic fallback when Bedrock is disabled or unavailable

## Architecture

- Next.js + React + TypeScript
- Alexa+-style simulated agent experience
- editable candidate profile input
- Greenhouse public job-board ingestion adapter
- opportunity normalization and source metadata
- deterministic eligibility and matching engine
- role-family and seniority filtering
- South Africa-aware mobility scoring
- Amazon Bedrock Runtime via the AWS SDK for JavaScript v3
- Bedrock Converse API for optional model reasoning
- safe deterministic fallback
- public open-source repository
- friction log documenting real onboarding and integration issues

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`.

## Enable live opportunity discovery

Add one or more public Greenhouse board tokens to `.env.local`:

```env
GREENHOUSE_BOARD_TOKENS=takealotgroup,impact,bashdotcom,offerzen
```

The application fetches the configured boards, normalizes vacancy data, extracts recognizable technology signals, estimates experience requirements, preserves the original vacancy URL, filters out clearly irrelevant seniority and role-family noise, and feeds the resulting opportunities into the matching engine.

If no board tokens are configured or all configured boards fail, the application uses demo opportunities and clearly reports that fallback mode in the UI.

## Decision model

The ranking pipeline intentionally separates discovery relevance from final fit:

1. Detect software / junior intent from the request
2. Classify core software roles vs adjacent technical roles
3. Remove senior, lead, manager, intermediate and high-experience roles for junior intent
4. Score required skills, preferred skills and experience
5. Apply location and work-mode realism
6. Check qualifications and work authorization
7. Weight stated target-role families
8. Produce APPLY / STRETCH / SKIP
9. Present Primary Targets, Adjacent Opportunities and Not Recommended

This means the highest raw percentage does not automatically become the best recommendation. The agent also considers role direction, eligibility, mobility and realistic seniority.

## Enable Amazon Bedrock

Configure AWS credentials using the AWS SDK credential chain, then edit `.env.local`:

```env
BEDROCK_ENABLED=true
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
```

Do not commit AWS credentials to GitHub.

The model ID is configurable because model availability and invocation paths can differ by AWS account and region.

### Current AWS / Anthropic access status

AWS CLI authentication works, STS identity verification works, and Bedrock model discovery works in `us-east-1`.

Direct Bedrock Runtime Converse calls reach Bedrock but Anthropic invocation is currently blocked by first-time-use account authorization. The required Anthropic use-case form is visible in the Bedrock console, but submission returns:

> Your account is not authorized to perform this action. Please create a support case.

An AWS Support case has been opened for this account-level onboarding blocker. Until AWS clears the authorization issue, the project keeps:

```env
BEDROCK_ENABLED=false
```

The application remains fully functional through deterministic scoring and explanations.

This onboarding path and fallback behavior are documented in [`docs/FRICTION_LOG.md`](./docs/FRICTION_LOG.md).

## Milestone status

- **Milestone 1 — Demo decision engine:** complete
- **Milestone 2 — Bedrock integration layer:** integrated with safe fallback
- **Milestone 3 — Editable candidate context:** complete
- **Milestone 4 — Live Greenhouse opportunity ingestion:** complete
- **Milestone 5 — Eligibility, mobility and candidate constraints:** complete
- **Milestone 6 — Explainable decision UX:** complete
- **Milestone 7 — Active Bedrock reasoning:** blocked pending AWS / Anthropic account authorization

## Build

```bash
npm run build
npm start
```

## Repository structure

```text
app/                  Next.js UI and API routes
lib/                  matching, discovery, normalization, scoring and Bedrock integration
lib/sources/          external opportunity-source adapters
docs/                 architecture notes and hackathon friction log
```

## Open Source mini challenge

This repository is a new open-source project created during the hackathon window. See [LICENSE](./LICENSE).

## AWS Builder mini challenge

Amazon Bedrock Runtime is integrated in code and model discovery is working. The project also documents a real AWS onboarding blocker and demonstrates resilient fallback behavior while the support case is being resolved.

Once Anthropic access is enabled, the next AWS milestone is to capture a successful Converse call in the demo and activate Bedrock-generated user-facing reasoning while keeping deterministic decisions guarded.

## License

MIT
