const FOCUS_LIMIT = 2;
const STORAGE_KEY = "rizz_v1";

let people = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

function render() {
  const list = $("list");
  list.innerHTML = "";

  let total = 0;
  people.forEach(p => total += p.score);
  const avg = people.length ? Math.round(total / people.length) : 0;

  $("overallPct").textContent = avg + "%";
  $("overallBar").style.width = avg + "%";

  people.forEach(p => {
    const row = document.createElement("div");
    row.className = "person" + (p.active ? "" : " paused");

    row.innerHTML = `
      <strong>${p.name}</strong>
      <span>${p.score}%</span>
      <button onclick="adjust('${p.id}',10)">+10</button>
      <button onclick="adjust('${p.id}',-10)">-10</button>
      <button onclick="toggleFocus('${p.id}')">Focus</button>
      <button onclick="toggleActive('${p.id}')">
        ${p.active ? "Pause" : "Activate"}
      </button>
    `;
    list.appendChild(row);
  });

  save();
}

function addOrUpdate() {
  const name = $("nameInput").value.trim();
  if (!name) return;

  let p = people.find(x => x.name.toLowerCase() === name.toLowerCase());
  if (!p) {
    people.push({
      id: crypto.randomUUID(),
      name,
      score: 30,
      active: true,
      focused: false
    });
  } else {
    p.score = Math.min(100, p.score + 10);
  }
  $("nameInput").value = "";
  render();
}

function adjust(id, val) {
  const p = people.find(x => x.id === id);
  if (!p || !p.active) return;
  p.score = Math.max(0, Math.min(100, p.score + val));
  render();
}

function toggleActive(id) {
  const p = people.find(x => x.id === id);
  p.active = !p.active;
  p.focused = false;
  render();
}

function toggleFocus(id) {
  const focused = people.filter(p => p.focused);
  if (focused.length >= FOCUS_LIMIT) focused[0].focused = false;
  const p = people.find(x => x.id === id);
  p.focused = !p.focused;
  render();
}

function pauseAll() {
  people.forEach(p => { p.active = false; p.focused = false; });
  $("pauseAll").classList.add("hidden");
  $("resumeAll").classList.remove("hidden");
  render();
}

function resumeAll() {
  people.forEach(p => p.active = true);
  $("resumeAll").classList.add("hidden");
  $("pauseAll").classList.remove("hidden");
  render();
}

$("addBtn").onclick = addOrUpdate;
$("pauseAll").onclick = pauseAll;
$("resumeAll").onclick = resumeAll;

render();