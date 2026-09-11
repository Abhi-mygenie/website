# CR-117 — Line-by-Line Implementation Plan
## Prerender Snapshot Pollution Cleanup

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-117_ImpactAnalysis.md`, `CR-117_Prerender_Snapshot_Pollution.md`

---

## 0. Prerequisite State Check

Before touching any file, confirm the current state matches what the plan was written against.

```bash
# A. Confirm 3 style blocks exist (2 Sonner + 1 @font-face)
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)
styles = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
print('Style blocks:', len(styles))          # Expected: 3
print('Sonner duplicates:', styles[1]==styles[2])  # Expected: True
"

# B. Confirm 2 blocking Poppins stylesheets
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
poppins = re.findall(r'<link[^>]*googleapis[^>]*rel=\"stylesheet\"[^>]*>|<link[^>]*rel=\"stylesheet\"[^>]*googleapis[^>]*>', html)
print('Blocking Poppins links:', len(poppins))   # Expected: 2
"

# C. Confirm 2 canonical tags
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
c = re.findall(r'<link[^>]*canonical[^>]*>', html)
print('Canonical tags:', len(c))            # Expected: 2
"
```

All three must confirm expected values before proceeding. If any differ, re-investigate before implementing.

---

## 1. The One File That Changes

**File:** `/app/frontend/scripts/prerender.js`
**Section:** The `page.evaluate()` block — lines 44–60 (current state)
**Change type:** Additions only — 3 cleanup blocks added inside the existing evaluate block

**Current state of the block (lines 44–60):**
```js
      await page.evaluate(() => {
        document.querySelectorAll(
          'script[src*="googletagmanager"],script[src*="posthog"],iframe[src*="googletagmanager"]'
        ).forEach((n) => n.remove());
        const titles = document.querySelectorAll("title");           // dedupe base + helmet title
        for (let i = 0; i < titles.length - 1; i++) titles[i].remove();
        // Inject hero image preload so browser starts download at HTML parse time
        const heroImg = document.querySelector('[data-testid="hero-visual"] img');
        if (heroImg && heroImg.src) {
          const preload = document.createElement("link");
          preload.rel = "preload";
          preload.as = "image";
          preload.setAttribute("fetchpriority", "high");
          preload.href = new URL(heroImg.src).pathname;  // root-relative, strips localhost:PORT
          document.head.appendChild(preload);
        }
      });
```

---

## 2. Three Additions — Precise Line-by-Line Plan

All three blocks are inserted **after line 49** (after the title dedup, before the hero image preload injection). Order matters: cleanup must happen before we inject the new preload tag (so we don't accidentally remove it).

---

### Addition 1 — Deduplicate inline `<style>` blocks (Sonner CSS)

**Insertion point:** After line 49 (`for (let i = 0; i < titles.length - 1; i++) titles[i].remove();`)

**Code to insert:**
```js
        // 1. Remove duplicate inline <style> blocks injected by React libraries (e.g. Sonner)
        //    Strategy: fingerprint each <style> on its first 100 chars; keep first, remove subsequent duplicates.
        const seenStyles = new Set();
        document.querySelectorAll('head style').forEach((el) => {
          const key = el.textContent.trim().slice(0, 100);
          if (seenStyles.has(key)) el.remove();
          else seenStyles.add(key);
        });
```

**Line count:** 6 lines (including blank line separator above)

**What this does:**
- Iterates every `<style>` element in `<head>`
- Fingerprints each on its first 100 characters (unique enough to distinguish Sonner from @font-face, and Sonner from itself)
- Keeps the FIRST occurrence of each unique style, removes all subsequent exact duplicates
- Result: style[0] (@font-face, 772 chars) kept ✅ · style[1] (Sonner, 14,926 chars) kept ✅ · style[2] (Sonner duplicate, 14,926 chars) **removed** ✅

**Why fingerprint on first 100 chars and not full content:**
- Exact full-text comparison on 14,926-char strings is more memory-intensive in browser JS
- The first 100 chars of each style block are unique enough to distinguish between:
  - `@font-face{font-family:'Clash Display'` (our font block)
  - `[data-sonner-toaster][dir=ltr]` (Sonner CSS — appears in both duplicates)
- 100 chars is enough to uniquely identify a style block without false positives

**What is NOT removed:** The original Sonner style[1] stays — Sonner needs exactly one copy to render toast notifications correctly.

---

### Addition 2 — Remove `<noscript>` blocks from `<head>` (second Poppins blocking stylesheet)

**Insertion point:** After Addition 1

**Code to insert:**
```js
        // 2. Remove <noscript> blocks from <head> — their inner links get serialised by page.content()
        //    as live blocking stylesheets. Real browsers with JS don't use noscript content;
        //    Poppins still loads via the onload-converted <link rel="stylesheet"> that stays.
        document.querySelectorAll('head noscript').forEach((n) => n.remove());
```

**Line count:** 4 lines

**What this does:**
- Removes the `<noscript>` element from `<head>` entirely
- This eliminates the second Poppins stylesheet that was being serialised into the snapshot
- Poppins continues to load via the `<link rel="stylesheet" as="style" href="...Poppins...">` tag that remains (the one converted from preload by `onload`)

**What is NOT broken:** The `<noscript>` inside `<body>` ("You need to enable JavaScript to run this app.") is NOT touched — the selector is `head noscript`, scoped to `<head>` only.

**Why we keep Copy 1 (the onload-converted Poppins link):**
- The font must still load for the page to render correctly (body text uses Poppins)
- Copy 1 (`<link rel="stylesheet" as="style" ...>`) is a valid stylesheet request
- It is technically a blocking resource, but it was always going to load Poppins — we're just ensuring it's one request not two
- Making it fully non-blocking again would require additional logic (resetting `rel` to `preload` and reattaching the `onload`) which is fragile; out of scope for this CR

---

### Addition 3 — Deduplicate `<link rel="canonical">` (SEO fix)

**Insertion point:** After Addition 2

**Code to insert:**
```js
        // 3. Deduplicate <link rel="canonical"> — react-helmet-async can inject multiple copies
        //    during Puppeteer's render cycle. Keep only the first; remove all subsequent.
        const canonicals = document.querySelectorAll('link[rel="canonical"]');
        Array.from(canonicals).slice(1).forEach((c) => c.remove());
```

**Line count:** 4 lines

**What this does:**
- Selects all canonical link tags
- Keeps the first one (index 0), removes all others (index 1, 2, ...)
- In the current snapshot: 2 canonicals → after fix: 1 canonical

**Why keep the first and not the last:** The first canonical is injected by `react-helmet-async` during the initial render. The second is a duplicate from a re-render. Both point to the same URL, so which one is kept doesn't matter functionally — the first is the safest choice.

**SEO impact:** Moving from 2 canonicals to 1 eliminates the Lighthouse SEO audit failure for "Document doesn't have a valid canonical URL". Expected SEO score improvement.

---

## 3. Final State of `page.evaluate()` Block (after all additions)

For review — the complete block as it will look after implementation:

```js
      await page.evaluate(() => {
        // ── existing: analytics cleanup ──────────────────────────────────────────
        document.querySelectorAll(
          'script[src*="googletagmanager"],script[src*="posthog"],iframe[src*="googletagmanager"]'
        ).forEach((n) => n.remove());

        // ── existing: title dedup ────────────────────────────────────────────────
        const titles = document.querySelectorAll("title");
        for (let i = 0; i < titles.length - 1; i++) titles[i].remove();

        // ── NEW 1: deduplicate inline <style> blocks (Sonner injects twice) ──────
        const seenStyles = new Set();
        document.querySelectorAll('head style').forEach((el) => {
          const key = el.textContent.trim().slice(0, 100);
          if (seenStyles.has(key)) el.remove();
          else seenStyles.add(key);
        });

        // ── NEW 2: remove <noscript> from <head> (serialised as blocking link) ───
        document.querySelectorAll('head noscript').forEach((n) => n.remove());

        // ── NEW 3: deduplicate canonical links ───────────────────────────────────
        const canonicals = document.querySelectorAll('link[rel="canonical"]');
        Array.from(canonicals).slice(1).forEach((c) => c.remove());

        // ── existing: hero image preload injection ───────────────────────────────
        const heroImg = document.querySelector('[data-testid="hero-visual"] img');
        if (heroImg && heroImg.src) {
          const preload = document.createElement("link");
          preload.rel = "preload";
          preload.as = "image";
          preload.setAttribute("fetchpriority", "high");
          preload.href = new URL(heroImg.src).pathname;
          document.head.appendChild(preload);
        }
      });
```

**Total new lines:** 14 (including blank separators for readability)
**Lines removed:** 0
**Existing logic:** unchanged — all 4 existing cleanup actions preserved

---

## 4. Execution Steps After Code Edit

No `yarn build` needed. Source files unchanged. Only `prerender.js` changes.

### Step 1 — Re-run prerender
```bash
cd /app/frontend && node scripts/prerender.js
# Expected output: prerendered / -> /app/frontend/build/index.html
```

### Step 2 — Structural verification (all must pass before declaring done)

```bash
python3 << 'PYEOF'
import re
html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)
styles = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
noscripts = re.findall(r'<noscript>', head)
canonicals = re.findall(r'<link[^>]*canonical[^>]*>', html)
poppins_blocking = re.findall(r'<link[^>]*rel="stylesheet"[^>]*googleapis[^>]*>|<link[^>]*googleapis[^>]*rel="stylesheet"[^>]*>', html)
image_preloads = re.findall(r'<link[^>]*as=.image[^>]*>', html)
font_preloads = re.findall(r'<link[^>]*as=.font[^>]*>', html)

results = {
  "G1 style blocks == 2":          len(styles) == 2,
  "G2 Sonner not duplicated":       styles[0] != styles[1] if len(styles)==2 else False,
  "G3 noscript in head == 0":       len(noscripts) == 0,
  "G4 canonical tags == 1":         len(canonicals) == 1,
  "G5 Poppins blocking == 1":       len(poppins_blocking) == 1,
  "G6 image preload present":        len(image_preloads) == 1,
  "G7 font preloads == 2":           len(font_preloads) == 2,
  "G8 hero text in HTML":            'boosts profit by up to' in html,
  "G9 no fontshare":                 'fontshare' not in html,
  "G10 head size < 10KB":            len(head) < 10240,
}

all_pass = all(results.values())
for k,v in results.items():
    print(f"{'✅' if v else '❌'} {k}")
print(f"\n{'ALL PASS' if all_pass else 'FAILURES PRESENT'}")
PYEOF
```

### Expected after-fix values for each gate

| Gate | Before fix | After fix target |
|------|-----------|-----------------|
| G1: style blocks | 3 | **2** (1× @font-face + 1× Sonner) |
| G2: no Sonner duplicate | False | **True** |
| G3: noscript in head | 1 | **0** |
| G4: canonical tags | 2 | **1** |
| G5: blocking Poppins | 2 | **1** |
| G6: image preload | 1 | **1** (unchanged) |
| G7: font preloads | 2 | **2** (unchanged) |
| G8: hero text | ✅ | **✅** (unchanged) |
| G9: no fontshare | ✅ | **✅** (unchanged) |
| G10: head < 10 KB | ❌ (34.2 KB) | **✅** (~6–8 KB) |

### Step 3 — Static server (no restart needed)
`static-server.js` reads files from disk on each request. After `prerender.js` updates `build/index.html`, the new file is served immediately. No supervisor restart required.

### Step 4 — Screenshot to confirm no visual regression

Take a screenshot of the preview URL. The page must look identical — hero heading, image, nav, CTAs, stats band all present.

### Step 5 — Call testing_agent (mandatory)

Testing agent confirms all 10 structural gates pass and no visual regression.

---

## 5. Rollback Plan

If the fix causes any unexpected issue:

```bash
cd /app/frontend && git checkout scripts/prerender.js
node scripts/prerender.js
# Restores previous prerender.js and rebuilds snapshot (back to polluted state)
```

The source code (`*.jsx`, CSS, `public/index.html`) is untouched by this CR and requires no rollback.

---

## 6. Definition of Done

- [ ] All 10 structural gates (G1–G10) pass
- [ ] `<head>` size reduced from 34.2 KB to < 10 KB
- [ ] Exactly 2 inline `<style>` blocks (1× @font-face + 1× Sonner)
- [ ] Exactly 0 `<noscript>` elements in `<head>`
- [ ] Exactly 1 `<link rel="canonical">`
- [ ] Exactly 1 blocking Poppins stylesheet
- [ ] Image preload and font preloads unchanged (no regression from CR-114 + hero preload fix)
- [ ] Visual screenshot confirms no regression
- [ ] Testing agent report confirms gates pass
- [ ] CR-117 status updated: OPEN → FIXED

---

*Line-by-line plan written 2026-08-23. No code changed. Ready for implementation on approval.*
