import './styles/base.css';
import './styles/covers.css';
import './styles/gallery.css';
import './styles/viewer.css';
import './styles/carousel.css';
import './styles/scenes.css';
import './styles/themes.css';
import './styles/palette.css';
import './styles/play.css';

import { C } from './core/data.js';
import { state } from './core/state.js';
import { drawArcs, flyTo, layout, paintGlobe, paintRing, proj, renderGlobe } from './features/chart.js';
import { renderDetail, renderNow } from './features/detail.js';
import { renderTable } from './features/table.js';
import { passCombo, renderVerdict } from './features/trip.js';
// feature modules that wire up their own UI on import
import './features/themes.js';
import './features/controls.js';
import './features/gallery.js';
import './features/viewer.js';
import './features/views.js';
import './features/sound.js';
import './features/palette.js';

/* ---------- init ---------- */
const bar=document.querySelector('header.top');
const syncBar=()=>document.documentElement.style.setProperty('--bar',bar.offsetHeight+'px');
syncBar(); new ResizeObserver(syncBar).observe(bar);
const s0=C[state.sel]; proj.rotate([-s0.lng+40,-s0.lat+12,0]);
passCombo.set(state.sel);
layout(false); paintRing(); paintGlobe(); renderGlobe(); renderTable(); renderDetail(); renderNow(); renderVerdict();
requestAnimationFrame(()=>{drawArcs(); flyTo(s0.lng,s0.lat,1800);});
