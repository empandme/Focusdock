# FocusDock 数据文件夹

这个文件夹是 FocusDock 的本地数据工作区，不是 App 源码。

FocusDock 会把 `todo.md` 作为桌面 Todo 小组件的唯一任务来源。AI 助手在编辑任务或生成每日早报前，应该先阅读 `rules.md` 和 `todo.md`。

## 智能体快速开始

1. 阅读 `rules.md`。
2. 阅读 `todo.md`，理解当前任务状态。
3. 如果要准备每日早报，创建或更新 `daily-briefs/YYYY-MM-DD.md`。
4. 只把简短、高确定性的行动项加入 `todo.md`。
5. 详细开发记录写入被忽略的私有文件，不要写进面向 GitHub 的文档。

## 文件

- `todo.md`：FocusDock 显示和编辑的唯一任务文件。
- `rules.md`：任务写法、每日早报和 AI 助手行为规则。
- `daily-briefs/`：以 `YYYY-MM-DD.md` 命名的每日早报文件。
- `daily-briefs/README.md`：每日早报结构和示例。
- `archive.md`：从 `todo.md` 清理出来的较早已完成任务。
- `agent-log.md`：只记录简短公开操作说明。

不要把私人邮件正文、账号数据或很长的背景说明放进 `todo.md`。背景信息应放在每日早报或私有日志里，让 Todo 专注于行动项。
