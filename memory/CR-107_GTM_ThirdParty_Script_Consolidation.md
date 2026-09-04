# CR-107 — Live GTM Container Audit and Third-Party Script Consolidation

**Type:** Performance / Analytics Hygiene  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** LOW  
**Plan ID:** L7  
**Effort:** 1 day  
**Improves:** Perf · INP · Main Thread  
**Scope:** GTM Container (GTM-K5D84Z3L), `frontend/src/lib/gtm.js`  
**Related:** CR-72 (code splitting), CR-104 (CSP headers)

---

## 1. Problem Statement

The live site audit found 12 third-party scripts competing for main-thread time, including a reported 5 PostHog bundles. The source code shows only 1 PostHog init in `index.html` — suggesting additional PostHog or other tags are injected via GTM container tags.

Excessive third-party scripts directly impact INP (Interaction to Next Paint) and total blocking time, both Core Web Vitals metrics.

---

## 2. Investigation Required (GTM Container Access Needed)

### Step 1 — GTM Container Audit
In GTM (GTM-K5D84Z3L):
1. Tags tab: list all tags, identify which fire on page load vs event
2. Look for: duplicate PostHog tags, legacy Meta Pixel tags, old Google Analytics UA tags, unused conversion tags
3. Identify any tags that fire on ALL pages vs specific events

### Step 2 — Network waterfall review
Open Chrome DevTools → Network tab on production site:
- Count unique third-party script domains
- Identify scripts with > 50ms execution time
- Flag any scripts with `render-blocking` flag

### Step 3 — Consolidation actions
- Remove legacy/unused GTM tags
- Defer non-critical tags (chat widgets, supplementary analytics) to `Window Loaded` trigger instead of `DOM Ready`
- Verify PostHog deduplication: the `index.html` init + any GTM tag should not double-initialize
- Target: ≤ 6 unique third-party script domains on initial load

---

## 3. Code Change (if needed)

If `gtm.js` needs to defer the GTM container load itself:
```js
// In initGtm() — delay GTM load by 2s after page load for non-critical tracking
export function initGtm() {
  if (inited || !gtmAllowed()) return;
  // For performance: defer GTM until after page interactive
  if (document.readyState === 'complete') {
    _loadGtm();
  } else {
    window.addEventListener('load', () => setTimeout(_loadGtm, 1000), { once: true });
  }
}
```

---

## 4. Definition of Done

- [ ] GTM container audit completed; unused/duplicate tags removed
- [ ] ≤ 6 third-party script domains on initial page load
- [ ] No duplicate PostHog initialization
- [ ] INP measurement baseline established before and after

---

*CR-107 registered 2026-08-20. Source: SEO & QS Audit · Plan ID L7.*
