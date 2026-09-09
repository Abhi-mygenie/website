# CR-129 — Cache Headers for Static Assets in static-server.js

**Type:** Performance / Caching
**Date Raised:** 2026-08-24
**Status:** 🔲 OPEN
**Priority:** P1
**Effort:** ~10 lines
**Improves:** "Serve static assets with an efficient cache policy" Lighthouse diagnostic · repeat visit performance
**Score gain:** +1 pt (first visit) / +5–10 pts (repeat visits)
**Scope:** `frontend/scripts/static-server.js`
**Related:** CR-116 (gzip compression — done)

---

## Problem Statement

Lighthouse flags: **"Serve static assets with an efficient cache policy — 1 resource found"**

The current `static-server.js` (after CR-116 gzip fix) serves all files with no `Cache-Control` header. Every page load, every asset is fetched fresh. This means:

1. **Repeat visitors** re-download JS (258KB gzip), CSS, fonts on every visit — unnecessary
2. **Lighthouse penalises** assets with no cache policy in best practices score
3. **Browser cannot** serve from disk cache on navigations

On `beta.mygenie.online`, Cloudflare handles caching automatically. But for the preview URL (and for correctness in production) `static-server.js` should serve proper headers.

---

## Caching Strategy

CRA generates **content-hashed** filenames for JS and CSS:
```
/static/js/main.6422cb14.js     ← hash in filename
/static/css/main.abc123de.css   ← hash in filename
```

Content-hashed files: **immutable** — if content changes, filename changes. Cache forever.
HTML files: **no cache / short cache** — must be fresh (contains the canonical URL and prerendered content).
Fonts/images in `/fonts/` and `/brand/`: long cache, content doesn't change frequently.

---

## Exact Change — `static-server.js`

```js
// Add after file path resolution, before res.writeHead():

function getCacheControl(filePath) {
  // Hashed assets: immutable for 1 year
  if (/\/static\/(js|css|media)\//.test(filePath)) {
    return "public, max-age=31536000, immutable";
  }
  // Fonts: long cache (content doesn't change)
  if (/\/fonts\//.test(filePath)) {
    return "public, max-age=31536000, immutable";
  }
  // Images: 1 week
  if (/\/brand\//.test(filePath)) {
    return "public, max-age=604800";
  }
  // HTML: no cache — always fresh (prerendered content)
  if (filePath.endsWith(".html")) {
    return "no-cache";
  }
  // Everything else: 1 hour
  return "public, max-age=3600";
}

// Then add to headers:
headers["Cache-Control"] = getCacheControl(file);
```

---

## Definition of Done

- [ ] Lighthouse "Serve static assets with an efficient cache policy" warning resolved
- [ ] `/static/js/main.*.js` response includes `Cache-Control: public, max-age=31536000, immutable`
- [ ] `/` (HTML) response includes `Cache-Control: no-cache`
- [ ] Repeat visit loads JS from browser disk cache (DevTools → Network → "from disk cache")

---

*CR-129 registered 2026-08-24. Identified from Lighthouse diagnostics on preview URL after gzip fix.*
