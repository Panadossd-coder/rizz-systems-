/* =========================
   Rizz Web — Version 2
   Stable Core + Next Move
   Version 2.2.2 — Smart Notes: large generated note set + fuzzy helpers
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
   SMART NOTES (V2.2.2)
   - Generate a very large set of short-event phrases at runtime
   - Simple fuzzy matching: synonyms, modifiers, stemming, substring fallback
   - Checkbox default ON (apply) — user can uncheck
   ========================= */

/* ---------- Compact base actions (kept readable) ---------- */
/* These are the seeds. The build function expands with modifiers and synonyms. */
const SMART_BASE_ACTIONS = {
  met: 15,
  saw: 12,
  "met up": 15,
  called: 8,
  "missed call": -2,
  "voice call": 10,
  "video call": 12,
  texted: 6,
  messaged: 6,
  replied: 5,
  "replied late": -2,
  "replied quick": 4,
  "no reply": -8,
  "left on read": -10,
  ignored: -12,
  ghosted: -14,
  flirted: 10,
  teased: 6,
  sexted: 14,
  "sent nudes": 18,
  "sent money": -5,
  gifted: 12,
  "brought food": 10,
  "shared food": 8,
  hugged: 10,
  kissed: 20,
  dated: 18,
  "made plans": 12,
  "cancelled plans": -8,
  "postponed plans": -4,
  "came late": -3,
  "came early": 3,
  "met parents": 25,
  "family met": 20,
  "introduced friends": 14,
  "birthday together": 12,
  "anniversary": 14,
  apologized: 10,
  "apology accepted": 8,
  argued: -15,
  "deep talk": 14,
  "serious talk": 12,
  "future talk": 14,
  "study together": 6,
  "attended party": 6,
  "went out": 8,
  "came through": 8,
  "picked up": 6,
  "drove together": 8,
  "helped": 10,
  "supported": 10,
  "sent gift": 12,
  "sent airtime": 6,
  "sent data": 6,
  "gave advice": 8,
  "cried together": 10,
  "made up": 8,
  "got closer": 12,
  "distance": -8,
  jealous: -6,
  complimented: 6,
  "photo sent": 5,
  "selfie sent": 5,
  "voice note": 6,
  "long voice": 8,
  "short voice": 3,
  "long reply": 4,
  "short reply": -3,
  "no show": -10,
  cheated: -40,
  "broke up": -30,
  "make up": 10,
  "paid bill": 8,
  "helped family": 12,
  "introduced to family": 20,
  "travel together": 18,
  "holiday together": 18,
  "sent flowers": 12,
  "declined": -6,
  "accepted invite": 6,
  "ignored message": -10
};

/* ---------- Modifiers to create many phrase variants ---------- */
const SMART_MODIFIERS = [
  "", "today", "yesterday", "this morning", "this afternoon", "this evening", "last night",
  "tonight", "again", "briefly", "nicely", "quickly", "deeply", "heavily",
  "softly", "awkwardly", "unexpectedly", "by text", "by call", "in person",
  "at lunch", "at dinner", "after class", "before class", "on campus",
  "online", "during weekend", "this week", "last week", "this month", "last month",
  "twice", "thrice", "multiple times", "once", "2x", "3x"
];

/* ---------- Synonyms mapping for broader matching ---------- */
const SMART_SYNONYMS = {
  met: ["saw", "met up", "met today", "saw her", "saw him"],
  texted: ["msg", "messaged", "sent msg", "dm"],
  called: ["phoned"],
  "no reply": ["noreply", "no-response", "no response"],
  ignored: ["left on read", "left on seen"],
  flirted: ["playful", "teased"],
  "sent money": ["transferred money", "sent cash", "sent airtime", "sent data"],
  gifted: ["gave gift", "brought gift", "gifted her"],
  hugged: ["gave hug"],
  kissed: ["gave kiss"],
  "voice note": ["vn", "voice msg", "voice message"],
  "video call": ["vc", "videochat"],
  "long reply": ["detailed reply"],
  "short reply": ["brief reply", "one word reply"],
  "sent nudes": ["nudes sent", "sent nude"],
  cheated: ["cheating", "caught cheating"]
};

/* ---------- Generated maps (populated at runtime) ---------- */
let SMART_NOTE_KEYWORDS = {}; // phrase -> weight
let SMART_NOTE_TAGS = {};     // #tag -> weight

/* ---------- Build a huge keyword map at runtime ---------- */
function buildSmartKeywords() {
  SMART_NOTE_KEYWORDS = {};
  SMART_NOTE_TAGS = {};

  // Expand base actions with modifiers and synonyms
  Object.keys(SMART_BASE_ACTIONS).forEach(base => {
    const baseWeight = SMART_BASE_ACTIONS[base];

    // add base
    SMART_NOTE_KEYWORDS[base] = (SMART_NOTE_KEYWORDS[base] || 0) + baseWeight;

    // add synonyms
    if (SMART_SYNONYMS[base]) {
      SMART_SYNONYMS[base].forEach(syn => {
        SMART_NOTE_KEYWORDS[syn] = (SMART_NOTE_KEYWORDS[syn] || 0) + baseWeight;
      });
    }

    // generate modifier combos
    SMART_MODIFIERS.forEach(mod => {
      const modTrim = (mod || "").trim();
      if (!modTrim) return; // skip empty (base already added)
      const phrase = `${base} ${modTrim}`;
      // heuristics for modifier impact
      let factor = 1;
      if (modTrim.includes("today") || modTrim.includes("this")) factor = 1.15;
      if (modTrim.includes("yesterday") || modTrim.includes("last")) factor = 1.05;
      if (modTrim.includes("quick") || modTrim.includes("brief")) factor = 0.8;
      if (modTrim.includes("twice") || modTrim.includes("thrice") || modTrim.includes("multiple")) factor = 1.25;
      if (modTrim.includes("by call") || modTrim.includes("by phone") || modTrim.includes("voice") || modTrim.includes("vc")) factor *= 1.05;
      const weight = Math.max(1, Math.round(baseWeight * factor));
      SMART_NOTE_KEYWORDS[phrase] = (SMART_NOTE_KEYWORDS[phrase] || 0) + weight;
    });

    // tags (compact)
    const tag = "#" + base.replace(/\s+/g, "");
    SMART_NOTE_TAGS[tag] = (SMART_NOTE_TAGS[tag] || 0) + baseWeight;
  });

  // add some manual extra short phrases common in messages
  const extras = {
    "left on seen": -10,
    "late reply": -4,
    "quick reply": 3,
    "goodnight text": 4,
    "good morning": 4,
    "came by": 8,
    "stopped by": 8,
    "checked on me": 6,
    "supported me": 10,
    "helped me": 10,
    "paid for me": 12
  };
  Object.keys(extras).forEach(k => {
    SMART_NOTE_KEYWORDS[k] = (SMART_NOTE_KEYWORDS[k] || 0) + extras[k];
    SMART_NOTE_TAGS["#" + k.replace(/\s+/g, "")] = (SMART_NOTE_TAGS["#" + k.replace(/\s+/g, "")] || 0) + extras[k];
  });

  // create tag variants for phrases already present
  Object.keys(SMART_NOTE_KEYWORDS).forEach(p => {
    const t = "#" + p.replace(/\s+/g, "");
    if (!SMART_NOTE_TAGS[t]) SMART_NOTE_TAGS[t] = SMART_NOTE_KEYWORDS[p];
  });
}

/* initialize generated keyword map */
buildSmartKeywords();

/* caps & behavior */
const SMART_MAX_DELTA = 30; // clamp per save
const SMART_MIN_APPLY_THRESHOLD = 3; // require at least 3 delta to auto-apply

/* ---------- Text helpers ---------- */
function normalizeText(s) {
  return String(s || "").toLowerCase().replace(/[.,;!?\u2019]/g, " ");
}

/* simple stemmer: remove common suffixes to improve matching */
function simpleStem(word) {
  if (!word) return word;
  // remove punctuation
  let w = word.replace(/[^a-z0-9]/gi, "");
  if (w.length <= 3) return w;
  // common endings
  const endings = ["ing", "ed", "ly", "es", "s", "er"];
  for (let e of endings) {
    if (w.endsWith(e) && w.length - e.length >= 3) {
      return w.slice(0, -e.length);
    }
  }
  return w;
}

/* ---------- Matching & scoring ---------- */
function computeNoteDelta(notes, person) {
  if (!notes) return 0;
  const text = normalizeText(notes);

  let total = 0;
  // 1) exact/phrase matches with word boundaries
  Object.keys(SMART_NOTE_KEYWORDS).forEach(k => {
    // escape regex
    const safeKey = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("\\b" + safeKey.replace(/\s+/g, "\\s+") + "\\b", "gi");
    const matches = text.match(re);
    if (matches && matches.length) {
      const count = matches.length;
      const base = SMART_NOTE_KEYWORDS[k] || 0;
      const multiplier = Math.max(0.35, 1 - 0.25 * (count - 1));
      total += Math.round(base * multiplier);
    }
  });

  // 2) tag matches
  Object.keys(SMART_NOTE_TAGS).forEach(tag => {
    const re = new RegExp(tag.replace(/[#]/g, "\\$&"), "gi");
    const matches = text.match(re);
    if (matches && matches.length) {
      total += SMART_NOTE_TAGS[tag] * matches.length;
    }
  });

  // 3) token-level fuzzy matching (stem + substring fallback)
  const tokens = text.split(/\s+/).filter(Boolean);
  tokens.forEach(tok => {
    const stem = simpleStem(tok);
    // check if any SMART_NOTE_KEYWORDS key contains the stem as word or substring
    Object.keys(SMART_NOTE_KEYWORDS).some(k => {
      // fast path: exact token match within key
      const safeKey = k.toLowerCase();
      if (safeKey.split(/\s+/).includes(tok)) {
        total += Math.round(SMART_NOTE_KEYWORDS[k] * 0.6); // partial match weight
        return true;
      }
      // stem-based substring match
      if (stem && safeKey.includes(stem) && stem.length >= 3) {
        total += Math.round(SMART_NOTE_KEYWORDS[k] * 0.4);
        return true;
      }
      return false;
    });
  });

  // 4) numeric multipliers (e.g., "2x", "twice", "3 times")
  const numMatch = text.match(/(\d+)\s*x|\b(\d+)\s+times?\b|\b(twice|thrice)\b/gi);
  if (numMatch && numMatch.length) {
    total = Math.round(total * Math.min(1 + numMatch.length * 0.2, 2));
  }

  // 5) status-aware modifier to avoid runaway boosts on dating/pause
  if (person && person.status === "dating") total = Math.round(total * 0.6);
  if (person && person.status === "pause") total = Math.round(total * 0.25);

  // 6) clamp
  if (total > SMART_MAX_DELTA) total = SMART_MAX_DELTA;
  if (total < -SMART_MAX_DELTA) total = -SMART_MAX_DELTA;

  return total;
}

function formatDeltaLabel(delta) {
  if (!delta || delta === 0) return "Suggested: —";
  return delta > 0 ? `Suggested: +${delta}` : `Suggested: ${delta}`;
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

  // update suggestion if status select changes while editing notes
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