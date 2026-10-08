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
export const star=(cx,cy,r)=>{let p=''; for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5, rr=k%2?r*.42:r; p+=(cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1)+' ';} return `<polygon points="${p}"/>`;};
export const EMB=[
  ()=>{let s=''; for(const side of [-1,1]) for(let k=0;k<9;k++){const a=(110+k*16)*Math.PI/180; s+=`<ellipse cx="${(50-side*36*Math.cos(a)).toFixed(1)}" cy="${(50+36*Math.sin(a)).toFixed(1)}" rx="3.2" ry="7" transform="rotate(${(side*(k*16-60)).toFixed(0)} ${(50-side*36*Math.cos(a)).toFixed(1)} ${(50+36*Math.sin(a)).toFixed(1)})"/>`;}
    return s+`<circle cx="50" cy="48" r="24" fill="none" stroke="url(#gd)" stroke-width="2.2"/>`+star(50,48,15);},
  ()=>{let s='<circle cx="50" cy="50" r="13"/>'; for(let k=0;k<24;k++){const a=k*15*Math.PI/180, r1=18, r2=k%2?34:42, w=.07;
      s+=`<polygon points="${(50+r1*Math.cos(a-w)).toFixed(1)},${(50+r1*Math.sin(a-w)).toFixed(1)} ${(50+r2*Math.cos(a)).toFixed(1)},${(50+r2*Math.sin(a)).toFixed(1)} ${(50+r1*Math.cos(a+w)).toFixed(1)},${(50+r1*Math.sin(a+w)).toFixed(1)}"/>`;}
    return s+'<circle cx="50" cy="50" r="46" fill="none" stroke="url(#gd)" stroke-width="1.4"/>';},
  ()=>`<path d="M28 24H72V52C72 70 60 80 50 87C40 80 28 70 28 52Z" fill="none" stroke="url(#gd)" stroke-width="3"/><path d="M33 56L50 42L67 56" fill="none" stroke="url(#gd)" stroke-width="3.4"/>${star(39,33,5.5)}${star(50,31,6)}${star(61,33,5.5)}<path d="M38 66h24M42 73h16" stroke="url(#gd)" stroke-width="2.4"/><path d="M34 16l6 6 10-8 10 8 6-6v6H34z"/>`,
  ()=>`<g fill="none" stroke="url(#gd)" stroke-width="2.2"><circle cx="50" cy="44" r="28"/><ellipse cx="50" cy="44" rx="12" ry="28"/><ellipse cx="50" cy="44" rx="22" ry="28"/><path d="M22 44h56M26 30h48M26 58h48M50 16v56"/><path d="M24 74c8 10 18 14 26 14s18-4 26-14"/></g>${star(50,88,5)}`
];
export const CHIP='<svg class="pp-chip" viewBox="0 0 40 26" fill="none" stroke="url(#gd)" stroke-width="2"><rect x="1.5" y="1.5" width="37" height="23" rx="3"/><circle cx="20" cy="13" r="6"/><path d="M1.5 13H14M26 13h12.5"/></svg>';
export function coverHTML(c,o={}){
  const n=c.name, cls=n.length>22?' xlong':n.length>13?' long':'';
  return `<div class="pp" style="--pp:${ccol(c)}" aria-hidden="true">${o.rank?`<span class="pp-rank">${c.rank}</span>`:''}<div class="pp-in">
    <div class="pp-name gold${cls}">${esc(n)}</div>
    <svg class="pp-emb" viewBox="0 0 100 100" fill="url(#gd)">${EMB[hsh(c.code)%EMB.length]()}</svg>
    <div class="pp-word gold">Passport</div>${CHIP}</div></div>`;
}
