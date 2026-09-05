# CR-119 — Line-by-Line Implementation Plan
## Trust Logos: Resize to 128×128 Display Resolution

**Date:** 2026-08-23
**No code written yet. Plan only.**
**Read first:** `CR-119_ImpactAnalysis.md`

---

## 0. Prerequisite Checks

```bash
# A. cwebp installed with -resize support (confirmed)
which cwebp
# Expected: /usr/bin/cwebp

# B. All 8 source PNGs present (confirmed)
for logo in hyatt-centric palm-forest bamboo-yoga baba-italy \
            love-bites mill-bakery wild-berry drishti-yoga; do
    ls -lh /app/frontend/public/brand/${logo}.png
done
# Expected: all 8 files present, sizes from 12 KB to 78 KB

# C. Current webp files present (will be overwritten)
ls -lh /app/frontend/public/brand/{hyatt-centric,palm-forest,bamboo-yoga,baba-italy,love-bites,mill-bakery,wild-berry,drishti-yoga}.webp
# Expected: all 8 present, sizes 2.5–14 KB

# D. Supervisor in static-server mode
grep "command=" /etc/supervisor/conf.d/supervisord.conf | grep frontend
# Expected: command=/usr/bin/node .../static-server.js
```

---

## Step 1 — Generate 8 Resized WebP Files

**Single command — run exactly as written:**

```bash
for logo in hyatt-centric palm-forest bamboo-yoga baba-italy \
            love-bites mill-bakery wild-berry drishti-yoga; do
  cwebp -q 82 -resize 128 128 \
    /app/frontend/public/brand/${logo}.png \
    -o /app/frontend/public/brand/${logo}.webp
done
```

**Why this command:**
- `-q 82`: same quality setting used in CR-81 (consistent across the project)
- `-resize 128 128`: cwebp's built-in Lanczos downscaler; `128 128` = target width × height
- Source: `.png` files (not the existing `.webp`) — avoids generation-loss from re-compressing an already-lossy file
- Output: overwrites the existing `.webp` files in place — no code changes needed

**Expected output (per logo):**
```
Saving file '/app/frontend/public/brand/bamboo-yoga.webp'
File:      /app/frontend/public/brand/bamboo-yoga.png
Dimension: 128 x 128 (with alpha)
Output:    XXXX bytes ...
```

---

## Step 2 — Verify All 8 Files Are Correctly Resized

```bash
python3 << 'PYEOF'
import os, struct

def webp_dims(path):
    with open(path, 'rb') as f:
        data = f.read(40)
    if data[8:12] != b'WEBP': return None, None
    chunk = data[12:16]
    if chunk == b'VP8 ':
        w = struct.unpack('<H', data[26:28])[0] & 0x3FFF
        h = struct.unpack('<H', data[28:30])[0] & 0x3FFF
    elif chunk == b'VP8L':
        bits = struct.unpack('<I', data[21:25])[0]
        w, h = (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    elif chunk == b'VP8X':
        w = struct.unpack('<I', data[24:27] + b'\x00')[0] + 1
        h = struct.unpack('<I', data[27:30] + b'\x00')[0] + 1
    else:
        return None, None
    return w, h

logos = ['hyatt-centric','palm-forest','bamboo-yoga','baba-italy',
         'love-bites','mill-bakery','wild-berry','drishti-yoga']
brand = '/app/frontend/public/brand'
print(f"{'Logo':<22} {'Size':>8}  {'Dims':>10}  Status")
print("-"*55)
total = 0
all_ok = True
for logo in logos:
    p = f"{brand}/{logo}.webp"
    size = os.path.getsize(p)
    w, h = webp_dims(p)
    ok = (w == 128 and h == 128 and size < 5000)
    total += size
    status = "PASS" if ok else "FAIL"
    if not ok: all_ok = False
    print(f"{logo:<22} {size:>8,}  {str(w)+'x'+str(h):>10}  {status}")
print(f"\n{'Total':<22} {total:>8,}  {'':>10}  {'ALL PASS' if all_ok else 'FAILURES'}")
print(f"{'Total KB':<22} {total/1024:>7.1f}K")
PYEOF
```

**Expected output:**
```
Logo                     Size        Dims  Status
-------------------------------------------------------
hyatt-centric             ~1200   128x128  PASS
palm-forest               ~2200   128x128  PASS
bamboo-yoga               ~2400   128x128  PASS
baba-italy                ~3600   128x128  PASS
love-bites                ~1400   128x128  PASS
mill-bakery               ~1300   128x128  PASS
wild-berry                ~1800   128x128  PASS
drishti-yoga              ~1400   128x128  PASS

Total                    ~15300
Total KB                  ~14.9K        ALL PASS
```

Pass criteria for each file:
- Dimensions: exactly 128×128 ✅
- File size: < 5,000 bytes (if > 5 KB something went wrong) ✅
- Valid WebP magic bytes (RIFF header) ✅

---

## Step 3 — Build + Prerender

No source code changed, but `yarn build` is required because CRA copies `public/brand/` → `build/brand/` during build. The new smaller webp files need to be in `build/` for the static server to serve them.

```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors

cd /app/frontend && node scripts/prerender.js 2>&1
# Expected: prerendered / -> /app/frontend/build/index.html
```

---

## Step 4 — Structural Gates

```bash
python3 << 'PYEOF'
import re, os

html = open('/app/frontend/build/index.html').read()
head = re.search(r'<head>(.*?)</head>', html, re.DOTALL).group(1)

styles    = re.findall(r'<style[^>]*>(.*?)</style>', head, re.DOTALL)
noscripts = re.findall(r'<noscript>', head)
canonicals= re.findall(r'<link[^>]*canonical[^>]*>', html)
img_pre   = [l for l in re.findall(r'<link[^>]+>', html) if 'preload' in l and 'image' in l]
font_pre  = [l for l in re.findall(r'<link[^>]+>', head) if 'preload' in l and 'font' in l]

g = {
    "G1  style blocks == 2":        len(styles) == 2,
    "G2  noscript in head == 0":    len(noscripts) == 0,
    "G3  canonical == 1":           len(canonicals) == 1,
    "G4  image preload == 1":       len(img_pre) == 1,
    "G5  font preloads == 3":       len(font_pre) == 3,
    "G6  no googleapis":            'googleapis' not in html,
    "G7  hero text present":        'boosts profit by up to' in html,
    "G8  no fontshare":             'fontshare' not in html,
    "G9  logo.webp files in build": all(
        os.path.exists(f'/app/frontend/build/brand/{l}.webp')
        for l in ['hyatt-centric','palm-forest','bamboo-yoga','baba-italy',
                  'love-bites','mill-bakery','wild-berry','drishti-yoga']
    ),
    "G10 logos < 5KB each":         all(
        os.path.getsize(f'/app/frontend/build/brand/{l}.webp') < 5000
        for l in ['hyatt-centric','palm-forest','bamboo-yoga','baba-italy',
                  'love-bites','mill-bakery','wild-berry','drishti-yoga']
    ),
}
for k, v in g.items():
    print(f"{'PASS' if v else 'FAIL'} {k}")
print()
print("ALL PASS" if all(g.values()) else "FAILURES PRESENT")
PYEOF
```

---

## Step 5 — Visual Check (Screenshot)

TrustBand logos must render correctly at `h-16` size. Take a screenshot and scroll to TrustBand to verify:
- Logos are visible, not broken
- Logos look crisp (not noticeably blurry for 2× screens)

---

## Step 6 — Testing Agent (Mandatory)

---

## Rollback

If any logo appears broken or blurry:
```bash
# Re-generate at 250×250 (original size — just reconvert without -resize)
for logo in hyatt-centric palm-forest bamboo-yoga baba-italy \
            love-bites mill-bakery wild-berry drishti-yoga; do
  cwebp -q 82 /app/frontend/public/brand/${logo}.png \
    -o /app/frontend/public/brand/${logo}.webp
done
yarn build && node scripts/prerender.js
```

---

## File Change Summary

| File | Action | Lines |
|------|--------|-------|
| `public/brand/hyatt-centric.webp` | Overwrite (128×128) | Binary |
| `public/brand/palm-forest.webp` | Overwrite (128×128) | Binary |
| `public/brand/bamboo-yoga.webp` | Overwrite (128×128) | Binary |
| `public/brand/baba-italy.webp` | Overwrite (128×128) | Binary |
| `public/brand/love-bites.webp` | Overwrite (128×128) | Binary |
| `public/brand/mill-bakery.webp` | Overwrite (128×128) | Binary |
| `public/brand/wild-berry.webp` | Overwrite (128×128) | Binary |
| `public/brand/drishti-yoga.webp` | Overwrite (128×128) | Binary |
| All source `.jsx` / `.js` / `.css` | **No change** | — |

---

## Definition of Done

- [ ] All 8 logo webp files are 128×128 pixels
- [ ] All 8 are < 5 KB each (total < 20 KB, was 56.3 KB)
- [ ] All 10 structural gates pass
- [ ] TrustBand logos render visually correctly (screenshot)
- [ ] Lighthouse "Properly size images" savings < 5 KiB
- [ ] Testing agent: no visual regression

---

*Plan written 2026-08-23. No code changed. Ready for implementation on approval.*
