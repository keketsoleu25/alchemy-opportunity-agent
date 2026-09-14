# Hackathon Friction Log

This file records real friction encountered while building Alchemy Opportunity Agent. Entries should never be invented retroactively.

## Entry template

- **Date:**
- **Tool / service:**
- **Task attempted:**
- **Steps taken:**
- **Expected result:**
- **Actual result:**
- **Severity:** Low / Medium / High / Blocking
- **Workaround:**
- **Actionable suggestion:**

---

## 2026-09-13 — Project bootstrap

- **Tool / service:** GitHub integration
- **Task attempted:** Create the hackathon repository directly from the connected development workflow.
- **Steps taken:** Checked the authenticated GitHub connection and searched for an existing `alchemy-opportunity-agent` repository.
- **Expected result:** Create or initialise the new public repository from the same workflow.
- **Actual result:** Repository search and file operations were available, but repository creation was not exposed in the connected toolset.
- **Severity:** Low
- **Workaround:** Build the initial codebase locally, then create the empty public GitHub repository and push/import the project.
- **Actionable suggestion:** Expose repository creation alongside repository content operations for smoother zero-to-first-commit onboarding.

## 2026-09-14 — AWS CLI onboarding and Bedrock runtime verification

- **Tool / service:** AWS CLI v2 + Amazon Bedrock Runtime
- **Task attempted:** Authenticate locally and invoke a Bedrock model through the Converse API.
- **Steps taken:** Installed AWS CLI v2, used `aws login`, verified identity with STS, listed Bedrock foundation models, then attempted a direct `bedrock-runtime converse` call.
- **Expected result:** Receive a short model response confirming runtime access.
- **Actual result:** The first application attempt hit an expired temporary login session. After reauthentication, the direct Converse call returned `AccessDeniedException` because the AWS account was still undergoing verification. Inline PowerShell JSON also proved fragile, so the request payload was moved to JSON files for testing.
- **Severity:** Medium
- **Workaround:** Keep `BEDROCK_ENABLED=false` until account verification completes and rely on the deterministic scoring fallback so the application remains fully usable. Use `file://` JSON payloads for CLI runtime tests.
- **Actionable suggestion:** Surface account verification status earlier in Bedrock onboarding, before runtime invocation, and provide Windows PowerShell examples that avoid brittle inline JSON quoting.
