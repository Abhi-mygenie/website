# CR-155 — Impact Analysis
# /pricing H1 Keyword + Standalone Demo CTA

**Date:** 2026-08-26

---

## 1. Code Investigation

### H1 and eyebrow
`Pricing.jsx` L170-174:
```jsx
<span ...>
  <EditableText id="pricing.hero.eyebrow" fallback="Transparent, build-your-own pricing" />
</span>
<h1 ...>
  <EditableText id="pricing.hero.h1" fallback="Build your MyGenie plan." />
</h1>
```
- Both are CMS-editable (keys: `pricing.hero.eyebrow`, `pricing.hero.h1`)
- Meta title (`seo.js`): `"MyGenie POS Pricing | Transparent Restaurant POS Plans & Add-ons"` — has keyword. H1 mismatch.

### Existing conversion paths on /pricing
1. `CartSummary` (sticky right col) → "Buy Online" → `CheckoutModal` (payment intent)
2. `CartSummary` → "Book a Demo" → `CheckoutModal` (demo intent — opens a form inside modal)
3. No standalone `DemoForm` anywhere on the page

The modal-gated demo path is a **2-step funnel:** visitor must interact with the plan configurator → click "Book a Demo" in the CartSummary → `CheckoutModal` opens with form inside.

A **talk-first visitor** (wants to call before choosing a plan) has extra friction vs. any LP page.

### "SIMPLE, COMPLETE PRICING" confusion clarified
The audit mentioned this section heading — it's from **`CtaDemo.jsx` on the homepage** (section with `id="pricing"`), NOT the `/pricing` page. The `/pricing` page itself says "Transparent, build-your-own pricing". This clears up the audit confusion.

### Prices DO exist on /pricing
- `PlanCard.jsx` L49: `₹{plan.price}/mo` rendered for each of Starter/Growth/Pro
- `CartSummary`: shows annual total, GST, `₹/yr` figures
- The "no prices" audit finding was invalid

---

## 2. Fix A Impact — H1 Keyword

**Code change (or CMS edit):**
```
Eyebrow: "Transparent, build-your-own pricing" → "Transparent restaurant POS pricing"
H1:      "Build your MyGenie plan."             → "Restaurant POS pricing — build your exact plan."
```

**Risk:** None. H1 still communicates the configurator intent. Adding "Restaurant POS pricing" makes the page confirm to high-intent visitors they're in the right place.

**CMS route:** Preferred. `pricing.hero.eyebrow` and `pricing.hero.h1` keys editable at `/leads` admin. No deploy needed for live value.

---

## 3. Fix B Impact — Standalone DemoForm

### Where to add it
After `ComparisonTable` (L310) and before the petpooja link (L312) and `Footer`:

```jsx
{/* Demo form for talk-first visitors */}
<section id="lp-demo" className="bg-brand-deep py-20 mt-16 scroll-mt-20">
  ...
  <DemoForm sector="pricing" shortForm />
</section>
```

Also add a hero-level anchor:
```jsx
{/* After sub-headline (L178), before configurator */}
<a href="#lp-demo" className="...">Book a Free Demo →</a>
<span className="text-sm text-brand-muted">or build your plan below</span>
```

### Conversion flow after fix
| Visitor intent | Path |
|---|---|
| Talk-first | Clicks "Book a Free Demo →" in hero → scrolls to DemoForm → submits |
| Buy-first | Uses configurator → CartSummary → CheckoutModal (unchanged) |
| Compare-first | Uses ComparisonTable → then DemoForm at bottom |

**No existing flow is broken.** `CartSummary` and `CheckoutModal` remain unchanged.

### Sector tagging
`sector="pricing"` → `source_page: "sector:pricing"` → Freshsales tag `"src:pricing"`.
Sales team can filter leads from `/pricing` separately from other sources.

---

## 4. Files Changed

| File | Change | Risk |
|---|---|---|
| `Pricing.jsx` L171/L174 | Fallback text update (or CMS edit) | None |
| `Pricing.jsx` L178 | Add hero anchor CTA | None |
| `Pricing.jsx` after L310 | Add DemoForm section | None — new section, nothing removed |

---

## 5. Cross-Impact

- **CR-156 (shortForm):** The new DemoForm on `/pricing` should use `shortForm` — consistent with CR-156 decision
- **CR-161 (submit text):** If `submitLabel` not set, button reads `"Book My Free Demo →"` after CR-161 — correct for this page
- **CR-160 (Reveal):** The new DemoForm section should NOT be wrapped in `<Reveal>` — it needs to be visible immediately when scrolled to via anchor

*Impact analysis written 2026-08-26.*
