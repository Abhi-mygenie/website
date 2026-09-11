# CR-185 — Decorative Text Labels Below 12px (SEO Legibility)

**Type:** SEO / Mobile UX
**Date Raised:** 2026-09-02
**Status:** OPEN
**Priority:** P3
**Source:** Lighthouse mobile SEO audit — "Document uses legible font sizes"
**Batch:** W — Lighthouse Audit Gaps

---

## Problem

Lighthouse SEO audit flags text smaller than 12px as illegible on mobile. Several decorative labels and badges use `text-[9px]`, `text-[10px]`, or `text-[11px]`:

| File | Line(s) | Current size | Context |
|---|---|---|---|
| `Hero.jsx` | L82, 87, 91, 95 | `text-[11px]` | "WORKS WITH" label + Swiggy/Zomato/Razorpay brand names |
| `RestaurantBillingSoftware.jsx` | L75 | `text-[9px]` | "Most Popular" pricing badge |
| `RestaurantBillingSoftware.jsx` | L134 | `text-[11px]` | Metric sublabel |
| `PetpoojaAlternative.jsx` | L386, L543, L568, L602-604, L755, L820 | `text-[10px]`, `text-[11px]` | Table headers, section labels, comparison badges |

---

## Fix

Increase all sub-12px text to minimum `text-xs` (12px). For decorative uppercase labels, `text-[10px]` → `text-xs` with tighter tracking still achieves the visual intent.

Most impactful fix: `Hero.jsx` aggregator labels (visible on all homepage loads).

---

## Files to Change

| File | Change |
|---|---|
| `src/components/home/Hero.jsx` | `text-[11px]` → `text-xs` on WORKS WITH labels |
| `src/pages/RestaurantBillingSoftware.jsx` | `text-[9px]` → `text-xs`, `text-[11px]` → `text-xs` |
| `src/pages/PetpoojaAlternative.jsx` | `text-[10px]`, `text-[11px]` → `text-xs` |

---

## Expected Outcome

Lighthouse SEO "Legible font sizes" check passes. Minor SEO score improvement on production audit.

*Note: These are decorative labels — the visual impact of the change is minimal.*

*CR-185 registered 2026-09-02. Source: Lighthouse mobile audit.*
