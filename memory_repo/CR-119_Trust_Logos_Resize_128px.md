# CR-119 — Trust Logos Oversized: Serve at Display Resolution (128×128)

**Type:** Performance Fix / Image Optimisation
**Date Raised:** 2026-08-23
**Raised By:** Lighthouse "Properly size images — Est savings of 39 KiB" diagnostic
**Status:** OPEN
**Priority:** MEDIUM
**Effort:** ~30 min
**Improves:** Page weight · Lighthouse "Properly size images" audit
**Scope:** `/public/brand/` — trust logo webp files only (no component changes)
**Related:** CR-81 (WebP conversion), CR-82 (width/height attributes)

---

## 1. Problem Statement

Lighthouse flags **"Properly size images — Est savings of 39 KiB"** after CR-81 and CR-82.

The 8 TrustBand marquee logos are displayed at `h-16` (64px height, `w-auto`) but the current webp files are all **250×250 pixels** — nearly 4× larger than the maximum displayed size (128px for 2× retina).

| Logo | Current size | Display size (2× retina) | Oversized by |
|------|-------------|--------------------------|-------------|
| hyatt-centric.webp | 2,516 bytes (250×250) | ~128px | 2.7× |
| palm-forest.webp | 8,638 bytes (250×250) | ~128px | 3.8× |
| bamboo-yoga.webp | 9,276 bytes (250×250) | ~128px | 3.8× |
| baba-italy.webp | 14,076 bytes (250×250) | ~128px | 3.8× |
| love-bites.webp | 5,576 bytes (250×250) | ~128px | 3.8× |
| mill-bakery.webp | 5,124 bytes (250×250) | ~128px | 3.8× |
| wild-berry.webp | 6,984 bytes (250×250) | ~128px | 3.8× |
| drishti-yoga.webp | 5,512 bytes (250×250) | ~128px | 3.8× |
| **Total** | **~57 KB** | | |

Expected after resize (128×128, q=82): ~1–4 KB each → **total ~15–20 KB → saving ~37–42 KB**.

---

## 2. Fix

**Asset-only change. Zero source code changes.**

Resize the 8 trust logo webp files from 250×250 → **128×128** (2× retina for 64px display):

```bash
for logo in hyatt-centric palm-forest bamboo-yoga baba-italy love-bites mill-bakery wild-berry drishti-yoga; do
  # Convert from the original PNG at correct size (higher quality source)
  cwebp -q 82 -resize 128 128 \
    /app/frontend/public/brand/${logo}.png \
    -o /app/frontend/public/brand/${logo}.webp
done
```

Overwrites the existing webp files in place — filenames unchanged, so `content.js`, `vsp.js`, and `DemoLanding.jsx` all continue pointing to the same paths with no code edits.

**Why use the original PNG as source (not the existing webp):**
Re-compressing an already-compressed image (webp→resize→webp) introduces generation loss. Starting from the lossless PNG preserves quality at the smaller size.

---

## 3. Files Changed

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

**Not changed:** `content.js`, `vsp.js`, `DemoLanding.jsx`, `TrustBand.jsx` — all continue referencing the same filenames.

---

## 4. Definition of Done

- [ ] All 8 logo webp files are 128×128 pixels
- [ ] File sizes: each < 5 KB (expected 1–4 KB each)
- [ ] TrustBand logos still render visually correctly at `h-16` (CSS controls display size)
- [ ] No broken image icons
- [ ] Lighthouse "Properly size images" savings drop from 39 KiB to ~0
- [ ] `yarn build` + `prerender.js` — all structural gates pass
- [ ] Testing agent confirms no visual regression

---

*CR-119 registered 2026-08-23. Source: Lighthouse "Properly size images — 39 KiB" post CR-81/82.*
