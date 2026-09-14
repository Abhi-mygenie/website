# CR-208 — Line-by-Line Plan: Defer Below-Fold Homepage Chunks

**CR:** CR-208
**Date:** 2026-09-04
**Status:** Ready to implement
**File:** `src/pages/Home.jsx` only
**Risk:** Low

---

## Critical Finding: Impact Revised After CR-207

**Original premise:** 9 home section chunks (~100 KB each = ~900 KB) competed with the
LCP hero image, adding ~4.5s of download congestion on Slow 4G.

**Reality after CR-207:** lucide-react wildcard removal shrank every chunk dramatically.

```
Before CR-207:
  9 chunks × ~100 KB each = ~900 KB  →  ~4.5s download on Slow 4G  ← real competition
  
After CR-207:
  ProblemGrid    2 KB
  BeforeAfter    3 KB
  OutcomePillars 2 KB
  SectorSelector 3 KB
  ModuleOverview 3 KB
  AIBand         3 KB
  ProofSection   3 KB
  HomeFaq        8 KB
  CtaDemo        3 KB
  ─────────────────
  Total:        34 KB  →  0.17s download on Slow 4G  ← negligible
```

**34 KB in 0.17s does not meaningfully compete with the 18 KB LCP image (0.09s).**

### Revised impact

| Metric | Original estimate | Revised estimate | Why |
|---|---|---|---|
| LCP improvement | −0.4–0.6s | −0.0–0.1s | Chunks too small to matter |
| TBT improvement | −150–200ms | −10–30ms | Minor reduction |
| Score gain | +3–4 points | **+0 to +1 point** | Chunks tiny after CR-207 |

---

## Should We Still Implement?

**Yes — but scope it down to Option A (split Suspense), not Option B (IntersectionObserver).**

Option B (IntersectionObserver) was designed to prevent large chunks from competing with LCP.
Since that problem is solved by CR-207, Option B's complexity is no longer justified for
a 0-1 point gain.

**Option A still provides:**
1. **Progressive separation**: 2 sections (first scroll) load independently from 7 sections (deeper scroll)
2. **Future-proofing**: if chunks grow again (new features), deferral structure is already in place
3. **Code clarity**: explicitly marks above-fold vs below-fold rendering boundary
4. **Zero risk**: pure React Suspense split — no new APIs, no state, no side effects

---

## The Change — Option A Only

**1 edit. 3 lines changed.**

### Current (lines 42–52)

```jsx
        <Suspense fallback={null}>
          <ProblemGrid />
          <BeforeAfter />
          <OutcomePillars />
          <SectorSelector onSectorDemo={handleSectorDemo} />
          <ModuleOverview />
          <AIBand />
          <ProofSection />
          <HomeFaq />
          <CtaDemo sector={sector} />
        </Suspense>
```

### After

```jsx
        <Suspense fallback={null}>
          <ProblemGrid />
          <BeforeAfter />
        </Suspense>
        <Suspense fallback={null}>
          <OutcomePillars />
          <SectorSelector onSectorDemo={handleSectorDemo} />
          <ModuleOverview />
          <AIBand />
          <ProofSection />
          <HomeFaq />
          <CtaDemo sector={sector} />
        </Suspense>
```

**What changes:**
- `<ProblemGrid />` and `<BeforeAfter />` (first scroll — user sees these immediately) get their own Suspense boundary.
- The remaining 7 sections get a separate Suspense boundary.
- React can now show `ProblemGrid + BeforeAfter` as soon as their 2 chunks arrive (5 KB total), without waiting for the other 7 chunks.
- No state. No useEffect. No new imports. Zero new APIs.

**What does NOT change:**
- Import statements (lines 1–18) — untouched
- Component state and callbacks (lines 21–33) — untouched
- The eagerly-loaded above-fold section (Hero, TrustBand) — untouched
- Footer, StickyMobileCta — untouched
- All 9 lazy imports — untouched (still all lazy)

---

## Pre-flight Check

```bash
# Confirm current Suspense block (single boundary)
grep -n "Suspense" /app/frontend/src/pages/Home.jsx
# Expected: lines ~42 and ~52 (one open, one close)

# Confirm current build hash
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: main.1273e3d6.js  (CR-207 baseline)
```

---

## Edit 1 — Split the Suspense block (Home.jsx lines 42–52)

**File:** `/app/frontend/src/pages/Home.jsx`
**Tool:** `search_replace`

**old_str:**
```
        <Suspense fallback={null}>
          <ProblemGrid />
          <BeforeAfter />
          <OutcomePillars />
          <SectorSelector onSectorDemo={handleSectorDemo} />
          <ModuleOverview />
          <AIBand />
          <ProofSection />
          <HomeFaq />
          <CtaDemo sector={sector} />
        </Suspense>
```

**new_str:**
```
        <Suspense fallback={null}>
          <ProblemGrid />
          <BeforeAfter />
        </Suspense>
        <Suspense fallback={null}>
          <OutcomePillars />
          <SectorSelector onSectorDemo={handleSectorDemo} />
          <ModuleOverview />
          <AIBand />
          <ProofSection />
          <HomeFaq />
          <CtaDemo sector={sector} />
        </Suspense>
```

That is the **only edit.**

---

## Verify Before Rebuild

```bash
# Confirm 2 Suspense blocks now (not 1)
grep -n "Suspense" /app/frontend/src/pages/Home.jsx
# Expected:
#   42: <Suspense fallback={null}>
#   45: </Suspense>
#   46: <Suspense fallback={null}>
#   56: </Suspense>
# i.e. 4 lines (2 open + 2 close)

# Confirm ProblemGrid and BeforeAfter are in first boundary
sed -n '42,56p' /app/frontend/src/pages/Home.jsx
```

---

## Rebuild

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr208.log 2>&1 &
echo "PID=$!"
tail -f /app/memory/build-cr208.log
```

---

## Restart

```bash
sudo supervisorctl restart frontend && sleep 3 && sudo supervisorctl status frontend
```

---

## Validation

```bash
# A: 63 routes prerendered (Home.jsx is the homepage)
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63

# B: Below-fold content IS in prerendered homepage HTML
# (Suspense with fallback=null still renders content on server/Puppeteer)
python3 -c "
html = open('/app/frontend/build/index.html').read()
checks = {
    'ProblemGrid section':      'data-testid=\"problem-grid\"',
    'SectorSelector section':   'data-testid=\"sector-selector\"',
    'AIBand section':           'data-testid=\"ai-band\"',
    'HomeFaq section':          'data-testid=\"home-faq\"',
    'CtaDemo section':          'data-testid=\"cta-demo\"',
}
for name, marker in checks.items():
    print(f'{name}: {\"PRESENT\" if marker in html else \"MISSING\"}')"
# Expected: all PRESENT

# C: T1 hash clean
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "$BAD" | grep -q "$NEW" && echo "FAIL" || echo "PASS $NEW"

# D: Homepage renders correctly
# Screenshot https://react-frontend-live.preview.emergentagent.com
# Verify: hero visible, nav works, below-fold sections visible on scroll
```

---

## Rollback

If anything breaks:

```bash
# Revert Edit 1 (swap new_str → old_str in search_replace)
# Rebuild
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build
sudo supervisorctl restart frontend
```

---

## Why NOT Option B (IntersectionObserver)

Option B adds:
- 2 new React hooks (`useRef`, `useEffect`)  
- New state variable (`belowFoldVisible`)
- New `useEffect` with IntersectionObserver + webdriver guard + timeout
- Modifications to `scrollToDemo` callback  
- CLS risk if prerender/hydration timing isn't perfect
- 3× more code for 0–1 point gain

At **34 KB total chunks downloading in 0.17s**, the bandwidth problem is already solved by CR-207. Option B would be correct if chunks were large. They are not.

Option A is the right scope for CR-208 post-CR-207.

---

## Summary

| Item | Detail |
|---|---|
| File changed | `src/pages/Home.jsx` |
| Lines changed | 42–52 (10 lines → 13 lines) |
| New APIs | None |
| New imports | None |
| Effort | 1 edit, 3 min rebuild, 2 min validate |
| Expected score gain | +0 to +1 point |
| Primary value | Future-proof split, clean code boundary |

*Plan complete — 2026-09-04. Ready to implement on instruction.*
