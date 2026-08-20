# CR-70 — Fix Font Preloading: Remove Inter, Preload Poppins + Clash Display

**Type:** Performance Fix / FCP  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** IMPACT ANALYSIS COMPLETE — READY FOR IMPLEMENTATION  
**Priority:** CRITICAL  
**Plan ID:** C1  
**Effort:** 30 min  
**Improves:** Perf · FCP · QS Landing Page Experience  
**Scope:** `frontend/public/index.html`, `frontend/src/index.css`  
**Related:** CR-71 (hero image preload), Marketing brief Issue 3  
**Impact Analysis Date:** 2026-08-20  
**Impact Verdict:** ✅ PROCEED — No blockers found. All dependencies verified clean.

---

## 1. Problem Statement

`index.html` preloads **Inter** (via Google Fonts `<link rel="stylesheet">`) — a font the site never uses. The actual fonts used throughout the site are **Poppins** (body) and **Clash Display** (headings), both loaded as render-blocking `@import` statements inside `index.css`.

This means:
1. A useless Inter network request fires on every page load
2. The `@import` chain for Poppins (Google Fonts) and Clash Display (Fontshare) is render-blocking — the browser must download `index.css`, then discover and fetch both fonts before painting any text
3. Poppins and Clash Display have no `<link rel="preload">` hint — browser doesn't discover them until CSS parses

---

## 2. Root Cause

**`frontend/public/index.html` (lines 9–11):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
```
Inter is loaded and preconnected — but Inter is not used anywhere in the codebase.

**`frontend/src/index.css` (lines 1–2):**
```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap");
@import url("https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap");
```
`@import` in CSS is render-blocking and serializes requests — Fontshare waits behind Google Fonts.

---

## 3. Exact Changes Required

### Change 1 — `frontend/public/index.html`
Remove the Inter preconnect + stylesheet block. Replace with:
```html
<!-- Fonts: preconnect for parallel discovery -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://api.fontshare.com" crossorigin />
<!-- Non-blocking stylesheets (loaded in parallel, not via @import chain) -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
<link rel="preload" as="style" href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" />
</noscript>
```

### Change 2 — `frontend/src/index.css`
Remove both `@import` lines at the top:
```css
/* DELETE these two lines: */
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap");
@import url("https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap");
```
Fonts are now loaded from `index.html` — no CSS `@import` needed.

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/public/index.html` | Remove Inter block; add preload + non-blocking stylesheet links for Poppins + Clash Display |
| `frontend/src/index.css` | Remove 2 `@import` lines |

---

## 5. Definition of Done

- [ ] Inter font request no longer appears in network waterfall
- [ ] Poppins and Clash Display load in parallel, not sequentially
- [ ] Text renders correctly on homepage, /petpooja-alternative, /pricing
- [ ] No FOUT (Flash of Unstyled Text) regression — `font-display: swap` handles graceful loading
- [ ] `index.css` has no `@import` statements

---

*CR-70 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C1.*

---

## 6. Impact Analysis — Findings (2026-08-20)

**Investigator:** Planning Agent  
**Method:** Full dependency trace — read `index.html`, `index.css`, `App.css`, `tailwind.config.js`, `postcss.config.js`, `craco.config.js`, `HtmlWebpackPlugin` config, Fontshare CORS headers, grep across all `src/` files.

---

### Finding 1 — Inter is definitively unused across the entire codebase ✅ Safe to remove

Grepped all `.jsx`, `.js`, `.css` files under `src/` for `"Inter"` as a font name. **Zero** references found. No component, no Tailwind class, no inline style references Inter. The `<link>` in `index.html` (line 12) is completely orphaned.

**Confirmed font usage in codebase:**

| Font | Where declared | How used |
|---|---|---|
| Poppins | `index.css` line 37 + `tailwind.config.js` `sans` | `body { font-family: "Poppins" }` + Tailwind `font-sans` |
| Clash Display | `index.css` line 45 + `tailwind.config.js` `display` | `.font-display { font-family: "Clash Display" }` + Tailwind `font-display` |
| Inter | `index.html` line 12 | **Nowhere** — orphaned load |

Removing Inter has zero visual impact on any page.

---

### Finding 2 — Both actual fonts have `display=swap` in their Google Fonts / Fontshare URLs ✅ FOUT risk managed

```
https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap
https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap
```

`font-display: swap` is embedded in both URLs by the provider. Browsers immediately render text with the system fallback (`sans-serif`) and swap once the web font loads. No blank-text flash; no render blocking. Risk is negligible.

---

### Finding 3 — Fontshare returns `access-control-allow-origin: *` ✅ Preload CORS is safe

Verified live:
```
access-control-allow-origin: *
content-type: text/css; charset=utf-8
```

`<link rel="preload" as="style" crossorigin>` for Fontshare will succeed. No CORS block.

---

### Finding 4 — The `onload` trick survives HtmlWebpackPlugin production minification ✅ Safe

CRA's `webpack.config.js` uses `HtmlWebpackPlugin` with `minifyJS: true` in production. This runs `html-minifier-terser` which minifies inline event handlers. The `onload` attribute value:
```
this.onload=null;this.rel='stylesheet'
```
…will be minified to:
```
this.onload=null,this.rel='stylesheet'
```
The comma operator replaces the semicolon — logically identical, executes both statements. No stripping, no breakage. Confirmed by reviewing the HtmlWebpackPlugin minify config options (`removeEmptyAttributes`, `removeStyleLinkTypeAttributes` — neither affects `onload` on a `<link>` tag).

---

### Finding 5 — Removing `@import` from `index.css` has no webpack side-effect ✅ Safe

CRA's `css-loader` processes `@import url("https://...")` for **external HTTP URLs** by passing them through to the browser unchanged — it does not attempt to bundle remote URLs. PostCSS config is:
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```
Neither plugin touches external font `@import` statements. Removing the two lines is a clean deletion. Fonts shift from CSS `@import` chain discovery → parallel `<link>` discovery in `index.html`. No build artefact changes.

---

### Finding 6 — `<noscript>` fallback is required and correctly included in the proposed change ✅ Confirmed

The `onload` trick requires JavaScript to convert `rel="preload"` → `rel="stylesheet"`. Without `<noscript>` fallback links, users with JS disabled receive no font stylesheets and see the raw system font. The proposed change in Section 3 already includes the `<noscript>` block. No gap.

---

### Risk Register

| Risk | Likelihood | Impact | Verdict |
|---|---|---|---|
| FOUT on first load (font loads async) | Medium | Low — `font-display: swap` renders fallback immediately | Acceptable |
| `onload` stripped by HTML minifier | Low | None — minifier keeps it (verified) | No action |
| Fontshare CORS block on preload | None | — | Cleared |
| Inter removal breaks any component | None | — | Cleared |
| `@import` removal breaks webpack build | None | — | Cleared |

---

### Scope Confirmation — Files touched (verified, no hidden deps)

| File | Lines changed | Notes |
|---|---|---|
| `frontend/public/index.html` | Lines 10–12 remove + add ~7 lines | Preconnect to fontshare added; Inter removed |
| `frontend/src/index.css` | Lines 1–2 remove | Only `@import` lines; no other content affected |

**No other files are touched. No component changes. No restart side-effects beyond standard hot-reload.**
