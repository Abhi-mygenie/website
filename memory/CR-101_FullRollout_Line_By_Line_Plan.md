# CR-101 Full Rollout — Line-by-Line Implementation Plan
## Extend Prerendering from `/` to All 53 Sitemap Routes

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-101_FullRollout_ImpactAnalysis.md`

---

## 0. Prerequisite Checks

```bash
# A. Confirm prerender.js currently has ROUTES = ["/"]
grep "ROUTES" /app/frontend/scripts/prerender.js | head -2
# Expected: const ROUTES = ["/"];

# B. Confirm sitemap has 53 routes
python3 -c "
import re
with open('/app/frontend/public/sitemap.xml') as f: xml = f.read()
print('Sitemap routes:', len(re.findall(r'<loc>', xml)))
"
# Expected: 53

# C. Confirm supervisor is in static-server mode
grep "command=" /etc/supervisor/conf.d/supervisord.conf | grep frontend
# Expected: command=/usr/bin/node .../static-server.js

# D. Confirm build/ exists (no need to rebuild from scratch)
ls /app/frontend/build/index.html
# Expected: file exists
```

---

## The Two Code Changes

Both changes are in `/app/frontend/scripts/prerender.js`. No other file changes.

---

## Change A — Lines 1 and 7: Update comment + replace ROUTES

**Current (lines 1–7):**
```js
// scripts/prerender.js — POC: prerender ONLY "/" into build/index.html
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer-core");

const ROUTES = ["/"];                       // POC: homepage only
```

**Replace with:**
```js
// scripts/prerender.js — Full rollout: prerender all routes from sitemap.xml
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer-core");

// Auto-read all routes from sitemap.xml — stays in sync when new pages are added
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
})();
```

**Lines changed:** Line 1 (comment update), lines 7–11 (ROUTES definition, +4 lines net)

**How it works:**
- Reads `sitemap.xml` synchronously at startup (one-time)
- Extracts all path segments using a regex that strips the domain
- The empty match for `https://www.mygenie.online/` → `""` → mapped to `"/"`
- Returns an array of 53 strings: `["/", "/petpooja-alternative", ..., "/blog/improve-table-turnover-pos-order-management"]`
- When a new URL is added to sitemap → it automatically gets prerendered on next build

**Why IIFE (immediately-invoked function expression):** `fs` and `path` are declared AFTER line 1 but before line 7. The `fs.readFileSync` call uses the already-imported `fs` module. The IIFE pattern keeps the ROUTES declaration clean without needing a separate function.

---

## Change B — Line 43 (now ~line 47 after Change A): waitForSelector

**Current (line 43, becomes ~line 47 after Change A adds lines):**
```js
      await page.waitForSelector('[data-testid="hero"]', { timeout: 30000 });
```

**Replace with:**
```js
      await page.waitForSelector(
        '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
        { timeout: 30000 }
      );
```

**Lines changed:** 1 line → 3 lines (+2 lines net)

**Selector breakdown — what each part covers:**

| Selector | Matches | Pages |
|----------|---------|-------|
| `[data-testid="hero"]` | exact match | Homepage (`/`) |
| `[data-testid$="-hero"]` | ends with `-hero` | `/solutions`, `/product`, `/solutions/*`, `/product/*`, `/ai`, `/customers`, `/petpooja-alternative` |
| `[data-testid$="-page"]` | ends with `-page` | `/blog`, `/blog/*`, `/about`, `/contact`, `/pricing`, `/ai`, `/roi`, `/resources` |
| `[data-testid^="legal-page"]` | starts with `legal-page` | `/terms`, `/privacy`, `/refund` |

**All 53 routes confirmed covered.** The selector fires as soon as the first matching element appears in the DOM — Puppeteer doesn't need ALL selectors to match, just any one of them.

---

## Final State of `prerender.js` (lines 1–16 after both changes)

```js
// scripts/prerender.js — Full rollout: prerender all routes from sitemap.xml
const fs = require("fs");
const path = require("path");
const http = require("http");
const puppeteer = require("puppeteer-core");

// Auto-read all routes from sitemap.xml — stays in sync when new pages are added
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
})();
const BUILD_DIR = path.resolve(__dirname, "..", "build");
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const PORT = 4321;
```

And the `waitForSelector` (~line 47):
```js
      await page.waitForSelector(
        '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
        { timeout: 30000 }
      );
```

Everything else in the file is **unchanged** — the cleanup block (Sonner dedup, noscript removal, googleapis removal, canonical dedup, hero image preload) runs for every page automatically.

---

## Execution Pipeline

### Step 1 — No rebuild needed
The React source hasn't changed. The existing `build/` is current. We only need to re-run the prerender script.

```bash
cd /app/frontend && node scripts/prerender.js
# Expected: 53 lines of output, one per route
# Expected time: ~2 minutes
```

**Sample expected output:**
```
prerendered / -> /app/frontend/build/index.html
prerendered /petpooja-alternative -> /app/frontend/build/petpooja-alternative/index.html
prerendered /pricing -> /app/frontend/build/pricing/index.html
...
prerendered /blog/improve-table-turnover-pos-order-management -> /app/frontend/build/blog/improve-table-turnover-pos-order-management/index.html
```

### Step 2 — Verify output structure

```bash
# Count prerendered files
find /app/frontend/build -name "index.html" | wc -l
# Expected: 54 (53 routes + the CRA base template)

# Spot-check a few pages
grep -c "POS for Restaurants" /app/frontend/build/solutions/restaurants/index.html 2>/dev/null && echo "PASS sector page" || echo "FAIL"
grep -c "Restaurant Inventory Management" "/app/frontend/build/blog/How-Small-Changes-in-Restaurant-Inventory-Management-Can-Give-Big-Rewards-For-Owners/index.html" 2>/dev/null && echo "PASS blog post" || echo "FAIL"
grep -c "MyGenie POS Features" /app/frontend/build/product/index.html 2>/dev/null && echo "PASS product hub" || echo "FAIL"
```

### Step 3 — Structural gates on homepage (no regression)

```bash
python3 << 'PYEOF'
import re, os
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)

g = {
    "G1 style blocks == 2":        len(re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)) == 2,
    "G2 noscript in head == 0":    len(re.findall(r'<noscript>', head)) == 0,
    "G3 canonical == 1":           len(re.findall(r'<link[^>]*canonical[^>]*>', html)) == 1,
    "G4 image preload == 1":       len([l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]) == 1,
    "G5 font preloads == 3":       len([l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]) == 3,
    "G6 no googleapis":            'googleapis' not in html,
    "G7 hero text present":        'boosts profit by up to' in html,
}
for k, v in g.items(): print(f"{'PASS' if v else 'FAIL'} {k}")
print("HOMEPAGE GATES:", "PASS" if all(g.values()) else "FAIL")
PYEOF
```

### Step 4 — Spot-check that blog, sector, product pages have content

```bash
python3 << 'PYEOF'
import os, re

checks = [
    # (file_path, expected_content_snippet, label)
    ("build/pricing/index.html",               "pricing",               "pricing page"),
    ("build/solutions/restaurants/index.html", "Restaurants",           "sector page"),
    ("build/product/sell-serve/index.html",    "Sell",                  "product page"),
    ("build/solutions/index.html",             "hospitality",           "solutions hub"),
    ("build/product/index.html",               "operating system",      "product hub"),
    ("build/ai/index.html",                    "Practical AI",          "ai page"),
    ("build/terms/index.html",                 "Terms",                 "legal page"),
    ("build/blog/How-Small-Changes-in-Restaurant-Inventory-Management-Can-Give-Big-Rewards-For-Owners/index.html",
                                               "inventory",             "blog post"),
]

build = "/app/frontend"
for path, snippet, label in checks:
    full = f"{build}/{path}"
    if os.path.exists(full):
        html = open(full).read()
        found = snippet.lower() in html.lower()
        print(f"{'PASS' if found else 'FAIL'} {label}: content present")
    else:
        print(f"FAIL {label}: file not found at {path}")
PYEOF
```

### Step 5 — Screenshot of homepage (no visual regression)

### Step 6 — Testing agent (mandatory)

---

## Rollback

```bash
cd /app/frontend
git checkout scripts/prerender.js

# Rebuild homepage-only snapshot
node scripts/prerender.js
# This restores ROUTES=["/"] and re-prerenderers only the homepage
```

**The prerendered route folders (`build/pricing/`, `build/blog/`, etc.) do NOT need to be deleted.** If the static-server doesn't find `build/pricing/index.html`, it falls back to `build/index.html` (the SPA shell) — same as before the rollout. Zero user impact.

---

## File Change Summary

| File | Change | Lines |
|------|--------|-------|
| `scripts/prerender.js` | Line 1: comment update | 1 line |
| `scripts/prerender.js` | Lines 7–11: ROUTES → sitemap-reading IIFE (+4 lines) | +4 lines |
| `scripts/prerender.js` | Line 43→47: `waitForSelector` → combined selector (+2 lines) | +2 lines |
| All other files | **Unchanged** | — |

**Total: 1 file, +7 lines, 2 substantive changes**

---

## Definition of Done

- [ ] `ROUTES` auto-reads from sitemap.xml and returns 53 routes
- [ ] `waitForSelector` covers all page testid patterns (hero / *-hero / *-page / legal-page*)
- [ ] `node scripts/prerender.js` completes without errors (all 53 routes)
- [ ] `find build -name "index.html" | wc -l` returns 54
- [ ] Homepage structural gates still pass (no regression from CR-114 through CR-122)
- [ ] Sector page (`/solutions/restaurants`) has "Restaurants" in raw HTML
- [ ] Blog post has article content in raw HTML (not just empty `<div id="root">`)
- [ ] Product hub (`/product`) has content in raw HTML
- [ ] Testing agent confirms no regression

---

*Line-by-line plan written 2026-08-23. No code changed. Ready for implementation on approval.*
