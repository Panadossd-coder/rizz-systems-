const STORAGE_KEY = 'rizz_v1';
const FOCUS_LIMIT = 2;
const AUTO_FOCUS = 90;

const nameInput = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const decayBtn = document.getElementById('decayBtn');
const peopleContainer = document.getElementById('peopleContainer');
const alertBox = document.getElementById('alertBox');

let state = { people: [], lastDecay: Date.now() };

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) state = JSON.parse(raw);
}

function show(msg){
  alertBox.textContent = msg;
  alertBox.classList.remove('hidden');
  setTimeout(()=>alertBox.classList.add('hidden'),1500);
}

function clamp(n){ return Math.max(0,Math.min(100,n)); }

function addPerson(name){
  if(!name) return show("Enter a name");
  let p = state.people.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!p){
    p={id:Date.now(),name,score:0,focus:false,paused:false};
    state.people.push(p);
  }
  save(); render();
}

function changeScore(id,delta){
  const p = state.people.find(x=>x.id===id);
  if(!p || p.paused) return;
  p.score = clamp(p.score+delta);
  autoFocus();
  save(); render();
}

function toggleFocus(id){
  const p = state.people.find(x=>x.id===id);
  if(!p) return;
  p.focus=!p.focus;
  enforceFocusLimit();
  save(); render();
}

function togglePause(id){
  const p = state.people.find(x=>x.id===id);
  if(!p) return;
  p.paused=!p.paused;
  if(p.paused) p.focus=false;
  save(); render();
}

function remove(id){
  state.people = state.people.filter(x=>x.id!==id);
  save(); render();
}

function autoFocus(){
  state.people
    .filter(p=>p.score>=AUTO_FOCUS && !p.paused)
    .forEach(p=>p.focus=true);
  enforceFocusLimit();
}

function enforceFocusLimit(){
  const focused = state.people.filter(p=>p.focus);
  while(focused.length>FOCUS_LIMIT){
    focused.shift().focus=false;
  }
}

function runDecay(){
  state.people.forEach(p=>{
    if(!p.focus && !p.paused) p.score=clamp(p.score-10);
  });
  save(); render(); show("Decay applied");
}

function render(){
  peopleContainer.innerHTML='';
  state.people.forEach(p=>{
    const div=document.createElement('div');
    div.className='card';
    div.innerHTML=`
      <div class="row">
        <strong>${p.name} — ${p.score}%</strong>
        ${p.focus?'<span class="badge">FOCUS</span>':''}
      </div>
      <div class="progress"><div class="bar" style="width:${p.score}%"></div></div>
      <div class="controls-row">
        <button class="action" onclick="changeScore(${p.id},-10)">-10</button>
        <button class="action" onclick="changeScore(${p.id},10)">+10</button>
        <button class="action" onclick="toggleFocus(${p.id})">${p.focus?'Unfocus':'Focus'}</button>
        <button class="action" onclick="togglePause(${p.id})">${p.paused?'Active':'Pause'}</button>
        <button class="action danger" onclick="remove(${p.id})">Delete</button>
      </div>
    `;
    peopleContainer.appendChild(div);
  });
}

addBtn.onclick=()=>{ addPerson(nameInput.value); nameInput.value=''; }
decayBtn.onclick=runDecay;

load(); render();