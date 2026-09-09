# Agent Handover — 2026-09-08 · Session 10
# Session: CR-238 Suspense-Flash Fix (Option C) — SHIPPED

**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Preview URL:** https://react-app-preview-11.preview.emergentagent.com
**Production:** https://www.mygenie.online / https://beta.mygenie.online
**Current build hash (pod):** `main.68115448.js` ✅
**Previous handover:** `HANDOVER_2026-09-08_Session9.md`

---

## HOW TO USE THIS HANDOVER

When the owner says "read the handover and tell me the plan":
1. Read this file fully.
2. Summarise Section 2 (what shipped) in 3 lines.
3. Present Section 3 (the open GTM batch — the main pending work) clearly.
4. Ask: "Which batch do you want to take first — the GTM dashboard batch, or the dev code items?"

**Respond to the owner in English only.**

---

## 1. System State

| Service | Status | Port |
|---|---|---|
| frontend (`scripts/static-server.js`, serves prerendered `build/`) | RUNNING | 3000 |
| backend (uvicorn / FastAPI) | RUNNING | 8001 |
| MongoDB | remote `52.66.232.149` | — |

**`frontend/.env` (do not overwrite — `REACT_APP_BACKEND_URL` is baked into the build):**
```
REACT_APP_BACKEND_URL=https://react-app-preview-11.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_WHATSAPP_ENABLED=false
```

**Rebuild + prerender command (from `/app/frontend`):**
```
yarn build && node scripts/prerender.js
```
(Run in background — takes >2 min. Then `sudo supervisorctl restart frontend`.)

---

## 2. What Was Done This Session

### CR-238 — Suspense flash (1–2 s blank page) on direct load of lazy routes ✅ SHIPPED

**Problem:** Direct-loading `/product` (and every other lazy route) showed the React
Suspense fallback for ~1–2 s. Prerendered HTML was correct, but `createRoot().render()`
mounted immediately, React hit `lazy()` which had no chunk yet, blew away the
prerendered DOM and painted the fallback until the chunk downloaded.

**Fix (Option C — both parts):**

| File | Change |
|---|---|
| `src/lib/lazyRoute.js` **(NEW)** | `lazyRoute(importFn)` → returns a component with a `.preload()` method + module cache. Once loaded it renders **synchronously** (resolved impl pinned via `useState`), so React never suspends. |
| `src/routes.js` **(NEW)** | Single `ROUTES` table (path → lazyRoute component → chunk name) + `REDIRECTS` + `preloadRoute(pathname)` which uses `matchPath` to find the matching route and calls `.preload()`. |
| `src/App.js` | Now maps over `ROUTES` instead of hardcoding `<Route>`s. `/`, `REDIRECTS` and the `*` 404 route are unchanged. |
| `src/index.js` | `await preloadRoute(window.location.pathname)` (with a 3 s race/timeout guard) **before** `createRoot().render()`. Records `window.__pageChunks`. |
| `scripts/prerender.js` | Injects `<link rel="preload" as="script">` for that page's chunks into `<head>`, so the chunk download starts with the HTML instead of after main.js parses. No preload on `/` (homepage is not lazy); `CmsAdminLayer` chunk excluded. |

**Verified:** MutationObserver trace shows **0 fallback frames** on direct load of all
lazy routes. `testing_agent` iteration_2 = all pass (33 routes, redirects, legal docs,
preload hrefs return 200, client-side nav, mobile 390px).

**Known / accepted:** redirect-only URLs (e.g. `/solutions/bars-and-pubs`) still show a
~6 ms empty frame while `<Navigate>` fires. Pre-existing, invisible to users, and nginx
301s these in production anyway.

**Architecture constraint — DO NOT CHANGE:** the app uses `ReactDOM.createRoot`, **not**
`hydrateRoot`, deliberately (React error #418 — see `CR-205_React_418_Root_Cause_Investigation.md`).
Do not "fix" this to hydrateRoot. Do not remove the preload logic in `lazyRoute.js` / `index.js`.

**Docs:** `CR-238_ImpactAnalysis.md` · test report `/app/test_reports/iteration_2.json`

---

## 3. THE PENDING BATCH — GTM Dashboard (CR-216 + CR-220 A+C + CR-221/222)

**This is the main work left.** Status: **PLANNED, NOT EXECUTED.**
**Type: GTM dashboard only — no code changes, no rebuild.**
**Who: Owner / GTM editor. The agent cannot log into GTM.**

Full step-by-step: `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md`
Container: **GTM-K5D84Z3L** · `tagmanager.google.com`

| CR | Problem | Fix | Priority |
|---|---|---|---|
| **CR-220 Fix A** | GA4 tag not forwarding `user_data` → server container → Enhanced Conversions Path B broken | Create `dlv - user_data` variable, attach to "GA4 - Book demo" tag | **P0** |
| **CR-220 Fix C** | "GAds - Book Demo" EC mode = "Automatic", scans an empty DOM (React already unmounted the inputs) | Switch EC mode → **Code**, use `{{dlv - user_data}}` | **P0** |
| **CR-216** | 3 separate Google scripts load (GTM 157KB + GA4 188KB + Ads 179KB) = 524KB / 645ms blocking | One unified "Google Tag" (`G-KWHHFEZ5Q3`); pause old GA4 Config + Ads Conversion Linker | **P1** (−179KB, −308ms) |
| **CR-221/222** | `POST google.com/rmkt/collect/16740091756/` fails 11× per page load even with consent granted | Inspect remarketing tag/trigger; may self-resolve once CR-216 removes the gtag init race | **P1** |

**Prerequisite already DONE in code:** CR-220 Fix B — `buildLeadPayload()` in `src/lib/gtm.js`
emits `user_data: { email_address, phone_number, address: { first_name, last_name } }`
in every `book_demo` dataLayer push. GTM only needs to be told to read it.

**7 steps, in order:** create unified Google Tag → create `dlv - user_data` variable →
attach to GA4 tag → switch GAds tag to Code mode → inspect remarketing tag →
GTM Preview test with a real form submit + OTP → Publish.

**Post-publish checks:** same day — Google Ads → Conversions → "Book demo" → "Last ping
date" = today. 24–72 h — "Needs attention" clears, EC coverage % appears. Audience
Manager → Website tag → "Recording activity".

---

## 4. Other Open Items

### Dev code — agent can do any time

| CR | What | File | Effort | Priority |
|---|---|---|---|---|
| **CR-236 Step A** | Add `data-testid="product-hero-image"` to the hero `<img>` so `prerender.js` injects the preload (selector already supports `img[data-testid$="-hero-image"]` after CR-233) | `src/pages/ProductPage.jsx` | 1 line + rebuild | P2 |
| **CR-236 Step B** | Add `srcSet`/`sizes` to the same `<img>` — **BLOCKED** until `feature1-5-mobile.webp` assets exist | Owner/design | asset creation | P2 |
| **CR-52** | Server-observable browser pixel heartbeat (telemetry / session tracking) | backend + frontend | needs plan first | P2 |

### Owner actions (agent cannot do these)

| CR | What | Where |
|---|---|---|
| **CR-200** | Deploy production build — `www.mygenie.online` is still on an older hash; everything shipped in Sessions 9–10 is live only on the pod/beta | SSH to www server |
| **CR-146** | `X-Robots-Tag: noindex` for `beta.mygenie.online` (can't be done in code — `robots.txt` is shared across builds) | Cloudflare Page Rule |
| **CR-88** | Provide individual blog author names (all 21 posts say "MyGenie Editorial Team") | Content decision |
| **CR-48** | Approve running the attribution backfill script | `backend/scripts/cr48_backfill_wiped_cf.py` |

---

## 5. Key Files for Reference

| File | What it contains |
|---|---|
| `/app/memory/CR_INTAKE_REGISTER.md` | Full CR register — every CR with status (source of truth) |
| `/app/memory/PRD.md` | Deployment PRD, architecture, env vars, backlog |
| `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md` | The 7-step GTM plan (pending batch) |
| `/app/memory/CR-220_Enhanced_Conversions_Impact_Analysis.md` | Why Enhanced Conversions is broken |
| `/app/memory/CR-238_ImpactAnalysis.md` | This session's fix — design + trade-offs |
| `/app/memory/CR-205_React_418_Root_Cause_Investigation.md` | Why `createRoot` not `hydrateRoot` |
| `/app/memory/test_credentials.md` | CMS + DB credentials |
| `/app/test_reports/iteration_2.json` | Latest full route/regression test run (all pass) |

---

## 6. Project Health

- **Broken:** none
- **Mocked:** none
- **Known regressions:** none
- **Testing:** `testing_agent` run after CR-238; 33 routes + redirects + mobile all pass
