# CR-198 — `REACT_APP_GTM_ID` Not Set in `.env` — GTM Is a Build-Time No-Op

**Registered:** 2026-09-02  
**Source:** GA/GTM gap investigation (production HTML audit)  
**Status:** 🔲 Open  
**Priority:** P0  
**Owner:** Agent (env var + rebuild) — GTM container config is owner action

---

## Problem

`/app/frontend/src/lib/gtm.js` line 14–25:
```js
const GTM_ID = process.env.REACT_APP_GTM_ID;

function gtmAllowed() {
  if (!GTM_ID) return false;   // ← bails immediately when env var absent
  return ALLOWED_HOSTS.includes(window.location.hostname);
}
```

`REACT_APP_GTM_ID` is **not set** in `/app/frontend/.env` (or anywhere in the repo `.env` files).

Because React bakes `REACT_APP_*` values at **build time**, the compiled bundle has:
```js
const GTM_ID = undefined;
```

This means `initGtm()` (called from `App.js` `useEffect`) is a **complete no-op** on every page load. The GTM container `GTM-K5D84Z3L` (referenced in `gtm.js` comments) never loads. Downstream consequences:

| Tag | Effect |
|---|---|
| GA4 | Zero pageviews tracked |
| Meta Pixel | Base tag never fires — retargeting audiences not built |
| Google Ads conversion tags | No conversions recorded — Quality Score degrades |
| Enhanced Conversions | Not firing |

The `pushEvent()` / `pushLead()` calls in `DemoForm.jsx` still queue to `window.dataLayer`, but with no GTM container loaded, those events are never forwarded to any ad platform.

---

## Root Cause

The GTM container ID (`GTM-K5D84Z3L`) was never added as an environment variable. The variable is **design-present** (the code reads it correctly) but **deployment-absent** (it was never written to `.env`).

---

## Affected Files

| File | Detail |
|---|---|
| `/app/frontend/.env` | Missing `REACT_APP_GTM_ID=GTM-K5D84Z3L` |
| `/app/frontend/src/lib/gtm.js` L14 | Reads `process.env.REACT_APP_GTM_ID` |
| `/app/frontend/src/App.js` L51 | Calls `initGtm()` in `useEffect` |

---

## Fix

**Step 1 — Add env var (1 line to `/app/frontend/.env`):**
```
REACT_APP_GTM_ID=GTM-K5D84Z3L
```

**Step 2 — Rebuild:**
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

**Step 3 — Verify (post-build):**
```bash
# GTM ID should now be baked into JS bundle
grep "GTM-K5D84Z3L" /app/frontend/build/static/js/main.*.js
# Expected: found
```

---

## Notes

- `ALLOWED_HOSTS` in `gtm.js` is `"www.mygenie.online,mygenie.online"` — GTM will **not** load on preview/beta URLs even after this fix. This is intentional (prevents polluting GA4 with dev/preview traffic).
- To test on beta: temporarily add `beta.mygenie.online` to `REACT_APP_ALLOWED_HOSTS` in `.env`, rebuild, then remove.
- **Do not add `REACT_APP_GTM_ID` to the Emergent platform's frontend.env without also setting `REACT_APP_ALLOWED_HOSTS`** — else the preview pod will pollute production GA4.
- This CR is a prerequisite for CR-199 (GTM placement) — even after moving GTM to `<head>`, the ID must be present.

---

## Related CRs

| CR | Relation |
|---|---|
| CR-107 | GTM container audit (broader) — this CR is the specific blocking gap |
| CR-199 | GTM `useEffect` late-firing — second part of the same tracking gap |
