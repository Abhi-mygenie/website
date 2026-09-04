# CR-101 POC — Impact Analysis: Prerender ONLY the Homepage `/` (Preview)

**Date:** 2026-06 · **Type:** Impact analysis only — NO code written · **Scope:** Single route `/`, preview environment only
**Goal of POC:** Prove that a build-time prerender puts the hero H1/text + JSON-LD into the raw HTML (fixing the empty `<div id="root">`), verify hydration keeps the page fully functional, and measure whether LCP actually improves — before committing to all 51 routes.

---

## 1. Method decision (and why it de-risks React 19)

- **Tool:** a small custom **Puppeteer** snapshot script driven by an **explicit one-route list `["/"]`** — NOT `react-snap`.
- **Why this matters:** the snapshot runs in **real headless Chrome**, so `window`/`document`/`localStorage` all exist during capture. I grepped the whole `src/` tree: the ONLY module-top-level browser access is `index.js` `createRoot(document.getElementById("root"))`. All other `window`/`localStorage`/`document` usage lives inside hooks/functions (`gtm.js`, `attribution.js`, effects). **⇒ There is ZERO risk of Node "window is not defined" SSR errors** — the class of failure that breaks react-snap/Next SSR simply cannot occur here. React 19 + `createRoot` is irrelevant to the capture step.

---

## 2. Build-pipeline impact

- Current preview serves via **`craco start` (dev server, in-memory)** — it does NOT serve files from `build/`. So the POC pipeline is: `yarn build` → run prerender script on `/` → it overwrites `build/index.html` with the rendered snapshot → validate against `build/`.
- **`craco.config.js` unchanged.** Prerender is a post-build step, not a webpack change.
- **The other 50 routes are untouched** — they keep today's empty-root `index.html`. So the POC cannot regress any other page.
- **New dependency:** `puppeteer` (downloads a ~170 MB Chromium) OR reuse the Playwright Chromium already present in this env. Impact: build-env disk + one dependency. Not shipped to the browser bundle.

---

## 3. Serving/validation impact (how we prove it without breaking the running site)

- **Do NOT touch the supervisor `frontend` (dev server).** It keeps running as-is.
- Validation path:
  1. **`curl`/read `build/index.html` from disk** → assert the hero `<p>` text ("MyGenie POS boosts profit…") and the `ORG_JSONLD`+`SOFTWARE_APP_JSONLD` `<script type=application/ld+json>` are present in raw HTML (today: absent).
  2. Serve `build/` on a **temporary separate port** (e.g. `npx serve -s build`) to load it in a browser and confirm hydration (forms, Calendly, nav dropdowns, CMS pencils) still works and LCP improves.
- Zero production impact — `beta.mygenie.online` is never touched.

---

## 4. Component-by-component hydration analysis (everything that mounts on `/`)

| Component | Initial render vs snapshot | Verdict |
|---|---|---|
| **Hero `motion.p` (the LCP element)** | Snapshot captures the **post-animation** DOM (`opacity:1`). On client, framer-motion re-mounts at `initial:{opacity:0}` → **the hero text will blank out and re-animate in after hydration.** | ⚠️ **CRITICAL — see §5.** This is the one finding that can make the POC "look like LCP didn't improve." |
| **Navbar** | `scrolled=false` default; dropdowns closed. Client loads at `scrollY=0` → identical. | 🟢 Match |
| **ConsentBanner** | `useState(false)`; banner only shown via `useEffect` after mount. Snapshot = no banner; client initial render = no banner. | 🟢 Match (banner appears post-hydration as designed) |
| **StickyMobileCta** | `consentUp = !hasConsentChoice()` is read from **localStorage during render** (line 13). Puppeteer has empty storage → `true`; a returning consented user → `false`. | 🟡 Benign mismatch on an element that is `lg:hidden` + `translate-y-full` (off-screen, non-LCP). Console warning only. |
| **CmsAdminLayer** | Renders `null` unless `?admin=1`/`#admin` or logged-in. Clean `/` → nothing. | 🟢 Match |
| **WhatsAppFab** | Gated by `REACT_APP_WHATSAPP_ENABLED !== "false"`; env is currently `"false"` → not mounted. Same env at build+runtime. | 🟢 Match |
| **Footer / TrustBand / ProblemGrid / …** | Static presentational. `Reveal` uses `whileInView opacity:0` → below-fold sections re-animate on scroll (same flash class as Hero but NOT LCP-critical). | 🟢 / 🟡 cosmetic |
| **AttributionTracker / ScrollDepthTracker / ScrollToTop** | Render `null`; all logic in effects. During capture they call `initGtm()`/`initAttribution()` which may inject a GTM `<script>` and touch localStorage. | 🟡 **Capture must block/strip third-party** (see §6). `REACT_APP_GTM_ID` is empty in preview → `initGtm` no-ops anyway. |
| **Seo (react-helmet-async)** | Injects `<title>`, canonical, OG, JSON-LD into `<head>` **client-side after mount**. | 🟡 Capture must wait for mount, then dedupe the base template `<title>` to avoid a double title (see §6). |

---

## 5. ⚠️ The decisive finding — the hero animation can mask the LCP win

The LCP element is the hero sub-heading `motion.p` with `initial={{opacity:0}}`. Sequence on a prerendered page:

1. Raw HTML paints hero text immediately (fast — this is the win we want).
2. JS loads, React hydrates, framer-motion **re-applies `opacity:0`** to that same element.
3. framer-motion animates it back to `opacity:1` (~0.12s delay + 0.6s).

**Consequence:** the browser may record LCP at step 3 (the element went invisible then visible again), **partially or fully negating the LCP improvement** — even though prerendering *did* work (raw HTML is correct, SEO win is real).

**Implication for the POC:** the **raw-HTML / SEO / JSON-LD win is guaranteed.** The **measured-LCP win is NOT guaranteed by prerendering alone** — it also needs the hero enter-animation neutralized (render the LCP text at `opacity:1`, animate something non-critical instead). That is a ~2-line code change, **out of scope for this analysis-only step**, but it must be approved alongside the POC if the success metric includes an LCP drop. I'm flagging it now so the POC isn't judged a failure for the wrong reason.

---

## 6. Snapshot-capture correctness details (must be handled in the script)

- **Wait for hydration/paint** before capturing (network-idle + short settle) so Helmet head + hero DOM are final.
- **Block third-party requests** (`googletagmanager.com`, `*.posthog.com`) during capture and **strip injected analytics `<script>`/`<iframe>` + `window.dataLayer`** so the saved HTML contains no half-initialized tracking.
- **Dedupe `<title>`:** remove the base template `<title>` from `index.html` so Helmet's title isn't duplicated in the snapshot.
- **Canonical:** `Seo` builds canonical from `SITE_URL` (production). Snapshot on preview will bake the **production** canonical — which is actually correct/desirable.

---

## 7. Operational impact to be aware of (beyond the POC)

- **CMS ↔ prerender coupling:** the snapshot bakes whatever content is live at build time (code fallback, or published CMS value if the fetch resolves during capture). After this, **a published CMS edit to the homepage will NOT change the raw HTML until the next build+prerender.** Users still see fresh content (client hydration re-fetches `/api/cms/content`), but first-paint HTML is stale until rebuild. This is a workflow change to accept before rolling to all 51 routes. (No impact for the POC itself.)

---

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hero re-animation masks LCP gain | High | POC "shows no LCP win" | Pair with hero `opacity:1` fix (separate approval) |
| Hydration mismatch warnings (StickyMobileCta/Reveal) | Medium | Console warnings; brief flash off-screen | Benign; note only |
| Analytics junk baked into snapshot | Medium | Dirty HTML | Block+strip third-party in capture |
| Double `<title>` | Medium | Minor SEO | Remove base title before capture |
| Puppeteer/Chromium install | Low | Build-env disk | Reuse existing Playwright Chromium |
| Dev server doesn't serve build | Certain | Can't validate via dev URL | Validate `build/` via curl + temp static serve |

## 9. Rollback
Prerender is a **post-build artifact only**. Delete the script + the generated `build/index.html` (or just re-run `yarn build`) → back to today's behavior exactly. **No component/source code is modified in the POC.** Fully reversible.

## 10. Definition of Done (POC)
- [ ] `build/index.html` for `/` contains the hero H1 + sub-heading text in raw HTML.
- [ ] `build/index.html` contains both `ORG_JSONLD` and `SOFTWARE_APP_JSONLD` `ld+json` blocks.
- [ ] Served `build/` loads with working nav dropdowns, demo scroll, Calendly, CMS pencils (hydration healthy).
- [ ] Lighthouse/GTmetrix on the served build shows LCP element painting from raw HTML (with the §5 caveat noted if the animation fix is not included).

## 11. What this POC does NOT cover
- The other 50 routes (dynamic `:slug`/`:bucket`, blog, legal, `/leads`, `/payment-success`).
- Production deployment / Cloudflare edge caching.
- The hero animation code fix (called out in §5, needs separate approval).
- The CMS-rebuild workflow decision (§7).

*Analysis only. No code changed. Awaiting approval to run the POC.*
