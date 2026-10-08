/* Real landmark photos for the passport viewer backdrop.
 * 1. Local copies in public/landmarks/ (created by `npm run photos`) are used first.
 * 2. Otherwise the lead photo of the landmark's Wikipedia article is fetched live from
 *    Wikimedia Commons, keeping only freely licensed, landscape images, with credits.
 * Results are cached in localStorage so each country is looked up once. */
import LANDMARKS from '../data/landmarks.json';

const BASE = import.meta.env.BASE_URL;
const CACHE_KEY = 'pp-photo-v1';
let cache = {};
try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { cache = {}; }

let localCredits = {};
const localReady = fetch(`${BASE}landmarks/credits.json`)
  .then(r => (r.ok ? r.json() : {}))
  .catch(() => ({}))
  .then(j => { localCredits = j || {}; });

const pending = new Map();
const plain = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent.replace(/\s+/g, ' ').trim(); };

async function api(host, params) {
  const q = new URLSearchParams({ format: 'json', origin: '*', ...params });
  const r = await fetch(`https://${host}/w/api.php?${q}`);
  if (!r.ok) throw new Error(`${host} ${r.status}`);
  return r.json();
}

async function fromWikimedia(code) {
  for (const title of LANDMARKS[code] || []) {
    const j = await api('en.wikipedia.org', { action: 'query', titles: title, prop: 'pageimages', piprop: 'name', redirects: '1' });
    const page = Object.values(j.query?.pages || {})[0];
    const file = page?.pageimage;
    if (!file || /\.(svg|gif|tiff?)$/i.test(file)) continue;
    const j2 = await api('commons.wikimedia.org', { action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: '1600' });
    const p2 = Object.values(j2.query?.pages || {})[0];
    if (!p2 || 'missing' in p2 || !p2.imageinfo) continue;          // not on Commons: likely non-free
    const ii = p2.imageinfo[0], md = ii.extmetadata || {};
    const license = plain(md.LicenseShortName?.value);
    if (!license || /fair use/i.test(license) || String(md.NonFree?.value) === 'true') continue;
    if (ii.width < ii.height) continue;                               // backdrops need landscape photos
    return { url: ii.thumburl || ii.url, title: page.title || title, artist: plain(md.Artist?.value).slice(0, 80) || 'Unknown', license, source: ii.descriptionurl };
  }
  return null;
}

export function getPhoto(code) {
  if (pending.has(code)) return pending.get(code);
  const p = (async () => {
    await localReady;
    if (localCredits[code]) return { ...localCredits[code], url: `${BASE}landmarks/${code}.jpg` };
    if (code in cache) return cache[code];
    try {
      const res = await fromWikimedia(code);
      cache[code] = res;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* storage full or blocked */ }
      return res;
    } catch {
      return null;                                                    // offline: illustration stays
    }
  })();
  pending.set(code, p);
  return p;
}

export function preloadPhoto(code) {
  getPhoto(code).then(ph => { if (ph) { const im = new Image(); im.src = ph.url; } });
}
