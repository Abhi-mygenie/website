# CR-137 — Impact Analysis: PetpoojaAlternative Schema (SoftwareApplication)

**Date:** 2026-08-24
**Files read:** `PetpoojaAlternative.jsx` (1022 lines, full), `seo.js` (SOFTWARE_APP_JSONLD lines 31–83)
**Status:** Analysis complete — no code changed. This is a carried-over analysis from earlier session.

---

## 1. Current State

`/petpooja-alternative` emits `<Seo>` with zero `jsonLd` prop:

```jsx
// PetpoojaAlternative.jsx lines 1003–1007
<Seo
  title="Best Petpooja Alternative for Restaurants — MyGenie POS"
  description="Comparing Petpooja with MyGenie? ..."
  path="/petpooja-alternative"
/>
```

**Zero structured data on the page.** Google cannot machine-read what software is being compared, what the pricing is, or what category of application it is.

---

## 2. What Can Be Added

`SOFTWARE_APP_JSONLD` is already defined in `seo.js` (lines 31–83) and used on `/pricing` and `/`. It contains:

```js
{
  "@type": "SoftwareApplication",
  name: "MyGenie POS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Point of Sale Software",
  operatingSystem: "Web, Android, iOS",
  offers: [
    { "@type": "Offer", name: "Starter", price: "799", priceCurrency: "INR" },
    { "@type": "Offer", name: "Growth",  price: "1499", priceCurrency: "INR" },
    { "@type": "Offer", name: "Pro",     price: "2499", priceCurrency: "INR" },
  ]
}
```

**Note:** The `VspPricing` component in this file shows Growth at ₹1,299 — a stale price. `SOFTWARE_APP_JSONLD` uses ₹1,499 (correct, current). The schema will be accurate even though the displayed price in the section is outdated (separate bug).

---

## 3. Fix — 2 Lines

### Change 1 — After line 9 (`import Seo`): Add import

**Current line 9:**
```jsx
import Seo from "@/components/site/Seo";
```

**Replace with:**
```jsx
import Seo from "@/components/site/Seo";
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

---

### Change 2 — Seo call (~line 1004): Add `jsonLd` prop

**Current:**
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

---

## 4. Forms Safety — Confirmed

`PetpoojaAlternative.jsx` contains:
- `QuickDemoSheet` (lines 53–320) — multi-stage form with OTP, Calendly
- `DemoForm` (line 982) — embedded demo booking form

Both changes are import (line 9) and `<Seo>` prop (line ~1004). `<Seo>` renders only into `<head>` via react-helmet-async — produces zero visible DOM and zero interaction with any form, handler, or state.

**Zero form risk — confirmed.**

---

## 5. SEO Value

Adding `SoftwareApplication` + 3 `Offer` objects to `/petpooja-alternative`:
- Declares MyGenie as a `BusinessApplication` in the POS category
- Provides machine-readable pricing on the exact page where users compare POS options
- Eligible for software rich results in SERP
- Reinforces entity signal alongside `/pricing` and `/` which already declare the same schema

---

## 6. Change Summary

| File | Change | Lines |
|------|--------|-------|
| `src/pages/PetpoojaAlternative.jsx` | Add `SOFTWARE_APP_JSONLD` import | +1 line |
| `src/pages/PetpoojaAlternative.jsx` | Add `jsonLd={[SOFTWARE_APP_JSONLD]}` to `<Seo>` | +1 line |
| **Total** | | **+2 lines** |

Requires `yarn build` + `prerender.js` after.

---

## 7. Verification

```bash
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d'=' -f2)
curl -s "$BACKEND_URL/petpooja-alternative" | python3 -c "
import sys, re, json
html = sys.stdin.read()
scripts = re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)
types = [json.loads(s).get('@type') for s in scripts if s.strip()]
print('PASS' if 'SoftwareApplication' in types else 'FAIL', 'Schema types:', types)
"
# Expected: PASS Schema types: ['SoftwareApplication']
```

---

*CR-137 impact analysis written 2026-08-24. 2-line implementation, zero risk.*
