import { C, LBL, days } from '../core/data.js';
import { cat, catOf, state } from '../core/state.js';
import { dotFor, esc, ord, reduce } from '../core/utils.js';
import { paintGlobe, paintRing, renderGlobe } from './chart.js';
import { coverHTML } from './covers.js';
import { combo, setDest } from './trip.js';

/* ---------- stage head + layers ---------- */
export function renderNow(){
  const s=C[state.sel], out=state.mode==='out';
  document.getElementById('now').innerHTML=`<div class="nowrow"><button class="nowpp" aria-label="View the ${esc(s.name)} passport" title="View passport">${coverHTML(s)}</button><div><div class="k">${out?'Selected passport':'Selected destination'}</div><h2>${esc(s.name)}</h2>
  <div class="sub">${out?`Ranked <b>${ord(s.rank)}</b>, with <b>${s.ms}</b> destinations open without a prior visa`:`Welcomes <b>${s.ws}</b> passports visa-free or on arrival`}</div></div></div>`;
  document.getElementById('lede').innerHTML=out?`<b>${esc(s.name)}</b> passport holders can reach <b>${s.ms}</b> destinations without a prior visa.`:`<b>${s.ws}</b> passports can enter <b>${esc(s.name)}</b> visa-free or on arrival.`;
  const cnt={vf:0,voa:0,ev:0,req:0}; C.forEach(c=>{const k=cat(c.i); if(k in cnt) cnt[k]++;});
  document.getElementById('layers').innerHTML=['vf','voa','ev','req'].map(k=>`<button class="layer" data-layer="${k}" aria-pressed="${state.layers[k]}" title="Show or hide these routes">${dotFor(k)}${LBL[k]} <span class="c">${cnt[k]}</span></button>`).join('');
}
document.getElementById('layers').addEventListener('click',e=>{const b=e.target.closest('[data-layer]'); if(!b) return;
  const k=b.dataset.layer; state.layers[k]=!state.layers[k]; b.setAttribute('aria-pressed',state.layers[k]); paintGlobe(); renderGlobe();});

/* ---------- detail ---------- */
export const detailEl=document.getElementById('detail');
export let cmpCombo=null;
export function renderDetail(){
  const s=C[state.sel], out=state.mode==='out';
  const stat=(v,k,dot)=>`<div class="stat"><div class="v">${v}</div><div class="k">${dot?dotFor(dot):''}${k}</div></div>`;
  let body='';
  if(state.dtab==='dest'){
    const groups={vf:[],voa:[],ev:[],req:[]};
    C.forEach(c=>{const k=cat(c.i); if(groups[k]) groups[k].push(c);});
    const dq=state.dq.trim().toLowerCase();
    const L=groups[state.tab].filter(c=>!dq||c.name.toLowerCase().includes(dq)).sort((a,b)=>a.name.localeCompare(b.name));
    const tabs=['vf','voa','ev','req'].map(k=>`<button class="tab" role="tab" data-tab="${k}" aria-selected="${state.tab===k}">${dotFor(k)}${LBL[k]} <span class="c">${groups[k].length}</span></button>`).join('');
    const chips=L.map(c=>{const dy=state.tab==='vf'?(out?days(state.sel,c.i):days(c.i,state.sel)):null;
      return `<button class="chip" data-j="${c.i}" title="Show on globe"><small>${c.code}</small>${esc(c.name)}${dy?`<span class="dy">${dy}d</span>`:''}</button>`;}).join('');
    body=`<div class="tabs" role="tablist">${tabs}<input class="filter" id="dq" placeholder="Filter list" value="${esc(state.dq)}" aria-label="Filter list"></div>
      <div class="dests">${chips||'<p class="empty">Nothing here.</p>'}</div>`;
  } else {
    body=`<div class="cmphead"><div class="field"><label for="cmp-in">Compare ${esc(s.name)} with</label><div class="combo" id="cCmp"></div></div></div>`;
    if(state.cmp!=null&&state.cmp!==state.sel){
      const b=C[state.cmp], ok=(p,j)=>{const k=catOf(p,j,'out'); return k==='vf'||k==='voa'||k==='ev';};
      const onlyA=[],both=[],onlyB=[];
      C.slice().sort((x,y)=>x.name.localeCompare(y.name)).forEach(c=>{if(c.i===s.i||c.i===b.i) return; const A=ok(s.i,c.i),B=ok(b.i,c.i); if(A&&B) both.push(c); else if(A) onlyA.push(c); else if(B) onlyB.push(c);});
      const row=(k,a,bb,low)=>`<tr><td>${k}</td><td class="${(low?a<bb:a>bb)?'win':''}">${low?ord(a):a}</td><td class="${(low?bb<a:bb>a)?'win':''}">${low?ord(bb):bb}</td></tr>`;
      const col=(t,L)=>`<div class="cmpcol"><h5>${t}<span>${L.length}</span></h5><ul>${L.map(c=>`<li>${esc(c.name)}</li>`).join('')||'<li style="color:var(--muted)">None</li>'}</ul></div>`;
      body+=`<table class="cmptable"><tr><th></th><th>${esc(s.name)}</th><th>${esc(b.name)}</th></tr>${row('Rank',s.rank,b.rank,true)}${row('Mobility Score',s.ms,b.ms)}${row('Visa-free',s.vf,b.vf)}${row('On arrival',s.voa,b.voa)}${row('eVisa / ETA',s.ev,b.ev)}${row('Welcoming Score',s.ws,b.ws)}</table>
      <div class="cmpgrid">${col('Only '+esc(s.name),onlyA)}${col('Both passports',both)}${col('Only '+esc(b.name),onlyB)}</div>`;
    } else body+=`<p class="empty">Choose a second passport to see which destinations each one opens.</p>`;
  }
  detailEl.innerHTML=`<div class="stats">${stat(ord(s.rank),'Rank')}${stat(s.ms,'Mobility Score')}${stat(s.vf,'Visa-free','vf')}${stat(s.voa,'On arrival','voa')}${stat(s.ev,'eVisa / ETA','ev')}${stat(s.ws,'Welcoming Score','ws')}</div>
  <div class="dtabs" role="tablist"><button class="dtab" data-dtab="dest" aria-selected="${state.dtab==='dest'}">${out?'Destinations':'Passports let in'}</button><button class="dtab" data-dtab="cmp" aria-selected="${state.dtab==='cmp'}">Compare passports</button></div>${body}`;
  if(state.dtab==='cmp'){cmpCombo=combo(document.getElementById('cCmp'),'cmp-in',{placeholder:'Pick a passport',onPick:i=>{state.cmp=i; renderDetail(); paintRing();},
    meta:c=>`<span class="mono">${c.ms}</span>`}); cmpCombo.set(state.cmp!==state.sel?state.cmp:null);}
  const dq=document.getElementById('dq');
  if(dq) dq.addEventListener('input',()=>{state.dq=dq.value; const pos=dq.selectionStart; renderDetail(); const n=document.getElementById('dq'); n.focus(); n.setSelectionRange(pos,pos);});
}
detailEl.addEventListener('click',e=>{
  const dt=e.target.closest('.dtab'); if(dt){state.dtab=dt.dataset.dtab; renderDetail(); paintRing(); return;}
  const t=e.target.closest('.tab'); if(t){state.tab=t.dataset.tab; renderDetail(); return;}
  const ch=e.target.closest('.chip'); if(ch){setDest(+ch.dataset.j); document.querySelector('.hero').scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});}
});
