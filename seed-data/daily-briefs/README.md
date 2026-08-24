# Daily Briefs / 每日早报

Daily briefs are stored here. File names use `YYYY-MM-DD.md`.

每日早报保存在这里，文件名使用 `YYYY-MM-DD.md`。

## Fixed Structure / 固定结构

FocusDock reads daily briefs using fixed English Markdown headings:

FocusDock 会根据固定的英文 Markdown 标题读取每日早报：

- `## Today`
- `## Approaching Deadlines`
- `## Needs Confirmation`
- `## Optional Events`
- `## Trash / Ignore`
- `## Todo Candidates`

The app can also read the older Chinese headings, but new public examples should use the English headings above for portability.

App 也能读取旧版中文标题，但新的公开示例应使用上面的英文标题，方便分享和迁移。

## Format Rules / 格式规则

- All section headings must be `## Section Name`.
- 所有分区标题必须是 `## Section Name`。
- Normal sections must use numbered lists in the form `1. ...`.
- 普通分区必须使用 `1. ...` 形式的编号列表。
- Do not use `- ...` or `* ...` bullet lists in normal sections.
- 普通分区不要使用 `- ...` 或 `* ...` 项目符号列表。
- `Todo Candidates` must use numbered lists, and each short Todo must be wrapped in backticks.
- `Todo Candidates` 必须使用编号列表，并且每条短 Todo 必须用反引号包起来。

## Minimum Template / 最小模板

```markdown
# YYYY-MM-DD Daily Brief

## Today

1. Project: one sentence explaining the time, location, relevance, and action needed now. / 项目：用一句话说明时间、地点、相关性和现在需要做的事。

## Approaching Deadlines

1. Project: deadline or approaching schedule item, and whether action is needed. / 项目：截止时间或临近安排，以及是否需要行动。

## Needs Confirmation

1. Project: information or choice that needs user confirmation. / 项目：需要用户确认的信息或选择。

## Optional Events

1. Project: optional but valuable near-term event. / 项目：可选但有价值的近期活动。

## Trash / Ignore

1. Project: general promotion, newsletter, or information that needs no action. / 项目：普通推广、简报或无需行动的信息。

## Todo Candidates

1. `Project: action/keyword / 项目：行动或关键词 @YYYY-MM-DD`
2. `Project: undated action / 项目：无日期行动`
```

The daily brief carries background. Todo only reminds the user of actions.

每日早报承载背景信息。Todo 只提醒用户行动项。

Only high-confidence must-act items may go directly into `todo.md`. Optional or uncertain items should stay in the daily brief candidates until the user decides.

只有高确定性的必做事项才可以直接进入 `todo.md`。可选或不确定事项应先留在每日早报候选中，等用户决定。
