# FocusDock

> A tiny macOS todo widget powered by Markdown and AI.
>
> 一个由 Markdown 和 AI 协作驱动的轻量 macOS 桌面 Todo 小组件。

FocusDock is a lightweight macOS desktop todo widget built with Electron, React, and Vite. It keeps tasks in a local `todo.md` file, so both you and AI coding assistants can read, edit, summarize, and reorganize the same source of truth.

FocusDock 是一个使用 Electron、React 和 Vite 构建的轻量 macOS 桌面 Todo 小组件。它把任务保存在本地 `todo.md` 文件中，让用户和 AI 编程助手可以围绕同一份任务数据进行读取、编辑、总结和整理。

## Features / 功能

- Small transparent widget designed to sit near the top-right of the desktop.
- 适合停靠在桌面右上角的小型透明小组件。
- Markdown-first storage with `todo.md` as the only task source.
- 以 Markdown 为核心，`todo.md` 是唯一任务来源。
- Inbox, Todo, and Done sections.
- 支持 Inbox、Todo 和 Done 三个分区。
- Date syntax with `@YYYY-MM-DD`; dated tasks are sorted ascending.
- 使用 `@YYYY-MM-DD` 标记日期，有日期的任务按时间升序排列。
- Daily brief files in `daily-briefs/YYYY-MM-DD.md`.
- 每日早报文件保存在 `daily-briefs/YYYY-MM-DD.md`。
- Candidate tasks from a daily brief can be edited and added to `todo.md`.
- 每日早报里的候选任务可以先编辑，再加入 `todo.md`。
- Lock mode for a quieter desktop widget experience.
- 支持锁定模式，让小组件更安静地停留在桌面上。
- File watching, atomic writes, and safe-write checks to reduce accidental overwrites.
- 支持文件监听、原子写入和安全写入检查，降低误覆盖风险。
- File-location window for viewing and changing the active data folder.
- 支持通过文件位置窗口查看和切换当前数据文件夹。
- English/Chinese runtime interface support.
- 支持英文和中文运行界面。
- macOS packaging with Electron Builder.
- 使用 Electron Builder 打包 macOS App。

## Project Structure / 项目结构

```text
.
├── electron/          # Electron main process and preload scripts
├── src/               # React UI
├── scripts/           # Local development scripts
├── seed-data/         # Templates copied into a new user's data folder
├── daily-briefs/      # Daily brief markdown files
├── todo.md            # Single source of truth for tasks
├── rules.md           # Task and brief writing rules
├── agent-log.md       # Development and operation log
├── archive.md         # Archived completed tasks
├── LICENSE
└── package.json
```

## Development / 本地开发

Install dependencies:

安装依赖：

```bash
npm install
```

Run the development app:

启动开发版：

```bash
npm run dev
```

Build the frontend:

构建前端：

```bash
npm run build
```

## macOS App / macOS 应用

Build a local macOS app:

打包本地 macOS App：

```bash
npm run package:mac
```

The packaged app is generated under `release/`, usually as:

打包产物会生成在 `release/` 下，通常包括：

```text
release/mac-arm64/FocusDock.app
release/FocusDock-0.1.0-arm64-mac.zip
```

`release/`, `dist/`, and `node_modules/` are generated files and should not be committed to GitHub. For GitHub Releases, upload the generated zip instead of committing it to the repository.

`release/`、`dist/` 和 `node_modules/` 是可再生成文件，不应该提交到 GitHub。发布 GitHub Release 时，请上传生成的 zip，不要把 `release/` 提交到仓库。

This project currently uses ad-hoc signing for personal macOS builds. Official distribution to other users may require an Apple Developer account, code signing, and notarization.

当前项目使用 ad-hoc 签名，适合个人 macOS 构建。若要正式分发给其他用户，可能需要 Apple Developer 账号、正式签名和公证。

## Data Files / 数据文件

Packaged apps store user data outside the app bundle. The bundled `seed-data/` folder only provides templates for new data folders.

打包后的 App 会把用户数据保存在 App 包外。内置的 `seed-data/` 文件夹只作为新数据文件夹的模板来源。

## Todo Format / Todo 格式

```markdown
# Todo

## Inbox
- [ ] Confirm project deadline / 确认项目截止时间

## Todo
- [ ] Design review / 设计评审 @2026-09-03

## Done
- [x] Submit weekly notes / 提交每周笔记 @2026-09-01 <!-- from:Todo -->
```
