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
    clickSound.play().catch(() => {});
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

/* =========================
   EDIT MODAL LOGIC — NAME, STATUS, FOCUS
   Replace previous edit-person blocks with this
   ========================= */
let editingIndex = null;

function editPerson(i){
  editingIndex = i;
  const p = people[i];

  // populate fields inside modal
  const nameInput = document.getElementById("editNameInput");
  const statusSelect = document.getElementById("editStatusSelect");
  const slider = document.getElementById("editFocus");
  const value = document.getElementById("editFocusValue");

  nameInput.value = p.name || "";
  statusSelect.value = p.status || "crush";

  slider.value = p.focus || 0;
  value.textContent = (p.focus || 0) + "%";

  slider.oninput = () => {
    value.textContent = slider.value + "%";
  };

  // show modal
  document.getElementById("editModal").classList.remove("hidden");
  document.getElementById("editModal").setAttribute("aria-hidden", "false");

  // focus the name input for quick editing on mobile
  setTimeout(()=> nameInput.focus(), 120);
}

function closeEdit(){
  document.getElementById("editModal").classList.add("hidden");
  document.getElementById("editModal").setAttribute("aria-hidden", "true");
  editingIndex = null;
}

function saveEdit(){
  if (editingIndex === null) return;

  const nameInput = document.getElementById("editNameInput");
  const statusSelect = document.getElementById("editStatusSelect");
  const slider = document.getElementById("editFocus");

  const newName = nameInput.value.trim();
  const newStatus = statusSelect.value;
  const newFocus = Math.max(0, Math.min(100, parseInt(slider.value, 10) || 0));

  // update person
  people[editingIndex].name = newName || people[editingIndex].name;
  if (["crush","dating","pause"].includes(newStatus)) {
    people[editingIndex].status = newStatus;
  }
  people[editingIndex].focus = newFocus;

  // save + refresh display
  save();
  render();

  closeEdit();
}
let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];

/* ---------------- STATUS BUTTONS ---------------- */
document.querySelectorAll(".status-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".status-buttons button")
      .forEach(b => b.classList.remove("active"));

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
  if(f >= 80) return "High priority. Reach out or plan a meet.";
  if(f >= 60) return "Good momentum. Stay consistent.";
  if(f >= 30) return "Keep it steady. No pressure.";
  return "Low priority. Do not over-invest.";
}

/* ---------------- DASHBOARD ---------------- */
function updateDashboard(){
  if(!people.length){
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }
  const sorted = [...people].sort((a,b)=>b.focus-a.focus);
  const focusP = sorted[0];
  const pauseP = people.find(p=>p.status==="pause");

  dashFocus.textContent = focusP ? focusP.name : "—";
  dashPause.textContent = pauseP ? pauseP.name : "—";
  dashAction.textContent = adviceFor(focusP.focus);
}

/* ---------------- RENDER ---------------- */
function render(){
  list.innerHTML = "";

  people.forEach((p,i)=>{
    const card = document.createElement("div");
    let extraClass = "";
if (p.focus <= 20) extraClass = "dim";
else if (p.focus >= 70) extraClass = "glow";
card.className = `card person ${extraClass}`;

    card.innerHTML = `
      <strong>${p.name}</strong><br>
      <span class="sub">${p.status}</span>

      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>

      ${p.reminder ? `<div class="reminder">⏰ ${p.reminder}</div>` : ""}
      <div class="advice">${adviceFor(p.focus)}</div>

      <p>${p.notes || ""}</p>

      <div class="card-actions">
        <button onclick="editPerson(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>
    `;

    list.appendChild(card);
  });

  updateDashboard();
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
    status: statusInput.value,
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
  document.querySelectorAll(".status-buttons button")
    .forEach(b=>b.classList.remove("active"));
  if (defaultStatusBtn) defaultStatusBtn.classList.add("active");
});

/* INIT */
updateFocus();
render();