/* =========================
   Rizz Web — Version 2
   JS (Reminder Test Mode)
   ⚠️ ONLY adds testing output
   ========================= */

/* click sound */
const clickSound = document.getElementById("clickSound");
document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn || !clickSound) return;
  try {
    clickSound.currentTime = 0;
    clickSound.volume = 0.35;
    clickSound.play().catch(()=>{});
  } catch(e){}
});

/* core elements */
const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.querySelector('[name="status"]');
const focusInput = form.querySelector('[name="focus"]');

/* state */
let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];

/* =========================
   STATUS BUTTONS
   ========================= */
document.querySelectorAll(".status-buttons button").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".status-buttons button")
      .forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});
const defaultBtn = document.querySelector('[data-status="crush"]');
if(defaultBtn) defaultBtn.classList.add("active");

/* =========================
   FOCUS CONTROLS
   ========================= */
document.getElementById("plus").onclick = ()=>{
  focus = Math.min(100, focus + 10);
  updateFocus();
};
document.getElementById("minus").onclick = ()=>{
  focus = Math.max(0, focus - 10);
  updateFocus();
};

function updateFocus(){
  focusValueEl.textContent = focus + "%";
  focusInput.value = focus;
}

/* =========================
   ADVICE
   ========================= */
function adviceFor(f){
  if(f >= 80) return "High priority. Reach out or plan a meet.";
  if(f >= 60) return "Good momentum. Stay consistent.";
  if(f >= 30) return "Keep it steady. No pressure.";
  return "Low priority. Do not over-invest.";
}
/* =========================
   NEXT MOVE ENGINE — V2 ADD-ON
   (Pure logic, no UI mutation)
   ========================= */

const NEXT_MOVES = {
  dating: {
    high: [
      "Plan a proper date",
      "Have a meaningful call",
      "Talk about direction",
      "Create quality time",
      "Strengthen emotional bond",
      "Be intentional today"
    ],
    mid: [
      "Check in emotionally",
      "Light call or voice note",
      "Stay consistent",
      "Show appreciation",
      "Keep calm momentum"
    ],
    low: [
      "Give her space",
      "Respond only",
      "Avoid heavy talk",
      "Observe energy",
      "Do nothing today"
    ]
  },
  crush: {
    high: [
      "Flirt confidently",
      "Suggest a casual meet",
      "Increase attraction",
      "Create mystery",
      "Escalate playfully"
    ],
    mid: [
      "Light teasing",
      "Casual check-in",
      "Keep mystery",
      "React to her energy",
      "Avoid over-texting"
    ],
    low: [
      "Pull back",
      "Let her miss you",
      "No chasing",
      "Protect your energy",
      "Stay silent"
    ]
  },
  pause: [
    "No action today",
    "Do nothing",
    "Reset emotionally",
    "Focus on yourself",
    "Let time pass"
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nextMoveFor(person) {
  const f = person.focus;
  const s = person.status;

  if (f <= 20 || s === "pause") {
    return pickRandom(NEXT_MOVES.pause);
  }

  if (s === "dating") {
    if (f >= 80) return pickRandom(NEXT_MOVES.dating.high);
    if (f >= 50) return pickRandom(NEXT_MOVES.dating.mid);
    return pickRandom(NEXT_MOVES.dating.low);
  }

  if (s === "crush") {
    if (f >= 60) return pickRandom(NEXT_MOVES.crush.high);
    if (f >= 30) return pickRandom(NEXT_MOVES.crush.mid);
    return pickRandom(NEXT_MOVES.crush.low);
  }

  return "No action today";
}

/* =========================
   DASHBOARD
   ========================= */
function updateDashboard(){
  if(!people.length){
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const paused = people.filter(p => p.focus <= 20);
  const candidates = people
    .filter(p =>
      (p.status === "dating" && p.focus > 80) ||
      (p.status === "crush" && p.focus > 60)
    )
    .sort((a,b)=>b.focus-a.focus)
    .slice(0,2);

  dashFocus.textContent = candidates.length
    ? candidates.map(p=>p.name).join(", ")
    : "—";

  dashPause.textContent = paused.length
    ? paused.map(p=>p.name).join(", ")
    : "—";

  dashAction.textContent = candidates.length
    ? adviceFor(candidates[0].focus)
    : "Stay steady.";
}

/* =========================
   RENDER (REMINDER TEST ENABLED)
   ========================= */
function render(){
  list.innerHTML = "";

  const glowSet = new Set(
    people
      .filter(p =>
        (p.status==="dating" && p.focus>80) ||
        (p.status==="crush" && p.focus>60)
      )
      .sort((a,b)=>b.focus-a.focus)
      .slice(0,2)
      .map(p=>p.name)
  );

  people.forEach((p,i)=>{
    const card = document.createElement("div");
    card.className = `card person ${
      p.focus<=20 ? "paused" :
      glowSet.has(p.name) ? "glow" : ""
    }`;

    card.innerHTML = `
      <strong>${p.name}</strong>
      <span class="sub">${p.status}</span>

      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>

      ${p.reminder
        ? `<div class="reminder">⏰ ${p.reminder}</div>`
        : ""}

      <div class="advice">${adviceFor(p.focus)}</div>

      <div class="card-actions">
        <button onclick="openEditModal(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });


  updateDashboard();
}

/* =========================
   ADD
   ========================= */
form.onsubmit = e=>{
  e.preventDefault();

  const name = form.name.value.trim();
  if(!name) return;

  people.push({
  name,
  status: statusInput.value,
  focus,
  notes: form.notes.value.trim(),
  reminder: form.reminder.value.trim(),
  nextMove: "" // filled after save
});
people[people.length - 1].nextMove =
  nextMoveFor(people[people.length - 1]);

  save();
  render();

  form.reset();
  focus = 0;
  updateFocus();

  document.querySelectorAll(".status-buttons button")
    .forEach(b=>b.classList.remove("active"));
  if(defaultBtn) defaultBtn.classList.add("active");
};

/* =========================
   SAVE / REMOVE
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
   EDIT MODAL
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

  editNameInput.value = p.name;
  editStatusSelect.value = p.status;
  editFocus.value = p.focus;
  editFocusValue.textContent = p.focus + "%";

  editModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

editFocus.oninput = () => {
  editFocusValue.textContent = editFocus.value + "%";
};

function closeEdit(){
  editModal.classList.add("hidden");
  document.body.style.overflow = "";
  editingIndex = null;
}

function saveEdit(){
  if(editingIndex === null) return;

  const p = people[editingIndex];
  p.name = editNameInput.value.trim();
  p.status = editStatusSelect.value;
  p.focus = parseInt(editFocus.value,10) || 0;

  save();
  render();
  closeEdit();
}

/* =========================
   INIT
   ========================= */
updateFocus();
render();