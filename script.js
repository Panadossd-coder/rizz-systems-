/* script.js — Rizz Web v2
   Includes Smart Focus Engine (decay + lastTouched) — minimal safe upgrade
   Replace your existing script.js with this file.
*/

/* =========================
   CLICK SOUND (unchanged)
   ========================= */
const clickSound = document.getElementById("clickSound");
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || !clickSound) return;
  try {
    clickSound.currentTime = 0;
    clickSound.volume = 0.35;
    clickSound.play().catch(() => {});
  } catch (err) {}
});

/* =========================
   CORE ELEMENTS & STATE
   ========================= */
const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.querySelector('[name="status"]');
const focusInput = form.querySelector('[name="focus"]');

let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];

/* =========================
   SMART FOCUS — Data Normalization
   (backwards compatible)
   ========================= */
function normalizePeopleData() {
  const now = Date.now();
  people.forEach(p => {
    // ensure lastTouched exists
    if (!p.lastTouched) {
      p.lastTouched = now;
    }
    // ensure focus is numeric
    if (typeof p.focus !== "number") {
      p.focus = parseInt(p.focus, 10) || 0;
    }
    // safety: clamp focus 0-100
    p.focus = Math.max(0, Math.min(100, p.focus));
  });
}

/* =========================
   SMART FOCUS ENGINE
   - decay: -5% per 24h of no interaction (only when saving counts)
   - no decay for status === "pause"
   - resets lastTouched after decay applied
   ========================= */
function runSmartFocusEngine() {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let changed = false;

  people.forEach(p => {
    if (p.status === "pause") return; // no decay for paused

    const elapsed = now - (p.lastTouched || now);
    if (elapsed < DAY) return;

    const days = Math.floor(elapsed / DAY);
    if (days <= 0) return;

    const decay = days * 5; // -5% per day
    const oldFocus = p.focus;
    p.focus = Math.max(0, p.focus - decay);

    if (p.focus !== oldFocus) {
      changed = true;
    }

    // Avoid repeated immediate decay: set lastTouched to now
    p.lastTouched = now;
  });

  if (changed) {
    save();
  }
}

/* =========================
   ADVICE HELPER (unchanged)
   ========================= */
function adviceFor(f){
  if(f >= 80) return "High priority. Reach out or plan a meet.";
  if(f >= 60) return "Good momentum. Stay consistent.";
  if(f >= 30) return "Keep it steady. No pressure.";
  return "Low priority. Do not over-invest.";
}

/* =========================
   DASHBOARD RULES (unchanged logic)
   Focus candidates: dating>80 OR crush>60 (max 2)
   Paused: focus <= 20
   ========================= */
function updateDashboard(){
  if(!people.length){
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const paused = people.filter(p => parseInt(p.focus, 10) <= 20);

  const candidates = people
    .filter(p => (p.status === "dating" && p.focus > 80) || (p.status === "crush" && p.focus > 60))
    .sort((a,b) => b.focus - a.focus)
    .slice(0,2);

  const focusText = candidates.length ? candidates.map(p => p.name).join(", ") : (() => {
    const highest = [...people].sort((a,b)=>b.focus-a.focus)[0];
    return highest && highest.name ? highest.name : "—";
  })();

  dashFocus.textContent = focusText;
  dashPause.textContent = paused.length ? paused.map(p => p.name).join(", ") : "—";
  dashAction.textContent = candidates.length ? adviceFor(candidates[0].focus) : (() => {
    const highest = [...people].sort((a,b)=>b.focus-a.focus)[0];
    return highest ? adviceFor(highest.focus) : "Add someone to begin.";
  })();
}

/* =========================
   RENDER (unchanged except safety of data fields)
   ========================= */
function render(){
  list.innerHTML = "";

  // compute candidate names set
  const candidateNames = new Set(
    people
      .filter(p => (p.status === "dating" && p.focus > 80) || (p.status === "crush" && p.focus > 60))
      .sort((a,b)=>b.focus-a.focus)
      .slice(0,2)
      .map(p => p.name)
  );

  people.forEach((p,i) => {
    const card = document.createElement("div");
    const isPaused = parseInt(p.focus,10) <= 20;
    let classes = "card person";
    if (isPaused) classes += " paused";
    else if (candidateNames.has(p.name)) classes += " glow";

    card.className = classes;

    card.innerHTML = `
      <strong>${escapeHtml(p.name)}</strong>
      <span class="sub">${escapeHtml(p.status)}</span>

      <div class="focus-bar" aria-hidden="true">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>

      ${p.reminder ? `<div class="reminder">⏰ ${escapeHtml(p.reminder)}</div>` : ""}
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

/* simple escape (keeps display safe) */
function escapeHtml(s) {
  if (!s && s !== 0) return "";
  return String(s).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

/* =========================
   SAVE / REMOVE (unchanged)
   ========================= */
function save(){
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

function removePerson(i){
  people.splice(i,1);
  save();
  render();
}

/* =========================
   FOCUS CONTROLS (unchanged)
   ========================= */
document.getElementById("plus").onclick = () => {
  focus = Math.min(100, focus + 10);
  updateFocus();
};
document.getElementById("minus").onclick = () => {
  focus = Math.max(0, focus - 10);
  updateFocus();
};

function updateFocus() {
  focusValueEl.textContent = `${focus}%`;
  focusInput.value = focus;
}

/* ---------------- STATUS BUTTONS (form) ---------------- */
document.querySelectorAll(".status-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".status-buttons button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  });
});
const defaultBtn = document.querySelector('.status-buttons button[data-status="crush"]');
if (defaultBtn) defaultBtn.classList.add("active");

/* =========================
   ADD (form submit) - now sets lastTouched
   ========================= */
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = form.name.value.trim();
  if (!name) return;

  people.push({
    name,
    status: statusInput.value,
    focus,
    notes: form.notes.value.trim(),
    reminder: form.reminder.value.trim(),
    lastTouched: Date.now() // <-- SMART ENGINE: record interaction at add/save
  });

  save();
  render();

  form.reset();
  focus = 0;
  updateFocus();

  // reset status UI
  statusInput.value = "crush";
  document.querySelectorAll(".status-buttons button").forEach(b => b.classList.remove("active"));
  if (defaultBtn) defaultBtn.classList.add("active");
});

/* =========================
   EDIT MODAL (restored behavior)
   - openEditModal, closeEdit, saveEdit
   - saveEdit updates lastTouched
   ========================= */
let editingIndex = null;
const editModal = document.getElementById("editModal");
const editNameInput = document.getElementById("editNameInput");
const editStatusSelect = document.getElementById("editStatusSelect");
const editFocus = document.getElementById("editFocus");
const editFocusValue = document.getElementById("editFocusValue");

function openEditModal(i){
  editingIndex = i;
  const p = people[i];
  editNameInput.value = p.name || "";
  editStatusSelect.value = p.status || "crush";
  editFocus.value = p.focus || 0;
  editFocusValue.textContent = (p.focus || 0) + "%";
  editModal.classList.remove("hidden");
  editModal.setAttribute("aria-hidden","false");
  setTimeout(()=> editNameInput.focus(), 120);
}

function closeEdit(){
  editModal.classList.add("hidden");
  editModal.setAttribute("aria-hidden","true");

  // iOS repaint unlock trick (keeps Safari from trapping)
  requestAnimationFrame(() => {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
  });

  editingIndex = null;
}

editFocus.oninput = () => editFocusValue.textContent = editFocus.value + "%";

function saveEdit(){
  if (editingIndex === null) return;

  const newName = editNameInput.value.trim();
  const newStatus = editStatusSelect.value;
  const newFocus = Math.max(0, Math.min(100, parseInt(editFocus.value, 10) || 0));

  // update person
  people[editingIndex].name = newName || people[editingIndex].name;
  if (["crush","dating","pause"].includes(newStatus)) {
    people[editingIndex].status = newStatus;
  }
  people[editingIndex].focus = newFocus;

  // SMART ENGINE: mark this as interaction (only saving counts)
  people[editingIndex].lastTouched = Date.now();

  save();
  render();
  closeEdit();
}

/* =========================
   INIT: normalize data, run engine, then render
   ========================= */
normalizePeopleData();
runSmartFocusEngine();
updateFocus();
render();