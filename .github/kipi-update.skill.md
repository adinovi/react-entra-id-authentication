# Skill: Kipi Knowledge Update

**Trigger:** After making code changes to this repository.

**Action:**
1. Notify the user: "Kipi recommends updating the knowledge base to reflect recent changes."
2. Ask: "Would you like me to run Kipi's Update Knowledge workflow now?"
3. If yes: Activate Kipi and start Workflow 4 — Update Knowledge.
4. If no: Log a reminder in `workflow-state.json` under `pending_updates`.

---

## How to Invoke

Any AI agent operating in this repository should invoke this skill at the end of any code-change session by presenting the following prompt to the user:

> Code changes were made. Would you like to run Kipi's Update Knowledge workflow to keep the documentation in sync?

## What Kipi Will Do

When Workflow 4 — Update Knowledge is triggered, Kipi will:

1. Ask what changed (diff, description, or file references).
2. Load the relevant chapter files from `core-knowledge/`.
3. Identify which sections are now outdated or incomplete.
4. Propose specific edits (old → new for each section).
5. Wait for user approval before applying any change.
6. Update `core-knowledge/workflow-state.json` to reflect the new state.

## Knowledge Base Location

All structured documentation lives in `core-knowledge/`. See `core-knowledge/index.md` for the master chapter index.
