# CR-198 + CR-199 — Line-by-Line Implementation Plan
## GTM ID Missing + GTM UseEffect Late Firing

**Prepared:** 2026-09-02 Session 4  
**Status:** Ready to implement — no owner approval needed  
**Priority:** P0  
**Files touched:** 3 (`/app/frontend/.env`, `public/index.html`, `src/App.js`)  
**Build required:** One `yarn build` after all changes  

---

## Architecture Decision

### Why two separate CRs in one plan

CR-198 and CR-199 are inseparable in implementation:
- CR-198 adds `REACT_APP_GTM_ID` to `.env` — this keeps the ID available to any remaining React code that reads it
- CR-199 moves GTM injection from `App.js useEffect` → `public/index.html <head>` — fixes the 8–13s delay

They must ship in the same build. If CR-198 is done alone (env var only), GTM still won't fire because `initGtm()` is a no-op until hosts match. If CR-199 is done alone without CR-198, the React code still references `REACT_APP_GTM_ID` via `gtm.js` L14 — making it consistent to have it set.

### What moves to HTML vs. stays in React

| Responsibility | Was in React | After this CR |
|---|---|---|
| GTM container injection | `initGtm()` in `App.js useEffect` | Inline `<script>` in `public/index.html <head>` |
| Consent Mode v2 defaults (EEA) | `setDefaultConsent()` called by `initGtm()` | Inline `<script>` in `<head>` (before GTM) |
| Stored consent restoration (localStorage) | `setDefaultConsent()` reads `mg_consent` key | Still called from `App.js` on every route |
| `pushEvent()` / `pushLead()` custom events | `lib/gtm.js` | Unchanged — still React |
| `updateConsent()` / `setConsentChoice()` | `ConsentBanner.jsx` | Unchanged — still React |

### Host guard strategy

GTM must NOT fire on preview/beta URLs (would pollute GA4). The host guard is replicated inline in `public/index.html`:
```js
if(['www.mygenie.online','mygenie.online'].indexOf(w.location.hostname) < 0) return;
```
- Emergent preview URL (`*.preview.emergentagent.com`): `hostname` not in list → returns → GTM never loads ✅  
- Puppeteer prerender (localhost): `hostname` = `localhost` → returns → no GTM network request during prerender ✅  
- `www.mygenie.online`: in list → GTM loads at HTML parse time ✅  
- `mygenie.online` (apex): in list → GTM loads ✅  

### Prerender.js interaction

`prerender.js` removes `script[src*="googletagmanager"]` and `iframe[src*="googletagmanager"]`.

Our new inline `<script>` blocks have **no `src` attribute** — they are **not** removed by prerender.js. This is correct:
- **Consent Mode inline script**: stays in prerendered HTML → sets consent defaults at parse time for real browsers ✅  
- **GTM loader inline script**: stays in prerendered HTML → host guard fires at parse time; loads GTM on `www.mygenie.online` ✅  
- **GTM `<noscript>` iframe**: HAS `src` → prerender.js removes it from prerendered HTML ✅ (correct — noscript irrelevant on prerendered pages)  

**prerender.js requires no changes.**

---

## Pre-flight

```bash
# Confirm services running
sudo supervisorctl status
# Confirm current route count
find /app/frontend/build -name "index.html" | wc -l   # expect 63+
# Confirm initGtm is currently the ONLY caller
grep -rn "initGtm" /app/frontend/src/
# Expected: only App.js L38 (import) and L51 (call)
```

---

## CR-198 — Add `REACT_APP_GTM_ID` to `.env`

**File:** `/app/frontend/.env`  
**Lines touched:** 4 (new line appended)  
**Risk:** Zero — env var only, no logic change

### Current file (3 lines):
```
REACT_APP_BACKEND_URL=https://frontend-as-is-run.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### After change (4 lines):
```
REACT_APP_BACKEND_URL=https://frontend-as-is-run.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_GTM_ID=GTM-K5D84Z3L
```

**Change:** Append one line — `REACT_APP_GTM_ID=GTM-K5D84Z3L`

### Why still needed after CR-199

`lib/gtm.js` L14 reads `process.env.REACT_APP_GTM_ID`. Even though we're moving the GTM injection to HTML, the value is still referenced by `gtmAllowed()` in the module (guarding `pushEvent` and `pushLead` indirectly). Setting it makes the bundle consistent and future-proof.

### Validation (post-build)
```bash
grep "GTM-K5D84Z3L" /app/frontend/build/static/js/main.*.js | head -c 100
# Expected: string found (baked into bundle)
```

---

## CR-199 — Move GTM from `useEffect` to `public/index.html`

### Change 1 of 4 — `public/index.html`: Consent Mode v2 + GTM scripts in `<head>`

**File:** `/app/frontend/public/index.html`  
**Insertion after:** Line 8 (`<meta name="facebook-domain-verification" content="52wnu6dg7xaa18lrghxek38u535rtw" />`)  
**Insertion before:** Line 9 (`<link rel="icon" href="/brand/logo.svg" />`)  
**Lines added:** 27  
**Risk:** Low — additive only, no existing lines removed

**Current (lines 8–9):**
```html
        <meta name="facebook-domain-verification" content="52wnu6dg7xaa18lrghxek38u535rtw" />
        <link rel="icon" href="/brand/logo.svg" />
```

**After (lines 8–35, new lines 9–35 inserted):**
```html
        <meta name="facebook-domain-verification" content="52wnu6dg7xaa18lrghxek38u535rtw" />
        <!-- CR-199: Google Consent Mode v2 defaults.
             MUST appear before the GTM snippet. Sets EEA-safe denied defaults for all
             ad/analytics storage. Stored visitor choice is restored on every route change
             by setDefaultConsent() in App.js (reads localStorage key "mg_consent").
             Hardcoded here (not process.env) because public/index.html is a static file. -->
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'functionality_storage': 'granted',
                'security_storage': 'granted',
                'wait_for_update': 500
            });
        </script>
        <!-- CR-199: Google Tag Manager container — loads async at HTML parse time.
             Host-gated: only fires on www.mygenie.online and mygenie.online.
             preview/beta/localhost → hostname check fails → function returns immediately → no GTM load.
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
        <link rel="icon" href="/brand/logo.svg" />
```

---

### Change 2 of 4 — `public/index.html`: GTM `<noscript>` in `<body>`

**File:** `/app/frontend/public/index.html`  
**Insertion after:** Line 162 (the `</noscript>` closing tag of the CSS fallback block)  
**Insertion before:** Line 163 (`<div id="root"></div>`)  
**Lines added:** 4  
**Risk:** Zero — noscript only; prerender.js removes it from prerendered HTML via `iframe[src*="googletagmanager"]` selector

**Current (lines 161–163):**
```html
          </style>
        </noscript>
        <div id="root"></div>
```

**After (lines 161–167 in updated file):**
```html
          </style>
        </noscript>
        <!-- CR-199: GTM noscript fallback (for browsers with JS disabled).
             Removed from prerendered HTML pages by prerender.js evaluate() block
             via selector: iframe[src*="googletagmanager"] -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-K5D84Z3L"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <div id="root"></div>
```

---

### Change 3 of 4 — `App.js` L38: Update import

**File:** `/app/frontend/src/App.js`  
**Line:** 38  
**Risk:** Zero — import-only change; `initGtm` is removed, `setDefaultConsent` added

**Before (line 38):**
```js
import { initGtm, pushEvent } from "@/lib/gtm";
```

**After (line 38):**
```js
import { setDefaultConsent, pushEvent } from "@/lib/gtm";
```

**Why `setDefaultConsent` still needed in React:**  
`setDefaultConsent()` in `lib/gtm.js` (line 82–105) does two things:
1. Sets Consent Mode v2 defaults (harmless duplicate of `<head>` script — no ill effect)
2. Reads `localStorage.getItem("mg_consent")` and calls `updateConsent(true/false)` — **this restores the returning visitor's previous consent choice**

Step 2 is critical for UX: returning visitors who accepted consent must have `analytics_storage: granted` applied on every page load. The HTML `<head>` script only sets defaults; it cannot read localStorage at parse time (would run before page interaction, defeating the purpose). React reads it on every route change via this `useEffect`.

---

### Change 4 of 4 — `App.js` L51: Replace `initGtm()` with `setDefaultConsent()`

**File:** `/app/frontend/src/App.js`  
**Lines:** 50–55 (the `AttributionTracker` useEffect)  
**Risk:** Zero — one function call replaced with another; `initAttribution()` and `pushEvent("page_view", ...)` unchanged

**Before (lines 48–56):**
```js
function AttributionTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    initGtm();
    initAttribution();
    pushEvent("page_view", { page_path: pathname + search, page_url: window.location.href });
  }, [pathname, search]);
  return null;
}
```

**After (lines 48–56):**
```js
function AttributionTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    setDefaultConsent(); // CR-199: restores stored localStorage consent choice; GTM now loaded from <head>
    initAttribution();
    pushEvent("page_view", { page_path: pathname + search, page_url: window.location.href });
  }, [pathname, search]);
  return null;
}
```

**Behaviour delta:**
- `initGtm()` → would inject `<script>` tag into DOM dynamically (no-op after first call). Now removed.
- `setDefaultConsent()` → sets dataLayer consent defaults + restores localStorage choice. Idempotent on every route change.
- `initAttribution()` → unchanged
- `pushEvent("page_view", ...)` → unchanged — still fires correctly because GTM is now already loaded from `<head>` by the time this runs

---

## CR-200 — Production Deploy (Owner Action)

No code changes. Refer to `/app/memory/CR-200_Production_Old_NonPrerendered_Build.md`.

**Owner must run (on their build machine or CI):**
```bash
# 1. Build for production
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build

# 2. Deploy build/ to production web server (nginx document root / S3 / CDN)
# replace existing static files at www.mygenie.online with the new build/

# 3. Verify
curl -s https://www.mygenie.online/ | grep -c "GTM-K5D84Z3L"
# Expected: 2 (one in consent script, one in GTM loader)
curl -s https://www.mygenie.online/ | grep "id=\"root\"" | head -c 200
# Expected: <div id="root"> contains actual HTML (prerendered content), NOT empty
```

---

## Build Command

```bash
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr198-199.log 2>&1
sudo supervisorctl restart frontend
```

Build time: ~3 minutes.

---

## Post-Build Verification Checklist (12 gates)

```bash
echo "=== CR-198: GTM ID baked into bundle ==="
grep -c "GTM-K5D84Z3L" /app/frontend/build/static/js/main.*.js
# Expected: 1+ (env var baked in)

echo "=== CR-199 Gate 1: Consent Mode defaults in index.html shell ==="
grep -c "analytics_storage.*denied" /app/frontend/build/index.html
# Expected: 1

echo "=== CR-199 Gate 2: GTM loader script in index.html shell ==="
grep -c "GTM-K5D84Z3L" /app/frontend/build/index.html
# Expected: 2 (one in consent/GTM scripts, one in noscript)

echo "=== CR-199 Gate 3: Consent Mode appears BEFORE GTM loader ==="
python3 -c "
html = open('/app/frontend/build/index.html').read()
consent_pos = html.find('analytics_storage')
gtm_pos = html.find('gtm.start')
print('PASS ✅' if consent_pos < gtm_pos else 'FAIL ❌ — consent must come before GTM loader')
"

echo "=== CR-199 Gate 4: GTM loader appears in <head> (before </head>) ==="
python3 -c "
html = open('/app/frontend/build/index.html').read()
head_end = html.find('</head>')
gtm_pos = html.find('gtm.start')
print('PASS ✅' if gtm_pos < head_end else 'FAIL ❌ — GTM loader not in <head>')
"

echo "=== CR-199 Gate 5: GTM noscript iframe in <body> ==="
grep -c "ns.html?id=GTM-K5D84Z3L" /app/frontend/build/index.html
# Expected: 1 (in <body>)

echo "=== CR-199 Gate 6: initGtm removed from compiled bundle ==="
grep -c "initGtm" /app/frontend/build/static/js/main.*.js
# Expected: 0 (function removed from App.js — tree-shaken away if unused in gtm.js too)
# Note: initGtm may still be in the bundle as an unexported dead function — that's acceptable.
# What matters is it's not CALLED. Check App.js source instead:
grep "initGtm" /app/frontend/src/App.js
# Expected: 0 lines (import and call both gone)

echo "=== CR-199 Gate 7: setDefaultConsent imported and called in App.js ==="
grep "setDefaultConsent" /app/frontend/src/App.js
# Expected: 2 lines (import line + call line)

echo "=== Prerender Gate 8: GTM scripts present in prerendered homepage ==="
grep -c "GTM-K5D84Z3L" /app/frontend/build/index.html
# Expected: 2 (stays in prerendered HTML — host guard prevents actual loading on localhost/preview)

echo "=== Prerender Gate 9: GTM noscript iframe REMOVED from prerendered pages ==="
# prerender.js removes iframe[src*="googletagmanager"] from prerendered HTML
python3 -c "
import os
pages = ['', 'pricing', 'demo', 'restaurant-billing-software', 'solutions/restaurants']
for p in pages:
    path = f'/app/frontend/build/{p}/index.html' if p else '/app/frontend/build/index.html'
    html = open(path).read()
    has_noscript_iframe = 'ns.html?id=GTM' in html
    # The noscript iframe should be ABSENT (removed by prerender.js) on prerendered pages
    # BUT: the homepage IS the index.html shell itself — prerender writes full content INTO it.
    # The noscript iframe IS in the shell's <body> before prerender.
    # After prerender: prerender.js evaluate() removes it.
    print(f'/{p or \"\"}: noscript_iframe_present={has_noscript_iframe}')
"
# Note: If prerendered pages show noscript_iframe_present=True, update prerender.js evaluate()
# to also query: document.querySelectorAll('noscript > iframe[src*=\"googletagmanager\"]').forEach(...)

echo "=== Route count unchanged ==="
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63 (same as before)

echo "=== CR-198 Gate 11: REACT_APP_GTM_ID in .env ==="
grep "REACT_APP_GTM_ID" /app/frontend/.env
# Expected: REACT_APP_GTM_ID=GTM-K5D84Z3L
```

---

## Rollback Plan

If anything fails after build:
```bash
# Revert App.js changes
git diff /app/frontend/src/App.js
git checkout /app/frontend/src/App.js

# Revert public/index.html changes  
git checkout /app/frontend/public/index.html

# Revert .env (manually remove the last line)
# Remove REACT_APP_GTM_ID=GTM-K5D84Z3L from /app/frontend/.env

# Rebuild with original code
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build
sudo supervisorctl restart frontend
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GTM fires on preview/beta URLs (pollutes GA4) | None | Critical | Host guard in inline script: `indexOf(hostname) < 0 → return` |
| GTM fires during Puppeteer prerender (phantom pageviews) | None | High | Same host guard: localhost not in allowed list |
| Duplicate GTM container load (HTML + old React code) | None | Medium | `initGtm()` removed from App.js (Change 4 of 4) |
| `setDefaultConsent()` fails silently | None | Low | Function has `try/catch` wrapper (gtm.js L83); harmless if dataLayer unavailable |
| Consent Mode defaults set twice (HTML + React) | Low | None | `gtag('consent','default')` is idempotent; second call is ignored by GTM |
| Prerendered pages bloated with GTM scripts | Low | Very Low | Inline scripts are tiny (<20 lines each); no performance impact |
| noscript iframe not removed from prerendered pages | Low | Low | prerender.js removes `iframe[src*="googletagmanager"]`; verify via Gate 9 |
| Build fails due to ESLint `no-undef: gtag` | Low | Build error | `gtag` is a global function defined in the same inline script — not a JS module, ESLint doesn't scan `public/index.html` |

---

## Summary Table

| # | CR | File | Change | Lines |
|---|---|---|---|---|
| 1 | CR-198 | `/app/frontend/.env` | Append `REACT_APP_GTM_ID=GTM-K5D84Z3L` | +1 line |
| 2 | CR-199 | `public/index.html` | Insert Consent Mode v2 defaults `<script>` in `<head>` after L8 | +14 lines |
| 3 | CR-199 | `public/index.html` | Insert GTM container loader `<script>` in `<head>` after consent block | +10 lines |
| 4 | CR-199 | `public/index.html` | Insert GTM `<noscript>` iframe in `<body>` after L162 | +4 lines |
| 5 | CR-199 | `src/App.js` L38 | `import { initGtm, pushEvent }` → `import { setDefaultConsent, pushEvent }` | 1 line changed |
| 6 | CR-199 | `src/App.js` L51 | `initGtm()` → `setDefaultConsent()` | 1 line changed |
| — | CR-200 | _Owner deploy_ | Deploy `build/` to `www.mygenie.online` production server | Owner action |

**Total: 3 files, 6 edits, 1 rebuild.**

---

## GTM Firing Timeline: Before vs. After

| Event | Before (useEffect) | After (this CR) |
|---|---|---|
| HTML delivered to browser | 0ms | 0ms |
| Consent Mode v2 defaults set | ~8,000ms (inside React useEffect) | **~0ms** (inline `<head>` script) |
| GTM container script starts loading | ~8,000ms (injected by useEffect) | **~0ms** (inline `<head>` script, async) |
| GTM container fully loaded | ~10,000ms | **~200–400ms** |
| First pageview tracked in GA4 | ~10,000–13,000ms | **~200–400ms** |
| Fast-bouncing users (< 3s) | **Invisible to GA4** | **Tracked** |
| React hydration | ~3,000–5,000ms | ~3,000–5,000ms (unchanged) |
| Lead form events (`form_submitted`, etc.) | At interaction time | At interaction time (unchanged) |

*Prepared 2026-09-02 Session 4. All line numbers verified against current source. Ready to implement.*
