# CR-140 — Impact Analysis: 404 Pages Serve Homepage HTML

**Date:** 2026-08-24
**Files read:** `NotFound.jsx` (45 lines), `prerender.js` (111 lines), `static-server.js` (57 lines), `App.js` (routes section)
**Status:** Analysis complete — no code changed

---

## 1. Current State

### What happens when a crawler hits `/product/billing` (or any fake URL)

```
Request: GET /product/billing
static-server.js:
  → build/product/billing doesn't exist
  → isSpaFallback = true
  → file = build/index.html (homepage prerender)
  → HTTP 404 status ✅
  → body = homepage HTML ❌ (title: homepage, canonical: homepage, H1: homepage)
```

**Status code is correct (404). Body content is wrong (homepage).**

Google sees: "This URL doesn't exist (404), but its HTML says it's the homepage and its canonical says `https://www.mygenie.online/`." Confusing crawl signal.

### Why NotFound.jsx was never prerendered

`prerender.js` reads routes from `sitemap.xml`. The React Router route for 404 is `<Route path="*" element={<NotFound />} />`. The wildcard `*` is not a URL — it has no sitemap entry.

The `extraRoutes` array currently has `["/demo", "/payment-success"]`. `/404` was never added.

---

## 2. NotFound.jsx — Complete Audit (45 lines, fully read)

```jsx
export default function NotFound() {
  return (
    <div className="bg-white" data-testid="not-found-page">
      <Seo
        title="Page Not Found | MyGenie POS"
        description="The page you're looking for doesn't exist."
        noindex={true}
      />
      ...
```

**Already has:**
- ✅ `data-testid="not-found-page"` — matches `[data-testid$="-page"]` in prerender.js `waitForSelector`
- ✅ `<Seo>` with correct title and `noindex={true}`
- ✅ Full Navbar + Footer
- ✅ Back to Home link

**Missing:**
- `path` prop on `<Seo>` (defaults to `""` → canonical = `https://www.mygenie.online/`). For a noindex page this doesn't matter, but adds consistency. Add `path="/404"`.

**Will React Router render NotFound at `/404`?**
YES — `<Route path="*">` catches ALL unmatched routes, including `/404`. When Puppeteer visits `http://localhost:4321/404`, the router matches `path="*"` and renders `<NotFound />`. Confirmed by code: `App.js` line 96: `<Route path="*" element={<NotFound />} />`.

---

## 3. Fix — 3 Positions Across 2 Files

### Fix A — `NotFound.jsx` — Add `path="/404"` to Seo call

**Current (lines 9–13):**
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

**Why:** Sets canonical to `https://www.mygenie.online/404` instead of the homepage URL. Since `noindex=true`, it won't be indexed, but it prevents the confusing homepage canonical signal.

**Lines changed:** +1 line (add `path="/404"`)

---

### Fix B — `scripts/prerender.js` — Add `/404` to extraRoutes

**Current (lines 12–15 after previous changes):**
```js
const extraRoutes = ["/demo", "/payment-success"];
```

**Replace with:**
```js
const extraRoutes = ["/demo", "/payment-success", "/404"];
```

**Why:** This instructs Puppeteer to visit `http://localhost:4321/404` during prerender. React Router renders `<NotFound />` there. The `waitForSelector` finds `[data-testid="not-found-page"]` (matches `[data-testid$="-page"]`). The snapshot is saved to `build/404/index.html`.

**Lines changed:** 1 word (add `"/404"` to array)

---

### Fix C — `scripts/static-server.js` — Serve `build/404/index.html` for SPA fallbacks

**Current (lines 36–51):**
```js
if (!fs.existsSync(file)) {
  isSpaFallback = true;
  file = path.join(DIR, "index.html");                        // unknown route → 404 + shell
} else if (fs.statSync(file).isDirectory()) {
  ...
  } else {
    isSpaFallback = true;
    file = path.join(DIR, "index.html");                      // directory without index → 404
  }
} catch (e) {
  isSpaFallback = true;
  file = path.join(DIR, "index.html");
}
```

**Replace ALL three `file = path.join(DIR, "index.html")` inside `isSpaFallback = true` blocks with:**
```js
const notFoundPage = path.join(DIR, "404", "index.html");
file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
```

**Full updated try-catch block:**
```js
let isSpaFallback = false;
const notFoundPage = path.join(DIR, "404", "index.html");  // ← define once, before try
try {
  if (!fs.existsSync(file)) {
    isSpaFallback = true;
    file = fs.existsSync(notFoundPage) ? notFoundPage : path.join(DIR, "index.html");
  } else if (fs.statSync(file).isDirectory()) {
    const dirIndex = path.join(file, "index.html");
    if (fs.existsSync(dirIndex)) {
      file = dirIndex;
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

**Why `fs.existsSync(notFoundPage)` guard?** On first run (before prerender), `build/404/index.html` doesn't exist. The guard falls back to `build/index.html` for safety. After prerender, it correctly serves the 404 page.

**Lines changed:** +1 line (notFoundPage declaration) + 3 file assignments updated

---

## 4. Dependency Order

Steps MUST be in this order:
1. Fix `NotFound.jsx` (add `path`)
2. `yarn build` (compiles NotFound with correct Seo path)
3. Add `/404` to `prerender.js` extraRoutes
4. `node scripts/prerender.js` (creates `build/404/index.html`)
5. Update `static-server.js` to serve 404 page
6. Restart frontend

Note: `static-server.js` change is runtime-only (no rebuild needed — it's Node.js, not React). But since we're already building for the other CRs, it happens in the same cycle.

---

## 5. Verification

```bash
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)

# 1. Build/404 prerendered
ls /app/frontend/build/404/index.html && echo "404 page prerendered"

# 2. Fake URL returns 404 status WITH 404 page content (not homepage)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/this-is-fake")
TITLE=$(curl -s "$BACKEND_URL/this-is-fake" | python3 -c "import sys,re; m=re.search(r'<title>(.*?)</title>',sys.stdin.read()); print(m.group(1) if m else 'NONE')")
echo "Status: $STATUS | Title: $TITLE"
# Expected: Status: 404 | Title: Page Not Found | MyGenie POS

# 3. Real routes unaffected
STATUS_PRICING=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/pricing")
echo "Pricing status: $STATUS_PRICING"  # Expected: 200
```

---

## 6. Change Summary

| File | Change | Lines |
|------|--------|-------|
| `src/pages/NotFound.jsx` | Add `path="/404"` to `<Seo>` | +1 line |
| `scripts/prerender.js` | Add `"/404"` to extraRoutes | 1 word |
| `scripts/static-server.js` | Serve 404 page for fallbacks | +1 line, 3 edits |
| **Total** | | **+2 lines, 5 edits** |

---

*CR-140 impact analysis written 2026-08-24.*
