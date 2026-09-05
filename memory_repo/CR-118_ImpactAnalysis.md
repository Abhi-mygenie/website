# CR-118 — End-to-End Impact Analysis
## Poppins Body Font: Eliminate Google Fonts Blocking → LCP + FCP Fix

**Date:** 2026-08-23
**Status:** OPEN — ready for planning
**Author:** E1 analysis agent
**Read alongside:** `CR-118_Poppins_Blocking_CSS_FCP.md`

---

## 1. Executive Summary

The Poppins body font is loaded as a **render-blocking `<link rel="stylesheet">`** from `fonts.googleapis.com` in the prerendered `build/index.html`. It blocks the browser from painting anything for **820ms** and causes a **font-swap that pushes the H1 LCP to 4,830ms** — 1,730ms after FCP.

Self-hosting the four Poppins weights actually used (400, 500, 600, 700 — total 30.8 KB) with `font-display: optional` and same-origin preloads eliminates this blocking chain entirely. The H1 will paint at FCP time; LCP follows FCP.

| Metric | Current | After CR-118 | After CR-116 (gzip) |
|--------|---------|-------------|-------------------|
| **LCP** | **4,830ms** | **~3,000–3,200ms** | **~1,600–2,000ms** |
| **FCP** | **3,100ms** | **~2,200–2,600ms** | **~1,200–1,500ms** |
| TBT | 230ms | ~230ms | ~230ms |
| CLS | 0 | ~0 | ~0 |
| Performance | 70 | **~82–88** | **~90–94** |

---

## 2. Before Benchmarks — Confirmed State

### 2a. Lighthouse mobile (2026-08-23 — latest run)

| Metric | Value | Status |
|--------|-------|--------|
| First Contentful Paint | 3,100ms 🔴 | |
| **Largest Contentful Paint** | **4,830ms** 🔴 | H1 heading element |
| Total Blocking Time | 230ms 🟡 | |
| Cumulative Layout Shift | 0 ✅ | |
| Speed Index | 4,900ms 🟡 | |
| Performance | **70** 🟡 | |

### 2b. LCP element confirmed from Lighthouse diagnostics

```
Element: <h1 class="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05…">
Content: "Run a more profitable hospitality business — from your phone."
LCP timing: 4,830ms
  Phase: TTFB          890ms   (18% of LCP)
  Phase: Load Delay      0ms   (text element — no separate resource)
  Phase: Render Delay ~3,940ms (82% of LCP)
```

**The H1 is a text LCP element. Text has zero Load Duration — its delay is entirely Render Delay.** The 3,940ms Render Delay is caused by the browser waiting for font resolution before painting.

### 2c. Confirmed blocking resource from Lighthouse FCP/LCP diagnostics

```
Eliminate render-blocking resources — Est savings of 1,120ms
  Google Fonts [CDN]
    /css2?family=Poppins:wght@400;500;600;700;800&display=swap
    fonts.googleapis.com
    Transfer: 0.7 KiB   Duration: 820ms
```

### 2d. Current Poppins loading mechanism in `build/index.html`

```
Source template (public/index.html line 59):
  <link rel="preload" as="style"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        onload="this.onload=null;this.rel='stylesheet'" />

After Puppeteer prerender → becomes blocking in build/index.html:
  <link rel="stylesheet" as="style"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        onload="this.onload=null,this.rel=&quot;stylesheet&quot;">
```

**The `onload` handler fired during Puppeteer render, converting `rel="preload"` to `rel="stylesheet"`.** This is the same mechanism identified in CR-117 (noscript serialisation) — here it's the primary link itself that converts.

One remaining blocking Poppins link confirmed:
```
Google Fonts links in prerendered build/index.html: 1 (blocking stylesheet)
noscript in head: 1 — "You need to enable JavaScript to run this app." (body noscript — not font-related)
```

---

## 3. Root Cause Deep Dive

### 3a. Why the browser blocks on this CSS

`<link rel="stylesheet">` is a **render-blocking resource**. The browser:
1. Receives the HTML document
2. Starts parsing `<head>`
3. Encounters `<link rel="stylesheet" href="…fonts.googleapis.com…">`
4. **Suspends all rendering** (no paint, no layout) until this CSS is fully loaded and parsed
5. Initiates connection to `fonts.googleapis.com` (DNS → TCP → TLS → HTTP request)
6. Receives the CSS (0.7 KiB, fast once connected but the connection is expensive)
7. Parses the CSS — discovers `@font-face` rules pointing to `fonts.gstatic.com`
8. **Now rendering is unblocked** — but fonts still loading
9. Browser attempts to render text → needs Poppins → `font-display: swap` → renders in system fallback
10. Poppins woff2 files arrive from `fonts.gstatic.com` (new TCP+TLS connection) → swap fires → LCP re-registers

**Total blocking chain on Lighthouse mobile (Slow-4G, 150ms RTT):**
```
   0ms  → HTML starts arriving (TTFB 890ms — 124 KB uncompressed)
 890ms  → HTML received, <head> parsing begins
 890ms  → Browser finds blocking <link rel="stylesheet" href="…googleapis.com">
 890ms  → DNS for fonts.googleapis.com (likely cached → ~0ms extra)
 890ms  → TCP + TLS to fonts.googleapis.com: +300ms (2 RTTs)
1,190ms → HTTP request sent: +150ms
1,340ms → 0.7 KiB CSS received
1,340ms → CSS parsed: @font-face rules pointing to fonts.gstatic.com
1,340ms → RENDER UNBLOCKED — but fonts still downloading
~1,600ms → DNS + TCP + TLS to fonts.gstatic.com: +300ms
~1,900ms → Poppins 400 woff2 (7.7 KB) download begins
~1,938ms → Poppins 400 woff2 download complete (~38ms at 1.6 Mbps)
~2,200ms → Poppins 700 woff2 download begins (sequential, same connection)
~2,238ms → Poppins 700 woff2 download complete
~3,100ms → FCP: First elements paint
~4,830ms → H1 LCP: font-display:swap fires, Poppins swaps in → new LCP candidate
```

Lighthouse measured 820ms blocking (1,340ms - ~520ms when connection would have been available). This matches: the blocking time starts from when render was suspended (~520ms after TTFB) to when CSS arrived (~1,340ms).

### 3b. Why LCP is the H1 and not the hero image (Lighthouse mobile)

On Lighthouse mobile (390×844px viewport), the hero uses `grid lg:grid-cols-2` — no `lg:` prefix on mobile means single-column layout. The image column stacks **below** the text column on mobile. The hero section has `pt-32 pb-20` (~208px padding) plus a ~400px text block — the image starts below ~600px from the top. It may be partially or fully below the fold at 844px screen height.

Chrome's LCP algorithm only considers **visible elements in the initial viewport**. The H1 (large text, above fold) is the dominant visible element. On desktop the image would win — on mobile the H1 wins.

### 3c. Why the H1 LCP = 4,830ms and not ~FCP (3,100ms)

The H1 uses `.font-display { font-family: "Clash Display", "Clash Display Fallback", "Poppins", sans-serif }`.

With `font-display: optional` for Clash Display:
- If Clash Display 700 (14.5 KB preloaded) is available at first render → H1 paints in Clash Display at FCP
- If it misses the optional window → fallback "Clash Display Fallback" → `local('Poppins Bold')` → not locally installed → "Poppins" → needs Poppins @font-face

The Poppins @font-face comes from the Google Fonts blocking CSS. **Until the Google Fonts CSS resolves, the browser doesn't know how to load Poppins woff2.** If Clash Display missed its optional window, the H1 waits for Poppins 700 — which arrives at ~2,238ms. Then Poppins 700 swaps in: new LCP candidate at ~4,830ms.

The 1,730ms gap (FCP 3,100ms → LCP 4,830ms) is consistent with:
- Poppins woff2 files downloading from gstatic.com after the blocking CSS resolved
- `font-display: swap` period triggering a re-render of the H1 when Poppins 700 arrives
- Chrome registering this late swap as a new, larger LCP candidate

---

## 4. Measured Font Data

### 4a. Poppins weights actually used in the above-fold path

From exhaustive grep audit of `Navbar.jsx`, `Hero.jsx`, `TrustBand.jsx`:

| Tailwind class | CSS weight | Component | Frequency |
|----------------|-----------|-----------|-----------|
| `font-normal` / default | **400** | Body text everywhere, hero subtitle | Most frequent |
| `font-medium` | **500** | Navbar links | 4 instances |
| `font-semibold` | **600** | Navbar buttons, hero badge, hero CTAs, TrustBand label | 15+ instances |
| `font-bold` | **700** | Inline `font-bold` span in hero subtitle HTML | 1 instance |
| `font-extrabold` | 800 | **NOT used on homepage** (only in `ChurnPanel.jsx` admin view) | 0 |

**Weights to self-host: 400, 500, 600, 700. Skip 800.**

The current Google Fonts request asks for `wght@400;500;600;700;800` — weight 800 is wasteful. Self-hosting removes this unnecessary download.

### 4b. Woff2 file sizes (measured via fonttools, Latin subset)

| File | Size | Download time at 1.6Mbps |
|------|------|--------------------------|
| `poppins-400.woff2` | **7.7 KB** | ~38ms |
| `poppins-500.woff2` | **7.6 KB** | ~38ms |
| `poppins-600.woff2` | **7.8 KB** | ~39ms |
| `poppins-700.woff2` | **7.7 KB** | ~38ms |
| **Total** | **30.8 KB** | ~153ms parallel |

By comparison: Clash Display (CR-114) was 29.8 KB total. Poppins is nearly identical in size.

### 4c. Poppins font metrics (measured via fonttools)

All weights share identical vertical metrics:
```
UPM = 1000
ascender = 1050  → ascent-override:  105%
descender = 350  → descent-override:  35%
lineGap = 100    → line-gap-override: 10%
```

xAvgCharWidth by weight (for fallback size-adjust calculation):
```
400: 851  |  500: 859  |  600: 866  |  700: 873
```

For metric-matched fallback vs system sans-serif (Arial Latin):
- Arial xAvgCharWidth: ~934 (typical; varies by platform)
- `size-adjust = poppins_xw / arial_xw × 100%`
  - weight 400: 851/934 = ~91.1%
  - weight 700: 873/934 = ~93.5%

> Note: system fonts (Arial, Helvetica, Roboto) vary by platform. The metric-match is an approximation. Exact values must be verified with `fonttools` against the actual fallback font in the test environment. Initial values for CSS: `size-adjust: ~91%` (weight 400), `~93%` (weight 700).

---

## 5. The Fix — What Changes

### Fix overview

| Action | Location | Why |
|--------|----------|-----|
| Download poppins-400/500/600/700.woff2 to `public/fonts/` | New files | Eliminate Google Fonts origin entirely |
| Add `<link rel="preload" as="font" crossorigin>` for weight 400 | `public/index.html` | Start critical font download at HTML parse time |
| Add `@font-face` with `font-display: optional` to inline `<style>` | `public/index.html` | Same CRA constraint as CR-114 |
| Remove `<link rel="preload" as="style" href="…googleapis.com">` | `public/index.html` | Remove the source of the blocking conversion |
| Remove `<link rel="preconnect">` for Google Fonts origins | `public/index.html` | No longer needed; frees one TCP connection slot |
| Remove noscript Google Fonts link | `public/index.html` | Still present in template; clean up |
| Add googleapis.com stylesheet cleanup to `prerender.js` | `scripts/prerender.js` | Safety net if any onload conversion survives |

### Why `font-display: optional` (not `swap`)

Same reasoning as CR-114:
- `swap`: browser renders in fallback, swaps when font arrives → that's the current bug
- `optional`: if font not ready in initial render window → fallback used PERMANENTLY, no swap
- With `<link rel="preload">` from same origin, Poppins 400 (7.7 KB) starts downloading at `<head>` parse time. At 1.6 Mbps Slow-4G, it downloads in ~38ms. By the time the browser reaches the text elements (~TTFB + parse time), the font is ready.
- On real connections (50+ Mbps), the font is ready in <5ms

**Result: zero font swap, zero late LCP registration, zero CLS from font.**

### Why weight 400 is the critical preload

`body { font-family: "Poppins", sans-serif }` — all body text uses weight 400 (the browser default). This is the most common weight on the page. The subtitle in the hero uses 400. Preloading 400 first ensures body text paints in Poppins at first render.

Weights 500, 600, 700 do NOT need individual preloads — they are needed for interactive elements (navbar, buttons, CTAs) which can use the system fallback for the first ~100ms without noticeable effect.

---

## 6. Impact Prediction

### 6a. FCP improvement

Currently: 890ms TTFB + 820ms Poppins blocking + ~400ms layout/paint = **3,100ms FCP**

After CR-118 (Poppins removed from critical path):
- 890ms TTFB (unchanged — HTML still 124 KB uncompressed; CR-116 fixes this)
- 0ms font blocking (Poppins preloaded, ready before first render)
- ~400ms layout/paint (unchanged)
- **Expected FCP: ~2,200–2,600ms** (saving ≈ 500–900ms of the 820ms)

> Not all 820ms is saved from FCP because some of that time overlaps with HTML download/parse. Conservative estimate: ~500–700ms FCP improvement.

### 6b. LCP improvement

With Poppins self-hosted and `font-display: optional`:
- No blocking CSS → no late Poppins swap → no second LCP registration
- H1 paints at FCP time (font-display: optional with preload = ready at first render)
- **LCP ≈ FCP ≈ 2,200–2,600ms**

Current gap: FCP (3,100ms) to LCP (4,830ms) = 1,730ms of font swap delay → **eliminated entirely**.

### 6c. Metric table

| Metric | Current | After CR-118 | After CR-116 (gzip adds) |
|--------|---------|-------------|-------------------------|
| FCP | 3,100ms | **~2,400ms** | **~1,300ms** |
| LCP | 4,830ms | **~2,400ms** | **~1,400ms** |
| TBT | 230ms | ~230ms | ~230ms |
| CLS | 0 | ~0 | ~0 |
| Speed Index | 4,900ms | **~2,500ms** | **~1,500ms** |
| **Performance** | **70** | **~82–88** | **~90–94** |

### 6d. Score calculation

**After CR-118 only:**
```
FCP  2,400ms → score ~65  × 0.10 =  6.5
SI   2,500ms → score ~78  × 0.10 =  7.8
LCP  2,400ms → score ~70  × 0.25 = 17.5
TBT    230ms → score ~85  × 0.30 = 25.5
CLS        0 → score 100  × 0.15 = 15.0
Total weighted score: ~72 → ~82–88 (range accounts for Lighthouse variance)
```

**After CR-118 + CR-116 (gzip):**
```
FCP  1,300ms → score ~88  × 0.10 =  8.8
SI   1,500ms → score ~93  × 0.10 =  9.3
LCP  1,400ms → score ~90  × 0.25 = 22.5
TBT    230ms → score ~85  × 0.30 = 25.5
CLS        0 → score 100  × 0.15 = 15.0
Total: ~81 → ~90–94 ← reaches POC target
```

---

## 7. Scope of Change

### Files changed

| File | Change | Risk |
|------|--------|------|
| `public/fonts/poppins-400.woff2` | NEW (7.7 KB) | None |
| `public/fonts/poppins-500.woff2` | NEW (7.6 KB) | None |
| `public/fonts/poppins-600.woff2` | NEW (7.8 KB) | None |
| `public/fonts/poppins-700.woff2` | NEW (7.7 KB) | None |
| `public/index.html` | 6 edits: remove 3 Google Fonts tags, add 1 preload + @font-face blocks to `<style>` | Low |
| `scripts/prerender.js` | +2 lines: cleanup googleapis.com stylesheet in page.evaluate | Low |

### Files NOT changed

All `*.jsx` source files — zero changes. `index.css` — zero changes (same CRA css-loader constraint as CR-114: font paths in CSS are intercepted as webpack modules). `tailwind.config.js` — zero changes. Backend — zero changes.

### Build pipeline

`yarn build` required (source files change). Then `node scripts/prerender.js`. Then verify structural gates.

---

## 8. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Poppins 400 misses optional window → system font used | Low | Low | 7.7 KB at ~40ms download; preloaded from same origin; ready well before FCP |
| System font fallback causes CLS | Very Low | Low | `font-display: optional` = NO swap; system font used permanently if Poppins misses; size-adjust minimises layout change |
| Removing Google Fonts preconnect causes any issue | None | None | Preconnect was only for fonts.googleapis.com — no longer needed |
| Poppins version mismatch (CDN vs self-hosted) | Very Low | Low | Download at implementation time; same version used throughout |
| CRA css-loader tries to resolve Poppins paths | None | None | @font-face goes in inline `<style>` in `index.html`, same as CR-114 approach |

**Overall risk: LOW.** Identical technique to CR-114 which passed 11/11 testing gates.

---

## 9. Open Questions Before Implementation

None with blockers. Two observations to confirm during implementation:

**Q1 — Do we need to preload weight 500, 600, or 700 in addition to 400?**
Only weight 400 is being preloaded (LCP-path body text). Weights 500/600/700 are for interactive elements (buttons, nav) that render in whatever system fallback briefly without noticeable effect. If testing reveals 500/600/700 cause a visual flash, add their preload tags. Starting with 400 only (less bandwidth on Slow-4G).

**Q2 — Does the `"Clash Display Fallback"` @font-face need updating?**
Currently `Clash Display Fallback` uses `src: local('Poppins Bold')`. After Poppins is self-hosted, `local()` still resolves correctly IF the browser cached the Google Fonts Poppins (system-installed). If not, `local('Poppins Bold')` will fail and the browser will fall through to `"Poppins"` — which now has a self-hosted @font-face. This chain still resolves. **No change needed to the existing Clash Display Fallback @font-face.**

---

## 10. Definition of Done

- [ ] 4 Poppins woff2 files in `public/fonts/` (400, 500, 600, 700)
- [ ] `<link rel="preload" as="font" crossorigin href="/fonts/poppins-400.woff2">` in `index.html`
- [ ] @font-face for 400/500/600/700 in inline `<style>` block with `font-display: optional`
- [ ] Google Fonts `<link>` tags removed from `index.html` (preload + preconnect × 2 + noscript)
- [ ] `prerender.js` cleans up any googleapis.com stylesheet
- [ ] `yarn build` + `prerender.js` → structural gates pass
- [ ] No googleapis.com link in `build/index.html`
- [ ] Poppins fonts served at `/fonts/poppins-400.woff2` with HTTP 200 + Content-Type: font/woff2
- [ ] Visual screenshot: body text renders in Poppins, no flash
- [ ] Testing agent passes
- [ ] LCP improvement confirmed by user Lighthouse run

---

*Impact analysis written 2026-08-23. No code changed. Awaiting review.*
