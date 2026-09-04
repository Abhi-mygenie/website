# CR-117 — Prerender Snapshot Pollution (Duplicate Styles, Blocking Fonts, Duplicate Canonical)

**Type:** Bug / Web Performance + SEO  
**Date Raised:** 2026-08-23  
**Raised By:** Lighthouse mobile test post CR-114 + hero-image-preload implementation  
**Status:** OPEN  
**Priority:** HIGH  
**Effort:** ~1–2 hrs (prerender.js cleanup block only)  
**Improves:** TBT · FCP · SEO  
**Scope:** `frontend/scripts/prerender.js` — `page.evaluate()` cleanup block only  
**Related:** CR-101 (prerender POC), CR-114 (font fix), CR-115 (TBT)

---

## 1. Problem Statement

After the prerender + CR-114 font fixes were applied, a Lighthouse mobile run showed:

| Metric | Expected | Actual | Direction |
|--------|----------|--------|-----------|
| TBT | ~959ms | **1,660ms** | ❌ 73% worse |
| FCP | ~2,700ms | **3,100ms** | ❌ 15% worse |
| Performance | ~65 | **60** | ❌ lower than pre-fix baseline |
| SEO | — | **54** | ❌ unexpectedly poor |
| LCP | ~3s | **3.1s** | ✅ fixed (was 6s) |
| CLS | ~0 | **0.006** | ✅ fixed (was 0.15) |

The root cause is that `prerender.js`'s `page.evaluate()` cleanup block only removes analytics scripts and deduplicates `<title>` tags. It does **not** clean up artefacts that Puppeteer's full-page render introduces into the DOM snapshot.

---

## 2. Three Specific Defects Found

### Defect A — Sonner CSS injected twice: 29.9 KB of duplicate inline `<style>` (PRIMARY)

```
<head> inline styles found in build/index.html:
  style[0]:   772 chars  ← @font-face block (CR-114, correct, 1 copy)
  style[1]: 14,926 chars  ← Sonner toaster CSS — injected by React on hydration
  style[2]: 14,926 chars  ← EXACT DUPLICATE of style[1]
```

During Puppeteer render, React hydrates and the `sonner` toast library dynamically injects a `<style>` block into `<head>`. Puppeteer's `page.content()` captures the post-hydration DOM — including these injected styles — twice (two mount cycles during Puppeteer's render).

**Impact on metrics:**
- 29.9 KB of inline CSS in `<head>` is render-blocking; CSS parser must process it before first paint
- Adds ~500ms to FCP and extends the main-thread blocking window
- Primary driver of TBT increase: 959ms → 1,660ms (+700ms)

**Evidence:**
```bash
grep -c "data-sonner-toaster" /app/frontend/build/index.html
# Returns: 2
```

---

### Defect B — Google Fonts (Poppins) loaded twice as a render-blocking stylesheet

The original `index.html` template loads Poppins non-blocking:
```html
<!-- Template (non-blocking pattern): -->
<link rel="preload" as="style" href="...Poppins..." onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="...Poppins..."/></noscript>
```

During Puppeteer render:
1. `onload` fires → converts `rel` to `stylesheet` → **blocking stylesheet copy #1** lands in snapshot
2. `page.content()` serialises the full DOM including `<noscript>` inner HTML → **blocking stylesheet copy #2** lands in snapshot

Result in prerendered `build/index.html`:
```html
<!-- Both are now blocking stylesheets: -->
<link rel="stylesheet" as="style" href="...Poppins...">  ← onload-converted
<link rel="stylesheet" href="...Poppins..."/>             ← noscript-serialised
```

**Impact:** Poppins requested twice; each is a render-blocking stylesheet. Adds ~150ms to FCP.

---

### Defect C — Duplicate `<link rel="canonical">` → SEO: 54

```html
<link rel="canonical" href="https://placeholder.example.com/">
<link rel="canonical" href="https://placeholder.example.com/">
```

`react-helmet-async` (`Seo.jsx`) injects a canonical tag during React hydration in Puppeteer. The snapshot captures it. The client-side render also produces one. Two canonical tags with the same URL confuse crawlers and depress the SEO score.

**Evidence:** `grep -c "canonical" /app/frontend/build/index.html` → 2

---

## 3. Quantified Impact on Lighthouse

| Defect | Estimated TBT contribution | FCP contribution |
|--------|---------------------------|-----------------|
| A: Duplicate Sonner CSS (29.9 KB inline) | ~+500ms | ~+300ms |
| B: 2× blocking Poppins stylesheets | ~+150ms | ~+100ms |
| C: Duplicate canonical | 0 | 0 (SEO only) |
| **Total excess** | **~+650ms** | **~+400ms** |

Removing these artefacts is expected to restore:
- TBT: 1,660ms → ~950–1,000ms (back to pre-pollution baseline)
- FCP: 3,100ms → ~2,700ms
- SEO: 54 → improvement (single canonical)
- Performance: 60 → ~65–68

---

## 4. Root Cause

`prerender.js` `page.evaluate()` cleanup (lines 44–60) currently handles:
- ✅ Analytics script removal (googletagmanager, posthog)
- ✅ `<title>` deduplication

It does **not** handle:
- ❌ Dynamically injected `<style>` blocks from third-party React libraries (Sonner)
- ❌ `<noscript>` inner links being serialised as live blocking stylesheets
- ❌ `<link rel="canonical">` deduplication

---

## 5. Proposed Fix (prerender.js only — no source/build changes)

Add to the existing `page.evaluate()` cleanup block in `prerender.js`:

```js
// 1. Remove duplicate inline <style> blocks — keep only first occurrence of each unique content
const styleEls = [...document.querySelectorAll('head style')];
const seen = new Set();
styleEls.forEach(el => {
  const key = el.textContent.trim().slice(0, 100);  // fingerprint on first 100 chars
  if (seen.has(key)) el.remove();
  else seen.add(key);
});

// 2. Remove <noscript> blocks from <head> — their inner links become blocking stylesheets in the snapshot
document.querySelectorAll('head noscript').forEach(n => n.remove());

// 3. Deduplicate <link rel="canonical">
const canonicals = [...document.querySelectorAll('link[rel="canonical"]')];
canonicals.slice(1).forEach(c => c.remove());  // keep first, remove rest
```

**No `yarn build` needed.** Only `node scripts/prerender.js` re-run after the fix.

---

## 6. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `frontend/scripts/prerender.js` | Add 3 cleanup blocks inside existing `page.evaluate()` | +12 lines |

No React source files, no CSS files, no config files touched.

---

## 7. Definition of Done

- [ ] `build/index.html` has exactly 1 inline `<style>` block (the @font-face one from CR-114)
- [ ] `build/index.html` has 0 `<noscript>` blocks in `<head>`
- [ ] `build/index.html` has exactly 1 `<link rel="canonical">`
- [ ] `build/index.html` has exactly 1 `<link rel="stylesheet" href="...Poppins...">` (not 2)
- [ ] TBT on next Lighthouse run ≤ ~1,000ms (back to pre-pollution baseline; CR-115 then closes it further)
- [ ] FCP ≤ ~2,800ms
- [ ] SEO score improves from 54
- [ ] Verified by testing_agent before marking fixed

---

## 8. Evidence Commands

```bash
# A: Check duplicate Sonner style blocks
grep -c "data-sonner-toaster" /app/frontend/build/index.html
# Expected now: 2  →  Expected after fix: 1

# B: Check blocking Poppins stylesheets
grep -c "googleapis.com" /app/frontend/build/index.html
# Expected now: 3 (preconnect + 2 stylesheets)  →  after fix: 2 (preconnect + 1)

# C: Check duplicate canonical
grep -c "canonical" /app/frontend/build/index.html
# Expected now: 2  →  after fix: 1

# D: Total inline <style> bytes
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
styles = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
print(sum(len(s) for s in styles), 'bytes,', len(styles), 'blocks')
"
# Expected now: ~30624 bytes, 3 blocks  →  after fix: ~772 bytes, 1 block
```

---

*CR-117 registered 2026-08-23. Source: post-CR-114 Lighthouse mobile regression investigation.*
