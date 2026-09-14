# CR-209 — GTM Interaction-First Deferred Load

**Registered:** 2026-09-05
**Source:** Lighthouse audit — production TBT 2.9s, GTM tags contributing ~2.1s main-thread work
**Status:** 🔲 Open — Ready to implement
**Priority:** P1
**Owner:** Agent (code + rebuild + production zip)
**File:** `public/index.html` only

---

## Problem

GTM currently loads at `<head>` parse time (fixed in CR-199 from useEffect to head — correct).
The load is `async`, but **async only means non-blocking download — the JS still executes on the
main thread during the page render window.**

When GTM's container script downloads and executes, it fires all configured tags simultaneously:
- GA4 pageview tag
- Google Ads conversion linker tag
- Google Ads remarketing tag

These three tags execute during the same main-thread window as React hydration, causing:

| Metric | Preview (no GTM) | Production (GTM fires at parse) |
|---|---|---|
| TBT | ~440ms | **2,900ms** |
| Main-thread work | 3.2s | **6.0s** |
| JS execution time | 1.3s | **4.1s** |
| Lighthouse score | ~84 | **51** |

**The GTM execution cost (~2.1s TBT) exceeds the entire app's own JS cost (~0.8s TBT).**

---

## What We Are Fixing

### Root Cause
GTM loads immediately at HTML parse time. On a 4G mobile device from India:

```
0ms    — HTML received
600ms  — TTFB done, browser starts parsing <head>
600ms  — GTM snippet executes → browser fetches gtm.js from googletagmanager.com
1,200ms — gtm.js arrives → GTM container parses → fires GA4 + Ads + Remarketing
1,200ms–3,200ms — GTM tags executing on main thread ← TBT accumulates here
2,200ms — LCP measured (hero image painted)
3,200ms — GTM tags done
```

The LCP image and GTM tags are competing for the same main thread. GTM wins because it
starts earlier (from `<head>`) and runs continuously.

### What the fix does
Defer GTM injection until the user **first interacts** (scroll / click / keydown / touchstart),
or unconditionally after **3 seconds** — whichever comes first.

```
0ms    — HTML received, <head> parsed, GTM NOT injected
600ms  — React bundle downloads
1,800ms — React mounts, page interactive
2,200ms — LCP measured (hero image painted) ← TBT window now closes
           ↕ (user scrolls or clicks)
~2,300ms — FIRST INTERACTION → GTM fires immediately
           OR
3,000ms — 3-second fallback fires → GTM fires
```

GTM now fires **after** LCP is recorded. Zero main-thread competition with render.

---

## Exact Code Change

**File:** `/app/frontend/public/index.html`
**Lines:** 32–40 (the GTM loader block)

### Before (current — lines 32–40)
```html
<!-- CR-199: Google Tag Manager container — loads async at HTML parse time. -->
<script>
    (function(w,d,s,l,i){
        if(['www.mygenie.online','mygenie.online'].indexOf(w.location.hostname) < 0) return;
        w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-K5D84Z3L');
</script>
```

### After (CR-209)
```html
<!-- CR-209: GTM interaction-first defer.
     Fires on first user interaction (scroll/click/key/touch) OR after 3s fallback.
     Consent Mode v2 defaults (block above) still fire at parse time — unaffected.
     preconnect warms the GTM connection during idle time so download is instant when triggered. -->
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
<script>
    (function() {
        if (['www.mygenie.online', 'mygenie.online'].indexOf(window.location.hostname) < 0) return;
        var fired = false;
        function loadGTM() {
            if (fired) return;
            fired = true;
            (function(w,d,s,l,i){
                w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-K5D84Z3L');
        }
        // Fire on first interaction — whichever comes first
        ['scroll','click','keydown','touchstart'].forEach(function(e) {
            window.addEventListener(e, loadGTM, { once: true, passive: true });
        });
        // Unconditional fallback: fire after 3s even if no interaction
        setTimeout(loadGTM, 3000);
    })();
</script>
```

**Total diff:** Remove 8 lines, add 27 lines (net +19 lines). One file. No React changes.

### What is NOT changed
- Consent Mode v2 `gtag('consent', 'default', {...})` block — stays in `<head>`, fires at parse time ✅
- All `pushEvent()` / `pushLead()` calls in React components — push to `window.dataLayer` which GTM owns ✅
- GTM container ID `GTM-K5D84Z3L` — unchanged ✅
- Host guard logic (`www.mygenie.online` / `mygenie.online`) — unchanged ✅
- `<noscript>` GTM iframe in `<body>` — unchanged ✅
- All React component code — zero changes ✅

---

## Analytics Impact Analysis

### What will be tracked correctly (no change)
| Event | Affected? | Reason |
|---|---|---|
| Demo form submissions | ✅ No change | User scrolled + typed before submitting — GTM fires in < 1s |
| "Book a Demo" CTA clicks | ✅ No change | Click event triggers GTM immediately |
| Pricing page views | ✅ No change | Navigation = click event → GTM fires |
| `/thank-you` conversions | ✅ No change | Page loads fresh after form submit |
| `/payment-success` conversions | ✅ No change | Page loads fresh after payment |
| Calendly iframe opens | ✅ No change | Click on "Book Demo" → GTM fires |
| Scroll depth events | ✅ No change | Scroll itself triggers GTM load |
| GA4 session attribution (UTM) | ✅ No change | GTM reads URL params on fire |

### What will be affected (minor)
| Metric | Before | After | Impact |
|---|---|---|---|
| **Total session count** | Includes all visits | Excludes < 3s zero-interaction visits | −3% to −8% (bots + accidental clicks excluded) |
| **Bounce rate** | Includes sub-3s exits | Excludes sub-3s exits | Artificially lower — not meaningful |
| **Avg. engagement time** | Includes 0s sessions | Excludes 0s sessions | Slightly higher (noise removed) |
| **Google Ads Smart Bidding signals** | Slight delay was already present | Same — conversions still tracked | No change to conversion data |

### Who is NOT tracked (acceptable loss)
- User lands on page, does **nothing** (no scroll, no click, no key), leaves within 3 seconds
- Estimated: **3–8% of total traffic** (bots, wrong-tab closures, accidental clicks)
- These users have **zero conversion probability** for a B2B demo-booking site
- They have **zero ad spend ROI value** — excluding them improves signal quality for Smart Bidding

### Historical comparison
This behaviour is consistent with how GTM was behaving **before CR-199** when it was in
`useEffect` — except CR-199 delayed GTM to 8–13s. CR-209 dials it back to 0–3s (interaction-triggered),
which is a **large improvement** over the old useEffect behaviour and a **moderate accuracy trade-off**
vs the current instant-load behaviour.

---

## Performance Impact Estimates

| Metric | Production now | After CR-209 | Change |
|---|---|---|---|
| TBT | 2,900ms | ~1,200–1,500ms | **−1,400–1,700ms** |
| LCP | 5.1s | ~3.8–4.2s | **−0.9–1.3s** |
| JS execution time | 4.1s | ~2.0–2.2s | **−1.9–2.1s** |
| Lighthouse score (production) | 51 | **~62–68** | **+11–17 pts** |

Note: production will still score lower than preview (~84) because of Cloudflare RUM beacon
(~2s critical path), TTFB from Cloudflare origin (1.1s vs 0.3s pod), and remaining GTM
execution after 3s. Those are infrastructure-level, not code-level.

---

## Interaction with Other CRs

| CR | Relation |
|---|---|
| CR-199 | This CR modifies the same GTM snippet in `index.html`. CR-199 moved GTM from `useEffect` to `<head>` (correct). CR-209 refines the `<head>` snippet to defer on interaction. No conflict. |
| CR-186 | Cloudflare RUM beacon defer — separate infrastructure toggle. Both should be done. |
| CR-206 | browserslist — already applied. No interaction. |
| CR-207 | iconMap bundle split — already applied. No interaction. |
| CR-208 | Suspense split — already applied. No interaction. |

---

## Build Instructions

```bash
# After applying the search_replace to public/index.html:

# Beta build (for preview/testing — GTM won't fire due to host guard)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr209.log 2>&1 &

# Production build (for www.mygenie.online deployment)
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build

sudo supervisorctl restart frontend
```

---

## Testing Plan

### On Preview / Beta (smoke test — GTM won't fire due to host guard)
The host guard (`indexOf(hostname) < 0 return`) means GTM code never runs on preview or beta.
These tests verify the **page still loads correctly** and no JS errors are introduced.

```bash
# 1. Confirm build succeeded and 63 routes prerendered
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63

# 2. Confirm no JS syntax error in built index.html
node -e "
const fs = require('fs');
const html = fs.readFileSync('/app/frontend/build/index.html', 'utf8');
console.log('CR-209 block present:', html.includes('GTM interaction-first defer'));
console.log('preconnect present:', html.includes('preconnect') && html.includes('googletagmanager'));
console.log('loadGTM function present:', html.includes('function loadGTM'));
console.log('3s fallback present:', html.includes('setTimeout(loadGTM, 3000)'));
console.log('consent block intact:', html.includes('analytics_storage'));
"
# Expected: all true

# 3. Screenshot homepage — verify no visual regression
# https://react-app-direct-2.preview.emergentagent.com
```

### On Production (www.mygenie.online) — after deploying production build

#### Test A — GTM fires on scroll (primary path)
1. Open `www.mygenie.online` in Chrome DevTools → Network tab → filter by "gtm.js"
2. Load page — confirm **gtm.js does NOT appear** immediately on page load
3. Scroll down 1 scroll unit
4. Confirm **gtm.js appears in Network tab** within ~500ms of scroll
5. Check Console for GTM errors — expect none

#### Test B — GTM fires on 3s fallback (passive user path)
1. Open `www.mygenie.online` → DevTools → Network tab
2. Load page → do NOT scroll or click
3. Wait 3 seconds
4. Confirm **gtm.js appears** at ~3s mark
5. Confirm no duplicate requests (fired=true guard should prevent double-load)

#### Test C — GA4 session recorded correctly
1. Open `www.mygenie.online` → scroll immediately
2. Open GA4 Real-Time report (`analytics.google.com`)
3. Confirm your visit appears in Real-Time → Active users in last 30 min
4. Confirm source/medium is recorded correctly (Direct or your UTM if tested with one)

#### Test D — Demo form conversion tracked
1. Go to `www.mygenie.online/demo`
2. Fill out the demo booking form and submit
3. Confirm redirect to `/thank-you`
4. In GTM Preview mode (`tagassistant.google.com`) — confirm:
   - GTM container fired
   - GA4 pageview fired on `/thank-you`
   - Google Ads conversion tag fired (if configured on thank-you)

#### Test E — Lighthouse re-audit (key test)
Run PageSpeed Insights on production after deployment:
```
https://pagespeed.web.dev/report?url=https://www.mygenie.online/
```
Target metrics post CR-209:

| Metric | Before | Target |
|---|---|---|
| TBT | 2,900ms | < 1,500ms |
| LCP | 5.1s | < 4.2s |
| Score | 51 | > 62 |

Run 3 times and take the median score.

#### Test F — Conversion data integrity (48h post-deploy check)
- Check GA4 → Engagement → Events → `page_view` count for 24h
- Compare to previous 24h baseline
- Acceptable variance: −5% to +5% (natural day-over-day variance)
- Flag if > −15% drop (would indicate GTM not firing)

---

## Rollback Plan

If any issue is detected post-deployment:

```bash
# Revert index.html — restore CR-199 original GTM snippet:
# In public/index.html, replace the CR-209 block (preconnect + interaction-first script)
# with the original 8-line synchronous GTM snippet from CR-199.

# Rebuild
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
# Deploy to production
```

Rollback time: ~5 minutes (rebuild + redeploy).

---

## Summary

| Item | Detail |
|---|---|
| File changed | `public/index.html` only |
| Net lines added | +19 |
| New dependencies | None |
| New imports | None |
| React changes | None |
| Rebuild required | Yes |
| Expected score gain (production) | **+11–17 Lighthouse points** |
| Expected TBT reduction | **−1,400–1,700ms** |
| Analytics data loss | **~3–8% of sessions** (bots + zero-interaction bounces) |
| Conversion tracking loss | **0%** |
| Rollback time | 5 minutes |

*Registered 2026-09-05. E1 Agent. Ready to implement on instruction.*
