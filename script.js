// script.js — Rizz Web (Version 2) — production build (no test/debug output)
(() => {
  /* =========================
     Click sound (optional)
     ========================= */
  const clickSound = document.getElementById("clickSound");
  document.addEventListener("click", (e) => {
    try {
      const btn = e.target.closest("button");
      if (!btn || !clickSound) return;
      clickSound.currentTime = 0;
      clickSound.volume = 0.35;
      clickSound.play().catch(() => {});
    } catch (err) { /* swallow */ }
  });

  /* =========================
     Elements & core state
     ========================= */
  const form = document.getElementById("addForm");
  const list = document.getElementById("peopleList");

  const dashFocus = document.getElementById("dashFocus");
  const dashPause = document.getElementById("dashPause");
  const dashAction = document.getElementById("dashAction");

  const focusValueEl = document.getElementById("focusValue");
  const statusInput = form.querySelector('input[name="status"]');
  const focusInput = form.querySelector('input[name="focus"]');

  let focus = 0;
  let people = JSON.parse(localStorage.getItem("rizz_people")) || [];

  /* =========================
     Status buttons (form)
     ========================= */
  const statusButtons = Array.from(document.querySelectorAll(".status-buttons button"));
  statusButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      statusButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (btn.dataset && btn.dataset.status) statusInput.value = btn.dataset.status;
    });
  });
  const defaultBtn = document.querySelector('.status-buttons button[data-status="crush"]');
  if (defaultBtn) defaultBtn.classList.add("active");

  /* =========================
     Focus controls (form)
     ========================= */
  const plusBtn = document.getElementById("plus");
  const minusBtn = document.getElementById("minus");
  if (plusBtn) plusBtn.addEventListener("click", () => { focus = Math.min(100, focus + 10); updateFocus(); });
  if (minusBtn) minusBtn.addEventListener("click", () => { focus = Math.max(0, focus - 10); updateFocus(); });

  function updateFocus() {
    focusValueEl.textContent = `${focus}%`;
    focusInput.value = focus;
  }

  /* =========================
     Advice helper
     ========================= */
  function adviceFor(f){
    const n = Number(f) || 0;
    if (n >= 80) return "High priority. Reach out or plan a meet.";
    if (n >= 60) return "Good momentum. Stay consistent.";
    if (n >= 30) return "Keep it steady. No pressure.";
    return "Low priority. Do not over-invest.";
  }

  /* =========================
     Dashboard rules
     - paused: focus <= 20
     - focus candidates: dating>80 OR crush>60
     - show up to 2 focus people
     ========================= */
  function updateDashboard() {
    if (!people.length) {
      dashFocus.textContent = "—";
      dashPause.textContent = "—";
      dashAction.textContent = "Add someone to begin.";
      return;
    }

    const paused = people.filter(p => Number(p.focus) <= 20);

    const candidates = people
      .filter(p => (p.status === "dating" && Number(p.focus) > 80) || (p.status === "crush" && Number(p.focus) > 60))
      .sort((a,b) => Number(b.focus) - Number(a.focus))
      .slice(0,2);

    let focusText = "—";
    if (candidates.length) focusText = candidates.map(p => p.name).join(", ");
    else {
      const highest = [...people].sort((a,b) => Number(b.focus) - Number(a.focus))[0];
      if (highest && typeof highest.name !== "undefined") focusText = highest.name;
    }

    dashFocus.textContent = focusText;
    dashPause.textContent = paused.length ? paused.map(p => p.name).join(", ") : "—";

    let actionText = "Add someone to begin.";
    if (candidates.length) actionText = adviceFor(candidates[0].focus);
    else {
      const highest = [...people].sort((a,b) => Number(b.focus) - Number(a.focus))[0];
      if (highest) actionText = adviceFor(highest.focus);
    }
    dashAction.textContent = actionText;
  }

  /* =========================
     Render people list (no debug output)
     ========================= */
  function escapeHtml(s) {
    if (s === undefined || s === null) return "";
    return String(s).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  function render(){
    list.innerHTML = "";

    const glowSet = new Set(
      people
        .filter(p => (p.status === "dating" && Number(p.focus) > 80) || (p.status === "crush" && Number(p.focus) > 60))
        .sort((a,b) => Number(b.focus) - Number(a.focus))
        .slice(0,2)
        .map(p => p.name)
    );

    people.forEach((p,i) => {
      const card = document.createElement("div");
      const isPaused = Number(p.focus) <= 20;
      const isGlow = !isPaused && glowSet.has(p.name);
      card.className = `card person${isPaused ? " paused" : isGlow ? " glow" : ""}`;

      // build inner HTML
      const reminderHtml = p.reminder ? `<div class="reminder">⏰ ${escapeHtml(p.reminder)}</div>` : "";
      card.innerHTML = `
        <strong>${escapeHtml(p.name)}</strong>
        <span class="sub">${escapeHtml(p.status)}</span>

        <div class="focus-bar" aria-hidden="true">
          <div class="focus-fill" style="width:${Number(p.focus)}%"></div>
        </div>
        <div class="sub">${Number(p.focus)}% focus</div>

        ${reminderHtml}
        <div class="advice">${escapeHtml(adviceFor(p.focus))}</div>

        <div class="card-actions">
          <button type="button" onclick="openEditModal(${i})">Edit</button>
          <button type="button" onclick="removePerson(${i})">Remove</button>
        </div>
      `;
      list.appendChild(card);
    });

    updateDashboard();
  }

  /* =========================
     Add person (save on add)
     ========================= */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name) return;

    const newPerson = {
      name,
      status: statusInput.value,
      focus: Number(focus),
      notes: (form.notes && form.notes.value) ? form.notes.value.trim() : "",
      reminder: (form.reminder && form.reminder.value) ? form.reminder.value.trim() : ""
    };

    people.push(newPerson);
    save();
    render();

    form.reset();
    focus = 0;
    updateFocus();
    statusInput.value = "crush";
    statusButtons.forEach(b => b.classList.remove("active"));
    if (defaultBtn) defaultBtn.classList.add("active");
  });

  /* =========================
     Save / remove helpers
     ========================= */
  function save(){
    // persist the full people array
    localStorage.setItem("rizz_people", JSON.stringify(people));
  }

  function removePerson(i){
    if (typeof i !== "number" || i < 0 || i >= people.length) return;
    people.splice(i,1);
    save();
    render();
  }

  /* =========================
     Edit modal (global functions used by inline onclick)
     ========================= */
  let editingIndex = null;
  const editModal = document.getElementById("editModal");
  const editNameInput = document.getElementById("editNameInput");
  const editStatusSelect = document.getElementById("editStatusSelect");
  const editFocus = document.getElementById("editFocus");
  const editFocusValue = document.getElementById("editFocusValue");

  // expose to global so inline onclick can call it
  window.openEditModal = function(i){
    if (typeof i !== "number" || i < 0 || i >= people.length) return;
    editingIndex = i;
    const p = people[i];
    editNameInput.value = p.name || "";
    editStatusSelect.value = p.status || "crush";
    editFocus.value = Number(p.focus) || 0;
    editFocusValue.textContent = (Number(p.focus) || 0) + "%";
    editModal.classList.remove("hidden");
    editModal.setAttribute("aria-hidden","false");
    // prevent body scroll while modal open
    document.body.style.overflow = "hidden";
    // focus input after slight delay for mobile keyboard friendliness
    setTimeout(() => { try { editNameInput.focus(); } catch(e){} }, 120);
  };

  window.closeEdit = function(){
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
    editingIndex = null;
  };

  editFocus.addEventListener("input", () => {
    editFocusValue.textContent = (Number(editFocus.value) || 0) + "%";
  });

  window.saveEdit = function(){
    if (editingIndex === null) return;
    const idx = editingIndex;
    const p = people[idx];
    const newName = editNameInput.value.trim();
    const newStatus = editStatusSelect.value;
    const newFocus = Math.max(0, Math.min(100, parseInt(editFocus.value,10) || 0));

    p.name = newName || p.name;
    if (["crush","dating","pause"].includes(newStatus)) p.status = newStatus;
    p.focus = newFocus;

    save();
    render();
    window.closeEdit();
  };

  /* =========================
     Init
     ========================= */
  updateFocus();
  render();

  // expose save/remove for debugging if needed (but no automatic debug output)
  window.__rizz_save = save;
  window.__rizz_removePerson = removePerson;
})();