# Todo Rules

- `todo.md` is the only task source.
- Do not delete active tasks just because they are done; move completed tasks to Done.
- FocusDock is a small reminder widget, not a notebook. Keep tasks short enough to scan quickly.
- Put dated tasks in Todo with `@YYYY-MM-DD`.
- Put undated, unclear, or needs-confirmation tasks in Inbox.
- Prefer the format `Project: action`, for example `Launch: draft notes` or `Design: review icons`.
- Keep one task around 8 English words or 18 Chinese characters when possible.
- Put background details, source notes, and longer context in `agent-log.md` or a daily brief.
- Preserve the user's wording when it is already clear.
- `archive.md` is reserved for older completed tasks that have been removed from Done.

## Daily Brief Rules

- Daily briefs live in `daily-briefs/YYYY-MM-DD.md`.
- A daily brief should help the user understand what matters today, not repeat every message or note.
- Use these sections when useful: `今天`, `临近截止`, `需要确认`, `可选活动`, `垃圾/忽略`, `可加入 Todo 候选`.
- Keep the highest-priority items short and visible.
- Candidate Todo items must be numbered and wrapped in backticks, for example:
  `1. Launch: draft notes @2026-09-04`
- Candidate items are drafts. The user can edit them before adding them to `todo.md`.
- Only high-confidence actions should be added directly to `todo.md`.
- Optional, vague, or informational items should stay in the daily brief until the user chooses them.

## Candidate Priority

From highest to lowest:

1. Things the user already committed to, booked, submitted, or confirmed.
2. Required tasks, forms, bills, deadlines, and appointments.
3. Near-term choices that affect the user's schedule.
4. High-value optional events or tasks happening soon.
5. Useful resources that relate to the user's current goals.
6. Generic newsletters, promotions, and low-signal recommendations.

## Writing Examples

Good:

- `Launch: draft notes @2026-09-04`
- `Design: review icons @2026-09-06`
- `Inbox: confirm deadline`

Too long:

- `Read the entire announcement email and decide whether any of the links need to become tasks later`

Better:

- `Announcements: scan links`
