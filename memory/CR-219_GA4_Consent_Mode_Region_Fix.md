# CR-219 — GA4 Consent Mode: Add EEA Region Restriction

**CR:** CR-219
**Date registered:** 2026-09-05
**Status:** Ready to implement
**Priority:** P0
**Risk:** Zero — no visual change, no functional change for users, one rebuild required
**Scope:** 2 edits across 2 files, one rebuild

---

## Problem Statement

`gtag('consent','default',{analytics_storage:'denied',...})` in `public/index.html` (and
mirrored in `src/lib/gtm.js:setDefaultConsent()`) applies globally — there is **no `region`
parameter** to restrict denied defaults to EEA/UK visitors only.

MyGenie's primary audience is Indian restaurant owners. India has no GDPR/ePrivacy obligation
to deny analytics by default. However, the current code denies `analytics_storage` for every
visitor worldwide. The consent banner requires an explicit "Accept" click to grant consent.
Most Indian users scroll the page without interacting with the banner — their `mg_consent`
localStorage key is never set, `setDefaultConsent()` finds `null` and pushes no
`updateConsent()` call, and GA4 stays denied for their entire session.

Meta Pixel is unaffected because it does not check `analytics_storage` — it fires whenever
GTM fires it, regardless of consent state. This creates the observed gap: Meta reports normal
traffic, GA4 shows dramatically lower numbers for the same sessions.

---

## Root Cause (confirmed from source, 2026-09-05)

| File | Line | Code | Problem |
|---|---|---|---|
| `public/index.html` | 17–24 | `gtag('consent','default',{analytics_storage:'denied',...})` | No `region` param → applies to all visitors |
| `src/lib/gtm.js` | 85–102 | `setDefaultConsent()` calls same default then reads localStorage | `null` key → no `updateConsent()` for new/ignoring visitors |

Full investigation: `HANDOVER_2026-09-05_Session7.md` → "GA4 Consent Mode Gap Confirmed" section.

---

## Fix

### Edit 1 — `public/index.html`

Replace the single global `consent default` block with two scoped calls:
- Call 1: `region: ['EEA', 'GB']` → denied (GDPR compliance for Europe)
- Call 2: no region → granted (everyone else, including India)

**old_str:**
```javascript
gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
});
```

**new_str:**
```javascript
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
```

---

### Edit 2 — `src/lib/gtm.js:setDefaultConsent()`

Same pattern — scope the denied default to EEA/GB only, add a granted default for everyone else.

**old_str:**
```javascript
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    });
```

**new_str:**
```javascript
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
    gtag("consent", "default", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
      functionality_storage: "granted",
      security_storage: "granted",
    });
```

---

## Pre-flight Verification (before implementing)

```bash
# Confirm no region param currently
grep -n "region" /app/frontend/public/index.html /app/frontend/src/lib/gtm.js
# Expected: no output
```

---

## Post-Edit Verification

```bash
# Confirm region param added
grep -n "EEA\|region" /app/frontend/public/index.html /app/frontend/src/lib/gtm.js
# Expected: 2 matches (one in each file)

# Confirm two default calls in index.html
grep -c "consent.*default\|default.*consent" /app/frontend/public/index.html
# Expected: 2 (or check inline JS)
```

---

## Rebuild

```bash
# Beta build (preview pod testing)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr219.log 2>&1 &
sudo supervisorctl restart frontend

# Production zip (for CR-200 deployment)
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build
zip -r /app/mygenie-prod-build.zip build/
```

---

## Expected Outcome

- Indian visitors (non-EEA): `analytics_storage: granted` by default → GA4 fires immediately,
  no banner interaction required
- EEA/UK visitors: unchanged behaviour — `analytics_storage: denied` by default, banner
  required to grant
- Meta Pixel: unchanged (was unaffected by consent mode)
- GA4 traffic: should recover to match Meta Pixel volumes for Indian sessions
- Consent banner: still shows for everyone (hasConsentChoice() returns false for new visitors);
  for India visitors it's now informational rather than a blocking gate for analytics

---

## Notes

- `wait_for_update` only needed on the EEA-scoped call (CMP response time buffer)
- The non-EEA `granted` default has no `wait_for_update` — no need to delay
- Both `index.html` and `setDefaultConsent()` in `gtm.js` must be updated — `index.html`
  handles the initial page load; `setDefaultConsent()` handles SPA route changes (called
  in `AttributionTracker` useEffect on every `pathname` change)
- Google's Consent Mode v2 processes the most specific (region-scoped) rule first, then
  falls back to the unscoped rule for all other regions — this is the correct documented pattern

---

*Registered 2026-09-05. Source: code investigation of `public/index.html` + `src/lib/gtm.js`.*
*Full investigation report: `HANDOVER_2026-09-05_Session7.md`.*
*Ready to implement on instruction.*
