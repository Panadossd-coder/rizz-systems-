const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const statusBtns = document.querySelectorAll(".status-btn");
const statusInput = form.status;

const focusValue = document.getElementById("focusValue");
const focusInput = form.focus;

let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_v11")) || [];

/* STATUS BUTTONS */
statusBtns.forEach(btn => {
  btn.onclick = () => {
    statusBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});

/* FOCUS BUTTONS */
document.getElementById("plus").onclick = () => {
  focus = Math.min(100, focus + 10);
  focusValue.textContent = focus + "%";
  focusInput.value = focus;
};

document.getElementById("minus").onclick = () => {
  focus = Math.max(0, focus - 10);
  focusValue.textContent = focus + "%";
  focusInput.value = focus;
};

/* SAVE */
function save() {
  localStorage.setItem("rizz_v11", JSON.stringify(people));
}

/* DASHBOARD */
function updateDashboard() {
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }

  const sorted = [...people].sort((a,b) => b.focus - a.focus);
  dashFocus.textContent = sorted[0].name;

  const paused = people.find(p => p.status === "pause");
  dashPause.textContent = paused ? paused.name : "—";

  dashAction.textContent =
    sorted[0].focus >= 70
      ? "High priority. Reach out."
      : "Maintain balance.";
}

/* RENDER */
function render() {
  list.innerHTML = "";

  people.forEach((p,i) => {
    const div = document.createElement("div");
    div.className = "person" + (p.focus < 40 ? " low" : "");
    div.innerHTML = `
      <strong>${p.name}</strong><br>
      ${p.status} — ${p.focus}%<br>
      ${p.reminder ? "⏰ " + p.reminder + "<br>" : ""}
      <button>Remove</button>
    `;
    div.querySelector("button").onclick = () => {
      people.splice(i,1);
      save();
      render();
    };
    list.appendChild(div);
  });

  updateDashboard();
}

/* ADD */
form.onsubmit = e => {
  e.preventDefault();

  people.push({
    name: form.name.value,
    status: form.status.value,
    focus: Number(form.focus.value),
    notes: form.notes.value,
    reminder: form.reminder.value
  });

  save();
  render();

  form.reset();
  focus = 0;
  focusValue.textContent = "0%";
  focusInput.value = 0;
  statusBtns.forEach(b => b.classList.remove("active"));
};

render();
