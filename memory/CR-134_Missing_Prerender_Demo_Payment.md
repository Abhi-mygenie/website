# CR-134 — /demo, /leads, /payment-success Not Prerendered — Homepage HTML Served as Fallback

**Type:** Bug / UX / Prerender Coverage
**Date Raised:** 2026-08-24
**Raised By:** Prerender SEO Audit (PRERENDER_SEO_AUDIT_2026-08-24.md)
**Status:** OPEN
**Priority:** HIGH (for /demo — paid ad traffic), LOW (for /leads, /payment-success)
**Effort:** ~5 min code + 3 min re-prerender
**Improves:** Google Ads Quality Score · Landing Page Experience · UX on ad clicks
**Scope:** `frontend/scripts/prerender.js`
**Related:** CR-133 (prerender head tag poisoning), CR-126 (lock prerender in build pipeline)

---

## 1. Problem Statement

Three app routes are absent from the prerendered build:

| Route | Build file | Static server fallback |
|-------|-----------|----------------------|
| `/demo` | ❌ NOT built | `build/index.html` = **homepage prerender** |
| `/leads` | ❌ NOT built | `build/index.html` = **homepage prerender** |
| `/payment-success` | ❌ NOT built | `build/index.html` = **homepage prerender** |

The `prerender.js` script builds its route list by reading `sitemap.xml`. These three routes are not in the sitemap (correctly, for SEO). But as a side-effect, they're also not prerendered.

When the static server receives a request for `/demo` (e.g., from a Google Ads click), it serves `build/index.html` — the homepage prerender. The visitor sees:

```
[t=0ms]    Static server → homepage HTML served
           Browser renders: "Run a more profitable hospitality business — from your phone"
           TrustBand shows, hero image loads, ProofSection appears
[t=1500ms] React JS bundle downloads + executes
[t=2000ms] React hydrates → realises route is /demo → renders demo form
           Transition: homepage content disappears, demo form appears
```

This 1.5–2s flash of homepage content on a paid ad landing page:
- **Increases bounce rate** (visitor thinks they landed on wrong page)
- **Harms Google Ads Quality Score** (LP Experience tracks first paint relevance)
- **Wastes ad spend** (clicks that bounce due to wrong first impression)

---

## 2. Why This Happens

`prerender.js` derives its ROUTES array from `sitemap.xml`:
```js
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
})();
```

`/demo`, `/leads`, `/payment-success` are not in `sitemap.xml` (correct — `/demo` is `noindex`, `/leads` and `/payment-success` are internal). So the prerender script never visits them.

---

## 3. Fix

Add the three routes explicitly to the prerender ROUTES list, AFTER the sitemap routes, with a comment explaining they're intentionally not in the sitemap but should be prerendered for UX:

### `scripts/prerender.js` — lines 8–12 (ROUTES definition)

**Current:**
```js
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
})();
```

**Replace with:**
```js
const ROUTES = (() => {
  const xml = fs.readFileSync(path.resolve(__dirname, "../public/sitemap.xml"), "utf8");
  const sitemapRoutes = [...xml.matchAll(/<loc>https:\/\/www\.mygenie\.online([^<]*)<\/loc>/g)]
    .map(m => m[1] || "/");
  // Routes not in sitemap (noindex or transactional) but prerendered for UX / ad LP speed.
  const extraRoutes = ["/demo", "/payment-success"];
  return [...sitemapRoutes, ...extraRoutes];
})();
```

**Note on `/leads`:** The leads page is an internal CRM dashboard (admin-only). It does not receive external traffic and does not need prerendering. Excluded from `extraRoutes`.

**Note on `/demo` prerender selector:** `DemoLanding.jsx` renders `data-testid="demo-landing-page"`. The existing `waitForSelector` pattern `[data-testid$="-page"]` will match this. No selector change needed.

**Note on `/payment-success` prerender selector:** `PaymentSuccess.jsx` should have `data-testid="payment-success-page"` — verify before merging.

---

## 4. Post-Fix Verification

```bash
# After prerender:
ls /app/frontend/build/demo/index.html          # should exist
ls /app/frontend/build/payment-success/index.html  # should exist

# Check /demo prerendered content (should show demo form, NOT homepage hero)
python3 -c "
html = open('/app/frontend/build/demo/index.html').read()
print('Demo form present:', 'demo-landing-page' in html)
print('Homepage hero NOT present:', 'hero-badge' not in html)
print('Homepage H1 NOT present:', 'Run a more profitable' not in html)
"
```

---

## 5. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `scripts/prerender.js` | Add `extraRoutes` to ROUTES | +3 |

---

## 6. Definition of Done

- [ ] `build/demo/index.html` exists after prerender
- [ ] `build/payment-success/index.html` exists after prerender
- [ ] `/demo` prerendered content shows demo form, NOT homepage hero
- [ ] `/demo` visiting in browser: no homepage flash before demo form appears
- [ ] `/demo` still has `noindex` meta tag (from `<Seo noindex={true} />`) — not indexed despite being prerendered
- [ ] Total prerendered routes: 55 (53 sitemap + 2 extra)

---

*CR-134 registered 2026-08-24. Source: PRERENDER_SEO_AUDIT_2026-08-24.md. HIGH priority for /demo (paid ad LP). LOW for /payment-success.*
