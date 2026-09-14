# CR-182 Line-by-Line Implementation Plan — LCP Responsive Banner
**Date:** 2026-09-02
**Status:** READY TO IMPLEMENT

---

## Files Changed: 2

| # | File | Change |
|---|---|---|
| 1 | `public/brand/banner-mobile.webp` | **New file** — 400×329px (~8 KiB) |
| 2 | `src/components/home/Hero.jsx` | Add `srcSet` + `sizes` to `EditableImage` (lines 109–119) |

`EditableImage` — **no change** (already spreads `...rest` onto `<img>`).

---

## Part A — Create `banner-mobile.webp`

Run once from `/app/frontend`:

```python
from PIL import Image
img = Image.open("public/brand/banner.webp")
w, h = img.size  # 776 × 637
target_w = 400
target_h = round(h * target_w / w)  # = 329px (same aspect ratio)
mobile = img.resize((target_w, target_h), Image.LANCZOS)
mobile.save("public/brand/banner-mobile.webp", "WEBP", quality=82)
print(f"Created banner-mobile.webp at {target_w}×{target_h}")
```

**Expected output file:** `public/brand/banner-mobile.webp` — ~7–9 KiB (vs 38 KiB source)

---

## Part B — `src/components/home/Hero.jsx` lines 109–119

**BEFORE (lines 109–119):**
```jsx
            <EditableImage
              block
              id="home.hero.banner_image"
              fallback="/brand/banner.webp"
              alt="MyGenie POS hospitality operating system"
              className="w-full h-[420px] object-contain"
              width={776}
              height={637}
              fetchPriority="high"
              loading="eager"
            />
```

**AFTER (lines 109–121):**
```jsx
            <EditableImage
              block
              id="home.hero.banner_image"
              fallback="/brand/banner.webp"
              alt="MyGenie POS hospitality operating system"
              className="w-full h-[420px] object-contain"
              width={776}
              height={637}
              fetchPriority="high"
              loading="eager"
              srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
              sizes="(max-width: 1023px) 400px, 776px"
            />
```

**2 lines added, 0 deleted.**

---

## Verification Gate (after build)

```bash
python3 -c "
import os
html = open('/app/frontend/build/index.html').read()
mobile_exists = os.path.exists('/app/frontend/build/brand/banner-mobile.webp')
mobile_size = os.path.getsize('/app/frontend/build/brand/banner-mobile.webp') if mobile_exists else 0
srcset_in_html = 'banner-mobile.webp 400w' in html
print('banner-mobile.webp created:', mobile_exists)
print('banner-mobile.webp size (KiB):', mobile_size // 1024)
print('srcset in prerendered HTML:', srcset_in_html)
print('sizes attr present:', '(max-width: 1023px) 400px' in html)
print('PASS' if mobile_exists and srcset_in_html and mobile_size < 15000 else 'FAIL')
"
```

---

## Build Command
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

---

*Plan written 2026-09-02. 1 new file + 2 lines in Hero.jsx.*
