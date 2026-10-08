import { C, byCode } from '../core/data.js';
import { verdictFor } from '../core/state.js';
import { toggleStamp, wallet, watch } from '../core/wallet.js';
import { esc, ord } from '../core/utils.js';
import { coverHTML } from './covers.js';
import { select } from './controls.js';
import { renderGallery } from './gallery.js';
import { sfx } from './sound.js';
import { galleryBuilt, setView } from './views.js';

/* stamp album, quiz, and duel */
const modal=document.createElement('div');
modal.className='modal'; modal.id='modal'; modal.hidden=true;
modal.innerHTML='<div class="msheet" role="dialog" aria-modal="true" aria-labelledby="mtitle"><div id="mbody"></div></div>';
document.body.appendChild(modal);
const mbody=()=>document.getElementById('mbody');
let mode=null, quiz=null, duel=null;

const playBtn=document.getElementById('play-btn'), playMenu=document.getElementById('playmenu');
function setPlayMenu(open){ playMenu.hidden=!open; playBtn.setAttribute('aria-expanded',String(open)); if(open) playMenu.querySelector('button').focus(); }
playBtn.addEventListener('click',e=>{ e.stopPropagation(); setPlayMenu(playMenu.hidden); });
playMenu.addEventListener('click',e=>{
  const b=e.target.closest('[data-play]'); if(!b) return; setPlayMenu(false);
  if(b.dataset.play==='stamps') openAlbum(); else if(b.dataset.play==='quiz') openQuiz(); else openDuel();
});
document.addEventListener('click',e=>{ if(!playMenu.hidden&&!e.target.closest('.playwrap')) setPlayMenu(false); });
addEventListener('keydown',e=>{
  if(!playMenu.hidden&&e.key==='Escape'){ setPlayMenu(false); playBtn.focus(); }
  if(modal.hidden) return;
  if(e.key==='Escape'){ e.preventDefault(); closeModal(); }
  else if(mode==='quiz'&&quiz&&!quiz.locked&&/^[1-4]$/.test(e.key)){ const btns=[...mbody().querySelectorAll('.qchoices button')]; if(btns[+e.key-1]) btns[+e.key-1].click(); }
});
modal.addEventListener('click',e=>{ if(e.target===modal||e.target.closest('.mclose')) closeModal(); });
function closeModal(){ modal.hidden=true; mode=null; playBtn.focus(); }
function openSheet(){ modal.hidden=false; const c=modal.querySelector('.mclose'); if(c) c.focus(); }

function stampDate(at){
  if(!at) return '';
  const d=new Date(at+'T12:00:00');
  return Number.isNaN(d.getTime())?at:d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}
function drawAlbum(){
  const seals=wallet.stamps.map(s=>{
    const c=byCode.get(s.code); if(!c) return '';
    return `<div class="sealwrap"><button type="button" class="seal" data-go="${c.i}"><i aria-hidden="true">${esc(c.code)}</i><small>${esc(c.name)}<br>${esc(stampDate(s.at))}</small></button><button type="button" class="lnk" data-drop="${c.code}">Remove</button></div>`;
  }).join('');
  mbody().innerHTML=`<div class="mhead"><div><h2 id="mtitle">Stamp album</h2><p>${wallet.stamps.length?`${wallet.stamps.length} collected. Choose a stamp to open it on the map.`:'No stamps yet. Open a passport and collect one.'}</p></div><button type="button" class="mclose" aria-label="Close">×</button></div><div class="stamps">${seals}</div>`;
}
export function openAlbum(){ mode='stamps'; drawAlbum(); openSheet(); }
modal.addEventListener('click',e=>{
  const go=e.target.closest('[data-go]'), drop=e.target.closest('[data-drop]');
  if(go){ closeModal(); setView('map'); select(+go.dataset.go); scrollTo({top:0}); }
  if(drop) toggleStamp(drop.dataset.code);
});

const pick=()=>C[Math.floor(Math.random()*C.length)];
function qStronger(){
  let a,b,g=0; do{ a=pick(); b=pick(); g++; }while((a.i===b.i||a.ms===b.ms)&&g<40);
  if(a.ms===b.ms) return null;
  const win=a.ms>b.ms?a:b, lose=win===a?b:a, choices=[a,b].sort(()=>Math.random()-.5);
  return {q:'Which passport opens more destinations without a prior visa?',choices:choices.map(c=>c.name),answer:choices.findIndex(c=>c.i===win.i),why:`${win.name} ranks ${ord(win.rank)} with a Mobility Score of ${win.ms}. ${lose.name} scores ${lose.ms}.`};
}
function qRule(){
  let p,d,g=0; do{ p=pick(); d=pick(); g++; }while(p.i===d.i&&g<20);
  const v=verdictFor(p.i,d.i);
  const choices=['Visa-free','Visa on arrival','eVisa or ETA','Visa required'];
  return {q:`What does a ${p.name} passport need for ${d.name}?`,choices,answer:{vf:0,voa:1,ev:2,req:3,self:0}[v.k],why:`${v.t}. ${v.s}`};
}
function qFree(){
  let dest,good,bad,g=0;
  do{
    dest=pick();
    const pool=C.filter(c=>c.i!==dest.i);
    const vf=pool.filter(c=>verdictFor(c.i,dest.i).k==='vf');
    const req=pool.filter(c=>verdictFor(c.i,dest.i).k==='req');
    if(vf.length&&req.length>=3){ good=vf[Math.floor(Math.random()*vf.length)]; bad=req.sort(()=>Math.random()-.5).slice(0,3); break; }
    g++;
  }while(g<50);
  if(!good) return qStronger();
  const choices=[good,...bad].sort(()=>Math.random()-.5);
  return {q:`Which passport can enter ${dest.name} visa-free?`,choices:choices.map(c=>c.name),answer:choices.findIndex(c=>c.i===good.i),why:`${good.name} can enter ${dest.name} visa-free. The others need a visa first.`};
}
function drawQuiz(){
  const q=quiz.items[quiz.i];
  if(!q){
    mbody().innerHTML=`<div class="mhead"><div><h2 id="mtitle">Quiz</h2><p class="qprogress">${quiz.score} of ${quiz.items.length}</p></div><button type="button" class="mclose" aria-label="Close">×</button></div>
      <p class="qtext">${quiz.score===quiz.items.length?'A clean sweep.':quiz.score>=Math.ceil(quiz.items.length*.6)?'Sharp eye.':'Worth another round.'}</p>
      <p class="qwhy">You got ${quiz.score} of ${quiz.items.length} right.</p>
      <button type="button" class="textbtn qnext" id="qagain">Play again</button>`;
    return;
  }
  mbody().innerHTML=`<div class="mhead"><div><h2 id="mtitle">Quiz</h2><p class="qprogress">${quiz.i+1} of ${quiz.items.length}${quiz.locked?` · ${quiz.score} right`:''}</p></div><button type="button" class="mclose" aria-label="Close">×</button></div>
    <p class="qtext">${esc(q.q)}</p>
    <div class="qchoices">${q.choices.map((c,i)=>`<button type="button" data-a="${i}">${esc(c)}</button>`).join('')}</div>
    <p class="qwhy" aria-live="polite"></p>
    ${quiz.locked?'<button type="button" class="textbtn qnext" id="qnext">Next</button>':''}`;
}
export function openQuiz(){
  quiz={items:[qStronger,qRule,qFree,qStronger,qRule,qFree,qRule].map(fn=>fn()).filter(Boolean),i:0,score:0,locked:false};
  mode='quiz'; drawQuiz(); openSheet();
}
function answerQuiz(i){
  if(!quiz||quiz.locked) return;
  const q=quiz.items[quiz.i]; quiz.locked=true; const ok=i===q.answer; if(ok){ quiz.score++; sfx('pop'); } else sfx('deny');
  drawQuiz();
  mbody().querySelectorAll('.qchoices button').forEach(b=>{
    const n=+b.dataset.a; if(n===q.answer) b.classList.add('good'); else if(n===i) b.classList.add('bad'); b.disabled=true;
  });
  mbody().querySelector('.qwhy').textContent=q.why;
}
modal.addEventListener('click',e=>{
  if(mode!=='quiz') return;
  const a=e.target.closest('[data-a]'); if(a) answerQuiz(+a.dataset.a);
  if(e.target.closest('#qnext')){ quiz.i++; quiz.locked=false; drawQuiz(); }
  if(e.target.closest('#qagain')) openQuiz();
});

const EASE={self:6,vf:5,voa:4,ev:3,req:1};
function randomPair(){
  let a,b,g=0; do{ a=pick(); b=pick(); g++; }while(a.i===b.i&&g<30); return [a,b];
}
function freshDuel(a,b){
  if(!a) [a,b]=randomPair();
  const diffs=[];
  for(const c of C){
    if(c.i===a.i||c.i===b.i) continue;
    if(EASE[verdictFor(a.i,c.i).k]!==EASE[verdictFor(b.i,c.i).k]) diffs.push(c);
  }
  for(let i=diffs.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [diffs[i],diffs[j]]=[diffs[j],diffs[i]]; }
  duel={a,b,rounds:diffs.slice(0,5),ri:-1,score:0,locked:false};
}
function barRow(label,va,vb,max){
  return `<div><span>${label}</span><i title="${duel.a.code} ${va}, ${duel.b.code} ${vb}"><span style="width:${Math.max(4,va/max*50)}%"></span><span class="b" style="left:auto;right:0;width:${Math.max(4,vb/max*50)}%"></span></i><b>${va}–${vb}</b></div>`;
}
function drawDuel(){
  const {a,b}=duel, win=a.ms===b.ms?null:(a.ms>b.ms?a:b);
  const max=Math.max(a.ms,b.ms,1);
  let fight='';
  if(duel.ri>=0&&duel.ri<duel.rounds.length){
    const d=duel.rounds[duel.ri], va=verdictFor(a.i,d.i), vb=verdictFor(b.i,d.i);
    fight=`<p class="qtext">Who has the easier entry to ${esc(d.name)}?</p>
      <div class="qchoices"><button type="button" data-d="0">${esc(a.name)}</button><button type="button" data-d="1">${esc(b.name)}</button><button type="button" data-d="2">Same rule</button></div>
      <p class="qwhy" aria-live="polite"></p>${duel.locked?'<button type="button" class="textbtn qnext" id="dnext">Next</button>':''}`;
    duel._va=va; duel._vb=vb; duel._dest=d;
  } else if(duel.ri>=duel.rounds.length){
    fight=`<p class="winner">${duel.rounds.length?`You called ${duel.score} of ${duel.rounds.length} stops.`:'These two passports follow the same rule almost everywhere.'}</p>`;
  } else if(duel.rounds.length){
    fight=`<button type="button" class="textbtn" id="dfight">Fight over ${duel.rounds.length} destinations</button>`;
  }
  mbody().innerHTML=`<div class="mhead"><div><h2 id="mtitle">Duel</h2><p>${win?esc(win.name)+' has the stronger passport.':'Mobility Score is a tie.'}</p></div><button type="button" class="mclose" aria-label="Close">×</button></div>
    <div class="duel"><div class="duelist">${coverHTML(a)}<b>${esc(a.name)}</b><span>Rank ${ord(a.rank)}</span></div><div class="vs">VS</div><div class="duelist">${coverHTML(b)}<b>${esc(b.name)}</b><span>Rank ${ord(b.rank)}</span></div></div>
    <div class="bars2">${barRow('Mobility',a.ms,b.ms,max)}${barRow('Visa-free',a.vf,b.vf,Math.max(a.vf,b.vf,1))}${barRow('Welcoming',a.ws,b.ws,Math.max(a.ws,b.ws,1))}</div>
    ${fight}
    <div class="duelacts"><button type="button" class="textbtn" id="drandom">Random pair</button><button type="button" class="textbtn" id="dswap">Swap sides</button></div>`;
}
export function openDuel(a,b){ freshDuel(a,b); mode='duel'; drawDuel(); openSheet(); }
function answerDuel(choice){
  if(!duel||duel.locked||duel.ri<0) return;
  const ea=EASE[duel._va.k], eb=EASE[duel._vb.k];
  const answer=ea>eb?0:eb>ea?1:2;
  duel.locked=true; const ok=choice===answer; if(ok){ duel.score++; sfx('pop'); } else sfx('deny');
  drawDuel();
  mbody().querySelectorAll('[data-d]').forEach(b=>{
    const n=+b.dataset.d; if(n===answer) b.classList.add('good'); else if(n===choice) b.classList.add('bad'); b.disabled=true;
  });
  const who=answer===2?'Same rule':answer===0?duel.a.name:duel.b.name;
  mbody().querySelector('.qwhy').textContent=`${who} for ${duel._dest.name}. ${duel.a.name}: ${duel._va.t}. ${duel.b.name}: ${duel._vb.t}.`;
}
modal.addEventListener('click',e=>{
  if(mode!=='duel'||!duel) return;
  const d=e.target.closest('[data-d]'); if(d) answerDuel(+d.dataset.d);
  if(e.target.closest('#dnext')){ duel.ri++; duel.locked=false; drawDuel(); }
  if(e.target.closest('#dfight')){ duel.ri=0; drawDuel(); }
  if(e.target.closest('#drandom')) openDuel();
  if(e.target.closest('#dswap')) openDuel(duel.b,duel.a);
});

function renderIfGallery(){ if(galleryBuilt) renderGallery(); }
watch(()=>{ if(mode==='stamps') drawAlbum(); renderIfGallery(); });

