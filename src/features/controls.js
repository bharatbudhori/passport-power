import { C, REG, byCode } from '../core/data.js';
import { match, sorted, state } from '../core/state.js';
import { drawArcs, flyTo, layout, paintGlobe, paintRing, renderGlobe, setHover } from './chart.js';
import { renderDetail, renderNow } from './detail.js';
import { sfx } from './sound.js';
import { renderTable } from './table.js';
import { followPassport } from './fx.js';
import { destCombo, passCombo, renderVerdict } from './trip.js';

/* ---------- selection & controls ---------- */
export function select(i,opt={}){
  if(i!==state.sel) sfx('pop');
  state.sel=i; if(state.dest===i) state.dest=null;
  state.open.add(C[i].reg);
  history.replaceState(null,'','#'+C[i].code);
  passCombo.set(i); destCombo.refresh();
  paintRing(); paintGlobe(); renderTable(); renderDetail(); renderNow(); renderVerdict(); followPassport(); drawArcs();
  flyTo(C[i].lng,C[i].lat);
  if(!opt.fromTable){const r=document.querySelector(`.row[data-i="${i}"]`); if(r){const w=document.getElementById('tablewrap'); w.scrollTop=r.offsetTop-w.offsetTop-80;}}
  if(state.hover!=null) setHover(state.hover);
}
export function setSort(k){ state.sort=k; document.querySelectorAll('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sort===k)); layout(true); renderTable(); }
document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>setSort(b.dataset.sort)));
document.getElementById('grp').addEventListener('change',e=>{state.group=e.target.checked; layout(true); renderTable();});
document.getElementById('expand').addEventListener('click',()=>{REG.forEach((_,i)=>state.open.add(i)); renderTable();});
document.getElementById('collapse').addEventListener('click',()=>{state.open.clear(); renderTable();});
export const q=document.getElementById('q');
q.addEventListener('input',()=>{state.q=q.value; renderTable(); paintRing();});
q.addEventListener('keydown',e=>{if(e.key==='Enter'){const m=sorted(C.filter(match))[0]; if(m) select(m.i);} if(e.key==='Escape'){q.value='';state.q='';renderTable();paintRing();q.blur();}});
addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault(); q.focus();}});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
  state.mode=b.dataset.mode; document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',x===b));
  paintRing(); paintGlobe(); renderGlobe(); renderDetail(); renderNow(); drawArcs();
}));
export const keyBtn=document.getElementById('keybtn'), key=document.getElementById('key');
keyBtn.addEventListener('click',()=>{key.hidden=!key.hidden; keyBtn.setAttribute('aria-expanded',!key.hidden);});
document.addEventListener('click',e=>{if(!key.hidden&&!e.target.closest('.corner.bl')){key.hidden=true; keyBtn.setAttribute('aria-expanded','false');}});

addEventListener('hashchange',()=>{const c=byCode.get(location.hash.slice(1).toUpperCase()); if(c&&c.i!==state.sel) select(c.i);});
