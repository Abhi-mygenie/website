# CR-140 — 404 Pages Serve Homepage HTML (No Dedicated 404 Prerender)

**Type:** Technical SEO / UX Bug
**Date Raised:** 2026-08-24
**Raised By:** Crawlability Audit — August 2026
**Status:** OPEN
**Priority:** MEDIUM
**Effort:** ~15 min
**Improves:** SEO · Crawl Signals · UX
**Scope:** `frontend/scripts/prerender.js`, `frontend/src/pages/NotFound.jsx`
**Related:** CR-79 (soft 404 → real HTTP 404), CR-133 (prerender head tag fix)

---

## 1. Problem Statement

The audit reported: `/product/billing routing bug — serves homepage content`.

**Current behaviour:**
1. `static-server.js` correctly returns **HTTP 404** for unrecognised routes (fixed in CR-133 batch)
2. BUT the 404 **body content is the homepage prerendered HTML** (`build/index.html`)
3. So a crawler fetching `/product/billing` or any fake URL receives:
   - HTTP 404 ✅
   - HTML body: homepage title, homepage H1, homepage canonical ❌

**Why:** `build/index.html` is the homepage prerender. When static-server falls back to this file for unrecognised routes, it serves the homepage content. There is no `build/404/index.html` or `build/not-found/index.html`.

**Google's perspective:** Even with a 404 status code, serving a page whose prerendered content is the homepage (with homepage canonical `https://www.mygenie.online/`) sends a confusing signal. Google may spend crawl budget on these, or the console may flag "Crawled – currently not indexed" with confusing page content.

**User perspective:** A user who lands on `/product/billing` via a bad link sees the homepage momentarily (until React hydrates and renders `<NotFound />`), creating a confusing flash.

---

## 2. Root Cause

`NotFound.jsx` exists in `src/pages/NotFound.jsx` and is registered in App.js as `<Route path="*" element={<NotFound />} />`. It renders a proper 404 page with `data-testid`. BUT it was never prerendered because `prerender.js` reads routes from `sitemap.xml` — and `*` / `404` is not in the sitemap.

---

## 3. Fix

### Fix A — Prerender the NotFound page
Add a 404 route to `prerender.js` extra routes:

```js
const extraRoutes = ["/demo", "/payment-success", "/404"];
```

This requires `NotFound.jsx` to render when the URL is `/404`. Check whether React Router renders `<NotFound />` at `/404` — it will if no other route matches.

### Fix B — Update static-server.js to serve the 404 prerender

```js
// When SPA fallback (isSpaFallback=true), try build/404/index.html first
const notFoundFile = path.join(DIR, "404", "index.html");
file = fs.existsSync(notFoundFile) ? notFoundFile : path.join(DIR, "index.html");
```

### Combined result:
- `build/404/index.html` = prerendered NotFound page (correct title "Page Not Found", no homepage canonical, correct content)
- Static server serves this for all 404 routes
- HTTP status still 404

---

## 4. Check: What does NotFound.jsx render?

Before implementing, verify:
```bash
grep -n "data-testid\|title\|h1\|Seo" /app/frontend/src/pages/NotFound.jsx | head -10
```

If `NotFound.jsx` has no `<Seo>` component, add one with:
- `title="Page Not Found | MyGenie POS"`
- `path="/404"`
- `noindex={true}`

---

## 5. Files Changed

| File | Change |
|------|--------|
| `scripts/prerender.js` | Add `/404` to extraRoutes |
| `scripts/static-server.js` | Serve `build/404/index.html` for SPA fallbacks instead of `build/index.html` |
| `src/pages/NotFound.jsx` | Add `<Seo>` with noindex if missing |

---

## 6. Definition of Done

- [ ] `build/404/index.html` exists after prerender
- [ ] `curl -I [url]/fake-page` → HTTP 404 (unchanged)
- [ ] `curl [url]/fake-page` body → 404 page content (NOT homepage content)
- [ ] 404 page has `noindex` meta tag
- [ ] 404 page has its own canonical (not homepage canonical)
- [ ] No regression: real pages still return 200 with correct content

---

*CR-140 registered 2026-08-24. Source: Crawlability Audit August 2026.*
