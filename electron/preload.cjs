const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("todoShell", {
  readTodo: () => ipcRenderer.invoke("todo:read"),
  writeTodo: markdown => ipcRenderer.invoke("todo:write", markdown),
  writeTodoSafe: (markdown, baseMarkdown) => ipcRenderer.invoke("todo:write-safe", markdown, baseMarkdown),
  getDataLocation: () => ipcRenderer.invoke("data:get-location"),
  setDataDirectory: dataDirectory => ipcRenderer.invoke("data:set-directory", dataDirectory),
  chooseDataDirectory: () => ipcRenderer.invoke("data:choose-directory"),
  openDataLocationWindow: () => ipcRenderer.invoke("data:open-location-window"),
  appendLog: message => ipcRenderer.invoke("todo:log", message),
  readTodayBrief: () => ipcRenderer.invoke("brief:read-today"),
  markBriefSeen: date => ipcRenderer.invoke("brief:mark-seen", date),
  openUserGuide: () => ipcRenderer.invoke("help:open-user-guide"),
  onTodoChanged: callback => {
    const listener = () => callback();
    ipcRenderer.on("todo:changed", listener);
    return () => ipcRenderer.removeListener("todo:changed", listener);
  },
  getLaunchSettings: () => ipcRenderer.invoke("launch:get-settings"),
  setLaunchAtLogin: enabled => ipcRenderer.invoke("launch:set-at-login", enabled),
  getWindowBounds: () => ipcRenderer.invoke("window:get-bounds"),
  moveWindowTo: (x, y) => ipcRenderer.invoke("window:move-to", x, y),
  closeCurrentWindow: () => ipcRenderer.invoke("window:close-current"),
  setWindowLocked: locked => ipcRenderer.invoke("window:set-locked", locked),
  setBriefWindowMode: open => ipcRenderer.invoke("window:set-brief-mode", open),
  setMousePassthrough: passthrough => ipcRenderer.invoke("window:set-mouse-passthrough", passthrough),
  setLockButtonRect: rect => ipcRenderer.invoke("window:set-lock-button-rect", rect)
});
