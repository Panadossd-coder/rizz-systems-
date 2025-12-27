const form = document.getElementById("addForm");
const list = document.getElementById("peopleList");
const dashFocus = document.getElementById("dashFocus");
const dashPause = document.getElementById("dashPause");
const dashAction = document.getElementById("dashAction");

let focus = 0;
let people = JSON.parse(localStorage.getItem("rizz_people")) || [];
let editingIndex = null;

/* STATUS BUTTONS */
document.querySelectorAll(".status-buttons button").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".status-buttons button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    form.status.value = btn.dataset.status;
  };
});
document.querySelector('[data-status="crush"]').classList.add("active");

/* FOCUS */
plus.onclick=()=>{focus=Math.min(100,focus+10);updateFocus();}
minus.onclick=()=>{focus=Math.max(0,focus-10);updateFocus();}
function updateFocus(){ focusValue.textContent=focus+"%"; form.focus.value=focus; }

/* NEXT MOVE */
function nextMove(p){
  if(p.focus>=80) return "Compliment her vibe";
  if(p.focus>=40) return "Keep steady";
  return "Do not over-invest";
}

/* RENDER */
function render(){
  list.innerHTML="";
  people.forEach((p,i)=>{
    const div=document.createElement("div");
    div.className="card person "+(p.focus>=80?"glow":"");
    div.innerHTML=`
      <strong>${p.name}</strong>
      <div>${p.focus}% focus</div>
      <div class="advice">Next Move: ${p.nextMove}</div>
      <div class="card-actions">
        <button onclick="openEdit(${i})">Edit</button>
        <button onclick="removePerson(${i})">Remove</button>
      </div>`;
    list.appendChild(div);
  });
  updateDashboard();
}

function updateDashboard(){
  if(!people.length){
    dashFocus.textContent="—";
    dashPause.textContent="—";
    dashAction.textContent="Add someone to begin.";
    return;
  }
  const top=people.sort((a,b)=>b.focus-a.focus)[0];
  dashFocus.textContent=top.name;
  dashAction.textContent=top.nextMove;
}

form.onsubmit=e=>{
  e.preventDefault();
  const p={name:form.name.value,status:form.status.value,focus,nextMove:""};
  p.nextMove=nextMove(p);
  people.push(p);
  save(); render();
  form.reset(); focus=0; updateFocus();
};

function removePerson(i){ people.splice(i,1); save(); render(); }
function save(){ localStorage.setItem("rizz_people",JSON.stringify(people)); }

/* EDIT */
function openEdit(i){
  editingIndex=i;
  editModal.classList.remove("hidden");
  editNameInput.value=people[i].name;
  editFocus.value=people[i].focus;
  editFocusValue.textContent=people[i].focus+"%";
}
editFocus.oninput=()=>editFocusValue.textContent=editFocus.value+"%";
function closeEdit(){ editModal.classList.add("hidden"); }
function saveEdit(){
  const p=people[editingIndex];
  p.name=editNameInput.value;
  p.focus=parseInt(editFocus.value);
  p.nextMove=nextMove(p);
  save(); render(); closeEdit();
}

render();