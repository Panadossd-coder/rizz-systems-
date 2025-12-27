/* =========================
   Rizz Web — Version 2
   Stable Core + Next Move
   ========================= */

/* ---------- OPTIONAL CLICK SOUND ---------- */
const clickSound = document.getElementById("clickSound");
document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn || !clickSound) return;
  try {
    clickSound.currentTime = 0;
    clickSound.volume = 0.35;
    clickSound.play().catch(() => {});
  } catch (e) {}
});

/* ---------- CORE ELEMENTS ---------- */
const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.querySelector('[name="status"]');
const focusInput = form.querySelector('[name="focus"]');

/* ---------- STATE ---------- */
let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];
let editingIndex = null;

/* =========================
   STATUS BUTTONS
   ========================= */
document.querySelectorAll(".status-buttons button").forEach(btn => {
  btn.onclick = () => {
    document
      .querySelectorAll(".status-buttons button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});

const defaultBtn = document.querySelector('[data-status="crush"]');
if (defaultBtn) defaultBtn.classList.add("active");

/* =========================
   FOCUS CONTROLS
   ========================= */
document.getElementById("plus").onclick = () => {
  focus = Math.min(100, focus + 10);
  updateFocusUI();
};

document.getElementById("minus").onclick = () => {
  focus = Math.max(0, focus - 10);
  updateFocusUI();
};

function updateFocusUI() {
  focusValueEl.textContent = focus + "%";
  focusInput.value = focus;
}

/* =========================
   NEXT MOVE ENGINE
   ========================= */
const NEXT_MOVES = {
  dating: {
    high: [
      "Plan a quality date this week",
      "Deep conversation about direction",
      "Discuss future goals",
      "Create a shared routine",
      "Reinforce emotional security"
    ],
    mid: [
      "Keep consistency without pressure",
      "Check in emotionally",
      "Casual call or voice note",
      "Support her plans",
      "Let things flow naturally"
    ],
    low: [
      "Give space today",
      "Respond but don’t push",
      "Avoid heavy conversations",
      "Focus on yourself today",
      "Do nothing today"
    ]
  },
  crush: {
    high: [
      "Flirt confidently",
      "Compliment her vibe",
      "Suggest a casual meet",
      "Build playful tension",
      "Move things forward"
    ],
    mid: [
      "Light teasing",
      "Keep mystery",
      "Stay consistent",
      "Casual check-in",
      "Let her invest"
    ],
    low: [
      "Pull back slightly",
      "Observe from distance",
      "No chasing",
      "Minimal interaction",
      "Stay silent today"
    ]
  },
  pause: [
    "Do nothing today",
    "No contact",
    "Reset emotional energy",
    "Focus on yourself",
    "Wait and observe"
  ]
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getNextMove(p) {
  if (p.status === "pause" || parseInt(p.focus, 10) <= 20) {
    return pickRandom(NEXT_MOVES.pause);
  }

  if (p.status === "dating") {
    if (p.focus >= 80) return pickRandom(NEXT_MOVES.dating.high);
    if (p.focus >= 40) return pickRandom(NEXT_MOVES.dating.mid);
    return pickRandom(NEXT_MOVES.dating.low);
  }

  if (p.status === "crush") {
    if (p.focus >= 60) return pickRandom(NEXT_MOVES.crush.high);
    if (p.focus >= 30) return pickRandom(NEXT_MOVES.crush.mid);
    return pickRandom(NEXT_MOVES.crush.low);
  }

  return "Stay steady.";
}

/* =========================
   DASHBOARD (SAFE)
   ========================= */
function updateDashboard() {
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const paused = people.filter(p => parseInt(p.focus, 10) <= 20);

  const candidates = people
    .filter(p =>
      (p.status === "dating" && p.focus >= 80) ||
      (p.status === "crush" && p.focus >= 60)
    )
    .sort((a, b) => b.focus - a.focus)
    .slice(0, 2);

  dashFocus.textContent = candidates.length
    ? candidates.map(p => p.name).join(", ")
    : "—";

  dashPause.textContent = paused.length
    ? paused.map(p => p.name).join(", ")
    : "—";

  dashAction.textContent = candidates.length
    ? `${candidates[0].nextMove} — ${candidates[0].name}`
    : "Stay steady.";
}

/* =========================
   RENDER
   ========================= */
function escapeHtml(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render() {
  list.innerHTML = "";

  const glowSet = new Set(
    people
      .filter(p =>
        (p.status === "dating" && p.focus >= 80) ||
        (p.status === "crush" && p.focus >= 60)
      )
      .sort((a,b)=>b.focus-a.focus)
      .slice(0, 2)
      .map(p => p.name)
  );

  people.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = `card person ${
      (parseInt(p.focus,10) <= 20)
        ? "paused"
        : (glowSet.has(p.name) ? "glow" : "")
    }`;

    const reminderHtml = p.reminder
      ? `<div class="reminder">⏰ ${escapeHtml(p.reminder)}</div>`
      : "";

    card.innerHTML = `
      <strong>${escapeHtml(p.name)}</strong>
      <span class="sub">${escapeHtml(p.status)}</span>

      <div class="focus-bar" aria-hidden="true">
        <div class="focus-fill" style="width:${escapeHtml(p.focus)}%"></div>
      </div>
      <div class="sub">${escapeHtml(p.focus)}% focus</div>

      ${reminderHtml}

      <div class="advice"><strong>Next Move:</strong> ${escapeHtml(p.nextMove)}</div>

      <div class="card-actions">
        <button type="button" onclick="openEdit(${i})">Edit</button>
        <button type="button" onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });

  updateDashboard();
}

/* =========================
   ADD PERSON
   ========================= */
form.onsubmit = e => {
  e.preventDefault();

  const name = form.name.value.trim();
  if (!name) return;

  const p = {
    name,
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

  document
    .querySelectorAll(".status-buttons button")
    .forEach(b => b.classList.remove("active"));
  if (defaultBtn) defaultBtn.classList.add("active");
};

/* =========================
   EDIT MODAL
   ========================= */
const editModal = document.getElementById("editModal");
const editNameInput = document.getElementById("editNameInput");
const editStatusSelect = document.getElementById("editStatusSelect");
const editFocus = document.getElementById("editFocus");
const editFocusValue = document.getElementById("editFocusValue");

function openEdit(i) {
  editingIndex = i;
  const p = people[i];

  editNameInput.value = p.name || "";
  editStatusSelect.value = p.status || "crush";
  editFocus.value = p.focus || 0;
  editFocusValue.textContent = (p.focus || 0) + "%";

  editModal.classList.remove("hidden");
  editModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}

editFocus.oninput = () => {
  editFocusValue.textContent = editFocus.value + "%";
};

function closeEdit() {
  editModal.classList.add("hidden");
  editModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
  editingIndex = null;
}

function saveEdit() {
  if (editingIndex === null) return;

  const p = people[editingIndex];
  p.name = editNameInput.value.trim() || p.name;
  p.status = editStatusSelect.value;
  p.focus = Math.max(0, Math.min(100, parseInt(editFocus.value, 10) || 0));
  p.nextMove = getNextMove(p);

  save();
  render();
  closeEdit();
}

/* =========================
   REMOVE / SAVE
   ========================= */
function removePerson(i) {
  people.splice(i, 1);
  save();
  render();
}

function save() {
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

/* =========================
   INIT
   ========================= */
updateFocusUI();
render();