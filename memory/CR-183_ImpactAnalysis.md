# CR-183 Impact Analysis — Poppins 500 & 600 Not Preloaded
**Date:** 2026-09-02
**Agent:** E1
**Status:** READY TO IMPLEMENT — no content approval needed (no copy changes)

---

## 1. Current State (Verified from Source)

### Preload declarations — `public/index.html` lines 11–15

```html
<!-- Preload self-hosted Clash Display: weight 700 first (LCP heading), then 600 -->
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-700.woff2" />  ← L12
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-600.woff2" />  ← L13
<!-- Preload Poppins 400 (body text — most frequent weight, critical for text rendering) -->
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/poppins-400.woff2" />         ← L15
```

| Font | Weight | Preloaded? |
|---|---|---|
| Clash Display | 700 | ✅ yes (L12) |
| Clash Display | 600 | ✅ yes (L13) |
| Poppins | 400 | ✅ yes (L15) |
| **Poppins** | **500** | **❌ no** |
| **Poppins** | **600** | **❌ no** |
| Poppins | 700 | ❌ no |

### @font-face declarations exist for all weights

`index.html` lines 65–84 define `@font-face` for Poppins 500, 600, 700 with `font-display: optional`. The files exist on disk. **They just aren't preloaded** — so the browser discovers them only when it parses the CSS, at ~1,045ms (when `main.css` loads). By then it's too late for `font-display: optional` (which only waits one render cycle for the font to arrive).

---

## 2. Why This Matters — `font-display: optional`

Poppins uses `font-display: optional` — the strictest mode:
- The browser renders text immediately with the fallback font
- It waits **one very short window** (~100ms) for the real font
- If Poppins doesn't arrive in time → browser uses fallback **permanently** for that page load (no swap)

Without a preload, Poppins 500/600 arrive at 1,400–1,486ms — **far too late for the optional window**. The browser uses "Poppins Fallback" (Arial/Helvetica metric-matched) for the entire session.

**With a preload**, the browser starts fetching the font immediately alongside HTML parsing — it arrives in time, Poppins 500/600 render from first paint.

---

## 3. Which Weights Are Used Above the Fold

Confirmed via source scan of `Navbar.jsx`, `Hero.jsx`, `TrustBand.jsx`:

| Component | Weight | Class | Usage count |
|---|---|---|---|
| Navbar | **500** | `font-medium` | 5× (all nav links) |
| Navbar | **600** | `font-semibold` | 13× (dropdown labels, "Book a Free Demo" button) |
| Hero | **600** | `font-semibold` | 5× (badge, CTAs, labels) |
| Hero | 700 | `font-bold` | 8× (most inside Clash Display elements) |
| TrustBand | **600** | `font-semibold` | 1× |
| TrustBand | 700 | `font-bold` | 1× |

**Poppins 500** → nav links (immediately visible above fold)
**Poppins 600** → "Book a Free Demo" CTA + all semibold labels (immediately visible)
**Poppins 700** → bold text, but H1 uses Clash Display — lower above-fold urgency

**Decision: preload 500 + 600. Skip 700** (it's not the primary above-fold font; Clash Display covers the H1).

---

## 4. File Sizes

```
poppins-500.woff2  8.30 KiB  ← add preload
poppins-600.woff2  8.55 KiB  ← add preload
poppins-700.woff2  8.41 KiB  ← skip (not critical above fold)
```

Two additional preloads = 16.85 KiB fetched earlier (in parallel with HTML). This does NOT increase total page weight — these files load anyway. Preloading just moves the fetch earlier.

---

## 5. CMS Check

Fonts are static assets, not CMS-controlled. No CMS override can affect font loading. No conflict possible.

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Too many preloads slow initial load | Very low | Low — only 2 small files (8 KiB each) | Browser prioritises preloads, fetches in parallel |
| Wrong font path | None | — | Paths identical to existing poppins-400 preload pattern |
| Breaks existing layout | None | — | Font files already declared in @font-face; only load timing changes |
| Requires rebuild | Yes | Low | Standard `yarn build` required (public/index.html change) |

---

## 7. Definition of Done

- [ ] Two `<link rel="preload">` lines added for poppins-500 and poppins-600
- [ ] Verified in `build/index.html` — both preload links present
- [ ] Lighthouse rerun shows Poppins 500/600 no longer in the 1,400ms+ critical path

---

*Analysis complete. 1 file, 2 lines added, no content approval needed.*
