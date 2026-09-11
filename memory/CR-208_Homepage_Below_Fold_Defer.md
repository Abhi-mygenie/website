# CR-208 — 9 Below-Fold Homepage Sections Load Immediately → Compete with LCP Image

**Type:** Performance / Code Splitting
**Date Raised:** 2026-09-04
**Status:** OPEN
**Priority:** P1
**Batch:** AD — Lighthouse Code-Level Gaps
**Source:** Lighthouse preview audit — LCP 2.2s, TBT 852ms. Root cause: 9 lazy chunks downloading on page load, competing with hero image for bandwidth.
**Effort:** Small (Home.jsx — split Suspense or add IntersectionObserver trigger)

---

## Problem

`Home.jsx` wraps all 9 below-fold sections in a **single Suspense boundary**:

```jsx
<Suspense fallback={null}>
  <ProblemGrid />      // chunk starts downloading immediately
  <BeforeAfter />      // chunk starts downloading immediately
  <OutcomePillars />   // chunk starts downloading immediately
  <SectorSelector />   // chunk starts downloading immediately
  <ModuleOverview />   // chunk starts downloading immediately
  <AIBand />           // chunk starts downloading immediately
  <ProofSection />     // chunk starts downloading immediately
  <HomeFaq />          // chunk starts downloading immediately
  <CtaDemo />          // chunk starts downloading immediately
</Suspense>
```

When React renders this tree, it immediately triggers **9 concurrent chunk downloads** — even though the user can only see the hero section. These 9 network requests compete with:
- LCP hero image download (`/brand/banner.webp` or `banner-mobile.webp`)
- Font files (Poppins, Clash Display)
- Main CSS bundle

On a Slow 4G connection, bandwidth is shared across all of these simultaneously, which directly pushes LCP from ~1.5s to ~2.2s.

Additionally, React holds the entire below-fold section in Suspense until ALL 9 chunks have loaded — meaning one slow chunk delays all others.

---

## Fix

### Option A — Split into two Suspense groups (recommended, minimal change)

Separate the first 2 sections (user sees immediately on scroll) from the remaining 7 (further below fold):

```jsx
{/* First scroll — load promptly */}
<Suspense fallback={null}>
  <ProblemGrid />
  <BeforeAfter />
</Suspense>

{/* Below fold — defer until needed */}
<Suspense fallback={null}>
  <OutcomePillars />
  <SectorSelector />
  <ModuleOverview />
  <AIBand />
  <ProofSection />
  <HomeFaq />
  <CtaDemo />
</Suspense>
```

This doesn't defer loading but it breaks the "all-or-nothing" single Suspense gate — sections can render as their individual chunks arrive.

### Option B — IntersectionObserver trigger (bigger win, more effort)

Only start loading below-fold chunks when the user scrolls near them:

```jsx
// Home.jsx
const [belowFoldVisible, setBelowFoldVisible] = useState(false);
const triggerRef = useRef(null);

useEffect(() => {
  const obs = new IntersectionObserver(
    ([e]) => { if (e.isIntersecting) setBelowFoldVisible(true); },
    { rootMargin: '200px' }  // start loading 200px before viewport
  );
  if (triggerRef.current) obs.observe(triggerRef.current);
  return () => obs.disconnect();
}, []);

return (
  <>
    <Hero />
    <TrustBand />
    <div ref={triggerRef} />   {/* sentinel — triggers load */}
    {belowFoldVisible && (
      <Suspense fallback={null}>
        <ProblemGrid />
        ...
      </Suspense>
    )}
  </>
);
```

With Option B, on page load the browser only downloads:
- main bundle
- Hero component (already eager)
- TrustBand (already eager)
- LCP image + fonts

The 9 chunk downloads don't start until the user scrolls 200px from the hero section.

---

## Important Note: Prerender Compatibility

The IntersectionObserver approach (Option B) has a **prerender consideration**: Puppeteer runs with `navigator.webdriver = true`, and the prerendered HTML must include below-fold content for SEO. 

Solution: Check `navigator.webdriver` in the `useEffect` and set `belowFoldVisible = true` immediately for Puppeteer:

```js
useEffect(() => {
  if (navigator.webdriver) {
    setBelowFoldVisible(true);  // Puppeteer: render everything for prerender
    return;
  }
  // ... IntersectionObserver setup
}, []);
```

---

## Expected Impact

| Metric | Before | After Option A | After Option B |
|---|---|---|---|
| LCP | 2.2s | ~2.0s | ~1.6–1.8s |
| TBT | 852ms | ~750ms | ~650ms |
| Performance score (preview) | 76 | ~79 | ~82–84 |

---

## Files to Change

| File | Change |
|---|---|
| `src/pages/Home.jsx` | Split Suspense OR add IntersectionObserver trigger |

---

## Validation

```bash
# After rebuild — verify all 63 routes still prerendered
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63

# Verify below-fold content IS in prerendered homepage HTML
grep -c "ProblemGrid\|billing-software\|BeforeAfter\|OutcomePillars" /app/frontend/build/index.html
# Expected: content present (prerender ran with webdriver=true)
```

---

## Implementation Order

Implement AFTER CR-207 (bundle reduction) — CR-207 reduces the size of the chunks being deferred; CR-208 controls when they load. Together they compound: smaller + later = maximum LCP improvement.

*CR-208 registered 2026-09-04. Source: Lighthouse mobile audit, Home.jsx single-Suspense analysis.*
