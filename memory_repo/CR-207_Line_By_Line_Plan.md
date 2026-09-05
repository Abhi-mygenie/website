# CR-207 — Updated Line-by-Line Plan: Replace `import * as Icons` Across All 15 Files

**CR:** CR-207
**Date Updated:** 2026-09-04
**Status:** Ready to implement
**Scope:** 16 files total (1 new + 15 edits)
**Risk:** Low

---

## Summary of Approach

**Pattern used in all 15 files:**
```javascript
import * as Icons from "lucide-react";
const Icon = Icons[someStringFromData] || Icons.Fallback;
```

**Problem:** `import *` forces webpack to bundle all 3,624 icons.

**Fix strategy — Shared iconMap.js:**
Create one `src/lib/iconMap.js` exporting an `ICONS` object with all ~68
icons used across all data files. Each of the 15 components imports `ICONS`
from there instead of using the wildcard.

**Why shared map, not per-file inventories:**
- Data files (sectors.js, products.js, pricing.js, ai.js) contain icon strings
- One shared map = one place to maintain; adding a new icon = 1 edit in 1 file
- 15 simple import swaps vs 60+ per-file icon inventory edits

---

## Pre-flight Checks

```bash
grep -rn "import \* as Icons from" /app/frontend/src/ | wc -l   # Expected: 15
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'  # Note hash
ls -lh /app/frontend/build/static/js/main.dde43c90.js            # Note 937 KB baseline
```

---

## Step 1 — Create `src/lib/iconMap.js` (NEW FILE)

**File:** `/app/frontend/src/lib/iconMap.js`

Complete content:

```javascript
// iconMap.js — all lucide-react icons used in data files (sectors.js,
// products.js, pricing.js, content.js, ai.js).
// Import { ICONS } from here instead of "import * as Icons from lucide-react"
// — wildcard import bundles all 3,624 icons; this map bundles only ~68.
// CR-207 2026-09-04: when adding a new icon string to any data file, add
// the matching import + map entry here.
import {
  AlertCircle, Box, Check, Circle, Store,
  UtensilsCrossed, Coffee, Sandwich, ChefHat, BedDouble,
  Utensils, Building2, Wine, Croissant, IceCreamCone,
  ShoppingBag, Building, HeartHandshake, ShieldCheck,
  LayoutDashboard, Warehouse, BookOpen, Calculator,
  HelpCircle, Phone, Layers, LayoutGrid,
  EyeOff, Flame, ReceiptText, Timer, TrendingDown, Trash2, UserX, Users,
  TrendingUp, Zap, Repeat, Smartphone,
  Sparkles, FileUp, ScanSearch, Lightbulb,
  BarChart3, BellRing, Bike, Boxes, Cake,
  CalendarClock, ClipboardList, Gift, QrCode, RefreshCw,
  SlidersHorizontal, Ticket, Wallet, WifiOff,
  ArrowLeftRight, FileText, MessageCircle, Network, ShoppingCart,
  CreditCard, Globe, Headset, Megaphone, Monitor,
  Rocket, Settings2, SprayCan, Wifi,
} from "lucide-react";

export const ICONS = {
  AlertCircle, Box, Check, Circle, Store,
  UtensilsCrossed, Coffee, Sandwich, ChefHat, BedDouble,
  Utensils, Building2, Wine, Croissant, IceCreamCone,
  ShoppingBag, Building, HeartHandshake, ShieldCheck,
  LayoutDashboard, Warehouse, BookOpen, Calculator,
  HelpCircle, Phone, Layers, LayoutGrid,
  EyeOff, Flame, ReceiptText, Timer, TrendingDown, Trash2, UserX, Users,
  TrendingUp, Zap, Repeat, Smartphone,
  Sparkles, FileUp, ScanSearch, Lightbulb,
  BarChart3, BellRing, Bike, Boxes, Cake,
  CalendarClock, ClipboardList, Gift, QrCode, RefreshCw,
  SlidersHorizontal, Ticket, Wallet, WifiOff,
  ArrowLeftRight, FileText, MessageCircle, Network, ShoppingCart,
  CreditCard, Globe, Headset, Megaphone, Monitor,
  Rocket, Settings2, SprayCan, Wifi,
};
```

---

## Steps 2–16: Edit Each File

**Pattern for each file — always 2 parts:**
1. Replace `import * as Icons from "lucide-react"` → `import { ICONS } from "@/lib/iconMap"`
2. Replace `Icons[` → `ICONS[` and `Icons.X` → `ICONS.X` in that file

---

### Step 2 — Navbar.jsx

**File:** `src/components/site/Navbar.jsx`

Edit A (lines 2–3):
```
old: import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
     import * as Icons from "lucide-react";
new: import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
     import { ICONS } from "@/lib/iconMap";
```

Edit B (line 73):
```
old: const Icon = Icons[it.icon] || Icons.Box;
new: const Icon = ICONS[it.icon] || ICONS.Box;
```

Edit C (line 156):
```
old: <Icons.Phone className="w-3.5 h-3.5" />
new: <ICONS.Phone className="w-3.5 h-3.5" />
```

---

### Step 3 — ProblemGrid.jsx

**File:** `src/components/home/ProblemGrid.jsx`

Edit A (line 1):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 23):
```
old: const Icon = Icons[p.icon] || Icons.AlertCircle;
new: const Icon = ICONS[p.icon] || ICONS.AlertCircle;
```

---

### Step 4 — OutcomePillars.jsx

**File:** `src/components/home/OutcomePillars.jsx`

Edit A (line 1):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 20):
```
old: const Icon = Icons[p.icon] || Icons.Circle;
new: const Icon = ICONS[p.icon] || ICONS.Circle;
```

---

### Step 5 — SectorSelector.jsx

**File:** `src/components/home/SectorSelector.jsx`

Edit A (line 2):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 11):
```
old: const ActiveIcon = Icons[s.icon] || Icons.Store;
new: const ActiveIcon = ICONS[s.icon] || ICONS.Store;
```

Edit C (line 30):
```
old: const Icon = Icons[sec.icon] || Icons.Store;
new: const Icon = ICONS[sec.icon] || ICONS.Store;
```

---

### Step 6 — AIBand.jsx

**File:** `src/components/home/AIBand.jsx`

Edit A (lines 1–2):
```
old: import * as Icons from "lucide-react";
     import { Sparkles, ArrowRight } from "lucide-react";
new: import { Sparkles, ArrowRight } from "lucide-react";
     import { ICONS } from "@/lib/iconMap";
```

Edit B (line 28):
```
old: const Icon = Icons[u.icon] || Icons.Sparkles;
new: const Icon = ICONS[u.icon] || Sparkles;
```

---

### Step 7 — ModuleOverview.jsx

**File:** `src/components/home/ModuleOverview.jsx`

Edit A (lines 1–2):
```
old: import * as Icons from "lucide-react";
     import { Check, ArrowRight } from "lucide-react";
new: import { Check, ArrowRight } from "lucide-react";
     import { ICONS } from "@/lib/iconMap";
```

Edit B (line 23):
```
old: const Icon = Icons[b.icon] || Icons.Box;
new: const Icon = ICONS[b.icon] || ICONS.Box;
```

---

### Step 8 — SectorPage.jsx

**File:** `src/pages/SectorPage.jsx`

Edit A (line 2):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 56):
```
old: const HeroIcon = Icons[s.icon] || Icons.Store;
new: const HeroIcon = ICONS[s.icon] || ICONS.Store;
```

Edit C (line 177):
```
old: const Icon = Icons[sol.icon] || Icons.Check;
new: const Icon = ICONS[sol.icon] || ICONS.Check;
```

---

### Step 9 — ProductPage.jsx

**File:** `src/pages/ProductPage.jsx`

Edit A (line 2):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 51):
```
old: const HeroIcon = Icons[p.icon] || Icons.Box;
new: const HeroIcon = ICONS[p.icon] || ICONS.Box;
```

Edit C (line 166):
```
old: const Icon = Icons[m.icon] || Icons.Check;
new: const Icon = ICONS[m.icon] || ICONS.Check;
```

---

### Step 10 — ProductIndex.jsx

**File:** `src/pages/ProductIndex.jsx`

Edit A (lines 1–2):
```
old: import * as Icons from "lucide-react";
     import { ArrowRight, Check } from "lucide-react";
new: import { ArrowRight, Check } from "lucide-react";
     import { ICONS } from "@/lib/iconMap";
```

Edit B (line 34):
```
old: <Icons.LayoutGrid className="w-4 h-4" />
new: <ICONS.LayoutGrid className="w-4 h-4" />
```

Edit C (line 53):
```
old: <Icons.Smartphone className="w-10 h-10 text-brand-green" />
new: <ICONS.Smartphone className="w-10 h-10 text-brand-green" />
```

Edit D (line 78):
```
old: const Icon = Icons[b.icon] || Icons.Box;
new: const Icon = ICONS[b.icon] || ICONS.Box;
```

---

### Step 11 — SolutionsIndex.jsx

**File:** `src/pages/SolutionsIndex.jsx`

Edit A (lines 1–2):
```
old: import * as Icons from "lucide-react";
     import { ArrowRight } from "lucide-react";
new: import { ArrowRight } from "lucide-react";
     import { ICONS } from "@/lib/iconMap";
```

Edit B (line 40):
```
old: <Icons.Layers className="w-4 h-4" />
new: <ICONS.Layers className="w-4 h-4" />
```

Edit C (line 59):
```
old: <Icons.Store className="w-10 h-10 text-brand-green" />
new: <ICONS.Store className="w-10 h-10 text-brand-green" />
```

Edit D (line 88):
```
old: const Icon = Icons[s.icon] || Icons.Store;
new: const Icon = ICONS[s.icon] || ICONS.Store;
```

---

### Step 12 — AiPage.jsx

**File:** `src/pages/AiPage.jsx`

Edit A (lines 1–2):
```
old: import * as Icons from "lucide-react";
     import { ArrowRight, Sparkles, Check, Warehouse } from "lucide-react";
new: import { ArrowRight, Sparkles, Check, Warehouse } from "lucide-react";
     import { ICONS } from "@/lib/iconMap";
```

Edit B (line 151):
```
old: const Icon = Icons[f.icon] || Sparkles;
new: const Icon = ICONS[f.icon] || Sparkles;
```

---

### Step 13 — AddonCard.jsx

**File:** `src/components/pricing/AddonCard.jsx`

Edit A (lines 1–2):
```
old: import * as Icons from "lucide-react";
     import { Check, Plus } from "lucide-react";
new: import { Check, Plus } from "lucide-react";
     import { ICONS } from "@/lib/iconMap";
```

Edit B (line 8):
```
old: const Icon = Icons[addon.icon] || Icons.Box;
new: const Icon = ICONS[addon.icon] || ICONS.Box;
```

---

### Step 14 — PlanCard.jsx

**File:** `src/components/pricing/PlanCard.jsx`

Edit A (line 2):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 9):
```
old: const Icon = Icons[plan.icon] || Box;
new: const Icon = ICONS[plan.icon] || Box;
```

---

### Step 15 — PlanShowcase.jsx

**File:** `src/components/pricing/PlanShowcase.jsx`

Edit A (line 1):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 10):
```
old: const Icon = Icons[plan.icon] || Box;
new: const Icon = ICONS[plan.icon] || Box;
```

---

### Step 16 — ComparisonTable.jsx

**File:** `src/components/pricing/ComparisonTable.jsx`

Edit A (line 2):
```
old: import * as Icons from "lucide-react";
new: import { ICONS } from "@/lib/iconMap";
```

Edit B (line 63):
```
old: const Icon = Icons[p.icon] || Icons.Box;
new: const Icon = ICONS[p.icon] || ICONS.Box;
```

---

## Verify Before Rebuild

```bash
# Zero wildcard imports remain
grep -rn "import \* as Icons from" /app/frontend/src/
# Expected: no output

# iconMap imported in all 15 files
grep -rn "from \"@/lib/iconMap\"" /app/frontend/src/ | wc -l
# Expected: 15

# No bare Icons. references (except ICONS.)
grep -rn "Icons\." /app/frontend/src/ | grep -v "ICONS\." | grep -v "import" | grep -v "//"
# Expected: no output
```

---

## Rebuild

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr207.log 2>&1 &
echo "Build started PID=$!"
tail -f /app/memory/build-cr207.log
```

## Restart

```bash
sudo supervisorctl restart frontend
```

---

## Validation

```bash
# A: Main bundle < 550 KB (was 937 KB)
ls -lh /app/frontend/build/static/js/main.*.js | grep -v ".map"

# B: lucide in main bundle ~68 sources (was 3,624)
python3 -c "
import json,glob
m=glob.glob('/app/frontend/build/static/js/main.*.js.map')
s=json.load(open(m[0]))
l=[x for x in s.get('sources',[]) if 'lucide' in x]
print(f'lucide sources in main: {len(l)} (target ~68, was 3624)')
"

# C: 63 routes prerendered
find /app/frontend/build -name "index.html" | wc -l

# D: T1 hash clean
NEW=$(ls /app/frontend/build/static/js/main.*.js|grep -v .map|grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "$BAD"|grep -q "$NEW" && echo "FAIL" || echo "PASS $NEW"
```

---

## Edit Count Summary

| Step | File | Edits |
|---|---|---|
| 1 | iconMap.js (NEW) | 1 create |
| 2 | Navbar.jsx | 3 |
| 3 | ProblemGrid.jsx | 2 |
| 4 | OutcomePillars.jsx | 2 |
| 5 | SectorSelector.jsx | 3 |
| 6 | AIBand.jsx | 2 |
| 7 | ModuleOverview.jsx | 2 |
| 8 | SectorPage.jsx | 3 |
| 9 | ProductPage.jsx | 3 |
| 10 | ProductIndex.jsx | 4 |
| 11 | SolutionsIndex.jsx | 4 |
| 12 | AiPage.jsx | 2 |
| 13 | AddonCard.jsx | 2 |
| 14 | PlanCard.jsx | 2 |
| 15 | PlanShowcase.jsx | 2 |
| 16 | ComparisonTable.jsx | 2 |
| **Total** | | **39 edits** |

*Plan updated 2026-09-04. Ready to implement on instruction.*
