const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");
const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.status;
const focusInput = form.focus;

let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];
let editingIndex = null;

/* ================= NEXT MOVE ENGINE ================= */

const MOVES = {
  dating: {
    high: [
      "Plan a quality date this week",
      "Have a deeper emotional conversation",
      "Surprise her with something thoughtful"
    ],
    mid: [
      "Check in with a warm message",
      "Suggest a casual hangout",
      "Keep communication consistent"
    ],
    low: [
      "Reduce pressure",
      "Let her initiate next",
      "Observe energy levels"
    ]
  },
  crush: {
    high: [
      "Flirt confidently",
      "Create anticipation",
      "Suggest light meetup"
    ],
    mid: [
      "Send a friendly thinking-of-you text",
      "Engage with humor",
      "Build familiarity"
    ],
    low: [
      "Stay distant",
      "Focus elsewhere",
      "Do not over-invest"
    ]
  },
  pause: {
    any: [
      "Do nothing",
      "Let space work",
      "No action required"
    ]
  }
};

function generateNextMove(p) {
  const pool =
    p.status === "dating"
      ? p.focus >= 80 ? MOVES.dating.high :
        p.focus >= 50 ? MOVES.dating.mid : MOVES.dating.low
    : p.status === "crush"
      ? p.focus >= 60 ? MOVES.crush.high :
        p.focus >= 30 ? MOVES.crush.mid : MOVES.crush.low
    : MOVES.pause.any;

  return pool[Math.floor(Math.random() * pool.length)];
}

/* ================= FOCUS CONTROL ================= */

function setFocus(val) {
  focus = Math.max(0, Math.min(100, val));
  focusInput.value = focus;
  focusValueEl.textContent = focus + "%";
}

document.getElementById("plus").onclick = () => setFocus(focus + 10);
document.getElementById("minus").onclick = () => setFocus(focus - 10);

/* ================= ADD ================= */

form.onsubmit = e => {
  e.preventDefault();

  const person = {
    name: form.name.value.trim(),
    status: statusInput.value,
    focus,
    notes: form.notes.value,
    reminder: form.reminder.value,
    nextMove: null
  };

  person.nextMove = generateNextMove(person);

  people.push(person);
  save();
  render();

  form.reset();
  setFocus(0);
};

/* ================= DASHBOARD ================= */

function updateDashboard() {
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const paused = people.filter(p => p.focus <= 20);
  const focusList = people
    .filter(p => p.focus > 20)
    .sort((a, b) => b.focus - a.focus)
    .slice(0, 2);

  dashFocus.textContent = focusList.map(p => p.name).join(", ") || "—";
  dashPause.textContent = paused.map(p => p.name).join(", ") || "—";
  dashAction.textContent = focusList[0]?.nextMove || "Stay steady.";
}

/* ================= RENDER ================= */

function render() {
  list.innerHTML = "";

  const glowing = people
    .filter(p => p.focus > 20)
    .sort((a, b) => b.focus - a.focus)
    .slice(0, 2);

  people.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "person " +
      (p.focus <= 20 ? "paused" :
       glowing.includes(p) ? "glow" : "");

    div.innerHTML = `
      <strong>${p.name}</strong>
      <div>${p.status}</div>
      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div>${p.focus}% focus</div>
      ${p.reminder ? `<div>⏰ ${p.reminder}</div>` : ""}
      <div><em>Next Move:</em> ${p.nextMove}</div>
      <button onclick="openEdit(${i})">Edit</button>
      <button onclick="removePerson(${i})">Remove</button>
    `;

    list.appendChild(div);
  });

  updateDashboard();
}

/* ================= EDIT ================= */

function openEdit(i) {
  editingIndex = i;
  const p = people[i];

  document.getElementById("editName").value = p.name;
  document.getElementById("editStatus").value = p.status;
  document.getElementById("editFocus").value = p.focus;
  document.getElementById("editFocusValue").textContent = p.focus + "%";

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEdit() {
  document.getElementById("editModal").classList.add("hidden");
}

document.getElementById("editFocus").oninput = e => {
  document.getElementById("editFocusValue").textContent = e.target.value + "%";
};

function saveEdit() {
  const p = people[editingIndex];
  p.name = document.getElementById("editName").value;
  p.status = document.getElementById("editStatus").value;
  p.focus = +document.getElementById("editFocus").value;
  p.nextMove = generateNextMove(p);

  save();
  render();
  closeEdit();
}

/* ================= UTILS ================= */

function removePerson(i) {
  people.splice(i, 1);
  save();
  render();
}

function save() {
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

/* ================= INIT ================= */

setFocus(0);
render();