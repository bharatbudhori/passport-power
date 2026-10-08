

export const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ord=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
export const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

export const dotFor=k=>`<span class="dot d-${k==='req'?'ws':k==='self'?'vf':k}"></span>`;
