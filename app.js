 /* Rizz System — app.js
   - iPhone & GitHub Pages friendly
   - No crypto.randomUUID, no inline onclick
   - Active / Pause per person, Pause All / Resume All
   - Focus limit enforcement, decay test
*/

(function(){
  const STORAGE_KEY = 'rizz_v1_data';
  const FOCUS_LIMIT = 2;
  const DECAY_AMOUNT = 10; // −10
  const DEBOUNCE_MS = 180;

  // State
  let people = [];
  let renderTimer = null;

  // Helpers
  const $ = id => document.getElementById(id);
  const now = () => Date.now();
  const makeId = () => (Date.now().toString(36) + Math.random().toString(36).slice(2,8));

  // Load & Save
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      people = raw ? JSON.parse(raw) : [];
    }catch(e){
      people = [];
      console.error('load error', e);
    }
  }
  function save(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); } catch(e){ console.error(e); }
  }

  // Debounced render to avoid frequent DOM thrash
  function scheduleRender(){
    if(renderTimer) return;
    renderTimer = setTimeout(()=> { renderTimer = null; render(); }, DEBOUNCE_MS);
  }

  // Render
  function render(){
    const list = $('list');
    list.innerHTML = '';

    const total = people.reduce((s,p)=>s+p.score,0);
    const avg = people.length ? Math.round(total / people.length) : 0;
    $('overallPct').textContent = avg + '%';
    $('overallBar').style.width = avg + '%';

    // Sort: focused first, then active, then by score desc
    const sorted = people.slice().sort((a,b)=>{
      if(a.focused && !b.focused) return -1;
      if(b.focused && !a.focused) return 1;
      if(a.active !== b.active) return a.active ? -1 : 1;
      return b.score - a.score;
    });

    sorted.forEach(p => {
      const row = document.createElement('div');
      row.className = 'person' + (p.active ? '' : ' paused');

      // left
      const left = document.createElement('div');
      left.className = 'left';

      const nameEl = document.createElement('div');
      nameEl.className = 'name';
      nameEl.textContent = p.name;

      const scoreWrap = document.createElement('div');
      scoreWrap.style.display = 'flex';
      scoreWrap.style.alignItems = 'center';

      const scoreEl = document.createElement('div');
      scoreEl.className = 'score';
      scoreEl.textContent = p.score + '%';

      const miniBar = document.createElement('div');
      miniBar.className = 'mini-bar';
      const miniInner = document.createElement('div');
      miniInner.className = 'mini-inner';
      miniInner.style.width = p.score + '%';
      miniBar.appendChild(miniInner);

      scoreWrap.appendChild(scoreEl);
      scoreWrap.appendChild(miniBar);

      left.appendChild(nameEl);
      left.appendChild(scoreWrap);

      // focus badge
      if(p.focused){
        const f = document.createElement('div');
        f.className = 'focus-badge';
        f.textContent = 'FOCUS';
        left.appendChild(f);
      }

      // actions
      const actions = document.createElement('div');
      actions.className = 'actions';

      const btnPlus = document.createElement('button');
      btnPlus.className = 'small';
      btnPlus.textContent = '+10';
      btnPlus.onclick = () => { adjustScore(p.id, +10); };

      const btnMinus = document.createElement('button');
      btnMinus.className = 'small';
      btnMinus.textContent = '−10';
      btnMinus.onclick = () => { adjustScore(p.id, -10); };

      const btnFocus = document.createElement('button');
      btnFocus.className = 'small';
      btnFocus.textContent = p.focused ? 'Unfocus' : 'Focus';
      btnFocus.onclick = () => { toggleFocus(p.id); };

      const btnActive = document.createElement('button');
      btnActive.className = 'small';
      btnActive.textContent = p.active ? 'Pause' : 'Activate';
      btnActive.onclick = () => { toggleActive(p.id); };

      const btnDelete = document.createElement('button');
      btnDelete.className = 'small';
      btnDelete.textContent = 'Delete';
      btnDelete.onclick = () => { deletePerson(p.id); };

      actions.appendChild(btnPlus);
      actions.appendChild(btnMinus);
      actions.appendChild(btnFocus);
      actions.appendChild(btnActive);
      actions.appendChild(btnDelete);

      row.appendChild(left);
      row.appendChild(actions);
      list.appendChild(row);
    });

    save();
    setStatus('Rendered ' + people.length + ' people');
  }

  // Mutations
  function addOrUpdate(){
    const input = $('nameInput');
    const name = input.value.trim();
    if(!name) { setStatus('Enter a name'); return; }

    const existing = people.find(p => p.name.toLowerCase() === name.toLowerCase());
    if(existing){
      existing.score = Math.min(100, existing.score + 10);
      existing.lastUpdated = now();
      setStatus('Updated ' + existing.name);
    } else {
      people.push({
        id: makeId(),
        name,
        score: 30,
        focused: false,
        active: true,
        createdAt: now(),
        lastFocusedAt: 0
      });
      setStatus('Added ' + name);
    }
    input.value = '';
    scheduleRender();
  }

  function deletePerson(id){
    people = people.filter(p => p.id !== id);
    scheduleRender();
  }

  function adjustScore(id, delta){
    const p = people.find(x => x.id === id);
    if(!p) return;
    if(!p.active) { setStatus('Person is paused'); return; }
    p.score = Math.max(0, Math.min(100, p.score + delta));
    scheduleRender();
  }

  // Focus logic with limit enforcement
  function toggleFocus(id){
    const p = people.find(x => x.id === id);
    if(!p) return;
    if(!p.active) { setStatus('Cannot focus a paused person'); return; }

    if(!p.focused){
      const focused = people.filter(x => x.focused);
      if(focused.length >= FOCUS_LIMIT){
        // unfocus earliest focused
        focused.sort((a,b)=> (a.lastFocusedAt||a.createdAt) - (b.lastFocusedAt||b.createdAt));
        const oldest = focused[0];
        if(oldest) { oldest.focused = false; setStatus('Auto-unfocused ' + oldest.name); }
      }
      p.focused = true;
      p.lastFocusedAt = now();
      setStatus('Focused ' + p.name);
    } else {
      p.focused = false;
      setStatus('Unfocused ' + p.name);
    }
    scheduleRender();
  }

  function countFocused(){ return people.filter(x => x.focused).length; }

  function toggleActive(id){
    const p = people.find(x => x.id === id);
    if(!p) return;
    p.active = !p.active;
    if(!p.active && p.focused) p.focused = false;
    setStatus((p.active ? 'Activated ' : 'Paused ') + p.name);
    scheduleRender();
  }

  function pauseAll(){
    people.forEach(p => { p.active = false; p.focused = false; });
    $('pauseAll').classList.add('hidden');
    $('resumeAll').classList.remove('hidden');
    setStatus('All paused');
    scheduleRender();
  }

  function resumeAll(){
    people.forEach(p => { p.active = true; });
    $('resumeAll').classList.add('hidden');
    $('pauseAll').classList.remove('hidden');
    setStatus('All resumed');
    scheduleRender();
  }

  function deleteFocused(){
    const ids = people.filter(p => p.focused).map(p => p.id);
    if(!ids.length){ setStatus('No focused to delete'); return; }
    people = people.filter(p => !p.focused);
    setStatus('Deleted focused items');
    scheduleRender();
  }

  // Decay: apply −10 to active people (manual trigger for test)
  function runDecay(){
    let changed = false;
    people.forEach(p => {
      if(p.active){
        const old = p.score;
        p.score = Math.max(0, p.score - DECAY_AMOUNT);
        if(p.score !== old) changed = true;
      }
    });
    setStatus(changed ? 'Decay applied' : 'Decay run — no changes');
    if(changed) scheduleRender();
  }

  // Status helper
  function setStatus(txt){
    const el = $('statusText');
    if(el) el.textContent = txt;
  }

  // Wire UI
  function wireUI(){
    $('addBtn').addEventListener('click', addOrUpdate);
    $('nameInput').addEventListener('keydown', (e)=> { if(e.key === 'Enter') addOrUpdate(); });
    $('pauseAll').addEventListener('click', pauseAll);
    $('resumeAll').addEventListener('click', resumeAll);
    $('decayTest').addEventListener('click', runDecay);
    $('decMinus10').addEventListener('click', ()=> {
      people.forEach(p => { if(p.focused && p.active) p.score = Math.max(0,p.score - 10); });
      scheduleRender();
    });
    $('incPlus10').addEventListener('click', ()=> {
      people.forEach(p => { if(p.focused && p.active) p.score = Math.min(100,p.score + 10); });
      scheduleRender();
    });
    $('focusBtn').addEventListener('click', ()=> {
      // if none focused, focus top active by score else unfocus all
      const focused = people.filter(p=>p.focused);
      if(focused.length === 0){
        const top = people.filter(p=>p.active).sort((a,b)=>b.score-a.score)[0];
        if(top) toggleFocus(top.id);
      } else {
        people.forEach(p => p.focused = false);
        scheduleRender();
      }
    });
    $('deleteBtn').addEventListener('click', deleteFocused);
  }

  // Init
  function init(){
    load();
    wireUI();
    scheduleRender();
    setStatus('Ready');
  }

  // Expose for debugging (console)
  window.Rizz = {
    get state(){ return people; },
    runDecay,
    addOrUpdate,
    render
  };

  init();

})();
