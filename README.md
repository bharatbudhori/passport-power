# Passport Power

Interactive passport-strength explorer: a radial ring of all 199 passports around a globe, a trip checker, passport comparison, a passport-cover gallery with a 3D coverflow viewer (with real landmark photos behind each passport), 12 themes plus a custom palette, a ⌘K command palette and optional sound/haptics.

## Run it locally

Requires Node.js 18+.

```bash
cd /Users/user/passport-power
npm install
npm run dev          # opens http://localhost:5173
```

Other scripts: `npm run build` (production build to `dist/`), `npm run preview` (serve the build), `npm run lint`.

## Landmark photos

When online, the passport viewer fetches the lead photo of each country's landmark from Wikipedia / Wikimedia Commons, keeping only freely licensed landscape images, and shows a credit line (author and licence) linking to the source. Lookups are cached in `localStorage`.

To keep local copies instead (faster, works offline, no API calls):

```bash
pip install requests pillow
npm run photos       # saves public/landmarks/<CODE>.jpg + credits.json
```

Local photos take priority. Countries without a free photo fall back to the built-in illustrated scene. Change which landmark is used per country in `src/data/landmarks.json`.

## Project structure

```
index.html                 page markup
src/
  main.js                  entry: styles, feature modules, initial render
  core/
    data.js                passport matrix, countries, scores, geo features
    state.js               app state and visa-rule helpers (category, verdicts, sorting)
    utils.js               small helpers (escaping, ordinals, reduced motion)
  features/
    chart.js               ring of passports, globe, routes, spin, hover tooltip
    trip.js                passport/destination pickers and the entry-rule verdict
    table.js               side list grouped by region
    detail.js              selected-passport header, route filters, destinations and compare tabs
    controls.js            selection, sorting, search, mode toggle, deep links (#IN)
    covers.js              stylized passport covers (colours from Passport Index)
    gallery.js             Passports gallery (Explore / Rank, filters, tilt)
    viewer.js              3D coverflow passport viewer
    scenes.js              illustrated landmark backdrops plus the real-photo layer
    photos.js              photo lookup: local files first, then Wikimedia Commons
    views.js               Visa map / Passports switch
    themes.js              theme presets and custom palette
    palette.js             ⌘K command palette
    sound.js               synthesized sounds and haptics
  styles/                  base, covers, gallery, viewer, carousel, scenes, themes, palette
  data/
    passports.json         visa matrix, stay lengths, cover colours, world map
    landmarks.json         landmark article titles per country
scripts/
  fetch_landmark_photos.py downloads local landmark photos with credits
public/landmarks/          local photos land here (git-ignored)
```

## Data sources

- Visa requirements: open [Passport Index dataset](https://github.com/ilyankou/passport-index-dataset).
- Passport cover colours: [Passport Index](https://www.passportindex.org/byColor.php). Covers are stylized illustrations, not official designs.
- Map: Natural Earth via `world-atlas`. Photos: Wikimedia Commons contributors (credited in the viewer).

Entry rules change often; confirm with official sources before travelling.
