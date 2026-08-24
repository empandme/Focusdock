# FocusDock User Guide / FocusDock 使用教程

This guide is for FocusDock `0.2.0`.

本教程适用于 FocusDock `0.2.0`。
中文请往下翻

## English

### 1. What FocusDock Is

FocusDock is a small macOS desktop todo widget. It stores your tasks in a local Markdown file named `todo.md`, so you can manage tasks from the widget, a text editor, or an AI coding assistant.

The app is intentionally simple:

- `Inbox` keeps undated tasks.
- `Todo` keeps dated tasks.
- `Done` keeps completed tasks.
- `daily-briefs/YYYY-MM-DD.md` stores daily brief notes and candidate tasks.
- `rules.md` tells AI assistants how to safely edit your task files.

### 2. Install And Open

1. Download the FocusDock macOS zip from the release.
2. Unzip it.
3. Move `FocusDock.app` into your `Applications` folder if you want to keep it installed.
4. Open FocusDock.
5. If macOS blocks the first launch because the app is not notarized, open it from Finder with Control-click, choose Open, then confirm.

FocusDock currently uses ad-hoc signing for personal builds. Official distribution may require Apple Developer signing and notarization.

### 3. Choose A Data Folder

On first launch, FocusDock asks you to choose a data folder. This folder is where your personal task files live.

Recommended choice:

```text
~/Documents/FocusDock
```

FocusDock will create the starter files there if they do not already exist:

```text
todo.md
rules.md
archive.md
agent-log.md
daily-briefs/
daily-briefs/README.md
daily-briefs/YYYY-MM-DD.md
```

The data folder is separate from the app bundle. Updating or replacing the app should not erase your tasks.

### 4. Use The Widget

Add a task:

1. Type the task in the input field.
2. Leave the date unset for an Inbox item, or choose a date for a scheduled Todo item.
3. Press the add button.

Complete a task:

1. Click the completion control beside an active task.
2. FocusDock moves it to `Done`.
3. The original source section is saved in a Markdown comment so the task can be restored correctly.

Restore or delete a completed task:

1. Use the restore control to move a completed task back to its active section.
2. Use the delete control only when the completed item no longer needs to stay in `todo.md`.

Lock or unlock the widget:

1. Use the lock control when you want the widget to stay quiet on the desktop.
2. Unlock it when you want to add, edit, or manage tasks.

Switch language:

1. Use the language control to switch between English and Chinese.
2. FocusDock also preserves the language style of your `todo.md` headings when it writes the file.

Enable launch at login:

1. Use the launch-at-login control in the widget.
2. In packaged macOS builds, FocusDock registers itself as a login item.

### 5. Edit `todo.md` Directly

You can edit `todo.md` with any Markdown editor. FocusDock watches the file and refreshes when external changes are saved.

Use this format:

```markdown
# Todo

## Inbox
- [ ] Confirm project deadline

## Todo
- [ ] Design review @2026-09-03

## Done
- [x] Submit weekly notes @2026-09-01 <!-- from:Todo -->
```

Rules:

- Put undated active tasks in `Inbox`.
- Put dated active tasks in `Todo`.
- Add dates with `@YYYY-MM-DD` at the end of the task.
- Keep completed tasks in `Done`.
- Do not remove `<!-- from:... -->` comments from completed tasks unless you know what you are changing.

FocusDock normalizes active tasks when it saves:

- Dated active tasks are sorted by date.
- Undated active tasks stay in `Inbox`.
- Legacy sections such as `Today`, `Future`, `Waiting`, and `Later` are read into the current structure.

### 6. Use Daily Briefs

Daily briefs live in:

```text
daily-briefs/YYYY-MM-DD.md
```

Open the daily brief from the widget. FocusDock displays the supported sections and shows candidate Todo items from the final candidate section.

Supported brief sections:

- `Today`
- `Approaching Deadlines`
- `Needs Confirmation`
- `Optional Events`
- `Trash / Ignore`
- `Todo Candidates`

Candidate task format:

```markdown
## Todo Candidates

1. `Project: confirm venue @2026-09-03`
2. `Project: draft follow-up email`
```

In the brief window, you can:

- Select candidate tasks.
- Edit candidate text before adding.
- Add selected candidates into `todo.md`.
- Dismiss today's brief reminder.

### 7. Work With An AI Assistant

FocusDock is designed so an AI assistant can help without needing access to the app UI.

Recommended assistant workflow:

1. Read `rules.md`.
2. Read `todo.md`.
3. If preparing a daily brief, create or update `daily-briefs/YYYY-MM-DD.md`.
4. Add only concise, high-confidence actions to `todo.md`.
5. Keep private context out of GitHub-facing files.

Good AI prompt:

```text
Read rules.md and todo.md. Then create today's daily brief in daily-briefs/YYYY-MM-DD.md and add only high-confidence Todo Candidates.
```

Good follow-up prompt:

```text
Review today's daily brief and add the selected candidates to todo.md using @YYYY-MM-DD dates where needed.
```

### 8. Move Or Inspect Your Data Folder

Use the file-location window from the widget to see:

- The active `todo.md` path.
- The active data folder path.

You can choose a new folder there. FocusDock copies existing template/default files when needed and then starts watching the new `todo.md`.

### 9. Troubleshooting

If the widget does not show your latest task:

1. Save `todo.md` in your editor.
2. Check that you are editing the same file shown in the file-location window.
3. Keep the three section headings present: `Inbox`, `Todo`, and `Done`.

If the daily brief is empty:

1. Check that the file name matches today's date: `YYYY-MM-DD.md`.
2. Put it inside `daily-briefs/`.
3. Use numbered list items under the supported headings.

If launch at login does not work:

1. Make sure you are using a packaged macOS app, not the development server.
2. Toggle launch at login off and on again.
3. Check macOS Login Items settings.

## 中文

### 1. FocusDock 是什么

FocusDock 是一个轻量 macOS 桌面 Todo 小组件。它把任务保存在本地 Markdown 文件 `todo.md` 中，所以你可以用小组件、文本编辑器或 AI 编程助手共同管理同一份任务数据。

它的结构刻意保持简单：

- `Inbox` / `收件箱` 保存没有日期的任务。
- `Todo` / `待办` 保存有日期的任务。
- `Done` / `完成` 保存已完成任务。
- `daily-briefs/YYYY-MM-DD.md` 保存每日早报和候选任务。
- `rules.md` 告诉 AI 助手如何安全地编辑任务文件。

### 2. 安装和打开

1. 从 release 下载 FocusDock 的 macOS zip。
2. 解压 zip。
3. 如果想长期使用，把 `FocusDock.app` 移到 `Applications` 文件夹。
4. 打开 FocusDock。
5. 如果 macOS 因为应用未公证而阻止首次打开，请在 Finder 中按住 Control 点击应用，选择“打开”，再确认打开。

FocusDock 目前使用 ad-hoc 签名，适合个人构建。正式分发给更多用户时，可能需要 Apple Developer 签名和公证。

### 3. 选择数据文件夹

首次启动时，FocusDock 会要求你选择一个数据文件夹。你的个人任务文件都会保存在这里。

推荐位置：

```text
~/Documents/FocusDock
```

如果这些文件还不存在，FocusDock 会自动创建初始文件：

```text
todo.md
rules.md
archive.md
agent-log.md
daily-briefs/
daily-briefs/README.md
daily-briefs/YYYY-MM-DD.md
```

数据文件夹和 App 本体是分开的。更新或替换 App 一般不会删除你的任务。

### 4. 使用小组件

添加任务：

1. 在输入框写下任务。
2. 不设置日期时，任务会进入收件箱；选择日期时，任务会进入待办。
3. 点击添加按钮。

完成任务：

1. 点击任务旁边的完成控件。
2. FocusDock 会把它移动到完成区。
3. 原来的来源分区会保存在 Markdown 注释里，方便以后恢复。

恢复或删除已完成任务：

1. 使用恢复控件，把完成项移回原来的活动分区。
2. 只有当你不再需要某条完成记录留在 `todo.md` 中时，才使用删除控件。

锁定或解锁小组件：

1. 想让小组件安静地停在桌面上时，使用锁定控件。
2. 需要新增、编辑或管理任务时，再解除锁定。

切换语言：

1. 使用语言控件在英文和中文界面之间切换。
2. FocusDock 写入 `todo.md` 时，会尽量保留当前任务文件标题的语言风格。

开启开机自启：

1. 在小组件里使用开机自启控件。
2. 在打包后的 macOS App 中，FocusDock 会把自己注册为登录项。

### 5. 直接编辑 `todo.md`

你可以用任何 Markdown 编辑器编辑 `todo.md`。FocusDock 会监听文件变化，并在外部保存后刷新界面。

推荐格式：

```markdown
# 待办

## 收件箱
- [ ] 确认项目截止时间

## 待办
- [ ] 设计评审 @2026-09-03

## 完成
- [x] 提交周报 @2026-09-01 <!-- from:Todo -->
```

规则：

- 没有日期的活动任务放在 `Inbox` / `收件箱`。
- 有日期的活动任务放在 `Todo` / `待办`。
- 日期写在任务末尾，格式是 `@YYYY-MM-DD`。
- 已完成任务放在 `Done` / `完成`。
- 除非你清楚自己在改什么，否则不要删除已完成任务里的 `<!-- from:... -->` 注释。

FocusDock 保存时会整理活动任务：

- 有日期的活动任务会按日期升序排序。
- 没有日期的活动任务会留在收件箱。
- 旧版的 `Today`、`Future`、`Waiting`、`Later` 等分区会被读取进当前结构。

### 6. 使用每日早报

每日早报文件位于：

```text
daily-briefs/YYYY-MM-DD.md
```

你可以从小组件打开每日早报。FocusDock 会显示支持的早报分区，并从最后的候选区读取可加入 Todo 的候选任务。

支持的早报分区：

- `今天` / `Today`
- `临近截止` / `Approaching Deadlines`
- `需要确认` / `Needs Confirmation`
- `可选活动` / `Optional Events`
- `垃圾/忽略` / `Trash / Ignore`
- `可加入 Todo 候选` / `Todo Candidates`

候选任务格式：

```markdown
## 可加入 Todo 候选

1. `项目：确认场地 @2026-09-03`
2. `项目：起草跟进邮件`
```

在早报窗口中，你可以：

- 勾选候选任务。
- 在加入前编辑候选任务文本。
- 把选中的候选任务加入 `todo.md`。
- 选择今天不再提醒。

### 7. 和 AI 助手协作

FocusDock 的设计目标之一，是让 AI 助手不需要操作 App 界面，也能安全地帮你整理任务。

推荐 AI 工作流：

1. 阅读 `rules.md`。
2. 阅读 `todo.md`。
3. 如果要准备每日早报，创建或更新 `daily-briefs/YYYY-MM-DD.md`。
4. 只把简短、高确定性的行动项加入 `todo.md`。
5. 不要把私人上下文写进面向 GitHub 的文件。

推荐提示词：

```text
请先阅读 rules.md 和 todo.md，然后创建今天的 daily-briefs/YYYY-MM-DD.md，只加入高确定性的 Todo 候选。
```

推荐后续提示词：

```text
请检查今天的每日早报，把我选中的候选任务加入 todo.md，需要日期时使用 @YYYY-MM-DD。
```

### 8. 移动或查看数据文件夹

你可以从小组件打开文件位置窗口，查看：

- 当前 `todo.md` 路径。
- 当前数据文件夹路径。

也可以在那里选择新的数据文件夹。FocusDock 会在需要时复制已有模板或默认文件，然后开始监听新位置的 `todo.md`。

### 9. 常见问题

如果小组件没有显示最新任务：

1. 确认你已经在编辑器中保存了 `todo.md`。
2. 检查你编辑的文件是否就是文件位置窗口中显示的那个文件。
3. 保持三个分区标题存在：`Inbox` / `收件箱`、`Todo` / `待办`、`Done` / `完成`。

如果每日早报为空：

1. 检查文件名是否是今天的日期：`YYYY-MM-DD.md`。
2. 确认文件位于 `daily-briefs/` 文件夹。
3. 在支持的标题下使用有序列表。

如果开机自启没有生效：

1. 确认你使用的是打包后的 macOS App，而不是开发服务器。
2. 先关闭开机自启，再重新开启。
3. 检查 macOS 的登录项设置。
