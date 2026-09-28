# Architecture

## Product goal

Turn opportunity discovery into a decision workflow rather than a list of links.

## Layers

1. **Experience layer** — simulated Alexa+ web experience with an editable request and candidate profile.
2. **Profile layer** — structured candidate context.
3. **Opportunity layer** — normalised opportunity data.
4. **Eligibility layer** — deterministic hard-constraint checks.
5. **Matching layer** — transparent skill/experience/location scoring.
6. **Reasoning layer** — deterministic explanation fallback, with optional Amazon Bedrock Nova Micro explanations for up to three actionable matches when runtime access is enabled and verified. The model never changes eligibility, score, or decision.
7. **Action layer** — apply, stretch, or skip, with an evidence-based application brief and a clearly hypothetical skill scenario. Application tracking is future work.

## Design principle

Use deterministic logic for hard constraints and decisions. Treat free-form listing text as inferred evidence and keep uncertain requirements visible for source-page verification. Optional model output only explains the guarded result; each failed model call falls back independently.
