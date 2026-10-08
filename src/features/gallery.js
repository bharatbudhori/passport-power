import { C, REG } from '../core/data.js';
import { hasStamp } from '../core/wallet.js';
import { esc, reduce } from '../core/utils.js';
import { CNAME, SHADES, ckey, coverHTML } from './covers.js';
import { openViewer } from './viewer.js';

/* ---------- gallery ---------- */
export const g={tab:'explore',group:'az',colour:'all',q:''}; let gOrder=[];
export const gbar=document.getElementById('gbar'), gbody=document.getElementById('gbody');
export const colCount=k=>C.filter(c=>ckey(c)===k).length;
export function renderGBar(){
  const grp=g.tab==='explore'?[['az','All'],['region','Region'],['colour','Colour']].map(([k,l])=>`<button class="gchip" data-group="${k}" aria-pressed="${g.group===k}">${l}</button>`).join('')+'<span class="gsep"></span>':'';
  const cols=['all','red','blue','green','black'].map(k=>`<button class="gchip" data-colour="${k}" aria-pressed="${g.colour===k}">${k==='all'?'Any colour':`<span class="sw" style="background:${SHADES[k][1]}"></span>${CNAME[k]}<span class="n">${colCount(k)}</span>`}</button>`).join('');
  gbar.innerHTML=`${grp}${cols}<label class="gsearch"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="gq" placeholder="Find a passport" value="${esc(g.q)}" aria-label="Find a passport"></label>`;
  document.getElementById('gq').addEventListener('input',e=>{g.q=e.target.value; renderGBody();});
}
export function renderGBody(){
  const q=g.q.trim().toLowerCase();
  const L=C.filter(c=>(g.colour==='all'||ckey(c)===g.colour)&&(!q||c.name.toLowerCase().includes(q)||c.code.toLowerCase()===q));
  const byName=(a,b)=>a.name.localeCompare(b.name);
  let groups=[];
  if(g.tab==='rank'){
    const S=L.slice().sort((a,b)=>a.rank-b.rank||byName(a,b)); const m=new Map();
    S.forEach(c=>{const t=Math.floor((c.rank-1)/10); if(!m.has(t)) m.set(t,[]); m.get(t).push(c);});
    groups=[...m].map(([t,l])=>[`Ranks ${t*10+1} to ${t*10+10}`,l]);
  } else if(g.group==='region') groups=REG.map((r,ri)=>[r,L.filter(c=>c.reg===ri).sort(byName)]);
  else if(g.group==='colour') groups=['red','blue','green','black','none'].map(k=>[CNAME[k]+' covers',L.filter(c=>ckey(c)===k).sort(byName)]);
  else {const m=new Map(); L.slice().sort(byName).forEach(c=>{const ch=c.name.normalize('NFD')[0].toUpperCase(); if(!m.has(ch)) m.set(ch,[]); m.get(ch).push(c);}); groups=[...m];}
  groups=groups.filter(([,l])=>l.length);
  gOrder=groups.flatMap(([,l])=>l.map(c=>c.i));
  gbody.innerHTML=groups.length?groups.map(([h,l])=>`<div class="ghead">${esc(h)} <span>(${l.length})</span></div><div class="ggrid">${l.map(c=>`<button class="gcard" data-i="${c.i}" aria-label="${esc(c.name)} passport, mobility score ${c.ms}${hasStamp(c.code)?', stamped':''}">${coverHTML(c,{rank:g.tab==='rank'})}<div class="gcap"><b>${esc(c.name)}</b>${hasStamp(c.code)?'<i class="gstamp">Stamped</i>':''}<span>${c.ms}</span></div></button>`).join('')}</div>`).join('')
    :`<p class="gempty">No passport matches “${esc(g.q)}”. Try another name or clear the colour filter.</p>`;
}
export function renderGallery(){ renderGBar(); renderGBody(); }
gbar.addEventListener('click',e=>{const b=e.target.closest('.gchip'); if(!b) return; if(b.dataset.group) g.group=b.dataset.group; if(b.dataset.colour) g.colour=b.dataset.colour; renderGallery();});
document.querySelectorAll('[data-gtab]').forEach(b=>b.addEventListener('click',()=>{g.tab=b.dataset.gtab; document.querySelectorAll('[data-gtab]').forEach(x=>x.setAttribute('aria-selected',x===b)); renderGallery();}));
gbody.addEventListener('click',e=>{const b=e.target.closest('.gcard'); if(b) openViewer(+b.dataset.i,gOrder,b);});
export let tiltCard=null;
export function untilt(){ if(tiltCard){tiltCard.style.transform=''; tiltCard=null;} }
gbody.addEventListener('pointermove',e=>{ if(reduce||e.pointerType==='touch') return;
  const card=e.target.closest('.gcard'); const pp=card&&card.querySelector('.pp'); if(pp!==tiltCard) untilt(); if(!pp) return; tiltCard=pp;
  const r=pp.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
  pp.style.transform=`rotateY(${(x-.5)*22}deg) rotateX(${(.5-y)*18}deg) translateZ(14px)`;
  pp.style.setProperty('--mx',x*100+'%'); pp.style.setProperty('--my',y*100+'%'); pp.style.setProperty('--sx',(100-x*100)+'%');});
gbody.addEventListener('pointerleave',untilt);
