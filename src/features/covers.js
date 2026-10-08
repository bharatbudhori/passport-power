import { COVERS } from '../core/data.js';
import { esc } from '../core/utils.js';

/* ---------- passport covers (colours from passportindex.org/byColor.php) ---------- */
export const COVER=COVERS;
export const CNAME={red:'Red',blue:'Blue',green:'Green',black:'Black',none:'Not listed'};
export const SHADES={red:['#7d1526','#8a1c2c','#6e1220','#93222f','#64101d'],blue:['#14254f','#1a2f63','#0e1c3e','#213d78','#1b3352','#24447f'],
  green:['#11402c','#0f4f33','#164a37','#1d5c3c'],black:['#17171b','#1d1c23','#121215'],none:['#3a3a4a']};
export const hsh=s=>s.charCodeAt(0)*31+s.charCodeAt(1)*7;
export const ckey=c=>COVER[c.code]||'none';
export const ccol=c=>{const L=SHADES[ckey(c)]; return L[hsh(c.code)%L.length];};
export const star=(cx,cy,r)=>{let p=''; for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5, rr=k%2?r*.42:r; p+=(cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1)+' ';} return `<polygon points="${p}" fill="#1a1408" fill-opacity=".38"/>`;};
const RING='<circle cx="50" cy="50" r="47" fill="none" stroke="url(#gd)" stroke-width="1.6"/><circle cx="50" cy="50" r="43.2" fill="none" stroke="url(#gd)" stroke-width=".7" opacity=".8"/>';
const INK='fill="#1a1408" fill-opacity=".34"';
export const EMB=[
  ()=>{let s=''; for(const side of [-1,1]) for(let k=0;k<8;k++){const a=(128+k*13)*Math.PI/180, x=50-side*31*Math.cos(a), y=54+28*Math.sin(a);
    s+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.3" ry="6" transform="rotate(${(side*(k*13-48)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;}
    return s+`<circle cx="50" cy="46" r="15"/>${star(50,46,7.5)}`;},
  ()=>{let s='<circle cx="50" cy="50" r="12"/>'; for(let k=0;k<16;k++){const a=k*Math.PI/8, r1=17, r2=k%2?30:38;
    s+=`<polygon points="${(50+r1*Math.cos(a-.09)).toFixed(1)},${(50+r1*Math.sin(a-.09)).toFixed(1)} ${(50+r2*Math.cos(a)).toFixed(1)},${(50+r2*Math.sin(a)).toFixed(1)} ${(50+r1*Math.cos(a+.09)).toFixed(1)},${(50+r1*Math.sin(a+.09)).toFixed(1)}"/>`;}
    return s+`<circle cx="50" cy="50" r="5" ${INK}/>`;},
  ()=>`<path d="M50 14 76 26v26c0 16-12 28-26 36-14-8-26-20-26-36V26Z"/><path d="M50 30 64 37v14c0 8-6 15-14 19-8-4-14-11-14-19V37Z" ${INK}/>`,
  ()=>`<circle cx="50" cy="50" r="27"/><g fill="none" stroke="#1a1408" stroke-opacity=".38" stroke-width="1.35"><ellipse cx="50" cy="50" rx="11" ry="27"/><ellipse cx="50" cy="50" rx="20" ry="27"/><path d="M23 50h54M27 38h46M27 62h46"/></g>`
];
export function coverHTML(c,o={}){
  const n=c.name, cls=n.length>22?' xlong':n.length>13?' long':'';
  return `<div class="pp" style="--pp:${ccol(c)}" aria-hidden="true"><span class="pp-frame"></span>${o.rank?`<span class="pp-rank">${c.rank}</span>`:''}<div class="pp-in">
    <div class="pp-name gold${cls}">${esc(n)}</div><i class="pp-rule"></i>
    <svg class="pp-emb" viewBox="0 0 100 100" fill="url(#gd)">${RING}${EMB[hsh(c.code)%EMB.length]()}</svg>
    <div class="pp-word gold">Passport</div><i class="pp-mark"></i></div></div>`;
}
