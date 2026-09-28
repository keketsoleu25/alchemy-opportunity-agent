# Hackathon submission draft

**Status:** Prepared for review. Do not mark the Devpost entry submitted until the public demo video is uploaded and its link is added. The AWS Builder claim requires a successful live AWS invocation.

## Submission choices

- **Primary track:** Alexa+ — simulated web experience. The app is a simulation, not an official Alexa+ integration.
- **Submitter:** Individual, South Africa. Organization name: N/A if submitting personally.
- **Project timing:** New project created during the submission window; confirm the repository creation date in Devpost before selecting New.
- **Repository:** https://github.com/keketsoleu25/alchemy-opportunity-agent
- **Testing link:** https://alchemy-opportunity-agent-one.vercel.app/
- **AWS Builder mini challenge:** Leave unselected until a successful Bedrock Nova Runtime invocation is captured. Code integration alone should not be presented as a verified live invocation.
- **Open Source mini challenge:** Confirm an additional eligible project or contribution and its URL before selecting it. Do not assume that publishing the primary project alone satisfies the separate contribution requirement.

## Project description

### Elevator pitch

Alchemy Opportunity Agent turns a broad job search into an explainable apply decision. A candidate describes their skills, target roles and mobility constraints; the agent discovers vacancies, shows evidence and gaps, and recommends APPLY, STRETCH or SKIP.

### Inspiration

South African early-career candidates often face large job feeds with unclear seniority, degree and location requirements. More links do not answer whether an application is worth the time. This project focuses on that decision, using a realistic candidate profile and source-linked vacancies.

### What it does

The simulated Alexa+ web conversation accepts a request and editable candidate profile. It imports public Greenhouse vacancies, filters by role family and junior intent, evaluates skills, experience, qualifications, work authorization, location and work arrangement, then separates primary targets, adjacent roles and ruled-out roles. Each card shows an estimated fit, decision, evidence, gaps, next action and original vacancy link. Inferred technology signals are marked as such; an application brief and a truthful skill scenario help the candidate act on the decision. A clearly marked fictional guided example provides a repeatable demonstration when live inventory changes. Amazon Bedrock Converse code can add short explanations to the top actionable results when configured; deterministic scoring and a safe explanation fallback remain available.

### How it was built

Next.js, React and TypeScript power the interface and analysis API. A Greenhouse adapter normalizes public listings. A deterministic eligibility and scoring layer guards APPLY / STRETCH / SKIP. Amazon Bedrock Runtime's Converse API is an optional explanation layer, configured for Amazon Nova Micro; up to three calls are bounded by timeouts and each result can fall back independently. The public repository includes setup instructions, tests, an MIT license and a friction log.

### Challenges and lessons

Anthropic model access was declined for the account, so the integration was switched to Nova without making the product depend on a model call. Live-listing verification also exposed a Seattle on-site role presented to a South African candidate and a mid/senior role treated as junior. We tightened foreign-location eligibility, explicit experience parsing, seniority filtering and work-mode inference. The original job link remains visible for final human verification.

### What is next

Verify a real Nova invocation in the owner's AWS account, improve source coverage and structured job metadata, add saved application decisions, and evaluate matching quality against a labelled South African vacancy set.

## Product feedback answers

1. **Tools and purpose:** Next.js and React for the simulated conversation and result cards; public Greenhouse Job Board API for vacancy discovery; AWS SDK for JavaScript v3 and Bedrock Runtime Converse for optional short explanations. GitHub and Vercel host the source and demo.
2. **What worked well:** Greenhouse offers source-linked structured jobs without scraping application forms. The Converse API provides a common message shape and configurable model ID. The app remained usable with deterministic reasoning while account access was unresolved.
3. **What needs work:** Bedrock onboarding did not clearly distinguish visible models from models invocable by this account. Anthropic's first-time-use authorization path required support review and ultimately was declined. Greenhouse job content is free-form; work mode and seniority need conservative inference and original-link verification.
4. **Onboarding:** AWS CLI login, STS verification and model discovery worked. The first Converse invocation was blocked by account-level access. A switch to Nova is implemented, but a successful live invocation is still pending. Greenhouse required only public board tokens to get a first live result.
5. **Would you build with them again?** Yes. The combination of public vacancy data, guarded matching and optional model explanations is useful, provided model access and inferred metadata are tested against real account and job examples before making stronger claims.

## Demo video plan (target 2:30–2:45, English)

| Time | Screen action | Spoken point |
| --- | --- | --- |
| 0:00–0:20 | Open the live site and show the candidate profile | “Finding a vacancy is easy. Deciding whether it is realistic takes more work.” |
| 0:20–0:45 | State junior software request and mobility constraints | “The candidate controls skills, qualifications, location, work authorization and work-mode preferences.” |
| 0:45–1:15 | Select guided example, run analysis | “This labelled fictional scenario shows a clear APPLY, a stretch, and a role to skip.” |
| 1:15–1:45 | Show evidence, one skill scenario and application brief | “The decision is rule based. A truthful what-if shows whether a skill changes the result, then the brief turns evidence into an application plan.” |
| 1:45–2:15 | Unselect guided example; run live discovery | “Now the same workflow imports public vacancies and links back to the source.” |
| 2:15–2:30 | Point out inferred-skill notice and work-mode uncertainty | “Unstructured job text is labelled as inferred; unclear requirements stay uncertain.” |
| 2:30–2:45 | Show repo, architecture and friction log | “The code, setup and real integration friction are public. Bedrock is optional until live access is verified.” |

Record the working browser flow, upload the video publicly to YouTube or Vimeo, and paste its final URL into Devpost. Keep the video under three minutes. Do not show AWS credentials, private support messages or personal account details.

## Final review

- Run the guided and live flows after the latest deployment.
- **Verified 2026-09-28:** The deployed guided example showed APPLY, STRETCH, and SKIP; the application brief and hypothetical CSS scenario rendered. The live Greenhouse run imported 113 vacancies, filtered to 9 junior-compatible roles, and correctly ruled all 9 out for the sample Johannesburg candidate. Seattle was marked work mode unconfirmed and SKIP; detected skills were labelled for verification. Live inventory is variable and may have no actionable match, so use the labelled guided example for the repeatable video segment.
- Confirm the README setup works from a clean clone and the MIT license is visible.
- Attach the public English demo video URL.
- Fill the Devpost description, feedback, track and repository fields using this draft.
- Include a concise friction-log entry. Select mini challenges only with their required evidence.
- Review the Devpost preview, then submit before 23 October 2026, 12:00 PDT (21:00 SAST).
