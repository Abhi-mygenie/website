# CR-201 — React #418: ConsentBanner Body Class Mutation During Hydration

**Registered:** 2026-09-02  
**Source:** Regression suite T2 — Dev build main.8fe91636.js  
**Status:** 🔲 Open  
**Priority:** P0 — blocks Dev→Beta promotion  
**Regression gate:** T2

---

## Symptom

On every cold page load (fresh browser context, localStorage cleared):

```
document.body.className = 'consent-banner-open'
React console error: Minified React error #418 (hydration mismatch)
```

React error #418 fires within 1–2 seconds of page load on the homepage and all prerendered routes.

---

## Root Cause (from regression T2 static analysis)

`ConsentBanner.jsx` calls `document.body.classList.add('consent-banner-open')` during the first React render cycle when no prior consent choice exists (`hasConsentChoice()` returns `false` for new visitors).

The prerendered HTML (written by `prerender.js`) has **no** `consent-banner-open` class on `<body>` — the `prerender.js` evaluate block explicitly strips it via `document.body.classList.remove("consent-banner-open")`.

When a real browser loads the prerendered HTML and React hydrates:
- Prerendered DOM: `<body class="">` (no class)
- React's expected DOM: `<body class="consent-banner-open">` (class added during first render)
- Mismatch → React #418 → React discards prerendered HTML and re-renders from scratch (CSR fallback)

**Consequence of CSR fallback:**
- All LCP and FCP gains from prerendering are lost (blank page until JS hydrates)
- Every prerendered page regresses to the same user experience as the raw CRA shell
- The entire purpose of the prerender pipeline (CR-101 through CR-197) is negated on cold loads

---

## Affected Pages

All pages — the ConsentBanner is rendered globally in `App.js` via `<ConsentBanner />` outside the route tree. Every prerendered route is affected on cold load.

---

## Evidence

| Check | Value |
|---|---|
| `document.body.className` on cold load | `consent-banner-open` |
| React console error | Confirmed (#418) |
| Build hash | `main.8fe91636.js` (in known-bad list) |
| Prerender strips class? | Yes — prerender.js strips it, but React re-adds during hydration |

---

## Known Hash Correlation

Per project brief, hashes `main.107ff3e9.js`, `main.04593470.js`, `main.8fe91636.js` are all flagged as #418-present. Only `main.74f504ee.js` is the confirmed-clean build. This regression confirms the #418 is still present in the current `main.8fe91636.js` build.

---

## Fix Direction (no code — planning only)

The body class mutation must not occur during the React hydration phase. Options (in order of preference):

1. **Delay body class mutation until after hydration**: Wrap the `document.body.classList` call in a `useEffect` with a `requestAnimationFrame` or `setTimeout(0)` callback so it fires in the next event loop tick, after React hydration has completed.

2. **Use CSS-only approach**: Instead of a body class, apply the padding offset needed for the consent banner via a CSS custom property or a wrapper element that doesn't touch `document.body`, scoped to the `ConsentBanner` component itself.

3. **Isomorphic layout effect**: Replace `useEffect` with a `useLayoutEffect` guarded by `typeof window !== 'undefined'` — this prevents the mutation during SSR/hydration but allows it after.

The fix must ensure:
- Prerendered HTML has no `consent-banner-open` on `<body>` ✅ (already done by prerender.js)
- React's initial render produces no `consent-banner-open` on `<body>` ✅ (needs fixing)
- Post-hydration: class is still added correctly so sticky CTA doesn't overlap the banner ✅

---

## Validation (post-fix)

```bash
# After fix + rebuild:
# 1. Confirm body class not in prerendered HTML
grep "consent-banner-open" /app/frontend/build/index.html
# Expected: no output

# 2. Playwright: fresh context, check console for 418
# Navigate to /, wait 3s, assert no console error containing "418"

# 3. Bundle hash must NOT be in known-bad list
ls /app/frontend/build/static/js/main.*.js
# Must NOT be: main.107ff3e9.js, main.04593470.js, main.8fe91636.js
```

---

## Related CRs

| CR | Relation |
|---|---|
| CR-167 | Added prerender.js strip for ConsentBanner — partial fix (strips from HTML but React re-introduces mismatch) |
| CR-93 | Original ConsentBanner body-class feature (introduced the class mutation) |
| CR-124 | React.lazy Suspense hydration gap — related hydration work |
