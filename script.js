// Rizz Web — Version 2.1 Core

const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const focusDisplay = document.getElementById("focusDisplay");
const focusPlus = document.getElementById("focusPlus");
const focusMinus = document.getElementById("focusMinus");
const statusBtns = document.querySelectorAll(".status-btn");

let focusValue = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];

// ---------- UI CONTROLS ----------

// Focus buttons
function updateFocus() {
  focusDisplay.textContent = focusValue + "%";
  form.focus.value = focusValue;
}

focusPlus.onclick = () => {
  focusValue = Math.min(100, focusValue + 10);
  updateFocus();
};

focusMinus.onclick = () => {
  focusValue = Math.max(0, focusValue - 10);
  updateFocus();
};

// Status buttons
statusBtns.forEach(btn => {
  btn.onclick = () => {
    statusBtns.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    form.status.value = btn.dataset.status;
  };
});

// ---------- LOGIC ----------

function save() {
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

function updateDashboard() {
  if (people.length === 0) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "—";
    return;
  }

  const sorted = [...people].sort((a, b) => b.focus - a.focus);
  const focusPerson = sorted.find(p => p.focus >= 70);
  const pausePerson = sorted.find(p => p.status === "pause");

  dashFocus.textContent = focusPerson ? focusPerson.name : "No high focus";
  dashPause.textContent = pausePerson ? pausePerson.name : "—";
  dashAction.textContent = focusPerson
    ? "Reach out or plan a meet."
    : "Maintain balance.";
}

function render() {
  list.innerHTML = "";

  people.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "card person";

    div.innerHTML = `
      <strong>${p.name}</strong><br>
      <span class="sub">${p.status}</span>

      <div class="progress">
        <div class="progress-fill" style="width:${p.focus}%"></div>
      </div>

      <div class="sub">${p.focus}% focus</div>
      ${p.notes ? `<p>${p.notes}</p>` : ""}

      <button class="remove" onclick="removePerson(${i})">Remove</button>
    `;

    list.appendChild(div);
  });

  updateDashboard();
}

function removePerson(i) {
  people.splice(i, 1);
  save();
  render();
}

// ---------- ADD ----------
form.onsubmit = e => {
  e.preventDefault();

  if (!form.name.value || !form.status.value) {
    alert("Name and status required");
    return;
  }

  people.push({
    name: form.name.value.trim(),
    status: form.status.value,
    focus: focusValue,
    notes: form.notes.value.trim(),
    reminder: form.reminder.value.trim()
  });

  save();
  render();

  // reset
  form.reset();
  focusValue = 0;
  updateFocus();
  statusBtns.forEach(b => b.classList.remove("selected"));
};

// initial
updateFocus();
render();
