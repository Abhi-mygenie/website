# CR-265–268 · Batch BE · Impact Analysis
**Written:** 2026-09-14 (planning agent, no code changed)
**Status:** DRAFT — awaiting owner review before implementation
**Covers:** CR-265 (Alpha LP CTAs), CR-266 (ScrollToTop guard), CR-267 (cta_click / sheet_open events), CR-268 (remove consent banner)
**Next doc:** `CR-265-268_BatchBE_Line_By_Line_Plan.md` (to be written after owner approves this)

---

## 0. Verification baseline (confirmed from source files, 14 Sep)

Before impact can be assessed, the current state was read directly from the repo. Key facts:

| Item | Current state |
|------|---------------|
| All Alpha LP CTAs | `<button type="button" onClick={...}>` — zero `href="#…"` anywhere on the page |
| Homepage hero CTA | `<a href="#demo" onClick={e=>{e.preventDefault(); openDemo();}}>` — the reference pattern |
| Petpooja hero + pricing CTAs | `<a href="#vsp-demo" onClick={...}>` — also has the anchor fallback |
| `ScrollToTop` in `App.js` | `useEffect(() => { if (!hash) window.scrollTo(0,0); }, [pathname, hash])` — fires on mount AND route changes |
| `DemoBottomSheet.jsx` | No `sheet_open` event pushed anywhere |
| Alpha LP handlers | No `cta_click` event pushed anywhere |
| `ConsentBanner.jsx` | 48 px strip, `z-[70]`, same z-index as `DemoBottomSheet` (`z-[70]`) |
| `StickyMobileCta.jsx` | MutationObserver on `consent-banner`; adds `-translate-y-12` when banner is visible |
| `index.css` L70–77 | `body.consent-banner-open { padding-bottom: 48px }` |
| `prerender.js` L119–120 | Strips `[data-testid="consent-banner"]` and `body.consent-banner-open` class |
| `lib/gtm.js` | `pushEvent` exists at L61; `setDefaultConsent`, `updateConsent`, `setConsentChoice`, `hasConsentChoice` all present |

---

## 1. CR-265 — Alpha LP CTAs: `<a href="#lp-demo">` + sheet onClick

### What changes

5 CTA types across 5 files. Each `<button type="button" onClick={handler}>` becomes `<a href="#lp-demo" onClick={(e) => { e.preventDefault(); handler(); }}>` — exact same handler, exact same classes, exact same `data-testid`.

**Pattern being applied** (from `Hero.jsx` — the codebase's own CR-157 reference):
```jsx
// BEFORE (current — all 5 pages)
<button type="button" onClick={openSheet} className="..." data-testid="...">

// AFTER
<a href="#lp-demo" onClick={(e) => { e.preventDefault(); openSheet(); }} className="..." data-testid="...">
```

**Navbar CTA** (receives `onDemo` prop from the page, not `openSheet` directly):
```jsx
// BEFORE
<button type="button" onClick={onDemo} ... data-testid="...-navbar-cta">

// AFTER
<a href="#lp-demo" onClick={(e) => { e.preventDefault(); onDemo(); }} ... data-testid="...-navbar-cta">
```

### Files and CTAs — complete inventory

| File | CTA | Current line | data-testid | Current handler |
|------|-----|-------------|-------------|-----------------|
| `RestaurantBillingSoftware.jsx` | Navbar | L35 | `billing-lp-navbar-cta` | `onDemo` |
| `RestaurantBillingSoftware.jsx` | Pricing ×3 | L89 | `billing-plan-cta-{starter\|growth\|pro}` | `openSheet` |
| `RestaurantBillingSoftware.jsx` | Hero | L144 | `billing-lp-cta-primary` | `openSheet` |
| `RestaurantPosSystem.jsx` | Navbar | L35 | `pos-lp-navbar-cta` | `onDemo` |
| `RestaurantPosSystem.jsx` | Pricing ×3 | L89 | `pos-plan-cta-{starter\|growth\|pro}` | `openSheet` |
| `RestaurantPosSystem.jsx` | Hero | L151 | `pos-lp-cta-primary` | `openSheet` |
| `RestaurantManagementSoftware.jsx` | Navbar | L35 | `mgmt-lp-navbar-cta` | `onDemo` |
| `RestaurantManagementSoftware.jsx` | Pricing ×3 | L89 | `mgmt-plan-cta-{starter\|growth\|pro}` | `openSheet` |
| `RestaurantManagementSoftware.jsx` | Hero | L144 | `mgmt-lp-cta-primary` | `openSheet` |
| `CloudKitchenPos.jsx` | Navbar | L37 | `ck-lp-navbar-cta` | `onDemo` |
| `CloudKitchenPos.jsx` | Pricing ×3 | L91 | `ck-plan-cta-{starter\|growth\|pro}` | `openSheet` |
| `CloudKitchenPos.jsx` | Hero | L154 | `ck-lp-cta-primary` | `openSheet` |
| `QsrPosSystem.jsx` | Navbar | L35 | `qsr-lp-navbar-cta` | `onDemo` |
| `QsrPosSystem.jsx` | Pricing ×3 | L89 | `qsr-plan-cta-{starter\|growth\|pro}` | `openSheet` |
| `QsrPosSystem.jsx` | Hero | L153 | `qsr-lp-cta-primary` | `openSheet` |

Total: **25 CTA edits** (5 per page × 5 pages). Each is a one-line JSX change.

### What does NOT change

- `DemoBottomSheet.jsx` — untouched. Sheet behaviour is identical after JS mounts.
- `DemoForm.jsx` — untouched.
- The `<section id="lp-demo" className="... scroll-mt-20">` fallback target — already exists on all 5 pages. The `scroll-mt-20` (80 px) accounts for the fixed navbar.
- `StickyMobileCta.jsx` — left as `<button>` (bar only appears after hero scrolls out of view, React is mounted by then; separate CR if needed).
- Homepage, Petpooja — already have the anchor pattern, zero changes.
- Backend, GTM, CSS — no changes for CR-265.

### Behaviour after change

| Timing | What happens |
|--------|-------------|
| User taps CTA during dead window (JS not yet ready) | `e.preventDefault()` never runs. Browser follows `href="#lp-demo"` natively. Page scrolls to the `<section id="lp-demo">` which contains `<DemoForm shortForm>`. User can fill and submit the in-page form immediately. |
| User taps CTA after React mounts (normal) | `e.preventDefault()` stops the scroll. `openSheet()` (or `onDemo()`) fires. Bottom sheet opens exactly as today. URL hash **not** set (preventDefault fired first). No visible change from today's behaviour. |
| User on desktop | `<a>` renders identically to `<button>` visually (classes unchanged). Cursor: pointer by default on `<a>`, same as `<button>`. No visual difference. |

### Risks and mitigations

| Risk | Detail | Mitigation |
|------|--------|-----------|
| Pricing card visual width | `<a>` inside pricing card must keep `block w-full text-center` classes — these are already on the `<button>`. Moving them to `<a>` is sufficient. | Visual check at 390 px and 1920 px after change. |
| Test selector breakage | Any Playwright test asserting `button[data-testid="billing-lp-cta-primary"]` will break. Tests should use `[data-testid="billing-lp-cta-primary"]` (element-agnostic). | Update any such selectors in the test suite before QA. |
| Hash in URL on fallback | When `e.preventDefault()` doesn't run, `#lp-demo` lands in `location.hash`. `ScrollToTop` already skips `scrollTo(0,0)` when `hash` is set — correct behaviour. | No code change needed; falls out naturally. |
| Fallback form UX on mobile | `#lp-demo` lands on the section heading; form fields are ~1 screen below on mobile (scroll-mt-20 = 80 px offset handles navbar). This was CR-230's original complaint. | Acceptable as an emergency fallback. A "form-first on mobile" layout is a separate CR if desired. |
| `<a>` semantic inside `<header>` | Navbar `<a href="#lp-demo">` with `e.preventDefault()` — standard internal link pattern. No ARIA change needed. | None. |

### Acceptance

- `grep -c 'href="#lp-demo"'` on prod HTML of each of the 5 pages ≥ 5 per page.
- Playwright, 390×844, JS delivery delayed 2.5 s: tap hero CTA at ~1 s → `location.hash === "#lp-demo"` and `#lp-demo section` is in viewport.
- Same tap after React mounts → `[data-testid="quick-demo-sheet"]` has class `translate-y-0`, hash unchanged.
- Submit through sheet → `POST /api/demo-request` 200 + dataLayer `form_submitted { form_location: "quick_book_sheet" }`.
- Petpooja and homepage: visual/functional regression — zero changes expected.
- **Primary business criterion:** `cta_click → sheet_open` ≥ 95 % on mobile paid sessions (proves CTA works; see CR-267). Lead-rate recovery judged separately against D4 baseline.

---

## 2. CR-266 — `ScrollToTop`: skip `scrollTo(0,0)` on first mount

### Current code (`App.js` L15–21)

```jsx
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
```

**The problem:** `useEffect` with `[pathname, hash]` as deps runs on first render (component mount) AND on every subsequent route change. On first render, `pathname` and `hash` are already set to the initial URL values — React does not distinguish "this is the first mount" from "the route just changed". So if a visitor scrolled the pre-rendered HTML to `scrollY = 1116` during the dead window, React mounts at ~2.8 s and immediately fires `window.scrollTo(0, 0)` → snaps to top.

### What changes

Add a `useRef` first-run flag that skips the `scrollTo` on the initial mount execution. Route-change behaviour is completely unchanged.

```jsx
// AFTER
import { useRef } from "react"; // already imported in App.js via React

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
```

`useRef` is already imported in `App.js` (line 2: `import { useEffect, useState, Suspense, lazy } from "react";` — needs `useRef` added to the import).

### Scope

`App.js` L2 (add `useRef` to import), L15–21 (ScrollToTop function). **Site-wide effect** — applies to every page, not just Alpha LPs. No other file changes.

### What does NOT change

- Route-change `scrollTo(0, 0)` is preserved: after the first run, every subsequent pathname or hash change continues to scroll to top (unless hash is set).
- Prerender (Puppeteer): `window.scrollY` is always 0 in Puppeteer — not affected.
- Homepage, Petpooja, all other pages: benefit (no snap-back) but no functional regression since they had anchor CTAs that already set a hash.

### Risks and mitigations

| Risk | Detail | Mitigation |
|------|--------|-----------|
| Client-side navigation to same page | If user navigates `/pricing` → `/pricing` (e.g. same-page link), the ref is already `false`, so `scrollTo(0,0)` fires — correct. | No issue. |
| SSR/hydration context | Not applicable — this codebase uses `createRoot` (CSR), not `hydrateRoot`. | No issue. |
| Puppeteer prerender | `ScrollToTop` renders `null`. Puppeteer is unaffected. | No issue. |

### Acceptance

- Playwright, JS delayed 2.5 s: `window.scrollTo(0, 1500)` at 1 s → after `window.__pageChunks` is set (React mounted), `window.scrollY` ≈ 1500 (not 0).
- Client-side navigation: click in-app link from `/pricing` to `/` → `scrollY` = 0.

---

## 3. CR-267 — `cta_click` and `sheet_open` dataLayer events

### What changes

Two new `pushEvent` calls. `pushEvent` already exists in `lib/gtm.js` at L61 — **no changes to gtm.js**.

#### Event 1: `cta_click`

Pushed in the `onClick` handler of every LP CTA **after** the sheet/scroll action, so the event fires whether or not the sheet actually opens.

```js
pushEvent("cta_click", {
  cta_location: "hero" | "navbar" | "pricing-starter" | "pricing-growth" | "pricing-pro" | "sticky",
  page_path: window.location.pathname,
});
```

Added to:
- All 25 LP CTA handlers (same 5 files, same lines as CR-265)
- `StickyMobileCta.jsx` `handleClick` (L58–64) — the one CTA left as `<button>` in CR-265

**Handler pattern** (hero example):
```jsx
// BEFORE
<a href="#lp-demo" onClick={(e) => { e.preventDefault(); openSheet(); }} ...>

// AFTER (CR-267 added inline)
<a href="#lp-demo" onClick={(e) => {
  e.preventDefault();
  pushEvent("cta_click", { cta_location: "hero", page_path: window.location.pathname });
  openSheet();
}} ...>
```

The pricing CTAs use a `plan.name` variable from the loop — `cta_location` maps as:
- `pricing-starter`, `pricing-growth`, `pricing-pro` (lowercase plan name)

#### Event 2: `sheet_open`

Pushed in `DemoBottomSheet.jsx` via a dedicated `useEffect` on `[open]`, fires once when `open` transitions from `false` → `true`.

```jsx
// Add to DemoBottomSheet.jsx (after existing useEffects)
useEffect(() => {
  if (open) {
    pushEvent("sheet_open", { sector });
  }
}, [open]); // eslint-disable-line react-hooks/exhaustive-deps
```

`pushEvent` needs to be imported from `@/lib/gtm` — it is not currently imported in `DemoBottomSheet.jsx`. Add to the existing import: `import { pushLead, newEventId, pushEvent } from "@/lib/gtm";`.

### Files

| File | Change |
|------|--------|
| `RestaurantBillingSoftware.jsx` | Add `pushEvent` import. Add `cta_click` push in navbar handler (L35), hero handler (L144), pricing handler (L89). |
| `RestaurantPosSystem.jsx` | Same — import + 3 handlers. |
| `RestaurantManagementSoftware.jsx` | Same. |
| `CloudKitchenPos.jsx` | Same. |
| `QsrPosSystem.jsx` | Same. |
| `DemoBottomSheet.jsx` | Add `pushEvent` to import at L6. Add `sheet_open` useEffect (5 lines). |
| `StickyMobileCta.jsx` | Add `pushEvent` import. Add `cta_click { cta_location: "sticky" }` in `handleClick`. |
| `lib/gtm.js` | **No changes.** |

### What does NOT change

- GTM container, existing triggers, existing tags — untouched.
- `form_submitted`, `book_demo`, `thankyou_conversion`, `lead_verifided` events — untouched.
- DemoForm.jsx on homepage, Petpooja — not in scope (not on the Alpha pages).

### Risks

| Risk | Detail | Mitigation |
|------|--------|-----------|
| Double-fire on fast taps | `sheet_open` is gated on `open === true`. Sheet's `onClose` sets `open = false`; re-tap sets `open = true` again → correct second fire. | By design; each sheet open is a separate visitor intent. |
| Event volume | A single visit to an Alpha page could generate 1 `cta_click` + 1 `sheet_open`. Both are micro-events (not conversions). | No impact on GA4 quotas. |
| `pricing-` naming | `cta_location: "pricing-${plan.name.toLowerCase()}"` relies on the PLANS array keeping names "Starter", "Growth", "Pro". | These names are static in all 5 files; safe. |

### Owner action (GTM — not code)

After the build is deployed to production:
1. In GTM-K5D84Z3L: add **Custom Event trigger** for `cta_click` (Event Name = `cta_click`).
2. Add **Custom Event trigger** for `sheet_open` (Event Name = `sheet_open`).
3. Add **GA4 event tag** → fires on `cta_click` trigger → event name `cta_click`, params `cta_location`, `page_path`.
4. Add **GA4 event tag** → fires on `sheet_open` trigger → event name `sheet_open`, param `sector`.
5. In GA4 Property 455083409: register `cta_location` and `form_location` as **event-scoped custom dimensions**.
6. Mark tags as **NOT conversions** (these are micro-events, not conversion actions).

### Acceptance

- Tag Assistant on prod: tap hero CTA → `cta_click { cta_location: "hero", page_path: "/restaurant-billing-software" }` appears in dataLayer.
- Sheet opens → `sheet_open { sector: "billing-software" }` appears in dataLayer.
- Both visible in GA4 DebugView after GTM publish.

---

## 4. CR-268 — Remove consent banner (Option A); keep Consent Mode v2 defaults

### Summary of what goes

| Component | Action |
|-----------|--------|
| `ConsentBanner.jsx` | Delete file entirely |
| `App.js` L8 | Remove import of `ConsentBanner` |
| `App.js` L81 | Remove `<ConsentBanner />` render |
| `index.css` L70–77 | Remove `body.consent-banner-open` padding rules |
| `StickyMobileCta.jsx` L3 | Remove `hasConsentChoice` import |
| `StickyMobileCta.jsx` L13 | Remove `consentUp` state |
| `StickyMobileCta.jsx` L20–25 | Remove MutationObserver tracking consent banner |
| `StickyMobileCta.jsx` L71 | Simplify to always `translate-y-0` when visible |
| `prerender.js` L119–120 | Remove banner-strip code (it becomes a no-op after deletion) |

### Summary of what stays

| Component | Why it stays |
|-----------|-------------|
| `lib/gtm.js` → `setDefaultConsent()` | Called in `AttributionTracker` on every route. Sets EEA/GB denied + India granted defaults in dataLayer. Region-aware Consent Mode v2 works without the banner. |
| `lib/gtm.js` → `updateConsent()` | Called by `setDefaultConsent` to restore previously stored choice. A visitor who clicked Decline before must still be respected. |
| `lib/gtm.js` → `CONSENT_KEY` ("mg_consent") | Used by `setDefaultConsent` to read stored choices from localStorage. |
| `lib/gtm.js` → `setConsentChoice()` + `hasConsentChoice()` | Become unused after banner deletion. Safe to leave (dead code); or remove — either is fine. No runtime effect. |
| `public/index.html` consent default block | Inline `gtag("consent","default",...)` in `<head>` — fires before any script, handles the EEA-denied / India-granted defaults before GTM even loads. **Must not be touched.** |
| `/privacy` page and footer link | Legal information stays. No change. |

### Detailed file-by-file changes

**`App.js`**
- L8: Remove `import ConsentBanner from "@/components/site/ConsentBanner";`
- L81: Remove `<ConsentBanner />` (the component renders outside `<BrowserRouter>`, after `CmsAdminLayer`)
- L2: `useRef` needs to be added for CR-266 in the same edit session

**`components/site/ConsentBanner.jsx`**
- Delete the entire file.
- Any import of `ConsentBanner` anywhere else → search repo. Current scan: only imported in `App.js` L8.

**`index.css` L69–77** (current):
```css
/* CR-93 — push content above consent banner on mobile/tablet */
body.consent-banner-open {
  padding-bottom: 48px; /* h-12 banner height */
}
@media (min-width: 1024px) {
  body.consent-banner-open {
    padding-bottom: 0; /* desktop: thin banner, no overlap */
  }
}
```
Remove these 8 lines entirely (L69 comment through L77 closing brace).

**`StickyMobileCta.jsx`** — current relevant lines:
```jsx
// L3
import { hasConsentChoice } from "@/lib/gtm";
// L13
const [consentUp, setConsentUp] = useState(!hasConsentChoice());
// L20-25 (MutationObserver block)
useEffect(() => {
  const check = () => setConsentUp(!!document.querySelector('[data-testid="consent-banner"]'));
  const obs = new MutationObserver(check);
  obs.observe(document.body, { childList: true, subtree: true });
  return () => obs.disconnect();
}, []);
// L71 (inside className template literal)
visible ? (consentUp ? "-translate-y-12" : "translate-y-0") : "translate-y-full"
```
After changes:
- L3: remove `hasConsentChoice` from import (if `pushEvent` is also imported for CR-267, the import line will be `import { pushEvent } from "@/lib/gtm";`)
- L13: remove `consentUp` state entirely
- L20–25: remove the consent MutationObserver `useEffect` block entirely
- L71: simplify to `visible ? "translate-y-0" : "translate-y-full"`

**`prerender.js` L115–120** (current):
```js
// ── CR-167: strip ConsentBanner — session-dependent UI must not bake into prerendered HTML ─
// ...
document.querySelectorAll('[data-testid="consent-banner"]').forEach(n => n.remove());
document.body.classList.remove("consent-banner-open");
```
Remove these 6 lines. The banner no longer exists; the selector matches nothing; the class is never added. It is a dead no-op after deletion but clean to remove.

### Compliance memo (recorded for the register)

- **Google EU User Consent Policy:** satisfied by the region-aware `consent default` signals in `public/index.html` and `lib/gtm.js → setDefaultConsent()`. EEA/GB visitors receive `ad_storage: "denied"` before GTM loads. The policy does not require a UI; it requires the signals.
- **India DPDP Act 2023:** does not mandate a cookie consent banner for analytics cookies in this context. The Privacy Policy page (`/privacy`) remains accessible via the footer link on every page.
- **Campaigns:** 100 % India. Every paid visitor currently arrives and sees a "Decline" button before any scroll. India visitors are already `granted` by default — a "Decline" tap from an Indian visitor only removes analytics that were already granted, losing data for no legal benefit.
- **Previously stored "Decline" choices:** `setDefaultConsent()` reads `localStorage.getItem("mg_consent")` and calls `updateConsent(false)` if stored → those visitors remain opted-out. Their choice is respected.
- **Future EU campaigns:** if EEA/UK targeting is ever added, a new CR will add an EEA/UK-only banner using `CF-IPCountry` or `backend/geo.py`. That is explicitly out of scope for CR-268.

### Interaction conflicts resolved by this CR

| Conflict | Before | After |
|----------|--------|-------|
| Sheet bottom edge obscured | Banner top (796 px) overlaps sheet submit button bottom (788 px). "No spam" text hidden. | Banner gone. Sheet has full viewport below z-[70] sheet bottom. |
| StickyMobileCta z-index lift | `-translate-y-12` (48 px) applied when banner visible. Layout shift when banner appears/disappears. | Always `translate-y-0`. No shift. |
| `body.consent-banner-open` padding | 48 px padding-bottom added on mobile — can cause 1 px render diff between Puppeteer (no consent banner at mount, but banner fires post-hydration) and live. | Class never applied. No padding. |
| Test-vs-production difference | Owner's tests never see banner (stored consent). Real paid visitors always see it. | All visitors see same layout. |

### Risks and mitigations

| Risk | Detail | Mitigation |
|------|--------|-----------|
| Stored "Decline" visitors | ~small % of visitors who previously clicked Decline. Their `mg_consent=denied` in localStorage is still read by `setDefaultConsent()` → `updateConsent(false)` fires → GA4/Ads tags are blocked for them. | Fully handled. No code change needed beyond keeping `setDefaultConsent`. |
| CR-93 / CR-139 / CR-201 memory docs | Reference the banner by name. | Mark as superseded in the CR_INTAKE_REGISTER when CR-268 is closed. No code implication. |
| Playwright tests asserting `[data-testid="consent-banner"]` | If any test asserts the banner exists, it will fail. | Remove those assertions from the test suite before QA. |
| Any page that imports `ConsentBanner` directly | Only `App.js` currently imports it. | Confirm with `grep -r "ConsentBanner"` before deletion. |

### Acceptance

- Prod HTML of any page: `grep -c 'consent-banner'` = 0.
- Mobile 390×844, cleared localStorage: no strip at bottom. Sticky CTA flush at `bottom-0` (not `bottom-12`). Open sheet → submit button and "No spam" text fully visible, nothing overlapping.
- `window.dataLayer` on any page load still contains the `consent default` entries (India granted, EEA denied) — verify in Tag Assistant.
- GA4/Ads tags fire for an India visitor on first load, no click required (consent already granted by default).
- `body.consent-banner-open` class never applied on any page.

---

## 5. Files touched — complete list

| File | CR | Change type |
|------|----|-------------|
| `src/App.js` | 266, 268 | Edit (add `useRef` import; ScrollToTop guard; remove ConsentBanner import + render) |
| `src/pages/RestaurantBillingSoftware.jsx` | 265, 267 | Edit (5 CTAs: button→anchor; add pushEvent import; add cta_click in 3 handlers) |
| `src/pages/RestaurantPosSystem.jsx` | 265, 267 | Same pattern |
| `src/pages/RestaurantManagementSoftware.jsx` | 265, 267 | Same pattern |
| `src/pages/CloudKitchenPos.jsx` | 265, 267 | Same pattern |
| `src/pages/QsrPosSystem.jsx` | 265, 267 | Same pattern |
| `src/components/site/DemoBottomSheet.jsx` | 267 | Add `pushEvent` to import; add `sheet_open` useEffect |
| `src/components/home/StickyMobileCta.jsx` | 267, 268 | Add pushEvent import; add cta_click in handleClick; remove consent MutationObserver; simplify translate class |
| `src/components/site/ConsentBanner.jsx` | 268 | **Delete** |
| `src/index.css` | 268 | Remove L70–77 (`body.consent-banner-open` rules) |
| `scripts/prerender.js` | 268 | Remove L119–120 banner-strip code |
| `src/lib/gtm.js` | — | **No changes** |
| `public/index.html` | — | **No changes** |

**Total:** 11 files edited, 1 file deleted, 2 files confirmed unchanged.

---

## 6. Pages and components NOT changed

The following were considered and explicitly excluded from this batch:

| Item | Reason not in scope |
|------|---------------------|
| Homepage (`Home.jsx`) | Already has `<a href="#demo">` pattern. No regression. |
| Petpooja (`PetpoojaAlternative.jsx`) | Already has `<a href="#vsp-demo">` pattern. No regression. |
| `StickyMobileCta.jsx` CTA → `<a>` | Left as `<button>`. Bar only appears after hero scrolls out; React is mounted by then. CR register notes this as a follow-up option. |
| All other sector/product pages | Not on the Alpha campaign. Not in scope for CR-265–268. |
| `DemoForm.jsx` | Used as in-page fallback form — no changes needed. |
| Backend (`server.py`, leads, etc.) | No backend changes for any of CR-265–268. |
| GTM container tags | Owner action, not code. CR-267 §3 has the exact tag instructions. |

---

## 7. Build, deploy, and post-deploy sequence (not part of this doc — recorded for reference)

1. Implement per the Line-by-Line Plan (next doc).
2. Preview QA: testing agent on preview (5 LPs + homepage + Petpooja, 1920 px and 390 px, throttled-JS tap, scroll-preservation, no banner, sheet submit → OTP, `cta_click`/`sheet_open` in `window.dataLayer`).
3. Production build command: `REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L REACT_APP_WHATSAPP_ENABLED=false yarn build`.
4. Owner deploys zip + Cloudflare "Purge Everything" + **records `main.*.js` hash and IST time** in the register.
5. Owner adds 2 GTM tags + registers GA4 custom dimensions (CR-267).
6. 48 h read: Ads conversions column + `cta_click → sheet_open → form_start` in GA4.

---

## 8. Rollback

| CR | Rollback action | Data impact |
|----|-----------------|-------------|
| CR-265 | Revert 5 LP files to `<button>` (git revert or search-replace) | None |
| CR-266 | Remove `useRef` guard from `ScrollToTop` | None |
| CR-267 | Remove `pushEvent` calls from handlers and `DemoBottomSheet` | No data loss; events simply stop firing |
| CR-268 | Re-add `<ConsentBanner />` import + render; restore `ConsentBanner.jsx` from git | No data loss; consent logic untouched in gtm.js |

All four CRs are independently reversible. A single file (`App.js`) touches CR-266 and CR-268 together, but the changes are in different functions.

---

*Impact analysis complete. No code has been changed. Awaiting owner review before the Line-by-Line Plan is written.*
