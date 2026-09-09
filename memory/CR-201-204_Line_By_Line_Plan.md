# CR-201 + CR-202 + CR-203 + CR-204 — Line-by-Line Implementation Plan (Batch AC)
## Regression Suite Fixes: #418 · Dead Routes · Bakeries h1

**Prepared:** 2026-09-02 Session 5
**Status:** Ready to implement — no owner approval needed
**Priority:** CR-201 = P0 · CR-202/203 = HIGH · CR-204 = HIGH
**Files touched:** 3 (`ConsentBanner.jsx`, `public/_redirects`, `src/data/sectors.js`)
**Build required:** One `yarn build` after all CRs — no intermediate builds needed

---

## Pre-flight

```bash
sudo supervisorctl status            # frontend + backend RUNNING
find /app/frontend/build -name "index.html" | wc -l   # expect 63
ls /app/frontend/build/static/js/main.*.js             # current: main.8fe91636.js (known-bad)
```

---

## CR-201 — React #418: ConsentBanner Body Class Mutation During Hydration

**File:** `/app/frontend/src/components/site/ConsentBanner.jsx`
**Lines touched:** 1, 11, 13–15, 18–25 (4 targeted edits)
**Risk:** Low — additive guard only; no logic or layout change

### Root cause (from regression T2)

`ConsentBanner.jsx` has two `useEffect` hooks:

```
useEffect 1 (L13-15):  fires on mount → setShow(true)        [triggers re-render]
useEffect 2 (L18-25):  fires when show changes →
                          document.body.classList.add("consent-banner-open")
```

On cold load, both effects fire in rapid succession during React's post-hydration flush.
The body class mutation in useEffect 2 can occur during a React render cycle before hydration
has fully committed — producing the mismatch confirmed by the T2 regression (body class found
on `document.body` in a fresh browser context before any user interaction, hash `8fe91636`).

**Fix strategy:** Add a `mountedRef` (using `useRef` — no extra re-render) that is set to `true`
inside the SAME useEffect that calls `setShow(true)`. This guarantees `mountedRef.current` is
`true` before any `show`-triggered body class write can reach the DOM.

---

### Change 1 of 4 — Line 1: Add `useRef` to React import

**Before (line 1):**
```js
import { useEffect, useState } from "react";
```

**After (line 1):**
```js
import { useEffect, useRef, useState } from "react";
```

**What this does:** Imports `useRef` so the `mountedRef` guard below compiles.

---

### Change 2 of 4 — Line 11: Declare `mountedRef` after `show` state

**Before (lines 10–11):**
```js
export default function ConsentBanner() {
  const [show, setShow] = useState(false);
```

**After (lines 10–12):**
```js
export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  const mountedRef = useRef(false); // CR-201: tracks post-hydration mount
```

**What this does:** Declares a ref (not state — no extra re-render) used as a guard in the body
class effect. Initial value `false` matches the prerendered HTML state (no body class).

---

### Change 3 of 4 — Lines 13–15: Set `mountedRef.current = true` inside the mount effect

**Before (lines 13–15):**
```js
  useEffect(() => {
    if (!hasConsentChoice()) setShow(true);
  }, []);
```

**After (lines 13–16):**
```js
  useEffect(() => {
    mountedRef.current = true; // CR-201: mark hydration complete before any class mutation
    if (!hasConsentChoice()) setShow(true);
  }, []);
```

**What this does:** Marks hydration as complete on the SAME tick as `setShow(true)`.
React processes this effect before scheduling the re-render triggered by `setShow(true)`,
so when the body class effect next runs (after `show` changes), `mountedRef.current`
is already `true`. The ref is set and `setShow(true)` is batched together — one re-render.

---

### Change 4 of 4 — Lines 19–25: Add `mountedRef` guard at top of body class effect

**Before (lines 18–25):**
```js
  // CR-93: push body content above banner on mobile/tablet to prevent overlap
  useEffect(() => {
    if (show) {
      document.body.classList.add("consent-banner-open");
    } else {
      document.body.classList.remove("consent-banner-open");
    }
    return () => document.body.classList.remove("consent-banner-open");
  }, [show]);
```

**After (lines 18–27):**
```js
  // CR-93 + CR-201: push body content above banner; guard prevents class mutation
  // during hydration phase (mountedRef is false until post-hydration mount effect fires)
  useEffect(() => {
    if (!mountedRef.current) return; // CR-201: no-op during hydration
    if (show) {
      document.body.classList.add("consent-banner-open");
    } else {
      document.body.classList.remove("consent-banner-open");
    }
    return () => document.body.classList.remove("consent-banner-open");
  }, [show]);
```

**What this does:** The first time this effect runs (immediately after initial mount, `show=false`),
`mountedRef.current` is `false` → returns early → no body class mutation during hydration.
The second time it runs (after `setShow(true)` re-render, `show=true`), `mountedRef.current`
is `true` (set in Change 3 on the same tick) → guard passes → class is added correctly. ✅

### Effect execution order (post-fix, cold load)

```
Tick 1  — Initial render:         show=false, mountedRef.current=false → returns null
Tick 2  — React hydration:        DOM matches render output → no mismatch → NO #418 ✅
Tick 3  — useEffect 1 fires:      mountedRef.current = true; setShow(true);
          useEffect 2 fires:      !mountedRef.current = false (already true) → no-op
Tick 4  — Re-render triggered:    show=true → renders <ConsentBanner>
          useEffect 2 fires again: mountedRef.current=true, show=true → body class added ✅
```

### Validation (post-build)

```bash
# 1. Playwright: fresh context, localStorage cleared, load homepage
# Navigate to /, wait 3 seconds, assert zero console errors containing "418"

# 2. Confirm body class NOT in prerendered HTML (prerender.js strips it)
grep "consent-banner-open" /app/frontend/build/index.html
# Expected: no output

# 3. Bundle hash MUST NOT match known-bad list after rebuild
ls /app/frontend/build/static/js/main.*.js
# Must NOT be: main.107ff3e9.js, main.04593470.js, main.8fe91636.js
```

### Summary of CR-201 changes

| # | Line(s) | Change |
|---|---|---|
| 1 | L1 | Add `useRef` to React import |
| 2 | After L11 | Add `const mountedRef = useRef(false);` |
| 3 | L14 | Add `mountedRef.current = true;` as first line of mount useEffect |
| 4 | L19 | Add `if (!mountedRef.current) return;` as first line of body class useEffect |

**Total: 4 lines added, 0 lines removed, 0 lines changed.**

---

## CR-202 + CR-203 — Dead Routes: `bars-and-pubs` + `hotels` (combined — same file)

**File:** `/app/frontend/public/_redirects`
**Lines touched:** 2 new lines inserted after line 8
**Risk:** Zero — additive only; no existing redirects modified

### Context

The `_redirects` file is processed top-to-bottom by the static host.
The SPA catch-all on line 24 (`/* /index.html 200`) intercepts ALL unmatched URLs — including
`/solutions/bars-and-pubs` and `/solutions/hotels` — and silently serves the homepage,
creating duplicate content at those URLs. New redirects must be placed **before** line 24.

### Why after line 8?

Line 8 already handles the OLD (no-`/solutions/` prefix) bars redirect:
```
/bar-and-pubs    /solutions/bars-pubs    301
```
Placing the NEW `/solutions/bars-and-pubs` redirect immediately after groups the related
redirects together and makes the intent clear to future maintainers.

---

### Change — Lines 8–9 in `_redirects`: Insert 2 new redirects

**Current (lines 7–9):**
```
/cloud-kithen                 /solutions/cloud-kitchens     301
/bar-and-pubs                 /solutions/bars-pubs          301
/bakeries                     /solutions/bakeries           301
```

**After (lines 7–11):**
```
/cloud-kithen                 /solutions/cloud-kitchens     301
/bar-and-pubs                 /solutions/bars-pubs          301
/solutions/bars-and-pubs      /solutions/bars-pubs          301
/solutions/hotels             /solutions/hotels-resorts     301
/bakeries                     /solutions/bakeries           301
```

**Line 9 (new — CR-202):**
```
/solutions/bars-and-pubs      /solutions/bars-pubs          301
```
Maps the slug-mismatched URL to the correct prerendered build directory.

**Line 10 (new — CR-203):**
```
/solutions/hotels             /solutions/hotels-resorts     301
```
Maps the short-form URL to the correct prerendered build directory.

### Why 301 (not 302 or 200)?

- `301` tells Google to permanently transfer any link equity from the incorrect URL to the correct one
- `200` would serve the wrong slug's HTML at the wrong URL (duplicate content) — NOT acceptable
- `302` would signal a temporary redirect — Google would continue indexing the incorrect URL

---

### Validation (post-build)

```bash
# Verify lines are present and before the /* catch-all
grep -n "bars-and-pubs\|solutions/hotels" /app/frontend/public/_redirects
# Expected: 2 lines present

# Verify order — new lines must appear before /*
python3 -c "
lines = open('/app/frontend/public/_redirects').readlines()
bars_line = next((i for i,l in enumerate(lines) if 'bars-and-pubs' in l and 'solutions' in l), None)
hotels_line = next((i for i,l in enumerate(lines) if '/solutions/hotels' in l), None)
catchall_line = next((i for i,l in enumerate(lines) if l.strip().startswith('/*')), None)
print(f'bars-and-pubs at L{bars_line}, hotels at L{hotels_line}, catch-all at L{catchall_line}')
print('PASS ✅' if bars_line < catchall_line and hotels_line < catchall_line else 'FAIL ❌')
"

# Browser tests (T6 regression recheck):
# Navigate to /solutions/bars-and-pubs → expect redirect to /solutions/bars-pubs
# Navigate to /solutions/hotels → expect redirect to /solutions/hotels-resorts
# Both must NOT show homepage content
```

---

## CR-204 — `/solutions/bakeries` h1 Missing CR-187 Keywords

**File:** `/app/frontend/src/data/sectors.js`
**Line touched:** 270 (1 line, value change only)
**Risk:** Zero — h1 field is not CMS-overridden; same CR-187 pattern applied to 8 other sectors

### Context

`sectors.js` line 270 is the `h1` field for the bakeries sector.
All 8 other sectors that were updated by CR-187 use the pattern:
`"[Sector] POS system & billing software — [existing value proposition]"`
Bakeries was missed in that batch. The fix applies the same pattern.

---

### Change — Line 270: Update bakeries `h1`

**Before (line 270):**
```js
    h1: "Bakery POS & management — from morning bread to custom cakes, run with precision.",
```

**After (line 270):**
```js
    h1: "Bakery POS system & billing software — from morning bread to custom cakes, run with precision.",
```

**Change log:**
- `POS & management` → `POS system & billing software`
- Character count: 82ch → 96ch (+14ch — well within safe h1 length)
- Keywords added: `pos system` ×1, `billing software` ×1
- Words removed from h1: `management` (remains present in solutions[1].title "Production Planning" and pains/solutions body copy — h1 removal is safe)

**Why `management` is safe to remove from h1:**
The bakeries sector body still contains management-related terms in:
- `solutions[0].title` = "Order Management" → `management` ×1
- `pains[0].title` = "Advance & bulk orders" → describes management
- The `sub` field and `faqs` also describe production management workflow

The h1 keyword-stuffing risk is avoided — this is the same trade-off applied to all other sectors.

---

### Validation (post-build)

```bash
python3 -c "
import re
html = open('/app/frontend/build/solutions/bakeries/index.html').read()
body = html[html.find('<body'):].lower()

# T3 regression gate
ps = body.count('pos system')
bs = body.count('billing software')
print(f'pos system={ps}  billing software={bs}')

# Meta desc still ≤160ch
m = re.search(r'<meta name=\"description\" content=\"(.*?)\"', html)
desc_len = len(m.group(1)) if m else 0
print(f'meta_desc={desc_len}ch')

# Verify 'management' still in body (not stripped entirely)
mgmt = body.count('management')
print(f'management_in_body={mgmt}')

print('PASS ✅' if ps >= 1 and bs >= 1 and desc_len <= 160 else 'FAIL ❌')
"
# Expected: pos system≥1, billing software≥1, meta_desc≤160, management_in_body≥1
```

---

## Build Command

```bash
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr201-204.log 2>&1
sudo supervisorctl restart frontend
```

Build time: ~3 minutes.

---

## Post-Build Full Verification Checklist

```bash
echo "=== CR-201 Gate 1: mountedRef guard in source ==="
grep -c "mountedRef" /app/frontend/src/components/site/ConsentBanner.jsx
# Expected: 4 (declaration + 3 usages: useRef, .current=true, !mountedRef.current)

echo "=== CR-201 Gate 2: consent-banner-open NOT in prerendered HTML ==="
grep -c "consent-banner-open" /app/frontend/build/index.html
# Expected: 0

echo "=== CR-201 Gate 3: Bundle hash is NEW (not in known-bad list) ==="
ls /app/frontend/build/static/js/main.*.js
# Must NOT be: main.107ff3e9.js, main.04593470.js, main.8fe91636.js

echo "=== CR-202 Gate 4: bars-and-pubs redirect present ==="
grep "bars-and-pubs" /app/frontend/public/_redirects
# Expected: /solutions/bars-and-pubs → /solutions/bars-pubs 301

echo "=== CR-203 Gate 5: hotels redirect present ==="
grep "/solutions/hotels " /app/frontend/public/_redirects
# Expected: /solutions/hotels → /solutions/hotels-resorts 301

echo "=== CR-202+203 Gate 6: Both redirects BEFORE catch-all ==="
python3 -c "
lines = open('/app/frontend/public/_redirects').readlines()
b = next((i for i,l in enumerate(lines) if 'solutions/bars-and-pubs' in l), 999)
h = next((i for i,l in enumerate(lines) if '/solutions/hotels ' in l), 999)
c = next((i for i,l in enumerate(lines) if l.strip().startswith('/*')), 999)
print(f'bars-and-pubs=L{b+1}  hotels=L{h+1}  catchall=L{c+1}')
print('PASS ✅' if b < c and h < c else 'FAIL ❌')
"

echo "=== CR-204 Gate 7: bakeries h1 keywords ==="
python3 -c "
html = open('/app/frontend/build/solutions/bakeries/index.html').read().lower()
body = html[html.find('<body'):]
print('pos_system:', body.count('pos system'))
print('billing_software:', body.count('billing software'))
print('PASS ✅' if body.count('pos system') >= 1 and body.count('billing software') >= 1 else 'FAIL ❌')
"

echo "=== Route count unchanged ==="
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63

echo "=== CR-201 Gate 8 (Playwright — MUST run separately) ==="
echo "Navigate to / with fresh context + localStorage cleared"
echo "Wait 3s — assert zero console errors containing '418'"
echo "Assert document.body.className does NOT contain 'consent-banner-open' at load time"
echo "(class may appear AFTER user scrolls/clicks — that is correct behaviour)"
```

---

## Risk Assessment

| Risk | CR | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| `mountedRef` guard causes consent banner to never appear | 201 | None | High | Guard skips only the INITIAL body class run (`show=false`); when `show` changes to `true`, `mountedRef.current` is already `true` → class added correctly |
| Consent choice not persisted after user clicks Accept | 201 | None | High | `setConsentChoice()` call path unchanged; only the body class mutation is guarded |
| `bars-and-pubs` redirect creates redirect loop | 202 | None | Medium | Target `/solutions/bars-pubs` is a different path from source `/solutions/bars-and-pubs` |
| `hotels` redirect conflicts with `hotels-resorts` route | 203 | None | Medium | Redirects are first-match; `/solutions/hotels` is an exact prefix match that won't catch `/solutions/hotels-resorts` |
| bakeries `management` disappears from page entirely | 204 | None | Low | "management" remains in `solutions[0].title` "Order Management" and pain cards |
| New build hash still in known-bad list | 201 | Low | Critical | Expected to change with ConsentBanner source edit; verify Gate 3 post-build |

---

## Summary Table

| # | CR | File | Line(s) | Change | Type |
|---|---|---|---|---|---|
| 1 | CR-201 | `ConsentBanner.jsx` | L1 | Add `useRef` to import | 1 word added |
| 2 | CR-201 | `ConsentBanner.jsx` | After L11 | Add `const mountedRef = useRef(false);` | 1 line added |
| 3 | CR-201 | `ConsentBanner.jsx` | L14 (new) | Add `mountedRef.current = true;` | 1 line added |
| 4 | CR-201 | `ConsentBanner.jsx` | L19 (new) | Add `if (!mountedRef.current) return;` | 1 line added |
| 5 | CR-202 | `public/_redirects` | After L8 | Add `/solutions/bars-and-pubs → /solutions/bars-pubs 301` | 1 line added |
| 6 | CR-203 | `public/_redirects` | After L8+1 | Add `/solutions/hotels → /solutions/hotels-resorts 301` | 1 line added |
| 7 | CR-204 | `src/data/sectors.js` | L270 | `"Bakery POS & management"` → `"Bakery POS system & billing software"` | 1 value changed |

**Total: 3 files, 7 edits, 1 rebuild. After rebuild: re-run full T1–T8 regression suite.**

---

## Post-Implement: Re-run Regression Gate

After build + restart, re-run T1–T8 regression. **All tests must PASS** before Dev→Beta promotion:

| Test | Expected result after fixes |
|---|---|
| T1 Bundle hash | FLAG if hash changed from 8fe91636 — log new hash |
| T2 React #418 | **PASS** — no #418 in console on cold load |
| T3 bakeries h1 | **PASS** — pos system + billing software confirmed |
| T4 Meta descs | PASS (unchanged) |
| T5 SEO pages | PASS (unchanged) |
| T6 Dead routes | **PASS** — bars-and-pubs + hotels redirect correctly |
| T7 Canonicals | PASS (unchanged) |
| T8 Title uniqueness | PASS (unchanged) |

*Plan prepared 2026-09-02 Session 5. All line numbers verified against current source. Ready to implement.*
