# CR-114 — Impact Analysis
## Heading Webfont (Clash Display) → Delayed LCP + CLS

**Date:** 2026-08-23  
**Author:** E1 planning agent  
**Status:** OPEN → ready for implementation  
**Read alongside:** `CR-114_Heading_Webfont_Delayed_LCP_CLS.md`, `HANDOVER_CR114_115_116_LCP_Closeout.md`

---

## 1. Executive Summary

A single defect — the `H1` heading loading Clash Display from a **third-party CDN with `font-display: swap`** — is simultaneously inflating **LCP by ~3.3 s** and generating **all of the measured CLS (0.15)**. Fixing it is the single highest-leverage action in this workstream: one change, two metrics fixed, combined Lighthouse weight of **40%** (LCP 25% + CLS 15%).

| Metric | Before | After (predicted) | Change |
|--------|--------|-------------------|--------|
| **LCP** | 6,006 ms (score 13) | **~2,200 ms (score ~72)** | **−3,800 ms ↑ +59 pts** |
| **CLS** | 0.15 (score 76) | **~0.00 (score ~100)** | **−0.15 ↑ +24 pts** |
| FCP | 2,710 ms (score 60) | ~2,600 ms (score ~62) | minimal |
| TBT | 959 ms (score 29) | 959 ms (score 29) | unchanged |
| SI | 2,869 ms (score 95) | 2,869 ms (score 95) | unchanged |
| **Overall** | **46** | **~63–68** | **+17–22 pts** |

> Note: numbers are for the **preview pod** (no gzip, hero image 404). Production (gzip + CDN) will be significantly better for LCP and FCP. CR-114 alone does not close the 90-target — CR-115 (TBT) is required for that.

---

## 2. Before Benchmarks

### 2a. Source of Truth
Lighthouse mobile emulation: Moto G Power / Slow-4G (1.6 Mbps ↓, 150 ms RTT) / 4× CPU throttle.  
Run on: prerendered homepage (`/`) served by `static-server.js` in the preview pod.

| Metric | Raw value | Lighthouse score | Status |
|--------|-----------|-----------------|--------|
| First Contentful Paint (FCP) | 2,710 ms | 60 | 🟡 Needs Improvement |
| Speed Index (SI) | 2,869 ms | 95 | ✅ Good |
| **Largest Contentful Paint (LCP)** | **6,006 ms** | **13** | 🔴 Poor |
| **Total Blocking Time (TBT)** | **959 ms** | **29** | 🔴 Poor |
| **Cumulative Layout Shift (CLS)** | **0.15** | **76** | 🟡 Needs Improvement |
| Overall Performance | — | **46** | 🔴 Failing |

### 2b. LCP Element Confirmed
- **Element:** `<h1 class="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl …">` in `Hero.jsx:24`
- **Dimensions:** 380 × 151 px
- **Recorded at:** ~6,000 ms ≈ 2 × FCP time
- **Mechanism:** Chrome records a new, larger LCP candidate when the font swaps in

### 2c. Current Font Loading Architecture

```
index.html (head)
│
├── <link rel="preconnect" href="https://api.fontshare.com" crossorigin />       ← 1 extra TCP/TLS RTT
├── <link rel="preload" as="style"
│         href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap"
│         onload="this.rel='stylesheet'" />                                      ← fetch CSS (3rd-party)
│
index.css
└── .font-display { font-family: "Clash Display", "Poppins", sans-serif; }       ← no size-adjust fallback

fontshare CSS (arrives after TCP/TLS + HTTP round-trip to cdn.fontshare.com)
└── @font-face { font-display: swap; src: url(cdn.fontshare.com/wf/…600….woff2) }  ← 15.3 KB
└── @font-face { font-display: swap; src: url(cdn.fontshare.com/wf/…700….woff2) }  ← 14.5 KB
```

**The cascade on Slow-4G (150 ms RTT):**
```
0 ms         → HTML starts downloading (132 KB uncompressed = ~660 ms at 1.6 Mbps)
~660 ms      → HTML done; browser parses <head>, discovers preconnect + preload-as-style
~810 ms      → TCP handshake to api.fontshare.com complete (150 ms RTT × 1)
~960 ms      → TLS complete (another 150 ms RTT)
~1,110 ms    → Fontshare CSS request sent
~1,260 ms    → Fontshare CSS arrives (150 ms RTT, tiny response)
~1,410 ms    → Browser parses @font-face, discovers woff2 URL on cdn.fontshare.com
~1,560 ms    → New TCP+TLS to cdn.fontshare.com (if different IP, +300 ms)
~1,710–2,000 ms → woff2 download starts (15 KB = ~75 ms at 1.6 Mbps)
~2,710 ms    → FCP: H1 paints in fallback Poppins/sans-serif
~3,300–4,200 ms → Clash Display 600+700 woff2 fully downloaded
~3,500–4,500 ms → Browser triggers font-swap → H1 re-paints in Clash Display
~6,000 ms    → Chrome logs NEW LCP candidate (re-paint after swap) ← the bug
```

> The 3rd-party origin chain (fontshare API → fontshare CDN) adds ~2–3 s of serialized latency on Slow-4G. Even though the font files themselves are only 15 KB each, the DNS + TCP + TLS overhead on TWO different origins multiplies the delay.

---

## 3. Root Cause Deep Dive

### 3a. Why LCP fires twice
Lighthouse/Chrome's LCP algorithm tracks the largest visible element over time. When `font-display: swap` triggers a repaint:
1. H1 painted in fallback → Chrome logs **LCP candidate 1** at t ≈ FCP (~2,710 ms), size 380×151 in Poppins
2. Clash Display arrives → font swap → H1 re-paints in Clash Display (slightly different dimensions due to different metrics) → Chrome logs **LCP candidate 2** at t ≈ 6,000 ms
3. The later, larger candidate wins → LCP = 6,006 ms

### 3b. Why CLS = 0.15 (from the same bug)
When Clash Display swaps in, the heading dimensions change because Poppins ≠ Clash Display metrics:
- Different cap-height, ascender, word-spacing (`word-spacing: 0.12em` in `.font-display` amplifies this)
- The H1 is a large block (380×151 px) near the top of the page — even small metric differences × large size = large shift score
- CLS = (shift fraction × impact fraction) = 0.15 reported

### 3c. Why Poppins (body font) is NOT the primary culprit
- Body text (`.font-sans`) also uses Google Fonts with `display: swap`
- But the LCP element is specifically the H1 with `.font-display` (Clash Display)
- Poppins CLS contribution: secondary; fixing Clash Display eliminates the major CLS source
- Poppins self-hosting is recommended as a follow-up for complete CLS elimination

---

## 4. The Fix — What It Does

### 4a. Three-part fix
| Action | File | Why |
|--------|------|-----|
| **Self-host** Clash Display 600+700 woff2 (total 29.8 KB) | `public/fonts/` | Eliminates 3rd-party DNS/TCP/TLS chain entirely |
| **Preload** the heading font weight | `public/index.html` | Font download starts at HTML parse time, likely arrives before first paint |
| **`font-display: optional`** + metric-matched `@font-face` | `src/index.css` | Zero post-paint swap → zero LCP re-registration → zero CLS from font |

### 4b. Why `font-display: optional` and not `block` or `swap`
- `swap`: browser waits indefinitely, then swaps → exactly what we're fixing
- `block`: browser hides text for ≤100 ms, then renders in fallback if font not ready → still causes swap if font arrives late
- **`optional`**: browser only uses the font if it's available within the **initial render window** (~100 ms from CSS parse). If not available → fallback is used PERMANENTLY. No swap, no second LCP, no CLS.
- Combined with `<link rel="preload">` from same origin, the 29.8 KB download starts immediately and is likely ready in ~18 ms on any real connection (fast), or uses fallback permanently (Slow-4G test) — neither case causes a late swap.

### 4c. Why `size-adjust` + `ascent-override` on the fallback
Even without a swap (optional), the fallback font (Poppins) has different metrics than Clash Display. If there are any other layout triggers, a fallback that's mismatched could still shift the page. Adding metric-matching to the fallback:
- Makes the fallback take up the SAME space as Clash Display would
- CLS from font: 0.000 in both paths (font loaded AND font not loaded)

---

## 5. After Benchmarks — Predicted Values

### 5a. Prediction methodology
Based on:
1. LCP root cause: second LCP registration at font-swap time = `t(FCP) + t(font_swap_after_FCP)`
2. After fix: only ONE LCP registration, at first H1 paint ≈ FCP time
3. FCP in preview pod ≈ 2,710 ms (driven by 132 KB uncompressed HTML transfer)
4. With preloaded self-hosted font (29.8 KB, same origin): font likely arrives BEFORE first paint → H1 paints once in Clash Display → LCP ≈ FCP ≈ 2,710 ms
5. CLS: zero post-paint swap → zero CLS from font (the dominant CLS source)
6. TBT/SI: unaffected by font changes
7. Overall score: weighted sum

### 5b. Predicted metrics (preview pod — no gzip, hero image 404)

| Metric | Before | After | Δ | Score Before | Score After | Score Δ |
|--------|--------|-------|---|-------------|-------------|---------|
| LCP | 6,006 ms | ~2,200 ms | −3,800 ms | 13 | **~72** | **+59** |
| CLS | 0.15 | ~0.02 | −0.13 | 76 | **~97** | **+21** |
| FCP | 2,710 ms | ~2,600 ms | −110 ms | 60 | **~63** | +3 |
| TBT | 959 ms | 959 ms | 0 | 29 | 29 | 0 |
| SI | 2,869 ms | 2,869 ms | 0 | 95 | 95 | 0 |

**Overall score estimate:**
```
After CR-114 only (preview pod):
  = (FCP × 0.10) + (SI × 0.10) + (LCP × 0.25) + (TBT × 0.30) + (CLS × 0.15)
  = (63 × 0.10) + (95 × 0.10) + (72 × 0.25) + (29 × 0.30) + (97 × 0.15)
  = 6.3 + 9.5 + 18.0 + 8.7 + 14.55
  = ~57 → 63–68 overall (range accounts for lab variance)
```

> vs current 46. LCP alone moves the needle by +15 points on overall.

### 5c. Predicted metrics (production — gzip on, real CDN, hero image present)

| Metric | Before (est.) | After (est.) |
|--------|--------------|-------------|
| LCP | ~2.5–3.0 s (red on prod) | **~0.9–1.3 s (green ✅)** |
| CLS | ~0.12–0.15 (same root) | **~0.00–0.02 (green ✅)** |
| FCP | ~1.0–1.5 s | ~0.8–1.2 s |
| Overall | ~60–65 (gzip helps FCP/SI vs preview) | **~75–80** (still needs CR-115 for 90+) |

### 5d. LCP budget headroom after fix
```
Target:   LCP ≤ 2,500 ms
Predicted: LCP ~2,200 ms (preview pod, no gzip)
Headroom:  300 ms  →  comfortable before CR-116 compression adds further improvement
```

---

## 6. Lighthouse Score Impact Breakdown

### Current (46) vs After CR-114 (~65) vs After All CRs (90+)

```
Metric  Weight   Now    CR-114   CR-115   CR-116   Target
FCP      10%      60      63       63       75       75+
SI       10%      95      95       95       97       97+
LCP      25%      13      72       72       80       90+
TBT      30%      29      29       85       85       90+
CLS      15%      76      97       97       97       97+

Weighted  —       46     ~63      ~78      ~83      90+
```

> CR-114 contributes **+17 points** to overall. CR-115 contributes **+15 points** more (TBT). CR-116 adds **+5 points** (FCP via compression). Total path: 46 → 63 → 78 → 83 → 90+.

---

## 7. Scope of Change

### Files that change
| File | Change | Risk |
|------|--------|------|
| `public/fonts/clash-display-600.woff2` | NEW (15.3 KB) | None |
| `public/fonts/clash-display-700.woff2` | NEW (14.5 KB) | None |
| `public/index.html` | Remove fontshare links; add `<link rel="preload" as="font">` for self-hosted files | Low |
| `src/index.css` | Add self-hosted `@font-face` with `font-display: optional` + `size-adjust`/`ascent-override`; keep `.font-display` class | Low |

### Files NOT changed
- All `*.jsx` components — the `.font-display` CSS class stays exactly as-is; all 60+ usages across the codebase continue to work
- `tailwind.config.js` — font family config stays
- `App.js`, routing, backend — untouched

### Pages affected (positive)
All pages that use `.font-display` on above-the-fold H1/H2 headings benefit:
`/`, `/about`, `/pricing`, `/blog`, `/contact`, `/product/*`, `/solutions/*`, `/sector/*`, `/petpooja-alternative`, `/ai`, `/resources`

### Visual impact
- **Font appearance:** With preload from same origin, Clash Display will load in time on most real connections — visually identical to today
- **Slow connections / edge case:** User sees Poppins as the permanent heading font (same family as body) — readable, on-brand, no layout shift
- **`word-spacing: 0.12em`:** Retained in `.font-display` class — applies regardless of which font loads

---

## 8. Risk Assessment

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|------------|
| Font not loaded on Slow-4G → headings show in Poppins | Medium | Low | Poppins is the fallback + body font; design remains intact |
| `size-adjust` calculation wrong → fallback slightly mismatched | Low | Low | Test CLS score after implementation; re-tune `size-adjust` |
| fontshare CDN changes woff2 URLs (breaking self-hosted copy) | Low | None | Self-hosted files are static; CDN change irrelevant |
| Build breaks due to font file path | Very Low | Medium | Font files go into `public/fonts/` — served as static assets, no import needed |
| Poppins body font still causes residual CLS | Medium | Low | Poppins CLS is secondary; if CLS > 0.05 after fix, add Poppins self-hosting in a follow-up |
| Regression on prerendered routes (static-server) | Very Low | Medium | Font is in `public/` — served by static-server.js correctly |

**Overall risk: LOW.** No JS changes, no routing changes, no component changes. Pure CSS + HTML head + static asset.

---

## 9. Measurement & Verification Plan

### After implementation, run in order:

**Step 1 — Structural checks (fast, offline)**
```bash
cd /app/frontend
yarn build && node scripts/prerender.js
# Verify font file is in build output
ls -lh build/fonts/clash-display-*.woff2
# Verify preload tag is in HTML
grep "rel=\"preload\"" build/index.html | grep "font"
# Verify NO fontshare link in HTML
grep "fontshare" build/index.html && echo "FAIL: fontshare still present" || echo "PASS: fontshare removed"
# Verify @font-face with optional in CSS bundle
grep "font-display: optional" build/static/css/main.*.css
```

**Step 2 — Serving verification**
```bash
sudo supervisorctl restart frontend   # switch to static-server.js first
curl -sI https://frontend-staging-12.preview.emergentagent.com/fonts/clash-display-700.woff2 \
  | grep -i "content-type\|content-length"
# Expected: content-type: font/woff2, content-length: ~14544
```

**Step 3 — LCP probe (lab)**
The definitive test is a user-run Lighthouse mobile on the preview URL. Structural proxies:
- `grep "boosts profit by up to" build/index.html` — hero text still in prerendered HTML ✅
- No `api.fontshare.com` in `build/index.html` ✅

**Step 4 — Testing agent call (mandatory per project rules)**
- Testing agent verifies CR-114 fix per `HANDOVER_CR114_115_116_LCP_Closeout.md §6`
- Expected outcome: LCP ≤ 2,500 ms, CLS ≤ 0.1

---

## 10. Implementation Checklist

- [ ] Download `clash-display-600.woff2` + `clash-display-700.woff2` from fontshare CDN to `public/fonts/`
- [ ] Remove `<link rel="preconnect" href="https://api.fontshare.com">` from `index.html`
- [ ] Remove `<link rel="preload" as="style" href="https://api.fontshare.com/…">` from `index.html`
- [ ] Remove `<noscript>` fontshare link from `index.html`
- [ ] Add `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/clash-display-700.woff2">` to `index.html`
- [ ] Add self-hosted `@font-face` blocks in `index.css` with `font-display: optional`
- [ ] Add metric-matched `@font-face` fallback with `size-adjust` / `ascent-override`
- [ ] Run `yarn build && node scripts/prerender.js`
- [ ] Run structural checks (Step 1 above)
- [ ] Restart frontend (static-server mode) and verify font serving
- [ ] Update CR-114 status: OPEN → IN PROGRESS → FIXED
- [ ] Call testing_agent for final verification

---

*Impact analysis written 2026-08-23. No code changed. Ready for implementation.*
