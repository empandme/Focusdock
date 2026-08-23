import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const SECTION_ORDER = ["Inbox", "Todo", "Done"];
const ACTIVE_SECTIONS = ["Todo", "Inbox"];
const LEGACY_SECTIONS = ["Today", "Future", "Waiting", "Later"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INLINE_DATE_PATTERN = /(?:^|\s)@(\d{4}-\d{2}-\d{2})\s*$/;
const BRIEF_SECTION_ORDER = ["今天", "临近截止", "需要确认", "可选活动", "垃圾/忽略"];

function normalizeSection(section) {
  if (LEGACY_SECTIONS.includes(section)) {
    return "Todo";
  }

  return SECTION_ORDER.includes(section) ? section : null;
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
    const sourceSection = body.match(/\bfrom:(Inbox|Todo|Today|Future|Waiting|Later)\b/);
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
      current = SECTION_ORDER.includes(headingName) || LEGACY_SECTIONS.includes(headingName) ? headingName : null;
      continue;
    }

    const task = line.match(/^-\s+\[([ xX])\]\s+(.+?)\s*$/);
    if (task && current) {
      const parsed = parseTaskContent(task[2]);
      const dueDate = parsed.dueDate || (current === "Today" ? getLocalDateString() : undefined);
      const targetSection = current === "Done"
        ? "Done"
        : dueDate ? "Todo" : "Inbox";
      const sourceSection = current === "Done"
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

function serializeTodo(sections) {
  const lines = ["# Todo", ""];

  SECTION_ORDER.forEach((section, sectionIndex) => {
    lines.push(`## ${section}`);
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

function parseDailyBrief(markdown) {
  const sections = {};
  const candidates = [];
  let current = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim();
      if (!sections[current]) {
        sections[current] = [];
      }
      continue;
    }

    if (!current) {
      continue;
    }

    const candidate = line.match(/^(\d+)\.\s+`([^`]+)`/);
    if (current === "可加入 Todo 候选" && candidate) {
      candidates.push({
        id: candidate[1],
        text: candidate[2].trim()
      });
      continue;
    }

    const item = line.match(/^\d+\.\s+(.+?)\s*$/);
    if (item && current !== "可加入 Todo 候选") {
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

  return (
    <div className="brief-overlay" role="dialog" aria-modal="true" aria-label="每日早报">
      <div className="brief-panel">
        <header className="brief-header">
          <div>
            <p className="brief-kicker">Daily Brief</p>
            <h1>{brief?.date || getLocalDateString()} 早报</h1>
          </div>
          <button className="brief-icon-button" aria-label="关闭早报" onClick={onClose}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m4.2 3.1 3.8 3.8 3.8-3.8 1.1 1.1L9.1 8l3.8 3.8-1.1 1.1L8 9.1l-3.8 3.8-1.1-1.1L6.9 8 3.1 4.2z" />
            </svg>
          </button>
        </header>

        <div className="brief-body">
          {hasContent ? (
            <>
              {BRIEF_SECTION_ORDER.map(section => (
                parsedBrief.sections[section]?.length > 0 && (
                  <section className="brief-section" key={section}>
                    <h2>{section}</h2>
                    <ul>
                      {parsedBrief.sections[section].map((item, index) => (
                        <li key={`${section}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )
              ))}

              <section className="brief-section brief-candidates">
                <h2>可加入 Todo 候选</h2>
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
                          aria-label={`编辑候选 ${candidate.id}`}
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
                  <p className="brief-empty">今天没有可加入 Todo 的候选。</p>
                )}
              </section>
            </>
          ) : (
            <div className="brief-empty-state">
              <h2>今天还没有早报</h2>
              <p>自动化生成后，这里会直接显示内容，不需要再打开 Markdown 文件。</p>
            </div>
          )}
        </div>

        <footer className="brief-footer">
          <button className="brief-secondary-button" onClick={onDismissToday}>
            今天不再提醒
          </button>
          <button
            className="brief-primary-button"
            disabled={!hasContent || selectedCount === 0}
            onClick={() => onAddSelected(parsedBrief.candidates)}
          >
            加入 {selectedCount} 项
          </button>
        </footer>
      </div>
    </div>
  );
}

function TaskItem({ task, section, onToggle, onTextChange, onDeleteDone }) {
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
        aria-label={task.checked ? "恢复任务" : "完成任务"}
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
          aria-label="删除已完成任务"
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

function App() {
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
      const nextMarkdown = serializeTodo(normalizedSections);
      const result = await window.todoShell.writeTodoSafe(nextMarkdown, baseMarkdown || undefined);
      if (result.conflict) {
        currentMarkdownRef.current = result.markdown;
        setSections(parseTodo(result.markdown));
        setStatus("外部已更新，已刷新");
        window.setTimeout(() => setStatus(""), 1500);
        return;
      }

      currentMarkdownRef.current = result.markdown || nextMarkdown;
      if (logMessage) {
        await window.todoShell.appendLog(logMessage);
      }
      setStatus("已保存");
      window.setTimeout(() => setStatus(""), 1200);
    }, 180);
  }, []);

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
    saveSections(nextSections, `添加任务到 ${targetSection}：${parsed.text}${dueDate ? ` @${dueDate}` : ""}`);
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
      saveSections(nextSections, `恢复任务到 ${targetSection}：${task.text}`);
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
    saveSections(nextSections, `完成任务：${task.text}`);
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

    saveSections(nextSections, `更新任务文字：${text}`);
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

    saveSections(nextSections, `删除已完成任务：${task.text}`);
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
      saveSections(nextSections, `从每日早报加入 ${addedCount} 项：${selectedCandidates.map(candidate => candidate.text).join("；")}`);
      setStatus(`已加入 ${addedCount} 项`);
      window.setTimeout(() => setStatus(""), 1400);
    } else {
      setStatus("候选已在 Todo 中");
      window.setTimeout(() => setStatus(""), 1400);
    }

    if (dailyBrief?.date) {
      await window.todoShell.markBriefSeen(dailyBrief.date);
      setDailyBrief({ ...dailyBrief, seenToday: true });
    }

    closeDailyBrief();
  }, [briefCandidateDrafts, closeDailyBrief, dailyBrief, saveSections, sections, selectedBriefCandidates]);

  const toggleLaunchAtLogin = useCallback(async () => {
    const settings = await window.todoShell.setLaunchAtLogin(!launchAtLogin);
    setLaunchAtLogin(Boolean(settings.launchAtLogin));
    setStatus(settings.launchAtLogin ? "已开启自启" : "已关闭自启");
    window.setTimeout(() => setStatus(""), 1200);
  }, [launchAtLogin]);

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
            <div className="tabs" aria-label="任务分区">
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
              className="brief-button"
              aria-label="打开每日早报"
              title="每日早报"
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
              aria-label={launchAtLogin ? "关闭开机自启" : "开启开机自启"}
              aria-pressed={launchAtLogin}
              title={launchAtLogin ? "关闭开机自启" : "开启开机自启"}
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
              aria-label={locked ? "解除锁定" : "锁定界面"}
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
              {activeTab === "Todo" && <h2>{section}</h2>}
              {(sections[section] || []).map(task => (
                <TaskItem
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
                placeholder="写下新的 Todo"
                onChange={event => setNewTask(event.target.value)}
              />
              <span className="date-picker-field">
                <button
                  className="date-picker-button"
                  aria-label="选择任务日期"
                  aria-pressed={newTaskDateMode === "dated"}
                  title={newTaskDateMode === "dated" ? newTaskDate : "选择任务日期"}
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
                aria-label="不设置日期"
                aria-pressed={newTaskDateMode === "none"}
                onClick={() => setNewTaskDateMode(mode => mode === "none" ? "dated" : "none")}
              >
                无
              </button>
              <button onClick={addTask} aria-label="添加任务">
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

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
