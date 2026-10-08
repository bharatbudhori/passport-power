import { state } from '../core/state.js';
import { renderGallery } from './gallery.js';
import { openViewer } from './viewer.js';

/* ---------- view switch ---------- */
export let galleryBuilt=false;
export function setView(v){ document.body.dataset.view=v; document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v));
  if(v==='gallery'&&!galleryBuilt){renderGallery(); galleryBuilt=true;} }
document.querySelectorAll('.viewsw [data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('now').addEventListener('click',e=>{ if(e.target.closest('.nowpp')) openViewer(state.sel,null,e.target.closest('.nowpp')); });
setView('map');
