import { C } from '../core/data.js';
import { state, verdictFor } from '../core/state.js';
import { dotFor, esc } from '../core/utils.js';
import { flyBetween, paintGlobe, renderGlobe } from './chart.js';
import { select } from './controls.js';
import { followDest } from './fx.js';
import { sfx } from './sound.js';

/* ---------- combobox ---------- */
export function combo(el,id,{placeholder,onPick,meta}){
  el.innerHTML=`<input id="${id}" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="${id}-l" autocomplete="off" spellcheck="false" placeholder="${placeholder}"><ul class="list" id="${id}-l" role="listbox" hidden></ul>`;
  const inp=el.querySelector('input'), ul=el.querySelector('ul'); let items=[], act=0, val=null;
  const draw=()=>{const q=inp.value.trim().toLowerCase(), showAll=!q||(val!=null&&inp.value===C[val].name);
    items=C.filter(c=>showAll||c.name.toLowerCase().includes(q)||c.code.toLowerCase()===q).sort((a,b)=>{
      if(!showAll){const as=a.name.toLowerCase().startsWith(q),bs=b.name.toLowerCase().startsWith(q); if(as!==bs) return as?-1:1;}
      return a.name.localeCompare(b.name);});
    act=Math.max(0,Math.min(act,items.length-1));
    ul.innerHTML=items.length?items.map((c,k)=>`<li role="option" id="${id}-o${k}" data-i="${c.i}" aria-selected="${k===act}"><span class="cd">${c.code}</span><span>${esc(c.name)}</span><span class="mt">${meta(c)}</span></li>`).join(''):'<li aria-disabled="true" style="color:var(--muted)">No match. Try another spelling.</li>';
    inp.setAttribute('aria-activedescendant',items.length?`${id}-o${act}`:'');};
  const open=()=>{draw(); ul.hidden=false; inp.setAttribute('aria-expanded','true'); const a=ul.querySelector('[aria-selected="true"]'); if(a) a.scrollIntoView({block:'nearest'});};
  const close=()=>{ul.hidden=true; inp.setAttribute('aria-expanded','false'); if(val!=null) inp.value=C[val].name;};
  const pick=i=>{val=i; inp.value=C[i].name; close(); inp.blur(); onPick(i);};
  inp.addEventListener('focus',()=>{inp.select(); act=val!=null?Math.max(0,C.slice().sort((a,b)=>a.name.localeCompare(b.name)).findIndex(c=>c.i===val)):0; open();});
  inp.addEventListener('input',()=>{act=0; open();});
  inp.addEventListener('blur',()=>setTimeout(close,120));
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault(); act=Math.min(items.length-1,act+1); open();}
    else if(e.key==='ArrowUp'){e.preventDefault(); act=Math.max(0,act-1); open();}
    else if(e.key==='Enter'){e.preventDefault(); if(items[act]) pick(items[act].i);}
    else if(e.key==='Escape'){close(); inp.blur();}
  });
  ul.addEventListener('mousedown',e=>{const li=e.target.closest('li[data-i]'); if(li){e.preventDefault(); pick(+li.dataset.i);}});
  return {set(i){val=i; inp.value=i==null?'':C[i].name;}, refresh(){if(!ul.hidden) draw();}};
}
export const passCombo=combo(document.getElementById('cPass'),'pass-in',{placeholder:'Search a country',onPick:i=>select(i),
  meta:c=>`<span class="mono">${c.ms}</span> destinations`});
export const destCombo=combo(document.getElementById('cDest'),'dest-in',{placeholder:'Pick a destination',onPick:i=>setDest(i),
  meta:c=>{const v=verdictFor(state.sel,c.i); return `${dotFor(v.k)}${v.t}`;}});

export function setDest(i){
  state.dest=i; destCombo.set(i); renderVerdict(); followDest(); paintGlobe(); renderGlobe();
  if(i!=null&&i!==state.sel){ const k=verdictFor(state.sel,i).k; sfx(k==='vf'?'stamp':k==='req'?'deny':'tap'); }
  if(i!=null&&i!==state.sel) flyBetween(C[state.sel],C[i]);
}
export function renderVerdict(){
  const el=document.getElementById('verdict'), s=C[state.sel];
  if(state.dest==null){el.innerHTML=`<p>Pick a destination to check what ${esc(s.name)} passport holders need to enter. You can also click any country on the globe.</p>`; return;}
  const d=C[state.dest], v=verdictFor(state.sel,state.dest), back=verdictFor(state.dest,state.sel);
  el.innerHTML=`<span class="badge ${v.k}">${dotFor(v.k)}${v.t}</span><p>${v.s}${state.dest!==state.sel?` Going the other way, ${esc(d.name)} passport holders need: <b style="color:var(--ink)">${back.t}</b> in ${esc(s.name)}.`:''}</p>`;
}
