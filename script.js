/* ===============================
   RIZZ WEB — VERSION 2 (LOCKED)
   Clean, Stable, Production JS
   =============================== */

/* ---------- STORAGE ---------- */
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];
let focus = 0;
let editingIndex = null;

/* ---------- ELEMENTS ---------- */
const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const focusInput = form.querySelector('[name="focus"]');
const statusInput = form.querySelector('[name="status"]');

/* ---------- STATUS BUTTONS ---------- */
document.querySelectorAll(".status-buttons button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".status-buttons button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});
document.querySelector('[data-status="crush"]').classList.add("active");

/* ---------- FOCUS CONTROLS (UI ONLY) ---------- */
document.getElementById("plus").onclick = () => {
  focus = Math.min(100, focus + 10);
  updateFocusUI();
};
document.getElementById("minus").onclick = () => {
  focus = Math.max(0, focus - 10);
  updateFocusUI();
};

function updateFocusUI(){
  focusValueEl.textContent = focus + "%";
  focusInput.value = focus;
}

/* ===============================
   NEXT MOVE ENGINE (HUGE SET)
   =============================== */

const datingHigh = [
  "Plan a quality date this week",
  "Talk about future goals together",
  "Deep conversation about direction",
  "Create a shared routine",
  "Discuss exclusivity",
  "Surprise her with thoughtful effort",
  "Spend uninterrupted quality time",
  "Reinforce emotional security",
  "Make long-term plans",
  "Open up emotionally"
];

const datingMid = [
  "Check in emotionally today",
  "Plan something light together",
  "Keep consistency without pressure",
  "Flirty but calm conversation",
  "Support her plans",
  "Show appreciation",
  "Casual call or voice note",
  "Maintain attraction gently",
  "Be present, not intense",
  "Let things flow naturally"
];

const datingLow = [
  "Give space today",
  "Respond but don’t push",
  "Keep it calm and light",
  "Avoid heavy conversations",
  "Focus on yourself today",
  "No initiating today",
  "Observe her energy",
  "Let interest breathe",
  "Minimal effort check-in",
  "Do nothing today"
];

const crushHigh = [
  "Flirt confidently",
  "Suggest a casual meet",
  "Build sexual tension lightly",
  "Compliment her vibe",
  "Create intrigue",
  "Escalate playfully",
  "Test availability",
  "Increase emotional presence",
  "Let her feel wanted",
  "Move things forward"
];

const crushMid = [
  "Send a fun message",
  "Keep mystery",
  "Light teasing",
  "Stay consistent",
  "React to her energy",
  "Casual check-in",
  "Avoid over-texting",
  "Keep attraction alive",
  "Let her invest",
  "Be interesting, not needy"
];

const crushLow = [
  "Pull back slightly",
  "Observe from distance",
  "No chasing",
  "Focus elsewhere today",
  "Respond only",
  "Let her miss you",
  "Minimal interaction",
  "Protect your energy",
  "Do nothing today",
  "Stay silent"
];

const pauseMoves = [
  "Do nothing today",
  "No contact",
  "Reset emotional energy",
  "Focus on yourself",
  "Let time pass",
  "Pause all effort",
  "No reactions today",
  "Clear your head",
  "Wait and observe",
  "Stay detached"
];

function pick(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

function getNextMove(p){
  if (p.status === "pause" || p.focus <= 20) {
    return pick(pauseMoves);
  }

  if (p.status === "dating") {
    if (p.focus >= 80) return pick(datingHigh);
    if (p.focus >= 50) return pick(datingMid);
    return pick(datingLow);
  }

  if (p.status === "crush") {
    if (p.focus >= 60) return pick(crushHigh);
    if (p.focus >= 30) return pick(crushMid);
    return pick(crushLow);
  }

  return "No action today";
}

/* ===============================
   DASHBOARD (SAVE-ONLY)
   =============================== */
function updateDashboard(){
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const paused = people.filter(p => p.focus <= 20);
  const focused = people
    .filter(p =>
      (p.status === "dating" && p.focus >= 80) ||
      (p.status === "crush" && p.focus >= 60)
    )
    .sort((a,b) => b.focus - a.focus)
    .slice(0,2);

  dashFocus.textContent = focused.length
    ? focused.map(p => p.name).join(", ")
    : "—";

  dashPause.textContent = paused.length
    ? paused.map(p => p.name).join(", ")
    : "—";

  dashAction.textContent = focused.length
    ? focused[0].nextMove + " — " + focused[0].name
    : "Stay steady.";
}

/* ===============================
   RENDER
   =============================== */
function render(){
  list.innerHTML = "";

  people.forEach((p,i) => {
    const card = document.createElement("div");
    card.className = "card person";
    if (p.focus <= 20) card.classList.add("paused");

    card.innerHTML = `
      <strong>${p.name}</strong>
      <span class="sub">${p.status}</span>
      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>
      ${p.reminder ? `<div class="reminder">⏰ ${p.reminder}</div>` : ""}
      <div class="next-move"><strong>Next Move:</strong> ${p.nextMove}</div>
      <div class="card-actions">
        <button onclick="openEdit(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });

  updateDashboard();
}

/* ===============================
   ADD PERSON (SAVE TRIGGERS LOGIC)
   =============================== */
form.onsubmit = e => {
  e.preventDefault();

  const p = {
    name: form.name.value.trim(),
    status: statusInput.value,
    focus,
    notes: form.notes.value.trim(),
    reminder: form.reminder.value.trim(),
    nextMove: ""
  };

  p.nextMove = getNextMove(p);
  people.push(p);

  save();
  render();

  form.reset();
  focus = 0;
  updateFocusUI();
};

/* ===============================
   EDIT
   =============================== */
function openEdit(i){
  editingIndex = i;
  const p = people[i];

  document.getElementById("editNameInput").value = p.name;
  document.getElementById("editStatusSelect").value = p.status;
  document.getElementById("editFocus").value = p.focus;
  document.getElementById("editFocusValue").textContent = p.focus + "%";

  document.getElementById("editModal").classList.remove("hidden");
}

function saveEdit(){
  const p = people[editingIndex];

  p.name = document.getElementById("editNameInput").value.trim();
  p.status = document.getElementById("editStatusSelect").value;
  p.focus = parseInt(document.getElementById("editFocus").value, 10);
  p.nextMove = getNextMove(p);

  save();
  render();
  closeEdit();
}

function closeEdit(){
  document.getElementById("editModal").classList.add("hidden");
  editingIndex = null;
}

/* ===============================
   REMOVE
   =============================== */
function removePerson(i){
  people.splice(i,1);
  save();
  render();
}

/* ===============================
   SAVE
   =============================== */
function save(){
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

/* ===============================
   INIT
   =============================== */
updateFocusUI();
render();