const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.querySelector('[name="status"]');

let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];
let editingIndex = null;

/* STATUS BUTTONS */
document.querySelectorAll(".status-buttons button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".status-buttons button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});

/* FOCUS */
document.getElementById("plus").onclick = () => {
  focus = Math.min(100, focus + 10);
  updateFocus();
};
document.getElementById("minus").onclick = () => {
  focus = Math.max(0, focus - 10);
  updateFocus();
};
function updateFocus() {
  focusValueEl.textContent = focus + "%";
}

/* DASHBOARD */
function updateDashboard() {
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }
  dashFocus.textContent = people.map(p => p.name).join(", ");
}

/* RENDER */
function render() {
  list.innerHTML = "";
  people.forEach((p,i) => {
    const div = document.createElement("div");
    div.className = "card person";
    div.innerHTML = `
      <strong>${p.name}</strong>
      <div>${p.focus}% focus</div>
      <div class="card-actions">
        <button onclick="openEdit(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(div);
  });
  updateDashboard();
}

/* ADD */
form.onsubmit = e => {
  e.preventDefault();
  people.push({ name: form.name.value, focus });
  localStorage.setItem("rizz_people", JSON.stringify(people));
  render();
  form.reset();
  focus = 0;
  updateFocus();
};

/* EDIT */
function openEdit(i) {
  editingIndex = i;
  document.getElementById("editModal").classList.remove("hidden");
}
function closeEdit() {
  document.getElementById("editModal").classList.add("hidden");
}
function saveEdit() {
  closeEdit();
}

/* REMOVE */
function removePerson(i) {
  people.splice(i,1);
  localStorage.setItem("rizz_people", JSON.stringify(people));
  render();
}

updateFocus();
render();