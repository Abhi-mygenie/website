# CR-185 Impact Analysis — Decorative Labels Below 12px (SEO Legibility)
**Date:** 2026-09-02
**Status:** PENDING IMPLEMENTATION — no content approval needed

---

## 1. Current State — Full Inventory

Lighthouse SEO audit: "Document uses legible font sizes" — flags any rendered text < 12px on mobile.

### Hero.jsx (affects ALL homepage visits)

| Line | Current | Text content | Context |
|---|---|---|---|
| L82 | `text-[11px]` | "Works with" | Integration strip label |
| L87 | `text-[11px]` | "Swiggy" | Brand badge text |
| L91 | `text-[11px]` | "Zomato" | Brand badge text |
| L95 | `text-[11px]` | "Razorpay" | Brand badge text |
| L98 | `text-[11px]` | "GST-ready" | Trust badge text |

**5 instances, 11px → 12px**

---

### RestaurantBillingSoftware.jsx (/restaurant-billing-software)

| Line | Current | Text content | Context |
|---|---|---|---|
| L75 | `text-[9px]` | "Most Popular" | Absolute-positioned pill tag on pricing card |
| L134 | `text-[11px]` | Metric sublabel (e.g., "faster service") | Below metric number |

**2 instances — 9px → 12px, 11px → 12px**

---

### PetpoojaAlternative.jsx (/petpooja-alternative)

| Line | Current | Text content | Context |
|---|---|---|---|
| L386 | `text-[10px]` | "Add-on" | Inline tag label |
| L412 | `text-[11px]` | "leakage caught in 2 weeks" | Metric sublabel |
| L416 | `text-[11px]` | "lower fixed costs" | Metric sublabel |
| L543 | `text-[11px]` | "Billing Software — Petpooja's starting point" | Section header label |
| L568 | `text-[11px]` | "MyGenie — Hospitality Operating System" | Section header label |
| L602 | `text-[11px]` | "Feature" | Comparison table header |
| L603 | `text-[11px]` | "MyGenie" | Comparison table header |
| L604 | `text-[11px]` | "Petpooja" | Comparison table header |
| L624 | `text-[10px]` | Category row text (e.g., "Billing & Payments") | Table category separator |
| L755 | `text-[10px]` | "Switched from Petpooja" | Testimonial badge |
| L820 | `text-[10px]` | Plan badge text | Pricing section badge |
| L898 | `text-[9px]` | "Most Popular" | Absolute pill tag |
| L983 | `text-[11px]` | Section eyebrow label | Section header |

**13 instances across 3 size categories**

---

## 2. Total Instance Count

| File | 9px | 10px | 11px | Total |
|---|---|---|---|---|
| `Hero.jsx` | 0 | 0 | 5 | **5** |
| `RestaurantBillingSoftware.jsx` | 1 | 0 | 1 | **2** |
| `PetpoojaAlternative.jsx` | 1 | 5 | 7 | **13** |
| **Total** | **2** | **5** | **13** | **20** |

---

## 3. CMS Override Check

None of these text labels are CMS-controlled. All are hardcoded strings (not `EditableText`). No CMS conflict. Safe to change directly.

---

## 4. Fix — Uniform rule

All instances → **`text-xs`** (12px in Tailwind = `0.75rem`)

- `text-[9px]` → `text-xs` (3px increase — still compact, visually acceptable)
- `text-[10px]` → `text-xs` (2px increase)
- `text-[11px]` → `text-xs` (1px increase — barely perceptible)

**No font weight, colour, or tracking changes** — only the size class changes.

Note: `text-xs` with `uppercase tracking-widest` (which most of these use) renders as a tight, small label — the visual change is minimal.

---

## 5. Files to Change

| # | File | Instances | Change |
|---|---|---|---|
| 1 | `src/components/home/Hero.jsx` | 5 | `text-[11px]` → `text-xs` |
| 2 | `src/pages/RestaurantBillingSoftware.jsx` | 2 | `text-[9px]` → `text-xs`, `text-[11px]` → `text-xs` |
| 3 | `src/pages/PetpoojaAlternative.jsx` | 13 | `text-[9px]`/`text-[10px]`/`text-[11px]` → `text-xs` |

**3 files, 20 class changes, zero deletions.**

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Visible layout shift | Very low | Low — 1-3px increase on decorative labels | Labels have fixed containers / padding |
| "Most Popular" pill overflow | Very low | Low — pill has `px-4 py-1 whitespace-nowrap` | No overflow possible |
| Table header row taller | Very low | Low — table rows have fixed padding `py-3.5` | 1px text increase won't affect row height |
| Requires rebuild | Yes | Low | Standard yarn build |

---

## 7. Definition of Done

- [ ] 20 class changes applied across 3 files
- [ ] Zero `text-[9px]`, `text-[10px]`, `text-[11px]` remaining in all 3 files
- [ ] Visual spot-check: Hero badges, pricing pills, comparison table all look correct
- [ ] Lighthouse SEO "Document uses legible font sizes" passes
- [ ] Rebuild + frontend restart complete

*CR-185 Impact Analysis complete. 3 files, 20 class changes. No content approval needed.*
