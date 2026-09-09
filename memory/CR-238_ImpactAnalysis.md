# CR-238 — Blank-page flash on direct load of lazy routes (`/product`, `/pricing`, `/solutions/*`, all ad LPs)

*Investigated 2026-09-09 (Session 10). Status: IMPLEMENTED 2026-09-08 (Option C, C1+C2). Verified via MutationObserver trace + testing_agent iteration_2 (all pass).*

## 1. Reproduction (measured, not assumed)

MutationObserver trace on `#root` for a direct load of `/product` (local, warm cache):

| t (ms) | Event | `#root` innerHTML | Fallback visible | Hero visible |
|---|---|---|---|---|
| 12 | DOMContentLoaded | 41,825 chars (prerendered page) | no | **yes** |
| 26 | React first commit | 1,531 chars | **yes** (`bg-brand-sand`) | **no** |
| ~40+ | page chunk loaded, 2nd commit | full page | no | yes |

Network order: `main.f34b1dbf.js` (409 KB / 127 KB gz) finishes → *then* 4 chunks start
(`192` ProductIndex 8 KB · `966` shared 45 KB · `682` Calendly 19 KB · `100` 5 KB; ≈29 KB gz total).
The chunks are **serialised behind main.js** — nothing in the prerendered `<head>` references them.

On a real 4G connection: main.js ≈ 0.5–0.8 s, then chunk RTT + download + parse ≈ 0.4–1 s → **the blank window the owner sees is exactly the chunk phase (≈1–2 s)**. Content → blank → content.

## 2. Root cause chain (why previous fixes did not remove it)

| CR | What it did | Effect on this flash |
|---|---|---|
| CR-124/125 | Added per-route `LP` Suspense fallback (`min-h-screen bg-brand-sand`) | Under `hydrateRoot` the fallback **never painted on direct load** — React keeps server HTML on screen while a lazy chunk resolves during hydration. Fallback only showed on client-side nav (correct "loading" state). |
| **CR-205** | `hydrateRoot` → `createRoot` (to kill React #418) | **Regression introduced here.** `createRoot` does not reconcile against existing DOM; on first commit it *replaces* `#root` children with whatever React rendered. For a lazy route the first render suspends → the fallback is committed → prerendered content is wiped and replaced by a sand-coloured empty div until the chunk arrives. |
| CR-237 | `Reveal.jsx` skips `opacity:0` for above-fold elements | Fixed a *second, stacked* flash (100–500 ms) that happened *after* the chunk arrived. Correct fix, but it could never touch the Suspense window that precedes it. |

Conclusion: the remaining flash is 100 % the `createRoot` + `lazy()` + `LP` fallback combination. It affects **every route except `/`** (Home is a static import). It is *not* a Reveal issue, not a CSS issue, not a prerender-content issue (the prerendered HTML is complete and correct — trace row 1).

## 3. Options evaluated

### Option A — Un-lazy the "top 5" routes (previous proposal)
- Removes `lazy()` for `ProductIndex`, `SolutionsIndex`, `Pricing`, `About`, …
- ✅ Simple, no new mechanism.
- ❌ Partial: every other route (`/product/:bucket`, `/solutions/:slug`, 6 Google-Ads LPs, blog, contact…) keeps the flash.
- ❌ Every un-lazied page is added to `main.js` for **all** visitors — including the ad LPs where Lighthouse/TBT feeds Ads Quality Score. Un-lazy all 27 routes ≈ main.js 409 KB → ~1.3 MB. Undoes CR-124's whole purpose.
- ❌ Doesn't fix the underlying architectural gap (CR-205 side effect), so any future lazy route re-introduces the bug.
- **Verdict: reject.**

### Option B — Use the prerendered HTML snapshot as the Suspense fallback
- Copy `#root.innerHTML` before `createRoot`, render it via `dangerouslySetInnerHTML` inside `LP`'s fallback on first load.
- ✅ Universal, zero bundle change.
- ❌ Hack: nested `.App` markup, duplicate `id`s, dead (non-interactive) DOM during fallback, must be gated to first-load-only or client-side nav shows the *wrong page* as its loader. Fragile under Helmet/portal changes.
- **Verdict: reject — works, but the kind of fix that becomes the next CR-205.**

### Option C — Resolve the route chunk *before* React's first render, and preload it from `<head>` ✅ RECOMMENDED
Two small, independent parts:

**C1 — `index.js`: await the matching page chunk, then `render()`.**
- New helper `lazyRoute(loader)` (≈10 lines): same as `React.lazy`, plus `.preload()`; once preloaded it renders the component *synchronously* — so `LP`'s Suspense never activates on direct load.
- `index.js`: `preloadRoute(location.pathname)` (uses react-router `matchPath` + the existing `REDIRECTS` map) → `Promise.race([preload, 3 s timeout])` → `createRoot().render(app)`.
- Result: prerendered HTML stays on screen **untouched** until React can commit the *full* page in a single commit → pixel-identical swap → **zero blank frame on all 27 routes.**
- Home (`/`) has no lazy route → renders immediately exactly as today.
- Client-side navigation (Navbar → `/pricing`) is unchanged: `LP` fallback still shows as a legitimate loading state.

**C2 — `prerender.js`: inject `<link rel="preload" as="script">` for the page's chunks.**
- During preload, `index.js` records the `/static/js/*.chunk.js` resources fetched (from `performance.getEntriesByType("resource")`) into `window.__pageChunks` — deterministic, because nothing else runs before `render()`. Puppeteer reads it and appends preload links to `<head>` (same pattern as the CR-233/234 hero-image preload).
- Chunks now download **in parallel with `main.js`** instead of after it → the page is interactive *sooner* than today, not later. `CmsAdminLayer` (158 KB, loads post-mount) is naturally excluded because it's requested after preload resolves.
- Without C2, C1 alone is still flash-free (prerendered HTML visible while chunks load); C2 just claws back the sequential-download latency.

## 4. Impact matrix (Option C)

| Area | Impact |
|---|---|
| Visual on direct load (all routes) | Content → content. Blank window eliminated. |
| Time-to-interactive | Today: main → **blank** → chunk → interactive. New: main ∥ chunk → interactive. Same or earlier. |
| Bundle sizes | Unchanged (chunks stay split; helper ≈ 0.3 KB). |
| CR-205 (`createRoot`, no #418) | Untouched. Still `createRoot`; no hydration attempted. |
| CR-237 (Reveal) | Still required — `createRoot` remount still happens; the CR-237 guard keeps above-fold elements at `opacity:1`. |
| CR-124/125 `LP` fallback | Retained for client-side nav. Comment updated to reflect direct-load path. |
| CR-212 redirect prerenders (`/solutions/bars-and-pubs`) | Preload resolves `REDIRECTS[pathname]` first → target chunk preloaded → no flash after `Navigate`. |
| CR-233/234 hero preload in `prerender.js` | Untouched; new script-preload block sits beside it. |
| SEO / Googlebot | Prerendered HTML identical + extra `<link rel=preload as=script>` tags (standard). |
| Lighthouse (ad LPs) | Neutral-to-positive: fewer render-blocking phases, parallel fetch; no extra bytes. |
| Failure mode (stale chunk hash after a deploy) | Preload rejects → timeout/catch → render proceeds → `lazy()` retries and fails **exactly as today**. No new failure class. |
| Maintenance | Routes move to a single `ROUTES` table (`src/routes.js`) used by both `App.js` and the preloader — a newly added route is automatically covered. If a route is added elsewhere without the table it merely falls back to today's behaviour. |
| Home below-fold lazy sections (9 chunks, `fallback={null}`) | Out of scope. They also vanish/reappear on `createRoot` commit but are below the fold on desktop; can reuse the same preloader later if owner sees it on mobile. |

## 5. Files touched (Option C)

| File | Change | Size |
|---|---|---|
| `src/lib/lazyRoute.js` (new) | `lazyRoute()` helper with `.preload()` and sync render once loaded | ~12 lines |
| `src/routes.js` (new) | `ROUTES` table (path → lazyRoute component → optional props/env gate) + `preloadRoute(pathname)` | ~45 lines |
| `src/App.js` | Replace 27 `lazy()` consts + hand-written `<Route>` list with `ROUTES.map(...)`; keep `LP`, `REDIRECTS`, `*` NotFound, `CmsAdminLayer`, ConsentBanner, WhatsApp gate | −40 / +12 lines |
| `src/index.js` | `preloadRoute(location.pathname)` with 3 s race → `render()`; record `window.__pageChunks` | +10 lines |
| `scripts/prerender.js` | After hero wait: inject `<link rel="preload" as="script" href=…>` for `window.__pageChunks` | +8 lines |

Rebuild required (`yarn build` — craco build + prerender of all routes), then `sudo supervisorctl restart frontend`.

## 6. Verification plan

1. Re-run the `#root` MutationObserver trace on `/product`, `/pricing`, `/solutions/restaurants`, `/restaurant-pos-system`, `/solutions/bars-and-pubs`: expect **no row with `fallback: true`**; first React commit already contains the hero.
2. `grep 'rel="preload" as="script"' build/product/index.html` → lists the 4 page chunks, **not** the `CmsAdminLayer` chunk.
3. Client-side nav Home → Pricing still shows the sand loader briefly (unchanged behaviour), then renders.
4. `/` unchanged (no preload, no new tags).
5. Screenshot at 1920×800 and 390×844 on `/product` for layout sanity.
