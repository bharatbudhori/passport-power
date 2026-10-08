import { C, CAT, M, byCode, days } from './data.js';

export const top=C.slice().sort((a,b)=>b.ms-a.ms||a.name.localeCompare(b.name))[0];
export const hashC=byCode.get((location.hash||'').slice(1).toUpperCase());
export const state={sel:(hashC||top).i,dest:null,cmp:null,mode:'out',sort:'ms',group:true,layers:{vf:true,voa:true,ev:true,req:false},
  q:'',open:new Set(),tab:'vf',dtab:'dest',dq:'',hover:null,spin:false};
state.open.add(C[state.sel].reg);

/* category of country j relative to the selected passport */
export function catOf(sel,j,mode=state.mode){ if(j===sel) return 'self'; return CAT[mode==='out'?M[sel][j]:M[j][sel]]||'req'; }
export const cat=j=>catOf(state.sel,j);
export const match=c=>{const q=state.q.trim().toLowerCase(); return !q||c.name.toLowerCase().includes(q)||c.code.toLowerCase()===q;};
export const sorted=L=>L.slice().sort((a,b)=>b[state.sort]-a[state.sort]||b.ms-a.ms||a.name.localeCompare(b.name));
export function verdictFor(p,d){
  if(p===d) return {k:'self',t:'Home country',s:'No visa needed in your own country.'};
  const r=M[p][d], dy=days(p,d);
  if(r==='V') return {k:'vf',t:dy?`Visa-free for ${dy} days`:'Visa-free',s:'No visa needed before you go. Carry a valid passport and onward ticket.'};
  if(r==='A') return {k:'voa',t:'Visa on arrival',s:'Get the visa at the border when you land. Fees may apply.'};
  if(r==='E') return {k:'ev',t:'eVisa needed',s:'Apply online before you travel; approval usually arrives by email.'};
  if(r==='T') return {k:'ev',t:'ETA needed',s:'Get an electronic travel authorization online before boarding.'};
  if(r==='N') return {k:'req',t:'Entry not permitted',s:'Holders of this passport are currently not admitted.'};
  return {k:'req',t:'Visa required',s:'Apply at an embassy or consulate before you travel.'};
}
