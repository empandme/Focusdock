# FocusDock Data Folder

This folder is the local data workspace for FocusDock. It is not the app source code.

FocusDock reads `todo.md` as the single source of truth for the desktop todo widget. AI agents should read `rules.md` and `todo.md` before editing tasks or generating daily briefs.

## Agent Quick Start

1. Read `rules.md`.
2. Read `todo.md` to understand the current task state.
3. If preparing a daily brief, create or update `daily-briefs/YYYY-MM-DD.md`.
4. Only add concise, high-confidence action items to `todo.md`.
5. Keep detailed development notes in ignored private files, not GitHub-facing documents.

## Files

- `todo.md`: the only task file FocusDock displays and edits.
- `rules.md`: rules for task writing, daily briefs, and AI-agent behavior.
- `daily-briefs/`: daily brief files named `YYYY-MM-DD.md`.
- `daily-briefs/README.md`: daily brief structure and examples.
- `archive.md`: older completed tasks moved out of `todo.md`.
- `agent-log.md`: short public operation notes only.

Do not put private email bodies, account data, or long background notes in `todo.md`. Use daily briefs or private logs for context, and keep Todo focused on actions.
