import * as d3 from 'd3';
import { C, FEAT, N, REG, byCode, maxMS, maxWS } from '../core/data.js';
import { cat, match, sorted, state, verdictFor } from '../core/state.js';
import { dotFor, esc, ord, reduce } from '../core/utils.js';
import { select } from './controls.js';

/* ---------- SVG scaffold ---------- */
export const S=1000, R_LBL=318, R0=334, BAR=118, GR=284, GAP=3;
export const svg=d3.select('#chart').append('svg').attr('viewBox',`0 0 ${S} ${S}`).attr('role','img').attr('aria-label','Ring of passports by strength around a globe');
export const defs=svg.append('defs');
export const og=defs.append('radialGradient').attr('id','ocean').attr('cx','36%').attr('cy','30%').attr('r','80%');
og.append('stop').attr('offset','0%').style('stop-color','var(--ocean-a)');
og.append('stop').attr('offset','100%').style('stop-color','var(--ocean-b)');
export const hg=defs.append('radialGradient').attr('id','halo');
[[0,0],[.86,0],[.9,.32],[1,0]].forEach(([o,a])=>hg.append('stop').attr('offset',o).style('stop-color','var(--glow)').attr('stop-opacity',a));
export const sh=defs.append('radialGradient').attr('id','shade').attr('cx','34%').attr('cy','28%').attr('r','78%');
[[0,0],[.7,0],[1,.38]].forEach(([o,a])=>sh.append('stop').attr('offset',o).attr('stop-color','#0a0820').attr('stop-opacity',a));
export const gf=defs.append('filter').attr('id','glow').attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%');
gf.append('feGaussianBlur').attr('stdDeviation',2.2).attr('result','b');
export const fm=gf.append('feMerge'); fm.append('feMergeNode').attr('in','b'); fm.append('feMergeNode').attr('in','SourceGraphic');

export const root=svg.append('g').attr('transform',`translate(${S/2},${S/2})`);
root.append('circle').attr('r',GR+40).attr('fill','url(#halo)');
root.append('circle').attr('class','deco').attr('r',R_LBL+8);
export const sc=v=>v/maxMS*BAR, scW=v=>v/maxWS*BAR;
[50,100,150].filter(v=>v<maxMS).forEach(v=>{
  root.append('circle').attr('class','scale').attr('r',R0+sc(v));
  root.append('text').attr('class','scale-t').attr('y',-(R0+sc(v))+3).text(v);
});
export const regG=root.append('g');
export const ringG=root.append('g');

export const cg=ringG.selectAll('g.cty').data(C).join('g').attr('class','cty');
cg.append('line').attr('class','track').attr('x1',R0).attr('x2',R0+BAR);
export const barsG=cg.append('g');
barsG.append('line').attr('class','bar b-vf').attr('x1',R0).attr('x2',d=>R0+sc(d.vf));
barsG.append('line').attr('class','bar b-voa').attr('x1',d=>R0+sc(d.vf)).attr('x2',d=>R0+sc(d.vf+d.voa));
barsG.append('line').attr('class','bar b-ev').attr('x1',d=>R0+sc(d.vf+d.voa)).attr('x2',d=>R0+sc(d.ms));
cg.append('circle').attr('class','ws').attr('cx',d=>R0+scW(d.ws)).attr('r',2.2);
cg.append('text').attr('class','code').text(d=>d.code);
cg.append('line').attr('class','hit').attr('x1',R_LBL-14).attr('x2',R0+BAR+6);
cg.on('mouseenter',(e,d)=>setHover(d.i,e)).on('mousemove',e=>moveTip(e)).on('mouseleave',()=>setHover(null)).on('click',(e,d)=>select(d.i));

export let total=N, regionSpans=[];
export function layout(animate){
  regionSpans=[]; let pos=0;
  if(state.group){
    REG.forEach((r,ri)=>{const L=sorted(C.filter(c=>c.reg===ri)); if(!L.length) return; const s=pos; L.forEach(c=>c.slot=pos++); regionSpans.push({ri,s,e:pos}); pos+=GAP;});
  } else sorted(C).forEach(c=>c.slot=pos++);
  total=pos; const off=state.group?GAP/2:0, step=360/total;
  C.forEach(c=>c.a=-90+(c.slot+off+.5)*step);
  const bw=Math.max(1.6,2*Math.PI*R0/total*.56);
  cg.selectAll('line.bar,line.track').attr('stroke-width',bw);
  cg.select('.hit').attr('stroke-width',2*Math.PI*R0/total);
  cg.select('text').each(function(d){const n=((d.a%360)+360)%360, left=n>90&&n<270;
    d3.select(this).attr('transform',`translate(${R_LBL},0)${left?' rotate(180)':''}`).attr('text-anchor',left?'start':'end');});
  cg.transition('lay').duration(animate&&!reduce?900:0).ease(d3.easeCubicInOut)
    .attrTween('transform',function(d){const i=d3.interpolateNumber(d._a??d.a,d.a);return t=>{d._a=i(t); if(d.i===state.sel) renderConnector(); return `rotate(${d._a})`;};});
  drawRegions();
}
export function arcPath(r,a0,a1,rev){
  const p=a=>[r*Math.cos(a*Math.PI/180),r*Math.sin(a*Math.PI/180)], [x0,y0]=p(rev?a1:a0),[x1,y1]=p(rev?a0:a1);
  return `M${x0},${y0}A${r},${r} 0 ${Math.abs(a1-a0)>180?1:0} ${rev?0:1} ${x1},${y1}`;
}
export function drawRegions(){
  regG.selectAll('*').remove(); if(!state.group) return;
  const off=GAP/2, step=360/total, ra=R0+BAR+14;
  regionSpans.forEach(sp=>{
    const a0=-90+(sp.s+off)*step, a1=-90+(sp.e+off)*step, mid=((a0+a1)/2+360)%360, rev=mid>0&&mid<180;
    regG.append('path').attr('class','rg-arc').attr('data-r',sp.ri).attr('d',arcPath(ra,a0+.4,a1-.4,false));
    regG.append('path').attr('id','rg'+sp.ri).attr('fill','none').attr('d',arcPath(rev?ra+17:ra+7,a0,a1,rev));
    regG.append('text').attr('class','rg-lbl').attr('data-r',sp.ri).append('textPath').attr('href','#rg'+sp.ri).attr('startOffset','50%').attr('text-anchor','middle').text(REG[sp.ri]);
  });
  paintRegions();
}
export function paintRegions(){ const r=C[state.sel].reg; regG.selectAll('[data-r]').classed('on',function(){return +this.dataset.r===r;}); }

/* ---------- globe ---------- */
export const proj=d3.geoOrthographic().scale(GR).translate([0,0]).clipAngle(90).precision(.4);
export const path=d3.geoPath(proj);
export const gG=root.append('g').attr('class','globe');
export const ocean=gG.append('path').datum({type:'Sphere'}).attr('class','ocean').attr('fill','url(#ocean)');
export const grat=gG.append('path').datum(d3.geoGraticule10()).attr('class','grat');
export const landSel=gG.append('g').selectAll('path').data(FEAT).join('path').attr('class','land')
  .on('mouseenter',(e,f)=>{const c=byCode.get(f.code); if(c) setHover(c.i,e);})
  .on('mousemove',e=>moveTip(e)).on('mouseleave',()=>setHover(null))
  .on('click',(e,f)=>{const c=byCode.get(f.code); if(c&&!dragged) select(c.i);});
gG.append('circle').attr('r',GR).attr('fill','url(#shade)').style('pointer-events','none');
export const dotG=gG.append('g'), arcG=gG.append('g').attr('class','arcs');
export const markG=gG.append('g').style('pointer-events','none');
export const pulse=markG.append('circle').attr('class','pulse').attr('r',4);
export const origin=markG.append('circle').attr('class','origin').attr('r',5);
export const pingRing=markG.append('circle').attr('class','pingring').attr('r',5).style('display','none');
export const pingDot=markG.append('circle').attr('class','ping').attr('r',4).style('display','none');
export const connector=root.append('line').attr('class','connector').style('pointer-events','none');

export let dragged=false;
gG.call(d3.drag()
  .on('start',()=>{dragged=false; svg.interrupt('fly');})
  .on('drag',e=>{dragged=true; const r=proj.rotate(), k=70/GR; proj.rotate([r[0]+e.dx*k,Math.max(-85,Math.min(85,r[1]-e.dy*k)),0]); renderGlobe();})
  .on('end',()=>setTimeout(()=>dragged=false,0)));

export const center=()=>{const r=proj.rotate(); return [-r[0],-r[1]];};
export const visible=(lng,lat)=>d3.geoDistance([lng,lat],center())<Math.PI/2-.02;
export const RAD=Math.PI/180;
export function arcD(a,b){
  const dist=d3.geoDistance(a,b); if(!dist) return null;
  const ip=d3.geoInterpolate(a,b), rot=d3.geoRotation(proj.rotate()), h=Math.min(.075,dist*.045), n=Math.max(10,Math.ceil(dist*16));
  let s='',pen=false;
  for(let k=0;k<=n;k++){
    const t=k/n, [l,p]=rot(ip(t)), L=l*RAD, P=p*RAD, cp=Math.cos(P), r=GR*(1+h*Math.sin(Math.PI*t));
    const x=cp*Math.sin(L)*r, y=-Math.sin(P)*r, z=cp*Math.cos(L);
    if(z>0||Math.hypot(x,y)>GR+.5){s+=(pen?'L':'M')+x.toFixed(1)+','+y.toFixed(1); pen=true;} else pen=false;
  }
  return s||null;
}
export function paintGlobe(){
  landSel.attr('class',f=>{const c=byCode.get(f.code); return 'land '+(c?cat(c.i):'none')+(c&&c.i===state.dest?' pk':'');});
  const pts=C.filter(c=>{const k=cat(c.i); return k!=='self'&&(k!=='req'||state.layers.req);});
  dotG.selectAll('circle').data(pts,d=>d.code).join('circle').attr('class',d=>'gdot '+cat(d.i)).attr('r',1.9);
  const arcs=pts.filter(c=>state.layers[cat(c.i)]);
  arcG.selectAll('path').data(arcs,d=>d.code).join('path').attr('pathLength',1)
    .attr('class',d=>'arc '+cat(d.i)+(d.i===state.dest?' hot':'')).style('--d',(d,i)=>(reduce?0:(i%45)*.018)+'s');
}
export function renderConnector(){
  const s=C[state.sel], a=(s._a??s.a)*RAD, o=[s.lng,s.lat];
  if(!visible(...o)){connector.style('display','none');return;}
  const [x,y]=proj(o);
  connector.style('display',null).attr('x1',(R_LBL-15)*Math.cos(a)).attr('y1',(R_LBL-15)*Math.sin(a)).attr('x2',x).attr('y2',y);
}
export function renderGlobe(){
  ocean.attr('d',path); landSel.attr('d',path); grat.attr('d',path);
  dotG.selectAll('circle').each(function(d){const v=visible(d.lng,d.lat), p=proj([d.lng,d.lat]); this.style.display=v?'':'none'; this.setAttribute('cx',p[0]); this.setAttribute('cy',p[1]);});
  const s=C[state.sel], o=[s.lng,s.lat], out=state.mode==='out';
  arcG.selectAll('path').attr('d',d=>out?arcD(o,[d.lng,d.lat]):arcD([d.lng,d.lat],o));
  const ov=visible(...o), op=proj(o);
  markG.selectAll('.origin,.pulse').style('display',ov?null:'none').attr('cx',op[0]).attr('cy',op[1]);
  if(state.dest!=null&&state.dest!==state.sel){const c=C[state.dest], v=visible(c.lng,c.lat), p=proj([c.lng,c.lat]);
    markG.selectAll('.ping,.pingring').style('display',v?null:'none').attr('cx',p[0]).attr('cy',p[1]);}
  else markG.selectAll('.ping,.pingring').style('display','none');
  renderConnector();
}
export function flyTo(lng,lat,dur=1100){
  stopSpin();
  const r0=proj.rotate(); let tl=-lng; while(tl-r0[0]>180) tl-=360; while(tl-r0[0]<-180) tl+=360;
  const ip=d3.interpolate(r0,[tl,Math.max(-60,Math.min(60,-lat)),0]);
  svg.transition('fly').duration(reduce?0:dur).ease(d3.easeCubicInOut).tween('rot',()=>t=>{proj.rotate(ip(t)); renderGlobe();});
}
export function flyBetween(a,b){ // frame both points
  const m=d3.geoInterpolate([a.lng,a.lat],[b.lng,b.lat])(.5); flyTo(m[0],m[1],1000);
}
export function drawArcs(){ arcG.classed('draw',false); void arcG.node().getBoundingClientRect(); arcG.classed('draw',true); }

/* spin */
export let spinT=null;
export function startSpin(){ if(spinT) return; state.spin=true; spinBtn.setAttribute('aria-pressed','true'); let last=0;
  spinT=d3.timer(el=>{const dt=el-last; last=el; const r=proj.rotate(); proj.rotate([r[0]+dt*.012,r[1],0]); renderGlobe();}); }
export function stopSpin(){ if(spinT){spinT.stop(); spinT=null;} state.spin=false; spinBtn.setAttribute('aria-pressed','false'); }
export const spinBtn=document.getElementById('spin');
spinBtn.addEventListener('click',()=>state.spin?stopSpin():startSpin());
document.getElementById('recenter').addEventListener('click',()=>{const s=C[state.sel]; flyTo(s.lng,s.lat);});

/* ---------- ring paint ---------- */
export function paintRing(){
  cg.classed('sel',d=>d.i===state.sel).classed('cmp',d=>d.i===state.cmp&&state.dtab==='cmp').classed('dim',d=>!match(d));
  cg.select('text').attr('class',d=>'code c-'+cat(d.i));
  barsG.attr('filter',d=>d.i===state.sel?'url(#glow)':null);
  cg.filter(d=>d.i===state.sel).raise();
  paintRegions();
}

/* ---------- tooltip & hover ---------- */
export const tip=document.getElementById('tip');
export function moveTip(e){
  const w=tip.offsetWidth,h=tip.offsetHeight; let x=e.clientX+18,y=e.clientY+18;
  if(x+w>innerWidth-8) x=e.clientX-w-18; if(y+h>innerHeight-8) y=e.clientY-h-18;
  tip.style.left=x+'px'; tip.style.top=y+'px';
}
export function setHover(i,e){
  state.hover=i;
  cg.classed('hov',d=>d.i===i);
  landSel.classed('hl',f=>i!=null&&f.code===C[i].code);
  arcG.classed('focus',i!=null&&i!==state.sel&&state.layers[cat(i)]);
  arcG.selectAll('path').classed('hot',d=>d.i===i||(i==null&&d.i===state.dest));
  document.querySelectorAll('.row.hov').forEach(r=>r.classList.remove('hov'));
  if(i==null){tip.classList.remove('show');return;}
  const r=document.querySelector(`.row[data-i="${i}"]`); if(r) r.classList.add('hov');
  const c=C[i], s=C[state.sel];
  let rel;
  if(i===state.sel) rel=`${dotFor('self')}Selected passport`;
  else if(state.mode==='out'){const v=verdictFor(state.sel,i); rel=`${dotFor(v.k)}<span>${esc(s.name)} passport: <b>${v.t}</b></span>`;}
  else {const v=verdictFor(i,state.sel); rel=`${dotFor(v.k)}<span>Entering ${esc(s.name)}: <b>${v.t}</b></span>`;}
  tip.innerHTML=`<h4>${esc(c.name)}<span>${c.code}</span></h4><div class="rel">${rel}</div>
  <div class="st"><span>Rank</span><b>${ord(c.rank)}</b><span>Mobility Score</span><b>${c.ms}</b><span>Visa-free</span><b>${c.vf}</b><span>On arrival</span><b>${c.voa}</b><span>eVisa / ETA</span><b>${c.ev}</b><span>Welcoming Score</span><b>${c.ws}</b></div>`;
  tip.classList.add('show'); if(e) moveTip(e);
}
