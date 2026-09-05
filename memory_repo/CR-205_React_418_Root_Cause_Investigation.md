# CR-205 — React #418 Root Cause: Unidentified Hydration Mismatch

**Registered:** 2026-09-02  
**Source:** Regression T2 — still failing after CR-201 (Batch AC) implementation  
**Status:** 🔲 Open  
**Priority:** P0 — blocks Dev→Beta promotion  
**Regression gate:** T2  

---

## Status of CR-201

CR-201 implemented a `mountedRef` guard in `ConsentBanner.jsx` that prevents `document.body.classList.add('consent-banner-open')` during the hydration cycle. This is **correctly implemented** and the body class no longer appears on `<body>` at page load time.

However, the React #418 error **persists** in build `main.ea6df739.js` after the CR-201 fix.

**Root cause of the diagnostic error in CR-201:** `document.body` is OUTSIDE React's virtual DOM tree. React's `hydrateRoot` only reconciles content inside `<div id="root">`. A mutation to `document.body.className` cannot cause React error #418. The CR-201 RCA was a false correlation (both the body class mutation and the #418 occurred on cold load; they are independent events).

---

## Known Hash Correlation

| Hash | Status |
|---|---|
| `main.74f504ee.js` | ✅ Confirmed clean (no #418) |
| `main.107ff3e9.js` | ❌ #418 present |
| `main.04593470.js` | ❌ #418 present |
| `main.8fe91636.js` | ❌ #418 present (pre-Batch AC) |
| `main.ea6df739.js` | ❌ #418 present (post-Batch AC) |

The `74f504ee` clean build was presumably from an earlier session before several recent features were added. Every build since has had #418.

---

## Components Investigated and Cleared

Extensive static analysis conducted. ALL of these were investigated and cleared as not the root cause:

| Component | Why cleared |
|---|---|
| `ConsentBanner.jsx` | body class on `document.body` — outside React root, cannot cause #418 |
| `Reveal.jsx` | `useState(true)` initial → visible at both prerender and hydration → no mismatch |
| `DemoForm.jsx` | `isMobile=false` initial matches prerender (Puppeteer viewport ≥768px) |
| `CmsProvider.jsx` | All localStorage reads in `useEffect`; initial state deterministic |
| `StickyMobileCta.jsx` | `consentUp` only affects className when `visible=true`; initial `visible=false` → `translate-y-full` in both |
| `Seo.jsx` | SITE_URL is compile-time constant; no runtime variables in render |
| `WhatsAppFab.jsx` | Static render; `window.location` only in click handler |
| `Navbar.jsx` | `scrolled=false` initial; window access only in `useEffect` |
| `TrustBand.jsx` | Static render via `EditableList`; `published={}` fallback deterministic |
| `EditableList/Text/Image` | `getValue()` returns `fallback` when `published={}` — same in prerender and hydration |
| `HomeFaq.jsx` | Static data; accordion `open=false` initial |
| `FaqItem.jsx` | `open=false` initial → closed state always deterministic |
| `antiBot.jsx` | `mountedAt = Date.now()` — not rendered into DOM, only used in form submit callback |

---

## Likely Remaining Suspects (not yet investigated)

| Suspect | Reason |
|---|---|
| `ScrollDepthTracker.jsx` | Uses `window.innerWidth` — check if it renders anything into DOM |
| Sonner `<Toaster>` | React library that renders its own DOM tree; may render differently on hydration |
| react-helmet-async v3 portal mechanism | Injects into `<head>` via portals; may conflict with CR-199 inline scripts |
| `useAttribution` hook | Returns attribution data from localStorage — check if any component renders this into JSX |
| `HelmetProvider` context reconciliation | If Helmet deduplicated tags during prerender but renders fresh on client |
| `HomeFaq` lazy-loaded section | `lazy(() => import(...))` — if Suspense boundary catches this during hydration |

---

## Recommended Investigation Approach

### Step 1 — Enable dev build for detailed error output
Temporarily switch to dev build (`yarn start` with CRA dev server) and check the FULL React error message which shows the exact component and attribute that mismatched.

```bash
# In development, React error #418 includes:
# "Prop `className` did not match. Server: 'X' Client: 'Y'"
# "    at ComponentName"
# This pinpoints the exact element
```

### Step 2 — Binary search via Suspense boundaries
Comment out major page sections one by one (HomeFaq, TrustBand, DemoForm, StickyMobileCta) and rebuild until #418 disappears. The last removed section contains the root cause.

### Step 3 — Add onRecoverableError callback
```js
// index.js — temporary debug addition
ReactDOM.hydrateRoot(rootEl, app, {
  onRecoverableError: (error, errorInfo) => {
    console.error("[HYDRATION]", error.message, errorInfo.componentStack);
  }
});
```
Even in production builds, this logs the component stack for #418. Run Playwright with `capture_logs: true`.

### Step 4 — Check CR-199 impact on Helmet
Verify that the inline `<script>` blocks added by CR-199 to `<head>` are not being counted or processed by react-helmet-async's portal mechanism during hydration reconciliation.

---

## Files to Investigate Next

- `/app/frontend/src/components/site/ScrollDepthTracker.jsx`
- `/app/frontend/src/index.js` (add onRecoverableError)
- `/app/frontend/src/pages/Home.jsx` (binary search: comment sections)
- `/app/frontend/src/lib/cms/CmsProvider.jsx` L57–67 (useEffect timing vs hydrateRoot)

---

## Related CRs

| CR | Relation |
|---|---|
| CR-201 | First attempt — correctly fixed body class timing but root cause was misidentified |
| CR-124 | Previous hydration fix — Suspense/lazy gap |
| CR-125 | CmsProvider blocking hydration TBT — related context |
