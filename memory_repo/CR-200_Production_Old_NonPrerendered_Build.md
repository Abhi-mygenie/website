# CR-200 — Production `www.mygenie.online` Serving Old Non-Prerendered Build

**Registered:** 2026-09-02  
**Source:** GA/GTM gap investigation (direct curl of production HTML)  
**Status:** 🔲 Open — 👤 Owner action (deploy current build to production server)  
**Priority:** P0  
**Owner:** Owner (production deploy)

---

## Evidence

```bash
curl -s https://www.mygenie.online/ | grep -E 'root|static/js'
```

Production response:
```html
<div id="root"></div>                         ← EMPTY — no prerendered content
<script defer src="/static/js/main.cf3fd6a7.js">  ← OLD build hash
```

Current repo build (`build/index.html`):
```html
<div id="root"><div class="App"><header ...>...</header><main>...</main></div></div>
  ← FULL prerendered HTML — navbar, hero, schema, OG tags all present
<script defer src="/static/js/main.59f06f2f.js">  ← NEWER build hash
```

---

## What This Means

Production is running a build **from before the prerender pipeline was introduced** (CR-101 era). At least 40+ CRs have been implemented and built in this repo since that production deployment. The production server was never updated.

### Comparison: Production vs. Repo Build

| Feature | Production `www.mygenie.online` | Repo `build/` (current) |
|---|---|---|
| `<div id="root">` content | Empty | Full HTML (nav + hero + sections) |
| JS bundle hash | `cf3fd6a7` (old) | `59f06f2f` (new) |
| Fonts | Google Fonts CDN (blocking) | Self-hosted woff2 + preloads |
| PostHog | Loads synchronously (blocking) | Deferred 6s / on interaction |
| Prerendered routes | 0 | 63 routes |
| JSON-LD schema | Not in HTML | 3 blocks per page |
| OG / Twitter meta | In HTML (partial) | Full per-page from react-helmet |
| Self-hosted font preloads | None | 6 font preloads in `<head>` |
| `fetchPriority` on hero img | Missing | Present (CR-71, CR-192) |

### Consequence for GTM/GA

Even if CR-198 and CR-199 are implemented in this repo, **the production site will continue to have the old non-prerendered build** until a deploy happens. The GA tracking gap persists on production until this CR is resolved.

### Consequence for SEO / LCP

Google currently sees `<div id="root"></div>` — no text content. LCP = ~8–13s (JS bundle parse + React execute + first meaningful paint). Googlebot may be JavaScript-rendering the page, but:

1. JavaScript rendering is deferred by Googlebot (queued, not immediate)
2. Social crawlers (WhatsApp, Facebook, LinkedIn) do NOT execute JavaScript — they see a blank page
3. PageSpeed Insights runs on the non-JS-rendered HTML → Lighthouse Performance penalised

---

## Affected URLs

All 63 prerendered routes — the entire production site at `www.mygenie.online`.

---

## Fix

**Owner action** — deploy the current `build/` directory to the production web server.

### Build command (run in this Emergent pod or on the production build machine):
```bash
cd /app/frontend && REACT_APP_BACKEND_URL=https://www.mygenie.online yarn build
# Build output: /app/frontend/build/ (~63 prerendered routes)
```

Note: Set `REACT_APP_BACKEND_URL=https://www.mygenie.online` (not beta) for production build.

### Deploy:
Copy `/app/frontend/build/` to the production web server's document root (replacing the existing static files). Exact steps depend on production server setup (S3, nginx, etc.).

### Verify (after deploy):
```bash
curl -s https://www.mygenie.online/ | grep "navbar\|hero\|Restaurant POS"
# Expected: real HTML content visible
```

---

## Related CRs

| CR | Relation |
|---|---|
| CR-101 | Prerender pipeline introduction (now fully working) |
| CR-126 | Prerender not locked in deploy pipeline — the CI/build step that prevents this |
| CR-198 | GTM ID missing from env — also needed for the production build |
| CR-199 | GTM useEffect firing late — also needed for the production build |
| CR-180 | Domain canonical strategy — decide `www` vs `beta` before setting `REACT_APP_SITE_URL` |

---

## Notes

- This is an **owner infrastructure action** — no code changes are possible from the Emergent pod that would fix production.
- CR-126 (prerender not locked in deploy pipeline) is the long-term systemic fix: automating the prerender step in CI so every deploy automatically includes prerendering.
- Until CR-200 is resolved, all CWV / SEO improvements built in this repo (CR-114 through CR-197) are not visible to real users on `www.mygenie.online`.
