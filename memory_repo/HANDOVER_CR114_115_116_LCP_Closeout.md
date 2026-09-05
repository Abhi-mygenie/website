# HANDOVER — Close out LCP / Core Web Vitals end-to-end (CR-114, CR-115, CR-116)

**Date:** 2026-06
**From:** CR-101 POC agent
**To:** Next agent (mission: get the homepage to GREEN Lighthouse mobile and close LCP/TBT/CLS end-to-end)
**Read first, in order:**
1. `CR-101_POC_Homepage_Prerender_RESULTS.md` (what the POC did + serving change + caveats)
2. `CR-101_POC_Homepage_Prerender_ImpactAnalysis.md` and `..._Line_By_Line_Plan.md` (context)
3. `CR-114`, `CR-115`, `CR-116` (the three bugs to close)

---

## 0. TL;DR of where we are
- We prerendered ONLY the homepage `/` (build-time Puppeteer snapshot). This **fixed the CSR render-delay architecture** — content + JSON-LD are now in the raw HTML, and **Speed Index went to 95**.
- BUT the latest Lighthouse mobile (Moto G / Slow-4G) on the prerendered `/` = **46**:
  - FCP 2,710 ms (60) · SI 2,869 ms (95 ✅) · **LCP 6,006 ms (13 ❌)** · **TBT 959 ms (29 ❌)** · **CLS 0.15 (76)**
- **Prerendering was necessary but not sufficient.** The remaining red metrics are caused by 3 separate, classic issues → CR-114/115/116. Your job is to close them so LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1.

---

## 1. CRITICAL environment facts (do not trip on these)

### 1a. The preview URL now serves the prerendered STATIC build, not the dev server
- `supervisord.conf` `[program:frontend]` command was changed from `yarn start` →
  `command=/usr/bin/node /app/frontend/scripts/static-server.js`
- `static-server.js` (NEW) serves `frontend/build/` with SPA fallback on `0.0.0.0:3000`.
- **Consequence:** there is NO hot reload anymore. After ANY source edit you MUST:
  ```
  cd /app/frontend && yarn build && node scripts/prerender.js && sudo supervisorctl restart frontend
  ```
- The `serve` npm package was tried and FAILED (`path-to-regexp.compile is not a function` in `serve-handler`). That's why we use the tiny custom `static-server.js`. Don't waste time re-trying `serve -s`.

### 1b. `build/` is gitignored and was LOST once on a container restart
- If the preview goes blank, `build/` is probably gone. Just rebuild+prerender (command above).
- Consider (optional) making the supervisor command build-then-serve, or committing a build step, so a restart self-heals. Not required.

### 1c. Hero image 404s in THIS preview pod
- The prerendered hero `<img src="/api/cms/media/435e66d8...png">` returns **404** here (that CMS media was uploaded on production `beta.mygenie.online`; this preview's DB/storage doesn't have it). It loads fine on production.
- **Implication:** do NOT chase the hero image as the LCP element in preview — the measured LCP element is the **H1 text** (see CR-114), not the image.

### 1d. The demo static server does NOT gzip → preview FCP/LCP are pessimistic
- HTML is 132 KB raw / ~21 KB gzipped. Production/CDN compresses. Part of the preview's FCP ≈ 2.7s is just uncompressed transfer. See CR-116.

### 1e. Node version = 20.20 (NOT 22). puppeteer-core is pinned to `21.11.0` for this reason. Don't upgrade it.

---

## 2. What has already been changed (POC — keep or revert as you decide)
| File | Change | Keep? |
|---|---|---|
| `frontend/scripts/prerender.js` | NEW — Puppeteer snapshot of `["/"]`, blocks/strips analytics, dedupes `<title>` | KEEP (extend to more routes later) |
| `frontend/scripts/static-server.js` | NEW — static serve build/ with SPA fallback | KEEP (or make production-grade for CR-116) |
| `frontend/src/components/home/Hero.jsx` | 5× `motion` `initial` set to resolved state (`opacity:1`) so LCP text/image is not re-hidden on hydrate | KEEP |
| `frontend/public/index.html` | `posthog.init()` deferred to `load` + `requestIdleCallback` | KEEP |
| `frontend/package.json` | `+puppeteer-core@21.11.0`, `+serve` (unused), `"prerender"` script | KEEP (can drop `serve`) |
| `/etc/supervisor/conf.d/supervisord.conf` | frontend → static-server.js | KEEP while validating; revert to `yarn start` if you need hot-reload dev |

Rollback everything: `git checkout src/components/home/Hero.jsx public/index.html package.json` · `rm scripts/prerender.js scripts/static-server.js` · restore supervisor `command=yarn start` · `yarn install`.

---

## 3. The three CRs — root causes + exact plan to close

### CR-114 (HIGH) — Heading webfont → late LCP + CLS  ← **the biggest lever**
**Root cause (confirmed by instrumented run):** LCP element = `<h1>` (380×151), recorded at ~2× FCP. The H1 uses `.font-display { font-family: "Clash Display" }` loaded async from **third-party `api.fontshare.com`** with `display=swap`. H1 paints in fallback, then when Clash Display arrives over Slow-4G it **swaps + reflows** → Chrome logs a new, later, larger LCP AND the reflow causes CLS 0.15. One defect inflates BOTH LCP and CLS.
**Plan to close:**
1. Self-host Clash Display (600/700) + Poppins woff2 under `frontend/public/fonts/`.
2. `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the above-the-fold heading weight(s).
3. `@font-face` with **`font-display: optional`** and a **metric-matched fallback** (`size-adjust`/`ascent-override`/`descent-override`) so there is NO post-paint swap and NO reflow.
4. Remove `api.fontshare.com` (and ideally Google Fonts) from the above-the-fold critical path.
Files: `public/index.html`, `src/index.css`, `public/fonts/*`.

### CR-115 (HIGH) — Homepage JS weight → TBT 959ms
**Root cause:** homepage loads `main.*.js` = **1.36 MB raw / 398 KB gz**, all executed on load to hydrate. CR-72 split other routes, but the homepage tree + framer-motion + providers are all in `main.js`.
**Plan to close:**
1. `React.lazy` + `Suspense` for below-the-fold homepage sections (only above-the-fold in the initial hydration path).
2. Trim/replace framer-motion on the homepage (CSS animations for simple reveals).
3. Defer non-critical widgets/providers (Calendly, etc.) to idle/interaction.
Files: `src/pages/Home.jsx`, homepage section components, provider wiring.
**Note:** prerendering does NOT help TBT — this is pure JS-execution reduction.

### CR-116 (MEDIUM) — Serve prerendered HTML compressed
**Root cause:** interim `static-server.js` serves uncompressed (132 KB). 
**Plan to close:** ensure production/CDN/Cloudflare gzip/brotli for html/js/css; if a Node server is used in prod, add compression. Confirm `Content-Encoding` on deployed pages. (Infra, not app logic.)

---

## 4. Recommended order of work (to close LCP/CWV end-to-end)
1. **CR-114 first** — biggest win, fixes LCP AND CLS together. Re-measure.
2. **CR-115** — brings TBT down; largest single weight (30%) in Lighthouse.
3. **CR-116** — production compression (also improves FCP/LCP transfer).
4. Only after `/` is green: extend `prerender.js` `ROUTES` to all 51 (from `public/sitemap.xml`) — that's the full CR-101 rollout (separate).

---

## 5. How to measure (repeatable)
- **Structural (fast, reliable):**
  ```
  cd /app/frontend
  grep -c "boosts profit by up to" build/index.html   # hero text in raw HTML
  grep -c "application/ld+json"      build/index.html   # JSON-LD present
  ```
- **Lab LCP/CLS/TBT:** the authoritative check is the USER's Lighthouse on
  `https://app-instant-launch.preview.emergentagent.com/`.
  Local emulation scripts exist at `/tmp/lh2.js` (mobile + 4× CPU + Slow-4G, installs LCP observer via `evaluateOnNewDocument`, reports LCP element tag/size). Local numbers are directional only (no gzip, image 404) — always confirm on the preview URL / real deploy.
- **Gotcha:** after any edit, rebuild+prerender+restart (§1a) or you'll measure the old build.

---

## 6. MANDATORY process for this workstream
- These are registered BUGS (CR-114/115/116). Per project rule: after applying a fix you **MUST call `testing_agent`** to verify against the reported issue BEFORE marking it fixed. Do not rely on your own curl/inspection/reasoning to declare a CWV bug fixed.
- Keep `test_credentials.md` current if you touch any admin/CMS flow.
- Update each CR's Status (OPEN → IN PROGRESS → FIXED) and append results.

---

## 7. Definition of Done for the session
- [ ] Lighthouse mobile on `/`: **LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1, overall ≥ 90** (on a gzip-enabled deploy)
- [ ] No visual/functional regression (hero, nav dropdowns, demo scroll, CMS pencil, Calendly, consent)
- [ ] `testing_agent` report confirms each CR fixed
- [ ] CR-114/115/116 statuses updated with evidence
- [ ] Decision recorded on rolling prerender out to all 51 routes (CR-101 full)

*Handover written by CR-101 POC agent, 2026-06. Nothing in production was touched; all changes are in the preview pod and fully reversible.*
