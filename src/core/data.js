import * as d3 from 'd3';
import D from '../data/passports.json';

export const COVERS=D.covers||{};
export const N=D.countries.length, M=D.matrix, REG=D.regions, DAYS=D.days, DV=D.dayvals;
export const CAT={V:'vf',A:'voa',E:'ev',T:'ev',R:'req',N:'req',S:'self'};
export const LBL={vf:'Visa-free',voa:'Visa on arrival',ev:'eVisa / ETA',req:'Visa required',self:'Home country'};
export const C=D.countries.map((c,i)=>({i,code:c[0],name:c[1],reg:c[2],lat:c[3],lng:c[4]}));
C.forEach(c=>{
  let vf=0,voa=0,ev=0,req=0; const row=M[c.i];
  for(let j=0;j<N;j++){const k=CAT[row[j]]; if(k==='vf')vf++; else if(k==='voa')voa++; else if(k==='ev')ev++; else if(k==='req')req++;}
  let ws=0; for(let j=0;j<N;j++){ if(j!==c.i){const k=M[j][c.i]; if(k==='V'||k==='A') ws++;}}
  Object.assign(c,{vf,voa,ev,req,ms:vf+voa+ev,ws});
});
export const msVals=[...new Set(C.map(c=>c.ms))].sort((a,b)=>b-a);
C.forEach(c=>c.rank=msVals.indexOf(c.ms)+1);
export const byCode=new Map(C.map(c=>[c.code,c])), byName=new Map(C.map(c=>[c.name.toLowerCase(),c]));
export const maxMS=d3.max(C,c=>c.ms), maxWS=d3.max(C,c=>c.ws);
export const FEAT=D.geo.features.map(f=>{f.code=D.num[f.id]||(byName.get((f.properties.name||'').toLowerCase())||{}).code||null; return f;});

export const days=(p,d)=>{const ch=DAYS[p].charCodeAt(d)-49; return ch>=0?DV[ch]:null;};
