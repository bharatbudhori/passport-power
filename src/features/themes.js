import * as d3 from 'd3';

/* ---------- themes: presets + custom palette ---------- */
export const PRESETS=[
 {id:'system',name:'System',sub:'Matches your device, light or dark',sw:['#f3f1fb','#17143a','#f4a518']},
 {id:'indigo',name:'Indigo Night',sub:'The original: amber on deep indigo',p:{bg:'#17143a',card:'#1f1b48',ink:'#ece9fd',vf:'#f4a518',voa:'#aaa5d0',ev:'#5e5899',ws:'#ff3f82'}},
 {id:'daylight',name:'Daylight',sub:'Soft lavender paper, amber accents',p:{bg:'#f3f1fb',card:'#ffffff',ink:'#1d1946',vf:'#e08a00',voa:'#8b86b8',ev:'#c7c2e4',ws:'#e3245f'}},
 {id:'comfort',name:'Comfort',sub:'Soft black, easy on the eyes',p:{bg:'#16171a',card:'#1f2125',ink:'#e6e7ea',vf:'#f2b04a',voa:'#a3a8b4',ev:'#596072',ws:'#ff6b8a'}},
 {id:'carbon',name:'Carbon',sub:'Pure black for OLED screens',p:{bg:'#000000',card:'#0e0e10',ink:'#f2f2f2',vf:'#ffb020',voa:'#9aa0aa',ev:'#4b5563',ws:'#ff3d71'}},
 {id:'peacock',name:'Peacock',sub:'Deep teal with gold',p:{bg:'#071a1d',card:'#0d272b',ink:'#e8f4f1',vf:'#d9ac2e',voa:'#3fb8a6',ev:'#1f6a66',ws:'#ff5d7a'}},
 {id:'ocean',name:'Midnight Ocean',sub:'Saturated royal blue, sky accents',p:{bg:'#0b1033',card:'#131a4a',ink:'#e7ecff',vf:'#4fc3f7',voa:'#9fb2e8',ev:'#4553a3',ws:'#ff5c8a'}},
 {id:'solarized',name:'Solarized Dark',sub:'Warm developer classic, solar yellow',p:{bg:'#002b36',card:'#073642',ink:'#eee8d5',vf:'#b58900',voa:'#93a1a1',ev:'#268bd2',ws:'#d33682'}},
 {id:'nord',name:'Nord',sub:'Arctic minimal, frost cyan',p:{bg:'#2e3440',card:'#3b4252',ink:'#eceff4',vf:'#88c0d0',voa:'#a3be8c',ev:'#5e81ac',ws:'#bf616a'}},
 {id:'tokyo',name:'Tokyo Night',sub:'Neon city, pink and purple',p:{bg:'#1a1b26',card:'#24283b',ink:'#c0caf5',vf:'#bb9af7',voa:'#7aa2f7',ev:'#414868',ws:'#f7768e'}},
 {id:'dracula',name:'Dracula',sub:'Purple and magenta classic',p:{bg:'#282a36',card:'#343746',ink:'#f8f8f2',vf:'#bd93f9',voa:'#8be9fd',ev:'#6272a4',ws:'#ff79c6'}},
 {id:'paper',name:'Paper',sub:'Warm cream, ink and rust',p:{bg:'#f6f1e7',card:'#fffdf8',ink:'#2b2418',vf:'#c2410c',voa:'#8a7f6a',ev:'#d8cdb6',ws:'#be185d'}},
];
export const CUSTOM_KEYS=[['bg','Background'],['card','Panels'],['ink','Text'],['vf','Visa-free / accent'],['voa','Visa on arrival'],['ev','eVisa / ETA'],['ws','Welcoming Score']];
export const TOKS=['--bg','--bg2','--card','--ink','--muted','--line','--line2','--vf','--voa','--ev','--ws','--req-ink','--land','--ocean-a','--ocean-b','--glow','--self','--track','--arc-vf','--arc-voa','--arc-ev','--arc-req','--title','--shadow','--stars','--on-accent'];
export const mixC=(a,b,t)=>d3.interpolateRgb(a,b)(t);
export const isDark=p=>d3.lab(p.bg).l<50;
export function derive(p){
  const dk=isDark(p), w='#ffffff';
  return {'--bg':p.bg,'--bg2':mixC(p.bg,p.ink,dk?.07:.05),'--card':p.card,'--ink':p.ink,'--muted':mixC(p.ink,p.bg,.42),
    '--line':mixC(p.card,p.ink,.13),'--line2':mixC(p.card,p.ink,.24),'--vf':p.vf,'--voa':p.voa,'--ev':p.ev,'--ws':p.ws,
    '--req-ink':mixC(p.bg,p.ink,dk?.25:.22),'--land':mixC(p.bg,p.ink,dk?.16:.14),
    '--ocean-a':dk?mixC(p.bg,p.ink,.09):mixC(p.bg,w,.7),'--ocean-b':dk?mixC(p.bg,'#000',.3):mixC(p.bg,p.ink,.06),
    '--glow':p.voa,'--self':p.ink,'--track':mixC(p.card,p.ink,.08),
    '--arc-vf':dk?mixC(p.vf,w,.35):p.vf,'--arc-voa':dk?mixC(p.voa,w,.3):mixC(p.voa,p.ink,.3),'--arc-ev':dk?mixC(p.ev,w,.3):mixC(p.ev,p.ink,.35),'--arc-req':p.ws,
    '--title':p.vf,'--shadow':dk?'0 24px 60px -24px #000c':`0 18px 50px -20px color-mix(in srgb,${p.ink} 28%,transparent)`,
    '--stars':dk?'#ffffff2a':'transparent','--on-accent':d3.lab(p.vf).l>62?'#1a1400':'#ffffff'};
}
export const docEl=document.documentElement;
export let themeId='comfort', custom=null;
try{ const t=localStorage.getItem('pp-theme'); themeId={dark:'indigo',light:'daylight'}[t]||t||'comfort'; custom=JSON.parse(localStorage.getItem('pp-custom')||'null'); }catch{}
export const paletteOf=id=>id==='custom'?custom:(PRESETS.find(x=>x.id===id)||{}).p;
export function applyTheme(id){
  const p=paletteOf(id);
  if(!p){ id='system'; TOKS.forEach(k=>docEl.style.removeProperty(k)); docEl.style.colorScheme=''; delete docEl.dataset.theme; }
  else { const t=derive(p); Object.entries(t).forEach(([k,v])=>docEl.style.setProperty(k,v)); const dk=isDark(p); docEl.style.colorScheme=dk?'dark':'light'; docEl.dataset.theme=dk?'dark':'light'; }
  themeId=id; docEl.style.background=''; try{localStorage.setItem('pp-theme',id); if(custom) localStorage.setItem('pp-custom',JSON.stringify(custom));}catch{}
  renderThemeList();
}
export const tbtn=document.getElementById('theme'), tmenu=document.getElementById('tmenu'), tlist=document.getElementById('tlist'), tcust=document.getElementById('tcustom');
export const swatch=c=>`<span class="sws" aria-hidden="true"><i style="background:${c[0]};left:0"></i><i style="background:${c[1]};left:15px"></i><i style="background:${c[2]};left:30px"></i></span>`;
export const check='<svg class="tchk" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
export function renderThemeList(){
  const items=PRESETS.map(x=>({id:x.id,name:x.name,sub:x.sub,sw:x.sw||[x.p.bg,x.p.card,x.p.vf]}));
  if(custom) items.push({id:'custom',name:'Custom',sub:'Your own palette',sw:[custom.bg,custom.card,custom.vf]});
  tlist.innerHTML=items.map(x=>`<button class="titem" role="menuitemradio" aria-checked="${themeId===x.id}" data-theme-id="${x.id}">${swatch(x.sw)}<span><b>${x.name}</b><small>${x.sub}</small></span>${check}</button>`).join('');
}
export function seedCustom(){ if(!custom){ const p=paletteOf(themeId)||PRESETS.find(x=>x.id===(matchMedia('(prefers-color-scheme: dark)').matches?'indigo':'daylight')).p; custom={...p}; } }
export function renderCustom(){
  seedCustom();
  tcust.innerHTML=`<div class="cgrid">${CUSTOM_KEYS.map(([k,l])=>`<label class="cpick"><input type="color" data-ck="${k}" value="${custom[k]}">${l}</label>`).join('')}</div>
    <div class="crow"><span>Start from</span><select id="cbase" aria-label="Start custom palette from a preset"><option value="">Choose a preset</option>${PRESETS.filter(x=>x.p).map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}</select></div>`;
}
tlist.addEventListener('click',e=>{const b=e.target.closest('[data-theme-id]'); if(b) applyTheme(b.dataset.themeId);});
tcust.addEventListener('input',e=>{const k=e.target.dataset.ck; if(!k) return; seedCustom(); custom[k]=e.target.value; applyTheme('custom');});
tcust.addEventListener('change',e=>{ if(e.target.id!=='cbase'||!e.target.value) return; custom={...paletteOf(e.target.value)}; applyTheme('custom'); renderCustom(); });
export const cToggle=document.getElementById('ctoggle');
cToggle.addEventListener('click',()=>{const open=tcust.hidden; tcust.hidden=!open; cToggle.setAttribute('aria-expanded',open); if(open){renderCustom(); if(themeId!=='custom') applyTheme('custom');}});
export function setMenu(open){ tmenu.hidden=!open; tbtn.setAttribute('aria-expanded',open); if(open){renderThemeList(); const c=tlist.querySelector('[aria-checked="true"]'); (c||tlist.firstChild).focus();} }
tbtn.addEventListener('click',e=>{e.stopPropagation(); setMenu(tmenu.hidden);});
export const tmwrap=document.querySelector('.tmwrap');
document.addEventListener('click',e=>{ if(!tmenu.hidden&&!e.composedPath().includes(tmwrap)) setMenu(false); });
addEventListener('keydown',e=>{ if(!tmenu.hidden&&e.key==='Escape'){setMenu(false); tbtn.focus();} });
tlist.addEventListener('keydown',e=>{ const items=[...tlist.querySelectorAll('.titem')], i=items.indexOf(document.activeElement);
  if(e.key==='ArrowDown'){e.preventDefault(); items[Math.min(items.length-1,i+1)].focus();} if(e.key==='ArrowUp'){e.preventDefault(); items[Math.max(0,i-1)].focus();} });
applyTheme(themeId);
