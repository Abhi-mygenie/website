# CR-184 Impact Analysis — Trust Band Logos Oversized
**Date:** 2026-09-02 (updated with live validation)
**Status:** READY TO IMPLEMENT — no content approval needed

---

## 1. Current State (Live-Verified)

### TrustBand.jsx — logo rendering (lines 48–56)
```jsx
<img
  src={logo.img}
  alt={logo.name}
  title={logo.name}
  width={160}
  height={64}
  loading="lazy"
  className="h-16 w-auto object-contain opacity-70 ..."
/>
```

Display size: `h-16` = **64px tall**, `w-auto` (aspect ratio preserved).
HTML slot: `width={160} height={64}`. At 2× retina: browser ideally needs **128×128px** for square logos.

### Actual file measurements (verified 2026-09-02)

```
42 logos in TRUST_LOGOS array (data/content.js lines 10–66)
All logos: 575×575px (square), except kunfa-logo.webp (358×329px)
Total: 663 KiB across 42 files
Average: 15 KiB per logo
```

Top 10 by size:
```
nihao.webp              32 KB  575×575px
luxeevista.webp         27 KB  575×575px
baskobitlogo.webp       26 KB  575×575px
g-squer-logo.webp       26 KB  575×575px
humsafar-menu-design.webp  26 KB  575×575px
kinara-cafe.webp        23 KB  575×575px
baba-italy.webp         23 KB  575×575px
naradmuni-logo.webp     22 KB  575×575px
sab.webp                22 KB  575×575px
nibble.webp             19 KB  575×575px
```

---

## 2. Root Cause

All logos were supplied as 575×575px square images and converted to WebP without resizing. The `width={160} height={64}` attribute is only a layout hint — the browser downloads the full 575×575 source regardless.

On mobile with 4G, 42 logos × 15 KiB = **630 KiB** loading in the TrustBand marquee — every byte competes with LCP image and fonts.

---

## 3. CMS Override Check

`home.trust_logos` IS in the CMS. However:
- CMS-uploaded logos are stored via the Emergent storage backend (not in `/public/brand/`)
- The `/public/brand/*.webp` fallback files are used when no CMS override is active
- Re-exporting these files does NOT affect CMS-uploaded logos

**No CMS conflict. Safe to replace in-place.**

---

## 4. Fix

Use `Pillow.thumbnail((320, 128))` to resize all 42 logos.

**Result for 575×575 square logos:** `thumbnail((320, 128))` → **128×128px** (128 limit triggers first: 128/575 ratio applied to both axes).
**Result for kunfa-logo.webp (358×329):** → **139×128px** (128 height limit).

No cropping. Aspect ratio always preserved. Files replaced in-place — zero JSX or data changes.

---

## 5. Expected Outcome

| Metric | Before | After | Saving |
|---|---|---|---|
| Total weight | 663 KiB | ~126 KiB | −537 KiB (81%) |
| Per logo average | 15 KiB | ~3 KiB | − |
| Resolution | 575×575px | 128×128px | − |
| Lighthouse flag | 294+ KiB flagged | Clear | − |

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Logos look blurry | Very low | Low — 128px is 2× the 64px CSS display height | LANCZOS resize + quality 80 |
| Aspect ratio distortion | None | — | `thumbnail()` always preserves ratio |
| CMS conflict | None | — | CMS logos stored separately |
| Grayscale filter masks quality | In our favour | — | Logos rendered at 70% opacity + grayscale |
| Requires rebuild | Yes | Low | Standard `yarn build` |

---

## 7. Definition of Done

- [ ] All 42 logo files replaced at ≤ 128px tall, ≤ 8 KiB each
- [ ] Total weight ≤ 150 KiB
- [ ] TrustBand marquee visually verified
- [ ] Build + restart complete

*CR-184 Impact Analysis — updated 2026-09-02 after live measurement. 42 logos (not 51), 663 KiB (not 861 KiB).*
