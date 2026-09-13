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
