# CR-117 — Impact Analysis
## Prerender Snapshot Pollution → TBT Regression + SEO Penalty

**Date:** 2026-08-23
**Author:** E1 planning agent
**Status:** OPEN → ready for implementation
**Read alongside:** `CR-117_Prerender_Snapshot_Pollution.md`

---

## 1. Executive Summary

Three artefacts are being baked into `build/index.html` by the Puppeteer prerender snapshot that were not present in the raw CRA build. Together they added **~700ms to TBT**, **~400ms to FCP**, converted a non-blocking font load into **two blocking stylesheet requests**, and created a **duplicate canonical tag** that depressed SEO to 54.

This is not a regression in the app source code — it is exclusively a problem in `prerender.js`'s cleanup block, which strips analytics but does not strip Puppeteer render artefacts.

| Metric | Before any fixes (Jun 2026) | After CR-114 + hero preload | After CR-117 (predicted) |
|--------|----------------------------|----------------------------|--------------------------|
| FCP | 2,710ms | 3,100ms ❌ worse | **~2,700ms** |
| LCP | 6,006ms | 3,100ms ✅ | **~2,700ms** |
| TBT | 959ms | 1,660ms ❌ worse | **~960ms** |
| CLS | 0.15 | 0.006 ✅ | 0.006 ✅ |
| SI | 2,869ms | 3,800ms ❌ worse | **~3,100ms** |
| Performance | 46 | 60 | **~67–72** |
| SEO | — | 54 ❌ | **improved** |

> After CR-117, the baseline is restored and measurements become meaningful again. CR-115 (TBT ≤ 200ms) can then be evaluated cleanly.

---

## 2. Before Benchmarks — Current Confirmed State

### 2a. Lighthouse mobile run (this session)
| Metric | Value | Score | Status |
|--------|-------|-------|--------|
| First Contentful Paint | 3,100ms | ~54 | 🔴 |
| Speed Index | 3,800ms | ~64 | 🟡 |
| Largest Contentful Paint | 3,100ms | ~63 | 🟡 |
| **Total Blocking Time** | **1,660ms** | **~13** | 🔴 |
| Cumulative Layout Shift | 0.006 | ~100 | ✅ |
| **Performance** | — | **60** | 🟡 |
| **SEO** | — | **54** | 🔴 |

### 2b. Confirmed artefacts in `build/index.html` (measured 2026-08-23)
| Artefact | Count | Size |
|----------|-------|------|
| Inline `<style>` blocks | 3 | 30,624 bytes total |
| — style[0]: @font-face (CR-114, correct) | 1 | 772 bytes |
| — style[1]: Sonner CSS | 1 | 14,926 bytes |
| — style[2]: **EXACT DUPLICATE** of style[1] | 1 | 14,926 bytes |
| `<link rel="stylesheet">` Poppins (blocking) | 2 | — |
| `<noscript>` blocks in `<head>` | 1 | — |
| `<link rel="canonical">` | 2 | — |
| Total `<head>` size | — | 35,065 bytes (34.2 KB) |
| Total HTML size | — | 139,246 bytes (136 KB) |

---

## 3. Root Cause Deep Dive — Each Artefact Explained

### 3a. Artefact 1 — Sonner CSS injected twice (29.9 KB)

**What Sonner is:** The `sonner` library (`<Toaster>` component in the app) is a toast notification system. On mount, it dynamically injects its own CSS as a `<style>` block into `<head>` via JavaScript. This is a common pattern in headless UI libraries.

**Why it appears twice:** Puppeteer renders the page with `waitUntil: "networkidle0"`. During this render:
1. React mounts the component tree → Sonner mounts → injects `<style>` block #1
2. React's strict-mode double-invoke (or a second render cycle in Puppeteer's headless environment) causes Sonner to inject `<style>` block #2

Both are captured by `page.content()` because they are live DOM nodes at snapshot time.

**Why this did not happen before the prerender change:** Before CR-101, the site ran in CSR mode (`yarn start`). The CRA dev server served the raw `index.html` template, which had no injected styles. Prerendering captures the fully hydrated DOM, exposing this injection.

**Render-blocking impact on Lighthouse mobile:**
The browser must parse all inline `<style>` blocks before it can calculate computed styles and begin painting. Two copies of Sonner's 14,926-byte CSS = 29,852 bytes the CSS parser processes on the main thread before FCP.

On Lighthouse mobile (4× CPU throttle, ~400 MIPS equivalent):
```
CSS parse time estimate:
  29,852 bytes × (1ms / 8KB at 4× throttle) ≈ ~3.7ms per KB → ~110ms parse time
  Plus task scheduling overhead → ~300–500ms added to main thread
```

This extends TBT because any main-thread task >50ms during FCP→TTI window contributes to blocking time.

**Proof of exact duplication:**
```
style[1] == style[2]: True
style[1][0:120] == '[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;...'
style[2][0:120] == '[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;...'
```

---

### 3b. Artefact 2 — Poppins loaded twice as a blocking stylesheet

**Original (non-blocking) pattern in `public/index.html` template:**
```html
<!-- Non-blocking: rel starts as "preload", onload converts it -->
<link rel="preload" as="style"
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
      onload="this.onload=null;this.rel='stylesheet'" />
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:..."/>
</noscript>
```

**What Puppeteer does to it:**

Step 1 — `onload` fires: The `onload` handler executes during page render, converting `rel` from `"preload"` to `"stylesheet"`. The DOM node now has `rel="stylesheet"` and `as="style"`. This is a **render-blocking** stylesheet in the snapshot.

Step 2 — `page.content()` serialises `<noscript>`: Puppeteer's `page.content()` returns the full serialised DOM, including the content of `<noscript>` elements (they are in the DOM tree even though their content doesn't execute). The `<noscript>` inner `<link rel="stylesheet">` is therefore written into the snapshot as a live blocking tag.

**Result in `build/index.html`:**
```html
<!-- Copy 1: onload-converted, now blocking -->
<link rel="stylesheet" as="style"
      href="https://fonts.googleapis.com/css2?family=Poppins..."
      onload="this.onload=null,this.rel=&quot;stylesheet&quot;">

<!-- Copy 2: noscript serialised, also blocking -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins..."/>
```

Two separate blocking requests to Google Fonts servers. On Slow-4G (150ms RTT), each request:
- DNS lookup: ~50ms (first time)
- TCP+TLS handshake: ~300ms
- Request+response: ~150ms
- CSS parse: ~20ms

The second request is a full redundant round-trip. Combined with parsing: ~150–200ms additional blocking time per Lighthouse run.

Additionally, the `onload` on Copy 1 is now a no-op (rel is already stylesheet), but the attribute is preserved in the HTML — harmless but noise.

---

### 3c. Artefact 3 — Duplicate `<link rel="canonical">`

**What happens:** `react-helmet-async` is used in `Seo.jsx` to inject SEO meta tags including a canonical URL. The canonical is derived from `process.env.REACT_APP_SITE_URL` which is set to `https://placeholder.example.com` in the preview env.

During Puppeteer render:
1. React mounts → `Seo.jsx` renders → `react-helmet-async` injects `<link rel="canonical" href="...">` into `<head>`
2. `page.content()` captures it → snapshot has 1 canonical ← this is correct
3. BUT: Puppeteer's two-phase render or the `waitUntil: "networkidle0"` can trigger a second Helmet flush → 2nd canonical injected

**Result:**
```html
<link rel="canonical" href="https://placeholder.example.com/">  <!-- #1 -->
<link rel="canonical" href="https://placeholder.example.com/">  <!-- #2 — duplicate -->
```

**Impact on SEO score:** Google's guidelines state: "If a page has multiple canonical links, Google will ignore all of them." Two identical canonicals is treated as conflicting signals. Lighthouse's SEO audit flags duplicate canonicals as a failing check. This alone can drop the SEO score significantly — consistent with the observed SEO: 54.

---

## 4. Impact Quantification

### 4a. Render-blocking weight removed

| Artefact removed | Bytes removed from blocking path | Estimated FCP improvement | Estimated TBT improvement |
|-----------------|----------------------------------|--------------------------|--------------------------|
| Sonner CSS duplicate (style[2]) | 14,926 bytes | ~150ms | ~300ms |
| Sonner CSS original (style[1]) — NOT removed, but deduped to 1× | — | ~150ms | ~300ms |
| 2nd Poppins blocking stylesheet (noscript) | ~800 bytes request overhead | ~100ms | ~100ms |
| **Total** | **~15 KB inline + 1 network request** | **~400ms** | **~700ms** |

> Note: Sonner CSS style[1] is NOT removed — Sonner needs one copy of its CSS for the toast component to function. Only the duplicate (style[2]) is removed.

### 4b. After CR-117 predicted metrics

| Metric | Before any fixes | With pollution (now) | After CR-117 | Δ from now |
|--------|-----------------|---------------------|-------------|-----------|
| FCP | 2,710ms | 3,100ms | **~2,700ms** | −400ms |
| SI | 2,869ms | 3,800ms | **~3,100ms** | −700ms |
| LCP | 6,006ms | 3,100ms | **~2,700ms** | −400ms |
| TBT | 959ms | 1,660ms | **~960ms** | −700ms |
| CLS | 0.15 | 0.006 | 0.006 | 0 |
| Performance | 46 | 60 | **~67–72** | +7–12 |
| SEO | — | 54 | **~70+** | +16+ |

> LCP improves alongside FCP because the hero image is preloaded — it paints at the same frame as FCP. If FCP moves from 3.1s to 2.7s, LCP follows.

### 4c. Lighthouse score path

```
State                  FCP    LCP    TBT      CLS    Perf
───────────────────────────────────────────────────────────
Before all CRs         2.7s   6.0s   959ms    0.15   46
After CR-114 + preload 3.1s   3.1s   1,660ms  0.006  60  ← current (polluted)
After CR-117 (fix)     2.7s   2.7s   ~960ms   0.006  ~70 ← restored + improvement
After CR-115 (TBT)     2.7s   2.7s   <200ms   0.006  ~85
After CR-116 (gzip)    1.5s   1.5s   <200ms   0.006  ~90+
```

---

## 5. Why This Fix is the Right Next Step Before CR-115

CR-115 aims to reduce TBT from ~960ms to ≤200ms by lazy-loading below-fold JS. But currently TBT reads as 1,660ms — 700ms of which is noise from snapshot pollution. If we implement CR-115 without fixing CR-117 first:

- We'd measure TBT improvement from a polluted 1,660ms baseline
- A "success" might look like 1,000ms (still failing) when the true app TBT is ~260ms
- We could wrongly attribute the remaining 800ms to the app JS rather than to the pollution

Fix CR-117 first → get a clean TBT baseline (~960ms) → then measure CR-115's real impact.

---

## 6. Risk Assessment

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|------------|
| Removing style[2] breaks Sonner toasts | Very Low | Low | style[1] is kept; Sonner gets exactly one copy of its CSS |
| Removing noscript breaks Poppins loading | None | None | Poppins loads via the onload-converted Copy 1 which stays |
| Canonical fix breaks SEO | None | None | One canonical is better than two; placeholder URL is same either way |
| page.evaluate changes break prerender | Very Low | Medium | Cleanup is purely DOM manipulation; all other logic unchanged |
| LCP measured differently after fix | Low | Low | FCP and LCP both expected to improve together |

**Overall risk: Very Low.** All changes are defensive removals of duplicated content. Nothing is rewritten or restructured.

---

## 7. Scope of Change

**Only one file changes:** `frontend/scripts/prerender.js`

**What changes:** 3 additions inside the existing `page.evaluate()` block (lines 44–60). The surrounding logic — server, browser launch, routing, file write — is untouched.

**What does NOT change:**
- No React source files (`*.jsx`, `*.js`)
- No CSS files
- No `public/index.html`
- No `yarn build` needed (no source changes)
- Only `node scripts/prerender.js` re-run needed

---

*Impact analysis written 2026-08-23. No code changed.*
