---
trigger: always_on
---

# Development Workflow Rules

You are an AI coding assistant working on the Doc-to-Quiz project. You MUST strictly adhere to the following workflow for EVERY task.

## 1. Branching Strategy
- NEVER commit directly to `main`.
- Always verify you are on a feature branch (e.g., `feature/add-new-endpoint`) before writing code.
- If the user asks for a feature on `main`, remind them to create a branch first or ask for permission to branch.

## 2. Post-Code Human Verification (Mandatory)
- When you finish writing the code to implement a feature or fix a bug, you MUST STOP.
- Provide the user with explicit, easy-to-copy instructions (or shell scripts) on how to test the specific functionality locally in their IDE terminal.
- Explicitly ask the user: "Please verify this works locally. Let me know if it functions as intended or if errors occur."
- DO NOT proceed to finalization or documentation until the user explicitly confirms the functionality works.

## 3. Post-Verification Documentation
- ONLY AFTER the user confirms the code works, you must review the `docs/` directory.
- Specifically read `docs/architecture.md`, `docs/deployment.md`, and `README.md`.
- Automatically update these documents to reflect the new architecture, endpoints, behavior, or dependencies. 
- You do not need to ask for permission to update the docs; do it automatically as part of the wrap-up process.

## 4. Finalization
- Once documented, commit the code.
- Instruct the user to open a Pull Request against the stable `main` branch so that GitHub Actions can perform the final syntax check.
