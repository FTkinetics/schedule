(function () {
  const STORAGE_PREFIX = "weekly-schedule:v1:";
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const slots = [
    { id: "0830", label: "上午", time: "08:30-09:30" },
    { id: "0930", label: "上午", time: "09:30-10:30" },
    { id: "1030", label: "上午", time: "10:30-11:30" },
    { id: "lunch", label: "午间", time: "11:30-14:30", defaultText: "午饭", className: "is-lunch" },
    { id: "1430", label: "下午", time: "14:30-15:30" },
    { id: "1530", label: "下午", time: "15:30-16:30" },
    { id: "1630", label: "下午", time: "16:30-17:30" },
    { id: "evening", label: "晚上", time: "17:30以后", className: "is-evening" },
  ];

  const grid = document.querySelector("#scheduleGrid");
  const weekTitle = document.querySelector("#weekTitle");
  const prevWeekButton = document.querySelector("#prevWeek");
  const todayButton = document.querySelector("#today");
  const nextWeekButton = document.querySelector("#nextWeek");
  const overlay = document.querySelector("#overlay");
  const editor = document.querySelector("#editor");
  const editorDate = document.querySelector("#editorDate");
  const editorSlot = document.querySelector("#editorSlot");
  const editorText = document.querySelector("#editorText");
  const closeEditorButton = document.querySelector("#closeEditor");
  const saveCellButton = document.querySelector("#saveCell");
  const clearCellButton = document.querySelector("#clearCell");
  const installButton = document.querySelector("#installButton");

  let currentMonday = getMonday(new Date());
  let activeCell = null;
  let deferredInstallPrompt = null;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatShortDate(date) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function getMonday(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    const day = copy.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    return addDays(copy, offset);
  }

  function storageKey(dateKey, slotId) {
    return `${STORAGE_PREFIX}${dateKey}:${slotId}`;
  }

  function getStoredValue(dateKey, slot) {
    const value = localStorage.getItem(storageKey(dateKey, slot.id));
    if (value !== null) {
      return value;
    }
    return slot.defaultText || "";
  }

  function setStoredValue(dateKey, slotId, value) {
    localStorage.setItem(storageKey(dateKey, slotId), value);
  }

  function getWeekDates() {
    return Array.from({ length: 7 }, (_, index) => addDays(currentMonday, index));
  }

  function render() {
    const dates = getWeekDates();
    const todayKey = toDateKey(new Date());
    const start = dates[0];
    const end = dates[6];

    weekTitle.textContent = `${formatShortDate(start)} - ${formatShortDate(end)}`;
    grid.innerHTML = "";

    const corner = document.createElement("div");
    corner.className = "corner";
    corner.setAttribute("aria-hidden", "true");
    grid.appendChild(corner);

    dates.forEach((date, index) => {
      const dateKey = toDateKey(date);
      const head = document.createElement("div");
      head.className = `day-head${dateKey === todayKey ? " is-today" : ""}`;
      head.innerHTML = `<span class="day-name">${dayNames[index]}</span><span class="day-date">${formatShortDate(date)}</span>`;
      grid.appendChild(head);
    });

    slots.forEach((slot) => {
      const timeHead = document.createElement("div");
      timeHead.className = "time-head";
      timeHead.innerHTML = `<span class="slot-label">${slot.label}</span>${slot.time}`;
      grid.appendChild(timeHead);

      dates.forEach((date, dayIndex) => {
        const dateKey = toDateKey(date);
        const value = getStoredValue(dateKey, slot);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `cell ${slot.className || ""} ${value.trim() ? "has-text" : ""}`.trim();
        button.dataset.dateKey = dateKey;
        button.dataset.dayName = dayNames[dayIndex];
        button.dataset.slotId = slot.id;
        button.dataset.slotLabel = slot.label;
        button.dataset.slotTime = slot.time;
        button.innerHTML = `<span class="cell-text ${value.trim() ? "" : "cell-empty"}">${escapeHtml(value || "点此填写")}</span>`;
        button.addEventListener("click", () => openEditor(button));
        grid.appendChild(button);
      });
    });
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openEditor(cell) {
    activeCell = cell;
    const slot = slots.find((item) => item.id === cell.dataset.slotId);
    const value = getStoredValue(cell.dataset.dateKey, slot);

    editorDate.textContent = `${cell.dataset.dayName} ${cell.dataset.dateKey}`;
    editorSlot.textContent = `${cell.dataset.slotLabel} ${cell.dataset.slotTime}`;
    editorText.value = value;

    overlay.classList.remove("hidden");
    editor.classList.remove("hidden");
    window.setTimeout(() => editorText.focus(), 80);
  }

  function closeEditor() {
    activeCell = null;
    overlay.classList.add("hidden");
    editor.classList.add("hidden");
  }

  function saveActiveCell() {
    if (!activeCell) {
      return;
    }

    setStoredValue(activeCell.dataset.dateKey, activeCell.dataset.slotId, editorText.value.trim());
    render();
    closeEditor();
  }

  function clearActiveCell() {
    if (!activeCell) {
      return;
    }

    setStoredValue(activeCell.dataset.dateKey, activeCell.dataset.slotId, "");
    render();
    closeEditor();
  }

  prevWeekButton.addEventListener("click", () => {
    currentMonday = addDays(currentMonday, -7);
    render();
  });

  todayButton.addEventListener("click", () => {
    currentMonday = getMonday(new Date());
    render();
  });

  nextWeekButton.addEventListener("click", () => {
    currentMonday = addDays(currentMonday, 7);
    render();
  });

  closeEditorButton.addEventListener("click", closeEditor);
  overlay.addEventListener("click", closeEditor);
  saveCellButton.addEventListener("click", saveActiveCell);
  clearCellButton.addEventListener("click", clearActiveCell);

  editorText.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      saveActiveCell();
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.classList.remove("hidden");
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.classList.add("hidden");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  render();
})();
