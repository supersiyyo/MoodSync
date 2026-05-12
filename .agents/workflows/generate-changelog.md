---
description: Auto-generates a user-friendly changelog from recent git commits and prepends it to the updates module.
---

# Generate Changelog Workflow

**Description:** This workflow should be executed manually via `/generate-changelog` at the end of a development sprint. It leverages the AI agent to parse raw technical commit history and translate it into a polished, user-facing summary for the Updates Module on the frontend.

## Steps

1. **Analyze Git History:** Run `git log --oneline -n 15` (or as many commits as needed since the last documented update) to gather recent development activity.
2. **Synthesize and Format:** Group these raw commits logically. Identify "features" versus "fixes". Rewrite the technical jargon into friendly, accessible language that instructors and students can appreciate without feeling overwhelmed.
3. **Read Existing Changelog:** Open `frontend/public/changelog.json` to understand the current structure and the latest `id` and `version`.
4. **Append New Entry:** Prepend a new JSON object to the array in `changelog.json`.
   - Assign a new `id`.
   - Set the current `date` (YYYY-MM-DD format).
   - Increment the `version` logically (e.g., v1.1.x for features, v1.0.x for fixes).
   - Provide a bold, catchy `title`.
   - Set the `type` to either `"feature"` or `"fix"`.
   - Write a concise, engaging `description` summarizing the synthesized commits.
5. **Commit the Data:** Commit the changes to `changelog.json` with a clear message (e.g., `chore: update changelog for vX.Y.Z`).
6. **Remind the User:** Instruct the user to verify the changes visually in the browser and prepare a Pull Request using `/finalize-feature` when ready.
