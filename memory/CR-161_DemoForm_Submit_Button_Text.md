# CR-161 — DemoForm Submit Button Default: "Get My Customized Walkthrough" → "Book My Free Demo →"

**Type:** Conversion Rate / Copy Consistency
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P2
**Finding:** #9 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

`DemoForm.jsx` L365 — submit button text for the default (full-form, non-meta-demo) case:

```js
// CURRENT:
sector === "meta-demo" ? "Book My Free Demo →" : "Get My Customized Walkthrough"
```

The user journey creates an expectation mismatch:
- Nav CTA: `"Book a Free Demo"` → user clicks
- Hero CTA: `"Book a Free Demo"` → user clicks  
- Form appears with title `"Book a Free Demo"` (H3 in DemoForm)
- Submit button says: `"Get My Customized Walkthrough"` ← **different message**

`"Get My Customized Walkthrough"` is long (4 words), vague ("customized walkthrough" doesn't feel like the "demo" they were promised), and doesn't create action urgency.

---

## 2. Current Button Text Inventory

| Context | Submit button text | Matches entry CTA? |
|---|---|---|
| `sector="meta-demo"` (DemoLanding) | `"Book My Free Demo →"` | ✅ |
| `submitLabel` prop set (new LPs) | Custom (e.g. `"Book a Free QSR Demo →"`) | ✅ |
| All other full/short forms (8 pages) | `"Get My Customized Walkthrough"` | ❌ |

---

## 3. Fix — Change default submit button text

**File:** `frontend/src/components/site/DemoForm.jsx` L365

```jsx
// BEFORE:
{loading
  ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
  : submitLabel
    ? <><span>{submitLabel}</span><ArrowRight className="w-4 h-4" /></>
    : sector === "meta-demo"
      ? <><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></>
      : "Get My Customized Walkthrough"}

// AFTER:
{loading
  ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
  : submitLabel
    ? <><span>{submitLabel}</span><ArrowRight className="w-4 h-4" /></>
    : <><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></>}
```

**What changes:** The `sector === "meta-demo"` special case is removed — it's now the default for all forms. The behaviour for all contexts is identical (`submitLabel` overrides if set; otherwise shows `"Book My Free Demo →"`).

**What doesn't change:** The new LP forms with `submitLabel` ("Book a Free QSR Demo →", "Book a Free Cloud Kitchen Demo →") are unaffected — `submitLabel` prop takes precedence.

---

## 4. Pages Affected

All 8 pages that use `DemoForm` without a custom `submitLabel`:
- SectorPage (11 sector variants)
- About
- ProductIndex
- AiPage
- SolutionsIndex
- ProductPage (6 product variants)
- Contact
- CtaDemo (homepage)

---

## 5. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/components/site/DemoForm.jsx` | EDIT submit button text logic | L365: ~4 lines |

---

## 6. Definition of Done

- [ ] Default submit button text reads `"Book My Free Demo →"` with arrow
- [ ] `submitLabel` prop still overrides (QSR Demo, Cloud Kitchen Demo buttons unaffected)
- [ ] Button text matches the `"Book a Free Demo"` entry CTA in nav and hero
- [ ] Loading state unchanged (`"Sending..."` with spinner)
- [ ] `data-testid="demo-submit-btn"` unchanged

*CR-161 registered 2026-08-26. Source: UX/SEO Audit Finding #9.*
