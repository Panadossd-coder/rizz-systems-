// script.js — Rizz Web v2 core + Next Move system
'use strict';

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
   CORE APP ELEMENTS
   ========================= */
const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.querySelector('[name="status"]');
const focusInput = form.querySelector('[name="focus"]');

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

/* =========================
   NEXT MOVE — Rich Suggestion System
   (Deterministic selection from large pools)
   ========================= */

// simple deterministic hash
function _hashString(s){
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return Math.abs(h);
}

const NEXT_POOLS = {
  dating_high: [
    "Plan a spontaneous meet this week (pick a day)",
    "Call and suggest a weekend day out",
    "Surprise them with a thoughtful voice note",
    "Send a short 'thinking of you' voice message",
    "Ask about planning a special date (dinner/movie)",
    "Share a photo memory and say 'repeat?'",
    "Arrange a short in-person coffee meetup",
    "Suggest a shared activity this weekend",
    "Send a flirty GIF and follow with a plan",
    "Invite them to a small event you both like",
    "Send a heartfelt 'I miss you' with time to meet",
    "Propose a date plan and ask which day works",
    "Offer to pick them up and go for a drive",
    "Make a small concrete plan (day, time, place)",
    "Text: 'Should we lock in a date this week?'",
    "Send a quick 'You free Friday? Let's meet' text",
    "Offer tickets to something they like",
    "Ask an open question that leads to a date idea",
    "Check their schedule and propose two options",
    "Send a playful challenge to see them soon"
  ],
  dating_mid: [
    "Send a thoughtful question about their day",
    "Share a small compliment + a planned invite later",
    "Send a voice note checking in",
    "Ask about something they mentioned earlier",
    "Suggest a casual meet (coffee / short walk)",
    "Send a funny memory to spark the chat",
    "Plan a mini-date (snack + walk)",
    "Share a song they might like and ask their thoughts",
    "Message: 'How's your day? Fancy a quick call later?'",
    "Offer to help with a small errand or task",
    "Send a 'good morning' with one personal detail",
    "Ask a curious question to keep momentum"
  ],
  dating_low: [
    "Send a calm check-in: 'You okay? I'm here.'",
    "Send a small appreciative message, no pressure",
    "Share something light (meme or short clip)",
    "Send a supportive message about their day",
    "Give space: send a low-effort message tomorrow",
    "Compliment something specific softly",
    "Offer help if they seem busy/stressed",
    "Send a friendly 'thinking of you' note"
  ],
  crush_high: [
    "Send a playful tease + suggest meeting",
    "Send a flirty photo (subtle) and a coffee invite",
    "Ask them out for a casual outing",
    "Send a bold 'Want to hang out this weekend?'",
    "Playfully challenge them to pick a plan",
    "Share a 'this reminded me of you' message",
    "Invite them to try a new place together",
    "Send an upbeat 'We should do something fun' text",
    "Drop a compliment and ask them out",
    "Send a short voice note with a plan idea",
    "Offer tickets to a local event as a plan",
    "Propose a small, confident meet-up"
  ],
  crush_mid: [
    "Send a light, flirty text to test interest",
    "Ask a simple question about plans tonight",
    "Share something funny to re-open chat",
    "React to their story and add a follow-up",
    "Give a compliment and ask a simple question",
    "Send a low-pressure invite (tea/coffee)",
    "Drop a 'missed your reply' playful nudge",
    "Share a fun suggestion for when they’re free"
  ],
  crush_low: [
    "Pause & observe — send nothing for now",
    "Send a gentle check-in after a few days",
    "Post something interesting on your story (soft re-open)",
    "Send a neutral message: 'Hope you're good' once",
    "Shift focus — no persistent messaging"
  ],
  paused: [
    "No action — maintain the pause",
    "Send an occasional neutral 'hope you're well' (rare)",
    "Keep record and avoid texting unless necessary"
  ],
  generic: [
    "Send a friendly check-in",
    "Share a short memory or photo",
    "Send a one-line compliment",
    "Ask an open-ended question",
    "Offer a quick voice message",
    "Send a small planning text ('free this week?')"
  ]
};

function pickSuggestion(pool, name, focus){
  if(!pool || !pool.length) return "";
  const key = (name || "") + "|" + (String(focus) || "");
  const idx = _hashString(key) % pool.length;
  return pool[idx];
}

function nextMoveFor(person){
  if(!person) return "";

  // reminder override
  if(person.reminder && String(person.reminder).trim()){
    return `Do reminder: ${person.reminder}`;
  }

  const status = String(person.status || "").toLowerCase();
  const focusVal = Number(person.focus || 0);

  if(status === "pause"){
    return pickSuggestion(NEXT_POOLS.paused, person.name, focusVal);
  }

  if(status === "dating"){
    if(focusVal >= 80) return pickSuggestion(NEXT_POOLS.dating_high, person.name, focusVal);
    if(focusVal >= 50) return pickSuggestion(NEXT_POOLS.dating_mid, person.name, focusVal);
    return pickSuggestion(NEXT_POOLS.dating_low, person.name, focusVal);
  }

  if(status === "crush"){
    if(focusVal >= 60) return pickSuggestion(NEXT_POOLS.crush_high, person.name, focusVal);
    if(focusVal >= 30) return pickSuggestion(NEXT_POOLS.crush_mid, person.name, focusVal);
    return pickSuggestion(NEXT_POOLS.crush_low, person.name, focusVal);
  }

  return pickSuggestion(NEXT_POOLS.generic, person.name, focusVal);
}

function todayPriority(peopleList){
  if(!Array.isArray(peopleList) || !peopleList.length) return "No urgent action today";

  // reminder first
  const withReminder = peopleList.find(p => p.reminder && String(p.reminder).trim());
  if(withReminder) return `Do reminder for ${withReminder.name}: ${withReminder.reminder}`;

  // find actionable next move
  const actionable = peopleList.find(p => {
    const move = nextMoveFor(p) || "";
    const lower = move.toLowerCase();
    // treat pause or generic "no action" style as non-actionable
    if(!move) return false;
    if(lower.includes("no action") || lower.includes("maintain the pause") || lower.includes("pause & observe")) return false;
    return true;
  });
  if(actionable) return `${nextMoveFor(actionable)} — ${actionable.name}`;

  // fallback to highest focus
  const highest = [...peopleList].sort((a,b)=> (b.focus||0) - (a.focus||0))[0];
  if(highest) return `${nextMoveFor(highest)} — ${highest.name}`;

  return "No urgent action today";
}

/* ---------------- RENDER ---------------- */
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function render(){
  list.innerHTML = "";

  // determine candidate names for glow (same logic used by dashboard)
  const candidateNames = new Set(
    people
      .filter(p => (p.status === "dating" && p.focus > 80) || (p.status === "crush" && p.focus > 60))
      .sort((a,b)=> b.focus - a.focus)
      .slice(0,2)
      .map(p=>p.name)
  );

  people.forEach((p,i)=>{
    const card = document.createElement("div");

    // classes: paused, glow, or default
    let classes = "card person";
    const isPaused = parseInt(p.focus,10) <= 20;
    if (isPaused) classes += " paused";
    else if (candidateNames.has(p.name)) classes += " glow";

    card.className = classes;

    // build inner html with Next Move inserted
    const nextMove = escapeHtml(nextMoveFor(p));
    card.innerHTML = `
      <strong>${escapeHtml(p.name)}</strong>
      <span class="sub">${escapeHtml(p.status)}</span>

      <div class="focus-bar" aria-hidden="true">
        <div class="focus-fill" style="width:${Number(p.focus||0)}%"></div>
      </div>
      <div class="sub">${Number(p.focus||0)}% focus</div>

      ${p.reminder ? `<div class="reminder">⏰ ${escapeHtml(p.reminder)}</div>` : ""}
      <div class="advice">${escapeHtml(adviceFor(p.focus))}</div>

      <div class="next-move">🧭 Next Move: ${nextMove}</div>

      <p>${escapeHtml(p.notes || "")}</p>

      <div class="card-actions">
        <button type="button" onclick="openEditModal(${i})">Edit</button>
        <button type="button" onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });

  updateDashboard();
}

/* ---------------- REMOVE ---------------- */
function removePerson(i){
  if (typeof i !== "number" || i < 0 || i >= people.length) return;
  people.splice(i,1);
  save();
  render();
}
// expose for inline handlers
window.removePerson = removePerson;

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

  // NEW: use todayPriority for the dash action (non-destructive)
  dashAction.textContent = todayPriority(people);
}

/* ---------------- EDIT MODAL ---------------- */
let editingIndex = null;
const editModal = document.getElementById("editModal");
const editNameInput = document.getElementById("editNameInput");
const editStatusSelect = document.getElementById("editStatusSelect");
const editFocus = document.getElementById("editFocus");
const editFocusValue = document.getElementById("editFocusValue");

function openEditModal(i){
  editingIndex = i;
  const p = people[i] || {};
  editNameInput.value = p.name || "";
  editStatusSelect.value = p.status || "crush";
  editFocus.value = p.focus || 0;
  editFocusValue.textContent = (p.focus || 0) + "%";
  editModal.classList.remove("hidden");
  editModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  setTimeout(()=> editNameInput.focus(), 120);
}
// expose for inline onclick
window.openEditModal = openEditModal;

function closeEdit(){
  editModal.classList.add("hidden");
  editModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
  editingIndex = null;
}

if (editFocus) editFocus.oninput = ()=> editFocusValue.textContent = editFocus.value + "%";

function saveEdit(){
  if (editingIndex === null) return;
  const p = people[editingIndex];
  if (!p) return;
  const newName = editNameInput.value.trim();
  const newStatus = editStatusSelect.value;
  const newFocus = Math.max(0, Math.min(100, parseInt(editFocus.value,10) || 0));

  p.name = newName || p.name;
  if (["crush","dating","pause"].includes(newStatus)) p.status = newStatus;
  p.focus = newFocus;

  save();
  render();
  closeEdit();
}

/* ---------------- INIT ---------------- */
updateFocus();
render();

// expose some utilities for dev (safe)
window.__rizz_utils = {
  readPeople: ()=> JSON.parse(localStorage.getItem("rizz_people")||"[]"),
  writePeople: (arr)=> { localStorage.setItem("rizz_people", JSON.stringify(arr||[])); if(typeof window.render === "function") window.render(); }
};