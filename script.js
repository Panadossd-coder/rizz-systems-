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

/* STATUS */
document.querySelectorAll(".status-buttons button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".status-buttons button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});
document.querySelector('[data-status="crush"]').classList.add("active");

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
  focusInput.value = focus;
}

/* DASHBOARD */
function updateDashboard() {
  if (!people.length) {
    dashFocus.textContent = "—";
    dashPause.textContent = "—";
    dashAction.textContent = "Add someone to begin.";
    return;
  }
  const sorted = [...people].sort((a,b)=>b.focus-a.focus);
  dashFocus.textContent = sorted[0].name;
  dashPause.textContent = (people.find(p=>p.status==="pause")||{}).name || "—";
  dashAction.textContent = "Stay consistent.";
}

/* EDIT SYSTEM */
let editingIndex = null;

const editModal = document.getElementById("editModal");
const editNameInput = document.getElementById("editNameInput");
const editStatusSelect = document.getElementById("editStatusSelect");
const editFocus = document.getElementById("editFocus");
const editFocusValue = document.getElementById("editFocusValue");

function editPerson(i) {
  editingIndex = i;
  const p = people[i];
  editNameInput.value = p.name;
  editStatusSelect.value = p.status;
  editFocus.value = p.focus;
  editFocusValue.textContent = p.focus + "%";
  editModal.classList.remove("hidden");
}

editFocus.oninput = () => {
  editFocusValue.textContent = editFocus.value + "%";
};

function closeEdit() {
  editModal.classList.add("hidden");
  editingIndex = null;
}

function saveEdit() {
  if (editingIndex === null) return;
  const p = people[editingIndex];
  p.name = editNameInput.value.trim() || p.name;
  p.status = editStatusSelect.value;
  p.focus = parseInt(editFocus.value, 10);
  save(); render(); closeEdit();
}

/* RENDER */
function render() {
  list.innerHTML = "";
  people.forEach((p,i)=>{
    const card = document.createElement("div");
    card.className = "card person";
    card.innerHTML = `
      <strong>${p.name}</strong><br>
      <span class="sub">${p.status}</span>
      <div class="focus-bar"><div class="focus-fill" style="width:${p.focus}%"></div></div>
      <div class="sub">${p.focus}% focus</div>
      <div class="card-actions">
        <button onclick="editPerson(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });
  updateDashboard();
}

/* REMOVE */
function removePerson(i) {
  people.splice(i,1);
  save(); render();
}

/* SAVE */
function save() {
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

/* ADD */
form.onsubmit = e => {
  e.preventDefault();
  people.push({
    name: form.name.value.trim(),
    status: statusInput.value,
    focus
  });
  save(); render();
  form.reset();
  focus = 0;
  updateFocus();
};

updateFocus();
render();