# Design Brief — CR-236 Step B: Product Hero Mobile Images

**For:** Design Team
**Requested by:** Engineering (CR-236 Step B)
**Priority:** P2 — nice-to-have CWV improvement (not blocking)
**Deadline:** Whenever convenient — Step A is already live

---

## What We Need

**5 WebP image files** — mobile-optimised versions of the existing product hero images.

---

## Existing Files (source of truth)

All 5 files live at `/app/frontend/public/brand/` and are already in use on the website.

| File | What it shows |
|---|---|
| `feature1.webp` | Sell & Serve — POS billing / table ordering screen |
| `feature2.webp` | Run the Property — hotel / multi-counter management |
| `feature3.webp` | Bring Customers Back — CRM / loyalty interface |
| `feature4.webp` | Protect Your Profit — inventory / audit dashboard |
| `feature5.webp` | See Everything — owner analytics dashboard |

Current spec: **300×300 px, transparent background (RGBA), WebP, ~15–20 KB each**

---

## Deliverables — 5 New Files

| Filename | Source | Notes |
|---|---|---|
| `feature1-mobile.webp` | `feature1.webp` | Scaled-down version |
| `feature2-mobile.webp` | `feature2.webp` | Scaled-down version |
| `feature3-mobile.webp` | `feature3.webp` | Scaled-down version |
| `feature4-mobile.webp` | `feature4.webp` | Scaled-down version |
| `feature5-mobile.webp` | `feature5.webp` | Scaled-down version |

---

## Exact Spec Per File

| Property | Value |
|---|---|
| **Format** | WebP |
| **Dimensions** | 200 × 200 px |
| **Background** | Transparent (RGBA — same as originals) |
| **Max file size** | 8 KB each |
| **Quality** | WebP quality 80–85 is fine at this size |
| **Content** | Identical to the original — just smaller |
| **No cropping** | Scale down proportionally, do not crop |

---

## Why This Size

On mobile screens (< 1024 px wide), the product page hero collapses to a single column. The image is displayed at roughly **360 px wide** inside an `object-contain` box. At 2× device pixel ratio that's 720 physical pixels — 200 CSS px × 2 DPR = 400 physical pixels, which is sharp enough for a secondary illustration (not a photo).

The browser will automatically pick the mobile file on phones and the original on desktop — engineering handles that logic.

---

## Fastest Way to Create These

If you have the original source files (PNG / AI / Figma), simply export each at **200×200 px as WebP** with a transparent background at quality 80.

If you only have the existing `.webp` files, any of these tools work:

**Figma / Sketch:** Place the webp, resize canvas to 200×200, export as WebP.

**Squoosh (browser, free):** squoosh.app → open file → resize to 200×200 → WebP → download.

**Command line (if available):**
```bash
for i in 1 2 3 4 5; do
  cwebp -q 82 -resize 200 200 feature$i.webp -o feature$i-mobile.webp
done
```

---

## Where to Put Them

Drop all 5 files here:
```
/app/frontend/public/brand/
├── feature1-mobile.webp   ← new
├── feature2-mobile.webp   ← new
├── feature3-mobile.webp   ← new
├── feature4-mobile.webp   ← new
├── feature5-mobile.webp   ← new
```

Once the files are in that folder, engineering takes over — no further design input needed.

---

## What Happens After Delivery

Engineering will add `srcSet` + `sizes` to the product hero `<img>` tag and rebuild. The browser will then automatically serve:
- `feature1-mobile.webp` (200 px, ~8 KB) to phones
- `feature1.webp` (300 px, ~17 KB) to desktop

**Estimated saving:** ~8–10 KB per mobile page visit across 5 product pages.

---

*Brief written: 2026-09-08 · CR-236 Step B · Engineering contact: check HANDOVER_2026-09-08_Session10.md*
