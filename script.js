/* =========================
   BUTTON CLICK SOUND
   ========================= */
const clickSound = document.getElementById("clickSound");
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || !clickSound) return;
  try {
    clickSound.currentTime = 0;
    clickSound.volume = 0.35;
    clickSound.play().catch(()=>{});
  } catch (err) {}
});

/* =========================
   CORE APP LOGIC
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

/* ---------------- STATUS BUTTONS ---------------- */
const statusButtons = document.querySelectorAll(".status-buttons button");
statusButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    statusButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  });
});
const defaultStatusBtn = document.querySelector('.status-buttons button[data-status="crush"]');
if (defaultStatusBtn) defaultStatusBtn.classList.add("active");

/* ---------------- FOCUS CONTROLS ---------------- */
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

/* ---------------- ADVICE ---------------- */
function adviceFor(f){
  if (f >= 80) return "High priority. Reach out or plan a meet.";
  if (f >= 60) return "Good momentum. Stay consistent.";
  if (f >= 30) return "Keep it steady. No pressure.";
  return "Low priority. Do not over-invest.";
}

/* ---------------- DASHBOARD ---------------- */
function updateDashboard(){
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }
  const sorted = [...people].sort((a,b)=>b.focus - a.focus);
  const focusP = sorted[0];
  const pauseP = people.find(p=>p.status==="pause");
  dashFocus.textContent = focusP ? focusP.name : "—";
  dashPause.textContent = pauseP ? pauseP.name : "—";
  dashAction.textContent = adviceFor(focusP.focus || 0);
}

/* ---------------- RENDER ---------------- */
function render(){
  list.innerHTML = "";
  people.forEach((p,i) => {
    const card = document.createElement("div");
    card.className = `card person ${p.focus <= 20 ? "dim" : (p.focus >= 70 ? "glow" : "")}`;
    card.dataset.status = p.status || "crush"; // used by CSS auras
    card.innerHTML = `
      <strong>${escapeHtml(p.name)}</strong>
      <div class="sub">${escapeHtml(p.status)}</div>

      <div class="focus-bar">
        <div class="focus-fill" style="width:${Number(p.focus||0)}%"></div>
      </div>
      <div class="sub">${Number(p.focus||0)}% focus</div>

      ${p.reminder ? `<div class="reminder">⏰ ${escapeHtml(p.reminder)}</div>` : ""}
      <div class="advice">${escapeHtml(adviceFor(Number(p.focus||0)))}</div>

      <p>${escapeHtml(p.notes||"")}</p>

      <div class="card-actions">
        <button type="button" onclick="openEdit(${i})">Edit</button>
        <button type="button" onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });
  updateDashboard();
}

/* small helper to avoid injected html */
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]; });
}

/* ---------------- REMOVE ---------------- */
function removePerson(i){
  people.splice(i,1);
  save();
  render();
}

/* ---------------- SAVE ---------------- */
function save(){
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

/* ---------------- ADD ---------------- */
form.addEventListener("submit", e=>{
  e.preventDefault();
  const name = form.name.value.trim();
  if (!name) return;
  people.push({
    name,
    status: statusInput.value || "crush",
    focus,
    notes: form.notes.value.trim(),
    reminder: form.reminder.value.trim()
  });
  save();
  render();
  form.reset();
  focus = 0;
  updateFocus();
  statusInput.value = "crush";
  statusButtons.forEach(b => b.classList.remove("active"));
  if (defaultStatusBtn) defaultStatusBtn.classList.add("active");
});

/* =========================
   EDIT MODAL LOGIC (name, status, focus)
   functions exposed to DOM: openEdit, closeEdit
   ========================= */
const editModal = document.getElementById("editModal");
const editNameInput = document.getElementById("editNameInput");
const editStatusSelect = document.getElementById("editStatusSelect");
const editFocus = document.getElementById("editFocus");
const editFocusValue = document.getElementById("editFocusValue");
const editCancelBtn = document.getElementById("editCancelBtn");
const editSaveBtn = document.getElementById("editSaveBtn");

let editingIndex = null;

function openEdit(i){
  editingIndex = i;
  const p = people[i];
  editNameInput.value = p.name || "";
  editStatusSelect.value = p.status || "crush";
  editFocus.value = Number(p.focus || 0);
  editFocusValue.textContent = editFocus.value + "%";
  editModal.classList.remove("hidden");
  editModal.setAttribute("aria-hidden","false");
  setTimeout(()=> editNameInput.focus(), 120);
}
function closeEdit(){
  editModal.classList.add("hidden");
  editModal.setAttribute("aria-hidden","true");
  editingIndex = null;
}
editCancelBtn.addEventListener("click", closeEdit);
editFocus.addEventListener("input", ()=> { editFocusValue.textContent = editFocus.value + "%"; });
editSaveBtn.addEventListener("click", ()=> {
  if (editingIndex === null) return;
  const newName = editNameInput.value.trim();
  const newStatus = editStatusSelect.value;
  const newFocus = Math.max(0, Math.min(100, parseInt(editFocus.value,10) || 0));
  // update
  people[editingIndex].name = newName || people[editingIndex].name;
  if (["crush","dating","pause"].includes(newStatus)) people[editingIndex].status = newStatus;
  people[editingIndex].focus = newFocus;
  save(); render(); closeEdit();
});

/* close modal on outside click (nice to have) */
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEdit();
});

/* INIT */
updateFocus();
render();
