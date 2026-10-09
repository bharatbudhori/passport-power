import { C } from '../core/data.js';
import { CUR } from '../data/money.js';
import { state } from '../core/state.js';
import { esc } from '../core/utils.js';
import { sfx } from './sound.js';

/* Live mid-market rates. Cached for half a day so repeat visits stay instant. */
const URL = 'https://open.er-api.com/v6/latest/USD';
const KEY = 'pp-fx-rates';
const AMT_KEY = 'pp-fx-amt';
const QUICK = [100, 500, 1000, 5000, 10000];
const ELSEWHERE = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AED', 'THB', 'AUD', 'SGD', 'CHF', 'CAD', 'CNY'];
const names = new Intl.DisplayNames(['en'], { type: 'currency' });

let book = null, from = 'USD', to = 'EUR', amount = 1000;
let fromManual = false, toManual = false, filled = 0, failed = false, painting = false;

const root = document.getElementById('fx');
const amt = document.getElementById('fx-amt');
const fromSel = document.getElementById('fx-from');
const toSel = document.getElementById('fx-to');
const out = document.getElementById('fx-out');
const quick = document.getElementById('fx-quick');
const sub = document.getElementById('fx-sub');
const more = document.getElementById('fx-more');
const moreH = document.querySelector('.fxmoreh');
const mark = document.getElementById('fx-mark');
const codeEl = document.getElementById('fx-code');
const foot = document.getElementById('fx-foot');
const syncBtn = document.getElementById('fx-sync');

const cname = code => { try { return names.of(code) || code; } catch { return code; } };
const homeCur = () => CUR[C[state.sel].code] || null;
const awayCur = () => {
  if (state.dest == null) { const h = homeCur(); return h === 'USD' ? 'EUR' : 'USD'; }
  return CUR[C[state.dest].code] || null;
};
const parseAmt = s => {
  const n = Number(String(s).replace(/[\s,]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const formatInput = n => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(n);
const money = (n, cur) => {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: cur }).format(n); }
  catch { return `${formatInput(n)} ${cur}`; }
};
const rateText = n => {
  const abs = Math.abs(n);
  const d = abs >= 100 ? 2 : abs >= 1 ? 4 : abs >= 0.01 ? 4 : 6;
  return new Intl.NumberFormat('en', { maximumFractionDigits: d }).format(n);
};
const when = ms => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms));

function convert(n, a, b) {
  if (!book || a === b) return a === b ? n : null;
  const ra = book.rates[a], rb = book.rates[b];
  if (!ra || !rb) return null;
  return n * (rb / ra);
}

function codes() {
  const set = new Set(book ? Object.keys(book.rates) : []);
  if (from) set.add(from);
  if (to) set.add(to);
  return [...set].sort();
}

function fill() {
  const list = codes();
  if (list.length !== filled) {
    const html = list.map(c => `<option value="${c}">${c} · ${esc(cname(c))}</option>`).join('');
    painting = true;
    fromSel.innerHTML = html;
    toSel.innerHTML = html;
    filled = list.length;
    painting = false;
  }
  painting = true;
  fromSel.value = from;
  toSel.value = to;
  painting = false;
}

function paint() {
  if (document.activeElement !== amt) amt.value = formatInput(amount);
  fill();
  const home = C[state.sel], away = state.dest == null ? null : C[state.dest];
  const fromPlace = !fromManual && homeCur() === from ? home.name : cname(from);
  const toPlace = !toManual && away && CUR[away.code] === to ? away.name : cname(to);
  sub.textContent = away
    ? `${fromPlace} to ${toPlace}`
    : `${fromPlace} to ${cname(to)}`;
  syncBtn.hidden = !(fromManual || toManual);
  syncBtn.textContent = away ? `Use ${home.name} → ${away.name}` : `Use ${home.name}`;
  mark.textContent = to || '';
  codeEl.textContent = to || '';
  quick.innerHTML = QUICK.map(n => `<button type="button" data-amt="${n}" aria-pressed="${n === amount}">${formatInput(n)}</button>`).join('');

  if (!book && !failed) {
    out.innerHTML = '<p class="fxwait">Fetching today’s rate…</p>';
    more.innerHTML = '';
    moreH.hidden = true;
    foot.textContent = '';
    return;
  }
  if (!book) {
    out.innerHTML = '<p class="fxwait">Couldn’t load today’s rates. <button type="button" id="fx-retry">Try again</button></p>';
    more.innerHTML = '';
    moreH.hidden = true;
    foot.textContent = '';
    return;
  }
  const same = from === to;
  const got = convert(amount, from, to);
  const unit = convert(1, from, to);
  const back = convert(1, to, from);
  if (got == null || unit == null) {
    out.innerHTML = `<p class="fxwait">No published rate for ${esc(cname(from))} to ${esc(cname(to))}.</p>`;
    more.innerHTML = '';
    moreH.hidden = true;
    foot.innerHTML = `Updated ${when(book.at)}. <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a>`;
    return;
  }
  const shared = same && away && CUR[home.code] === CUR[away.code] && from === CUR[home.code];
  const note = shared ? `${esc(home.name)} and ${esc(away.name)} both use ${esc(cname(from))}.` : same ? 'Same currency on both sides.' : '';
  out.innerHTML = `<p class="fxbig">${money(got, to)}</p>
    ${same ? '' : `<p class="fxeq">${money(amount, from)} is about ${money(got, to)}</p>`}
    ${note ? `<p class="fxeq">${note}</p>` : ''}
    ${same ? '' : `<p class="fxrate">1 ${from} = ${rateText(unit)} ${to}<span>1 ${to} = ${rateText(back)} ${from}</span></p>`}`;
  const spots = ELSEWHERE.filter(c => c !== from && c !== to && book.rates[c]).slice(0, 8);
  moreH.hidden = spots.length === 0;
  more.innerHTML = spots.map(c => {
    const n = convert(amount, from, c);
    return `<button type="button" class="fxtile" data-cur="${c}"><b>${n == null ? '—' : money(n, c)}</b><span>${esc(cname(c))}</span></button>`;
  }).join('');
  foot.innerHTML = `Updated ${when(book.at)}. A mid-market rate, not a bank or card quote. <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a>`;
}

export function followPassport() {
  fromManual = false;
  const c = homeCur(); if (c) from = c;
  if (!toManual) { const a = awayCur(); if (a) to = a; }
  paint();
}
export function followDest() {
  toManual = false;
  const a = awayCur(); if (a) to = a;
  paint();
}
export function applyConvert(a, b, n) {
  if (n != null && n >= 0) { amount = n; try { localStorage.setItem(AMT_KEY, String(n)); } catch { /* ignore */ } }
  if (a) { from = a; fromManual = true; }
  if (b) { to = b; toManual = true; }
  focusFx();
  paint();
}
export function focusFx() {
  document.querySelector('.viewsw [data-view="money"]')?.click();
  requestAnimationFrame(() => { amt.focus(); amt.select(); });
}

async function load() {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { cached = null; }
  const fresh = cached?.rates && Date.now() - cached.at < 12 * 3600e3;
  if (cached?.rates) { book = cached; paint(); }
  if (fresh) return;
  try {
    const r = await fetch(URL);
    const j = await r.json();
    if (j.result !== 'success' || !j.rates) throw new Error('bad');
    book = { rates: j.rates, at: (j.time_last_update_unix || Date.now() / 1000) * 1000 };
    failed = false;
    try { localStorage.setItem(KEY, JSON.stringify(book)); } catch { /* storage full */ }
  } catch { failed = !book; }
  paint();
}

if (root) {
  try { const n = Number(localStorage.getItem(AMT_KEY)); if (n > 0) amount = n; } catch { /* ignore */ }
  from = homeCur() || 'USD';
  to = awayCur() || 'EUR';
  amt.addEventListener('input', () => {
    const n = parseAmt(amt.value);
    if (n == null) return;
    amount = n;
    try { localStorage.setItem(AMT_KEY, String(n)); } catch { /* ignore */ }
    paint();
  });
  amt.addEventListener('blur', () => { amt.value = formatInput(amount); });
  fromSel.addEventListener('change', () => { if (painting) return; from = fromSel.value; fromManual = true; sfx('tap'); paint(); });
  toSel.addEventListener('change', () => { if (painting) return; to = toSel.value; toManual = true; sfx('tap'); paint(); });
  document.getElementById('fx-swap').addEventListener('click', () => {
    [from, to] = [to, from]; fromManual = toManual = true; sfx('tap'); paint();
  });
  quick.addEventListener('click', e => {
    const b = e.target.closest('[data-amt]'); if (!b) return;
    amount = +b.dataset.amt;
    try { localStorage.setItem(AMT_KEY, String(amount)); } catch { /* ignore */ }
    sfx('tap'); paint();
  });
  out.addEventListener('click', e => { if (e.target.id === 'fx-retry') { failed = false; paint(); load(); } });
  more.addEventListener('click', e => {
    const b = e.target.closest('[data-cur]'); if (!b) return;
    to = b.dataset.cur; toManual = true; sfx('tap'); paint();
  });
  syncBtn.addEventListener('click', () => {
    fromManual = toManual = false;
    const c = homeCur(); if (c) from = c;
    const a = awayCur(); if (a) to = a;
    sfx('tap'); paint();
  });
  paint();
  load();
}
