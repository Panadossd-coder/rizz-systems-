/* =========================
   RIZZ WEB — VERSION 2 (LOCKED)
   Always-On Dashboard + Stable Focus + Expanded Next Moves
   ========================= */

/* ---------- CLICK SOUND ---------- */
const clickSound = document.getElementById("clickSound");
document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn || !clickSound) return;
  try {
    clickSound.currentTime = 0;
    clickSound.volume = 0.3;
    clickSound.play().catch(()=>{});
  } catch {}
});

/* ---------- CORE ELEMENTS ---------- */
const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashboard = document.getElementById("dashboard");
const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.querySelector('[name="status"]');
const focusInput  = form.querySelector('[name="focus"]');

/* ---------- STATE ---------- */
let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];

/* ---------- ALWAYS-ON DASHBOARD ---------- */
dashboard.classList.add("dashboard"); // glass + glow always on

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

/* ---------- FOCUS CONTROLS (SINGLE SOURCE OF TRUTH) ---------- */
function updateFocus() {
  focusValueEl.textContent = focus + "%";
  focusInput.value = focus;
}

document.getElementById("plus").onclick = () => {
  focus = Math.min(100, focus + 10);
  updateFocus();
};

document.getElementById("minus").onclick = () => {
  focus = Math.max(0, focus - 10);
  updateFocus();
};

/* ---------- NEXT MOVE ENGINE ---------- */
const NEXT_MOVES = {
  dating: {
    high: [
      "Plan a quality date this week",
      "Call and check emotional temperature",
      "Set a future plan together",
      "Reinforce commitment with action",
      "Deep conversation about direction"
    ],
    mid: [
      "Send a thoughtful message",
      "Check in without pressure",
      "Light call or voice note",
      "Flirty but calm interaction",
      "Keep rhythm steady"
    ],
    low: [
      "Give space",
      "Do not initiate today",
      "Let her miss you",
      "Observe response patterns"
    ]
  },
  crush: {
    high: [
      "Flirty message with intent",
      "Create emotional tension",
      "Suggest a casual meet",
      "Compliment + curiosity",
      "Increase presence slightly"
    ],
    mid: [
      "Friendly check-in",
      "Reply with warmth",
      "Short playful message",
      "Build familiarity slowly"
    ],
    low: [
      "No chasing",
      "Reduce investment",
      "Focus elsewhere",
      "Let momentum reset"
    ]
  },
  pause: {
    all: [
      "Do nothing today",
      "Protect your energy",
      "Re-evaluate next week",
      "Observe without reacting"
    ]
  }
};

function pickNextMove(person) {
  const f = person.focus;
  const s = person.status;

  if (s === "pause" || f <= 20) {
    return randomFrom(NEXT_MOVES.pause.all);
  }

  if (s === "dating") {
    if (f >= 80) return randomFrom(NEXT_MOVES.dating.high);
    if (f >= 50) return randomFrom(NEXT_MOVES.dating.mid);
    return randomFrom(NEXT_MOVES.dating.low);
  }

  if (s === "crush") {
    if (f >= 60) return randomFrom(NEXT_MOVES.crush.high);
    if (f >= 30) return randomFrom(NEXT_MOVES.crush.mid);
    return randomFrom(NEXT_MOVES.crush.low);
  }

  return "Stay calm and observe.";
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------- DASHBOARD LOGIC ---------- */
function updateDashboard() {
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const paused = people.filter(p => p.focus <= 20);
  const candidates = people
    .filter(p =>
      (p.status === "dating" && p.focus >= 80) ||
      (p.status === "crush" && p.focus >= 60)
    )
    .sort((a,b) => b.focus - a.focus)
    .slice(0,2);

  dashFocus.textContent = candidates.length
    ? candidates.map(p => p.name).join(", ")
    : "—";

  dashPause.textContent = paused.length
    ? paused.map(p => p.name).join(", ")
    : "—";

  if (candidates.length) {
    const p = candidates[0];
    dashAction.textContent =
      pickNextMove(p) + " — " + p.name;
  } else {
    dashAction.textContent = "Maintain balance.";
  }
}

/* ---------- RENDER ---------- */
function render() {
  list.innerHTML = "";

  const glowSet = new Set(
    people
      .filter(p =>
        (p.status === "dating" && p.focus >= 80) ||
        (p.status === "crush" && p.focus >= 60)
      )
      .sort((a,b)=>b.focus-a.focus)
      .slice(0,2)
      .map(p=>p.name)
  );

  people.forEach((p,i) => {
    const card = document.createElement("div");
    card.className =
      "card person " +
      (p.focus <= 20 ? "paused" : glowSet.has(p.name) ? "glow" : "");

    card.innerHTML = `
      <strong>${p.name}</strong>
      <span class="sub">${p.status}</span>

      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>

      ${p.reminder ? `<div class="reminder">⏰ ${p.reminder}</div>` : ""}
      <div class="advice">Next Move: ${pickNextMove(p)}</div>

      <div class="card-actions">
        <button onclick="openEditModal(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });

  updateDashboard();
}

/* ---------- ADD ---------- */
form.onsubmit = e => {
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

  document.querySelectorAll(".status-buttons button")
    .forEach(b => b.classList.remove("active"));
  document.querySelector('[data-status="crush"]').classList.add("active");
};

/* ---------- STORAGE ---------- */
function save() {
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

function removePerson(i) {
  people.splice(i, 1);
  save();
  render();
}

/* ---------- EDIT MODAL ---------- */
let editingIndex = null;
const editModal = document.getElementById("editModal");
const editNameInput = document.getElementById("editNameInput");
const editStatusSelect = document.getElementById("editStatusSelect");
const editFocus = document.getElementById("editFocus");
const editFocusValue = document.getElementById("editFocusValue");

function openEditModal(i) {
  editingIndex = i;
  const p = people[i];

  editNameInput.value = p.name;
  editStatusSelect.value = p.status;
  editFocus.value = p.focus;
  editFocusValue.textContent = p.focus + "%";

  editModal.classList.remove("hidden");
  dashboard.classList.add("modal-open");
}

function closeEdit() {
  editModal.classList.add("hidden");
  dashboard.classList.remove("modal-open");
  editingIndex = null;
}

editFocus.oninput = () =>
  editFocusValue.textContent = editFocus.value + "%";

function saveEdit() {
  if (editingIndex === null) return;

  const p = people[editingIndex];
  p.name = editNameInput.value.trim() || p.name;
  p.status = editStatusSelect.value;
  p.focus = Math.max(0, Math.min(100, parseInt(editFocus.value,10)));

  save();
  render();
  closeEdit();
}

/* ---------- INIT ---------- */
updateFocus();
render();