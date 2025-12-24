/* app.js — Rizz System Version 1 (Phase A)
   - 3.0.0 release
   - All buttons present, Enter-to-add, empty-state, auto-focus >=90%
   - Focus limit enforced (2)
   - Safe for GitHub Pages & iPhone Safari (no crypto, no inline onclick)
*/

const STORAGE_KEY = 'rizz_v1_v3';
const FOCUS_LIMIT = 2;
const DECAY_AMOUNT = 10;

let people = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);

function save(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); }catch(e){ console.error(e); }
}

function setStatus(txt){
  const s = $('statusText'); if(s) s.textContent = txt || 'Ready';
}

/* Render with batched DOM writes (small lists OK) */
function render(){
  const list = $('list');
  list.innerHTML = '';

  if(!people.length){
    list.innerHTML = '<div class="muted">No entries yet — add a name above</div>';
    $('phase').textContent = '0%';
    $('phaseBar').style.width = '0%';
    save();
    return;
  }

  // compute overall
  const avg = Math.round( people.reduce((s,p)=>s+p.score,0) / people.length );
  $('phase').textContent = avg + '%';
  $('phaseBar').style.width = avg + '%';

  // sort: focused first, then active, then score desc
  const sorted = people.slice().sort((a,b)=>{
    if(a.focused && !b.focused) return -1;
    if(b.focused && !a.focused) return 1;
    if(a.active !== b.active) return a.active ? -1 : 1;
    return b.score - a.score;
  });

  const frag = document.createDocumentFragment();
  sorted.forEach(p => {
    const row = document.createElement('div');
    row.className = 'person' + (p.active ? '' : ' paused');

    // left: name + score + mini bar
    const name = document.createElement('div'); name.className='name'; name.textContent = p.name;
    const score = document.createElement('div'); score.className='score'; score.textContent = p.score + '%';

    const smallBar = document.createElement('div'); smallBar.className = 'small-bar';
    const smallInner = document.createElement('div'); smallInner.className = 'small-inner';
    smallInner.style.width = p.score + '%';
    smallBar.appendChild(smallInner);

    const leftWrap = document.createElement('div');
    leftWrap.style.display = 'flex'; leftWrap.style.gap = '10px'; leftWrap.style.alignItems='center';
    leftWrap.appendChild(name);
    leftWrap.appendChild(score);
    leftWrap.appendChild(smallBar);

    // focus badge
    if(p.focused){
      const badge = document.createElement('div'); badge.className='badge-focus'; badge.textContent='FOCUS';
      leftWrap.appendChild(badge);
    }

    // right: action buttons
    const right = document.createElement('div'); right.className = 'right';

    const bPlus = makeButton('+10', ()=> adjustScore(p.id, +10));
    const bMinus = makeButton('−10', ()=> adjustScore(p.id, -10));
    const bFocus = makeButton(p.focused ? 'Unfocus' : 'Focus', ()=> toggleFocus(p.id), 'small ghost');
    const bActive = makeButton(p.active ? 'Pause' : 'Activate', ()=> toggleActive(p.id), 'small ghost');
    const bDelete = makeButton('Delete', ()=> removeOne(p.id), 'small danger');

    right.append(bPlus, bMinus, bFocus, bActive, bDelete);

    row.appendChild(leftWrap);
    row.appendChild(right);
    frag.appendChild(row);
  });

  list.appendChild(frag);
  save();
  setStatus('Rendered ' + people.length + ' entries');
}

function makeButton(label, cb, cls){
  const b = document.createElement('button');
  b.textContent = label;
  b.className = cls || 'small';
  b.onclick = cb;
  return b;
}

/* Core mutations */
function addOrUpdate(){
  const input = $('nameInput');
  const name = input.value.trim();
  if(!name){ setStatus('Type a name first'); return; }

  // check existing (case-insensitive)
  const existing = people.find(p => p.name.toLowerCase() === name.toLowerCase());
  if(existing){
    existing.score = Math.min(100, existing.score + 10);
    // auto-focus when reaching >= 90
    if(existing.score >= 90) attemptAutoFocus(existing);
    setStatus('Updated ' + existing.name);
  } else {
    const person = { id: uid(), name, score: 30, focused: false, active: true, createdAt: Date.now(), lastFocusedAt: 0};
    people.push(person);
    setStatus('Added ' + name);
  }
  input.value = '';
  render();
}

function adjustScore(id, delta){
  const p = people.find(x => x.id === id);
  if(!p) return;
  if(!p.active){ setStatus('Person is paused'); return; }
  p.score = Math.max(0, Math.min(100, p.score + delta));
  if(p.score >= 90) attemptAutoFocus(p);
  render();
}

/* Auto-focus logic: focus person if not focused and >=90; obey limit */
function attemptAutoFocus(person){
  if(person.focused) return;
  const focused = people.filter(p=>p.focused);
  if(focused.length >= FOCUS_LIMIT){
    // unfocus oldest focused to make room
    focused.sort((a,b)=> (a.lastFocusedAt||a.createdAt) - (b.lastFocusedAt||b.createdAt));
    focused[0].focused = false;
  }
  person.focused = true;
  person.lastFocusedAt = Date.now();
  setStatus('Auto-focused ' + person.name + ' (≥90%)');
}

/* Toggle focus while enforcing limit */
function toggleFocus(id){
  const p = people.find(x=>x.id === id);
  if(!p || !p.active){ setStatus('Cannot focus a paused person'); return; }

  if(!p.focused){
    const focused = people.filter(x=>x.focused);
    if(focused.length >= FOCUS_LIMIT){
      focused.sort((a,b)=> (a.lastFocusedAt||a.createdAt) - (b.lastFocusedAt||b.createdAt));
      focused[0].focused = false;
    }
    p.focused = true;
    p.lastFocusedAt = Date.now();
    setStatus('Focused ' + p.name);
  } else {
    p.focused = false;
    setStatus('Unfocused ' + p.name);
  }
  render();
}

function toggleActive(id){
  const p = people.find(x=>x.id === id);
  if(!p) return;
  p.active = !p.active;
  if(!p.active) p.focused = false;
  setStatus((p.active ? 'Activated ' : 'Paused ') + p.name);
  render();
}

function removeOne(id){
  people = people.filter(p=>p.id !== id);
  setStatus('Deleted item');
  render();
}

/* Global actions */
function pauseAll(){
  people.forEach(p=>{ p.active = false; p.focused = false; });
  setStatus('All paused');
  render();
}
function resumeAll(){
  people.forEach(p=>{ p.active = true; });
  setStatus('All resumed');
  render();
}
function runDecay(){
  let changed=false;
  people.forEach(p=>{
    if(p.active){
      const old = p.score;
      p.score = Math.max(0,p.score - DECAY_AMOUNT);
      if(p.score !== old) changed = true;
    }
  });
  setStatus(changed ? 'Decay applied' : 'Decay did nothing');
  if(changed) render();
}

/* Bulk global buttons */
function globalMinus10(){
  people.forEach(p=>{ if(p.focused && p.active) p.score = Math.max(0, p.score-10); });
  setStatus('Applied −10 to focused');
  render();
}
function globalPlus10(){
  people.forEach(p=>{ if(p.focused && p.active) p.score = Math.min(100, p.score+10); if(p.score>=90) attemptAutoFocus(p); });
  setStatus('+10 to focused');
  render();
}
function globalFocusToggle(){
  const anyFocused = people.some(p=>p.focused);
  if(!anyFocused){
    // focus top active by score
    const top = people.filter(p=>p.active).sort((a,b)=>b.score-a.score)[0];
    if(top) toggleFocus(top.id);
  } else {
    people.forEach(p=>p.focused = false);
    setStatus('All unfocused');
    render();
  }
}
function deleteFocused(){
  const focusedCount = people.filter(p=>p.focused).length;
  if(!focusedCount){ setStatus('No focused items'); return; }
  people = people.filter(p=>!p.focused);
  setStatus('Deleted focused items');
  render();
}

/* Wiring UI */
window.addEventListener('DOMContentLoaded', ()=>{

  // Buttons
  $('addBtn').onclick = addOrUpdate;
  $('decayBtn').onclick = runDecay;
  $('pauseAll').onclick = pauseAll;
  $('resumeAll').onclick = resumeAll;

  $('decMinus10').onclick = globalMinus10;
  $('incPlus10').onclick = globalPlus10;
  $('focusBtn').onclick = globalFocusToggle;
  $('deleteBtn').onclick = deleteFocused;

  // Enter key support
  $('nameInput').addEventListener('keydown', e => {
    if(e.key === 'Enter') addOrUpdate();
  });

  // Initial render
  render();

  // Optional: example automatic decay runner (commented out; 2 days is long)
  // If you want auto-decay every 48 hours while the page is open, uncomment:
  // setInterval(runDecay, 48 * 3600 * 1000);
});

/* Expose for debugging */
window.RizzV1 = {
  state: () => people.slice(),
  runDecay,
  render
};
