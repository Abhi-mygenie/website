# Agent Handover — 2026-09-02 (Session 4)
**Written by:** E1 Agent
**Repo:** https://github.com/Abhi-mygenie/website.git · branch: main
**Preview URL:** https://frontend-as-is-run.preview.emergentagent.com
**Production:** https://www.mygenie.online / https://beta.mygenie.online

---

## 1. What Happened This Session

### Deploy
- Synced `/app` to repo HEAD (`git reset --hard origin/main`) — clean deploy
- Wrote backend `.env` with all production credentials (MongoDB, SMS, Calendly, GST, CMS, etc.)
- `yarn install` + `yarn build` — 30+ routes prerendered successfully
- Both services running: backend (port 8001), frontend static server (port 3000)

### GA/GTM Gap Investigation
Investigated why production site HTML contains no GA/GTM. Confirmed 4 gaps via:
- `curl https://www.mygenie.online/` (empty `<div id="root">`, old build hash)
- Code search in `src/lib/gtm.js` and `src/App.js`
- `.env` file inspection

---

## 2. New CRs Registered (Batch AB)

| CR | Title | Status | Priority |
|---|---|---|---|
| CR-198 | `REACT_APP_GTM_ID` not in `.env` — GTM is a build-time no-op | 🔲 Open | **P0** |
| CR-199 | GTM injected via `useEffect` — fires 8–13s after HTML; fast bouncers invisible to GA/Ads | 🔲 Open | **P0** |
| CR-200 | Production serving old non-prerendered build — all 63 routes and 40+ CRs not live | 🔲 Open (👤 owner) | **P0** |

Full specs:
- `/app/memory/CR-198_GTM_ID_Missing_Env.md`
- `/app/memory/CR-199_GTM_UseEffect_Late_Firing.md`
- `/app/memory/CR-200_Production_Old_NonPrerendered_Build.md`

---

## 3. Key Technical Findings

### Gap 1 — `REACT_APP_GTM_ID` missing (CR-198)
`/app/frontend/src/lib/gtm.js` L14: `const GTM_ID = process.env.REACT_APP_GTM_ID;`
This is `undefined` in the compiled bundle → `gtmAllowed()` returns `false` → `initGtm()` no-ops.
Fix: add `REACT_APP_GTM_ID=GTM-K5D84Z3L` to `/app/frontend/.env` → rebuild.

### Gap 2 — GTM via `useEffect` (CR-199)
`/app/frontend/src/App.js` L50–51: `useEffect(() => { initGtm(); }, []);`
Standard fix: move GTM `<script>` to `public/index.html` `<head>` with inline host guard.
GTM fires at HTML parse time (0ms) instead of after React hydration (8–13s).

### Gap 3 — Production old build (CR-200)
Production `www.mygenie.online` has:
- `<div id="root"></div>` empty (no prerender)
- Bundle hash `cf3fd6a7` (old) vs `59f06f2f` (this repo)
- Google Fonts CDN (blocking) vs self-hosted woff2 + preloads
Owner must deploy current `build/` to production server.

---

## 4. Open P0 Items (priority order)

| # | CR | Action | Who | Effort |
|---|---|---|---|---|
| 1 | CR-198 | Add `REACT_APP_GTM_ID=GTM-K5D84Z3L` to `/app/frontend/.env` + rebuild | Agent | 1 line + 3 min build |
| 2 | CR-199 | Move GTM snippet from `useEffect` → `public/index.html` `<head>` | Agent | ~10 lines + rebuild |
| 3 | CR-200 | Deploy current `build/` to `www.mygenie.online` production server | Owner | Infra action |

### Also still open from previous sessions (P0/P1)
- **CR-197** — `/restaurant-pos-comparison` TBT 490ms — needs re-test on `beta.mygenie.online` first
- **CR-180** — Domain canonical strategy (`www` vs `beta`) — owner decision required
- **CR-186** — Cloudflare RUM 2,003ms critical path — owner Cloudflare dashboard action
- **CR-172** — AggregateRating schema — owner review source data needed

---

## 5. Build Notes

- `yarn start` = static server serving `build/` (NOT webpack dev server)
- Every source change needs: `yarn build` + `sudo supervisorctl restart frontend`
- Build time: ~3 min (craco ~60s + Puppeteer prerender ~2 min)
- For production build: `REACT_APP_BACKEND_URL=https://www.mygenie.online yarn build`
- For beta/preview build: `REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build`

---

## 6. CR Register State

| Range | Batch | State |
|---|---|---|
| CR-24 → CR-197 | A–AA | See previous handovers |
| CR-198 | AB | 🔲 Open — `REACT_APP_GTM_ID` missing |
| CR-199 | AB | 🔲 Open — GTM `useEffect` placement |
| CR-200 | AB | 🔲 Open (👤 owner) — production old build |

Full register: `/app/memory/CR_INTAKE_REGISTER.md`
Previous session: `/app/memory/HANDOVER_2026-09-02_Session3.md`

---

*Handover written 2026-09-02 Session 4. E1 Agent.*
