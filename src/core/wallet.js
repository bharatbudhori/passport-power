/* Stamps collected in this browser. */
const KEY='pp-stamps';
export const wallet={stamps:[]};
const listeners=new Set();

function validCode(code){ return typeof code==='string'&&/^[A-Z]{2}$/.test(code); }

function load(){
  try{
    const raw=localStorage.getItem(KEY)||localStorage.getItem('pp-wallet');
    const s=JSON.parse(raw||'null');
    const list=Array.isArray(s)?s:(s&&Array.isArray(s.stamps)?s.stamps:[]);
    wallet.stamps=list.filter(x=>x&&validCode(x.code)).map(x=>({code:x.code,at:typeof x.at==='string'?x.at:''})).slice(0,199);
  }catch{ /* keep defaults */ }
}
load();

export function save(){ try{ localStorage.setItem(KEY,JSON.stringify(wallet.stamps)); }catch{ /* private mode */ } }
export function watch(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
function touch(){ save(); listeners.forEach(fn=>{ try{ fn(); }catch(e){ console.error(e); } }); }

export function hasStamp(code){ return wallet.stamps.some(s=>s.code===code); }
export function toggleStamp(code){
  if(!validCode(code)) return false;
  const i=wallet.stamps.findIndex(s=>s.code===code);
  if(i>=0) wallet.stamps.splice(i,1);
  else wallet.stamps.unshift({code,at:new Date().toISOString().slice(0,10)});
  touch();
  return i<0;
}
