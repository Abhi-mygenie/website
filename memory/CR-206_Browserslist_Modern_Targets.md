# CR-206 — browserslist Targets Too Many Old Browsers → Legacy Polyfills Shipped

**Type:** Performance / Build Config
**Date Raised:** 2026-09-04
**Status:** OPEN
**Priority:** P2
**Batch:** AD — Lighthouse Code-Level Gaps
**Source:** Lighthouse preview audit — "Avoid serving legacy JavaScript to modern browsers — Est savings of 10 KiB"
**Effort:** Tiny (1 line in package.json) + rebuild

---

## Problem

`package.json` production browserslist includes `">0.2%"` which covers IE11, Safari 12, Android 5, Firefox 60 — browsers used by <1% of MyGenie's India-mobile audience.

Current config:
```json
"browserslist": {
  "production": [
    ">0.2%",
    "not dead",
    "not op_mini all"
  ]
}
```

Babel transpiles all modern JS (optional chaining, nullish coalescing, async/await, etc.) to ES5 and includes `core-js` polyfills for these old browsers. This adds **10–23 KiB** to the bundle that modern Chrome/Samsung Browser downloads and parses unnecessarily.

Lighthouse specifically flags: "Avoid serving legacy JavaScript to modern browsers — Est savings of 10 KiB"

---

## Fix

**File:** `/app/frontend/package.json`

**Before:**
```json
"production": [
  ">0.2%",
  "not dead",
  "not op_mini all"
]
```

**After:**
```json
"production": [
  "last 2 Chrome versions",
  "last 2 Firefox versions",
  "last 2 Safari versions",
  "last 2 Edge versions",
  "last 2 Samsung versions"
]
```

`Samsung` is added explicitly — Samsung Internet is the dominant browser on Indian Android mid-range phones (Redmi, Realme, Samsung Galaxy).

---

## Expected Impact

| Metric | Before | After |
|---|---|---|
| Legacy JS penalty | 10 KiB | 0 KiB |
| TBT | 852ms | ~800ms |
| Performance Score (preview) | 76 | ~77 |

Small but zero-risk. Improves parse time on every page for all users.

---

## Validation

```bash
# After rebuild — check no IE11 polyfills in bundle
grep -c "core-js" /app/frontend/build/static/js/main.*.js
# Expected: lower count than before

# Check Lighthouse "Avoid legacy JavaScript" audit passes
```

---

## Notes
- Does NOT affect development browserslist (still `last 1 chrome version` etc.)
- No functional change — only affects transpilation output
- Rebuild required after change

*CR-206 registered 2026-09-04. Source: Lighthouse preview URL mobile audit.*
