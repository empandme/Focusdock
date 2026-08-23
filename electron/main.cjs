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
const defaultTodoMarkdown = "# Todo\n\n## Inbox\n\n## Todo\n\n## Done\n";
const defaultAgentLogMarkdown = "# Agent Log\n";
const defaultStartupMode = "locked";
const briefWindowWidth = 560;
const briefWindowHeight = 680;
let todoConfig = null;
let todoFileWatcher = null;
let todoDirectoryWatcher = null;
let todoWatchPath = null;
let todoWatchTimer = null;
let todoLastSignature = null;
let todoWriteQueue = Promise.resolve();
const execFileAsync = promisify(execFile);

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

function getBundledTodoPath() {
  return path.join(getAppRootDir(), "todo.md");
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
      title: "选择 Todo 数据文件夹",
      message: "请选择 FocusDock 保存 todo.md 的文件夹。",
      buttonLabel: "使用这个文件夹",
      defaultPath: app.getPath("documents"),
      properties: ["openDirectory", "createDirectory"]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }

    const retry = await dialog.showMessageBox({
      type: "question",
      title: "需要选择数据文件夹",
      message: "FocusDock 需要一个文件夹来保存 todo.md。",
      detail: "你可以重新选择文件夹，或者退出应用。以后重新打开应用时会再次询问。",
      buttons: ["重新选择", "退出"],
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
    throw new Error("Todo data folder selection was cancelled.");
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

async function readBundledTodoSeed() {
  const bundledTodoPath = getBundledTodoPath();
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

  if (bundledTodoPath === todoPath || !(await fileExists(bundledTodoPath))) {
    return defaultTodoMarkdown;
  }

  return fs.readFile(bundledTodoPath, "utf8");
}

async function ensureDataFiles() {
  const todoPath = await getTodoPath();
  const logPath = await getLogPath();

  await fs.mkdir(path.dirname(todoPath), { recursive: true });

  if (!(await fileExists(todoPath))) {
    await fs.writeFile(todoPath, await readBundledTodoSeed(), "utf8");
  }

  if (!(await fileExists(logPath))) {
    await fs.writeFile(logPath, defaultAgentLogMarkdown, "utf8");
  }
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

  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

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
    appendAgentLog(`窗口页面加载失败：${errorCode} ${errorDescription} ${validatedUrl}`).catch(() => {});
  });

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    win.loadURL(startUrl);
  } else {
    win.loadFile(path.join(getAppRootDir(), "dist", "index.html"));
  }
}

function revealExistingOrCreateWindow() {
  const windows = BrowserWindow.getAllWindows().filter(win => !win.isDestroyed());
  if (windows.length === 0) {
    createWindow();
    return;
  }

  revealWindow(windows[0]);
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
