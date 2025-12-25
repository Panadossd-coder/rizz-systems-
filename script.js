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
document.querySelectorAll(".status-buttons button").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".status-buttons button")
      .forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});
document.querySelector('[data-status="crush"]').classList.add("active");

/* FOCUS */
document.getElementById("plus").onclick = ()=>{
  focus = Math.min(100, focus + 10); updateFocus();
};
document.getElementById("minus").onclick = ()=>{
  focus = Math.max(0, focus - 10); updateFocus();
};
function updateFocus(){
  focusValueEl.textContent = focus + "%";
  focusInput.value = focus;
}

/* ADVICE */
function adviceFor(f){
  if(f >= 80) return "High priority. Reach out or plan a meet.";
  if(f >= 60) return "Good momentum. Stay consistent.";
  if(f >= 30) return "Keep it steady. No pressure.";
  return "Low priority. Do not over-invest.";
}

/* DASHBOARD */
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

  dashFocus.textContent = focusP.name;
  dashPause.textContent = pauseP ? pauseP.name : "—";
  dashAction.textContent = adviceFor(focusP.focus);
}

/* RENDER */
function render(){
  list.innerHTML = "";
  people.forEach((p,i)=>{
    const card = document.createElement("div");
    card.className = `card person ${p.focus>=70?"high":"low"}`;

    card.innerHTML = `
      <strong>${p.name}</strong><br>
      <span class="sub">${p.status}</span>

      <div class="focus-bar">
        <div class="focus-fill" style="width:${p.focus}%"></div>
      </div>
      <div class="sub">${p.focus}% focus</div>

      ${p.reminder?`<div class="reminder">⏰ ${p.reminder}</div>`:""}
      <div class="advice">${adviceFor(p.focus)}</div>

      <button onclick="removePerson(${i})">Remove</button>
    `;
    list.appendChild(card);
  });
  updateDashboard();
}

function removePerson(i){
  people.splice(i,1);
  save(); render();
}

function save(){
  localStorage.setItem("rizz_people", JSON.stringify(people));
}

/* ADD */
form.onsubmit = e=>{
  e.preventDefault();
  if(!form.name.value.trim()) return;

  people.push({
    name: form.name.value.trim(),
    status: statusInput.value,
    focus,
    notes: form.notes.value.trim(),
    reminder: form.reminder.value.trim()
  });

  save(); render();

  form.reset();
  focus = 0; updateFocus();
  statusInput.value = "crush";
  document.querySelectorAll(".status-buttons button")
    .forEach(b=>b.classList.remove("active"));
  document.querySelector('[data-status="crush"]').classList.add("active");
};

render();