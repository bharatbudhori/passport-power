import { C, REG, maxMS, maxWS } from '../core/data.js';
import { match, sorted, state } from '../core/state.js';
import { esc } from '../core/utils.js';
import { cg, landSel } from './chart.js';
import { select } from './controls.js';

/* ---------- table ---------- */
export const tableEl=document.getElementById('table');
export const chev='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
export function rowHTML(c){
  const p=v=>(v/maxMS*100).toFixed(1);
  return `<div class="row${c.i===state.sel?' on':''}" role="button" tabindex="0" data-i="${c.i}" aria-label="${esc(c.name)}, rank ${c.rank}, mobility score ${c.ms}">
  <span class="rk">${c.rank}</span><span class="nm">${esc(c.name)}</span><span class="n ms">${c.ms}</span><span class="n">${c.vf}</span><span class="n">${c.ws}</span>
  <span class="mini" aria-hidden="true"><span class="bar"><i class="vf" style="width:${p(c.vf)}%"></i><i class="voa" style="width:${p(c.voa)}%"></i><i class="ev" style="width:${p(c.ev)}%"></i></span><b style="width:${(c.ws/maxWS*100).toFixed(1)}%"></b></span></div>`;
}
export function renderTable(){
  let html='';
  if(state.group){
    REG.forEach((r,ri)=>{
      const L=sorted(C.filter(c=>c.reg===ri&&match(c))); if(!L.length) return;
      const open=!!state.q.trim()||state.open.has(ri);
      html+=`<div class="grp"><button class="gh" data-r="${ri}" aria-expanded="${open}">${chev}<span>${r}</span><span class="cnt">${L.length}</span></button>${open?L.map(rowHTML).join(''):''}</div>`;
    });
  } else html=sorted(C.filter(match)).map(rowHTML).join('');
  tableEl.innerHTML=html||`<p class="empty">No country matches “${esc(state.q)}”. Try a name or a 2-letter code such as JP.</p>`;
}
tableEl.addEventListener('click',e=>{
  const g=e.target.closest('.gh'); if(g){const ri=+g.dataset.r; state.open.has(ri)?state.open.delete(ri):state.open.add(ri); renderTable(); return;}
  const r=e.target.closest('.row'); if(r) select(+r.dataset.i,{fromTable:true});
});
tableEl.addEventListener('keydown',e=>{const r=e.target.closest('.row'); if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault(); select(+r.dataset.i,{fromTable:true});}});
tableEl.addEventListener('mouseover',e=>{const r=e.target.closest('.row'); if(r){const i=+r.dataset.i; cg.classed('hov',d=>d.i===i); landSel.classed('hl',f=>f.code===C[i].code);}});
tableEl.addEventListener('mouseleave',()=>{cg.classed('hov',false); landSel.classed('hl',false);});
