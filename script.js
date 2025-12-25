// Version 2.1 — Script
const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");
const focusDisplay = document.getElementById("focusDisplay");
const focusPlus = document.getElementById("focusPlus");
const focusMinus = document.getElementById("focusMinus");
const statusBtns = document.querySelectorAll(".status-btn");

let people = JSON.parse(localStorage.getItem("rizz_people")) || [];

// UI state
let currentFocus = 0;
let currentStatus = ""; // "crush" | "dating" | "pause"

// helpers
function save() {
  localStorage.setItem("rizz_people", JSON.stringify(people));
}
function personKey(p) {
  return `${p.name.toLowerCase()}|${p.status}`;
}
function isUrgent(rem) {
  if (!rem) return false;
  const t = rem.toLowerCase();
  return t.includes("today") || t.includes("tonight") || t.includes("now");
}

function getAdvice(p) {
  if (p.reminder) return "You have something scheduled — handle this first.";
  if (p.focus >= 70 && p.status === "dating") return "High priority. Call or see them soon.";
  if (p.focus >= 70 && p.status === "crush") return "Build momentum. Light flirting or check-in works.";
  if (p.focus < 40) return "Low priority. Do not over-invest.";
  if (p.status === "pause") return "Give space. Let them come to you.";
  return "Keep it steady. No pressure.";
}

function updateDashboard() {
  if (!people.length) {
    document.getElementById("dashFocus").textContent = "—";
    document.getElementById("dashPause").textContent = "—";
    document.getElementById("dashAction").textContent = "Add someone to begin.";
    return;
  }

  const sorted = [...people].sort((a, b) => b.focus - a.focus);

  const focusPerson = sorted.find(p => p.focus >= 70) || null;
  const pausePerson = sorted.find(p => p.focus < 40) || null;

  document.getElementById("dashFocus").textContent = focusPerson ? focusPerson.name : "No high focus";
  document.getElementById("dashPause").textContent = pausePerson ? pausePerson.name : "No one to pause";

  if (focusPerson) {
    // prefer urgent reminder text
    if (isUrgent(focusPerson.reminder)) {
      document.getElementById("dashAction").textContent = `Reminder (urgent): ${focusPerson.reminder}`;
    } else if (focusPerson.reminder) {
      document.getElementById("dashAction").textContent = `Reminder: ${focusPerson.reminder}`;
    } else {
      document.getElementById("dashAction").textContent = getAdvice(focusPerson);
    }
  } else {
    document.getElementById("dashAction").textContent = "Maintain balance. Don’t force anything.";
  }
}

function render() {
  list.innerHTML = "";
  if (!people.length) {
    list.innerHTML = `<div class="card sub">No entries yet</div>`;
    updateDashboard();
    return;
  }

  people.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";
    if (p.focus < 40) card.classList.add("low-focus");
    if (p.focus >= 70) card.classList.add("high-focus");
    if (p.reminder) card.classList.add("has-reminder");
    if (isUrgent(p.reminder)) card.classList.add("urgent");

    card.innerHTML = `
      <strong>${p.name}</strong><br>
      <span class="sub">${p.status}</span>

      <div class="focus-wrap">
        <div class="focus-bar">
          <div class="focus-fill" style="width:${p.focus}%"></div>
        </div>
        <div class="sub">${p.focus}% focus</div>
      </div>

      ${p.reminder ? `<div class="reminder">⏰ ${p.reminder}</div>` : ""}
      <div class="advice">${getAdvice(p)}</div>

      <p>${p.notes || ""}</p>
      <button class="remove" onclick="removePerson(${i})">Remove</button>
    `;
    list.appendChild(card);
  });

  updateDashboard();
}

function removePerson(index) {
  people.splice(index, 1);
  save();
  render();
}

// status button behavior
statusBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    statusBtns.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    currentStatus = btn.dataset.value;
  });
});

// focus buttons
function setFocus(v) {
  currentFocus = Math.max(0, Math.min(100, v));
  focusDisplay.textContent = `${currentFocus}%`;
}
focusPlus.addEventListener("click", () => setFocus(currentFocus + 10));
focusMinus.addEventListener("click", () => setFocus(currentFocus - 10));

// initial UI reset
setFocus(0);

// Add person
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = form.name.value.trim();
  const notes = form.notes.value.trim();
  const reminder = form.reminder.value.trim();

  const status = currentStatus || form.status?.value || ""; // if fallback needed

  if (!name) {
    alert("Please enter a name.");
    return;
  }
  if (!status) {
    alert("Please select a status (Crush, Dating, Pause).");
    return;
  }

  const focus = Math.max(0, Math.min(100, Number(currentFocus) || 0));

  // duplicate protection
  const newKey = `${name.toLowerCase()}|${status}`;
  if (people.some(p => `${p.name.toLowerCase()}|${p.status}` === newKey)) {
    alert("This person with same status already exists.");
    return;
  }

  people.push({ name, status, notes, focus, reminder });
  save();
  render();

  // reset UI & form
  form.reset();
  currentStatus = "";
  statusBtns.forEach(b => b.classList.remove("selected"));
  setFocus(0);
});

// initial render
render();

// expose removePerson for inline onclick
window.removePerson = removePerson;
