# CR-101 POC — RESULTS (Homepage `/` Prerender)

**Date:** 2026-06 · **Status:** ✅ Core goal achieved · Executed in preview only, no production impact.

## What was executed (per line-by-line plan)
- `puppeteer-core@21.11.0` added as devDependency (Node-20 compatible; uses system Chrome — no Chromium download).
- `frontend/scripts/prerender.js` created + `"prerender"` script in package.json.
- `Hero.jsx` — 5 `motion` `initial` props set to resolved state (`opacity:1`) so the LCP element paints from HTML and is never re-hidden on hydration.
- `public/index.html` — `posthog.init(...)` deferred to `load` + `requestIdleCallback`.
- `yarn build` → `yarn prerender` → `build/index.html` for `/` regenerated.

## Structural validation (the definitive POC outcome) — ALL PASS
| Gate | Before | After |
|---|---|---|
| Hero sub-heading text in raw HTML | 0 | ✅ present |
| Hero H1 in raw HTML | absent | ✅ present |
| LCP `<p>` inline style | (not in HTML) | ✅ `opacity: 1; transform: none` (visible, not re-hidden) |
| JSON-LD in raw HTML | absent | ✅ Organization + SoftwareApplication + 3×Offer + ContactPoint |
| `<title>` count | 1 (base) | ✅ 1 (Helmet, deduped) |
| External analytics `<script src>` baked | — | ✅ 0 (inline deferred loader only) |
| Hydration (nav dropdown, consent, CTAs) | — | ✅ healthy (verified via headless Chrome + screenshot) |

**⇒ The CSR render-delay architecture is fixed: the empty `<div id="root">` is gone; the hero content and structured data are in the first HTML response.**

## New finding — the LCP element is now the HERO IMAGE (not text)
- With text no longer gated behind JS, the largest element becomes the hero image:
  `<img ... class="w-full h-[420px] object-contain" fetchpriority="high" loading="eager" src="/api/cms/media/435e66d8...png">`
- **It is NOT preloaded** (0 preload links) and is a **PNG served dynamically from the backend CMS** (`/api/cms/media/...`), not a static/optimized WebP.
- This is now the remaining LCP lever — a normal image-optimization problem, NOT an architecture problem.

## Honest caveat on local numbers
Local lab LCP/FCP values are **not GTmetrix-comparable**: (a) no network throttling, (b) the CSR "before" ran on the unminified dev build, and (c) crucially the backend `/api/cms/media/...` image **404'd on the static test server**, so the measured "IMG LCP" was a broken placeholder. Millisecond deltas must be confirmed on a real deploy / GTmetrix. The reliable evidence here is **structural** (raw-HTML content + no re-hide), which is exactly what removes the 5.2s render delay.

## Recommended completion step (to actually land LCP < 2.5s on GTmetrix)
1. **Auto-preload the hero image in the prerender step** — the script already renders the page, so it can read the hero `<img src>` and inject `<link rel="preload" as="image" fetchpriority="high" href=...>` into the snapshot `<head>`. Keeps everything inside the prerender approach; no component change.
2. **Serve the hero image as a compressed WebP** (the CMS media is a PNG today).
3. Re-measure on a real deploy, then use this homepage as the template for the 51-route rollout.

## Rollback (still fully reversible)
`git checkout src/components/home/Hero.jsx public/index.html package.json` · `rm scripts/prerender.js` · `yarn install` · `rm -rf build && yarn build`.

## Files touched
- NEW: `frontend/scripts/prerender.js`
- MOD: `frontend/package.json`, `frontend/yarn.lock`, `frontend/src/components/home/Hero.jsx`, `frontend/public/index.html`
- Artifact: `frontend/build/index.html` (prerendered `/`)
