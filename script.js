const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.querySelector('input[name="status"]');
const focusInput = form.querySelector('input[name="focus"]');

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

// default active
document.querySelector('.status-buttons button[data-status="crush"]').classList.add("active");

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

/* ---------------- SAVE ---------------- */
function save() {
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

/* ---------------- DASHBOARD ---------------- */
function updateDashboard() {
  if (people.length === 0) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const sorted = [...people].sort((a,b)=>b.focus-a.focus);
  const focusP = sorted.find(p=>p.focus>=70);
  const pauseP = sorted.find(p=>p.status==="pause");

  dashFocus.textContent = focusP ? focusP.name : "No high focus";
  dashPause.textContent = pauseP ? pauseP.name : "—";
  dashAction.textContent = focusP ? "Reach out or plan a meet." : "Maintain balance.";
}

/* ---------------- RENDER ---------------- */
function render() {
  list.innerHTML = "";

  people.forEach((p,i)=>{
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <strong>${p.name}</strong><br>
      <span class="sub">${p.status}</span>

      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>

      ${p.reminder ? `<div class="reminder">⏰ ${p.reminder}</div>` : ""}
      <div class="advice">Keep it steady. No pressure.</div>

      <p>${p.notes || ""}</p>
      <button onclick="removePerson(${i})">Remove</button>
    `;

    list.appendChild(card);
  });

  updateDashboard();
}

/* ---------------- REMOVE ---------------- */
function removePerson(i) {
  people.splice(i,1);
  save();
  render();
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

  // RESET (THIS IS THE EXACT PLACE)
  form.reset();
  focus = 0;
  updateFocus();
  statusInput.value = "crush";
  document.querySelectorAll(".status-buttons button")
    .forEach(b=>b.classList.remove("active"));
  document.querySelector('.status-buttons button[data-status="crush"]').classList.add("active");
});

/* INIT */
render();