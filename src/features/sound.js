
/* ---------- sound & haptics (on by default, synthesized, no files) ---------- */
export let sfxOn=true, actx=null;
try{ if(localStorage.getItem('pp-sfx-set')==='1') sfxOn=localStorage.getItem('pp-sfx')==='1'; }catch{}
export const sfxBtn=document.getElementById('sfx');
export function ctx(){ if(!actx){ const A=window.AudioContext||window.webkitAudioContext; if(!A) return null; actx=new A(); } if(actx.state==='suspended') actx.resume(); return actx; }
export function noiseBuf(a,dur){ const b=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
export function env(a,g,t0,peak,att,dec){ g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(peak,t0+att); g.gain.exponentialRampToValueAtTime(0.0001,t0+att+dec); }
export function noise(a,t0,dur,f0,f1,q,peak){ const s=a.createBufferSource(); s.buffer=noiseBuf(a,dur); const f=a.createBiquadFilter(); f.type='bandpass'; f.Q.value=q;
  f.frequency.setValueAtTime(f0,t0); f.frequency.exponentialRampToValueAtTime(f1,t0+dur); const g=a.createGain(); env(a,g,t0,peak,dur*.25,dur*.75); s.connect(f).connect(g).connect(a.destination); s.start(t0); s.stop(t0+dur+.05); }
export function tone(a,t0,f0,f1,dur,peak,type='sine'){ const o=a.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t0); o.frequency.exponentialRampToValueAtTime(f1,t0+dur); const g=a.createGain(); env(a,g,t0,peak,.006,dur); o.connect(g).connect(a.destination); o.start(t0); o.stop(t0+dur+.05); }
export const buzz=p=>{ try{ if(navigator.vibrate) navigator.vibrate(p); }catch{} };
export function sfx(kind){
  if(!sfxOn) return; const a=ctx(); if(!a) return; const t=a.currentTime+.01;
  if(kind==='flip'){ noise(a,t,.28,900,3800,.9,.22); noise(a,t+.2,.07,2400,1500,2,.12); buzz([6,40,8]); }
  else if(kind==='swish'){ noise(a,t,.16,1600,4200,1.2,.09); }
  else if(kind==='stamp'){ tone(a,t,120,48,.2,.55); noise(a,t,.05,1400,600,1.4,.35); noise(a,t+.03,.12,500,300,.8,.12); buzz(22); }
  else if(kind==='tap'){ tone(a,t,640,520,.07,.09,'triangle'); buzz(8); }
  else if(kind==='deny'){ tone(a,t,190,170,.09,.14,'square'); tone(a,t+.12,160,140,.11,.12,'square'); buzz([12,50,12]); }
  else if(kind==='pop'){ tone(a,t,520,880,.06,.07); }
  else if(kind==='open'){ tone(a,t,420,640,.08,.06,'triangle'); }
}
function paintSfx(){ sfxBtn.setAttribute('aria-pressed',String(sfxOn)); sfxBtn.title=sfxOn?'Sound and haptics on':'Sound and haptics off'; sfxBtn.innerHTML=sfxOn?SPK_ON:SPK_OFF; }
export function setSfx(on){ sfxOn=on; paintSfx(); try{localStorage.setItem('pp-sfx',on?'1':'0'); localStorage.setItem('pp-sfx-set','1');}catch{} if(on){ctx(); sfx('pop');} }
export const SPK_ON='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
export const SPK_OFF='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';
sfxBtn.addEventListener('click',()=>setSfx(!sfxOn));
paintSfx();
