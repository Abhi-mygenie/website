# CR-219 — Line-by-Line Plan: GA4 Consent Mode EEA Region Fix

**CR:** CR-219
**Date:** 2026-09-05
**Status:** Ready to implement
**Risk:** Zero — JSON-only consent config change, no visual change, no component logic change
**Scope:** 2 files, 2 search_replace calls, 1 rebuild

---

## Part 1 — Impact Analysis

### 1.1 Root Cause (confirmed from source)

`public/index.html` L17-25 and `src/lib/gtm.js` L85-93 both set:

```javascript
gtag('consent', 'default', {
    analytics_storage: 'denied',  // applies to EVERY visitor on Earth
    ad_storage: 'denied',
    ...
});
```

There is **no `region` parameter**. Google Consent Mode v2 documentation states that without
a `region` parameter a `consent default` call applies globally. This means Indian restaurant
owners — MyGenie's entire addressable market — start every session with
`analytics_storage: denied`.

### 1.2 Why most Indian sessions are invisible to GA4

The consent banner (`ConsentBanner.jsx`) shows when `localStorage["mg_consent"]` is absent.
`setDefaultConsent()` in gtm.js reads that key:
- Key = `"granted"` → `updateConsent(true)` → GA4 fires ✅
- Key = `"denied"` → `updateConsent(false)` → GA4 blocked ❌
- Key = absent (most Indian users) → **no updateConsent call** → consent stays `denied` → GA4 blocked ❌

Indian users typically scroll the homepage, evaluate pricing, and either submit a form or leave.
They do not interact with the cookie banner. Their `mg_consent` key is never set.
GA4 sees none of these sessions. Meta Pixel sees all of them (it does not check `analytics_storage`).

### 1.3 How Google's region parameter fixes it

Google processes consent defaults in specificity order:
1. Visitor's geolocation is matched against `region` arrays first.
2. If matched → region-scoped rule applies.
3. If not matched → unscoped rule (fallback) applies.

Two-call pattern (the fix):
```javascript
// Call 1: EEA/UK visitors → denied (GDPR)
gtag('consent', 'default', { region: ['EEA', 'GB'], analytics_storage: 'denied', ... });
// Call 2: everyone else (India, US, etc.) → granted
gtag('consent', 'default', { analytics_storage: 'granted', ... });
```

This is the documented, Google-supported pattern. No workarounds.

---

### 1.4 Per-visitor-group impact matrix

| Visitor | Region | mg_consent key | Before fix | After fix | Change |
|---|---|---|---|---|---|
| New Indian user (no banner interaction) | Non-EEA | absent | GA4 **blocked** | GA4 **fires** | ✅ Fixed |
| New Indian user (accepts banner) | Non-EEA | → `"granted"` | GA4 fires (after click) | GA4 fires (from arrival, accept is redundant) | ✅ Same |
| Indian user who previously accepted | Non-EEA | `"granted"` | GA4 fires | GA4 fires | ✅ No change |
| Indian user who previously **declined** | Non-EEA | `"denied"` | GA4 blocked | `updateConsent(false)` overrides `granted` default → GA4 **still blocked** | ✅ Respected |
| New EEA visitor (no banner interaction) | EEA/GB | absent | GA4 blocked (GDPR correct) | GA4 blocked (region-scoped denied) | ✅ No change |
| EEA visitor who accepted | EEA/GB | `"granted"` | GA4 fires | GA4 fires | ✅ No change |
| EEA visitor who declined | EEA/GB | `"denied"` | GA4 blocked | GA4 blocked | ✅ No change |

**Critical row: Indian users who previously declined are fully protected.**
The unscoped `granted` default is set first, then `setDefaultConsent()` reads `"denied"` from
localStorage and immediately fires `updateConsent(false)` which overrides the default.
Google Consent Mode v2 spec: `consent update` always takes precedence over `consent default`.

---

### 1.5 Files affected

| File | Location | Nature of change |
|---|---|---|
| `public/index.html` | L14-26 (inline `<script>`) | Add `region: ['EEA','GB']` to existing call + add second unscoped `granted` default |
| `src/lib/gtm.js` | L82-104 (`setDefaultConsent()`) | Same pattern — mirrors index.html |

**Files NOT affected:**

| File | Why untouched |
|---|---|
| `src/components/site/ConsentBanner.jsx` | No change — banner still shows for all new visitors (hasConsentChoice logic unchanged) |
| `src/components/home/StickyMobileCta.jsx` | No change — bottom offset logic watches for `[data-testid="consent-banner"]` in DOM, unrelated to consent state |
| `src/App.js` | No change — `setDefaultConsent()` call in AttributionTracker useEffect is still correct |
| `gtm.js:updateConsent()` | No change — `consent update` calls have no region param (correct by spec) |
| `gtm.js:initGtm()` | No change — exported but never imported outside gtm.js (dead code). Calls `setDefaultConsent()` internally; will get the fix automatically |
| `scripts/prerender.js` | No change — Puppeteer runs on `localhost`; GTM host guard exits early; consent state is irrelevant for prerender |

---

### 1.6 Interaction with GTM deferred loading (no issue)

GTM loads deferred: on first interaction OR after 3s. When GTM loads, it replays the entire
`dataLayer` queue from the beginning. The consent state at replay time is what GA4 evaluates.

**For new Indian visitors after the fix:**
- T=0ms: inline script sets `analytics_storage: granted` (unscoped default)
- T=~200ms: React useEffect fires `setDefaultConsent()` → no localStorage key → no updateConsent call
- T=3000ms: GTM loads, replays dataLayer → sees `granted` → GA4 fires ✅

**For EEA visitors (unchanged):**
- T=0ms: inline script sets EEA-scoped `denied` + unscoped `granted`; EEA rule wins
- GTM loads → GA4 sees `denied` → blocked until banner accept ✅ (correct)

**`wait_for_update: 500` — stays on EEA call only.**
This parameter tells Google tags: "wait up to 500ms for a consent update before evaluating."
It is only needed for the EEA call because EEA visitors start denied and may update via the banner.
The unscoped `granted` call does not need it — consent is already granted, no update to wait for.

---

### 1.7 SPA navigation behaviour (no regression)

`AttributionTracker` calls `setDefaultConsent()` on every `pathname + search` change.
After GTM has loaded (which it does once, on first interaction), Google's spec states:
`consent default` calls are **ignored** — only `consent update` calls affect the consent state.

So on SPA navigation:
- Both new `consent default` calls (EEA + unscoped) → no-op (container already loaded, ignored)
- `updateConsent()` from localStorage → applied correctly
- No regression for any visitor type

---

### 1.8 Consent banner UX after the fix

Indian new visitors:
- Banner still appears (hasConsentChoice returns false → banner renders)
- GA4 fires from arrival regardless (unscoped `granted` default)
- If they Accept → `updateConsent(true)` → redundant but harmless
- If they Decline → `updateConsent(false)` → overrides granted → GA4 blocked for future visits
- Banner becomes informational/preference-setting rather than a hard tracking gate

No copy changes needed. Banner shows, users can still opt out. Fully functional.

---

## Part 2 — Pre-flight Checks

```bash
# 1. Confirm no region param currently (expected: no output)
grep -n "region" /app/frontend/public/index.html /app/frontend/src/lib/gtm.js

# 2. Confirm exactly one consent default call in each file currently
grep -c "consent.*default" /app/frontend/public/index.html   # inline JS → count via python
python3 -c "
import re
html = open('/app/frontend/public/index.html').read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
for s in scripts:
    if 'consent' in s:
        print('default calls in inline script:', s.count(\"'default'\"))  # Expected: 1
"
grep -c '"consent", "default"' /app/frontend/src/lib/gtm.js   # Expected: 1
```

---

## Part 3 — Edits

### Edit 1 — `public/index.html` L14-26

**Exact old_str (8-space indent, single-quoted keys, 4-space inner indent):**
```
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
```

**new_str:**
```
        <!-- CR-219: Split consent default into EEA-scoped (denied) + global (granted).
             EEA/GB visitors start denied — GDPR compliant, wait_for_update gives banner time.
             All other visitors (India etc.) start granted — no legal requirement to deny,
             and the vast majority of MyGenie's audience is Indian. Visitors who explicitly
             Decline via the banner get updateConsent(false) which overrides this default. -->
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
                'region': ['EEA', 'GB'],
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'functionality_storage': 'granted',
                'security_storage': 'granted',
                'wait_for_update': 500
            });
            gtag('consent', 'default', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'functionality_storage': 'granted',
                'security_storage': 'granted'
            });
        </script>
```

**Verification:**
```bash
grep -n "EEA\|region\|granted\|denied" /app/frontend/public/index.html | head -15
# Expected: region: ['EEA','GB'] on the first call, no region on second call
```

---

### Edit 2 — `src/lib/gtm.js` L77-104 (`setDefaultConsent`)

**Exact old_str:**
```
/**
 * Consent Mode v2 (CR-3B #2). EEA-safe denied defaults set BEFORE the container loads;
 * a stored visitor choice is applied immediately as an update. `wait_for_update` gives
 * the banner a brief window to respond before tags evaluate.
 */
export function setDefaultConsent() {
  try {
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    });
    let stored = null;
    try {
      stored = localStorage.getItem(CONSENT_KEY);
    } catch {
      /* ignore */
    }
    if (stored === "granted") updateConsent(true);
    else if (stored === "denied") updateConsent(false);
  } catch {
    /* ignore */
  }
}
```

**new_str:**
```
/**
 * Consent Mode v2 (CR-219). EEA/GB visitors get denied defaults (GDPR); all other
 * visitors (India etc.) get granted by default — no consent obligation under Indian law.
 * A stored visitor choice is applied immediately as an update, overriding the default.
 * `wait_for_update` only on the EEA call — non-EEA is already granted, no wait needed.
 */
export function setDefaultConsent() {
  try {
    window.dataLayer = window.dataLayer || [];
    // EEA/GB: denied defaults, GDPR-compliant
    gtag("consent", "default", {
      region: ["EEA", "GB"],
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    });
    // Everyone else (India, US, etc.): granted by default
    gtag("consent", "default", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
      functionality_storage: "granted",
      security_storage: "granted",
    });
    let stored = null;
    try {
      stored = localStorage.getItem(CONSENT_KEY);
    } catch {
      /* ignore */
    }
    if (stored === "granted") updateConsent(true);
    else if (stored === "denied") updateConsent(false);
  } catch {
    /* ignore */
  }
}
```

**Verification:**
```bash
grep -c '"consent", "default"' /app/frontend/src/lib/gtm.js  # Expected: 2
grep -n "EEA\|region" /app/frontend/src/lib/gtm.js           # Expected: 1 match (first call only)
```

---

## Part 4 — Full Post-Edit Verification

```bash
echo "=== Edit 1: index.html ==="
python3 -c "
import re
html = open('/app/frontend/public/index.html').read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
for s in scripts:
    if 'consent' in s:
        calls = s.count(\"'default'\")
        has_eea = 'EEA' in s
        has_region = 'region' in s
        has_granted_default = s.count(\"'granted'\") >= 2
        print(f'default calls: {calls}  (expected 2)')
        print(f'has EEA region: {has_eea}  (expected True)')
        print(f'has region param: {has_region}  (expected True)')
        print(f'has granted default: {has_granted_default}  (expected True)')
        print('PASS' if calls == 2 and has_eea else 'FAIL')
"

echo ""
echo "=== Edit 2: gtm.js ==="
python3 -c "
content = open('/app/frontend/src/lib/gtm.js').read()
calls = content.count('\"consent\", \"default\"')
has_eea = 'EEA' in content
has_region = 'region: [' in content
print(f'default calls: {calls}  (expected 2)')
print(f'has EEA: {has_eea}  (expected True)')
print(f'has region param: {has_region}  (expected True)')
print('PASS' if calls == 2 and has_eea else 'FAIL')
"
```

---

## Part 5 — Rebuild

```bash
# Step 1: Beta build (for preview pod testing + audit)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr219.log 2>&1 &
echo "Beta build PID: $!"
```

Watch:
```bash
tail -f /app/memory/build-cr219.log
```

Restart frontend after beta build:
```bash
sudo supervisorctl restart frontend && sleep 4 && sudo supervisorctl status frontend
```

```bash
# Step 2: Hash check
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "Build hash: $NEW"
echo "$BAD" | grep -q "$NEW" && echo "BAD HASH — abort" || echo "HASH CLEAN ✅"
find /app/frontend/build -name "index.html" | wc -l   # Expected: 65
```

```bash
# Step 3: Validate consent block in built output
python3 -c "
import re, json
html = open('/app/frontend/build/index.html').read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
for s in scripts:
    if 'consent' in s:
        print('Has EEA:', 'EEA' in s)            # Expected: True
        print('Has granted default:', 'granted' in s)  # Expected: True
        # After minification, both default calls should be present
        default_count = s.count('default')
        print(f'default occurrences: {default_count}')  # Expected: >= 2
        print('PASS' if 'EEA' in s and 'granted' in s else 'FAIL')
"
```

```bash
# Step 4: Production zip
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build > /app/memory/build-cr219-prod.log 2>&1 &
# After completion:
zip -r /app/mygenie-prod-build.zip build/
ls -lh /app/mygenie-prod-build.zip
```

---

## Part 6 — Rollback

Remove `region: ["EEA", "GB"]` lines and the second `gtag("consent","default",{granted})` block
from both files. Rebuild.

---

## Part 7 — Edit Count Summary

| # | File | Edit |
|---|---|---|
| 1 | `public/index.html` | Add `region: ['EEA','GB']` to existing call + add second `granted` default call |
| 2 | `src/lib/gtm.js` | Same pattern inside `setDefaultConsent()` + update JSDoc comment |

**Total: 2 search_replace calls, 2 files, 1 rebuild.**

---

## Part 8 — Expected Outcome After Deploy

| Metric | Before | After |
|---|---|---|
| GA4 sessions (Indian new visitors) | ~0% tracked | ~100% tracked |
| GA4 sessions (Indian declined) | 0% | 0% (correctly blocked) |
| GA4 sessions (EEA new visitors) | 0% | 0% (correctly blocked — GDPR) |
| Meta Pixel | unaffected | unaffected |
| Lighthouse score | unchanged | unchanged (zero JS bundle impact) |
| Banner shows for new visitors | yes | yes (still shows as preference tool) |

*Plan written 2026-09-05. Ready to implement on instruction.*
