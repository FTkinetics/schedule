(function () {
  const STORAGE_PREFIX = "weekly-schedule:v1:";
  const INGREDIENTS_KEY = "weekly-schedule:ingredients:v2";

  const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const units = ["斤", "个", "克", "袋", "盒", "瓶", "把", "颗"];
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

  const defaultIngredients = [
    { id: "meat-pork", category: "meat", name: "猪肉", amount: "", unit: "斤", custom: false },
    { id: "meat-lamb", category: "meat", name: "羊肉", amount: "", unit: "斤", custom: false },
    { id: "meat-beef", category: "meat", name: "牛肉", amount: "", unit: "斤", custom: false },
    { id: "meat-chicken", category: "meat", name: "鸡肉", amount: "", unit: "斤", custom: false },
    { id: "meat-fish", category: "meat", name: "鱼", amount: "", unit: "条", custom: false },
    { id: "veg-potato", category: "vegetable", name: "土豆", amount: "", unit: "个", custom: false },
    { id: "veg-tomato", category: "vegetable", name: "西红柿", amount: "", unit: "个", custom: false },
    { id: "veg-cucumber", category: "vegetable", name: "黄瓜", amount: "", unit: "根", custom: false },
    { id: "veg-greens", category: "vegetable", name: "青菜", amount: "", unit: "把", custom: false },
    { id: "veg-cabbage", category: "vegetable", name: "白菜", amount: "", unit: "颗", custom: false },
    { id: "veg-carrot", category: "vegetable", name: "胡萝卜", amount: "", unit: "根", custom: false },
    { id: "veg-onion", category: "vegetable", name: "洋葱", amount: "", unit: "个", custom: false },
    { id: "veg-eggplant", category: "vegetable", name: "茄子", amount: "", unit: "个", custom: false },
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
  const ingredientsButton = document.querySelector("#ingredientsButton");
  const ingredientsPanel = document.querySelector("#ingredientsPanel");
  const closeIngredientsButton = document.querySelector("#closeIngredients");
  const ingredientForm = document.querySelector("#ingredientForm");
  const ingredientName = document.querySelector("#ingredientName");
  const ingredientAmount = document.querySelector("#ingredientAmount");
  const ingredientUnit = document.querySelector("#ingredientUnit");
  const ingredientsList = document.querySelector("#ingredientsList");
  const ingredientCategoryView = document.querySelector("#ingredientCategoryView");
  const ingredientDetailView = document.querySelector("#ingredientDetailView");
  const ingredientCategoryTitle = document.querySelector("#ingredientCategoryTitle");
  const ingredientPreset = document.querySelector("#ingredientPreset");
  const ingredientBackButton = document.querySelector("#ingredientBack");
  const ingredientCategoryButtons = Array.from(document.querySelectorAll(".ingredient-category-button"));

  let currentMonday = getMonday(new Date());
  let activeCell = null;
  let activeIngredientCategory = "meat";
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

  function normalizeIngredient(item) {
    return {
      id: item.id || `${item.category || "custom"}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      category: item.category === "vegetable" ? "vegetable" : "meat",
      name: item.name || "未命名",
      amount: item.amount || "",
      unit: item.unit || "斤",
      custom: Boolean(item.custom),
    };
  }

  function getIngredients() {
    let saved = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(INGREDIENTS_KEY) || "[]");
      saved = Array.isArray(parsed) ? parsed.map(normalizeIngredient) : [];
    } catch (error) {
      saved = [];
    }

    const merged = defaultIngredients.map((item) => {
      const savedItem = saved.find((candidate) => candidate.id === item.id);
      return savedItem ? { ...item, ...savedItem, custom: false } : { ...item };
    });

    saved.filter((item) => item.custom).forEach((item) => merged.push(item));
    return merged;
  }

  function saveIngredients(items) {
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(items));
  }

  function updateIngredient(id, patch) {
    const items = getIngredients().map((item) => (item.id === id ? { ...item, ...patch } : item));
    saveIngredients(items);
  }

  function removeIngredient(id) {
    saveIngredients(getIngredients().filter((item) => item.id !== id || !item.custom));
    renderIngredients();
  }

  function unitOptions(selectedUnit) {
    const allUnits = units.includes(selectedUnit) ? units : [selectedUnit, ...units];
    return allUnits.map((unit) => `<option value="${escapeHtml(unit)}"${unit === selectedUnit ? " selected" : ""}>${escapeHtml(unit)}</option>`).join("");
  }

  function getCategoryName(category) {
    return category === "vegetable" ? "蔬菜类" : "肉类";
  }

  function getCategoryPresets(category) {
    return defaultIngredients.filter((item) => item.category === category);
  }

  function renderIngredientPresets() {
    const presets = getCategoryPresets(activeIngredientCategory);
    ingredientPreset.innerHTML = '<option value="">选择常用食材</option>' + presets
      .map((item) => '<option value="' + escapeHtml(item.name) + '">' + escapeHtml(item.name) + '</option>')
      .join("");
  }

  function renderIngredients() {
    const items = getIngredients().filter(
      (item) => item.category === activeIngredientCategory && (item.custom || item.amount.trim())
    );
    ingredientsList.innerHTML = "";

    if (!items.length) {
      ingredientsList.innerHTML = '<p class="ingredients-empty">还没有添加食材</p>';
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "ingredient-row";
      row.innerHTML =
        '<strong>' + escapeHtml(item.name) + '</strong>' +
        '<input class="ingredient-amount" type="number" inputmode="decimal" min="0" step="0.1" value="' + escapeHtml(item.amount) + '" placeholder="0" aria-label="' + escapeHtml(item.name) + '数量">' +
        '<select class="ingredient-unit" aria-label="' + escapeHtml(item.name) + '单位">' + unitOptions(item.unit) + '</select>' +
        '<button type="button" ' + (item.custom ? "" : "disabled") + '>删除</button>';

      row.querySelector(".ingredient-amount").addEventListener("input", (event) => {
        updateIngredient(item.id, { amount: event.target.value });
        if (!event.target.value.trim() && !item.custom) {
          renderIngredients();
        }
      });
      row.querySelector(".ingredient-unit").addEventListener("change", (event) => {
        updateIngredient(item.id, { unit: event.target.value });
      });
      row.querySelector("button").addEventListener("click", () => removeIngredient(item.id));
      ingredientsList.appendChild(row);
    });
  }

  function showIngredientCategory(category) {
    activeIngredientCategory = category;
    ingredientCategoryTitle.textContent = getCategoryName(category);
    ingredientCategoryView.classList.add("hidden");
    ingredientDetailView.classList.remove("hidden");
    ingredientName.value = "";
    ingredientAmount.value = "";
    ingredientUnit.value = category === "meat" ? "斤" : "个";
    renderIngredientPresets();
    renderIngredients();
    window.setTimeout(() => ingredientPreset.focus(), 80);
  }

  function showIngredientCategories() {
    ingredientDetailView.classList.add("hidden");
    ingredientCategoryView.classList.remove("hidden");
  }

  function openIngredients() {
    showIngredientCategories();
    overlay.classList.remove("hidden");
    ingredientsPanel.classList.remove("hidden");
  }

  function closeIngredients() {
    overlay.classList.add("hidden");
    ingredientsPanel.classList.add("hidden");
    showIngredientCategories();
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
  overlay.addEventListener("click", () => {
    closeEditor();
    closeIngredients();
  });
  saveCellButton.addEventListener("click", saveActiveCell);
  clearCellButton.addEventListener("click", clearActiveCell);
  ingredientsButton.addEventListener("click", openIngredients);
  closeIngredientsButton.addEventListener("click", closeIngredients);

  ingredientCategoryButtons.forEach((button) => {
    button.addEventListener("click", () => showIngredientCategory(button.dataset.category));
  });

  ingredientBackButton.addEventListener("click", showIngredientCategories);

  ingredientPreset.addEventListener("change", () => {
    if (ingredientPreset.value) {
      ingredientName.value = ingredientPreset.value;
    }
  });

  ingredientForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = (ingredientName.value.trim() || ingredientPreset.value).trim();
    const amount = ingredientAmount.value.trim();
    const unit = ingredientUnit.value;

    if (!name || !amount) {
      return;
    }

    const items = getIngredients();
    const existing = items.find(
      (item) => item.category === activeIngredientCategory && item.name === name
    );

    if (existing) {
      updateIngredient(existing.id, { amount, unit });
    } else {
      items.push({
        id: activeIngredientCategory + "-" + Date.now() + "-" + Math.random().toString(16).slice(2),
        category: activeIngredientCategory,
        name,
        amount,
        unit,
        custom: true,
      });
      saveIngredients(items);
    }

    ingredientForm.reset();
    ingredientUnit.value = activeIngredientCategory === "meat" ? "斤" : "个";
    renderIngredients();
    ingredientPreset.focus();
  });

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