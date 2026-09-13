# Architecture

## Product goal

Turn opportunity discovery into a decision workflow rather than a list of links.

## Layers

1. **Experience layer** — Alexa+-style conversational interface.
2. **Profile layer** — structured candidate context.
3. **Opportunity layer** — normalised opportunity data.
4. **Eligibility layer** — deterministic hard-constraint checks.
5. **Matching layer** — transparent skill/experience/location scoring.
6. **Reasoning layer** — planned Amazon Bedrock integration for explanations and agent orchestration.
7. **Action layer** — apply, stretch, skip, and later application preparation/tracking.

## Design principle

Use deterministic logic for hard constraints and AI for interpretation, explanation, and orchestration. This avoids making critical eligibility decisions entirely dependent on model output.
