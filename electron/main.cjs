const { app, BrowserWindow, dialog, ipcMain, screen } = require("electron");
const { execFile } = require("node:child_process");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { promisify } = require("node:util");

const projectRootDir = path.resolve(__dirname, "..");
const appDisplayName = "FocusDock";
const legacyAppDisplayNames = ["Simple Todo List with AI", "William Todo List Demo", "markdown-todo-shell"];
const defaultWindowWidth = 360;
const defaultWindowHeight = 360;
const DEFAULT_TODO_MARKDOWN = {
  en: "# Todo\n\n## Inbox\n\n## Todo\n\n## Done\n",
  zh: "# 待办\n\n## 收件箱\n\n## 待办\n\n## 完成\n"
};
const DEFAULT_DAILY_BRIEF_MARKDOWN = {
  en: `# YYYY-MM-DD Daily Brief

## Today

1. Replace this with items happening today, including time, location, relevance, and any action needed now.

## Approaching Deadlines

1. Replace this with upcoming deadlines or near-term schedule items.

## Needs Confirmation

1. Replace this with uncertain information or choices the user needs to confirm.

## Optional Events

1. Replace this with optional but valuable near-term events.

## Trash / Ignore

1. Replace this with newsletters, promotions, or information that needs no action.

## Todo Candidates

1. \`Project: action/keyword @YYYY-MM-DD\`
2. \`Project: undated action\`
`,
  zh: `# YYYY-MM-DD 每日早报

## 今天

1. 写下今天发生的事项，包括时间、地点、相关性和现在需要做的事。

## 临近截止

1. 写下即将到来的截止时间或近期安排。

## 需要确认

1. 写下不确定信息或需要用户确认的选择。

## 可选活动

1. 写下可选但有价值的近期活动。

## 垃圾/忽略

1. 写下简报、推广或无需行动的信息。

## 可加入 Todo 候选

1. \`项目：行动/关键词 @YYYY-MM-DD\`
2. \`项目：无日期行动\`
`
};
const defaultStartupMode = "locked";
const briefWindowWidth = 560;
const briefWindowHeight = 680;
const dataLocationWindowWidth = 560;
const dataLocationWindowHeight = 420;
let todoConfig = null;
let todoFileWatcher = null;
let todoDirectoryWatcher = null;
let todoWatchPath = null;
let todoWatchTimer = null;
let todoLastSignature = null;
let todoWriteQueue = Promise.resolve();
let dataLocationWindow = null;
const execFileAsync = promisify(execFile);
const NATIVE_COPY = {
  en: {
    chooseTodoDataFolderTitle: "Choose Todo Data Folder",
    chooseTodoDataFolderMessage: "Choose the folder where FocusDock should store todo.md.",
    chooseCurrentTodoDataFolderMessage: "Choose where FocusDock should store todo.md.",
    useThisFolder: "Use This Folder",
    dataFolderRequiredTitle: "Data Folder Required",
    dataFolderRequiredMessage: "FocusDock needs a folder to store todo.md.",
    dataFolderRequiredDetail: "You can choose a folder again or quit the app. FocusDock will ask again the next time it opens.",
    chooseAgain: "Choose Again",
    quit: "Quit",
    dataFolderCanceled: "Todo data folder selection was cancelled.",
    emptyDataFolder: "Data folder path cannot be empty.",
    fileLocationTitle: "File Location"
  },
  zh: {
    chooseTodoDataFolderTitle: "选择 Todo 数据文件夹",
    chooseTodoDataFolderMessage: "请选择 FocusDock 保存 todo.md 的文件夹。",
    chooseCurrentTodoDataFolderMessage: "请选择 FocusDock 保存 todo.md 的位置。",
    useThisFolder: "使用这个文件夹",
    dataFolderRequiredTitle: "需要选择数据文件夹",
    dataFolderRequiredMessage: "FocusDock 需要一个文件夹来保存 todo.md。",
    dataFolderRequiredDetail: "你可以重新选择文件夹，或者退出应用。以后重新打开应用时会再次询问。",
    chooseAgain: "重新选择",
    quit: "退出",
    dataFolderCanceled: "Todo 数据文件夹选择已取消。",
    emptyDataFolder: "数据文件夹路径不能为空。",
    fileLocationTitle: "文件位置"
  }
};

app.setName(appDisplayName);

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

function getAppRootDir() {
  return app.isPackaged ? app.getAppPath() : projectRootDir;
}

function getDataDir() {
  return app.getPath("userData");
}

function getConfigPath() {
  return path.join(getDataDir(), "config.json");
}

function getDefaultSharedTodoDirectory() {
  if (!app.isPackaged) {
    return projectRootDir;
  }

  return path.join(app.getPath("documents"), appDisplayName);
}

function getDefaultSharedTodoPath() {
  return path.join(getDefaultSharedTodoDirectory(), "todo.md");
}

function getLegacyConfigPaths() {
  const appDataDir = app.getPath("appData");
  return legacyAppDisplayNames.map(name => path.join(appDataDir, name, "config.json"));
}

function getSeedDataDir() {
  return path.join(getAppRootDir(), "seed-data");
}

function getSeedFilePath(relativePath) {
  return path.join(getSeedDataDir(), relativePath);
}

function getLocalizedSeedRelativePath(relativePath, language = getPreferredLanguage()) {
  const parsedPath = path.parse(relativePath);
  return path.join(parsedPath.dir, `${parsedPath.name}.${language}${parsedPath.ext}`);
}

function getPreferredLanguage() {
  return app.getLocale()?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function getDefaultTodoMarkdown(language = getPreferredLanguage()) {
  return DEFAULT_TODO_MARKDOWN[language] || DEFAULT_TODO_MARKDOWN.en;
}

function getDefaultDailyBriefMarkdown(language = getPreferredLanguage()) {
  return DEFAULT_DAILY_BRIEF_MARKDOWN[language] || DEFAULT_DAILY_BRIEF_MARKDOWN.en;
}

function getNativeText(key) {
  const language = getPreferredLanguage();
  return NATIVE_COPY[language]?.[key] || NATIVE_COPY.en[key] || key;
}

async function readJsonFile(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeConfig(config) {
  const normalizedConfig = normalizeConfig(config);
  await fs.mkdir(getDataDir(), { recursive: true });
  await fs.writeFile(getConfigPath(), `${JSON.stringify(normalizedConfig, null, 2)}\n`, "utf8");
  todoConfig = normalizedConfig;
  return normalizedConfig;
}

async function writeAtomicFile(filePath, content) {
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );

  await fs.writeFile(tempPath, content, "utf8");
  await fs.rename(tempPath, filePath);
}

function normalizeConfig(config = {}) {
  const dataDirectory = path.resolve(
    typeof config.dataDirectory === "string" && config.dataDirectory.trim()
      ? config.dataDirectory
      : typeof config.todoPath === "string" && config.todoPath.trim()
        ? path.dirname(config.todoPath)
        : getDefaultSharedTodoDirectory()
  );

  return {
    ...config,
    dataDirectory,
    todoPath: path.join(dataDirectory, "todo.md"),
    launchAtLogin: Boolean(config.launchAtLogin),
    startupMode: config.startupMode === "locked" ? "locked" : defaultStartupMode,
    dailyBriefSeenDate: /^\d{4}-\d{2}-\d{2}$/.test(config.dailyBriefSeenDate || "") ? config.dailyBriefSeenDate : null
  };
}

async function readValidConfig(configPath) {
  if (!(await fileExists(configPath))) {
    return null;
  }

  try {
    const config = await readJsonFile(configPath);
    if (
      typeof config.dataDirectory === "string" && config.dataDirectory.trim() ||
      typeof config.todoPath === "string" && config.todoPath.trim()
    ) {
      return normalizeConfig(config);
    }
  } catch {
    return null;
  }

  return null;
}

async function readMigratedConfig() {
  for (const configPath of getLegacyConfigPaths()) {
    const config = await readValidConfig(configPath);
    if (config) {
      return config;
    }
  }

  return null;
}

async function chooseInitialDataDirectory() {
  if (!app.isPackaged) {
    return getDefaultSharedTodoDirectory();
  }

  while (true) {
    const result = await dialog.showOpenDialog({
      title: getNativeText("chooseTodoDataFolderTitle"),
      message: getNativeText("chooseTodoDataFolderMessage"),
      buttonLabel: getNativeText("useThisFolder"),
      defaultPath: app.getPath("documents"),
      properties: ["openDirectory", "createDirectory"]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }

    const retry = await dialog.showMessageBox({
      type: "question",
      title: getNativeText("dataFolderRequiredTitle"),
      message: getNativeText("dataFolderRequiredMessage"),
      detail: getNativeText("dataFolderRequiredDetail"),
      buttons: [getNativeText("chooseAgain"), getNativeText("quit")],
      defaultId: 0,
      cancelId: 1
    });

    if (retry.response === 1) {
      return null;
    }
  }
}

async function ensureConfig() {
  if (todoConfig?.todoPath) {
    return todoConfig;
  }

  const existingConfig = await readValidConfig(getConfigPath());
  if (existingConfig) {
    return writeConfig(existingConfig);
  }

  const migratedConfig = await readMigratedConfig();
  if (migratedConfig) {
    return writeConfig(migratedConfig);
  }

  const selectedDirectory = await chooseInitialDataDirectory();
  if (!selectedDirectory) {
    throw new Error(getNativeText("dataFolderCanceled"));
  }

  return writeConfig({
    dataDirectory: selectedDirectory
  });
}

async function updateConfig(updates) {
  return writeConfig({
    ...await ensureConfig(),
    ...updates
  });
}

async function getTodoPath() {
  const config = await ensureConfig();
  return config.todoPath;
}

async function getDataLocation() {
  const config = await ensureConfig();
  return {
    dataDirectory: path.dirname(config.todoPath),
    todoPath: config.todoPath,
    dailyBriefsDirectory: await getDailyBriefsDir()
  };
}

async function getLogPath() {
  return path.join(path.dirname(await getTodoPath()), "agent-log.md");
}

async function getDailyBriefsDir() {
  return path.join(path.dirname(await getTodoPath()), "daily-briefs");
}

function getLocalDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

async function getDailyBrief(date = getLocalDateString()) {
  const briefPath = path.join(await getDailyBriefsDir(), `${date}.md`);
  const exists = await fileExists(briefPath);
  const config = await ensureConfig();

  return {
    date,
    path: briefPath,
    exists,
    markdown: exists ? await fs.readFile(briefPath, "utf8") : "",
    seenToday: config.dailyBriefSeenDate === date
  };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isDailyBriefPath(filePath) {
  return /^\d{4}-\d{2}-\d{2}\.md$/.test(path.basename(filePath)) && path.basename(path.dirname(filePath)) === "daily-briefs";
}

async function isDefaultDailyBriefFile(filePath) {
  if (!isDailyBriefPath(filePath) || !(await fileExists(filePath))) {
    return false;
  }

  const date = path.basename(filePath, ".md");
  const content = await fs.readFile(filePath, "utf8");
  return Object.values(DEFAULT_DAILY_BRIEF_MARKDOWN).some(markdown => (
    content === markdown.split("YYYY-MM-DD").join(date)
  ));
}

async function copyFileIfMissingOrDefault(sourcePath, targetPath) {
  if (!(await fileExists(sourcePath))) {
    return;
  }

  const shouldCopy = !(await fileExists(targetPath)) || await isDefaultDailyBriefFile(targetPath);
  if (!shouldCopy) {
    return;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function copyDirectoryIfMissingOrDefault(sourceDirectory, targetDirectory) {
  if (!(await fileExists(sourceDirectory))) {
    return;
  }

  await fs.mkdir(targetDirectory, { recursive: true });
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") {
      continue;
    }

    const sourcePath = path.join(sourceDirectory, entry.name);
    const targetPath = path.join(targetDirectory, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryIfMissingOrDefault(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await copyFileIfMissingOrDefault(sourcePath, targetPath);
    }
  }
}

async function readSeedFile(relativePath, fallback, replacements = {}) {
  let content = fallback;
  const language = getPreferredLanguage();
  const seedRelativePaths = [
    getLocalizedSeedRelativePath(relativePath, language),
    relativePath,
    getLocalizedSeedRelativePath(relativePath, language === "zh" ? "en" : "zh")
  ].filter((candidate, index, candidates) => candidates.indexOf(candidate) === index);

  for (const seedRelativePath of seedRelativePaths) {
    const seedPath = getSeedFilePath(seedRelativePath);
    if (await fileExists(seedPath)) {
      content = await fs.readFile(seedPath, "utf8");
      break;
    }
  }

  return Object.entries(replacements).reduce(
    (nextContent, [token, value]) => nextContent.split(token).join(value),
    content
  );
}

async function readInitialTodoMarkdown() {
  const todoPath = await getTodoPath();
  const previousPackagedTodoPaths = [
    path.join(getDataDir(), "todo.md"),
    ...legacyAppDisplayNames.map(name => path.join(app.getPath("appData"), name, "todo.md"))
  ];

  for (const previousPackagedTodoPath of previousPackagedTodoPaths) {
    if (previousPackagedTodoPath !== todoPath && await fileExists(previousPackagedTodoPath)) {
      return fs.readFile(previousPackagedTodoPath, "utf8");
    }
  }

  return readSeedFile("todo.md", getDefaultTodoMarkdown());
}

async function ensureSeedFile(targetPath, relativeSeedPath, fallback, replacements = {}) {
  if (await fileExists(targetPath)) {
    return;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, await readSeedFile(relativeSeedPath, fallback, replacements), "utf8");
}

async function ensureDataFiles() {
  const todoPath = await getTodoPath();
  const dataDirectory = path.dirname(todoPath);
  const dailyBriefsDir = await getDailyBriefsDir();
  const today = getLocalDateString();

  await fs.mkdir(dailyBriefsDir, { recursive: true });

  if (!(await fileExists(todoPath))) {
    await fs.writeFile(todoPath, await readInitialTodoMarkdown(), "utf8");
  }

  await ensureSeedFile(path.join(dataDirectory, "README.md"), "README.md", "# FocusDock Data Folder\n");
  await ensureSeedFile(path.join(dataDirectory, "rules.md"), "rules.md", "# FocusDock Agent Rules\n");
  await ensureSeedFile(
    path.join(dataDirectory, "archive.md"),
    "archive.md",
    "# Archive\n\nCompleted tasks moved out of `todo.md` Done go here.\n"
  );
  await ensureSeedFile(
    await getLogPath(),
    "agent-log.md",
    "# Agent Log\n\nRecord short notes about organization or edits performed by an AI agent. Do not store private email text or account data here.\n"
  );
  await ensureSeedFile(
    path.join(dailyBriefsDir, "README.md"),
    "daily-briefs/README.md",
    "# Daily Briefs\n"
  );
  await ensureSeedFile(
    path.join(dailyBriefsDir, `${today}.md`),
    "daily-briefs/YYYY-MM-DD.md",
    getDefaultDailyBriefMarkdown(),
    { "YYYY-MM-DD": today }
  );
}

async function changeDataDirectory(dataDirectory) {
  const trimmedDirectory = typeof dataDirectory === "string" ? dataDirectory.trim() : "";
  if (!trimmedDirectory) {
    throw new Error(getNativeText("emptyDataFolder"));
  }

  await ensureDataFiles();
  const currentTodoPath = await getTodoPath();
  const currentDataDirectory = path.dirname(currentTodoPath);
  const resolvedInputPath = path.resolve(trimmedDirectory);
  const nextDataDirectory = path.basename(resolvedInputPath).toLowerCase() === "todo.md"
    ? path.dirname(resolvedInputPath)
    : resolvedInputPath;

  if (path.resolve(currentDataDirectory) !== path.resolve(nextDataDirectory)) {
    await copyDirectoryIfMissingOrDefault(currentDataDirectory, nextDataDirectory);
  }

  await updateConfig({
    dataDirectory: nextDataDirectory
  });
  await ensureDataFiles();
  await startTodoWatcher({ force: true });
  notifyTodoChanged();

  return getDataLocation();
}

async function chooseDataDirectory(parentWindow = null) {
  const currentLocation = await getDataLocation();
  const dialogOptions = {
    title: getNativeText("chooseTodoDataFolderTitle"),
    message: getNativeText("chooseCurrentTodoDataFolderMessage"),
    buttonLabel: getNativeText("useThisFolder"),
    defaultPath: currentLocation.dataDirectory,
    properties: ["openDirectory", "createDirectory"]
  };
  const result = parentWindow && !parentWindow.isDestroyed()
    ? await dialog.showOpenDialog(parentWindow, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions);

  if (result.canceled || result.filePaths.length === 0) {
    return {
      canceled: true,
      ...currentLocation
    };
  }

  return {
    canceled: false,
    ...await changeDataDirectory(result.filePaths[0])
  };
}

async function appendAgentLog(message) {
  const logPath = await getLogPath();
  const stamp = new Date().toLocaleString("zh-CN", {
    timeZone: "America/Los_Angeles",
    hour12: false
  });
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `\n## ${stamp}\n\n- ${message}\n`, "utf8");
}

async function cleanupLegacyLoginItems() {
  if (!app.isPackaged || process.platform !== "darwin") {
    return;
  }

  for (const legacyName of legacyAppDisplayNames) {
    try {
      await execFileAsync("osascript", [
        "-e",
        `tell application "System Events" to if exists login item "${legacyName}" then delete login item "${legacyName}"`
      ]);
    } catch {
      // macOS may deny Automation access; failing to clean a legacy login item should not block launch.
    }
  }
}

async function applyLaunchAtLoginSetting(enabled) {
  if (!app.isPackaged || process.platform !== "darwin") {
    return;
  }

  await cleanupLegacyLoginItems();
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    openAsHidden: false,
    path: process.execPath
  });
}

async function syncLaunchAtLoginRegistration() {
  const config = await ensureConfig();
  await applyLaunchAtLoginSetting(config.launchAtLogin);
}

async function getLaunchSettings() {
  let config = await ensureConfig();
  const loginItemSettings = process.platform === "darwin"
    ? app.getLoginItemSettings()
    : { openAtLogin: false, wasOpenedAtLogin: false };
  const launchAtLogin = app.isPackaged ? Boolean(loginItemSettings.openAtLogin) : Boolean(config.launchAtLogin);

  if (app.isPackaged && config.launchAtLogin !== launchAtLogin) {
    config = await updateConfig({ launchAtLogin });
  }

  const wasOpenedAtLogin = Boolean(
    loginItemSettings.wasOpenedAtLogin ||
    process.env.TODO_OPENED_AT_LOGIN === "1"
  );

  return {
    launchAtLogin,
    canRegisterLaunchAtLogin: app.isPackaged && process.platform === "darwin",
    startupMode: config.startupMode,
    wasOpenedAtLogin,
    shouldStartLocked: wasOpenedAtLogin && config.startupMode === "locked"
  };
}

async function setLaunchAtLogin(enabled) {
  const nextEnabled = Boolean(enabled);
  await updateConfig({
    launchAtLogin: nextEnabled,
    startupMode: defaultStartupMode
  });

  await applyLaunchAtLoginSetting(nextEnabled);

  return getLaunchSettings();
}

async function writeTodoMarkdown(markdown, baseMarkdown) {
  await ensureDataFiles();

  const writeOperation = todoWriteQueue.catch(() => {}).then(async () => {
    const todoPath = await getTodoPath();
    const currentMarkdown = await fs.readFile(todoPath, "utf8");

    if (typeof baseMarkdown === "string" && currentMarkdown !== baseMarkdown) {
      return {
        ok: false,
        conflict: true,
        markdown: currentMarkdown
      };
    }

    await writeAtomicFile(todoPath, markdown);
    await startTodoWatcher({ force: true });
    notifyTodoChanged();
    return {
      ok: true,
      conflict: false,
      markdown
    };
  });

  todoWriteQueue = writeOperation.then(() => {}, () => {});
  return writeOperation;
}

function notifyTodoChanged() {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send("todo:changed");
    }
  });
}

async function getTodoFileSignature(todoPath) {
  try {
    const stat = await fs.stat(todoPath);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return null;
  }
}

function stopTodoWatcher() {
  if (todoFileWatcher) {
    todoFileWatcher.close();
    todoFileWatcher = null;
  }

  if (todoDirectoryWatcher) {
    todoDirectoryWatcher.close();
    todoDirectoryWatcher = null;
  }

  if (todoWatchPath) {
    fsSync.unwatchFile(todoWatchPath);
  }

  clearTimeout(todoWatchTimer);
  todoWatchTimer = null;
}

async function handleTodoWatchEvent() {
  const todoPath = await getTodoPath();
  const nextSignature = await getTodoFileSignature(todoPath);

  if (nextSignature && nextSignature !== todoLastSignature) {
    todoLastSignature = nextSignature;
    await startTodoWatcher({ force: true });
    notifyTodoChanged();
  }
}

function scheduleTodoWatchCheck() {
  clearTimeout(todoWatchTimer);
  todoWatchTimer = setTimeout(() => {
    handleTodoWatchEvent().catch(() => {});
  }, 80);
}

async function startTodoWatcher(options = {}) {
  const todoPath = await getTodoPath();
  if (!options.force && todoFileWatcher && todoDirectoryWatcher && todoWatchPath === todoPath) {
    return;
  }

  stopTodoWatcher();

  todoWatchPath = todoPath;
  todoLastSignature = await getTodoFileSignature(todoPath);

  fsSync.watchFile(todoPath, { interval: 500 }, scheduleTodoWatchCheck);

  try {
    todoFileWatcher = fsSync.watch(todoPath, scheduleTodoWatchCheck);
  } catch {
    todoFileWatcher = null;
  }

  try {
    todoDirectoryWatcher = fsSync.watch(path.dirname(todoPath), (_eventType, filename) => {
      if (!filename || filename.toString() === path.basename(todoPath)) {
        scheduleTodoWatchCheck();
      }
    });
  } catch {
    todoDirectoryWatcher = null;
  }
}

function getTopRightWindowPosition() {
  const { workArea } = screen.getPrimaryDisplay();

  return {
    x: workArea.x + workArea.width - defaultWindowWidth,
    y: workArea.y
  };
}

function clampBoundsToWorkArea(bounds, workArea) {
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;

  return {
    x: Math.min(Math.max(bounds.x, workArea.x), maxX),
    y: Math.min(Math.max(bounds.y, workArea.y), maxY),
    width,
    height
  };
}

function clampBoundsToCurrentDisplay(win, bounds) {
  const { workArea } = screen.getDisplayMatching(win.getBounds());
  return clampBoundsToWorkArea(bounds, workArea);
}

function sameBounds(a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function setClampedBounds(win, bounds, animate = false) {
  if (win.isDestroyed()) {
    return;
  }

  win.setBounds(clampBoundsToCurrentDisplay(win, bounds), animate);
}

function setBriefWindowMode(win, open) {
  if (win.isDestroyed()) {
    return null;
  }

  if (open) {
    if (!win.todoBoundsBeforeBrief) {
      win.todoBoundsBeforeBrief = win.getBounds();
    }

    const currentBounds = win.getBounds();
    const { workArea } = screen.getDisplayMatching(currentBounds);
    setClampedBounds(win, {
      x: Math.min(currentBounds.x, workArea.x + workArea.width - briefWindowWidth),
      y: Math.max(workArea.y, currentBounds.y),
      width: briefWindowWidth,
      height: briefWindowHeight
    }, true);
    return win.getBounds();
  }

  if (win.todoBoundsBeforeBrief) {
    const previousBounds = win.todoBoundsBeforeBrief;
    win.todoBoundsBeforeBrief = null;
    setClampedBounds(win, previousBounds, true);
  }

  return win.getBounds();
}

function clampWindowToScreen(win) {
  if (win.isDestroyed()) {
    return;
  }

  setClampedBounds(win, win.getBounds());
}

function setLockedWindowState(win, locked) {
  if (win.isDestroyed()) {
    return;
  }

  win.todoLocked = Boolean(locked);
  clampWindowToScreen(win);
}

function setMousePassthrough(win, passthrough) {
  if (win.isDestroyed()) {
    return;
  }

  win.setIgnoreMouseEvents(passthrough, { forward: true });
}

function stopLockHitTest(win) {
  if (win.todoLockHitTestTimer) {
    clearInterval(win.todoLockHitTestTimer);
    win.todoLockHitTestTimer = null;
  }
}

function updateLockedMousePassthrough(win) {
  if (win.isDestroyed() || !win.todoLockedForPassthrough) {
    return;
  }

  const rect = win.todoLockButtonRect;
  if (!rect) {
    setMousePassthrough(win, true);
    return;
  }

  const cursor = screen.getCursorScreenPoint();
  const insideLockButton = (
    cursor.x >= rect.x &&
    cursor.x <= rect.x + rect.width &&
    cursor.y >= rect.y &&
    cursor.y <= rect.y + rect.height
  );

  setMousePassthrough(win, !insideLockButton);
}

function setLockedMousePassthrough(win, locked) {
  if (win.isDestroyed()) {
    return;
  }

  win.todoLockedForPassthrough = locked;
  stopLockHitTest(win);

  if (!locked) {
    setMousePassthrough(win, false);
    return;
  }

  updateLockedMousePassthrough(win);
  win.todoLockHitTestTimer = setInterval(() => {
    updateLockedMousePassthrough(win);
  }, 50);
}

function revealWindow(win) {
  if (!win || win.isDestroyed()) {
    return;
  }

  if (win.isMinimized()) {
    win.restore();
  }

  win.show();
  win.moveTop();
  win.focus();
  app.focus({ steal: true });
}

function createWindow() {
  const { x, y } = getTopRightWindowPosition();

  const win = new BrowserWindow({
    width: defaultWindowWidth,
    height: defaultWindowHeight,
    x,
    y,
    minWidth: 360,
    minHeight: 280,
    backgroundColor: "#00000000",
    transparent: true,
    frame: false,
    resizable: true,
    show: false,
    title: appDisplayName,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });

  const showWindow = () => {
    if (win.isDestroyed() || win.isVisible()) {
      return;
    }

    revealWindow(win);
    win.setAlwaysOnTop(true, "floating");
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setAlwaysOnTop(false);
      }
    }, 1200);
  };

  win.once("ready-to-show", showWindow);
  win.webContents.once("did-finish-load", showWindow);
  setTimeout(showWindow, 1800);

  win.on("will-move", (event, newBounds) => {
    const clampedBounds = clampBoundsToCurrentDisplay(win, newBounds);
    if (!sameBounds(newBounds, clampedBounds)) {
      event.preventDefault();
      win.setBounds(clampedBounds);
    }
  });

  win.on("will-resize", (event, newBounds) => {
    const clampedBounds = clampBoundsToCurrentDisplay(win, newBounds);
    if (!sameBounds(newBounds, clampedBounds)) {
      event.preventDefault();
      win.setBounds(clampedBounds);
    }
  });

  win.on("moved", () => clampWindowToScreen(win));
  win.on("resized", () => clampWindowToScreen(win));
  win.on("closed", () => stopLockHitTest(win));

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    appendAgentLog(`Window page failed to load: ${errorCode} ${errorDescription} ${validatedUrl}`).catch(() => {});
  });

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    win.loadURL(startUrl);
  } else {
    win.loadFile(path.join(getAppRootDir(), "dist", "index.html"));
  }
}

function loadDataLocationWindow(win) {
  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    const url = new URL(startUrl);
    url.searchParams.set("view", "data-location");
    win.loadURL(url.toString());
    return;
  }

  win.loadFile(path.join(getAppRootDir(), "dist", "index.html"), {
    query: {
      view: "data-location"
    }
  });
}

function openDataLocationWindow() {
  if (dataLocationWindow && !dataLocationWindow.isDestroyed()) {
    revealWindow(dataLocationWindow);
    return dataLocationWindow.getBounds();
  }

  dataLocationWindow = new BrowserWindow({
    width: dataLocationWindowWidth,
    height: dataLocationWindowHeight,
    minWidth: 500,
    minHeight: 360,
    center: true,
    backgroundColor: "#080d11",
    transparent: false,
    frame: false,
    resizable: false,
    show: false,
    title: getNativeText("fileLocationTitle"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  dataLocationWindow.todoIsDataLocationWindow = true;

  dataLocationWindow.once("ready-to-show", () => revealWindow(dataLocationWindow));
  dataLocationWindow.webContents.once("did-finish-load", () => revealWindow(dataLocationWindow));
  dataLocationWindow.on("closed", () => {
    dataLocationWindow = null;
  });
  dataLocationWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    appendAgentLog(`Data location window failed to load: ${errorCode} ${errorDescription} ${validatedUrl}`).catch(() => {});
  });

  loadDataLocationWindow(dataLocationWindow);
  return dataLocationWindow.getBounds();
}

function revealExistingOrCreateWindow() {
  const todoWindows = BrowserWindow.getAllWindows().filter(win => !win.isDestroyed() && !win.todoIsDataLocationWindow);
  if (todoWindows.length === 0) {
    createWindow();
    return;
  }

  revealWindow(todoWindows[0]);
}

app.whenReady().then(async () => {
  try {
    await cleanupLegacyLoginItems();
    await ensureDataFiles();
    await syncLaunchAtLoginRegistration();
    await startTodoWatcher();
    createWindow();
  } catch (error) {
    console.error(error);
    app.quit();
    return;
  }

  app.on("activate", () => {
    revealExistingOrCreateWindow();
  });
});

app.on("second-instance", () => {
  revealExistingOrCreateWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopTodoWatcher();
});

ipcMain.handle("todo:read", async () => {
  await ensureDataFiles();
  await startTodoWatcher();
  return fs.readFile(await getTodoPath(), "utf8");
});

ipcMain.handle("todo:write", async (_event, markdown) => {
  const result = await writeTodoMarkdown(markdown);
  return result.ok;
});

ipcMain.handle("todo:write-safe", async (_event, markdown, baseMarkdown) => {
  return writeTodoMarkdown(markdown, baseMarkdown);
});

ipcMain.handle("data:get-location", async () => {
  await ensureDataFiles();
  return getDataLocation();
});

ipcMain.handle("data:set-directory", async (_event, dataDirectory) => {
  return changeDataDirectory(dataDirectory);
});

ipcMain.handle("data:choose-directory", async event => {
  return chooseDataDirectory(BrowserWindow.fromWebContents(event.sender));
});

ipcMain.handle("data:open-location-window", () => {
  return openDataLocationWindow();
});

ipcMain.handle("todo:log", async (_event, message) => {
  await appendAgentLog(message);
  return true;
});

ipcMain.handle("brief:read-today", async () => {
  await ensureDataFiles();
  return getDailyBrief();
});

ipcMain.handle("brief:mark-seen", async (_event, date) => {
  const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : getLocalDateString();
  await updateConfig({ dailyBriefSeenDate: targetDate });
  return true;
});

ipcMain.handle("launch:get-settings", async () => {
  return getLaunchSettings();
});

ipcMain.handle("launch:set-at-login", async (_event, enabled) => {
  return setLaunchAtLogin(enabled);
});

ipcMain.handle("window:get-bounds", event => {
  return BrowserWindow.fromWebContents(event.sender)?.getBounds();
});

ipcMain.handle("window:move-to", (event, x, y) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  const bounds = win.getBounds();
  const nextBounds = {
    ...bounds,
    x: Math.round(x),
    y: Math.round(y)
  };
  setClampedBounds(win, nextBounds);
  return win.getBounds();
});

ipcMain.handle("window:close-current", event => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return false;
  }

  win.close();
  return true;
});

ipcMain.handle("window:set-locked", (event, locked) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  setLockedWindowState(win, locked);
  return win.getBounds();
});

ipcMain.handle("window:set-mouse-passthrough", (event, passthrough) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return false;
  }

  setLockedMousePassthrough(win, Boolean(passthrough));
  return true;
});

ipcMain.handle("window:set-brief-mode", (event, open) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return null;
  }

  return setBriefWindowMode(win, Boolean(open));
});

ipcMain.handle("window:set-lock-button-rect", (event, rect) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !rect) {
    return false;
  }

  const bounds = win.getBounds();
  win.todoLockButtonRect = {
    x: Math.round(bounds.x + rect.x),
    y: Math.round(bounds.y + rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
  updateLockedMousePassthrough(win);
  return true;
});
