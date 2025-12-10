// Drift-ui.js
// Handles mood canvas, dragging, and storage

(function () {
  const STORAGE_PREFIX = "drift-mood-";

  function todayKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${STORAGE_PREFIX}${yyyy}-${mm}-${dd}`;
  }

  function offsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  function keyForDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${STORAGE_PREFIX}${yyyy}-${mm}-${dd}`;
  }

  function formatDateLabel(date) {
    const today = new Date();
    const diffMs = date.setHours(0,0,0,0) - today.setHours(0,0,0,0);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === -1) return "Yesterday";

    const opts = { month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, opts);
  }

  function moodLabelFromCoords(x, y) {
    // x: 0 left (low energy) -> 1 right (higher energy)
    // y: 0 top (lighter) -> 1 bottom (heavier)
    if (y < 0.35 && x > 0.6) return "Bright";
    if (y < 0.35 && x <= 0.6) return "Soft";
    if (y >= 0.35 && y < 0.7 && x > 0.6) return "Charged";
    if (y >= 0.35 && y < 0.7 && x <= 0.6) return "Floating";
    if (y >= 0.7 && x > 0.6) return "Restless";
    if (y >= 0.7 && x <= 0.6) return "Heavy";
    return "Drifting";
  }

  function loadCoords(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        typeof parsed.x === "number" &&
        typeof parsed.y === "number"
      ) {
        return { x: parsed.x, y: parsed.y };
      }
    } catch (e) {
      console.warn("Failed to parse stored drift mood:", e);
    }
    return null;
  }

  function saveCoords(key, coords) {
    try {
      localStorage.setItem(key, JSON.stringify(coords));
    } catch (e) {
      console.warn("Failed to save drift mood:", e);
    }
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function positionDot(dot, areaRect, coords) {
    const left = areaRect.left + coords.x * areaRect.width;
    const top = areaRect.top + coords.y * areaRect.height;
    dot.style.left = `${coords.x * 100}%`;
    dot.style.top = `${coords.y * 100}%`;
  }

  function initDrift() {
    const area = document.getElementById("mood-area");
    const todayDot = document.getElementById("today-dot");
    const yesterdayDot = document.getElementById("yesterday-dot");
    const dateLabelEl = document.getElementById("date-label");
    const moodLabelEl = document.getElementById("mood-label");

    if (!area || !todayDot || !yesterdayDot) {
      console.warn("Drift UI elements missing");
      return;
    }

    const today = new Date();
    dateLabelEl.textContent = formatDateLabel(today);

    // Default center
    let todayCoords = { x: 0.5, y: 0.5 };

    const todayStored = loadCoords(todayKey());
    if (todayStored) {
      todayCoords = todayStored;
    }

    const yesterday = offsetDate(-1);
    const yesterdayStored = loadCoords(keyForDate(yesterday));
    if (yesterdayStored) {
      yesterdayDot.classList.add("visible");
      const rect = area.getBoundingClientRect();
      yesterdayDot.style.left = `${clamp01(yesterdayStored.x) * 100}%`;
      yesterdayDot.style.top = `${clamp01(yesterdayStored.y) * 100}%`;
    }

    // Position today's dot
    const rect = area.getBoundingClientRect();
    todayDot.style.left = `${clamp01(todayCoords.x) * 100}%`;
    todayDot.style.top = `${clamp01(todayCoords.y) * 100}%`;
    moodLabelEl.textContent = moodLabelFromCoords(todayCoords.x, todayCoords.y);

    let isDragging = false;

    function handlePointerDown(ev) {
      isDragging = true;
      todayDot.classList.add("dragging");
      area.setPointerCapture(ev.pointerId);
      moveToEvent(ev);
    }

    function handlePointerUp(ev) {
      if (!isDragging) return;
      isDragging = false;
      todayDot.classList.remove("dragging");
      try {
        area.releasePointerCapture(ev.pointerId);
      } catch (e) {
        // ignore
      }
      saveCoords(todayKey(), todayCoords);
    }

    function handlePointerMove(ev) {
      if (!isDragging) return;
      moveToEvent(ev);
    }

    function moveToEvent(ev) {
      const rect = area.getBoundingClientRect();
      const x = clamp01((ev.clientX - rect.left) / rect.width);
      const y = clamp01((ev.clientY - rect.top) / rect.height);
      todayCoords = { x, y };
      todayDot.style.left = `${x * 100}%`;
      todayDot.style.top = `${y * 100}%`;
      moodLabelEl.textContent = moodLabelFromCoords(x, y);
    }

    todayDot.addEventListener("pointerdown", handlePointerDown);
    area.addEventListener("pointerdown", function (ev) {
      if (ev.target === todayDot) return;
      handlePointerDown(ev);
    });
    area.addEventListener("pointermove", handlePointerMove);
    area.addEventListener("pointerup", handlePointerUp);
    area.addEventListener("pointercancel", handlePointerUp);
    area.addEventListener("lostpointercapture", handlePointerUp);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDrift);
  } else {
    initDrift();
  }
})();
