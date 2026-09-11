# CR-209 — Line-by-Line Plan: GTM Interaction-First Deferred Load

**CR:** CR-209
**Date:** 2026-09-05
**Status:** Ready to implement
**File:** `public/index.html` only — 1 edit
**Risk:** Low
**Prerequisite:** CR-199 (already done — GTM is in `<head>`, this refines it)

---

## What This Plan Changes

The CR-199 GTM snippet (lines 27–40) fires GTM immediately at `<head>` parse time.
This causes ~2,100ms of main-thread blocking (GA4 + Ads + Remarketing tags executing)
during the same window as LCP, giving production a Lighthouse score of 51 and TBT of 2,900ms.

**This plan replaces lines 27–40 with:**
1. Two `<link>` hints (`preconnect` + `dns-prefetch`) so the connection to GTM's servers
   is pre-warmed during idle time.
2. An interaction-first script that fires GTM on the user's first `scroll / click / keydown /
   touchstart` — OR unconditionally after 3 seconds — whichever comes first.

**Everything else in `index.html` (all 283 lines) is untouched.**

---

## Current State Confirmation

```bash
# Confirm current lines 27–40 before editing
sed -n '27,40p' /app/frontend/public/index.html
```

Expected output:
```
        <!-- CR-199: Google Tag Manager container — loads async at HTML parse time.
             Host-gated: only fires on www.mygenie.online and mygenie.online.
             preview/beta/localhost → hostname check fails → function returns → no GTM load.
             Fixes 8-13s GA delay that was caused by initGtm() inside App.js useEffect.
             Prerender safety: on localhost (Puppeteer) hostname guard triggers → no googletagmanager.com request. -->
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

```bash
# Confirm current build hash (baseline before this edit)
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: main.a67281e4.js  (CR-208 build)

# Confirm no existing preconnect for googletagmanager
grep "preconnect" /app/frontend/public/index.html
# Expected: no output (no preconnect tags exist yet)
```

---

## Edit 1 — Replace GTM parse-time snippet with interaction-first defer

**File:** `/app/frontend/public/index.html`
**Tool:** `search_replace`
**Lines replaced:** 27–40 (14 lines → 33 lines, net +19 lines)

### old_str (exact, copy verbatim):
```
        <!-- CR-199: Google Tag Manager container — loads async at HTML parse time.
             Host-gated: only fires on www.mygenie.online and mygenie.online.
             preview/beta/localhost → hostname check fails → function returns → no GTM load.
             Fixes 8-13s GA delay that was caused by initGtm() inside App.js useEffect.
             Prerender safety: on localhost (Puppeteer) hostname guard triggers → no googletagmanager.com request. -->
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

### new_str (exact, copy verbatim):
```
        <!-- CR-209: preconnect + dns-prefetch for GTM.
             Warms the TCP+TLS connection to googletagmanager.com during idle time so that
             when GTM is eventually injected (on interaction / 3s fallback), the download
             is near-instant (no DNS + handshake cost at fire time).
             crossorigin: GTM script uses CORS headers — without crossorigin the browser
             opens a second connection at load time, wasting the preconnect.
             dns-prefetch: fallback for older mobile Chromium builds that ignore preconnect. -->
        <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com">
        <!-- CR-209: GTM interaction-first deferred load.
             Replaces CR-199 parse-time injection. GTM now fires on first user interaction
             (scroll / click / keydown / touchstart) OR after 3s unconditional fallback.
             This moves GTM execution AFTER LCP, eliminating ~2,100ms of main-thread TBT.
             Host guard unchanged: only fires on www.mygenie.online and mygenie.online.
             Prerender safety unchanged: Puppeteer on localhost → hostname guard returns early.
             dataLayer safety: window.dataLayer is initialised above (Consent Mode block).
             All events pushed before GTM loads (page_view, consent updates) are queued in
             dataLayer and replayed when GTM container executes — zero event loss for
             users who interact (scroll / click / type) before submitting any form.
             fired flag: prevents double-injection if both an interaction event AND the
             3s setTimeout fire within the same tick. -->
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
                ['scroll','click','keydown','touchstart'].forEach(function(e) {
                    window.addEventListener(e, loadGTM, { once: true, passive: true });
                });
                setTimeout(loadGTM, 3000);
            })();
        </script>
```

**That is the only edit.**

---

## Line-by-Line Explanation of new_str

| Lines | What | Why |
|---|---|---|
| Comment block (CR-209 preconnect) | Explains preconnect + crossorigin + dns-prefetch | Future agent context |
| `<link rel="preconnect" ... crossorigin>` | Tells browser to open TCP+TLS to GTM server now, during idle | `crossorigin` makes the pre-opened connection reusable when GTM script (a CORS request) actually loads — without it, browser opens a second connection |
| `<link rel="dns-prefetch" ...>` | DNS-only fallback for older mobile browsers that ignore preconnect | Harmless on browsers that support preconnect; ensures at least DNS is resolved on all browsers |
| Comment block (CR-209 GTM defer) | Explains every decision in the script | Replaces CR-199 comment, keeps future agent informed |
| `(function() { ... })()` | IIFE — avoids polluting global scope | Standard pattern |
| `indexOf(hostname) < 0` return | Host guard — identical to CR-199 | GTM never fires on preview/beta/localhost/Puppeteer |
| `var fired = false` | Double-injection guard | Prevents race between interaction event and setTimeout firing simultaneously |
| `function loadGTM()` | GTM injector — identical snippet to CR-199 | Same GTM container ID, same injection method |
| `if (fired) return; fired = true;` | Idempotent — loadGTM() safe to call multiple times | setTimeout and addEventListener both call it; only first call executes |
| `['scroll','click','keydown','touchstart'].forEach(...)` | Registers 4 interaction listeners | Covers all input types: mouse scroll, mouse click, keyboard, mobile touch |
| `{ once: true, passive: true }` | `once`: auto-removes after firing (no leak). `passive`: never blocks scroll (no jank) | Best practice for interaction listeners |
| `setTimeout(loadGTM, 3000)` | Unconditional 3s fallback | Ensures GTM fires even for users who read without any interaction (passive readers, slow scrollers) |

---

## What Is NOT Changed

| Line(s) | Content | Status |
|---|---|---|
| 1–13 | `<!doctype>`, `<html>`, `<head>`, meta tags, facebook verification | ✅ Untouched |
| 14–26 | Consent Mode v2 defaults block (`window.dataLayer`, `gtag consent default`) | ✅ Untouched — fires at parse time as required |
| 41–283 | All font preloads, `@font-face`, styles, body content, PostHog, noscript, `<div id="root">` | ✅ Untouched |
| 195–198 | GTM `<noscript>` iframe fallback | ✅ Untouched — still serves no-JS visitors |
| `src/lib/gtm.js` | All functions: `pushEvent`, `pushLead`, `setDefaultConsent`, `updateConsent`, etc. | ✅ Untouched |
| `src/App.js` | `AttributionTracker`, `setDefaultConsent` calls, all routes | ✅ Untouched |
| All React components | `DemoForm`, `CheckoutModal`, `ConsentBanner`, `ScrollDepthTracker`, all others | ✅ Untouched |

---

## Pre-flight Checks (run before editing)

```bash
# 1. Confirm exact old_str is present (match must be exact for search_replace)
grep -c "CR-199: Google Tag Manager container" /app/frontend/public/index.html
# Expected: 1

# 2. Confirm no preconnect already exists (would create duplicates)
grep -c "preconnect" /app/frontend/public/index.html
# Expected: 0

# 3. Confirm current build baseline
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: main.a67281e4.js

# 4. Confirm 63 prerendered routes exist
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63

# 5. Confirm Consent Mode block is above the GTM block (invariant must hold after edit)
grep -n "analytics_storage\|CR-199: Google Tag Manager\|CR-209" /app/frontend/public/index.html | head -5
# Expected: analytics_storage appears on line ~18 (before GTM/CR-209 on line ~27)
```

---

## Post-edit Verification (run immediately after search_replace, before rebuild)

```bash
# 1. Confirm old GTM snippet is gone
grep -c "CR-199: Google Tag Manager container" /app/frontend/public/index.html
# Expected: 0

# 2. Confirm CR-209 script is present
grep -c "CR-209" /app/frontend/public/index.html
# Expected: 2 (one for preconnect comment, one for script comment)

# 3. Confirm preconnect tags added
grep -c "preconnect" /app/frontend/public/index.html
# Expected: 2 (one preconnect, one dns-prefetch has "prefetch" not "preconnect" — check both)
grep "preconnect\|dns-prefetch" /app/frontend/public/index.html
# Expected:
#   <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
#   <link rel="dns-prefetch" href="https://www.googletagmanager.com">

# 4. Confirm loadGTM function present
grep -c "function loadGTM" /app/frontend/public/index.html
# Expected: 1

# 5. Confirm 3s fallback present
grep -c "setTimeout(loadGTM, 3000)" /app/frontend/public/index.html
# Expected: 1

# 6. Confirm 4 interaction events registered
grep -c "scroll.*click.*keydown.*touchstart" /app/frontend/public/index.html
# Expected: 1

# 7. Confirm fired guard present
grep -c "var fired = false" /app/frontend/public/index.html
# Expected: 1

# 8. Consent Mode still above GTM (critical invariant)
grep -n "analytics_storage\|function loadGTM" /app/frontend/public/index.html
# Expected: analytics_storage on line ~18, loadGTM on line ~46 (analytics_storage MUST be lower number)

# 9. GTM noscript fallback still present (line ~197)
grep -c "ns.html?id=GTM-K5D84Z3L" /app/frontend/public/index.html
# Expected: 1

# 10. Host guard still present in new script
grep -c "www.mygenie.online.*mygenie.online" /app/frontend/public/index.html
# Expected: 1
```

---

## Rebuild

```bash
# Beta build (for preview pod — GTM won't fire due to host guard, but build must succeed)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr209.log 2>&1 &
echo "Build started PID=$!"

# Monitor progress
tail -f /app/memory/build-cr209.log
# Build completes in ~2.5 min. Look for "Done in Xs." at end.
```

---

## Restart

```bash
sudo supervisorctl restart frontend && sleep 4 && sudo supervisorctl status frontend
# Expected: frontend RUNNING
```

---

## Post-build Validation

```bash
# A: Route count unchanged
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63

# B: CR-209 script is in the built index.html (build copies public/index.html)
grep -c "function loadGTM" /app/frontend/build/index.html
# Expected: 1

grep -c "setTimeout(loadGTM, 3000)" /app/frontend/build/index.html
# Expected: 1

# C: Preconnect in built index.html
grep "preconnect\|dns-prefetch" /app/frontend/build/index.html
# Expected: both preconnect and dns-prefetch for googletagmanager.com

# D: Consent Mode still present in built index.html
grep -c "analytics_storage" /app/frontend/build/index.html
# Expected: 1

# E: GTM noscript still present in built index.html
grep -c "ns.html" /app/frontend/build/index.html
# Expected: 1

# F: New build hash (confirms rebuild succeeded)
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: different from main.a67281e4.js

# G: Hash clean (not a known-bad React #418 build)
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "$BAD" | grep -q "$NEW" && echo "HASH FAIL — known bad build" || echo "HASH PASS: $NEW"

# H: Homepage loads correctly (screenshot)
# Take screenshot of https://react-app-direct-2.preview.emergentagent.com
# Verify: hero section visible, nav intact, no blank page
```

---

## Production Build (for www.mygenie.online deployment)

After validating the beta build above:

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online \
REACT_APP_GTM_ID=GTM-K5D84Z3L \
yarn build > /app/memory/build-cr209-prod.log 2>&1 &
echo "Production build PID=$!"
```

Package the production build for deployment:

```bash
cd /app/frontend
zip -r /app/mygenie-cr209-prod-build.zip build/
ls -lh /app/mygenie-cr209-prod-build.zip
# Accessible at: https://react-app-direct-2.preview.emergentagent.com/mygenie-cr209-prod-build.zip
```

---

## Production Testing (after deploying to www.mygenie.online)

### Test 1 — GTM does NOT fire on page load (Chrome DevTools)
```
1. Open www.mygenie.online in Chrome
2. DevTools → Network tab → filter: "gtm.js"
3. Hard refresh (Ctrl+Shift+R)
4. Observe Network tab immediately after load
Expected: gtm.js does NOT appear
5. Scroll down 1 notch
Expected: gtm.js appears within ~500ms
```

### Test 2 — GTM fires on click
```
1. Open www.mygenie.online in Chrome
2. DevTools → Network tab → filter: "gtm.js"
3. Hard refresh — confirm gtm.js not loaded
4. Click "Book a Free Demo" button (DO NOT scroll first)
Expected: gtm.js appears immediately on click
```

### Test 3 — 3s fallback fires (no interaction)
```
1. Open www.mygenie.online in Chrome
2. DevTools → Network tab → filter: "gtm.js"
3. Hard refresh
4. Do NOT scroll, click, or press any key
5. Watch Network tab
Expected: gtm.js appears at approximately t=3s after page load
```

### Test 4 — fired guard prevents double-load
```
After Test 3 (gtm.js already loaded via 3s timeout):
1. Scroll the page
Expected: NO second gtm.js request in Network tab
(fired=true prevents duplicate injection)
```

### Test 5 — GTM Preview: demo form conversion tracked
```
1. Open https://tagassistant.google.com in a new tab
2. Click "Add domain" → enter www.mygenie.online
3. Navigate to www.mygenie.online/demo
4. Fill the demo form and submit
5. In GTM Preview pane:
Expected events:
   - GTM container loaded (fires on first interaction — typing into form)
   - form_submitted event
   - OTP stage: book_demo / thankyou_conversion event
   - Calendly stage: demo_booked event
```

### Test 6 — GA4 Real-Time (session captured)
```
1. Open Google Analytics → Real-Time report
2. Open www.mygenie.online in another window and scroll immediately
Expected: Your session appears in Real-Time → Active users in last 30 min
3. Confirm Source/Medium is recorded
```

### Test 7 — Lighthouse re-audit (key metric check)
```
https://pagespeed.web.dev/report?url=https://www.mygenie.online/
Run 3× — take median
Target:
  TBT:   < 1,500ms  (was 2,900ms)
  LCP:   < 4.2s     (was 5.1s)
  Score: > 62        (was 51)
```

---

## Rollback

If any test fails or unexpected behaviour is observed post-deployment:

```bash
# Revert Edit 1 — swap new_str → old_str in search_replace
# Restore the CR-199 snippet:

# old_str = the entire CR-209 block (preconnect links + interaction-first script)
# new_str = the original CR-199 snippet (lines 27-40 from above)

# Then rebuild:
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build
sudo supervisorctl restart frontend
# For production: REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
```

**Rollback time: ~3 minutes (1 search_replace + rebuild + restart)**

---

## Edit Count Summary

| Step | File | Edit type | Lines |
|---|---|---|---|
| Pre-flight checks | — | bash verification | — |
| **Edit 1** | `public/index.html` | search_replace | 14 lines → 33 lines (net +19) |
| Post-edit verification | — | bash verification | — |
| Rebuild | — | yarn build | — |
| Post-build validation | — | bash + screenshot | — |
| Production build | — | yarn build (optional) | — |

**Total code edits: 1**
**Total files changed: 1**
**New files created: 0**
**React files changed: 0**

---

## Decisions Recorded

| Decision | Choice | Reason |
|---|---|---|
| Defer mechanism | interaction-first + 3s fallback | Minimises data loss vs fixed timer. Scroll triggers GTM immediately for engaged users. |
| Fallback timeout | 3,000ms | Covers passive readers. Short enough that GTM still fires before most users leave. |
| Interaction events | scroll, click, keydown, touchstart | Covers all device types. `once: true` prevents accumulating listeners. |
| Fallback events | `passive: true` | Guarantees scroll listeners never block the main thread. |
| fired guard | `var fired = false` | Prevents race condition between interaction event and setTimeout. |
| preconnect placement | Before CR-209 script, after font preloads | Browser processes preconnect hints early; keeps resource hint block together. |
| crossorigin on preconnect | Yes | GTM script fetched with CORS headers; without crossorigin, browser opens second connection. |
| dns-prefetch | Yes (in addition to preconnect) | Fallback for older mobile Chromium; harmless on modern browsers. |
| GTM container ID | Hardcoded `GTM-K5D84Z3L` | Public value (visible in any production page source). Consistent with CR-199. |
| noscript GTM | Unchanged | Still serves no-JS users. Not affected by JS-based deferral. |

---

## Expected Score After This CR (Production)

| Metric | Before CR-209 | After CR-209 | After CR-209 + CR-186 (CF RUM off) |
|---|---|---|---|
| TBT | 2,900ms | ~1,200–1,500ms | ~800–1,000ms |
| LCP | 5.1s | ~3.8–4.2s | ~3.0–3.5s |
| Score | 51 | **~62–68** | **~72–78** |

CR-186 (Cloudflare RUM beacon off) is an owner action in the Cloudflare dashboard —
no code change needed. Combining both gives maximum production score improvement.

*Plan complete — 2026-09-05. 1 edit, 1 file, ready to implement on instruction.*
*Impact analysis: `/app/memory/CR-209_ImpactAnalysis.md`*
*CR registration: `/app/memory/CR-209_GTM_Interaction_First_Defer.md`*
