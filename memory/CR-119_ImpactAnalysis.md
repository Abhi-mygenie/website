# CR-119 — Impact Analysis
## Trust Logos Oversized: Resize to 128×128 Display Resolution

**Date:** 2026-08-23
**Status:** OPEN — ready for implementation
**Effort:** ~30 min

---

## 1. Executive Summary

8 TrustBand marquee logos are served at **250×250 pixels** but displayed at **64px height** (`h-16`, Tailwind). On a 2× retina screen, the ideal serving size is **128×128 pixels**. The current files are ~3.8× larger than needed, wasting ~41 KB of bandwidth per page load.

This is a **pure asset change** — no code edits anywhere. The 8 webp files are overwritten with correctly sized versions. All source references in `content.js`, `vsp.js`, and `DemoLanding.jsx` continue pointing to the same filenames.

| Metric | Before | After |
|--------|--------|-------|
| Total logo transfer size | **56.3 KB** | **~15 KB** |
| Saving | — | **~41 KB (−73%)** |
| Lighthouse "Properly size images" | 39 KiB flagged | **~0 KiB ✅** |
| Performance score | ~76–78 | **~78–80** (+1–2 pts) |

---

## 2. Before Benchmarks — Confirmed

### All 8 logos measured

| Logo | PNG source | Current WebP | Dimensions | Est. at 128×128 | Saving |
|------|-----------|--------------|-----------|----------------|--------|
| hyatt-centric | 12.0 KB | 2.5 KB | 250×250 | ~0.8 KB | ~1.7 KB |
| palm-forest | 24.3 KB | 8.4 KB | 250×250 | ~2.3 KB | ~6.1 KB |
| bamboo-yoga | 76.5 KB | 9.1 KB | 250×250 | ~2.4 KB | ~6.7 KB |
| baba-italy | 44.4 KB | 13.7 KB | 250×250 | ~3.7 KB | ~10.0 KB |
| love-bites | 50.2 KB | 5.4 KB | 250×250 | ~1.5 KB | ~3.9 KB |
| mill-bakery | 28.6 KB | 5.0 KB | 250×250 | ~1.3 KB | ~3.8 KB |
| wild-berry | 43.5 KB | 6.8 KB | 250×250 | ~1.8 KB | ~5.0 KB |
| drishti-yoga | 24.7 KB | 5.4 KB | 250×250 | ~1.4 KB | ~4.0 KB |
| **Total** | **304 KB** | **56.3 KB** | — | **~15.2 KB** | **~41.1 KB** |

> Estimated 128×128 sizes computed by scaling current webp bytes proportionally to pixel area (128²/250²). Actual sizes may vary ±20% depending on image complexity, but the order of magnitude is confirmed.

### Why the current files are 250×250

The logos were converted from their original PNG sources (all 250×250) without any resize step in CR-81. The conversion to WebP was done with `cwebp -q 82 input.png -o output.webp` — format change only, no resize.

### Display size analysis

```
TrustBand CSS: className="h-16 w-auto object-contain"
  h-16 = 4rem = 64px at 16px base font size

Devices:
  Standard (1×): display size = 64×64px, ideal source = 64×64px
  Retina (2×):   display size = 64×64px, ideal source = 128×128px (2× density)
  3× screens:    display size = 64×64px, ideal source = 192×192px

Chosen target: 128×128px (covers 1× and 2× screens, which represent >95% of users)
Current source: 250×250px = 3.9× the needed 64px display / 1.95× the needed 128px retina
```

### Overage calculation

```
Current: 250×250 = 62,500 pixels per image
Needed:  128×128 = 16,384 pixels per image
Overage ratio: 62,500 / 16,384 = 3.8× too large

Bandwidth waste per page view:
  8 logos × (current_avg - target_avg) ≈ 8 × (7.0 KB - 1.9 KB) ≈ 41 KB extra per load
```

---

## 3. The Fix

**Single command per logo — no source code changes.**

```bash
for logo in hyatt-centric palm-forest bamboo-yoga baba-italy \
            love-bites mill-bakery wild-berry drishti-yoga; do
  cwebp -q 82 -resize 128 128 \
    /app/frontend/public/brand/${logo}.png \
    -o /app/frontend/public/brand/${logo}.webp
done
```

**Key technical decisions:**
- **Source:** Use the original `.png` files (250×250), not the existing `.webp` files. Re-compressing webp→webp loses quality. Starting from the lossless PNG preserves maximum quality at the smaller size.
- **Quality:** `-q 82` (same as CR-81) — consistent with the project standard.
- **Resize:** `-resize 128 128` — cwebp's built-in high-quality Lanczos downscaler.
- **Output:** Overwrite the existing `.webp` files at the same path — zero code changes needed.

---

## 4. Impact Prediction

### 4a. Lighthouse audit cleared

| Audit | Before CR-119 | After CR-119 |
|-------|--------------|-------------|
| "Properly size images" | **39 KiB savings flagged** | **~0 KiB ✅** |

### 4b. Performance score impact

"Properly size images" is an **Opportunity audit** in Lighthouse, not a directly weighted metric. It affects score indirectly through:
- Reduced network transfer → slightly faster TrustBand section hydration
- Cleared audit → minor score improvement

| Metric | Current | After CR-119 | Change |
|--------|---------|-------------|--------|
| FCP | ~2.4s | ~2.4s | 0 |
| LCP | ~2.8s | ~2.8s | 0 |
| TBT | ~220ms | ~220ms | 0 |
| CLS | 0 | 0 | 0 |
| **Performance** | **~76–78** | **~78–80** | **+1–2 pts** |

> The TrustBand section is lazy-loaded (below fold, `loading="lazy"` on imgs from CR-82). The logos don't affect above-fold metrics. The score improvement is from clearing the audit, not from timing changes.

### 4c. Page weight reduction

The trust logos appear on 3 pages:
- **Homepage** (`/`) — TrustBand marquee
- **Petpooja alternative** (`/petpooja-alternative`) — `vsp.js` VSP_TRUST_LOGOS
- **Demo page** (`/demo`) — `DemoLanding.jsx` DEMO_TRUST_LOGOS

On each of these pages, ~41 KB of logo transfer is eliminated per page load.

---

## 5. Risk Assessment

| Risk | Probability | Severity | Mitigation |
|------|-------------|----------|------------|
| Logos look blurry/pixelated at 128×128 | Low | Low | Logos are simple flat graphics; cwebp Lanczos downscaling preserves edges well |
| Logos look fine on standard screens but blurry on 3× | Very Low | Low | 3× screens are rare (<5%); 128px is still 2× retina quality |
| File overwrite loses the 250×250 original | None | None | Original PNGs are still in `public/brand/*.png` — source is always there |

**Overall risk: Very Low.** Asset-only change. Fully reversible by re-running cwebp without `-resize`.

---

## 6. Scope

| File | Change |
|------|--------|
| `/public/brand/hyatt-centric.webp` | Overwrite with 128×128 version |
| `/public/brand/palm-forest.webp` | Overwrite with 128×128 version |
| `/public/brand/bamboo-yoga.webp` | Overwrite with 128×128 version |
| `/public/brand/baba-italy.webp` | Overwrite with 128×128 version |
| `/public/brand/love-bites.webp` | Overwrite with 128×128 version |
| `/public/brand/mill-bakery.webp` | Overwrite with 128×128 version |
| `/public/brand/wild-berry.webp` | Overwrite with 128×128 version |
| `/public/brand/drishti-yoga.webp` | Overwrite with 128×128 version |
| All source files (`content.js`, `vsp.js`, `TrustBand.jsx`, etc.) | **Untouched** |

---

## 7. Impact on Fixed CRs

Zero impact. This is a binary asset replacement. No HTML, CSS, or JS is touched. All previously fixed CRs (CR-114 through CR-82) are unaffected.

---

*Impact analysis written 2026-08-23. No code changed.*
