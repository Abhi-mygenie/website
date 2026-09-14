# CR-133 — Prerender Head Tag Poisoning: All 53 Pages Share Homepage Title, Canonical & Description

**Type:** Critical Bug / Technical SEO
**Date Raised:** 2026-08-24
**Raised By:** Prerender SEO Audit (PRERENDER_SEO_AUDIT_2026-08-24.md)
**Status:** OPEN
**Priority:** P0 — CRITICAL
**Effort:** ~20 min (2-line fix + 4-min re-prerender)
**Improves:** SEO · Indexability · SERP appearance · Canonical correctness
**Scope:** `frontend/scripts/prerender.js`
**Related:** CR-101 (prerender pipeline), CR-126 (lock prerender in build pipeline)

---

## 1. Problem Statement

All 53 prerendered pages carry the **homepage's** `<title>`, `<link rel="canonical">`, and `<meta name="description">`. Every other page correctly prerendered is invisible to this bug (body content is fine), but the `<head>` is poisoned across the entire site.

### What Google sees for `/pricing`
```html
<title>POS System for Restaurants &amp; Cafes | Best Billing Software - MyGenie</title>
<link rel="canonical" href="https://www.mygenie.online/" />
<meta name="description" content="MyGenie POS — the hospitality operating system..." />
```

### What Google should see for `/pricing`
```html
<title>MyGenie POS Pricing | Transparent Restaurant POS Plans &amp; Add-ons</title>
<link rel="canonical" href="https://www.mygenie.online/pricing" />
<meta name="description" content="Pick a base plan, add only what you need..." />
```

### SEO consequence
Every page canonical points to the homepage. Google interprets all 53 pages as duplicates of `/`. It consolidates them, deindexes non-homepage URLs, and assigns all link equity to the homepage. Sector pages, blog posts, pricing page — none appear in search with their own titles.

---

## 2. Root Cause

**react-helmet-async 3.0.0** was freshly installed in this deployment (it was a missing package that caused compile errors in the initial setup). Version 3.0 changed its internal architecture — `<title>` and `<canonical>` updates now arrive via a different timing path compared to og:title and meta description.

The `prerender.js` script captures the DOM at the wrong moment:

```
Timeline during prerender for /solutions/restaurants:
─────────────────────────────────────────────────────
[t=0ms]   Puppeteer loads CRA shell (build/index.html)
          Shell has: homepage <title>, no canonical
[t=100ms] React renders SectorPage component
[t=110ms] react-helmet-async commits portals:
             og:title ✅  og:description ✅  og:url ✅
             (synchronous portal commits — captured correctly)
[t=115ms] waitForSelector finds [data-testid="sector-page"] ← SCRIPT PROCEEDS
[t=116ms] page.evaluate() runs canonical deduplication:
             canonicals found: ['https://www.mygenie.online/']  ← only shell canonical
             KEEPS first (wrong), removes rest (none to remove)
[t=117ms] page.content() captured — homepage title, homepage canonical
[t=130ms] react-helmet-async effect fires → updates <title>  ← TOO LATE
             adds correct canonical → now 2 canonicals exist  ← ALSO TOO LATE
```

**Two defects in prerender.js:**

1. **Title timing:** `page.content()` called before react-helmet-async's effect updates `<title>`. The shell default title is captured.

2. **Canonical deduplication keeps WRONG one:** The dedup logic keeps the FIRST canonical and removes subsequent ones. The first canonical is the shell's homepage canonical. The correct per-page canonical (injected later by react-helmet-async) arrives second — and is removed.

---

## 3. Exact Fix

### Fix A — `scripts/prerender.js` lines 154–156 area (after `waitForSelector`)

**Current:**
```js
await page.waitForSelector(
  '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
  { timeout: 30000 }
);
await page.evaluate(() => {
```

**Replace with:**
```js
await page.waitForSelector(
  '[data-testid="hero"], [data-testid$="-hero"], [data-testid$="-page"], [data-testid^="legal-page"]',
  { timeout: 30000 }
);
// Wait for react-helmet-async to commit <title> update before snapshot.
// The shell default title is 'POS System for Restaurants...' — wait until it changes.
// Non-fatal: homepage itself legitimately has this title.
await page.waitForFunction(
  () => document.title !== 'POS System for Restaurants & Cafes | Best Billing Software - MyGenie',
  { timeout: 5000 }
).catch(() => {});
await page.evaluate(() => {
```

**Lines changed:** +5 lines inserted after `waitForSelector` block.

---

### Fix B — `scripts/prerender.js` canonical deduplication (inside `page.evaluate`)

**Current:**
```js
// ── NEW 4: deduplicate canonical links (react-helmet injects multiple copies) ─
const canonicals = document.querySelectorAll('link[rel="canonical"]');
Array.from(canonicals).slice(1).forEach((c) => c.remove());
```

**Replace with:**
```js
// ── NEW 4: deduplicate canonical links — keep LAST (react-helmet), remove earlier ones ─
const canonicals = document.querySelectorAll('link[rel="canonical"]');
Array.from(canonicals).slice(0, -1).forEach((c) => c.remove());
```

**Lines changed:** 1 line modified (`.slice(1)` → `.slice(0, -1)`).

---

## 4. Post-Fix Pipeline

After both fixes are made:
```bash
cd /app/frontend && node scripts/prerender.js
sudo supervisorctl restart frontend
```

Then verify:
```bash
python3 << 'PYEOF'
import re, json
from pathlib import Path
build = Path("/app/frontend/build")
SHELL_TITLE = "POS System for Restaurants"
errors = []
for f in sorted(build.rglob("index.html")):
    route = str(f.relative_to(build).parent)
    route = "/" if route == "." else "/" + route
    html = f.read_text(errors="ignore")
    title = re.search(r'<title>(.*?)</title>', html)
    canon = re.search(r'<link rel="canonical" href="([^"]*)"', html)
    t = title.group(1) if title else "MISSING"
    c = canon.group(1) if canon else "MISSING"
    if SHELL_TITLE in t and route != "/":
        errors.append(f"BAD TITLE: {route}")
    if c == "https://www.mygenie.online/" and route != "/":
        errors.append(f"BAD CANON: {route}")
if errors:
    for e in errors: print("FAIL", e)
else:
    print(f"PASS — all {sum(1 for _ in build.rglob('index.html'))} pages have unique titles and canonicals")
PYEOF
```

Expected: `PASS — all 53 pages have unique titles and canonicals`

---

## 5. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `scripts/prerender.js` | Add `waitForFunction` for title | +5 |
| `scripts/prerender.js` | Fix canonical dedup: `.slice(1)` → `.slice(0, -1)` | 1 modified |

---

## 6. Definition of Done

- [ ] `node scripts/prerender.js` completes without errors
- [ ] Verify script: 0 pages with shell title (except homepage itself)
- [ ] Verify script: 0 pages with homepage canonical (except homepage itself)
- [ ] `/pricing/index.html` title = `"MyGenie POS Pricing | Transparent Restaurant POS Plans & Add-ons"`
- [ ] `/solutions/restaurants/index.html` canonical = `"https://www.mygenie.online/solutions/restaurants"`
- [ ] `/blog/improve-table-turnover-pos-order-management/index.html` has its own title and canonical
- [ ] No duplicate `<meta name="description">` tags

---

*CR-133 registered 2026-08-24. Source: PRERENDER_SEO_AUDIT_2026-08-24.md. P0 — must fix before next production deploy.*
