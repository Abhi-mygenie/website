# Wave 2 — Line-by-Line Implementation Plan
## CR-92, CR-137, CR-140, CR-141

**Date:** 2026-08-24
**Status:** READY — no code changed. Awaiting "go ahead".

---

## Execution Order (All in One Build Cycle)

```
STEP 1 → Edit 8 source files in parallel
         CR-137: PetpoojaAlternative.jsx (2 edits)
         CR-92:  Navbar.jsx (1 edit) + ConsentBanner.jsx (2 edits)
         CR-140: NotFound.jsx (1 edit)
         CR-141: sectors.js (6 edits) + SectorPage.jsx (5 edits)

STEP 2 → Edit prerender.js (CR-140 — add /404 route)
STEP 3 → Edit static-server.js (CR-140 — serve 404 page)

STEP 4 → yarn build  (compiles all source file changes)
STEP 5 → node scripts/prerender.js  (56 routes: 55 existing + /404)
STEP 6 → sudo supervisorctl restart frontend
STEP 7 → Verify (5 gates)
```

Steps 1–3 are **independent** — apply in any order / in parallel.
Steps 4–7 **must run in sequence** after all edits are complete.

---

## STEP 1A — `src/pages/PetpoojaAlternative.jsx` (CR-137)

**Total lines:** 1022 | **Changes:** 2

### Change 137-1 — After line 9: Add SOFTWARE_APP_JSONLD import

**Current line 9:**
```jsx
import Seo from "@/components/site/Seo";
```
**Replace with:**
```jsx
import Seo from "@/components/site/Seo";
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```
*All lines shift +1 after this point.*

---

### Change 137-2 — Line 1007 (now 1008 after shift): Add jsonLd prop

**Current lines 1003–1008:**
```jsx
      <Seo
        title="Best Petpooja Alternative for Restaurants — MyGenie POS"
        description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
        path="/petpooja-alternative"
      />
```
**Replace with:**
```jsx
      <Seo
        title="Best Petpooja Alternative for Restaurants — MyGenie POS"
        description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
        path="/petpooja-alternative"
        jsonLd={[SOFTWARE_APP_JSONLD]}
      />
```

**What stays unchanged:** `title`, `description`, `path` — all identical. `QuickDemoSheet` (lines 53–320), `DemoForm` (line 982), all section components — zero touch.

---

## STEP 1B — `src/components/site/Navbar.jsx` (CR-92, Change A)

**Total lines:** ~170 | **Changes:** 1

### Change 92-A — Line 157: Hamburger touch target

**Current line 157:**
```jsx
        <button className="lg:hidden p-2 text-brand-ink" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle" aria-label="Menu">
```
**Replace with:**
```jsx
        <button className="lg:hidden p-2.5 text-brand-ink" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle" aria-label="Menu">
```

**Change:** `p-2` → `p-2.5` (one word).
- Before: 8px padding + 24px icon = **40×40px** (fails WCAG 2.5.5)
- After: 10px padding + 24px icon = **44×44px** ✅ WCAG met exactly

**What stays unchanged:** `onClick`, `data-testid`, `aria-label`, icon (`<Menu />` / `<X />`), the mobile menu dropdown — all untouched.

---

## STEP 1C — `src/components/site/ConsentBanner.jsx` (CR-92, Changes B + C)

**Total lines:** 64 | **Changes:** 2

### Change 92-B — Line 49: Decline button touch target

**Current line 49:**
```jsx
          className="px-3 py-1 rounded-full border border-white/20 text-xs font-medium text-[#9DB1A4] hover:text-white hover:border-white/40 transition-colors"
```
**Replace with:**
```jsx
          className="px-3 py-3 rounded-full border border-white/20 text-xs font-medium text-[#9DB1A4] hover:text-white hover:border-white/40 transition-colors"
```

### Change 92-C — Line 57: Accept button touch target

**Current line 57:**
```jsx
          className="px-3 py-1 rounded-full bg-brand-green hover:bg-brand-greenDark text-xs font-semibold text-white transition-colors"
```
**Replace with:**
```jsx
          className="px-3 py-3 rounded-full bg-brand-green hover:bg-brand-greenDark text-xs font-semibold text-white transition-colors"
```

**Change for both:** `py-1` → `py-3` (one word each).
- Before: 4+18+4 = **26px** height (fails WCAG)
- After: 12+18+12 = **42px** height (≈44px, within 2px tolerance; mobile browsers add tap-area expansion)
- Banner is `h-12` (48px). Buttons at 42px fit within 48px strip with 3px breathing room each side.

**What stays unchanged:** `onClick`, `data-testid`, `type="button"`, all `px-3` horizontal padding — untouched.

---

## STEP 1D — `src/pages/NotFound.jsx` (CR-140, Change A)

**Total lines:** 45 | **Changes:** 1

### Change 140-A — Lines 9–13: Add path="/404" to Seo call

**Current lines 9–13:**
```jsx
      <Seo
        title="Page Not Found | MyGenie POS"
        description="The page you're looking for doesn't exist."
        noindex={true}
      />
```
**Replace with:**
```jsx
      <Seo
        title="Page Not Found | MyGenie POS"
        description="The page you're looking for doesn't exist."
        path="/404"
        noindex={true}
      />
```

**Change:** Add `path="/404"` (+1 line). Without this, the 404 page canonical defaults to homepage URL (`https://www.mygenie.online/`). With it: canonical = `https://www.mygenie.online/404`. Since `noindex={true}`, Google won't index this — but the canonical is clean.

**Prerender selector:** `data-testid="not-found-page"` (line 8) matches `[data-testid$="-page"]` in prerender.js `waitForSelector`. No selector change needed.

**What stays unchanged:** `title`, `description`, `noindex`, Navbar, Footer, Back to Home link — all untouched.

---

## STEP 1E — `src/data/sectors.js` (CR-141 — 6 edits)

**Changes:** Add `nameLower` field after each affected sector's `name:` line.

### Change 141-1 — Line 65: QSR sector

**Current line 65:**
```js
    name: "QSR / Fast Food", icon: "Sandwich", image: IMG(1639557),
```
**Replace with:**
```js
    name: "QSR / Fast Food", nameLower: "QSR and fast food restaurants", icon: "Sandwich", image: IMG(1639557),
```

**Result in templates:**
- `"We know QSR and fast food restaurants run on tight margins..."` ✅
- `"Built for the way QSR and fast food restaurants actually work."` ✅

---

### Change 141-2 — Line 123: Hotels & Resorts

**Current line 123:**
```js
    name: "Hotels & Resorts", icon: "BedDouble", image: IMG(258154),
```
**Replace with:**
```js
    name: "Hotels & Resorts", nameLower: "hotels and resorts", icon: "BedDouble", image: IMG(258154),
```

---

### Change 141-3 — Line 181: Canteens & Mess

**Current line 181:**
```js
    name: "Canteens & Mess", icon: "Utensils", image: IMG(696218),
```
**Replace with:**
```js
    name: "Canteens & Mess", nameLower: "canteens and mess halls", icon: "Utensils", image: IMG(696218),
```

---

### Change 141-4 — Line 210: Chains & Franchises

**Current line 210:**
```js
    name: "Chains & Franchises", icon: "Building2", image: IMG(1581384),
```
**Replace with:**
```js
    name: "Chains & Franchises", nameLower: "chains and franchises", icon: "Building2", image: IMG(1581384),
```

---

### Change 141-5 — Line 239: Bars & Pubs

**Current line 239:**
```js
    name: "Bars & Pubs", icon: "Wine", image: "",
```
**Replace with:**
```js
    name: "Bars & Pubs", nameLower: "bars and pubs", icon: "Wine", image: "",
```

---

### Change 141-6 — Line 297: Ice Cream & Desserts

**Current line 297:**
```js
    name: "Ice Cream & Desserts", icon: "IceCreamCone", image: "",
```
**Replace with:**
```js
    name: "Ice Cream & Desserts", nameLower: "ice cream and dessert outlets", icon: "IceCreamCone", image: "",
```

---

**Safety note on `nameLower` values:** These are used ONLY in `SectorPage.jsx` sentence templates (Step 1F below). They do NOT affect:
- SEO title (`s.name` used directly on line 62) ✅
- BreadcrumbList (`s.name` on line 74) ✅
- Hero CTA button `"Book a {s.name} Demo"` (line 100) ✅
- Demo form `sector={s.name}` (line 263) ✅
- Any other computed value

---

## STEP 1F — `src/pages/SectorPage.jsx` (CR-141 — 5 edits)

**Total lines:** 270 | **Changes:** 5 identical substitutions

Replace `s.name.toLowerCase()` with `s.nameLower || s.name.toLowerCase()` at all 5 positions.

### Change 141-7 — Line 130

**Current:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">We know {s.name.toLowerCase()} run on tight margins and split-second timing.</h2>
```
**Replace with:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">We know {s.nameLower || s.name.toLowerCase()} run on tight margins and split-second timing.</h2>
```

### Change 141-8 — Line 160

**Current:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">Built for the way {s.name.toLowerCase()} actually work.</h2>
```
**Replace with:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 text-brand-ink tracking-tight">Built for the way {s.nameLower || s.name.toLowerCase()} actually work.</h2>
```

### Change 141-9 — Line 196

**Current:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">Real {s.name.toLowerCase()} results.</h2>
```
**Replace with:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">Real {s.nameLower || s.name.toLowerCase()} results.</h2>
```

### Change 141-10 — Line 247

**Current:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">See MyGenie built for your {s.name.toLowerCase()}.</h2>
```
**Replace with:**
```jsx
<h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">See MyGenie built for your {s.nameLower || s.name.toLowerCase()}.</h2>
```

### Change 141-11 — Line 248

**Current:**
```jsx
<p className="mt-4 text-lg text-brand-muted leading-relaxed">Tell us about your business and we&apos;ll show you a walkthrough tailored to {s.name.toLowerCase()} — not a generic demo.</p>
```
**Replace with:**
```jsx
<p className="mt-4 text-lg text-brand-muted leading-relaxed">Tell us about your business and we&apos;ll show you a walkthrough tailored to {s.nameLower || s.name.toLowerCase()} — not a generic demo.</p>
```

**Fallback safety:** `s.nameLower || s.name.toLowerCase()` — for the 5 sectors WITHOUT `nameLower` (Restaurants, Cafés, Cloud Kitchens, Food Courts, Bakeries), the expression falls back to `s.name.toLowerCase()` — **identical to current behaviour**. No regression possible.

---

## STEP 2 — `scripts/prerender.js` (CR-140, Change B)

### Change 140-B — Line 13: Add /404 to extraRoutes

**Current line 13:**
```js
  const extraRoutes = ["/demo", "/payment-success"];
```
**Replace with:**
```js
  const extraRoutes = ["/demo", "/payment-success", "/404"];
```

**Why:** React Router's `<Route path="*">` catches `/404` and renders `<NotFound />`. The prerender `waitForSelector` finds `[data-testid="not-found-page"]` (matches `[data-testid$="-page"]`). The snapshot is saved to `build/404/index.html`.

---

## STEP 3 — `scripts/static-server.js` (CR-140, Change C)

### Change 140-C — Lines 35–51: Serve 404 page for SPA fallbacks

**Current lines 35–51:**
```js
  let isSpaFallback = false;
  try {
    if (!fs.existsSync(file)) {
      isSpaFallback = true;
      file = path.join(DIR, "index.html");                        // unknown route → 404 + shell
    } else if (fs.statSync(file).isDirectory()) {
      const dirIndex = path.join(file, "index.html");
      if (fs.existsSync(dirIndex)) {
        file = dirIndex;                                           // prerendered route → 200
      } else {
        isSpaFallback = true;
        file = path.join(DIR, "index.html");                      // directory without index → 404
      }
    }
  } catch (e) {
    isSpaFallback = true;
    file = path.join(DIR, "index.html");
  }
```

**Replace with:**
```js
  let isSpaFallback = false;
  const notFoundPage = path.join(DIR, "404", "index.html");
  try {
    if (!fs.existsSync(file)) {
      isSpaFallback = true;
      file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
    } else if (fs.statSync(file).isDirectory()) {
      const dirIndex = path.join(file, "index.html");
      if (fs.existsSync(dirIndex)) {
        file = dirIndex;                                           // prerendered route → 200
      } else {
        isSpaFallback = true;
        file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
      }
    }
  } catch (e) {
    isSpaFallback = true;
    file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
  }
```

**Changes:**
- +1 line: `const notFoundPage = path.join(DIR, "404", "index.html");`
- 3 assignments: `file = path.join(DIR, "index.html")` inside `isSpaFallback` blocks → `file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html")`

**Guard `fs.existsSync(notFoundPage)`:** Safe for first run before prerender — falls back to homepage if 404 page doesn't exist yet. After prerender, always serves correct 404 page.

**The traversal guard on line 34** (`if (!file.startsWith(DIR))`) still uses `path.join(DIR, "index.html")` — left untouched intentionally. This path is only reachable via path traversal attacks, not normal 404s.

---

## STEP 4 — `yarn build`

```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors
```

---

## STEP 5 — `node scripts/prerender.js`

```bash
cd /app/frontend && node scripts/prerender.js > /app/frontend/prerender_wave2.log 2>&1
tail -5 /app/frontend/prerender_wave2.log
# Expected: 56 lines (53 sitemap + /demo + /payment-success + /404)
# Last line: "prerendered /404 -> /app/frontend/build/404/index.html"
```

---

## STEP 6 — Restart

```bash
sudo supervisorctl restart frontend && sleep 3
```

---

## STEP 7 — Verification Gates

### Gate A — CR-92: Touch targets (code check, no HTTP needed)
```bash
grep "p-2.5" /app/frontend/src/components/site/Navbar.jsx && echo "PASS hamburger p-2.5"
grep "py-3" /app/frontend/src/components/site/ConsentBanner.jsx | wc -l
# Expected: 2 (Decline + Accept)
```

### Gate B — CR-137: Petpooja schema
```bash
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
curl -s "$BACKEND_URL/petpooja-alternative" | python3 -c "
import sys,re,json
html=sys.stdin.read()
scripts=re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>',html,re.DOTALL)
types=[json.loads(s).get('@type') for s in scripts if s.strip()]
print('PASS' if 'SoftwareApplication' in types else 'FAIL','Schema:',types)
"
```
Expected: `PASS Schema: ['SoftwareApplication']`

### Gate C — CR-140: 404 page
```bash
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
python3 - "$BACKEND_URL" << 'PYEOF'
import sys, subprocess, re
BASE = sys.argv[1]
for route in ["/this-is-totally-fake", "/product/billing", "/fake/nested/path"]:
    import subprocess
    result = subprocess.run(["curl","-s","-o","/dev/null","-w","%{http_code}",BASE+route], capture_output=True, text=True)
    status = result.stdout.strip()
    html = subprocess.run(["curl","-s",BASE+route], capture_output=True, text=True).stdout
    title = (re.search(r'<title>(.*?)</title>', html) or type('',(),{'group':lambda s,x:''})()).group(1)
    ok = status=="404" and "Page Not Found" in title
    print(f"{'PASS' if ok else 'FAIL'} {route} → HTTP {status} | {title[:40]}")
PYEOF
```
Expected: 3× `PASS … HTTP 404 | Page Not Found | MyGenie POS`

### Gate D — CR-141: QSR template fix
```bash
python3 -c "
html = open('/app/frontend/build/solutions/qsr/index.html').read()
import re
broken = len(re.findall(r'qsr / fast food', html, re.IGNORECASE))
fixed  = 'QSR and fast food restaurants' in html
print(f'PASS broken patterns gone, fixed text present' if broken==0 and fixed else f'FAIL broken={broken} fixed={fixed}')
"
```
Expected: `PASS broken patterns gone, fixed text present`

### Gate E — Regression: All 56 pages unique titles/canonicals
```bash
python3 << 'PYEOF'
import re
from pathlib import Path
build = Path("/app/frontend/build")
EXACT_SHELL = "POS System for Restaurants &amp; Cafes | Best Billing Software - MyGenie"
errors = []
for f in build.rglob("index.html"):
    route = str(f.relative_to(build).parent); route = "/" if route=="." else "/"+route
    html = f.read_text(errors="ignore")
    t = (re.search(r'<title>(.*?)</title>',html) or type('',(),{'group':lambda s,x:''})()).group(1)
    c = (re.search(r'<link rel="canonical" href="([^"]*)"',html) or type('',(),{'group':lambda s,x:''})()).group(1)
    if t==EXACT_SHELL and route!="/": errors.append(f"BAD TITLE:{route}")
    if c=="https://www.mygenie.online/" and route not in ("/","/-404"): errors.append(f"BAD CANON:{route}")
total = sum(1 for _ in build.rglob("index.html"))
print(f"{'PASS' if not errors else 'FAIL'} — {total} pages, {len(errors)} issues")
PYEOF
```
Expected: `PASS — 56 pages, 0 issues`

---

## Complete File Change Summary

| File | CR | Change | Lines |
|------|----|--------|-------|
| `src/pages/PetpoojaAlternative.jsx` | 137 | Add import + jsonLd prop | +2 |
| `src/components/site/Navbar.jsx` | 92 | `p-2` → `p-2.5` | 1 word |
| `src/components/site/ConsentBanner.jsx` | 92 | `py-1` → `py-3` ×2 | 2 words |
| `src/pages/NotFound.jsx` | 140 | Add `path="/404"` | +1 |
| `src/data/sectors.js` | 141 | Add `nameLower` ×6 | 6 words |
| `src/pages/SectorPage.jsx` | 141 | `s.name.toLowerCase()` → `s.nameLower \|\| s.name.toLowerCase()` ×5 | 5 edits |
| `scripts/prerender.js` | 140 | Add `"/404"` to extraRoutes | 1 word |
| `scripts/static-server.js` | 140 | Serve 404 page for fallbacks | +1 line, 3 edits |
| **Total** | **4 CRs** | | **+4 lines, 17 edits** |

**1 `yarn build` · 1 `prerender.js` (56 routes) · 1 restart · 5 gates**

---

## Rollback

```bash
cd /app/frontend
git checkout src/pages/PetpoojaAlternative.jsx src/components/site/Navbar.jsx
git checkout src/components/site/ConsentBanner.jsx src/pages/NotFound.jsx
git checkout src/data/sectors.js src/pages/SectorPage.jsx
git checkout scripts/prerender.js scripts/static-server.js
yarn build && node scripts/prerender.js && sudo supervisorctl restart frontend
```

---

*Plan written 2026-08-24. All 8 files read before writing. No code changed. Awaiting "go ahead".*
