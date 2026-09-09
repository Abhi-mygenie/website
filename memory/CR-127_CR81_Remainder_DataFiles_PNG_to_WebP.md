# CR-127 — CR-81 Remainder: products.js + stories.js PNG References → WebP

**Type:** Performance / Image Optimisation
**Date Raised:** 2026-08-24
**Raised By:** CWV investigation session (E1)
**Status:** 🔲 OPEN
**Priority:** P1
**Effort:** Low (~30 min)
**Improves:** Speed Index · TBT · "Serve images in next-gen formats" diagnostic (−170 KiB)
**Scope:** `frontend/src/data/products.js` · `frontend/src/data/stories.js`
**Related:** CR-81 (WebP conversion — partially complete)

---

## 1. Problem Statement

CR-81 (WebP + lazy-load) was marked ✅ Implemented but only converted images used by `TrustBand.jsx` and `FeatureVideo.jsx`. Two data files still reference PNG/JPG originals — Lighthouse flags this directly:

> **"Serve images in next-gen formats — Est savings of 170 KiB"**
> **"Properly size images — Est savings of 185 KiB"**

---

## 2. Affected Files

### `frontend/src/data/products.js` — 5 feature images

```js
// CURRENT (all PNG, 150–170 KB each = ~830 KB total)
{ image: "/brand/feature1.png" }  // 167 KB — WebP exists: feature1.webp (17 KB)
{ image: "/brand/feature2.png" }  // 152 KB — WebP exists: feature2.webp (15 KB)
{ image: "/brand/feature3.png" }  // 156 KB — WebP exists: feature3.webp (16 KB)
{ image: "/brand/feature4.png" }  // 168 KB — WebP exists: feature4.webp (18 KB)
{ image: "/brand/feature5.png" }  // 173 KB — WebP exists: feature5.webp (20 KB)
// Total PNG: ~816 KB → Total WebP: ~86 KB  (−730 KB, −89%)
```

```js
// AFTER
{ image: "/brand/feature1.webp" }
{ image: "/brand/feature2.webp" }
{ image: "/brand/feature3.webp" }
{ image: "/brand/feature4.webp" }
{ image: "/brand/feature5.webp" }
```

### `frontend/src/data/stories.js` — 11 testimonial images

| Client | Current file | WebP exists? | Action |
|---|---|---|---|
| Palm Forest Resort | `palmforest.png` (31 KB) | `palmforest.webp` ✅ | Switch to .webp |
| Luxevista Resort | `luxevista.png` (66 KB) | No WebP | Convert + add |
| Bamboo Yoga | `bambooyoga.png` (78 KB) | No WebP | Convert + add |
| Love Bites | `lovebites.png` (44 KB) | `lovebites.webp` ✅ | Switch to .webp |
| Ubuntu Café | `ubuntu.png` (41 KB) | `ubuntu.webp` ✅ | Switch to .webp |
| Bean Me Up | `beanmeup.jpg` (61 KB) | No WebP | Convert + add |
| Terraria Café | `terra.png` (15 KB) | `terra.webp` ✅ | Switch to .webp |
| La Fetta Pizzeria | `lafetta.png` (42 KB) | `lafetta.webp` ✅ | Switch to .webp |
| Taste of Tamil | `sushi.png` (36 KB) | No WebP | Convert + add |
| The Mill Bakery | `mill.png` (25 KB) | No WebP | Convert + add |
| Pavan Pages | `pavandpages.png` (4 KB) | No WebP | Convert + add |

---

## 3. Fix Design

**Step 1** — Convert missing WebP files (one-time, on any machine with `cwebp` or equivalent):

```bash
cd /app/frontend/public/brand
for f in luxevista bambooyoga beanmeup sushi mill pavandpages; do
  # beanmeup is jpg, rest are png
  cwebp -q 80 ${f}.png -o ${f}.webp 2>/dev/null || \
  cwebp -q 80 ${f}.jpg -o ${f}.webp 2>/dev/null
  echo "Converted $f"
done
```

**Step 2** — Update `products.js` (5 lines changed):

```js
{ image: "/brand/feature1.webp" }
{ image: "/brand/feature2.webp" }
{ image: "/brand/feature3.webp" }
{ image: "/brand/feature4.webp" }
{ image: "/brand/feature5.webp" }
```

**Step 3** — Update `stories.js` (11 lines changed, switch to .webp for all):

```js
{ img: "/brand/palmforest.webp" }
{ img: "/brand/luxevista.webp" }
{ img: "/brand/bambooyoga.webp" }
{ img: "/brand/lovebites.webp" }
{ img: "/brand/ubuntu.webp" }
{ img: "/brand/beanmeup.webp" }
{ img: "/brand/terra.webp" }
{ img: "/brand/lafetta.webp" }
{ img: "/brand/sushi.webp" }
{ img: "/brand/mill.webp" }
{ img: "/brand/pavandpages.webp" }
```

---

## 4. Impact Prediction

| Diagnostic | Current | After |
|---|---|---|
| "Serve images in next-gen formats" | Est savings 170 KiB | Resolved |
| "Properly size images" | Est savings 185 KiB | Partially resolved |
| Speed Index | ~1.7s | ~1.5s |
| Lighthouse Performance | ~72 | +3–5 pts |

---

## 5. Files Changed

| File | Change |
|---|---|
| `frontend/src/data/products.js` | 5 lines: `.png` → `.webp` |
| `frontend/src/data/stories.js` | 11 lines: `.png`/`.jpg` → `.webp` |
| `frontend/public/brand/` | Add 6 new `.webp` files (convert from existing PNG/JPG) |

---

## 6. Definition of Done

- [ ] "Serve images in next-gen formats" diagnostic no longer flags `feature*.png` or testimonial PNG/JPG
- [ ] All 5 product feature images render correctly in ModuleOverview
- [ ] All 11 testimonial images render correctly in ProofSection and SuccessStories
- [ ] No layout shift introduced (images should have same aspect ratio)
- [ ] Lighthouse Speed Index improves by ≥ 0.2s

---

*CR-127 registered 2026-08-24. Gap identified during Lighthouse investigation — CR-81 implementation missed the data file image references. WebP files already exist on disk for 6 of 11 stories images; 5 need conversion.*
