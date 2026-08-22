# CR-115 — Homepage JS Bundle Weight Causes High TBT (Hydration Cost)

**Type:** Bug / Web Performance (Core Web Vitals)
**Date Raised:** 2026-06
**Raised By:** CR-101 POC investigation (Lighthouse mobile on prerendered `/`)
**Status:** OPEN
**Priority:** HIGH
**Effort:** ~1–2 days
**Improves:** TBT · TTI · Google Ads Landing Page Experience
**Scope:** `frontend/src/pages/Home.jsx` + homepage section components, framer-motion usage, provider tree
**Related:** CR-101 (prerender POC), CR-72 (route code-splitting)

---

## 1. Problem Statement
On the prerendered homepage (Lighthouse mobile, Moto G / Slow-4G), **TBT = 959 ms (score 29)**. Prerendering did not reduce TBT because the same JavaScript must still download, parse, execute, and **hydrate** the page — hydration is equal to (or more than) a fresh client render.

The homepage loads a single large bundle `main.*.js` = **1.36 MB raw / 398 KB gzipped**, executed on first load. Route-level splitting (CR-72) split *other* routes into chunks, but the homepage's components, framer-motion animations, and the full provider tree are all in `main.js`, so the entire bundle runs on `/`.

## 2. Evidence
- `build/static/js/main.dd7f4a8e.js` = 1,364,532 bytes raw; `gzip -c` ≈ 398,399 bytes.
- Prerendered `/` `index.html` references only `static/js/main.*.js` (no additional homepage route chunk) — the whole bundle hydrates on the homepage.
- Lighthouse mobile: TBT 959 ms (was ~1,250 ms pre-POC; PostHog defer helped modestly).

## 3. Suggested Fix (for later — NOT part of this intake)
1. **Lazy-load below-the-fold homepage sections** (`React.lazy` + `Suspense`) so only above-the-fold code is in the initial hydration path.
2. **Trim/replace framer-motion** on the homepage (it is heavy; consider CSS animations for simple reveals).
3. **Split heavy providers / third-party widgets** (e.g. Calendly, analytics) to load post-interaction / on-idle.
4. Re-measure TBT after each step.

## 4. Files Likely Changed
| File | Change |
|---|---|
| `frontend/src/pages/Home.jsx` | `React.lazy` for below-the-fold sections |
| homepage section components | Wrap in `Suspense`; reduce motion |
| provider/widget wiring | Defer non-critical JS to idle/interaction |

## 5. Definition of Done
- [ ] Homepage initial JS (executed on load) materially reduced vs 398 KB gz
- [ ] TBT ≤ 200 ms on Lighthouse mobile (real deploy)
- [ ] No visual/functional regression (hero, nav, demo scroll, CMS, Calendly)
- [ ] Verification by testing_agent required before marking fixed

---

*CR-115 registered 2026-06. Source: CR-101 POC investigation. Intake only — no code changed.*
