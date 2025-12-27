/* =========================
   Rizz Web — Version 2.3
   Smart Notes v3 (Event Engine)
   - Event-based understanding (not huge static lists)
   - Defaults: auto-apply ON, casual words neutral
   - Safe DOM access and guaranteed closeEdit()
   - Minimal, deterministic math: cap, dampers, diminishing returns
   ========================= */

/* ---------- Optional click sound (unchanged behavior) ---------- */
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
const focusInput = form.querySelector('[name="focus"]');

/* ---------- STATE ---------- */
let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];
let editingIndex = null;
let selectedStatus = "crush";

/* ---------- UI: status buttons & focus controls ---------- */
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
  if (focusInput) focusInput.value = focus;
}

/* =========================
   NEXT MOVE engine (unchanged)
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
function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function getNextMove(p) {
  if (!p) return "Stay steady.";
  if (p.status === "pause" || parseInt(p.focus,10) <= 20) { return pickRandom(NEXT_MOVES.pause); }
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
   Smart Notes v3 - Event Understanding
   Principles:
   - Action groups (seed verbs) with base weights
   - Modifiers (time, medium, intensity) adjust weight multiplicatively
   - Direction & polarity (she initiated / i initiated) add/sub
   - Neutral casual words (cool, okay, fine) are ignored (0)
   - Diminishing returns on repeated matches
   - Status-aware dampers: dating/pause reduce positive deltas
   - Caps applied (SMART_MAX_DELTA)
   ========================= */

/* ---------- Configuration ---------- */
const SMART_MAX_DELTA = 30;   // clamp per-save
const SMART_MIN_APPLY_THRESHOLD = 3; // require at least this absolute delta to auto-apply

/* Neutral casual words (explicitly neutral) */
const NEUTRAL_WORDS = new Set(["cool","ok","okay","fine","nice","k","thanks","thx","lol","haha"]);

/* Seed action groups (human-readable seeds) */
const ACTION_SEEDS = {
  // communication
  "call": 10,
  "audio call": 10,
  "video call": 12,
  "voice note": 6,
  "text": 6,
  "message": 6,
  "reply": 5,
  "replied": 5,
  "missed call": -2,
  // meetings
  "meet": 14,
  "met": 15,
  "saw": 12,
  "hang out": 10,
  "dinner": 8,
  "lunch": 6,
  // intimacy
  "kiss": 20,
  "kissed": 20,
  "hug": 10,
  "hugged": 10,
  "sext": 14,
  "nude": 18,
  // effort / support
  "help": 10,
  "supported": 10,
  "gift": 12,
  "sent money": -5,
  // conflict / neglect
  "ignore": -12,
  "ignored": -12,
  "no reply": -8,
  "left on read": -10,
  "argue": -15,
  "cheat": -40,
  // planning / milestones
  "made plans": 12,
  "cancelled plans": -8,
  "met parents": 25,
  "introduced": 14,
  // misc
  "apologize": 8,
  "apology": 8,
  "compliment": 6,
  "jealous": -6
};

/* Modifier tokens that multiply base weights */
const MODIFIERS = {
  intensity: {
    "long": 1.25,
    "short": 0.8,
    "deep": 1.3,
    "quick": 0.85,
    "twice": 1.25,
    "thrice": 1.35,
    "multiple": 1.4,
    "again": 1.15
  },
  time: {
    "today": 1.05,
    "yesterday": 1.03,
    "last night": 1.02,
    "this week": 1.02,
    "recently": 1.02
  },
  medium: {
    "audio": 1.05,
    "video": 1.08,
    "in person": 1.1,
    "by text": 0.98,
    "by call": 1.02
  }
};

/* Directional tokens (who initiated) */
const DIRECTION = {
  "she initiated": 8,
  "she initiated.": 8,
  "she initiated ": 8,
  "she initiated,": 8,
  "she initiated;": 8,
  "i initiated": 4,
  "i initiated.": 4,
  "i initiated,": 4,
  "we initiated": 6,
  "she initiated twice": 12
};

/* Synonyms mapping to ensure broader matching */
const SYNONYMS = {
  "dm": "text",
  "msg": "text",
  "messaged": "message",
  "phoned": "call",
  "vc": "video call",
  "videochat": "video call",
  "vn": "voice note",
  "left on seen": "left on read",
  "left on seen": "left on read"
};

/* small helper: escape regex */
function escRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }

/* normalize input text */
function normalizeText(s){
  if(!s) return "";
  return String(s).toLowerCase().replace(/[\u2019’]/g, "'").replace(/[.,;!?:()]/g," ");
}

/* simple tokenization (words and small phrases) */
function tokenize(text){
  // preserve common multiword tokens of interest
  const keepPhrases = ["she initiated","i initiated","no reply","left on read","met parents","made plans","cancelled plans","video call","audio call","voice note","sent money"];
  let t = text;
  keepPhrases.forEach(p=>{
    const marker = p.replace(/\s+/g,"__");
    t = t.replace(new RegExp(escRegex(p),"gi"), marker);
  });
  // split
  const raw = t.split(/\s+/).filter(Boolean);
  // restore phrases tokens
  return raw.map(tok => tok.replace(/__/g," "));
}

/* find base matches using seeds and synonyms */
function findBaseMatches(tokens){
  const found = {};
  const tokenStr = tokens.join(" ");
  // direct phrase and token scanning
  Object.keys(ACTION_SEEDS).forEach(key=>{
    const re = new RegExp("\\b"+escRegex(key)+"\\b","i");
    if(re.test(tokenStr)) {
      found[key] = (found[key]||0) + 1;
    }
  });
  // synonyms fallback
  Object.keys(SYNONYMS).forEach(k=>{
    const canonical = SYNONYMS[k];
    const re = new RegExp("\\b"+escRegex(k)+"\\b","i");
    if(re.test(tokenStr)){
      found[canonical] = (found[canonical]||0) + 1;
    }
  });
  // token-level stem-based partial matches (covers many word forms)
  tokens.forEach(tok=>{
    const st = simpleStem(tok);
    if(!st || st.length<3) return;
    Object.keys(ACTION_SEEDS).forEach(key=>{
      if(key.includes(st) && !found[key]){
        // small weight if partial
        found[key] = (found[key]||0) + 0.6;
      }
    });
  });

  return found; // map actionKey -> count/weightFactor
}

/* small stemmer (safe, simple) */
function simpleStem(w){
  if(!w) return w;
  let s = w.replace(/[^a-z0-9]/gi,"");
  if(s.length<=3) return s;
  const endings = ["ing","ed","ly","es","s","er"];
  for(let e of endings){
    if(s.endsWith(e) && s.length-e.length>=3) return s.slice(0,-e.length);
  }
  return s;
}

/* compute aggregated modifier multiplier from tokens */
function computeModifierMultiplier(tokens){
  let mult = 1.0;
  tokens.forEach(tok=>{
    // intensity
    Object.keys(MODIFIERS.intensity).forEach(k=>{
      if(tok.includes(k)) mult *= MODIFIERS.intensity[k];
    });
    // time
    Object.keys(MODIFIERS.time).forEach(k=>{
      if(tok.includes(k)) mult *= MODIFIERS.time[k];
    });
    // medium
    Object.keys(MODIFIERS.medium).forEach(k=>{
      if(tok.includes(k)) mult *= MODIFIERS.medium[k];
    });
  });
  return mult;
}

/* compute direction bonus */
function computeDirectionBonus(text){
  let bonus = 0;
  Object.keys(DIRECTION).forEach(k=>{
    const re = new RegExp("\\b"+escRegex(k.trim())+"\\b","i");
    if(re.test(text)) bonus += DIRECTION[k];
  });
  return bonus;
}

/* count neutral words presence */
function containsOnlyNeutralWords(tokens){
  // If tokens include only neutral and punctuation-like words, we treat as neutral
  const meaningful = tokens.filter(t => !NEUTRAL_WORDS.has(t));
  return meaningful.length === 0;
}

/* compute final delta from notes and person (status-aware damping included here) */
function computeNoteDeltaV3(notes, person){
  if(!notes) return 0;
  const text = normalizeText(notes);

  // quick ignore: if text is short neutral or exactly neutral words, return 0
  const tokens = tokenize(text);
  if(tokens.length===0) return 0;
  if(containsOnlyNeutralWords(tokens)) return 0;

  // base matches
  const baseMatches = findBaseMatches(tokens); // map
  if(Object.keys(baseMatches).length === 0) {
    // fallback: small heuristic for numbers or explicit tags like #met
    const tagMatch = (text.match(/#\w+/g) || []).length;
    if(tagMatch===0) return 0;
  }

  // modifiers multiplier
  const modMult = computeModifierMultiplier(tokens);

  // direction bonus
  const dirBonus = computeDirectionBonus(text);

  // compute raw total
  let total = 0;
  Object.keys(baseMatches).forEach(key=>{
    const seedWeight = ACTION_SEEDS[key] || 0;
    const count = baseMatches[key] || 1;
    // diminishing returns across repeats: each repeat reduces contribution by 25% (floor multiplier 0.35)
    const repMult = Math.max(0.35, 1 - 0.25 * (count - 1));
    total += Math.round(seedWeight * repMult * modMult);
  });

  // add direction as additive (not multiplicative)
  total += dirBonus;

  // numeric & repetition multiplier (e.g., "2x", "twice" increases effect)
  const numMatch = text.match(/\b(\d+)\s*(x|times?)\b/gi) || text.match(/\b(twice|thrice)\b/gi);
  if(numMatch && numMatch.length){
    total = Math.round(total * Math.min(1 + (numMatch.length * 0.2), 2.0));
  }

  // status-aware damping: dating reduces positive gains, pause reduces strongly
  if(person && person.status === "dating" && total > 0){
    total = Math.round(total * 0.6);
  }
  if(person && person.status === "pause" && total > 0){
    total = Math.round(total * 0.25);
  }

  // clamp to allowed range
  if(total > SMART_MAX_DELTA) total = SMART_MAX_DELTA;
  if(total < -SMART_MAX_DELTA) total = -SMART_MAX_DELTA;

  return total;
}

/* helper to format suggestion label */
function formatSuggestion(delta){
  if(!delta || delta === 0) return "Suggested: —";
  return delta > 0 ? `Suggested: +${delta}` : `Suggested: ${delta}`;
}

/* helper to safely get element by id (returns null if not found) */
function $id(id){ try { return document.getElementById(id); } catch(e){ return null; } }

/* =========================
   RENDER + DASHBOARD (unchanged logic, but safe)
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

function updateDashboard(){
  if(!people.length){
    if(dashFocus) dashFocus.textContent = "—";
    if(dashPause) dashPause.textContent = "—";
    if(dashAction) dashAction.textContent = "Add someone to begin.";
    return;
  }

  const paused = people.filter(p => parseInt(p.focus,10) <= 20);

  const candidates = people
    .filter(p =>
      (p.status === "dating" && p.focus >= 80) ||
      (p.status === "crush" && p.focus >= 60)
    )
    .sort((a,b)=>b.focus-a.focus)
    .slice(0,2);

  if(dashFocus) dashFocus.textContent = candidates.length ? candidates.map(p=>p.name).join(", ") : "—";
  if(dashPause) dashPause.textContent = paused.length ? paused.map(p=>p.name).join(", ") : "—";
  if(dashAction) dashAction.textContent = candidates.length ? `${candidates[0].nextMove} — ${candidates[0].name}` : "Stay steady.";
}

function render(){
  if(!list) return;
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

  people.forEach((p,i)=>{
    const card = document.createElement("div");
    card.className = `card person ${ (parseInt(p.focus,10) <= 20) ? "paused" : (glowSet.has(p.name) ? "glow" : "") }`;

    const reminderHtml = p.reminder ? `<div class="reminder">⏰ ${escapeHtml(p.reminder)}</div>` : "";

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
   ADD PERSON (unchanged)
   ========================= */
form.onsubmit = e => {
  e.preventDefault();
  const name = (form.name && form.name.value || "").trim();
  if(!name) return;

  const p = {
    name,
    status: selectedStatus,
    focus,
    notes: (form.notes && form.notes.value) ? form.notes.value.trim() : "",
    reminder: (form.reminder && form.reminder.value) ? form.reminder.value.trim() : "",
    nextMove: ""
  };
  p.nextMove = getNextMove(p);
  people.push(p);

  save();
  render();
  form.reset();
  focus = 0;
  updateFocusUI();
  // restore default status selection visually
  document.querySelectorAll(".status-buttons button").forEach(b=>b.classList.remove("active"));
  if(defaultBtn) defaultBtn.classList.add("active");
  selectedStatus = "crush";
};

/* =========================
   EDIT modal wiring and robust save (FIXES included)
   ========================= */
const editModal = $id("editModal");
const editNameInput = $id("editNameInput");
const editStatusSelect = $id("editStatusSelect");
const editFocus = $id("editFocus");
const editFocusValue = $id("editFocusValue");
const editNotesEl = $id("editNotes");
const smartSuggestionEl = $id("smartSuggestion");
const applySmartNotesEl = $id("applySmartNotes");

function openEdit(i){
  editingIndex = i;
  const p = people[i];
  if(editNameInput) editNameInput.value = p.name || "";
  if(editStatusSelect) editStatusSelect.value = p.status || "crush";
  if(editFocus) editFocus.value = p.focus || 0;
  if(editFocusValue) editFocusValue.textContent = (p.focus||0) + "%";
  if(editNotesEl) editNotesEl.value = p.notes || "";
  // default checked ON
  if(applySmartNotesEl) applySmartNotesEl.checked = true;

  const delta = computeNoteDeltaV3(p.notes || "", p);
  if(smartSuggestionEl) smartSuggestionEl.textContent = formatSuggestion(delta);

  // live updates: notes and status changes
  if(editNotesEl){
    editNotesEl.oninput = () => {
      const d = computeNoteDeltaV3(editNotesEl.value || "", { status: editStatusSelect ? editStatusSelect.value : p.status });
      if(smartSuggestionEl) smartSuggestionEl.textContent = formatSuggestion(d);
    };
  }
  if(editStatusSelect){
    editStatusSelect.onchange = () => {
      const d = computeNoteDeltaV3(editNotesEl ? editNotesEl.value : "", { status: editStatusSelect.value });
      if(smartSuggestionEl) smartSuggestionEl.textContent = formatSuggestion(d);
    };
  }

  if(editModal) { editModal.classList.remove("hidden"); editModal.setAttribute("aria-hidden","false"); }
  document.body.style.overflow = "hidden";
}

if(editFocus){
  editFocus.oninput = () => {
    if(editFocusValue) editFocusValue.textContent = editFocus.value + "%";
  };
}

/* saveEdit MUST be robust: DOM lookups must be guarded and closeEdit must always run */
function closeEdit(){
  if(editModal) { editModal.classList.add("hidden"); editModal.setAttribute("aria-hidden","true"); }
  document.body.style.overflow = "";
  editingIndex = null;
}

function saveEdit(){
  // we guarantee closeEdit() will run regardless; wrap main logic in try/catch/finally
  try {
    if(editingIndex === null) {
      return;
    }
    const p = people[editingIndex];

    // safe reads with defaults
    const newName = editNameInput ? (editNameInput.value || "").trim() : p.name;
    const newStatus = editStatusSelect ? (editStatusSelect.value || p.status) : p.status;
    const sliderVal = editFocus ? (parseInt(editFocus.value,10) || 0) : p.focus;
    const notesVal = editNotesEl ? (editNotesEl.value || "").trim() : (p.notes || "");
    const applySmart = applySmartNotesEl ? !!applySmartNotesEl.checked : true; // default true if missing

    // compute delta using event engine
    const delta = computeNoteDeltaV3(notesVal, { status: newStatus });

    // single-source finalFocus computation: base from slider then add delta if allowed
    let finalFocus = sliderVal;
    if(applySmart && Math.abs(delta) >= SMART_MIN_APPLY_THRESHOLD) {
      finalFocus = finalFocus + delta;
    }

    // clamp
    finalFocus = Math.max(0, Math.min(100, finalFocus));

    // assign values
    p.name = newName || p.name;
    p.status = newStatus;
    p.focus = finalFocus;
    p.notes = notesVal;
    p.nextMove = getNextMove(p);

    // persist & update UI
    save();
    render();

  } catch (err) {
    // ensure we don't silently swallow major issues: log for debugging
    console.error("saveEdit error:", err);
  } finally {
    // ALWAYS close modal to avoid stuck modal state
    closeEdit();
  }
}

/* =========================
   REMOVE / SAVE / INIT
   ========================= */
function removePerson(i){
  people.splice(i,1);
  save();
  render();
}
function save(){
  try {
    localStorage.setItem("rizz_people", JSON.stringify(people));
  } catch(e) {
    console.error("Failed to save localStorage", e);
  }
}

/* initialization */
updateFocusUI();
render();