# CR-161 — Impact Analysis
# DemoForm Submit Button: "Get My Customized Walkthrough" → "Book My Free Demo →"

**Date:** 2026-08-26

---

## 1. Code Investigation

### Current button text logic
`DemoForm.jsx` L363–366:
```jsx
{loading
  ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
  : submitLabel
    ? <><span>{submitLabel}</span><ArrowRight className="w-4 h-4" /></>
    : sector === "meta-demo"
      ? <><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></>
      : "Get My Customized Walkthrough"}
```

### Decision tree
| Condition | Current text |
|---|---|
| `loading=true` | "Sending..." with spinner |
| `submitLabel` prop set | Custom label (e.g. "Book a Free QSR Demo →") |
| `sector === "meta-demo"` | "Book My Free Demo →" |
| **All other cases (8 pages)** | **"Get My Customized Walkthrough"** ← problem |

### Pages showing "Get My Customized Walkthrough" (8)
SectorPage (×11 sectors), About, ProductIndex, AiPage, SolutionsIndex, ProductPage (×6 buckets), Contact, CtaDemo (homepage)

---

## 2. CTA Journey Mismatch — Confirmed

| Touchpoint | Text |
|---|---|
| Nav CTA | "Book a Free Demo" |
| Hero CTA | "Book a Free Demo" |
| Sector page CTA button | "Book a {sector} Demo" (e.g. "Book a QSR Demo") |
| DemoForm H3 heading | "Book a Free Demo" |
| DemoForm **submit button** | **"Get My Customized Walkthrough"** ← mismatch |

The user saw "Book a Free Demo" three times before reaching the submit button — then the language suddenly changes to "Get My Customized Walkthrough". This creates a micro-moment of hesitation ("wait, is this the same thing I wanted?").

---

## 3. The Fix

Remove the `sector === "meta-demo"` special case — it becomes the universal default:

```jsx
// AFTER:
{loading
  ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
  : submitLabel
    ? <><span>{submitLabel}</span><ArrowRight className="w-4 h-4" /></>
    : <><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></>}
```

**Removed:** `sector === "meta-demo"` check — no longer needed since all non-submitLabel cases use the same text.

---

## 4. What Stays Unchanged

| Context | Before | After | Change? |
|---|---|---|---|
| `submitLabel="Book a Free QSR Demo →"` | "Book a Free QSR Demo →" | "Book a Free QSR Demo →" | No |
| `submitLabel="Book a Free Cloud Kitchen Demo →"` | same | same | No |
| `sector="meta-demo"` (DemoLanding) | "Book My Free Demo →" | "Book My Free Demo →" | No (same result, simpler code) |
| `loading=true` | "Sending..." | "Sending..." | No |
| **All other cases** | "Get My Customized Walkthrough" | **"Book My Free Demo →"** | **Yes** |

---

## 5. Arrow Icon Consistency

Current: "Get My Customized Walkthrough" is plain text (no `<ArrowRight>` icon).  
After: `<><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></>` — adds arrow icon.

This matches all other CTAs across the site (nav, hero, LP CTAs all have arrows). **Visual consistency improvement.**

---

## 6. Risk Assessment

| Risk | Likelihood | Notes |
|---|---|---|
| Visual regression | Very low | Arrow icon adds ~16px width — button grows slightly. Full-width button so no overflow. |
| A/B test disruption | None | No active A/B tests on submit text documented |
| Backend / tracking impact | None | Submit button text has no effect on API calls or GTM events |
| `data-testid="demo-submit-btn"` | Unchanged | Tests that check button text will need update if hardcoded |

---

## 7. Files Changed

| File | Change | Lines |
|---|---|---|
| `frontend/src/components/site/DemoForm.jsx` | Simplify L363–366 button text logic | 4 lines → 3 lines |

---

## 8. Cross-Impact

- **CR-156 (shortForm):** After CR-156, 8 pages use shortForm with simplified layout. Shorter button text (`"Book My Free Demo →"`) fits better than the long `"Get My Customized Walkthrough"` in the reduced-height form card.
- **CR-155 (/pricing DemoForm):** New pricing page DemoForm will show `"Book My Free Demo →"` by default — correct.
- **Same single-file change** — implement CR-161 alongside CR-156 in the same PR (both are in DemoForm.jsx).

*Impact analysis written 2026-08-26.*
