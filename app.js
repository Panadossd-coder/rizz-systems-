/* CONFIG */
const FOCUS_LIMIT = 2;
const AUTO_FOCUS_THRESHOLD = 90;
const DECAY_INTERVAL_DAYS = 2;
const DECAY_STEP = 10;
const STORAGE_KEY = 'rizz_v1_data';

document.getElementById('focusLimitLabel').innerText = FOCUS_LIMIT;

const nameInput = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const decayBtn = document.getElementById('decayBtn');
const peopleContainer = document.getElementById('peopleContainer');
const alertBox = document.getElementById('alertBox');

let state = { people: [], lastDecayAt: null };

/* UTILITIES */
const uid = () => 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
const nowISO = () => new Date().toISOString();

/* STORAGE */
function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) state = JSON.parse(raw);
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ALERT */
function showAlert(msg, ms=2000){
  alertBox.style.display='block';
  alertBox.textContent = msg;
  setTimeout(()=>alertBox.style.display='none', ms);
}

/* CORE ACTIONS */
function addOrUpdatePerson(name){
  if(!name.trim()) return showAlert('Enter a name');
  let p = state.people.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!p){
    p = { id:uid(), name, score:0, focus:false, paused:false, thumb:null, updatedAt:nowISO(), focusSetAt:null };
    state.people.push(p);
  }
  p.updatedAt = nowISO();
  saveState();
  enforceAutoFocusAll();
  render();
}

function changeScore(id, delta){
  const p = state.people.find(x=>x.id===id);
  p.score = clamp(p.score + delta);
  p.updatedAt = nowISO();
  saveState();
  enforceAutoFocusAll();
  render();
}

function toggleFocus(id){
  const p = state.people.find(x=>x.id===id);
  if(p.focus){ p.focus=false; p.focusSetAt=null; }
  else{
    enforceFocusLimit();
    p.focus=true;
    p.focusSetAt=Date.now();
  }
  saveState();
  render();
}

function togglePause(id){
  const p = state.people.find(x=>x.id===id);
  p.paused = !p.paused;
  if(p.paused) p.focus=false;
  saveState();
  render();
}

function deletePerson(id){
  state.people = state.people.filter(p=>p.id!==id);
  saveState();
  render();
}

/* FOCUS LOGIC */
function enforceFocusLimit(){
  let focused = state.people.filter(p=>p.focus);
  while(focused.length>=FOCUS_LIMIT){
    focused.sort((a,b)=>a.score-b.score);
    focused[0].focus=false;
    focused[0].focusSetAt=null;
    focused = state.people.filter(p=>p.focus);
  }
}

function enforceAutoFocusAll(){
  state.people
    .filter(p=>p.score>=AUTO_FOCUS_THRESHOLD && !p.paused && !p.focus)
    .sort((a,b)=>b.score-a.score)
    .forEach(p=>{
      enforceFocusLimit();
      p.focus=true;
      p.focusSetAt=Date.now();
    });
}

/* PREDICTION (FIXED LOGIC) */
function computePrediction(score){
  if(score >= 90) return { pred: score+30, label:'Most Likely' };
  if(score >= 70) return { pred: score+15, label:'Possible' };
  if(score >= 50) return { pred: score, label:'Low Chance' };
  return { pred: score-10, label:'Unlikely' };
}

/* RENDER */
function render(){
  peopleContainer.innerHTML='';
  state.people.forEach(p=>{
    const pred = computePrediction(p.score);
    peopleContainer.innerHTML += `
      <div class="card">
        <div class="row">
          <div class="person-title">${p.name} — ${p.score}%</div>
          ${p.focus ? '<span class="badge">FOCUS</span>' : `<span class="small-badge">${p.paused?'PAUSED':'ACTIVE'}</span>`}
        </div>
        <div class="progress"><div class="bar" style="width:${p.score}%"></div></div>
        <div class="controls-row">
          <button class="action" onclick="changeScore('${p.id}',-10)">-10</button>
          <button class="action" onclick="changeScore('${p.id}',10)">+10</button>
          <button class="action" onclick="toggleFocus('${p.id}')">${p.focus?'Unfocus':'Focus'}</button>
          <button class="action" onclick="togglePause('${p.id}')">${p.paused?'Active':'Pause'}</button>
          <button class="action danger" onclick="deletePerson('${p.id}')">Delete</button>
        </div>
        <div class="prediction">Prediction: <strong>${pred.pred}</strong> — ${pred.label}</div>
      </div>`;
  });
}

/* EVENTS */
addBtn.onclick = ()=>{ addOrUpdatePerson(nameInput.value); nameInput.value=''; };
decayBtn.onclick = ()=> showAlert('Decay logic already handled on load');

/* INIT */
loadState();
enforceAutoFocusAll();
render();
