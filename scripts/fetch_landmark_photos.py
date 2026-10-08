#!/usr/bin/env python3
"""
Download one openly licensed landmark photo per country from Wikipedia / Wikimedia Commons,
with author + licence credits, sized for the Passport Power viewer backdrop.

Optional: the app already loads photos live from Wikimedia when online. Run this to keep
local copies in public/landmarks/ (faster, works offline, no API calls).

Usage (from the project root):
    pip install requests pillow
    npm run photos        # or: python3 scripts/fetch_landmark_photos.py
Output:
    public/landmarks/<CODE>.jpg    (max 1280px wide, ~60-90 KB each)
    public/landmarks/credits.json  (title, author, licence, source link per country)

Only files hosted on Wikimedia Commons (which only accepts free licences) are kept;
non-free "fair use" images are skipped and the next choice is tried.
"""
import io, json, re, sys, time, html
from pathlib import Path
from urllib.parse import quote, unquote
import requests
from PIL import Image

UA = {"User-Agent": "PassportPowerViz/1.0 (personal project; landmark backdrop fetcher)"}
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "landmarks"; IMG = OUT; IMG.mkdir(parents=True, exist_ok=True)
LANDMARKS = json.loads((ROOT / "src" / "data" / "landmarks.json").read_text(encoding="utf-8"))

S = requests.Session(); S.headers.update(UA)
strip = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()

def lead_image_file(title):
    r = S.get("https://en.wikipedia.org/w/api.php", params={"action":"query","titles":title,"prop":"pageimages","piprop":"name",
              "redirects":1,"format":"json"}, timeout=20)
    for p in r.json().get("query",{}).get("pages",{}).values():
        if p.get("pageimage"): return p["pageimage"], p.get("title", title)
    return None, title

def commons_info(fname):
    r = S.get("https://commons.wikimedia.org/w/api.php", params={"action":"query","titles":"File:"+fname,"prop":"imageinfo",
              "iiprop":"url|extmetadata|size","iiurlwidth":1600,"format":"json"}, timeout=20)
    for p in r.json().get("query",{}).get("pages",{}).values():
        if "missing" in p or not p.get("imageinfo"): return None      # not on Commons -> likely non-free, skip
        ii = p["imageinfo"][0]; md = ii.get("extmetadata",{})
        lic = strip(md.get("LicenseShortName",{}).get("value"))
        if not lic or "fair use" in lic.lower() or md.get("NonFree",{}).get("value") in ("true", True): return None
        if ii.get("width",0) < ii.get("height",1): return None          # prefer landscape photos for a backdrop
        return {"url": ii.get("thumburl") or ii["url"], "license": lic, "license_url": strip(md.get("LicenseUrl",{}).get("value")),
                "artist": strip(md.get("Artist",{}).get("value"))[:120] or "Unknown", "source": ii.get("descriptionurl")}
    return None

credits, missing = {}, []
if (OUT/"credits.json").exists():
    credits = json.loads((OUT/"credits.json").read_text(encoding="utf-8"))
for code, titles in LANDMARKS.items():
    if (IMG/f"{code}.jpg").exists() and code in credits: continue
    done = False
    for t in titles:
        try:
            fname, real = lead_image_file(t)
            if not fname or fname.lower().endswith((".svg",".gif",".tif",".tiff")): continue
            info = commons_info(fname)
            if not info: continue
            raw = S.get(info["url"], timeout=40).content
            im = Image.open(io.BytesIO(raw)).convert("RGB"); im.thumbnail((1280, 1280))
            im.save(IMG/f"{code}.jpg", "JPEG", quality=62, optimize=True, progressive=True)
            credits[code] = {"title": real, "file": fname, **{k: info[k] for k in ("artist","license","license_url","source")}}
            print(f"{code}  ok   {real}  ({info['license']})"); done = True; break
        except Exception as e:
            print(f"{code}  err  {t}: {e}", file=sys.stderr)
        finally:
            time.sleep(0.4)   # be polite to Wikimedia
    if not done: missing.append(code); print(f"{code}  --   no free landscape image found")

(OUT/"credits.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1), encoding="utf-8")
size = sum(f.stat().st_size for f in IMG.glob("*.jpg"))
print(f"\n{len(credits)} photos, {size/1e6:.1f} MB. Missing: {', '.join(missing) or 'none'}")
print("Saved to public/landmarks/. Restart `npm run dev` and the viewer will use these local photos.")
