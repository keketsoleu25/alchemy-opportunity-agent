# Alchemy Opportunity Agent

**Find the right opportunity. Know your fit. Take the next step.**

Alchemy Opportunity Agent is an agentic career-assistance project being built for the **Build, Ship, Shape: Amazon Developer Hackathon 2026**.

The project focuses on a practical problem: job seekers do not only need more job listings; they need help deciding which opportunities are realistic and what action to take next.

## Current milestone

Milestone 4 adds live opportunity ingestion while preserving the guarded scoring and reasoning architecture.

Current workflow:

`Candidate profile -> Discover live vacancies -> Normalize -> Check eligibility -> Match -> Decide -> Optional Bedrock explanation -> Act`

The user can edit their profile and request. The API can now ingest public Greenhouse job-board vacancies, normalize them into the project Opportunity schema, rank them against the request, and then pass them through the same deterministic scoring engine used in earlier milestones.

The deterministic engine owns the score and APPLY / STRETCH / SKIP decision. Amazon Bedrock Runtime is integrated as an optional reasoning layer and is not allowed to overwrite those core rules.

If no live source is configured, live sources fail, or Bedrock is unavailable, the application falls back safely so the core demo remains usable.

## Architecture

- Next.js + React + TypeScript
- Alexa+-style simulated agent experience
- editable candidate profile input
- Greenhouse public job-board ingestion adapter
- opportunity normalization and source metadata
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

The application fetches the configured boards, normalizes vacancy data, extracts recognizable technology signals, estimates experience requirements, preserves the original vacancy URL, and feeds the resulting opportunities into the matching engine.

If no board tokens are configured or all configured boards fail, the application uses the demo opportunities and clearly reports that fallback mode in the UI.

## Enable Amazon Bedrock

Configure AWS credentials using the AWS SDK credential chain, then edit `.env.local`:

```env
BEDROCK_ENABLED=true
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=global.anthropic.claude-haiku-4-5-20251001-v1:0
```

Do not commit AWS credentials to GitHub.

The model ID is configurable because model availability and access can differ by AWS account and region.

### Current AWS verification status

AWS CLI authentication, STS identity verification, and Bedrock model discovery have been confirmed. A direct Bedrock Runtime Converse invocation currently returns an account-verification `AccessDeniedException`, so the project keeps Bedrock disabled until the AWS account verification completes.

This failure mode is documented in [`docs/FRICTION_LOG.md`](./docs/FRICTION_LOG.md). The application remains functional through its deterministic fallback.

## Build

```bash
npm run build
npm start
```

## Repository structure

```text
app/                  Next.js UI and API routes
lib/                  matching, discovery, normalization, and Bedrock integration
lib/sources/          external opportunity-source adapters
docs/                 architecture notes and hackathon friction log
```

## Open-source mini challenge

This repository is a new open-source project created during the hackathon window. See [LICENSE](./LICENSE).

## AWS Builder mini challenge

Amazon Bedrock Runtime is integrated in code and the account can discover Bedrock foundation models. The remaining AWS onboarding blocker is account verification for live Runtime invocation. Once verification clears, the next AWS milestone is to capture a successful Converse call and extend the agent beyond a single explanation step.

## License

MIT
