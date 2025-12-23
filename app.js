const STORAGE_KEY = 'rizz_v1';
const FOCUS_LIMIT = 2;
const AUTO_FOCUS = 90;

const nameInput = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const decayBtn = document.getElementById('decayBtn');
const peopleContainer = document.getElementById('peopleContainer');
const alertBox = document.getElementById('alertBox');

let state = load();

/* ---------- Core ---------- */

function load(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { people: [] };
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(){
  return Math.random().toString(36).slice(2);
}

function clamp(n){
  return Math.max(0, Math.min(100, n));
}

/* ---------- Actions ---------- */

function addPerson(){
  const name = nameInput.value.trim();
  if(!name) return alertMsg('Enter a name');

  let p = state.people.find(x => x.name.toLowerCase() === name.toLowerCase());
  if(!p){
    p = { id:uid(), name, score:0, focus:false, paused:false };
    state.people.push(p);
  }

  save();
  render();
  nameInput.value = '';
}

function changeScore(id, delta){
  const p = state.people.find(x => x.id === id);
  if(!p) return;
  p.score = clamp(p.score + delta);
  applyAutoFocus();
  save();
  render();
}

function toggleFocus(id){
  const p = state.people.find(x => x.id === id);
  if(!p) return;

  if(!p.focus){
    const focused = state.people.filter(x => x.focus);
    if(focused.length >= FOCUS_LIMIT){
      focused[0].focus = false;
    }
  }

  p.focus = !p.focus;
  save();
  render();
}

function togglePause(id){
  const p = state.people.find(x => x.id === id);
  p.paused = !p.paused;
  save();
  render();
}

function removePerson(id){
  state.people = state.people.filter(p => p.id !== id);
  save();
  render();
}

function runDecay(){
  state.people.forEach(p=>{
    if(!p.focus && !p.paused){
      p.score = clamp(p.score - 10);
    }
  });
  save();
  render();
}

/* ---------- Logic ---------- */

function applyAutoFocus(){
  state.people.forEach(p=>{
    if(p.score >= AUTO_FOCUS && !p.focus && !p.paused){
      const focused = state.people.filter(x=>x.focus);
      if(focused.length >= FOCUS_LIMIT){
        focused[0].focus = false;
      }
      p.focus = true;
    }
  });
}

function prediction(score){
  if(score >= 90) return '🔥 Very Likely';
  if(score >= 70) return '🙂 Possible';
  if(score >= 50) return '🤔 Unlikely';
  return '❌ Very Unlikely';
}

/* ---------- UI ---------- */

function render(){
  peopleContainer.innerHTML = '';
  state.people.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="row">
        <strong>${p.name} — ${p.score}%</strong>
        ${p.focus ? '<span class="badge">FOCUS</span>' : ''}
      </div>

      <div class="progress">
        <div class="bar" style="width:${p.score}%"></div>
      </div>

      <div class="controls-row">
        <button class="action" onclick="changeScore('${p.id}',-10)">-10</button>
        <button class="action" onclick="changeScore('${p.id}',10)">+10</button>
        <button class="action" onclick="toggleFocus('${p.id}')">${p.focus?'Unfocus':'Focus'}</button>
        <button class="action" onclick="togglePause('${p.id}')">${p.paused?'Active':'Pause'}</button>
        <button class="action danger" onclick="removePerson('${p.id}')">Delete</button>
      </div>

      <div class="prediction">Prediction: ${prediction(p.score)}</div>
    `;

    peopleContainer.appendChild(card);
  });
}

function alertMsg(msg){
  alertBox.style.display='block';
  alertBox.textContent = msg;
  setTimeout(()=>alertBox.style.display='none',1500);
}

/* ---------- Events ---------- */

addBtn.onclick = addPerson;
decayBtn.onclick = runDecay;

/* ---------- Init ---------- */

render();