/* Rizz System Logic — Stable Mobile Version */

const STORAGE_KEY = "rizz_v1_final";
const FOCUS_LIMIT = 2;

let people = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const $ = id => document.getElementById(id);
const uid = () => Date.now()+"_"+Math.random().toString(36).slice(2,6);

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

function render(){
  const list = $("list");
  list.innerHTML = "";

  if(people.length === 0){
    list.innerHTML = '<div class="muted">No entries yet — add a name above</div>';
    $("phase").textContent = "0%";
    $("phaseBar").style.width = "0%";
    save();
    return;
  }

  const avg = Math.round(
    people.reduce((s,p)=>s+p.score,0) / people.length
  );

  $("phase").textContent = avg + "%";
  $("phaseBar").style.width = avg + "%";

  people.forEach(p=>{
    const row = document.createElement("div");
    row.className = "person" + (p.active ? "" : " paused");

    const name = el("div","name",p.name);
    const score = el("div","score",p.score+"%");

    const sb = document.createElement("div");
    sb.className="small-bar";
    const si = document.createElement("div");
    si.className="small-inner";
    si.style.width=p.score+"%";
    sb.appendChild(si);

    const right = document.createElement("div");
    right.className="right";

    right.append(
      btn("+10",()=>change(p.id,10)),
      btn("-10",()=>change(p.id,-10)),
      btn(p.focused?"Unfocus":"Focus",()=>toggleFocus(p.id),"focus"),
      btn(p.active?"Pause":"Activate",()=>toggleActive(p.id)),
      btn("Delete",()=>remove(p.id),"danger")
    );

    row.append(name,score,sb,right);
    list.appendChild(row);
  });

  save();
}

function el(tag,cls,txt){
  const e=document.createElement(tag);
  e.className=cls;
  e.textContent=txt;
  return e;
}

function btn(txt,fn,cls){
  const b=document.createElement("button");
  b.textContent=txt;
  if(cls) b.classList.add(cls);
  b.onclick=fn;
  return b;
}

function add(){
  const input=$("nameInput");
  const n=input.value.trim();
  if(!n) return;

  let p=people.find(x=>x.name.toLowerCase()===n.toLowerCase());
  if(p) p.score=Math.min(100,p.score+10);
  else people.push({id:uid(),name:n,score:30,focused:false,active:true});

  input.value="";
  render();
}

function change(id,val){
  const p=people.find(x=>x.id===id);
  if(!p||!p.active) return;
  p.score=Math.max(0,Math.min(100,p.score+val));
  render();
}

function toggleFocus(id){
  const p=people.find(x=>x.id===id);
  if(!p||!p.active) return;

  if(!p.focused){
    const f=people.filter(x=>x.focused);
    if(f.length>=FOCUS_LIMIT) f[0].focused=false;
    p.focused=true;
  }else p.focused=false;

  render();
}

function toggleActive(id){
  const p=people.find(x=>x.id===id);
  p.active=!p.active;
  if(!p.active) p.focused=false;
  render();
}

function remove(id){
  people=people.filter(p=>p.id!==id);
  render();
}

function pauseAll(){
  people.forEach(p=>{p.active=false;p.focused=false});
  render();
}

function resumeAll(){
  people.forEach(p=>p.active=true);
  render();
}

function decay(){
  people.forEach(p=>p.active&&(p.score=Math.max(0,p.score-10)));
  render();
}

/* Wiring */
$("addBtn").onclick=add;
$("pauseAll").onclick=pauseAll;
$("resumeAll").onclick=resumeAll;
$("decayBtn").onclick=decay;

$("minus").onclick=()=>{people.forEach(p=>p.focused&&p.active&&(p.score=Math.max(0,p.score-10)));render();};
$("plus").onclick=()=>{people.forEach(p=>p.focused&&p.active&&(p.score=Math.min(100,p.score+10)));render();};
$("focusToggle").onclick=()=>{people.forEach(p=>p.focused=!p.focused);render();};
$("deleteFocused").onclick=()=>{people=people.filter(p=>!p.focused);render();};

/* ENTER key support */
$("nameInput").addEventListener("keydown",e=>{
  if(e.key==="Enter") add();
});

render();
