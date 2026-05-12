---
description: Finalizes a feature by updating docs and preparing a PR.
---

# Finalize Feature Workflow

**Description:** This workflow should be executed manually via `/finalize-feature` after the user has successfully tested the local code changes. It handles the heavy lifting of updating documentation and preparing the branch for the GitHub Actions PR check.

## Steps

1. **Analyze Recent Changes:** Review the recent code modifications you made during this session. Pay special attention to any new dependencies, changed endpoints, or architectural shifts.
2. **Review Existing Documentation:** Read the current state of `docs/architecture.md`, `docs/deployment.md`, and `README.md`.
3. **Update Documentation:** Apply necessary updates to the documentation files to ensure they perfectly reflect the new code changes. Be thorough but concise.
4. **Commit Changes:** Create a commit with a descriptive message summarizing both the code and documentation updates.
5. **Prepare for PR:** Remind the user to open a Pull Request so the `.github/workflows/pr-check.yml` action can run its automated syntax and build verifications.
