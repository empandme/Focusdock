import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const SECTION_ORDER = ["Inbox", "Todo", "Done"];
const ACTIVE_SECTIONS = ["Todo", "Inbox"];
const TODO_SECTION_DEFINITIONS = [
  { key: "Inbox", headings: ["Inbox", "收件箱"] },
  { key: "Todo", headings: ["Todo", "待办"] },
  { key: "Done", headings: ["Done", "完成", "已完成"] }
];
const TODO_SECTION_TITLES = {
  en: { Inbox: "Inbox", Todo: "Todo", Done: "Done", documentTitle: "Todo" },
  zh: { Inbox: "收件箱", Todo: "待办", Done: "完成", documentTitle: "待办" }
};
const LEGACY_SECTION_MAP = {
  Today: "Todo",
  Future: "Todo",
  Waiting: "Todo",
  Later: "Todo"
};
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INLINE_DATE_PATTERN = /(?:^|\s)@(\d{4}-\d{2}-\d{2})\s*$/;
const BRIEF_SECTION_DEFINITIONS = [
  { key: "today", titleKey: "brief.section.today", headings: ["今天", "Today"] },
  { key: "approachingDeadlines", titleKey: "brief.section.approachingDeadlines", headings: ["临近截止", "Approaching Deadlines"] },
  { key: "needsConfirmation", titleKey: "brief.section.needsConfirmation", headings: ["需要确认", "Needs Confirmation"] },
  { key: "optionalEvents", titleKey: "brief.section.optionalEvents", headings: ["可选活动", "Optional Events"] },
  { key: "trashIgnore", titleKey: "brief.section.trashIgnore", headings: ["垃圾/忽略", "Trash / Ignore"] }
];
const BRIEF_CANDIDATE_KEY = "todoCandidates";
const BRIEF_CANDIDATE_SECTION = "可加入 Todo 候选";
const BRIEF_CANDIDATE_HEADINGS = [BRIEF_CANDIDATE_SECTION, "Todo Candidates"];
const SUPPORTED_LANGUAGES = ["en", "zh"];
const LANGUAGE_STORAGE_KEY = "focusdock-language";
const COPY = {
  en: {
    "app.taskSections": "Task sections",
    "app.todo": "Todo",
    "app.done": "Done",
    "app.inbox": "Inbox",
    "app.fileLocation": "File Location",
    "app.openFileLocation": "Open file location",
    "app.dailyBrief": "Daily Brief",
    "app.openDailyBrief": "Open daily brief",
    "app.enableLaunchAtLogin": "Enable launch at login",
    "app.disableLaunchAtLogin": "Disable launch at login",
    "app.lockWindow": "Lock window",
    "app.unlockWindow": "Unlock window",
    "app.writeTodo": "Write a new Todo",
    "app.chooseTaskDate": "Choose task date",
    "app.noDate": "No date",
    "app.addTask": "Add task",
    "app.completeTask": "Complete task",
    "app.restoreTask": "Restore task",
    "app.deleteCompletedTask": "Delete completed task",
    "app.languageToggle": "Switch to Chinese",
    "status.updatedExternally": "Updated externally, refreshed",
    "status.saved": "Saved",
    "status.addedItems": "Added {count} {itemLabel}",
    "status.item": "item",
    "status.items": "items",
    "status.candidatesAlreadyExist": "Candidates already exist in Todo",
    "status.launchAtLoginEnabled": "Launch at login enabled",
    "status.launchAtLoginDisabled": "Launch at login disabled",
    "brief.aria": "Daily Brief",
    "brief.close": "Close brief",
    "brief.titleSuffix": "Brief",
    "brief.section.today": "Today",
    "brief.section.approachingDeadlines": "Approaching Deadlines",
    "brief.section.needsConfirmation": "Needs Confirmation",
    "brief.section.optionalEvents": "Optional Events",
    "brief.section.trashIgnore": "Trash / Ignore",
    "brief.candidates": "Todo Candidates",
    "brief.editCandidate": "Edit candidate {id}",
    "brief.noCandidates": "No Todo candidates for today.",
    "brief.noBriefTitle": "No brief yet today",
    "brief.noBriefBody": "Once automation generates one, it will appear here without opening the Markdown file.",
    "brief.dismissToday": "Do not remind me today",
    "brief.addSelected": "Add {count} {itemLabel}",
    "data.storage": "Storage",
    "data.fileLocation": "File Location",
    "data.close": "Close file location",
    "data.todoFile": "Todo file",
    "data.dataFolder": "Data folder",
    "data.choose": "Choose",
    "data.save": "Save",
    "data.saving": "Saving",
    "data.pathUpdated": "Path updated",
    "data.pathUpdateFailed": "Path update failed"
  },
  zh: {
    "app.taskSections": "任务分区",
    "app.todo": "待办",
    "app.done": "完成",
    "app.inbox": "收件箱",
    "app.fileLocation": "文件位置",
    "app.openFileLocation": "打开文件位置",
    "app.dailyBrief": "每日早报",
    "app.openDailyBrief": "打开每日早报",
    "app.enableLaunchAtLogin": "开启开机自启",
    "app.disableLaunchAtLogin": "关闭开机自启",
    "app.lockWindow": "锁定界面",
    "app.unlockWindow": "解除锁定",
    "app.writeTodo": "写下新的 Todo",
    "app.chooseTaskDate": "选择任务日期",
    "app.noDate": "不设置日期",
    "app.addTask": "添加任务",
    "app.completeTask": "完成任务",
    "app.restoreTask": "恢复任务",
    "app.deleteCompletedTask": "删除已完成任务",
    "app.languageToggle": "切换到英文",
    "status.updatedExternally": "外部已更新，已刷新",
    "status.saved": "已保存",
    "status.addedItems": "已加入 {count} 项",
    "status.item": "项",
    "status.items": "项",
    "status.candidatesAlreadyExist": "候选已在 Todo 中",
    "status.launchAtLoginEnabled": "已开启自启",
    "status.launchAtLoginDisabled": "已关闭自启",
    "brief.aria": "每日早报",
    "brief.close": "关闭早报",
    "brief.titleSuffix": "早报",
    "brief.section.today": "今天",
    "brief.section.approachingDeadlines": "临近截止",
    "brief.section.needsConfirmation": "需要确认",
    "brief.section.optionalEvents": "可选活动",
    "brief.section.trashIgnore": "垃圾/忽略",
    "brief.candidates": "可加入 Todo 候选",
    "brief.editCandidate": "编辑候选 {id}",
    "brief.noCandidates": "今天没有 Todo 候选。",
    "brief.noBriefTitle": "今天还没有早报",
    "brief.noBriefBody": "自动化生成后，这里会直接显示内容，不需要再打开 Markdown 文件。",
    "brief.dismissToday": "今天不再提醒",
    "brief.addSelected": "加入 {count} 项",
    "data.storage": "存储",
    "data.fileLocation": "文件位置",
    "data.close": "关闭文件位置",
    "data.todoFile": "Todo 文件",
    "data.dataFolder": "数据文件夹",
    "data.choose": "选择",
    "data.save": "保存",
    "data.saving": "保存中",
    "data.pathUpdated": "路径已更新",
    "data.pathUpdateFailed": "路径更新失败"
  }
};

function getInitialLanguage() {
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(storedLanguage)) {
    return storedLanguage;
  }

  return navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function translate(language, key, replacements = {}) {
  const template = COPY[language]?.[key] || COPY.en[key] || key;
  return Object.entries(replacements).reduce(
    (next, [name, value]) => next.split(`{${name}}`).join(String(value)),
    template
  );
}

function normalizeSection(section) {
  if (LEGACY_SECTION_MAP[section]) {
    return LEGACY_SECTION_MAP[section];
  }

  return TODO_SECTION_DEFINITIONS.find(definition => definition.headings.includes(section))?.key || null;
}

function getTodoHeadingLanguage(heading) {
  if (TODO_SECTION_DEFINITIONS.some(definition => definition.headings[0] === heading)) {
    return "en";
  }

  if (TODO_SECTION_DEFINITIONS.some(definition => definition.headings.slice(1).includes(heading))) {
    return "zh";
  }

  return null;
}

function detectTodoLanguage(markdown) {
  const scores = { en: 0, zh: 0 };

  for (const line of markdown.split(/\r?\n/)) {
    const title = line.match(/^#\s+(.+?)\s*$/);
    if (title && title[1].trim() === TODO_SECTION_TITLES.zh.documentTitle) {
      scores.zh += 1;
    }

    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (!heading) {
      continue;
    }

    const language = getTodoHeadingLanguage(heading[1].trim());
    if (language) {
      scores[language] += 1;
    }
  }

  return scores.zh > scores.en ? "zh" : "en";
}

function emptySections() {
  return SECTION_ORDER.reduce((acc, section) => {
    acc[section] = [];
    return acc;
  }, {});
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTaskMetadata(rawText) {
  const metadata = {};
  for (const match of rawText.matchAll(/<!--\s*([\s\S]*?)\s*-->/g)) {
    const body = match[1];
    const sourceSection = body.match(/from:([^\s]+)/);
    const dueDate = body.match(/\bdue:(\d{4}-\d{2}-\d{2})\b/);

    if (sourceSection) {
      metadata.sourceSection = normalizeSection(sourceSection[1]);
    }
    if (dueDate && DATE_PATTERN.test(dueDate[1])) {
      metadata.dueDate = dueDate[1];
    }
  }

  return metadata;
}

function stripMetadata(rawText) {
  return rawText.replace(/\s*<!--[\s\S]*?-->/g, "").trim();
}

function parseTaskContent(rawText) {
  const metadata = parseTaskMetadata(rawText);
  let text = stripMetadata(rawText);
  let dueDate = metadata.dueDate;
  const inlineDate = text.match(INLINE_DATE_PATTERN);

  if (inlineDate && DATE_PATTERN.test(inlineDate[1])) {
    dueDate = inlineDate[1];
    text = text.replace(INLINE_DATE_PATTERN, "").trim();
  }

  return {
    dueDate,
    sourceSection: metadata.sourceSection,
    text
  };
}

function getDisplayDate(dateString) {
  if (!DATE_PATTERN.test(dateString || "")) {
    return "";
  }

  const [, month, day] = dateString.split("-");
  return `${Number(month)}.${Number(day)}`;
}

function sortActiveTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    if (a.dueDate && !b.dueDate) {
      return -1;
    }

    if (!a.dueDate && b.dueDate) {
      return 1;
    }

    return 0;
  });
}

function normalizeSections(sections) {
  const activeTasks = [
    ...(sections.Todo || []),
    ...(sections.Inbox || [])
  ];

  return {
    ...sections,
    Todo: sortActiveTasks(activeTasks.filter(task => task.dueDate).map(task => ({
      ...task,
      sourceSection: "Todo"
    }))),
    Inbox: activeTasks.filter(task => !task.dueDate).map(task => ({
      ...task,
      sourceSection: "Inbox"
    })),
    Done: sections.Done || []
  };
}

function parseTodo(markdown) {
  const sections = emptySections();
  let current = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      const headingName = heading[1].trim();
      const section = normalizeSection(headingName);
      current = section ? { section, headingName } : null;
      continue;
    }

    const task = line.match(/^-\s+\[([ xX])\]\s+(.+?)\s*$/);
    if (task && current) {
      const parsed = parseTaskContent(task[2]);
      const dueDate = parsed.dueDate || (current.headingName === "Today" ? getLocalDateString() : undefined);
      const targetSection = current.section === "Done"
        ? "Done"
        : dueDate ? "Todo" : "Inbox";
      const sourceSection = current.section === "Done"
        ? normalizeSection(parsed.sourceSection) || (dueDate ? "Todo" : "Inbox")
        : targetSection;

      sections[targetSection].push({
        id: crypto.randomUUID(),
        checked: task[1].toLowerCase() === "x",
        dueDate,
        sourceSection,
        text: parsed.text
      });
    }
  }

  return normalizeSections(sections);
}

function serializeTodo(sections, todoLanguage = "en") {
  const titles = TODO_SECTION_TITLES[todoLanguage] || TODO_SECTION_TITLES.en;
  const lines = [`# ${titles.documentTitle}`, ""];

  SECTION_ORDER.forEach((section, sectionIndex) => {
    lines.push(`## ${titles[section]}`);
    const tasks = sections[section] || [];
    tasks.forEach(task => {
      const checked = section === "Done" || task.checked ? "x" : " ";
      const metadata = [];
      if (section === "Done") {
        metadata.push(`from:${normalizeSection(task.sourceSection) || (task.dueDate ? "Todo" : "Inbox")}`);
      }
      const inlineDate = task.dueDate && DATE_PATTERN.test(task.dueDate) ? ` @${task.dueDate}` : "";
      const comment = metadata.length > 0 ? ` <!-- ${metadata.join(" ")} -->` : "";
      lines.push(`- [${checked}] ${task.text}${inlineDate}${comment}`);
    });
    if (sectionIndex < SECTION_ORDER.length - 1) {
      lines.push("");
    }
  });

  return `${lines.join("\n")}\n`;
}

function normalizeBriefHeading(heading) {
  if (BRIEF_CANDIDATE_HEADINGS.includes(heading)) {
    return BRIEF_CANDIDATE_KEY;
  }

  return BRIEF_SECTION_DEFINITIONS.find(section => section.headings.includes(heading))?.key || heading;
}

function parseDailyBrief(markdown) {
  const sections = {};
  const candidates = [];
  let current = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = normalizeBriefHeading(heading[1].trim());
      if (current !== BRIEF_CANDIDATE_KEY && !sections[current]) {
        sections[current] = [];
      }
      continue;
    }

    if (!current) {
      continue;
    }

    const candidate = line.match(/^(\d+)\.\s+`([^`]+)`/);
    if (current === BRIEF_CANDIDATE_KEY && candidate) {
      candidates.push({
        id: candidate[1],
        text: candidate[2].trim()
      });
      continue;
    }

    const item = line.match(/^\d+\.\s+(.+?)\s*$/);
    if (item && current !== BRIEF_CANDIDATE_KEY) {
      sections[current].push(item[1].trim());
    }
  }

  return { sections, candidates };
}

function hasSameTask(sections, candidate) {
  const parsed = parseTaskContent(candidate);
  return ACTIVE_SECTIONS.some(section => (
    sections[section].some(task => task.text === parsed.text && (task.dueDate || "") === (parsed.dueDate || ""))
  ));
}

function getCandidateDrafts(markdown) {
  return parseDailyBrief(markdown).candidates.reduce((drafts, candidate) => {
    drafts[candidate.id] = candidate.text;
    return drafts;
  }, {});
}

function DailyBriefOverlay({
  t,
  brief,
  selectedIds,
  candidateDrafts,
  onToggleCandidate,
  onCandidateTextChange,
  onAddSelected,
  onClose,
  onDismissToday
}) {
  const parsedBrief = useMemo(() => parseDailyBrief(brief?.markdown || ""), [brief]);
  const hasContent = Boolean(brief?.exists && brief.markdown);
  const selectedCount = selectedIds.length;
  const itemLabel = selectedCount === 1 ? t("status.item") : t("status.items");

  return (
    <div className="brief-overlay" role="dialog" aria-modal="true" aria-label={t("brief.aria")}>
      <div className="brief-panel">
        <header className="brief-header">
          <div>
            <p className="brief-kicker">{t("app.dailyBrief")}</p>
            <h1>{brief?.date || getLocalDateString()} {t("brief.titleSuffix")}</h1>
          </div>
          <button className="brief-icon-button" aria-label={t("brief.close")} onClick={onClose}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m4.2 3.1 3.8 3.8 3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />
            </svg>
          </button>
        </header>

        <div className="brief-body">
          {hasContent ? (
            <>
              {BRIEF_SECTION_DEFINITIONS.map(section => (
                parsedBrief.sections[section.key]?.length > 0 && (
                  <section className="brief-section" key={section.key}>
                    <h2>{t(section.titleKey)}</h2>
                    <ul>
                      {parsedBrief.sections[section.key].map((item, index) => (
                        <li key={`${section.key}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )
              ))}

              <section className="brief-section brief-candidates">
                <h2>{t("brief.candidates")}</h2>
                {parsedBrief.candidates.length > 0 ? (
                  <div className="candidate-list">
                    {parsedBrief.candidates.map(candidate => (
                      <div className="candidate-row" key={candidate.id}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(candidate.id)}
                          onChange={() => onToggleCandidate(candidate.id)}
                        />
                        <span className="candidate-number">{candidate.id}</span>
                        <input
                          className="candidate-text-input"
                          aria-label={t("brief.editCandidate", { id: candidate.id })}
                          value={candidateDrafts[candidate.id] ?? candidate.text}
                          onChange={event => onCandidateTextChange(candidate.id, event.target.value)}
                          onFocus={() => {
                            if (!selectedIds.includes(candidate.id)) {
                              onToggleCandidate(candidate.id);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="brief-empty">{t("brief.noCandidates")}</p>
                )}
              </section>
            </>
          ) : (
            <div className="brief-empty-state">
              <h2>{t("brief.noBriefTitle")}</h2>
              <p>{t("brief.noBriefBody")}</p>
            </div>
          )}
        </div>

        <footer className="brief-footer">
          <button className="brief-secondary-button" onClick={onDismissToday}>
            {t("brief.dismissToday")}
          </button>
          <button
            className="brief-primary-button"
            disabled={!hasContent || selectedCount === 0}
            onClick={() => onAddSelected(parsedBrief.candidates)}
          >
            {t("brief.addSelected", { count: selectedCount, itemLabel })}
          </button>
        </footer>
      </div>
    </div>
  );
}

function DataLocationSettings({ t, onClose }) {
  const [location, setLocation] = useState(null);
  const [draftDirectory, setDraftDirectory] = useState("");
  const [saving, setSaving] = useState(false);
  const [panelStatus, setPanelStatus] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      const nextLocation = await window.todoShell.getDataLocation();
      if (!mounted) {
        return;
      }

      setLocation(nextLocation);
      setDraftDirectory(nextLocation.dataDirectory || "");
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  const showPanelStatus = useCallback(message => {
    setPanelStatus(message);
    window.setTimeout(() => setPanelStatus(""), 1800);
  }, []);

  const chooseDataDirectory = useCallback(async () => {
    setSaving(true);
    try {
      const nextLocation = await window.todoShell.chooseDataDirectory();
      if (!nextLocation.canceled) {
        setLocation(nextLocation);
        setDraftDirectory(nextLocation.dataDirectory || "");
        showPanelStatus(t("data.pathUpdated"));
      }
    } catch {
      showPanelStatus(t("data.pathUpdateFailed"));
    } finally {
      setSaving(false);
    }
  }, [showPanelStatus, t]);

  const saveDataDirectory = useCallback(async () => {
    const nextDirectory = draftDirectory.trim();
    if (!nextDirectory) {
      return;
    }

    setSaving(true);
    try {
      const nextLocation = await window.todoShell.setDataDirectory(nextDirectory);
      setLocation(nextLocation);
      setDraftDirectory(nextLocation.dataDirectory || "");
      showPanelStatus(t("data.pathUpdated"));
    } catch {
      showPanelStatus(t("data.pathUpdateFailed"));
    } finally {
      setSaving(false);
    }
  }, [draftDirectory, showPanelStatus, t]);

  return (
    <main className="data-location-window">
      <div className="data-location-panel">
        <header className="data-location-header">
          <div>
            <p className="data-location-kicker">{t("data.storage")}</p>
            <h1>{t("data.fileLocation")}</h1>
          </div>
          <button className="data-location-icon-button" aria-label={t("data.close")} onClick={onClose}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m4.2 3.1 3.8 3.8 3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />
            </svg>
          </button>
        </header>

        <div className="data-location-body">
          <label className="data-location-field">
            <span>{t("data.todoFile")}</span>
            <textarea value={location?.todoPath || ""} readOnly rows={3} />
          </label>

          <label className="data-location-field">
            <span>{t("data.dataFolder")}</span>
            <input
              value={draftDirectory}
              onChange={event => setDraftDirectory(event.target.value)}
              spellCheck="false"
            />
          </label>
        </div>

        <footer className="data-location-footer">
          <span className="data-location-status">{panelStatus}</span>
          <button className="data-location-secondary-button" onClick={chooseDataDirectory} disabled={saving}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M1.8 4.4c0-.8.6-1.4 1.4-1.4h3.1l1.3 1.4h5.2c.8 0 1.4.6 1.4 1.4v6.1c0 .8-.6 1.4-1.4 1.4H3.2c-.8 0-1.4-.6-1.4-1.4z" />
            </svg>
            {t("data.choose")}
          </button>
          <button className="data-location-primary-button" onClick={saveDataDirectory} disabled={saving || !draftDirectory.trim()}>
            {saving ? t("data.saving") : t("data.save")}
          </button>
        </footer>
      </div>
    </main>
  );
}

function TaskItem({ t, task, section, onToggle, onTextChange, onDeleteDone }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const isDoneSection = section === "Done";

  useEffect(() => {
    setDraft(task.text);
  }, [task.text]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== task.text) {
      onTextChange(section, task.id, next);
    }
  };

  return (
    <div className={`task-row ${task.checked ? "is-done" : ""} ${task.dueDate ? "has-date" : ""} ${isDoneSection ? "can-delete" : ""}`}>
      <button
        className="check-button"
        aria-label={task.checked ? t("app.restoreTask") : t("app.completeTask")}
        onClick={() => onToggle(section, task.id)}
      >
        <span />
      </button>

      {editing && !isDoneSection ? (
        <input
          className="task-edit"
          value={draft}
          autoFocus
          onBlur={commit}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              commit();
            }
            if (event.key === "Escape") {
              setDraft(task.text);
              setEditing(false);
            }
          }}
        />
      ) : isDoneSection ? (
        <span className="task-text task-text-readonly">
          {task.text}
        </span>
      ) : (
        <button className="task-text" onClick={() => setEditing(true)}>
          {task.text}
        </button>
      )}

      {task.dueDate && (
        <span className="task-date" title={task.dueDate}>
          {getDisplayDate(task.dueDate)}
        </span>
      )}

      {isDoneSection && (
        <button
          className="delete-done-button"
          aria-label={t("app.deleteCompletedTask")}
          onMouseDown={event => event.preventDefault()}
          onClick={() => onDeleteDone(task.id)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m4.2 3.1 3.8 3.8 3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function App({ language, t, onToggleLanguage }) {
  const [sections, setSections] = useState(emptySections);
  const [activeTab, setActiveTab] = useState("Todo");
  const [newTask, setNewTask] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(getLocalDateString);
  const [newTaskDateMode, setNewTaskDateMode] = useState("dated");
  const [status, setStatus] = useState("");
  const [locked, setLocked] = useState(false);
  const [launchAtLogin, setLaunchAtLogin] = useState(false);
  const [dailyBrief, setDailyBrief] = useState(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [selectedBriefCandidates, setSelectedBriefCandidates] = useState([]);
  const [briefCandidateDrafts, setBriefCandidateDrafts] = useState({});
  const saveTimer = useRef(null);
  const currentMarkdownRef = useRef("");
  const dateInputRef = useRef(null);
  const dragState = useRef(null);
  const lockResizeTimer = useRef(null);
  const lockButtonRef = useRef(null);
  const taskListRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadTodo = async () => {
      const markdown = await window.todoShell.readTodo();
      if (mounted) {
        const parsedSections = parseTodo(markdown);
        currentMarkdownRef.current = markdown;
        setSections(parsedSections);
      }
    };

    loadTodo();
    const unsubscribe = window.todoShell.onTodoChanged(loadTodo);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDailyBrief = async () => {
      const brief = await window.todoShell.readTodayBrief();
      if (!mounted) {
        return;
      }

      setDailyBrief(brief);
      setBriefCandidateDrafts(getCandidateDrafts(brief.markdown || ""));
      if (brief.exists && !brief.seenToday) {
        setLocked(false);
        setBriefOpen(true);
        window.todoShell.setMousePassthrough(false);
        window.todoShell.setBriefWindowMode(true);
      }
    };

    loadDailyBrief();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadLaunchSettings = async () => {
      const settings = await window.todoShell.getLaunchSettings();
      if (!mounted) {
        return;
      }

      setLaunchAtLogin(Boolean(settings.launchAtLogin));
      if (settings.shouldStartLocked) {
        setLocked(true);
      }
    };

    loadLaunchSettings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(lockResizeTimer.current);

    if (locked && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (locked) {
      taskListRef.current?.scrollTo({ top: 0 });
      lockResizeTimer.current = window.setTimeout(() => {
        window.todoShell.setWindowLocked(true);
        window.todoShell.setMousePassthrough(true);
      }, 55);
      return () => window.clearTimeout(lockResizeTimer.current);
    }

    window.todoShell.setMousePassthrough(false);
    window.todoShell.setWindowLocked(false);
    return () => window.clearTimeout(lockResizeTimer.current);
  }, [locked]);

  useEffect(() => {
    if (!briefOpen) {
      return;
    }

    if (locked) {
      setLocked(false);
    }
    window.todoShell.setMousePassthrough(false);
  }, [briefOpen, locked]);

  useEffect(() => {
    const updateLockButtonRect = () => {
      if (!lockButtonRef.current) {
        return;
      }

      const rect = lockButtonRef.current.getBoundingClientRect();
      window.todoShell.setLockButtonRect({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      });
    };

    updateLockButtonRect();
    window.addEventListener("resize", updateLockButtonRect);
    return () => window.removeEventListener("resize", updateLockButtonRect);
  }, [locked]);

  const startWindowDrag = useCallback(async event => {
    if (locked || event.button !== 0 || event.target.closest("button, input, select, .tabs")) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = await window.todoShell.getWindowBounds();
    if (!bounds) {
      return;
    }

    dragState.current = {
      bounds,
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY
    };
  }, [locked]);

  const moveWindowDrag = useCallback(event => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    window.todoShell.moveWindowTo(
      drag.bounds.x + event.screenX - drag.screenX,
      drag.bounds.y + event.screenY - drag.screenY
    );
  }, []);

  const stopWindowDrag = useCallback(event => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const saveSections = useCallback((nextSections, logMessage) => {
    const normalizedSections = normalizeSections(nextSections);
    setSections(normalizedSections);

    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const baseMarkdown = currentMarkdownRef.current;
      const nextMarkdown = serializeTodo(normalizedSections, detectTodoLanguage(baseMarkdown));
      const result = await window.todoShell.writeTodoSafe(nextMarkdown, baseMarkdown || undefined);
      if (result.conflict) {
        currentMarkdownRef.current = result.markdown;
        setSections(parseTodo(result.markdown));
        setStatus(t("status.updatedExternally"));
        window.setTimeout(() => setStatus(""), 1500);
        return;
      }

      currentMarkdownRef.current = result.markdown || nextMarkdown;
      if (logMessage) {
        await window.todoShell.appendLog(logMessage);
      }
      setStatus(t("status.saved"));
      window.setTimeout(() => setStatus(""), 1200);
    }, 180);
  }, [t]);

  const addTask = useCallback(() => {
    const text = newTask.trim();
    if (!text) {
      return;
    }

    const parsed = parseTaskContent(text);
    const dueDate = parsed.dueDate || (newTaskDateMode === "dated" && DATE_PATTERN.test(newTaskDate) ? newTaskDate : undefined);
    const targetSection = dueDate ? "Todo" : "Inbox";
    const nextSections = {
      ...sections,
      [targetSection]: [
        ...sections[targetSection],
        {
          id: crypto.randomUUID(),
          checked: false,
          dueDate,
          sourceSection: targetSection,
          text: parsed.text
        }
      ]
    };

    setNewTask("");
    saveSections(nextSections, `Added task to ${targetSection}: ${parsed.text}${dueDate ? ` @${dueDate}` : ""}`);
  }, [newTask, newTaskDate, newTaskDateMode, saveSections, sections]);

  const toggleTask = useCallback((section, taskId) => {
    const task = sections[section].find(item => item.id === taskId);
    if (!task) {
      return;
    }

    const nextSections = {
      ...sections,
      [section]: sections[section].filter(item => item.id !== taskId)
    };

    if (section === "Done") {
      const targetSection = task.dueDate ? "Todo" : "Inbox";
      nextSections[targetSection] = [
        {
          ...task,
          checked: false
        },
        ...nextSections[targetSection]
      ];
      saveSections(nextSections, `Restored task to ${targetSection}: ${task.text}`);
      return;
    }

    nextSections.Done = [
      {
        ...task,
        checked: true,
        sourceSection: section
      },
      ...sections.Done
    ];
    saveSections(nextSections, `Completed task: ${task.text}`);
  }, [saveSections, sections]);

  const changeTaskText = useCallback((section, taskId, text) => {
    if (section === "Done") {
      return;
    }

    const parsed = parseTaskContent(text);
    const nextSections = {
      ...sections,
      [section]: sections[section].map(task => (
        task.id === taskId ? { ...task, text: parsed.text, dueDate: parsed.dueDate || task.dueDate } : task
      ))
    };

    saveSections(nextSections, `Updated task text: ${text}`);
  }, [saveSections, sections]);

  const deleteDoneTask = useCallback(taskId => {
    const task = sections.Done.find(item => item.id === taskId);
    if (!task) {
      return;
    }

    const nextSections = {
      ...sections,
      Done: sections.Done.filter(item => item.id !== taskId)
    };

    saveSections(nextSections, `Deleted completed task: ${task.text}`);
  }, [saveSections, sections]);

  const openDailyBrief = useCallback(async () => {
    const brief = await window.todoShell.readTodayBrief();
    setDailyBrief(brief);
    setBriefCandidateDrafts(getCandidateDrafts(brief.markdown || ""));
    setLocked(false);
    setBriefOpen(true);
    window.todoShell.setMousePassthrough(false);
    window.todoShell.setBriefWindowMode(true);
  }, []);

  const openDataLocation = useCallback(async () => {
    setLocked(false);
    window.todoShell.setMousePassthrough(false);
    await window.todoShell.openDataLocationWindow();
  }, []);

  const closeDailyBrief = useCallback(() => {
    setBriefOpen(false);
    setSelectedBriefCandidates([]);
    setBriefCandidateDrafts({});
    window.todoShell.setBriefWindowMode(false);
  }, []);

  const dismissDailyBriefToday = useCallback(async () => {
    if (dailyBrief?.date) {
      await window.todoShell.markBriefSeen(dailyBrief.date);
      setDailyBrief({ ...dailyBrief, seenToday: true });
    }

    closeDailyBrief();
  }, [closeDailyBrief, dailyBrief]);

  const toggleBriefCandidate = useCallback(candidateId => {
    setSelectedBriefCandidates(ids => (
      ids.includes(candidateId)
        ? ids.filter(id => id !== candidateId)
        : [...ids, candidateId]
    ));
  }, []);

  const changeBriefCandidateText = useCallback((candidateId, text) => {
    setBriefCandidateDrafts(drafts => ({
      ...drafts,
      [candidateId]: text
    }));
  }, []);

  const addBriefCandidates = useCallback(async candidates => {
    const selectedCandidates = candidates
      .filter(candidate => selectedBriefCandidates.includes(candidate.id))
      .map(candidate => ({
        ...candidate,
        text: (briefCandidateDrafts[candidate.id] ?? candidate.text).trim()
      }))
      .filter(candidate => candidate.text);
    if (selectedCandidates.length === 0) {
      return;
    }

    let addedCount = 0;
    const nextSections = {
      ...sections,
      Todo: [...sections.Todo],
      Inbox: [...sections.Inbox]
    };

    selectedCandidates.forEach(candidate => {
      if (hasSameTask(nextSections, candidate.text)) {
        return;
      }

      const parsed = parseTaskContent(candidate.text);
      const targetSection = parsed.dueDate ? "Todo" : "Inbox";
      nextSections[targetSection].push({
        id: crypto.randomUUID(),
        checked: false,
        dueDate: parsed.dueDate,
        sourceSection: targetSection,
        text: parsed.text
      });
      addedCount += 1;
    });

    if (addedCount > 0) {
      saveSections(nextSections, `Added ${addedCount} from daily brief: ${selectedCandidates.map(candidate => candidate.text).join("; ")}`);
      setStatus(t("status.addedItems", {
        count: addedCount,
        itemLabel: addedCount === 1 ? t("status.item") : t("status.items")
      }));
      window.setTimeout(() => setStatus(""), 1400);
    } else {
      setStatus(t("status.candidatesAlreadyExist"));
      window.setTimeout(() => setStatus(""), 1400);
    }

    if (dailyBrief?.date) {
      await window.todoShell.markBriefSeen(dailyBrief.date);
      setDailyBrief({ ...dailyBrief, seenToday: true });
    }

    closeDailyBrief();
  }, [briefCandidateDrafts, closeDailyBrief, dailyBrief, saveSections, sections, selectedBriefCandidates, t]);

  const toggleLaunchAtLogin = useCallback(async () => {
    const settings = await window.todoShell.setLaunchAtLogin(!launchAtLogin);
    setLaunchAtLogin(Boolean(settings.launchAtLogin));
    setStatus(settings.launchAtLogin ? t("status.launchAtLoginEnabled") : t("status.launchAtLoginDisabled"));
    window.setTimeout(() => setStatus(""), 1200);
  }, [launchAtLogin, t]);

  const openDatePicker = useCallback(() => {
    setNewTaskDateMode("dated");
    const input = dateInputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }, []);

  const visibleSections = useMemo(() => (
    activeTab === "Todo" ? ACTIVE_SECTIONS : ["Done"]
  ), [activeTab]);

  const activeCount = ACTIVE_SECTIONS.reduce((sum, section) => sum + sections[section].length, 0);
  const doneCount = sections.Done.length;

  return (
    <main className="desktop">
      <section className={`todo-panel ${locked ? "is-locked" : ""}`}>
        <header
          className="panel-header"
          onPointerDown={startWindowDrag}
          onPointerMove={moveWindowDrag}
          onPointerUp={stopWindowDrag}
          onPointerCancel={stopWindowDrag}
        >
          <div className="panel-title-area">
            <p className="app-name">FocusDock</p>
            <div className="tabs" aria-label={t("app.taskSections")}>
              <button
                className={activeTab === "Todo" ? "active" : ""}
                onClick={() => setActiveTab("Todo")}
              >
                Todo
                <span>{activeCount}</span>
              </button>
              <span className="divider">｜</span>
              <button
                className={activeTab === "Done" ? "active" : ""}
                onClick={() => setActiveTab("Done")}
              >
                Done
                <span>{doneCount}</span>
              </button>
            </div>
          </div>

          <div className="window-actions">
            <button
              className="language-button"
              aria-label={t("app.languageToggle")}
              title={t("app.languageToggle")}
              onClick={onToggleLanguage}
            >
              {language === "zh" ? "EN" : "中"}
            </button>
            <button
              className="data-location-button"
              aria-label={t("app.openFileLocation")}
              title={t("app.fileLocation")}
              onClick={openDataLocation}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M1.8 4.4c0-.8.6-1.4 1.4-1.4h3.1l1.3 1.4h5.2c.8 0 1.4.6 1.4 1.4v6.1c0 .8-.6 1.4-1.4 1.4H3.2c-.8 0-1.4-.6-1.4-1.4z" />
              </svg>
            </button>
            <button
              className="brief-button"
              aria-label={t("app.openDailyBrief")}
              title={t("app.dailyBrief")}
              onClick={openDailyBrief}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 2.8h7.4c.9 0 1.6.7 1.6 1.6v8.8H4.6A1.6 1.6 0 0 1 3 11.6z" />
                <path d="M12 5.2h1.1c.5 0 .9.4.9.9v5.5c0 .9-.7 1.6-1.6 1.6H12" />
                <path d="M5.1 5.4h4.8" />
                <path d="M5.1 7.8h4.8" />
                <path d="M5.1 10.2h3.1" />
              </svg>
            </button>
            <button
              className="launch-at-login-button"
              aria-label={launchAtLogin ? t("app.disableLaunchAtLogin") : t("app.enableLaunchAtLogin")}
              aria-pressed={launchAtLogin}
              title={launchAtLogin ? t("app.disableLaunchAtLogin") : t("app.enableLaunchAtLogin")}
              onClick={toggleLaunchAtLogin}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2.3v7.1" />
                <path d="M5.25 5.05 8 2.3l2.75 2.75" />
                <path d="M3.1 8.8a4.9 4.9 0 1 0 9.8 0" />
              </svg>
            </button>
            <button
              ref={lockButtonRef}
              className="lock-window-button"
              aria-label={locked ? t("app.unlockWindow") : t("app.lockWindow")}
              aria-pressed={locked}
              onClick={() => setLocked(isLocked => !isLocked)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="3.2" y="6.8" width="9.6" height="6.4" rx="1.4" />
                <path d="M5.2 6.8V5.1a2.8 2.8 0 0 1 5.6 0v1.7" />
              </svg>
            </button>
          </div>
        </header>

        <div className="task-list" ref={taskListRef}>
          {visibleSections.map(section => (
            <section className="task-section" key={section}>
              {activeTab === "Todo" && <h2>{section === "Inbox" ? t("app.inbox") : t("app.todo")}</h2>}
              {(sections[section] || []).map(task => (
                <TaskItem
                  t={t}
                  key={task.id}
                  task={task}
                  section={section}
                  onToggle={toggleTask}
                  onTextChange={changeTaskText}
                  onDeleteDone={deleteDoneTask}
                />
              ))}
            </section>
          ))}

        </div>

        {activeTab === "Todo" && (
          <footer className="quick-add">
            <div className="quick-add-inner">
              <input
                className="new-task-input"
                value={newTask}
                placeholder={t("app.writeTodo")}
                onChange={event => setNewTask(event.target.value)}
              />
              <span className="date-picker-field">
                <button
                  className="date-picker-button"
                  aria-label={t("app.chooseTaskDate")}
                  aria-pressed={newTaskDateMode === "dated"}
                  title={newTaskDateMode === "dated" ? newTaskDate : t("app.chooseTaskDate")}
                  onClick={openDatePicker}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="2.5" y="3.6" width="11" height="10" rx="1.4" />
                    <path d="M5.2 2.2v3" />
                    <path d="M10.8 2.2v3" />
                    <path d="M2.5 6.5h11" />
                  </svg>
                </button>
                <input
                  ref={dateInputRef}
                  className="date-input"
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  value={newTaskDate}
                  onChange={event => {
                    setNewTaskDate(event.target.value || getLocalDateString());
                    setNewTaskDateMode("dated");
                  }}
                />
              </span>
              <button
                className="date-none-button"
                aria-label={t("app.noDate")}
                title={t("app.noDate")}
                aria-pressed={newTaskDateMode === "none"}
                onClick={() => setNewTaskDateMode(mode => mode === "none" ? "dated" : "none")}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2.5" y="3.6" width="11" height="10" rx="1.4" />
                  <path d="M5.2 2.2v3" />
                  <path d="M10.8 2.2v3" />
                  <path d="M2.5 6.5h11" />
                  <path d="M3 13 13 3" />
                </svg>
              </button>
              <button onClick={addTask} aria-label={t("app.addTask")}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M7.25 2h1.5v5.25H14v1.5H8.75V14h-1.5V8.75H2v-1.5h5.25z" />
                </svg>
              </button>
            </div>
          </footer>
        )}

        <div className="save-status">{status}</div>
        {briefOpen && (
          <DailyBriefOverlay
            t={t}
            brief={dailyBrief}
            selectedIds={selectedBriefCandidates}
            candidateDrafts={briefCandidateDrafts}
            onToggleCandidate={toggleBriefCandidate}
            onCandidateTextChange={changeBriefCandidateText}
            onAddSelected={addBriefCandidates}
            onClose={closeDailyBrief}
            onDismissToday={dismissDailyBriefToday}
          />
        )}
      </section>
    </main>
  );
}

function Root() {
  const view = new URLSearchParams(window.location.search).get("view");
  const [language, setLanguage] = useState(getInitialLanguage);
  const t = useCallback((key, replacements) => translate(language, key, replacements), [language]);
  const toggleLanguage = useCallback(() => {
    setLanguage(currentLanguage => {
      const nextLanguage = currentLanguage === "zh" ? "en" : "zh";
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      return nextLanguage;
    });
  }, []);

  if (view === "data-location") {
    return <DataLocationSettings t={t} onClose={() => window.todoShell.closeCurrentWindow()} />;
  }

  return <App language={language} t={t} onToggleLanguage={toggleLanguage} />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
