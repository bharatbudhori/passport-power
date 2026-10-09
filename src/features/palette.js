import { C, N, byCode } from '../core/data.js';
import { state, verdictFor } from '../core/state.js';
import { dotFor, esc, reduce } from '../core/utils.js';
import { flyTo, paintRing, startSpin, stopSpin } from './chart.js';
import { select, setSort } from './controls.js';
import { renderDetail } from './detail.js';
import { setSfx, sfx } from './sound.js';
import { PRESETS, applyTheme, custom, themeId } from './themes.js';
import { openAlbum, openDuel, openQuiz } from './play.js';
import { applyConvert, focusFx } from './fx.js';
import { setDest } from './trip.js';
import { openViewer } from './viewer.js';
import { setView } from './views.js';

/* ---------- command palette (⌘K / Ctrl+K) ---------- */
export const isMac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent);
document.getElementById('cmdk-key').textContent=isMac?'⌘':'Ctrl';
export const pal=document.getElementById('cmdk'), pin=document.getElementById('cmdk-in'), plist=document.getElementById('cmdk-list');
export const ALIAS={usa:'US',us:'US',america:'US','united states':'US',uk:'GB',britain:'GB','great britain':'GB',england:'GB',uae:'AE',emirates:'AE',
  korea:'KR','south korea':'KR','north korea':'KP',russia:'RU',czech:'CZ','czech republic':'CZ',turkey:'TR',turkiye:'TR',holland:'NL',vietnam:'VN',
  'ivory coast':'CI',drc:'CD',burma:'MM',swaziland:'SZ','hong kong':'HK',macao:'MO',macau:'MO',taiwan:'TW',palestine:'PS',vatican:'VA'};
export const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
export function findCountry(s){
  s=norm(s); if(!s) return null;
  if(ALIAS[s]) return byCode.get(ALIAS[s]);
  if(s.length===2&&byCode.get(s.toUpperCase())) return byCode.get(s.toUpperCase());
  return C.find(c=>norm(c.name)===s)||C.find(c=>norm(c.name).startsWith(s))||(s.length>2?C.find(c=>norm(c.name).includes(s)):null)||null;
}
export function score(label,q){ const l=norm(label); q=norm(q); if(!q) return 1; const i=l.indexOf(q); if(i>=0) return 200-i-(l.length-q.length)*.1+(i===0?50:0);
  let j=0,gaps=0,last=-1; for(let k=0;k<l.length&&j<q.length;k++){ if(l[k]===q[j]){ if(last>=0) gaps+=k-last-1; last=k; j++; } } return j===q.length?80-gaps:-1; }
export function hl(label,q){ const l=norm(label), n=norm(q), i=n?l.indexOf(n):-1; return i<0?esc(label):esc(label.slice(0,i))+'<mark>'+esc(label.slice(i,i+n.length))+'</mark>'+esc(label.slice(i+n.length)); }
export function splitPair(rest){
  const seps=[' vs ',' and ',' with ',' to ',' -> ',',',' / '];
  for(const s of seps){ const k=norm(rest).indexOf(s.trim()===','?',':s); if(k>0){ const a=findCountry(rest.slice(0,k)), b=findCountry(rest.slice(k+s.length)); if(a&&b) return [a,b]; } }
  const w=rest.trim().split(/\s+/); for(let k=1;k<w.length;k++){ const a=findCountry(w.slice(0,k).join(' ')), b=findCountry(w.slice(k).join(' ')); if(a&&b) return [a,b]; }
  return null;
}
export const ICON={go:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  book:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/></svg>',
  cmp:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v18M16 3v18M3 8h5M16 16h5"/></svg>',
  trip:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  act:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3 4 14h7l-1 7 9-11h-7z"/></svg>',
  fx:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h11M15 4l3 3-3 3M17 17H6M9 20l-3-3 3-3"/></svg>'};
export const scrollTopSmooth=()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'});
export function doCompare(a,b){ setView('map'); if(state.sel!==a.i) select(a.i); state.dtab='cmp'; state.cmp=b.i; renderDetail(); paintRing();
  setTimeout(()=>document.getElementById('detail').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}),150); }
export function doTrip(a,b){ setView('map'); if(state.sel!==a.i) select(a.i); setDest(b.i); scrollTopSmooth(); }
export function setMode(m){ setView('map'); document.querySelector(`[data-mode="${m}"]`).click(); }
export const ACTIONS=[
  ['Go to visa map','map globe ring',()=>{setView('map');}],
  ['Browse passport covers','passports gallery covers',()=>{setView('gallery'); scrollTopSmooth();}],
  ['Show where a passport can go','mode outbound where',()=>setMode('out')],
  ['Show who can come in','mode inbound welcome who',()=>setMode('in')],
  ['Spin the globe','spin rotate',()=>{setView('map'); startSpin();}],
  ['Stop spinning','stop spin',()=>stopSpin()],
  ['Recenter the globe','recenter center',()=>{setView('map'); const s=C[state.sel]; flyTo(s.lng,s.lat);}],
  ['Sort by Mobility Score','sort mobility ms',()=>setSort('ms')],
  ['Sort by visa-free','sort visa free vf',()=>setSort('vf')],
  ['Sort by Welcoming Score','sort welcoming ws',()=>setSort('ws')],
  ['Group countries by region','group region toggle',()=>{const g=document.getElementById('grp'); g.checked=!g.checked; g.dispatchEvent(new Event('change'));}],
  ['Surprise me with a random passport','random surprise shuffle',()=>{setView('map'); select(C[Math.floor(Math.random()*N)].i);}],
  ['Open the selected passport','open view passport cover',()=>openViewer(state.sel)],
  ['Turn sound and haptics on','sound on audio haptics',()=>setSfx(true)],
  ['Turn sound and haptics off','sound off mute quiet',()=>setSfx(false)],
  ['Open theme menu','theme palette colors colours',()=>{setTimeout(()=>document.getElementById('theme').click(),0);}],
  ['Open the stamp album','stamps album collection',()=>openAlbum()],
  ['Play the passport quiz','quiz play game',()=>openQuiz()],
  ['Duel two passports','duel versus battle',()=>openDuel()],
  ['Convert currency','money forex exchange rate convert',()=>focusFx()],
];
export let pItems=[], pAct=0;
export function build(q){
  const raw=q.trim(), n=norm(raw), out=[];
  const m=n.match(/^(compare|vs|cmp)\s+(.+)/);
  if(m){ const p=splitPair(raw.slice(raw.toLowerCase().indexOf(m[2]))); if(p) out.push({sec:'Compare',icon:ICON.cmp,label:`Compare ${p[0].name} with ${p[1].name}`,hint:`${p[0].ms} vs ${p[1].ms}`,run:()=>doCompare(p[0],p[1])});
    else out.push({sec:'Compare',icon:ICON.cmp,label:'Type two countries, like “compare India Germany”',hint:'',run:null}); }
  const tm=n.match(/^(theme|t)\s*(.*)$/);
  if(tm&&(n.startsWith('theme')||tm[2])){ const tq=tm[2]; const list=PRESETS.map(x=>({x,s:score(x.name,tq)})).filter(o=>o.s>0).sort((a,b)=>b.s-a.s);
    list.forEach(({x})=>out.push({sec:'Themes',sw:x.sw||[x.p.bg,x.p.card,x.p.vf],label:`Theme: ${x.name}`,hlq:tq,hint:themeId===x.id?'Current':'',run:()=>applyTheme(x.id)}));
    if(custom) out.push({sec:'Themes',sw:[custom.bg,custom.card,custom.vf],label:'Theme: Custom',hint:themeId==='custom'?'Current':'',run:()=>applyTheme('custom')}); }
  const trip=raw.match(/^(?:check\s+|trip\s+)?(.+?)\s+(?:to|->|→)\s+(.+)$/i);
  if(trip&&!m){ const a=findCountry(trip[1]), b=findCountry(trip[2]); if(a&&b){ const v=verdictFor(a.i,b.i); out.push({sec:'Trip check',icon:ICON.trip,label:`${a.name} passport to ${b.name}`,hint:v.t,dot:v.k,run:()=>doTrip(a,b)}); } }
  const who=n.match(/^who can (?:enter|visit|go to)\s+(.+)/); if(who){ const c=findCountry(who[1]); if(c) out.push({sec:'Explore',icon:ICON.go,label:`Who can enter ${c.name}`,hint:`${c.ws} passports welcome`,run:()=>{select(c.i); setMode('in'); scrollTopSmooth();}}); }
  const fxm=raw.match(/^(?:convert\s+)?(\d[\d,]*(?:\.\d+)?)?\s*([a-z]{3})\s+(?:to|in|into)\s+([a-z]{3})$/i);
  if(fxm){ const amt=fxm[1]?Number(fxm[1].replace(/,/g,'')):null, a=fxm[2].toUpperCase(), b=fxm[3].toUpperCase();
    out.push({sec:'Money',icon:ICON.fx,label:amt!=null&&amt>=0?`Convert ${new Intl.NumberFormat('en').format(amt)} ${a} to ${b}`:`Convert ${a} to ${b}`,hint:'Live mid-market rate',run:()=>applyConvert(a,b,amt)}); }
  if(!m&&!tm&&!who){
    const cs=C.map(c=>({c,s:Math.max(score(c.name,raw),norm(c.code)===n?300:-1)})).filter(o=>o.s>0).sort((a,b)=>b.s-a.s||b.c.ms-a.c.ms).slice(0,raw?6:0);
    cs.forEach(({c},k)=>{ out.push({sec:'Passports',icon:ICON.go,label:c.name,hlq:raw,hint:`Rank ${c.rank}, MS ${c.ms}`,run:()=>{setView('map'); select(c.i); scrollTopSmooth();}});
      if(k===0) out.push({sec:'Passports',icon:ICON.book,label:`Open the ${c.name} passport`,hint:'3D viewer',run:()=>openViewer(c.i)}); });
    if(raw&&!trip){ const sel=C[state.sel]; const c=cs[0]&&cs[0].c; if(c&&c.i!==state.sel){ const v=verdictFor(state.sel,c.i); out.push({sec:'Trip check',icon:ICON.trip,label:`${sel.name} passport to ${c.name}`,hint:v.t,dot:v.k,run:()=>doTrip(sel,c)}); } }
    ACTIONS.map(([l,k,run])=>({l,run,s:raw?Math.max(score(l,raw),score(k,raw)-20):1})).filter(o=>o.s>0).sort((a,b)=>b.s-a.s).slice(0,raw?5:ACTIONS.length)
      .forEach(o=>out.push({sec:'Actions',icon:ICON.act,label:o.l,hlq:raw,hint:'',run:o.run}));
    if(raw) PRESETS.map(x=>({x,s:score(x.name,raw)})).filter(o=>o.s>100).slice(0,3).forEach(({x})=>out.push({sec:'Themes',sw:x.sw||[x.p.bg,x.p.card,x.p.vf],label:`Theme: ${x.name}`,hlq:raw,hint:'',run:()=>applyTheme(x.id)}));
  }
  return out;
}
export function renderPal(){
  pItems=build(pin.value); pAct=Math.min(pAct,Math.max(0,pItems.length-1)); while(pItems[pAct]&&!pItems[pAct].run&&pAct<pItems.length-1) pAct++;
  let sec='', html='';
  if(!pin.value.trim()) html+=`<div class="ck-tips">Try <button data-try="Japan">Japan</button><button data-try="compare India Germany">compare India Germany</button><button data-try="India to Thailand">India to Thailand</button><button data-try="100 USD to EUR">100 USD to EUR</button><button data-try="theme nord">theme nord</button></div>`;
  pItems.forEach((it,k)=>{ if(it.sec!==sec){ sec=it.sec; html+=`<div class="ck-sec" role="presentation">${sec}</div>`; }
    const lead=it.sw?`<span class="sws ck-sw" aria-hidden="true"><i style="background:${it.sw[0]};left:0"></i><i style="background:${it.sw[1]};left:9px"></i><i style="background:${it.sw[2]};left:18px"></i></span>`:`<span class="ck-ic" aria-hidden="true">${it.icon||''}</span>`;
    html+=`<div class="ck-item${it.run?'':' dis'}" role="option" id="ck-o${k}" data-k="${k}" aria-selected="${k===pAct}">${lead}<span class="ck-l">${it.hlq!=null?hl(it.label,it.hlq):esc(it.label)}</span>${it.hint?`<span class="ck-h">${it.dot?dotFor(it.dot):''}${esc(it.hint)}</span>`:''}</div>`; });
  if(!pItems.length) html+=`<p class="ck-empty">No match for “${esc(pin.value)}”. Try a country name, “compare A B”, “A to B” or “theme …”.</p>`;
  plist.innerHTML=html; pin.setAttribute('aria-activedescendant',pItems.length?'ck-o'+pAct:'');
  const a=plist.querySelector('[aria-selected="true"]'); if(a) a.scrollIntoView({block:'nearest'});
}
export let palReturn=null;
export function openPal(){ palReturn=document.activeElement; pal.hidden=false; pin.value=''; pAct=0; renderPal(); pin.focus(); sfx('open'); }
export function closePal(){ pal.hidden=true; if(palReturn&&palReturn.focus) palReturn.focus(); }
export function runPal(k){ const it=pItems[k]; if(!it||!it.run) return; closePal(); it.run(); }
pin.addEventListener('input',()=>{pAct=0; renderPal();});
pin.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); const d=e.key==='ArrowDown'?1:-1; let k=pAct; do{ k=(k+d+pItems.length)%pItems.length; }while(pItems[k]&&!pItems[k].run&&k!==pAct); pAct=k; renderPal(); }
  else if(e.key==='Enter'){ e.preventDefault(); runPal(pAct); }
  else if(e.key==='Escape'){ e.preventDefault(); closePal(); }
  else if(e.key==='Tab'){ e.preventDefault(); }
});
plist.addEventListener('mousemove',e=>{const o=e.target.closest('.ck-item'); if(o&&+o.dataset.k!==pAct&&pItems[+o.dataset.k].run){pAct=+o.dataset.k; plist.querySelectorAll('.ck-item').forEach(x=>x.setAttribute('aria-selected',x===o)); pin.setAttribute('aria-activedescendant',o.id);}});
plist.addEventListener('click',e=>{const t=e.target.closest('[data-try]'); if(t){pin.value=t.dataset.try; pAct=0; renderPal(); pin.focus(); return;} const o=e.target.closest('.ck-item'); if(o) runPal(+o.dataset.k);});
pal.addEventListener('mousedown',e=>{ if(e.target===pal) closePal(); });
document.getElementById('cmdk-btn').addEventListener('click',openPal);
addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); pal.hidden?openPal():closePal(); } });
