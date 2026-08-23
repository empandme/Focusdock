# Agent Log

This public log is intentionally short and contains no personal schedule, email, or account data.

## 2026-08-22 Public Release Prep

- Renamed the project to FocusDock.
- Set package name to `focusdock`.
- Set macOS bundle id to `com.william.focusdock`.
- Updated the GitHub description to: `A tiny macOS todo widget powered by Markdown and AI.`
- Added a bilingual English/Chinese README.
- Added an MIT License.
- Replaced personal `todo.md` content with sample tasks.
- Replaced the daily brief with a sample daily brief.
- Kept the app release path as source code plus a downloadable macOS app zip.
- Preserved private local history in `agent-log.private.md`, which is ignored by Git.
- Added a generated FocusDock app icon at `assets/icon.png` and `assets/icon.icns`.
- Packaged a local macOS build at `release/mac-arm64/FocusDock.app`.
- Packaged a GitHub Release zip at `release/FocusDock-0.1.0-arm64-mac.zip`.
- Verified the packaged app with `codesign --verify --deep --strict`.

## Current Architecture

- Electron main process: `electron/main.cjs`.
- Preload bridge: `electron/preload.cjs`.
- React UI: `src/App.jsx`.
- Styles: `src/styles.css`.
- Task data source: `todo.md`.
- Daily brief files: `daily-briefs/YYYY-MM-DD.md`.
- Build output: `dist/`.
- Packaged app output: `release/`.

## Validation Checklist

- Run `npm install`.
- Run `node --check electron/main.cjs`.
- Run `node --check electron/preload.cjs`.
- Run `npm run build`.
- Run `npm run package:mac`.
- Confirm `release/mac-arm64/FocusDock.app` opens locally.
- Upload the generated zip from `release/` to GitHub Releases instead of committing `release/`.
