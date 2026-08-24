# FocusDock Data Folder / FocusDock 数据文件夹

This folder is the local data workspace for FocusDock. It is not the app source code.

这个文件夹是 FocusDock 的本地数据工作区，不是 App 源码。

FocusDock reads `todo.md` as the single source of truth for the desktop todo widget. AI agents such as Codex should read this file and `rules.md` before editing tasks or generating daily briefs.

FocusDock 会把 `todo.md` 作为桌面 Todo 小组件的唯一任务来源。Codex 等 AI 助手在编辑任务或生成每日早报前，应该先阅读本文件和 `rules.md`。

## Agent Quick Start / 智能体快速开始

1. Read `rules.md`.
2. 阅读 `rules.md`。
3. Read `todo.md` to understand the current task state.
4. 阅读 `todo.md`，理解当前任务状态。
5. If preparing a daily brief, create or update `daily-briefs/YYYY-MM-DD.md` using the format in `daily-briefs/README.md`.
6. 如果要准备每日早报，请按 `daily-briefs/README.md` 的格式创建或更新 `daily-briefs/YYYY-MM-DD.md`。
7. Only add concise, high-confidence action items to `todo.md`.
8. 只把简短、高确定性的行动项加入 `todo.md`。
9. Keep detailed development notes in private ignored files, not in GitHub-facing documents.
10. 详细开发记录应写入被 Git 忽略的私有文件，不要写进面向 GitHub 的公开文档。

## Files / 文件

- `todo.md`: the only task file FocusDock displays and edits.
- `todo.md`：FocusDock 显示和编辑的唯一任务文件。
- `rules.md`: rules for task writing, daily briefs, and AI-agent behavior.
- `rules.md`：任务写法、每日早报和 AI 助手行为规则。
- `daily-briefs/`: daily brief files named `YYYY-MM-DD.md`.
- `daily-briefs/`：以 `YYYY-MM-DD.md` 命名的每日早报文件。
- `daily-briefs/README.md`: required daily brief structure and examples.
- `daily-briefs/README.md`：每日早报所需结构和示例。
- `archive.md`: older completed tasks moved out of `todo.md`.
- `archive.md`：从 `todo.md` 清理出来的较早已完成任务。
- `agent-log.md`: short public operation notes only.
- `agent-log.md`：只记录简短公开操作说明。

Do not put private email bodies, account data, or long background notes in `todo.md`. Use daily briefs or private logs for context, and keep Todo focused on actions.

不要把私人邮件正文、账号数据或很长的背景说明放进 `todo.md`。背景信息应放在每日早报或私有日志里，让 Todo 专注于行动项。
