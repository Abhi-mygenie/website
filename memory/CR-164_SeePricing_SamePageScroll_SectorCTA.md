# CR-164 — "See Pricing" Same-Page Scroll Fix + SectorPage Pricing CTA

**Type:** UX / Conversion
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P2
**Source:** Audit finding — "See Pricing buttons are dead on every page. No href='#pricing' anchor."

---

## 1. Problem Statement

The audit found "See Pricing CTA Fixed: 0/17 — No page has href='#pricing' anchor."

### What currently exists

| Page | "See Pricing" | Behaviour | Gap |
|---|---|---|---|
| **Homepage Hero** | `<Link to="/pricing">` | Navigates to `/pricing` page | ⚠️ Page nav, not same-page scroll |
| **5 LP pages** | `<a href="#lp-pricing">` | Scrolls to inline pricing section | ✅ Correct |
| **SectorPage** | No "See Pricing" at all | — | ❌ Missing CTA entirely |
| CtaDemo (homepage) | `<Link to="/pricing">` | Page nav | ⚠️ |
| Navbar | `<Link to="/pricing">` | Page nav | ✅ Intentional |

### Two separate gaps

**Gap A — Homepage Hero:** `<Link to="/pricing">` navigates to the `/pricing` page. But the homepage already has a pricing section at `id="pricing"` (the CtaDemo component at `CtaDemo.jsx` L17: `<section id="pricing" ...>`). The Hero "See Pricing" button should scroll to this section rather than leaving the page.

**Gap B — SectorPage:** No secondary CTA exists. Visitors on sector pages (e.g. `/solutions/qsr`) who want to see prices have no path except leaving via the navbar.

---

## 2. Fix A — Homepage Hero "See Pricing" → Same-Page Scroll

**File:** `frontend/src/components/home/Hero.jsx` L53–59

```jsx
// BEFORE:
<Link
  to="/pricing"
  data-testid="hero-pricing-btn"
  className="..."
>
  <EditableText id="home.hero.cta_secondary" fallback="See Pricing" />
</Link>

// AFTER:
<a
  href="#pricing"
  data-testid="hero-pricing-btn"
  className="..."
>
  <EditableText id="home.hero.cta_secondary" fallback="See Pricing" />
</a>
```

**Why `#pricing` works:** `CtaDemo.jsx` L17 has `<section id="pricing" ...>` on the homepage. The anchor already exists — it just wasn't being used.

**Behaviour:**
- Click: smooth scrolls to the pricing/demo section on the homepage (the "Simple, complete pricing" section with DemoForm)
- No page navigation — user stays on homepage
- If JS fails: `href="#pricing"` jumps natively to the section

**Impact on other pages:** `Hero.jsx` is only used on the homepage (`Home.jsx` imports it). No other pages affected.

---

## 3. Fix B — SectorPage "See Pricing" CTA

**File:** `frontend/src/pages/SectorPage.jsx`

Add a secondary CTA next to the existing "Book a Demo" button in the hero section.

**Current hero CTA area (L99–101):**
```jsx
<a href="#sector-demo" data-testid="sector-hero-cta" className="group mt-8 ...">
  Book a {s.name} Demo <ArrowRight ... />
</a>
```

**Add after the existing CTA button:**
```jsx
<a href="#sector-demo" data-testid="sector-hero-cta" className="group mt-8 ...">
  Book a {s.name} Demo <ArrowRight ... />
</a>
<Link
  to="/pricing"
  data-testid="sector-pricing-btn"
  className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all"
>
  See Pricing
</Link>
```

**Why `<Link to="/pricing">` (not `href="#pricing"`):**
SectorPage has no inline pricing section. Navigating to the full `/pricing` configurator is the correct destination — visitors who want pricing should see the full plan builder. The LP pages use `href="#lp-pricing"` because they have inline pricing blocks. SectorPage does not.

---

## 4. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/components/home/Hero.jsx` | Change `<Link to="/pricing">` → `<a href="#pricing">` | L53–59: 2 lines |
| `frontend/src/pages/SectorPage.jsx` | Add `<Link to="/pricing">See Pricing</Link>` after hero CTA | +5 lines |

---

## 5. Audit Score Impact

The audit checks for `href="#pricing"` on each page:
- After Fix A: Homepage gets `href="#pricing"` ✅
- After Fix B: All 11 SectorPage variants get `<Link to="/pricing">` ✅ (audit may not distinguish scroll vs nav if it just checks for the button's presence)

The LP pages already have `href="#lp-pricing"` — these are correct and unaffected.

---

## 6. Definition of Done

- [ ] Homepage Hero "See Pricing" is `<a href="#pricing">` (not `<Link to="/pricing">`)
- [ ] Clicking "See Pricing" on homepage scrolls to the CtaDemo pricing section (stays on page)
- [ ] `data-testid="hero-pricing-btn"` preserved
- [ ] SectorPage has a "See Pricing" secondary CTA (`data-testid="sector-pricing-btn"`)
- [ ] SectorPage "See Pricing" navigates to `/pricing` page
- [ ] All 11 sector variants show the secondary CTA

*CR-164 registered 2026-08-26. Source: Audit finding "See Pricing CTA Fixed: 0/17".*
