# CR-137 — PetpoojaAlternative.jsx Schema: Impact Analysis

**Date:** 2026-08-24
**Status:** Analysis complete — no code changed
**File read:** `/app/frontend/src/pages/PetpoojaAlternative.jsx` (1022 lines, read in full)

---

## 0. Critical Correction to the CR-137 Registration

The CR-137 registration document stated:

> "It has a full FAQ section → eligible for FAQPage / QAPage schema"

**This is incorrect.** After reading the full 1022-line file, the page has **zero FAQ content**. The page sections are:

| Section | Component | Has FAQs? |
|---------|-----------|-----------|
| S1 — Hero | `VspHero` | ❌ |
| S2 — Philosophy + Comparison Table | `VspPhilosophy` | ❌ |
| S3 — Proof Wall (stats + quotes) | `VspProof` | ❌ |
| S4 — AI Features | `VspAi` | ❌ |
| S5 — Pricing | `VspPricing` | ❌ |
| S6 — Demo Form | `VspCta` | ❌ |

`vsp.js` data file exports: `VSP_HERO`, `VSP_STATS`, `VSP_QUOTES`, `VSP_AI`, `VSP_COMP_LEAN`, `VSP_COMP_FULL`, `VSP_TRUST_LOGOS`, `VSP_SWITCH_BADGES`, `VSP_VIDEO_OWNERS` — **no FAQ export**.

**Consequence:** FAQPage / QAPage schema cannot be added without first creating FAQ content and a FAQ section. That is out of scope for CR-137 as a schema-only CR.

---

## 1. What CAN Be Added — Confirmed Schema Opportunities

### Opportunity A — SoftwareApplication + Offer schema ✅ IMPLEMENTABLE NOW

`SOFTWARE_APP_JSONLD` is already defined and exported from `src/lib/seo.js` (lines 31–83). It contains:
- `"@type": "SoftwareApplication"` entity declaration
- 3 `Offer` objects: Starter (₹799), Growth (₹1,499), Pro (₹2,499)
- `applicationCategory`, `operatingSystem`, `description`

This is currently used only on `/pricing` and `/` (homepage). Adding it to `/petpooja-alternative` gives Google a machine-readable SoftwareApplication entity on a page that is specifically about comparing POS software — the highest-intent context.

### Opportunity B — FAQPage / QAPage ❌ BLOCKED (no FAQ content)

Not implementable without:
1. Writing 4–6 Petpooja-comparison FAQ items (owner/content decision)
2. Adding a FAQ section to the page JSX
3. Adding a FAQ data constant to `vsp.js`

This is a separate CR — beyond CR-137's schema-only scope.

---

## 2. Price Discrepancy Discovered

While reading the file, a data inconsistency was found:

| Location | Plan | Price shown |
|----------|------|------------|
| `VspPricing` component (line 838, PetpoojaAlternative.jsx) | Growth | **₹1,299** |
| `SOFTWARE_APP_JSONLD` (seo.js line 57) | Growth | **₹1,499** |
| `/pricing` page (PlanCard, PLANS data) | Growth | ₹1,499 |

The Petpooja page's pricing section shows a stale price (₹1,299) that was updated to ₹1,499 on the main pricing page. **This is a content bug, not a CR-137 concern** — registering it as a separate finding for the owner to flag. CR-137 does not touch pricing display logic.

**Impact on schema:** `SOFTWARE_APP_JSONLD` uses ₹1,499 (correct, current price). The schema will be accurate. The visible pricing display discrepancy is separate.

---

## 3. Scope After Correction

CR-137 as implementable today:

| Change | Lines | Files |
|--------|-------|-------|
| Add `SOFTWARE_APP_JSONLD` to import on line 9 | 1 modified | `PetpoojaAlternative.jsx` |
| Add `jsonLd={[SOFTWARE_APP_JSONLD]}` to `<Seo>` on line 1003–1007 | 1 modified | `PetpoojaAlternative.jsx` |
| **Total** | **2 lines modified** | **1 file** |

---

## 4. Forms Safety

`PetpoojaAlternative.jsx` contains two forms:
1. **`QuickDemoSheet`** (lines 53–320) — bottom sheet with name/phone/email/business, OTP verification, Calendly booking
2. **`DemoForm`** (line 982) — embedded in `VspCta` section

Both changes (import + Seo prop) are at:
- Line 9: `import` statement at top of file
- Lines 1003–1007: `<Seo>` call inside `PetpoojaAlternative()` component at line 992

Neither change is anywhere near `QuickDemoSheet` (lines 53–320), `VspCta` (lines 911–989), or `DemoForm` (line 982).

**`<Seo>` renders only into `<head>` via react-helmet-async. It produces zero visible DOM, zero event handlers, zero state changes.**

Form safety: **100% confirmed, zero risk**.

---

## 5. CMS Safety

`PetpoojaAlternative.jsx` uses `EditableText` for CMS-editable copy throughout. All `EditableText` calls are inside the section components (`VspHero`, `VspPhilosophy`, etc.) — completely separate from the `<Seo>` call. The `useContentDoc("vsp", {...})` hook at line 995 is unchanged.

**CMS content safety: zero risk.**

---

## 6. SEO Impact

**Before:** `/petpooja-alternative` has zero structured data. Google cannot machine-read:
- What software is being compared
- What the pricing is
- What category of application it is

**After:** Google can extract:
- `SoftwareApplication` entity named "MyGenie POS"
- 3 `Offer` objects with prices in INR (₹799, ₹1,499, ₹2,499)
- `applicationCategory: "BusinessApplication"`, `applicationSubCategory: "Point of Sale Software"`
- `operatingSystem: "Web, Android, iOS"`

This supports Knowledge Panel reinforcement, AI Overview citation eligibility, and potential rich results on the exact query users type when evaluating POS software.

---

## 7. Post-Implementation Pipeline

After the 2-line change:
```bash
cd /app/frontend && yarn build && node scripts/prerender.js
sudo supervisorctl restart frontend
```

Verification:
```bash
python3 -c "
import json, re, subprocess
html = subprocess.run(['curl','-s','http://localhost:3000/petpooja-alternative'], capture_output=True, text=True).stdout
scripts = re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)
types = [json.loads(s).get('@type') for s in scripts if s.strip()]
print('Schema types:', types)
print('PASS' if 'SoftwareApplication' in types else 'FAIL')
"
```
Expected: `Schema types: ['SoftwareApplication']`

---

## 8. Open Gap — Not Part of CR-137

**FAQ schema gap registered as new finding:**
Adding QAPage schema to `/petpooja-alternative` requires:
1. Owner to approve 4–6 FAQ items specific to the Petpooja comparison (e.g. "Can I migrate my Petpooja data to MyGenie?")
2. A new `VSP_FAQS` constant in `vsp.js`
3. A new FAQ section added to the page JSX
4. `QAPage` JSON-LD passed to `<Seo>`

This is a content + code + schema task, minimum 30-min implementation after content is approved. Recommend registering as **CR-138** when FAQ content is ready.

---

*Impact analysis written 2026-08-24. File read in full (1022 lines). No code changed. 2-line implementation ready.*
