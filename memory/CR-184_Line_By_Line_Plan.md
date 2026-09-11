# CR-184 Line-by-Line Implementation Plan — Trust Logo Resize
**Date:** 2026-09-02 (updated after live measurement)
**Status:** READY TO IMPLEMENT

---

## Scope

| What | Count | Change |
|---|---|---|
| `/public/brand/*.webp` trust logos | **42 files** | Resize in-place: 575×575px → 128×128px, WebP quality 80 |
| JSX / data files | 0 | No change — same filenames, same paths in content.js |

---

## Step 1 — Run the resize script (from `/app/frontend`)

```python
from PIL import Image
import os

LOGOS = [
    "/brand/abbiesgarden.webp",
    "/brand/aap-ki-apni-rasoi.webp",
    "/brand/baba-italy.webp",
    "/brand/bambooyoga.webp",
    "/brand/baskobitlogo.webp",
    "/brand/bean-me-up.webp",
    "/brand/cafe-103.webp",
    "/brand/cafe-amigos-logo.webp",
    "/brand/chmny-clove.webp",
    "/brand/cutletopia-logo.webp",
    "/brand/dotara.webp",
    "/brand/drishti-yoga.webp",
    "/brand/food-corner.webp",
    "/brand/food-mohalla.webp",
    "/brand/g-squer-logo.webp",
    "/brand/grean-leaf-resort.webp",
    "/brand/henchu.webp",
    "/brand/hiramani.webp",
    "/brand/humsafar-menu-design-logo.webp",
    "/brand/kasba-pureveg.webp",
    "/brand/kings-lair.webp",
    "/brand/kinara-cafe.webp",
    "/brand/kunfa-logo.webp",
    "/brand/lafetta.webp",
    "/brand/love-bites.webp",
    "/brand/lsd.webp",
    "/brand/luxeevista.webp",
    "/brand/matroshka-logo.webp",
    "/brand/militia-eateary.webp",
    "/brand/mill-bakery.webp",
    "/brand/nainital-momos-logo.webp",
    "/brand/naradmuni-logo.webp",
    "/brand/neo-italian.webp",
    "/brand/nibble.webp",
    "/brand/nihao.webp",
    "/brand/olala-logo.webp",
    "/brand/palm-forest.webp",
    "/brand/palm-house.webp",
    "/brand/logo-pav-and-pages-re.webp",
    "/brand/rhino.webp",
    "/brand/runway.webp",
    "/brand/sab.webp",
    "/brand/sab-logo.webp",
    "/brand/serena-by-the-sea.webp",
    "/brand/singh-oliwood-logo.webp",
    "/brand/srt-bangle-bytes.webp",
    "/brand/sushi-cafe.webp",
    "/brand/taran-new-logo.webp",
    "/brand/terraia.webp",
    "/brand/the-cake.webp",
    "/brand/the-craft.webp",
    "/brand/the-palm-aryan.webp",
    "/brand/the-sattva.webp",
    "/brand/the-trible-logo.webp",
    "/brand/tons-cafe.webp",
    "/brand/wooden-stone.webp",
]

before_total = 0
after_total = 0
count = 0
skipped = []

for logo in LOGOS:
    path = f"public{logo}"
    if not os.path.exists(path):
        skipped.append(logo)
        continue
    before = os.path.getsize(path)
    before_total += before
    img = Image.open(path).convert("RGBA")
    img.thumbnail((320, 128), Image.LANCZOS)
    img.save(path, "WEBP", quality=80)
    after = os.path.getsize(path)
    after_total += after
    count += 1

print(f"Resized:  {count} logos")
if skipped:
    print(f"Skipped:  {skipped}")
print(f"Before:   {before_total // 1024} KiB")
print(f"After:    {after_total // 1024} KiB")
print(f"Saved:    {(before_total - after_total) // 1024} KiB  ({round((before_total - after_total) / before_total * 100)}%)")
```

**Why thumbnail((320, 128)) gives 128x128 for all square logos:**
Source: 575x575. Pillow picks the smaller scale factor:
- width limit: 320/575 = 0.557
- height limit: 128/575 = 0.223 (smaller — this wins)

Result: 128x128px. ✓ Exactly 2x the 64px display height.

---

## Step 2 — Verification Gate

```bash
python3 << 'PYEOF'
import os
from PIL import Image

spot = [
    'nihao', 'luxeevista', 'baskobitlogo', 'g-squer-logo',
    'kinara-cafe', 'baba-italy', 'abbiesgarden', 'kunfa-logo',
]

total = 0
all_ok = True
for name in spot:
    path = f'/app/frontend/public/brand/{name}.webp'
    if not os.path.exists(path): continue
    size = os.path.getsize(path)
    img = Image.open(path)
    w, h = img.size
    total += size
    ok = size < 8000 and max(w, h) <= 320
    if not ok: all_ok = False
    tag = "OK  " if ok else "FAIL"
    print(f"{tag}  {size//1024}KB  {w}x{h}  {name}.webp")

print(f"\nAvg: {total//len(spot)//1024}KB (target <8KB)")
print("PASS" if all_ok else "FAIL")
PYEOF
```

---

## Step 3 — Build + Restart

```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

---

*Plan updated 2026-09-02. Corrected to 42 logos / 663 KiB (previous plan had 51 logos / 861 KiB — earlier estimate included non-trust-band images). Zero JSX changes.*
