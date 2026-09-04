# CR-207 — Line-by-Line Implementation Plan: Remove Wildcard lucide-react Import

**CR:** CR-207
**Date:** 2026-09-04
**Status:** Ready to implement
**File:** `src/components/site/Navbar.jsx`
**Effort:** 1 file · ~4 edits · 1 rebuild
**Risk:** Low

---

## Pre-flight Checks

```bash
# Confirm current bundle hash
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: main.dde43c90.js  (CR-206 build — note this as baseline)

# Confirm current main bundle size (CR-206 baseline)
ls -lh /app/frontend/build/static/js/main.dde43c90.js
# Expected: 937 KB

# Confirm Navbar.jsx has the wildcard import
grep -n "import \* as Icons" /app/frontend/src/components/site/Navbar.jsx
# Expected: line 3: import * as Icons from "lucide-react";
```

---

## The Change — Navbar.jsx Only

### Current lines 1–3 (BEFORE)

```javascript
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
```

### After (lines 1–20 approx)

```javascript
import { useState, useEffect, useRef } from "react";
import {
  Menu, X, ChevronDown, ChevronRight,
  // Solutions dropdown (SECTORS)
  UtensilsCrossed, Coffee, Sandwich, ChefHat, BedDouble,
  Store, Utensils, Building2, Wine, Croissant, IceCreamCone,
  // Product dropdown (MODULE_BUCKETS)
  ShoppingBag, Building, HeartHandshake, ShieldCheck,
  LayoutDashboard, Warehouse,
  // Resources dropdown
  BookOpen, Calculator, HelpCircle,
  // Direct use + fallback
  Phone, Box,
} from "lucide-react";

const NAV_ICONS = {
  UtensilsCrossed, Coffee, Sandwich, ChefHat, BedDouble,
  Store, Utensils, Building2, Wine, Croissant, IceCreamCone,
  ShoppingBag, Building, HeartHandshake, ShieldCheck,
  LayoutDashboard, Warehouse,
  BookOpen, Calculator, HelpCircle,
  Phone, Box,
};
```

---

## Edit 1 — Replace the import block (lines 2–3)

**Tool:** `search_replace` on `/app/frontend/src/components/site/Navbar.jsx`

**old_str:**
```
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
```

**new_str:**
```
import {
  Menu, X, ChevronDown, ChevronRight,
  UtensilsCrossed, Coffee, Sandwich, ChefHat, BedDouble,
  Store, Utensils, Building2, Wine, Croissant, IceCreamCone,
  ShoppingBag, Building, HeartHandshake, ShieldCheck,
  LayoutDashboard, Warehouse,
  BookOpen, Calculator, HelpCircle,
  Phone, Box,
} from "lucide-react";

const NAV_ICONS = {
  UtensilsCrossed, Coffee, Sandwich, ChefHat, BedDouble,
  Store, Utensils, Building2, Wine, Croissant, IceCreamCone,
  ShoppingBag, Building, HeartHandshake, ShieldCheck,
  LayoutDashboard, Warehouse,
  BookOpen, Calculator, HelpCircle,
  Phone, Box,
};
```

---

## Edit 2 — Replace `Icons[it.icon]` with `NAV_ICONS[it.icon]` (line 73)

**old_str:**
```
              const Icon = Icons[it.icon] || Icons.Box;
```

**new_str:**
```
              const Icon = NAV_ICONS[it.icon] || Box;
```

---

## Edit 3 — Replace `Icons.Phone` with `Phone` (line 156)

**old_str:**
```
            <Icons.Phone className="w-3.5 h-3.5" />
```

**new_str:**
```
            <Phone className="w-3.5 h-3.5" />
```

---

## Verify Before Rebuild

```bash
# Confirm wildcard import is gone
grep -n "import \* as Icons" /app/frontend/src/components/site/Navbar.jsx
# Expected: no output

# Confirm NAV_ICONS map is present
grep -n "NAV_ICONS" /app/frontend/src/components/site/Navbar.jsx
# Expected: 2 lines (definition + usage)

# Confirm Icons.Phone is replaced
grep -n "Icons\." /app/frontend/src/components/site/Navbar.jsx
# Expected: no output

# Confirm all 26 named icons present in import
grep -A20 "import {" /app/frontend/src/components/site/Navbar.jsx | head -20
# Expected: multi-line import with all icons listed
```

---

## Rebuild

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr207.log 2>&1 &
echo "Build started — PID=$!"
```

Monitor:
```bash
tail -f /app/memory/build-cr207.log
# Wait for: "Done in Xs."
grep "prerendered /404" /app/memory/build-cr207.log
# Expected: "prerendered /404 -> ..."
```

---

## Restart Frontend

```bash
sudo supervisorctl restart frontend
sleep 3
sudo supervisorctl status frontend
# Expected: RUNNING
```

---

## Validation Checks

### Check A: Main bundle reduced by ~400–450 KB

```bash
ls -lh /app/frontend/build/static/js/main.*.js | grep -v ".map"
# Expected: new main.*.js significantly smaller than 937 KB
# Target: < 550 KB (if >700 KB the wildcard may still be present)

python3 -c "
import os, glob
files = glob.glob('/app/frontend/build/static/js/main.*.js')
files = [f for f in files if not f.endswith('.map')]
for f in files:
    size = os.path.getsize(f) // 1024
    print(f'{f}: {size} KB')
    if size > 700:
        print('WARNING: bundle still large — check if wildcard removed correctly')
    elif size < 400:
        print('PASS: bundle significantly reduced')
    else:
        print('OK: meaningful reduction')
"
```

### Check B: lucide-react NOT in main bundle source map (wildcard gone)

```bash
python3 -c "
import json, glob
maps = glob.glob('/app/frontend/build/static/js/main.*.js.map')
if not maps: exit(1)
smap = json.load(open(maps[0]))
lucide_sources = [s for s in smap.get('sources', []) if 'lucide' in s]
print(f'lucide sources in main bundle: {len(lucide_sources)}')
if len(lucide_sources) > 30:
    print('FAIL — wildcard import still pulling in full library')
elif len(lucide_sources) > 0:
    print('OK — only named icons present (expected ~26)')
else:
    print('PASS — no lucide sources in main bundle (tree-shaken to chunks)')
"
```

### Check C: All 63 routes still prerendered

```bash
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63
```

### Check D: T1 — new hash not in known-bad list

```bash
NEW_HASH=$(ls /app/frontend/build/static/js/main.*.js | grep -v ".map" | grep -o '[a-f0-9]\{8\}' | head -1)
echo "New hash: $NEW_HASH"
KNOWN_BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "$KNOWN_BAD" | grep -q "$NEW_HASH" && echo "FAIL — in known-bad list" || echo "PASS — hash clean"
```

### Check E: Nav icons functional (visual spot-check)

```bash
# Verify the icons used in SOLUTIONS/PRODUCTS are all in named imports
grep -c "UtensilsCrossed\|ChefHat\|HeartHandshake\|Warehouse" /app/frontend/src/components/site/Navbar.jsx
# Expected: 4 (all present in NAV_ICONS definition)
```

---

## Full T1–T8 Regression

This change touches Navbar.jsx which renders on ALL pages. Run the full regression after build:

```
T1  Bundle hash         → verify new hash clean
T2  React #418          → zero errors (createRoot fix unaffected)
T3  H1 keywords         → unchanged (Navbar has no H1)
T4  Meta desc lengths   → unchanged
T5  SEO landing pages   → HTTP 200 + correct titles (nav renders fine)
T6  Dead routes         → redirects unaffected
T7  Canonical tags      → unchanged
T8  Title uniqueness    → unchanged
```

---

## Rollback Plan

If validation fails (bundle not reduced, nav icons broken):

```bash
# Revert Navbar.jsx to original state:
# Edit 1 (search_replace):
#   old_str: the multi-line import + NAV_ICONS block
#   new_str: original 2 lines (named import + wildcard import)
#
# Edit 2 (search_replace):
#   old_str: const Icon = NAV_ICONS[it.icon] || Box;
#   new_str: const Icon = Icons[it.icon] || Icons.Box;
#
# Edit 3 (search_replace):
#   old_str: <Phone className="w-3.5 h-3.5" />
#   new_str: <Icons.Phone className="w-3.5 h-3.5" />

# Rebuild
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build
sudo supervisorctl restart frontend
```

---

## Post-Implementation: Maintenance Note

**IMPORTANT for future development:** If a new sector or product is added to `content.js` or `products.js` with a new icon string (e.g., `icon: "Leaf"`), that icon MUST be added to both:
1. The named import block in `Navbar.jsx`
2. The `NAV_ICONS` object in `Navbar.jsx`

The `Box` fallback means the nav won't crash, but the icon will show a box placeholder until added.

Add this note to `Navbar.jsx` as a comment above `NAV_ICONS`:

```javascript
// NAV_ICONS: explicit map of icon strings used by SECTORS + MODULE_BUCKETS + RESOURCES.
// When adding a new sector/product with a new icon, add it here too.
// Using explicit map (not import *) to keep lucide-react tree-shakeable — see CR-207.
```

---

## Summary

| Step | Action | File | Time |
|---|---|---|---|
| Pre-flight | 3 checks | — | <1 min |
| Edit 1 | Replace import + add NAV_ICONS | `Navbar.jsx` | 2 min |
| Edit 2 | `Icons[it.icon]` → `NAV_ICONS[it.icon]` | `Navbar.jsx` | 30s |
| Edit 3 | `Icons.Phone` → `Phone` | `Navbar.jsx` | 30s |
| Verify | 5 grep checks | — | 1 min |
| Rebuild | `yarn build` | — | ~3 min |
| Validate | 5 checks + T1 | — | 2 min |
| **Total** | | | **~10 min** |

*Line-by-line plan complete — 2026-09-04.*
*Ready to implement on agent instruction — no code edit in this session.*
