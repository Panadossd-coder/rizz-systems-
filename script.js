const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");

const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

const focusValueEl = document.getElementById("focusValue");
const statusInput = form.status;

let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];
let editIndex = null;

/* STATUS */
document.querySelectorAll(".status-buttons button").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".status-buttons button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    statusInput.value = btn.dataset.status;
  };
});
document.querySelector('[data-status="crush"]').classList.add("active");

/* FOCUS */
plus.onclick = ()=>{ focus=Math.min(100,focus+10); updateFocus(); };
minus.onclick = ()=>{ focus=Math.max(0,focus-10); updateFocus(); };

function updateFocus(){
  focusValueEl.textContent = focus+"%";
  form.focus.value = focus;
}

/* NEXT MOVE */
function nextMove(p){
  if(p.focus<=20) return "Do not over-invest";
  if(p.focus>=80) return "Compliment her vibe";
  return "Stay steady";
}

/* DASH */
function updateDashboard(){
  if(!people.length){
    dashFocus.textContent="—";
    dashPause.textContent="—";
    dashAction.textContent="Add someone to begin.";
    return;
  }
  const top = [...people].sort((a,b)=>b.focus-a.focus)[0];
  dashFocus.textContent = top.name;
  dashAction.textContent = nextMove(top);
}

/* RENDER */
function render(){
  list.innerHTML="";
  people.forEach((p,i)=>{
    const card=document.createElement("div");
    card.className="card person"+(p.focus<=20?" paused":"");
    card.innerHTML=`
      <strong>${p.name}</strong><br>
      ${p.focus}% focus<br>
      <em>Next Move: ${nextMove(p)}</em>
      <div class="card-actions">
        <button onclick="openEdit(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>`;
    list.appendChild(card);
  });
  updateDashboard();
}

/* ADD */
form.onsubmit=e=>{
  e.preventDefault();
  people.push({name:form.name.value,focus,status:statusInput.value});
  localStorage.setItem("rizz_people",JSON.stringify(people));
  form.reset(); focus=0; updateFocus(); render();
};

function removePerson(i){
  people.splice(i,1);
  localStorage.setItem("rizz_people",JSON.stringify(people));
  render();
}

/* EDIT */
function openEdit(i){
  editIndex=i;
  editModal.classList.remove("hidden");
  editNameInput.value=people[i].name;
  editFocus.value=people[i].focus;
  editFocusValue.textContent=people[i].focus+"%";
}
function closeEdit(){ editModal.classList.add("hidden"); }
editFocus.oninput=()=>editFocusValue.textContent=editFocus.value+"%";
function saveEdit(){
  people[editIndex].name=editNameInput.value;
  people[editIndex].focus=parseInt(editFocus.value);
  localStorage.setItem("rizz_people",JSON.stringify(people));
  closeEdit(); render();
}

updateFocus(); render();