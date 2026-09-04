# CR-199 — GTM Initialized via `useEffect` — Fires 8–13s After HTML Delivery

**Registered:** 2026-09-02  
**Source:** GA/GTM gap investigation (production HTML audit + web research)  
**Status:** 🔲 Open  
**Priority:** P0  
**Owner:** Agent (code + rebuild)

---

## Problem

`/app/frontend/src/App.js` line 50–51:
```js
useEffect(() => {
  initGtm();   // ← only runs after React component tree mounts
}, []);
```

`useEffect` fires **after** React mounts. This happens after:

| Step | Timing |
|---|---|
| 1. Browser receives HTML | 0ms |
| 2. JS bundle download (`main.js`, ~300–500 KB) | +3,000–8,000ms (mobile 4G) |
| 3. JS parse + execute | +500–2,000ms |
| 4. React hydration | +300–800ms |
| 5. `useEffect` fires → `initGtm()` → GTM script injected | **+8,000–13,000ms total** |

**Impact:**

- Users who land and bounce in < 8s (the majority on paid ads, fast-tab behaviour) are **completely invisible** to GA4, Google Ads, and Meta Pixel
- First pageview event fires 8–13s after actual page load — inflating "Avg. Engagement Time" metric
- Consent Mode v2 default (`analytics_storage: denied`) is set correctly in `gtm.js`, but GTM is not yet loaded to enforce it — early dataLayer pushes happen in a container-less void
- Google Ads value-based bidding is fed delayed/incomplete conversion signals → Smart Bidding underperforms

---

## Root Cause

Industry-standard GTM installation uses a synchronous `<script>` tag in `<head>` (plus `<noscript>` in `<body>`) from the **HTML shell** — not dynamically injected by JavaScript. The GTM snippet fires at **HTML parse time**, before any JS bundle is downloaded.

The current implementation injects GTM as a React side-effect because the original architecture assumed GTM should only load on production hosts (guarded by `gtmAllowed()`). This production-gate logic is sound, but the injection point (inside React) is wrong.

---

## Current Code Flow

```
HTML delivered (0ms)
  ↓ (delay: JS download + parse + React hydrate)
React mounts → useEffect fires
  → initGtm()
    → gtmAllowed() checks GTM_ID + hostname
    → if allowed: document.createElement("script") → insert before first <script>
    → GTM container loads
    → dataLayer processes queued events
```

## Correct Standard Pattern

```
HTML delivered (0ms)
  → <script> tag in <head> parsed immediately
    → GTM container loads async (parallel to JS bundle)
    → dataLayer already active
  (user can bounce at 1s — GTM already captured pageview)
```

---

## Affected Files

| File | Detail |
|---|---|
| `/app/frontend/src/App.js` L50–51 | `useEffect(() => { initGtm(); }, [])` — wrong injection point |
| `/app/frontend/src/lib/gtm.js` L30–57 | `initGtm()` — correct logic, wrong caller |
| `/app/frontend/public/index.html` | Missing GTM `<script>` snippet in `<head>` |

---

## Proposed Fix

### Option A — Standard GTM `<head>` snippet in `public/index.html`

Add the standard GTM snippet directly to `public/index.html` between `<head>` tags:

```html
<!-- Google Tag Manager — production hosts only (www.mygenie.online) -->
<!-- CR-199: Move from App.js useEffect to HTML shell for zero-delay firing -->
<script>
(function(w,d,s,l,i){
  if(!i||['www.mygenie.online','mygenie.online'].indexOf(window.location.hostname)<0)return;
  w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
  j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K5D84Z3L');
</script>
```

Add GTM `<noscript>` to `<body>` open:
```html
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-K5D84Z3L"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

Remove `initGtm()` call from `App.js` `useEffect` (or make it a no-op guard so no duplicate injection).

### Option B — Keep `useEffect` but add a `<head>` dataLayer init for Consent Mode v2

If moving the full GTM injection is too risky, at minimum add Consent Mode v2 defaults to `public/index.html` **before** GTM loads, so consent signals are ready when GTM eventually fires. This is a partial fix (still fires late, but consent mode is correct from HTML parse):

```html
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
  analytics_storage:'denied',
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  functionality_storage:'granted',
  security_storage:'granted',
  wait_for_update:500
});
</script>
```

---

## Recommended Approach

**Option A** (full fix) for production. The host guard (`indexOf(window.location.hostname)`) keeps preview/beta from polluting GA4. Hardcoding `GTM-K5D84Z3L` in `public/index.html` is acceptable since this is a public container ID (visible in any page source on production).

After implementing Option A:
- Remove `initGtm()` call from `App.js` to prevent duplicate container load
- Keep `pushEvent()` and `pushLead()` in components unchanged — they push to `window.dataLayer` which GTM now owns from HTML parse time

---

## Estimated Impact

| Metric | Before (useEffect) | After (HTML `<head>`) |
|---|---|---|
| GTM load time | +8,000–13,000ms | +0ms (async, parallel) |
| Bounce-visible to GA | None below ~8s | All users (from 1st request) |
| Google Ads Smart Bidding signals | Severely incomplete | Complete |
| Meta Pixel retargeting audiences | Severely incomplete | Complete |

---

## Dependencies

- **CR-198 must be done first** if using env var approach — OR hardcode `GTM-K5D84Z3L` directly in `public/index.html` (standard practice, container ID is public)
- Rebuild required after any change to `public/index.html`

---

## Related CRs

| CR | Relation |
|---|---|
| CR-107 | GTM container audit (broader) |
| CR-198 | GTM ID missing from `.env` — prerequisite |
| CR-200 | Production not running prerendered build — separate but related (both block GA) |
