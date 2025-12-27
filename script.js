/* =========================
   Rizz Web — Version 2
   Stable Core + Next Move
   Version 2.2.1 — Smart Notes: checkbox default ON + generated keywords
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
let selectedStatus = "crush";

/* =========================
   STATUS BUTTONS
   ========================= */
document.querySelectorAll(".status-buttons button").forEach(btn => {
  btn.onclick = () => {
    document
      .querySelectorAll(".status-buttons button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedStatus = btn.dataset.status;
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
   DASHBOARD
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
   SMART NOTES (V2.2.1)
   - checkbox default ON (user can uncheck)
   - generated large keyword set from base verbs + modifiers
   ========================= */

/* compact base actions with base weights */
const SMART_BASE_ACTIONS = {
  met: 15,
  called: 8,
  texted: 6,
  messaged: 6,
  messaged_back: 5,
  "video-called": 10,
  vc: 10,
  hugged: 10,
  kissed: 20,
  dated: 18,
  cooked: 12,
  "sent money": -5,
  gifted: 12,
  apologized: 10,
  "deep talk": 14,
  "shared food": 8,
  laughed: 4,
  flirted: 10,
  sexted: 14,
  "sent nudes": 18,
  "gave gift": 10,
  "photo sent": 5,
  "voice note": 6,
  "long reply": 4,
  "short reply": -3,
  "no reply": -8,
  ignored: -12,
  ghosted: -14,
  argued: -15,
  "made plans": 12,
  "cancelled plans": -8,
  "she initiated": 12,
  "i initiated": 8,
  "met parents": 25,
  "family met": 20,
  "birthday": 12,
  "anniversary": 14,
  "cheated": -40,
  "apology accepted": 8,
  "helped": 10,
  "supported": 10,
  "jealous": -6,
  "complimented": 6,
  "ignored message": -10,
  "got closer": 12,
  "distance": -8
};

/* modifiers to create many phrase variants */
const SMART_MODIFIERS = [
  "", "today", "yesterday", "this morning", "last night", "tonight",
  "again", "briefly", "nicely", "quickly", "deeply", "heavily",
  "softly", "awkwardly", "unexpectedly", "by text", "by call", "in person",
  "at lunch", "at dinner", "after class", "before class", "on campus",
  "online", "during weekend", "this week", "last week", "this month", "last month",
  "twice", "thrice", "multiple times", "once"
];

/* synonyms mapping (small set for tags and alternate words) */
const SMART_SYNONYMS = {
  texted: ["msg", "messaged", "sent message"],
  called: ["phoned"],
  "no reply": ["no-response", "no response", "noreply"],
  ignored: ["ignored message", "left on read", "left on seen"],
  met: ["saw", "met up", "met today"],
  flirted: ["playful", "teased"]
};

/* the generated keyword map (phrase -> weight) */
let SMART_NOTE_KEYWORDS = {};
let SMART_NOTE_TAGS = {};

/* build many variants at runtime (keeps file compact while creating lots of entries) */
function buildSmartKeywords() {
  SMART_NOTE_KEYWORDS = {};
  SMART_NOTE_TAGS = {};

  // 1) expand base actions with modifiers
  Object.keys(SMART_BASE_ACTIONS).forEach(base => {
    const baseWeight = SMART_BASE_ACTIONS[base];

    // add base phrase
    SMART_NOTE_KEYWORDS[base] = (SMART_NOTE_KEYWORDS[base] || 0) + baseWeight;

    // add synonyms for base (if any)
    if (SMART_SYNONYMS[base]) {
      SMART_SYNONYMS[base].forEach(syn => {
        SMART_NOTE_KEYWORDS[syn] = (SMART_NOTE_KEYWORDS[syn] || 0) + baseWeight;
      });
    }

    // generate modifier combinations to multiply into many phrases
    SMART_MODIFIERS.forEach(mod => {
      if (!mod || mod === "") return; // base already added
      const phrase = `${base} ${mod}`;
      // modifier multiplier heuristics
      let factor = 1;
      if (mod.includes("today") || mod.includes("this")) factor = 1.15;
      if (mod.includes("yesterday") || mod.includes("last")) factor = 1.05;
      if (mod.includes("quick") || mod.includes("brief")) factor = 0.8;
      if (mod.includes("twice") || mod.includes("thrice") || mod.includes("multiple")) factor = 1.25;
      const weight = Math.round(baseWeight * factor);
      SMART_NOTE_KEYWORDS[phrase] = (SMART_NOTE_KEYWORDS[phrase] || 0) + weight;
    });

    // tags
    SMART_NOTE_TAGS["#" + base.replace(/\s+/g, "")] = baseWeight;
  });

  // 2) also add some constructed tag forms for common multiword phrases
  ["no reply", "left on read", "left on seen", "short reply", "long reply", "video call", "voice note", "sent money", "sent nudes"].forEach(p => {
    if (!SMART_NOTE_KEYWORDS[p]) {
      // fallback weight
      SMART_NOTE_KEYWORDS[p] = SMART_BASE_ACTIONS[p] || -6;
    }
    SMART_NOTE_TAGS["#" + p.replace(/\s+/g, "")] = SMART_NOTE_KEYWORDS[p];
  });
}

/* initialize generated keyword map */
buildSmartKeywords();

/* caps & behavior */
const SMART_MAX_DELTA = 30; // clamp per save
const SMART_MIN_APPLY_THRESHOLD = 3; // require at least 3 delta to auto-apply

/* helper: normalize text */
function normalizeText(s) {
  return String(s || "").toLowerCase().replace(/[.,;!]/g, " ");
}

/* compute matching delta from notes and person status.
   uses the generated SMART_NOTE_KEYWORDS and SMART_NOTE_TAGS maps.
*/
function computeNoteDelta(notes, person) {
  if (!notes) return 0;
  const text = normalizeText(notes);

  let total = 0;

  // 1) keyword/phrase exact matching (word boundaries)
  Object.keys(SMART_NOTE_KEYWORDS).forEach(k => {
    // escape regex special chars in key
    const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("\\b" + safeKey.replace(/\s+/g, "\\s+") + "\\b", "gi");
    const matches = text.match(re);
    if (matches && matches.length) {
      // diminishing returns for repeats
      const count = matches.length;
      const base = SMART_NOTE_KEYWORDS[k] || 0;
      const multiplier = Math.max(0.35, 1 - 0.25 * (count - 1));
      total += Math.round(base * multiplier);
    }
  });

  // 2) tag support (#tag)
  Object.keys(SMART_NOTE_TAGS).forEach(tag => {
    const re = new RegExp(tag.replace(/[#]/g, "\\$&"), "gi"); // tag is like "#met"
    const matches = text.match(re);
    if (matches && matches.length) {
      total += SMART_NOTE_TAGS[tag] * matches.length;
    }
  });

  // 3) small heuristic: if notes contain numbers like "2 days" or "3x", slightly adjust
  const numMatch = text.match(/(\d+)\s*x|\b(\d+)\s+days?\b/gi);
  if (numMatch && numMatch.length) {
    total = Math.round(total * Math.min(1 + numMatch.length * 0.15, 1.5));
  }

  // 4) status-aware modifiers (dating = dampen positive boosts; pause dampens most)
  if (person && person.status === "dating") {
    total = Math.round(total * 0.6);
  } else if (person && person.status === "pause") {
    total = Math.round(total * 0.25);
  }

  // 5) clamp
  if (total > SMART_MAX_DELTA) total = SMART_MAX_DELTA;
  if (total < -SMART_MAX_DELTA) total = -SMART_MAX_DELTA;

  return total;
}

function formatDeltaLabel(delta) {
  if (!delta || delta === 0) return "Suggested: —";
  return (delta > 0 ? "Suggested: +" + delta : "Suggested: " + delta);
}

function applyDeltaToPerson(p, delta) {
  if (!p) return;
  const newFocus = Math.max(0, Math.min(100, parseInt(p.focus, 10) + delta));
  p.focus = newFocus;
  p.nextMove = getNextMove(p);
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
      p.focus <= 20 ? "paused" : glowSet.has(p.name) ? "glow" : ""
    }`;

    card.innerHTML = `
      <strong>${escapeHtml(p.name)}</strong>
      <span class="sub">${escapeHtml(p.status)}</span>

      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>

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
    status: selectedStatus,
    focus,
    notes: "",
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
  selectedStatus = "crush";
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

  editNameInput.value = p.name;
  editStatusSelect.value = p.status;
  editFocus.value = p.focus;
  editFocusValue.textContent = p.focus + "%";

  const editNotes = document.getElementById("editNotes");
  const smartSuggestion = document.getElementById("smartSuggestion");
  const applySmartNotes = document.getElementById("applySmartNotes");

  editNotes.value = p.notes || "";

  // DEFAULT: checked (user can uncheck)
  applySmartNotes.checked = true;

  // compute and display suggestion for existing notes
  smartSuggestion.textContent = formatDeltaLabel(computeNoteDelta(editNotes.value, p));

  // live suggestion as notes change (status-aware)
  editNotes.oninput = () => {
    smartSuggestion.textContent = formatDeltaLabel(
      computeNoteDelta(editNotes.value, { status: editStatusSelect.value || p.status })
    );
  };

  // also update suggestion if status select changes while editing notes
  editStatusSelect.onchange = () => {
    smartSuggestion.textContent = formatDeltaLabel(
      computeNoteDelta(editNotes.value, { status: editStatusSelect.value })
    );
  };

  editModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

editFocus.oninput = () => {
  editFocusValue.textContent = editFocus.value + "%";
};

function closeEdit() {
  editModal.classList.add("hidden");
  document.body.style.overflow = "";
  editingIndex = null;
}

function saveEdit() {
  if (editingIndex === null) return;

  const p = people[editingIndex];
  p.name = editNameInput.value.trim();
  p.status = editStatusSelect.value;
  p.focus = parseInt(editFocus.value, 10) || 0;

  const editNotes = document.getElementById("editNotes");
  const applySmartNotes = document.getElementById("applySmartNotes");
  const notesValue = editNotes ? editNotes.value.trim() : "";
  const delta = computeNoteDelta(notesValue, p);

  p.notes = notesValue;

  if (applySmartNotes.checked && Math.abs(delta) >= SMART_MIN_APPLY_THRESHOLD) {
    applyDeltaToPerson(p, delta);
  }

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