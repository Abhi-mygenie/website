# CR-217 — Production nginx: Brand & Static Assets Served with 4h Cache TTL

**Registered:** 2026-09-05
**Source:** Production Lighthouse audit — `www.mygenie.online` — 40 resources found with short cache TTL
**Status:** 🔲 Open — 👤 Owner action (production nginx config)
**Priority:** P1
**Owner:** Production server / nginx config access
**File:** Production nginx site config (not in this repo)

---

## 1. Problem

Production is serving **40 resources** with only **4-hour cache TTL** (`Cache-Control: max-age=14400`).
These include all `/brand/` image assets (logos, banners, trust band images).

**From Lighthouse screenshot:**

| Resource type | Files affected | Cache TTL | Should be |
|---|---|---|---|
| `/brand/banner.webp` (38 KiB) | 1 | 4h | **7 days** |
| `/brand/*.webp` (logo images, 2–5 KiB each) | ~37 | 4h | **7 days** |
| `/static/js/main.*.js` (401 KiB) | 1 | unknown | **1 year, immutable** |
| `/static/css/main.*.css` | 1 | unknown | **1 year, immutable** |
| **Total uncached** | **40 resources** | 4h | — |

The production nginx is overriding (or not forwarding) the Node.js `static-server.js`
cache headers. `static-server.js` is configured to serve:
```js
// From scripts/static-server.js:
if (/\/static\/(js|css|media)\//.test(filePath))
    return "public, max-age=31536000, immutable";   // 1 year
if (/\/fonts\//.test(filePath))
    return "public, max-age=31536000, immutable";   // 1 year
if (/\/brand\//.test(filePath))
    return "public, max-age=604800";               // 7 days
if (filePath.endsWith(".html"))
    return "no-cache";
return "public, max-age=3600";
```

But production nginx is not proxying to the Node.js static-server — it's likely serving
files directly with a global 4h cache header, bypassing the app's cache configuration.

---

## 2. Impact of Current 4-Hour Cache

Every return visitor after 4 hours must re-download all 40 resources:
- Trust band logos (56 logos × avg 3 KiB = 168 KiB)
- Hero banner (38 KiB)
- Other brand assets

**Total re-downloaded on each return visit:** ~466 KiB (confirmed from screenshot — 466 KiB 1st-party uncached)

**Return visit page load time increase:** ~800ms–1.5s extra on mobile 4G.

---

## 3. Fix — nginx Cache Headers

Add to the production nginx site config:

```nginx
# Content-hashed assets (JS, CSS, media) — safe to cache forever, filenames change with content
location ~* ^/static/(js|css|media)/ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Vary "Accept-Encoding";
}

# Font files — safe to cache long-term (filename doesn't change but content rarely does)
location ~* ^/fonts/ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# Brand images (logos, banners) — 7 days
# Files can change (new logo, updated banner) so NOT immutable
location ~* ^/brand/ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
    add_header Vary "Accept-Encoding";
}

# HTML files — no cache (content changes with every deploy)
location ~* \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    expires 0;
}
```

**Alternative: Cloudflare Cache Rule (CF-5, owner action):**
If production is behind Cloudflare, a Cache Rule is simpler and doesn't require nginx changes:
- `Path starts with /static/` → Edge TTL: 1 year, Browser TTL: 1 year
- `Path starts with /brand/` → Edge TTL: 7 days, Browser TTL: 7 days
- `Path starts with /fonts/` → Edge TTL: 1 year, Browser TTL: 1 year

**Both nginx + CF-5 together is ideal** — nginx sets the origin headers, Cloudflare CDN
respects and extends them to edge nodes globally.

---

## 4. Why `/brand/` is NOT `immutable`

`/static/js/main.1ba1a67c.js` has a content hash in the filename — if the code changes,
the filename changes, so browsers can safely cache forever (`immutable`).

`/brand/banner.webp`, `/brand/abbiesgarden.webp` etc. do NOT have content hashes. If
a logo is updated, the same URL serves new content. Therefore:
- `max-age=604800` (7 days) is correct — long enough to benefit return visitors,
  short enough that logo updates propagate within a week.
- Do NOT use `immutable` for `/brand/` files.

---

## 5. Why This Wasn't a Problem on the Pod

The pod's `static-server.js` correctly serves `Cache-Control: public, max-age=604800`
for `/brand/` files. Lighthouse on the preview URL showed **1 resource** without
efficient cache (the Cloudflare beacon), not 40. The production nginx is the gap.

---

## 6. Impact After Fix

| Metric | Before | After |
|---|---|---|
| Resources without cache policy | 40 | 0–3 (only 3rd-party) |
| Return visitor page load | Full re-download ~466 KiB | Served from cache instantly |
| Lighthouse "cache policy" flag | ⚠️ 40 resources | ✅ 0 resources |
| Lighthouse score (repeat visits) | Lower | +1-2 pts |
| CDN bandwidth cost | High (every visitor re-downloads) | Low (edge cache hits) |

---

## 7. Summary

| Item | Detail |
|---|---|
| Action | Add nginx cache headers for `/static/`, `/brand/`, `/fonts/` |
| Alternative | CF-5 Cloudflare Cache Rule (same result, no nginx access needed) |
| Code change | None |
| Expected saving | 466 KiB → 0 KiB per return visit |
| Risk | Very low — brand files use 7d (not immutable), safe for updates |
| Who | Owner with nginx or Cloudflare access |

*Registered 2026-09-05. Source: Production Lighthouse — 40 resources, 466 KiB, 4h TTL.*
