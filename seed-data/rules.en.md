# Todo Organization Rules

## Purpose

FocusDock's Todo window is a compact reminder area, not a notebook or email summary. `todo.md` should only contain real actions, confirmed events, dated items, deadlines, or short things the user must actively confirm.

Do not put full email text, event background, link explanations, or promotional copy into Todo. Put context in daily briefs or private logs.

## Todo Writing

Use short items that are readable at a glance.

Recommended format:

`Project: action/keyword @YYYY-MM-DD`

Examples:

- `BIA: Welcome Night 5-8 @2026-08-24`
- `BCSSA: Boba Run @2026-08-27`
- `RecWell: sign Waiver`

`todo.md` may use English headings `Inbox`, `Todo`, `Done` or Chinese headings `收件箱`, `待办`, `完成`. FocusDock can parse both.

- `Todo` / `待办`: clear date, action, and commitment.
- `Inbox` / `收件箱`: uncertain, missing a date, or needs confirmation.
- `Done` / `完成`: completed tasks.

Do not delete a task just because it is completed. Move it to Done first.

## Daily Briefs

Daily briefs should help the user understand today and the near future within about 30 seconds.

Supported sections:

- `## Today` / `## 今天`
- `## Approaching Deadlines` / `## 临近截止`
- `## Needs Confirmation` / `## 需要确认`
- `## Optional Events` / `## 可选活动`
- `## Trash / Ignore` / `## 垃圾/忽略`
- `## Todo Candidates` / `## 可加入 Todo 候选`

Normal sections use numbered lists. Todo candidates must be numbered, and each candidate must wrap the short Todo in backticks.

## Candidate Rules

Candidate priority, highest to lowest:

1. Things already signed up for, reserved, submitted, purchased, or confirmed.
2. Required or semi-required school items, such as forms, bills, training, and official appointments.
3. Near-term choices that affect scheduling.
4. High-value optional events happening soon.
5. Resources strongly related to the user's current identity or situation.
6. General promotions, generic job recommendations, and low-value newsletters.

If an item is already in `todo.md`, the daily brief may mention it, but it should not appear again under Todo Candidates.

Keep Todo clean; let the daily brief carry background.
