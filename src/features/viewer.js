import { hasStamp, toggleStamp } from '../core/wallet.js';
import { preloadPhoto } from './photos.js';
import { C, M, REG, days, maxMS } from '../core/data.js';
import { esc, ord, reduce } from '../core/utils.js';
import { select } from './controls.js';
import { CNAME, ccol, ckey, coverHTML } from './covers.js';
import { colCount } from './gallery.js';
import { showScene } from './scenes.js';
import { sfx } from './sound.js';
import { setView } from './views.js';

/* ---------- 3D passport viewer: coverflow carousel ---------- */
export const viewer=document.getElementById('viewer'), vbook=document.getElementById('vbook'), vfoot=document.getElementById('vfoot'), vopenBtn=document.getElementById('vopen');
export let vList=[], vIdx=0, vIsOpen=false, vTrigger=null, slots=new Map(), flow=null, busy=false;
export const LEAVES=`<div class="leaf" style="transform:translate(4.5%,0) translateZ(-4px)"></div><div class="leaf" style="transform:translate(3%,0) translateZ(-2.5px)"></div><div class="leaf" style="transform:translate(1.5%,0) translateZ(-1px)"></div>`;
export function sideHTML(c){ return `<div class="book side"><div class="tilt">${LEAVES}<div class="cover"><div class="face front">${coverHTML(c)}</div></div></div></div>`; }
export function centerHTML(c){
  const k=ckey(c), col=ccol(c);
  const easy=C.filter(d=>d.i!==c.i&&M[c.i][d.i]==='V').map(d=>({d,n:days(c.i,d.i)||0})).sort((a,b)=>b.n-a.n||a.d.name.localeCompare(b.d.name)).slice(0,4);
  const pct=v=>(v/maxMS*100).toFixed(1)+'%';
  const mrz=('P<'+c.code+c.name.toUpperCase().replace(/[^A-Z]/g,'<')+'<'.repeat(44)).slice(0,44);
  return `<div class="book${vIsOpen?' open':''}" id="book" role="button" tabindex="0" aria-label="${esc(c.name)} passport. Click to open or close, drag to turn, flick sideways to browse.">
   <div class="tilt" id="tilt">${LEAVES}
    <div class="page">
      <h4>Passport power</h4><div class="sub">${esc(c.name)}</div>
      <div class="prow"><span>Global rank</span><b>${ord(c.rank)}</b></div>
      <div class="prow"><span>Mobility Score</span><b>${c.ms}</b></div>
      <div class="bars"><i class="bv" style="width:${pct(c.vf)}"></i><i class="ba" style="width:${pct(c.voa)}"></i><i class="be" style="width:${pct(c.ev)}"></i></div>
      <div class="prow"><span>Visa-free</span><b>${c.vf}</b></div>
      <div class="prow"><span>Visa on arrival</span><b>${c.voa}</b></div>
      <div class="prow"><span>eVisa / ETA</span><b>${c.ev}</b></div>
      <div class="prow"><span>Visa required</span><b>${c.req}</b></div>
      <div class="prow"><span>Welcoming Score</span><b>${c.ws}</b></div>
      ${easy.length?`<div class="easy"><b>Longest visa-free stays:</b> ${easy.map(e=>`${esc(e.d.name)}${e.n?` (${e.n}d)`:''}`).join(', ')}</div>`:''}
      <div class="pageacts"><button class="go" data-map="${c.i}">See where it goes</button><button type="button" class="stamp" data-code="${c.code}" aria-pressed="${hasStamp(c.code)}">${hasStamp(c.code)?'Stamped':'Collect stamp'}</button></div>
      <div class="mrz">${esc(mrz).replace(/</g,'&lt;')}</div>
    </div>
    <div class="cover"><div class="face front">${coverHTML(c)}</div>
      <div class="face back" style="--pp:${col}"><div class="lining"><div><h4>${esc(c.name)}</h4><p>${esc(REG[c.reg])}</p></div>
        <div><p>${CNAME[k]==='Not listed'?'Cover colour not listed by Passport Index.':`One of ${colCount(k)} ${CNAME[k].toLowerCase()} passports.`}</p><p>Opens ${c.ms} destinations without a prior visa.</p></div></div></div></div>
   </div></div>`;
}
/* where a slot sits for a (possibly fractional) offset k from the centre */
export function tf(k){
  const a=Math.abs(k), s=Math.sign(k)||0, o=vIsOpen?1:0;
  const x=s*(a<=1?1.02*a:1.02+.6*(a-1))+s*o*.62*Math.min(a,1);
  const z=-Math.min(a,3.4)*210, ry=-s*(Math.min(a,1)*42+Math.max(0,a-1)*9), sc=1-Math.min(a,2.6)*.13;
  let op=a<=1?1-.18*a:a<=2?.82-.44*(a-1):Math.max(0,.38-.38*(a-2)); if(o&&a>.01) op*=.3;
  const br=1-.45*Math.min(a,1)-.2*Math.max(0,Math.min(a-1,1)), lift=a<.5?-(.5-a)*16:0;
  return {t:`translateX(calc(var(--w) * ${x.toFixed(4)})) translateY(${lift.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`,op,br,zi:100-Math.round(a*10)};
}
export function place(el,k){ el._k=k; const p=tf(k); el.style.transform=p.t; el.style.opacity=p.op.toFixed(3); el.style.filter=`brightness(${p.br.toFixed(3)})`; el.style.zIndex=p.zi; el.style.pointerEvents=p.op<.05?'none':''; }
export function setContent(el,center){
  if(el._center===center) return; el._center=center; const c=C[vList[el._idx]];
  el.innerHTML=center?centerHTML(c):sideHTML(c); el.setAttribute('aria-hidden',center?'false':'true');
  if(center){ wireBook(); el.querySelectorAll('.pp').forEach(p=>{p.classList.remove('shine'); void p.offsetWidth; setTimeout(()=>p.classList.add('shine'),260);}); }
}
export function layoutFlow(mode){
  const len=vList.length, r=Math.min(3,Math.floor((len-1)/2)), want=new Map();
  for(let k=-r;k<=r;k++) want.set(((vIdx+k)%len+len)%len,k);
  flow.classList.toggle('instant',mode==='instant'); flow.classList.toggle('opened',vIsOpen); flow.classList.remove('scrub');
  slots.forEach((el,idx)=>{ if(!want.has(idx)){ slots.delete(idx); const s=Math.sign(el._k)||1; place(el,s*(r+1.4)); el.style.pointerEvents='none'; setTimeout(()=>el.remove(),750); }});
  want.forEach((k,idx)=>{
    let el=slots.get(idx);
    if(!el){ el=document.createElement('div'); el.className='slot'; el._idx=idx; el._center=null; flow.appendChild(el); slots.set(idx,el);
      el.addEventListener('click',()=>{ if(flow._dragged) return; if(el._k!==0) step(Math.round(el._k)); });
      setContent(el,k===0);
      el.style.transition='none';
      if(mode==='deal'){ place(el,0); el.style.opacity=0; el.style.transform+=' scale(.75)'; }
      else place(el,(Math.sign(k)||1)*(r+1.4));
      void el.offsetWidth; el.style.transition='';
      if(mode==='deal') el.style.transitionDelay=(reduce?0:Math.abs(k)*70+60)+'ms';
    } else { el.style.transitionDelay=''; setContent(el,k===0); }
    place(el,k);
  });
  if(mode==='deal') setTimeout(()=>slots.forEach(el=>el.style.transitionDelay=''),900);
}
export function renderFoot(anim){
  const c=C[vList[vIdx]], k=ckey(c), n=vList.length; showScene(c); [1,-1,2].forEach(d=>preloadPhoto(C[vList[((vIdx+d)%n+n)%n]].code));
  vfoot.innerHTML=`<div><h3>${esc(c.name)}</h3><div class="meta">${CNAME[k]} cover, ${esc(REG[c.reg])}, ranked ${ord(c.rank)}</div></div>
   <div class="vprog" aria-hidden="true"><span>${vIdx+1} / ${n}</span><div class="vtrack"><i style="left:${(n>1?vIdx/(n-1):0)*100}%"></i></div></div>
   <div class="ms"><b>${c.ms}</b><span>Mobility Score</span></div>`;
  if(anim){ vfoot.classList.remove('fx'); void vfoot.offsetWidth; vfoot.classList.add('fx'); }
  vopenBtn.textContent=vIsOpen?'Close passport':'Open passport';
  document.getElementById('vlive').textContent=`${c.name}, ${vIdx+1} of ${n}, Mobility Score ${c.ms}`;
}
export function openViewer(i,list,trigger){
  vList=list&&list.length?list:C.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>c.i);
  vIdx=Math.max(0,vList.indexOf(i)); vTrigger=trigger||document.activeElement; vIsOpen=false;
  viewer.hidden=false; document.body.style.overflow='hidden';
  vbook.innerHTML='<div class="flow" id="flow"></div>'; flow=document.getElementById('flow'); slots=new Map(); wireFlow();
  layoutFlow('deal'); renderFoot(true); sfx('swish'); document.getElementById('vclose').focus();
}
export function closeViewer(){ viewer.hidden=true; document.body.style.overflow=''; if(vTrigger&&vTrigger.focus) vTrigger.focus(); }
export function setOpen(v){ if(v===vIsOpen) return; sfx('flip'); vIsOpen=v; const b=document.getElementById('book'); if(b) b.classList.toggle('open',v); vopenBtn.textContent=v?'Close passport':'Open passport'; layoutFlow('snap'); }
export function step(n){
  if(!n||busy) return;
  if(vIsOpen){ setOpen(false); busy=true; setTimeout(()=>{busy=false; step(n);},reduce?0:430); return; }
  sfx('swish'); vIdx=((vIdx+n)%vList.length+vList.length)%vList.length; layoutFlow('step'); renderFoot(true);
}
export function wireBook(){
  const book=document.getElementById('book'), tilt=document.getElementById('tilt'); let d=null, rx=0, ry=0;
  book.addEventListener('pointerdown',e=>{ if(e.target.closest('.go,.stamp')) return; e.preventDefault(); e.stopPropagation(); d={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t:performance.now(),m:0}; book.setPointerCapture(e.pointerId); tilt.classList.add('dragging'); book.style.cursor='grabbing';});
  book.addEventListener('pointermove',e=>{ if(!d) return; const dx=e.clientX-d.x, dy=e.clientY-d.y; d.x=e.clientX; d.y=e.clientY; d.m+=Math.abs(dx)+Math.abs(dy);
    const lim=vIsOpen?30:75; ry=Math.max(-lim,Math.min(lim,ry+dx*.5)); rx=Math.max(-28,Math.min(28,rx-dy*.35)); tilt.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`;});
  const end=e=>{ if(!d) return; const click=d.m<6, tx=d.x-d.x0, ty=d.y-d.y0, v=Math.abs(tx)/Math.max(1,performance.now()-d.t); d=null;
    tilt.classList.remove('dragging'); book.style.cursor=''; rx=ry=0; tilt.style.transform='';
    if(click) setOpen(!vIsOpen); else if(!vIsOpen&&Math.abs(tx)>70&&Math.abs(tx)>Math.abs(ty)*1.4&&v>.45) step(tx<0?1:-1); };
  book.addEventListener('pointerup',end); book.addEventListener('pointercancel',end);
  book.addEventListener('click',e=>e.stopPropagation());
  book.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault(); setOpen(!vIsOpen);}});
  book.querySelector('.go').addEventListener('click',e=>{e.stopPropagation(); goMap(+e.currentTarget.dataset.map);});
  const st=book.querySelector('.stamp');
  if(st) st.addEventListener('click',e=>{ e.stopPropagation(); const on=toggleStamp(st.dataset.code); st.textContent=on?'Stamped':'Collect stamp'; st.setAttribute('aria-pressed',String(on)); sfx(on?'stamp':'tap'); });
}
/* drag anywhere else on the stage to scrub through the carousel */
export function wireFlow(){
  const stage=viewer.querySelector('.vstage'); let s=null;
  stage.onpointerdown=e=>{ if(e.target.closest('#book,.vnav')) return; s={x0:e.clientX,x:e.clientX,t:performance.now(),w:(flow.querySelector('.slot')||{}).offsetWidth||300}; flow._dragged=false; stage.setPointerCapture(e.pointerId); };
  stage.onpointermove=e=>{ if(!s) return; s.x=e.clientX; const dx=s.x-s.x0; if(Math.abs(dx)>6){ flow._dragged=true; if(vIsOpen) return; flow.classList.add('scrub');
      const f=dx/(s.w*1.02); slots.forEach(el=>{ const base=el._base??el._k; el._base=base; const p=tf(base+f); el.style.transform=p.t; el.style.opacity=p.op; el.style.filter=`brightness(${p.br})`; el.style.zIndex=p.zi; }); } };
  stage.onpointerup=stage.onpointercancel=e=>{ if(!s) return; const dx=s.x-s.x0, v=dx/Math.max(1,performance.now()-s.t), w=s.w*1.02; s=null;
    slots.forEach(el=>{ if(el._base!=null){ el._k=el._base; el._base=null; } });
    if(!flow._dragged){ if(e.target===stage||e.target===flow) return; }
    let n=-Math.round(dx/w); if(!n&&Math.abs(v)>.5&&Math.abs(dx)>30) n=dx<0?1:-1; n=Math.max(-3,Math.min(3,n));
    if(n) step(n); else layoutFlow('snap'); setTimeout(()=>flow._dragged=false,0); };
  let wl=0; stage.onwheel=e=>{ if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<18) return; e.preventDefault(); const now=performance.now(); if(now-wl<380) return; wl=now; step(e.deltaX>0?1:-1); };
}
export function goMap(i){ closeViewer(); setView('map'); select(i); scrollTo({top:0,behavior:reduce?'auto':'smooth'}); }
document.getElementById('vclose').addEventListener('click',closeViewer);
viewer.querySelector('.prev').addEventListener('click',()=>step(-1));
viewer.querySelector('.next').addEventListener('click',()=>step(1));
vopenBtn.addEventListener('click',()=>setOpen(!vIsOpen));
document.getElementById('vmap').addEventListener('click',()=>goMap(vList[vIdx]));
addEventListener('keydown',e=>{ if(viewer.hidden||!document.getElementById('cmdk').hidden||(document.getElementById('modal')&&!document.getElementById('modal').hidden)) return;
  if(e.key==='Escape') closeViewer(); else if(e.key==='ArrowRight') step(1); else if(e.key==='ArrowLeft') step(-1);
  else if(e.key==='Home') step(-vIdx); else if(e.key==='End') step(vList.length-1-vIdx);
  else if(e.key===' '&&!/button/i.test(document.activeElement.tagName)){e.preventDefault(); setOpen(!vIsOpen);} });
