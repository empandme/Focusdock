# FocusDock

> A tiny macOS todo widget powered by Markdown and AI.

FocusDock is a lightweight macOS desktop todo widget built with Electron, React, and Vite. It keeps tasks in a local `todo.md` file, so both you and AI coding assistants can read, edit, summarize, and reorganize the same source of truth.

FocusDock 是一个轻量的 macOS 桌面 Todo 小窗，使用 Electron、React 和 Vite 构建。它把任务保存在本地 `todo.md`，方便用户和 AI 助手共同读取、整理、压缩和更新同一份任务数据。授予AI助手修改文件和gmail的权限，让AI帮你整理桌面和待办事项。

## Features / 功能

- Small transparent widget designed to sit near the top-right of the desktop.
- Markdown-first storage with `todo.md` as the only task source.
- Inbox, Todo, and Done sections.
- Date syntax with `@YYYY-MM-DD`; dated tasks are sorted ascending.
- Daily brief files in `daily-briefs/YYYY-MM-DD.md`.
- Candidate tasks from a daily brief can be edited and added to `todo.md`.
- Lock mode for a quieter desktop widget experience.
- File watching, atomic writes, and safe-write checks to reduce accidental overwrites.
- macOS packaging with Electron Builder.

- 透明无边框小窗，默认适合停靠在桌面右上角。
- 以 Markdown 为核心，`todo.md` 是唯一任务来源。
- 支持 Inbox、Todo、Done 三个分区。
- 使用 `@YYYY-MM-DD` 记录日期，有日期任务按时间升序排列。
- 每日早报保存在 `daily-briefs/YYYY-MM-DD.md`。
- 早报候选任务可以先编辑，再加入 `todo.md`。
- 支持锁定模式，让小窗更像桌面挂件。
- 支持文件监听、原子写入和并发写入保护。
- 支持通过 Electron Builder 打包 macOS App。

## Project Structure / 项目结构

```text
.
├── electron/          # Electron main process and preload scripts
├── src/               # React UI
├── scripts/           # Local development scripts
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

## macOS App / macOS 应用打包

Build a local macOS app:

打包本地 macOS App：

```bash
npm run package:mac
```

The packaged app is generated under `release/`, usually as:

打包产物会生成在 `release/`，通常包括：

```text
release/mac-arm64/FocusDock.app
release/FocusDock-0.1.0-arm64-mac.zip
```

`release/`, `dist/`, and `node_modules/` are generated files and should not be committed to GitHub. For GitHub Releases, upload the generated zip instead of committing it to the repository.

`release/`、`dist/` 和 `node_modules/` 都是可再生成内容，不应该提交到 GitHub。发布 GitHub Release 时，上传生成的 zip 即可，不要把它放进源码提交。

This project currently uses ad-hoc signing for personal macOS builds. Official distribution to other users may require an Apple Developer account, code signing, and notarization.

当前项目使用 ad-hoc 签名，适合个人自用构建。如果要正式分发给其他 macOS 用户，可能需要 Apple Developer 账号、正式签名和公证。

## Todo Format / Todo 格式

```markdown
# Todo

## Inbox
- [ ] Confirm project deadline

## Todo
- [ ] Design review @2026-09-03

## Done
- [x] Submit weekly notes @2026-09-01 <!-- from:Todo -->
```
