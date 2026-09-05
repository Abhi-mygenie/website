# CR-137 — PetpoojaAlternative.jsx Schema: Line-by-Line Implementation Plan

**Date:** 2026-08-24
**Status:** READY — awaiting approval. No code changed.
**Prerequisite:** Read `CR-137_ImpactAnalysis.md` first.

---

## Pre-Implementation Checks

```bash
# A. Confirm no jsonLd currently on /petpooja-alternative
grep -n "jsonLd\|SOFTWARE_APP" /app/frontend/src/pages/PetpoojaAlternative.jsx
# Expected: no output (no jsonLd prop, no SOFTWARE_APP import)

# B. Confirm SOFTWARE_APP_JSONLD is exported from seo.js
grep "SOFTWARE_APP_JSONLD" /app/frontend/src/lib/seo.js
# Expected: export const SOFTWARE_APP_JSONLD = { ...

# C. Confirm current Seo call (lines 1003-1007)
sed -n '1003,1008p' /app/frontend/src/pages/PetpoojaAlternative.jsx
# Expected:
#   <Seo
#     title="Best Petpooja Alternative for Restaurants — MyGenie POS"
#     description="Comparing Petpooja with MyGenie?..."
#     path="/petpooja-alternative"
#   />
```

---

## Change 1 — Line 9: Add `SOFTWARE_APP_JSONLD` to import

**File:** `src/pages/PetpoojaAlternative.jsx`

**Current line 9:**
```jsx
import Seo from "@/components/site/Seo";
```

**Replace with:**
```jsx
import Seo from "@/components/site/Seo";
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**Why:** `SOFTWARE_APP_JSONLD` is defined in `seo.js` (lines 31-83) and exported. It contains the full `SoftwareApplication` entity with 3 `Offer` objects. No new code needed in `seo.js`.

**What does NOT change:**
- Lines 1–8: all existing imports — untouched ✅
- Lines 10–23: all remaining imports (`EditableText`, `useContentDoc`, etc.) — untouched ✅
- All other imports shift by 0 lines (this inserts one new line at line 10, existing line 10 becomes line 11) — no functional impact ✅

**After this change, new line 10:**
```jsx
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

---

## Change 2 — Lines 1003–1007 (now 1004–1008 after Change 1): Add `jsonLd` prop to `<Seo>`

**Current lines 1004–1008 (after +1 shift):**
```jsx
      <Seo
        title="Best Petpooja Alternative for Restaurants — MyGenie POS"
        description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
        path="/petpooja-alternative"
      />
```

**Replace with:**
```jsx
      <Seo
        title="Best Petpooja Alternative for Restaurants — MyGenie POS"
        description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
        path="/petpooja-alternative"
        jsonLd={[SOFTWARE_APP_JSONLD]}
      />
```

**Change:** Add one line — `jsonLd={[SOFTWARE_APP_JSONLD]}` — before the closing `/>`.

**Why array wrapper `[...]`:** Consistent with how `SOFTWARE_APP_JSONLD` is passed on all other pages (`/pricing`, `/`). The `<Seo>` component handles both scalar and array via `Array.isArray(jsonLd)` check (confirmed in `Seo.jsx`).

**Context (surrounding lines 1001–1012 for verification):**
```jsx
  return (
    <div className="bg-white" data-testid="petpooja-alternative-page">
      <Seo
        title="Best Petpooja Alternative for Restaurants — MyGenie POS"
        description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
        path="/petpooja-alternative"
        jsonLd={[SOFTWARE_APP_JSONLD]}
      />
      <LandingNavbar onQuickBook={() => setSheetOpen(true)} />
      <main>
        <VspHero                    doc={doc} />
```

**What does NOT change:**
- `title` prop — unchanged, same string ✅
- `description` prop — unchanged, same string ✅
- `path` prop — unchanged, `/petpooja-alternative` ✅
- `LandingNavbar`, `VspHero`, `VspPhilosophy`, `VspProof`, `VspAi`, `VspPricing`, `VspCta` — all untouched ✅
- `QuickDemoSheet` component (lines 53–320) — untouched ✅
- `DemoForm` inside `VspCta` (line 982) — untouched ✅
- `useContentDoc("vsp", {...})` at line 995 — untouched ✅

---

## Complete File Change Summary

| Change | Location | Type | Lines affected |
|--------|----------|------|----------------|
| 1 | After line 9 | New import line | +1 line (new line 10) |
| 2 | Seo call (~line 1008) | Add `jsonLd` prop | +1 line |
| **Total** | | | **+2 lines, 0 deletions** |

---

## Execution Pipeline

### Step 1 — Apply both changes (search_replace × 2)
### Step 2 — Build
```bash
cd /app/frontend && yarn build 2>&1 | tail -5
# Expected: "Done in XX.XXs" — no errors
```

### Step 3 — Prerender (55 routes)
```bash
cd /app/frontend && node scripts/prerender.js 2>&1 | tail -3
# Expected: last line = "prerendered /payment-success -> ..."
```

### Step 4 — Restart
```bash
sudo supervisorctl restart frontend && sleep 3
```

### Step 5 — Verify (curl + schema check)
```bash
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)

python3 - "$BACKEND_URL" << 'PYEOF'
import sys, subprocess, re, json

BASE = sys.argv[1]
html = subprocess.run(["curl", "-s", BASE + "/petpooja-alternative"], capture_output=True, text=True).stdout

# Check 1: Schema types present
scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
types = [json.loads(s).get("@type") for s in scripts if s.strip()]
has_software = "SoftwareApplication" in types
print(f"{'PASS' if has_software else 'FAIL'} Schema types: {types}")

# Check 2: Offer objects present
offers = [o for s in scripts for o in (json.loads(s).get("offers",[]) if isinstance(json.loads(s).get("offers"), list) else [])]
print(f"{'PASS' if len(offers)==3 else 'FAIL'} Offer count: {len(offers)} (expected 3)")

# Check 3: Title unchanged
title = re.search(r'<title>(.*?)</title>', html)
t = title.group(1) if title else "MISSING"
correct_title = "Best Petpooja Alternative" in t
print(f"{'PASS' if correct_title else 'FAIL'} Title: {t[:55]}")

# Check 4: Canonical unchanged
canon = re.search(r'<link rel="canonical" href="([^"]+)"', html)
c = canon.group(1) if canon else "MISSING"
correct_canon = c == "https://www.mygenie.online/petpooja-alternative"
print(f"{'PASS' if correct_canon else 'FAIL'} Canonical: {c}")

# Check 5: No homepage content leaking (body integrity)
no_leak = "Run a more profitable" not in html
print(f"{'PASS' if no_leak else 'FAIL'} No homepage body leak")
PYEOF
```

**Expected output:**
```
PASS Schema types: ['SoftwareApplication']
PASS Offer count: 3 (expected 3)
PASS Title: Best Petpooja Alternative for Restaurants — MyGen
PASS Canonical: https://www.mygenie.online/petpooja-alternative
PASS No homepage body leak
```

---

## Rollback

```bash
cd /app/frontend
git checkout src/pages/PetpoojaAlternative.jsx
yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

---

## Definition of Done

- [ ] `SOFTWARE_APP_JSONLD` imported on line 10
- [ ] `jsonLd={[SOFTWARE_APP_JSONLD]}` on the `<Seo>` call
- [ ] `yarn build` completes — no errors
- [ ] 55 routes prerendered
- [ ] Verification script: all 5 checks PASS
- [ ] `/petpooja-alternative` live page renders correctly (no visual regression)

---

## Open Item Registered

**CR-138 (new):** Add FAQ section + QAPage schema to `/petpooja-alternative`.
Requires: owner-approved FAQ content (4–6 Q&A pairs on Petpooja comparison topics).
Content suggestions:
- "Can I migrate my Petpooja data to MyGenie?"
- "Does MyGenie work without hardware like Petpooja?"
- "What happens to my existing aggregator integrations when I switch?"
- "How long does it take to go live on MyGenie from Petpooja?"
- "Is MyGenie more expensive than Petpooja?"

Blocked on owner until content is ready.

---

## Additional Finding — Price Discrepancy (Not CR-137 Scope)

The `VspPricing` component (line 838) shows Growth plan at **₹1,299**.
The main pricing page and `SOFTWARE_APP_JSONLD` show Growth at **₹1,499**.

This is a stale price in the Petpooja page's pricing display. Schema will use the correct ₹1,499.
The visible display bug should be fixed separately by the owner updating the pricing data.

---

*Line-by-line plan written 2026-08-24. No code changed. Awaiting "go ahead" to implement.*
