# CR-155 — /pricing H1 Keyword + Standalone Demo CTA

**Type:** SEO / Conversion Rate
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P2
**Finding:** #2 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

### Gap A — H1 has no keyword
Current H1: `"Build your MyGenie plan."` — brand-only, no POS/pricing/restaurant keyword.
Meta title: `"Restaurant POS Pricing & Plans | MyGenie"` (keyword-rich) — mismatch between title and H1.

Visitors arriving from organic searches like "restaurant pos pricing" or "restaurant billing software price" see a H1 that doesn't confirm they landed in the right place.

### Gap B — No standalone DemoForm / "book a call" CTA
The current conversion paths on `/pricing` are:
1. `CartSummary` → "Buy Online" → `CheckoutModal` (payment/quote intent)
2. `CartSummary` → "Book a Demo" → `CheckoutModal` (demo intent via configurator)

A visitor who arrives with **talk-first intent** (wants to discuss pricing before building a plan) has no escape hatch — they must interact with the configurator to reach a demo button. This is a friction barrier for high-intent visitors.

Note: `/pricing` already shows plan prices (₹799/₹1,499/₹2,499 per plan card). The "no prices" claim in the audit is incorrect.

---

## 2. Fix A — H1 Keyword Update

**File:** `frontend/src/pages/Pricing.jsx` L174 (via CMS editable)

```jsx
// BEFORE (fallback):
<EditableText id="pricing.hero.h1" fallback="Build your MyGenie plan." />

// AFTER (fallback):
<EditableText id="pricing.hero.h1" fallback="Restaurant POS pricing — build your exact plan." />
```

Also update eyebrow (L171):
```jsx
// BEFORE:
fallback="Transparent, build-your-own pricing"

// AFTER:
fallback="Transparent restaurant POS pricing"
```

**CMS note:** Both are CMS-editable without deploy (`pricing.hero.h1`, `pricing.hero.eyebrow`).

---

## 3. Fix B — Add "Book a Demo" anchor CTA below the hero text

Add a simple text CTA below the sub-headline (L178), before the configurator starts:

```jsx
// After the <p> sub-headline, before <div className="mt-10 grid lg:grid-cols-3...">
<div className="mt-6 flex flex-wrap gap-3">
  <a href="#lp-demo" className="...primary button style...">
    Book a Free Demo →
  </a>
  <span className="text-sm text-brand-muted self-center">
    or build your plan below
  </span>
</div>
```

And add a `DemoForm` section at the bottom of the page (after `ComparisonTable`, before `Footer`):

```jsx
<section id="lp-demo" className="bg-brand-deep py-20 scroll-mt-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
    <div>
      <h2>See the pricing live — book a free walkthrough</h2>
      <p>A specialist builds your exact quote on the call.</p>
    </div>
    <DemoForm sector="pricing" shortForm />
  </div>
</section>
```

---

## 4. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/pages/Pricing.jsx` | EDIT H1 + eyebrow fallback | +2 lines |
| `frontend/src/pages/Pricing.jsx` | ADD hero CTA anchor link | +8 lines |
| `frontend/src/pages/Pricing.jsx` | ADD DemoForm section before Footer | +20 lines |

---

## 5. Definition of Done

- [ ] H1 contains "Restaurant POS pricing" or approved keyword variant
- [ ] `DemoForm` present on `/pricing` with `sector="pricing"` and `shortForm`
- [ ] "Book a Demo" link in hero area scrolls to `#lp-demo`
- [ ] Existing `CartSummary` "Book a Demo" → `CheckoutModal` flow unchanged
- [ ] Prerendered after build

*CR-155 registered 2026-08-26. Source: UX/SEO Audit Finding #2.*
