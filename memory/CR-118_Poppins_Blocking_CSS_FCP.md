# CR-118 — Poppins (Body Font) Blocks FCP for 820ms via Google Fonts

**Type:** Bug / Web Performance (FCP · LCP)
**Date Raised:** 2026-08-23
**Raised By:** Lighthouse FCP diagnostics screenshot (post CR-114/117)
**Status:** OPEN
**Priority:** HIGH
**Effort:** ~2–3 hrs
**Improves:** FCP · LCP · TTFB perception
**Scope:** `public/index.html`, `public/fonts/` (new Poppins woff2 files)
**Related:** CR-114 (Clash Display self-host — same technique), CR-116 (gzip)

---

## 1. Problem Statement

Lighthouse FCP diagnostics show:

```
▲ Eliminate render-blocking resources — Est savings of 1,040 ms
  Google Fonts [CDN]  1.1 KiB   820 ms
    /css2?family=Poppins:wght@400;500;600;700;800&display=swap
    (fonts.googleapis.com)       820ms blocking duration
```

The Poppins CSS from `fonts.googleapis.com` is a **render-blocking stylesheet** holding FCP back by up to **820ms**. The browser cannot paint the first pixel until this external CSS resolves, because it declares `@font-face` rules that the layout engine requires to size text.

This is distinct from Clash Display (fixed in CR-114): Poppins is the **body font** (`font-family: "Poppins", sans-serif` in `index.css`) used across all visible text on the page — headings, body paragraphs, buttons, nav items.

---

## 2. Root Cause

### 2a. How Poppins became a blocking stylesheet

In `public/index.html`, Poppins was originally loaded non-blocking via the `onload` pattern:
```html
<link rel="preload" as="style"
      href="https://fonts.googleapis.com/css2?family=Poppins..."
      onload="this.onload=null;this.rel='stylesheet'" />
```

During Puppeteer prerender (CR-101/117):
1. The `onload` handler fires → converts `rel` to `stylesheet`
2. `page.content()` serialises this converted tag as a blocking `<link rel="stylesheet">`
3. In CR-117, we cleaned up the noscript duplicate but this **primary converted copy stays** — as a blocking stylesheet

**Current state in `build/index.html`:**
```html
<link rel="stylesheet" as="style"
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
      onload="this.onload=null,this.rel=&quot;stylesheet&quot;">
```
This is `rel="stylesheet"` — blocking by definition.

### 2b. Why 820ms

On Lighthouse mobile (Slow-4G, 150ms RTT):
```
DNS lookup for fonts.googleapis.com:   ~50ms (possibly cached)
TCP + TLS handshake:                  ~300ms (2 RTTs)
HTTP request + response (1.1 KiB):    ~150ms
CSS parse (@font-face declarations):   ~20ms
Total:                                ~520ms minimum
+ fonts.gstatic.com round-trip for woff2 discovery: ~300ms
Lighthouse measured:                   820ms
```

### 2c. Why Clash Display fix didn't help Poppins

CR-114 self-hosted Clash Display (the **display/heading** font). It did not address Poppins (the **body** font). They are separate Google-served fonts requiring independent fixes.

---

## 3. Evidence

From Lighthouse FCP/LCP diagnostics screenshot (2026-08-23):
- **"Eliminate render-blocking resources — Est savings of 1,040ms"**
- Google Fonts Poppins: 1.1 KiB CSS, **820ms blocking duration**
- Tagged as affecting: **[FCP] [LCP] [Unscored]**

---

## 4. Proposed Fix — Self-host Poppins woff2 (same technique as CR-114)

### Step 1 — Download Poppins woff2 files for Latin subset

Weights needed (from codebase): 400 (body), 500 (medium), 600 (semibold), 700 (bold)
Weight 800 is declared in the Google Fonts URL but not material to FCP.

```bash
mkdir -p /app/frontend/public/fonts
# Latin-subset woff2 from Google Fonts (measurement-only: these URLs are browser-served, use UA-appropriate URL)
# Actual download via curl with desktop UA to get woff2 (not ttf)
for weight in 400 500 600 700; do
    curl -sA "Mozilla/5.0 (X11; Linux x86_64)" \
      "https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}&display=swap" | \
      grep "woff2" | grep -o "https://[^)]*\.woff2" | head -1 | \
      xargs curl -o "/app/frontend/public/fonts/poppins-${weight}.woff2"
done
# Verify sizes (expected: ~8–15 KB each)
ls -lh /app/frontend/public/fonts/poppins-*.woff2
```

### Step 2 — Add `@font-face` to the inline `<style>` block in `index.html`

Append to the existing `<style>` block (which already has Clash Display @font-face from CR-114):

```html
/* Poppins: self-hosted Latin subset, font-display:optional */
@font-face {
  font-family: 'Poppins';
  src: url('/fonts/poppins-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: optional;
}
@font-face {
  font-family: 'Poppins';
  src: url('/fonts/poppins-500.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: optional;
}
@font-face {
  font-family: 'Poppins';
  src: url('/fonts/poppins-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: optional;
}
@font-face {
  font-family: 'Poppins';
  src: url('/fonts/poppins-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: optional;
}
```

### Step 3 — Add `<link rel="preload">` for body font weight 400

```html
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-400.woff2" />
```

Insert after the Clash Display preload tags in `index.html`.

### Step 4 — Remove Google Fonts Poppins blocking stylesheet

Remove from `index.html`:
```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins..."
      onload="this.onload=null;this.rel='stylesheet'" />
```
Also remove the `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` since we no longer need the Google Fonts origin.

**Note:** The prerendered `build/index.html` has the converted `<link rel="stylesheet">` version. The prerender cleanup in `prerender.js` (CR-117) must also be updated to remove any remaining `googleapis.com` stylesheet links from the snapshot. This is a 1-line addition to the cleanup block.

---

## 5. Impact Prediction

| Metric | Before | After CR-118 | Δ |
|--------|--------|-------------|---|
| FCP | 3,100ms | **~2,300ms** | −800ms |
| LCP | 3,200ms | **~2,400ms** | −800ms (follows FCP) |
| TBT | ~TBD after CR-115 | unchanged | 0 |
| Performance | 59 | **~72–78** (CR-118 alone) | +13–19 pts |

> CR-118 is independent of CR-115 and can be done in either order. Combined: Performance ~85–92.

### Lighthouse score impact of FCP improvement

FCP 3,100ms → 2,300ms:
- Score: ~54 → ~68
- Weight in Lighthouse: 10%
- Weighted contribution: +1.4 pts

LCP 3,200ms → 2,400ms:
- Score: ~60 → ~78
- Weight: 25%
- Weighted contribution: +4.5 pts

**CR-118 alone: +~6 pts on Performance score**

---

## 6. Important: CRA css-loader constraint (same as CR-114)

Just like CR-114, Poppins `@font-face` with `/fonts/...` paths CANNOT be placed in `src/index.css` — CRA's css-loader would try to resolve `/fonts/poppins-400.woff2` as a webpack module and fail.

**Solution:** Place `@font-face` in the inline `<style>` block in `public/index.html` — same approach CR-114 used. CRA does not process HTML template files through css-loader.

---

## 7. Files Changed

| File | Change |
|------|--------|
| `public/fonts/poppins-400.woff2` | NEW (download, ~12 KB) |
| `public/fonts/poppins-500.woff2` | NEW (download, ~12 KB) |
| `public/fonts/poppins-600.woff2` | NEW (download, ~12 KB) |
| `public/fonts/poppins-700.woff2` | NEW (download, ~12 KB) |
| `public/index.html` | Add 4× `@font-face` to inline `<style>`; add `<link rel="preload">` for 400; remove Google Fonts `<link>` tags |
| `scripts/prerender.js` | Add cleanup of any remaining `googleapis.com` stylesheet in the snapshot |

---

## 8. Relationship to Other CRs

```
CR-114  Clash Display self-hosted   ✅ DONE
CR-118  Poppins self-hosted         ← this CR (same technique, body font)
```

After both CR-114 and CR-118:
- Zero external font origins in the critical render path
- Both heading and body fonts preloaded from same origin
- `font-display: optional` ensures zero post-paint swap for both fonts
- Google Fonts preconnect tags can also be removed from `index.html`

---

## 9. Definition of Done

- [ ] 4× Poppins woff2 files in `public/fonts/` (weights 400, 500, 600, 700)
- [ ] `@font-face` for all 4 weights in inline `<style>` block in `index.html`
- [ ] `<link rel="preload">` for `poppins-400.woff2` in `index.html`
- [ ] Google Fonts `fonts.googleapis.com` link removed from `index.html`
- [ ] `prerender.js` cleanup removes any serialised Google Fonts stylesheet
- [ ] `yarn build` + `prerender.js` + structural gates pass
- [ ] No Google Fonts blocking requests in built HTML
- [ ] FCP improvement confirmed in Lighthouse run
- [ ] Testing agent passes
- [ ] CR-118 status updated: OPEN → FIXED

---

*CR-118 registered 2026-08-23. Raised from Lighthouse FCP diagnostics showing Poppins blocking for 820ms. Same self-hosting technique as CR-114 (Clash Display).*
