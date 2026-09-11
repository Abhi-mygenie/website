# CR-96 — Surface GST/UPI/Aggregator Trust Signals Above Fold

**Type:** India Market UX / Trust  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN — design updated 2026-08-25
**Design decision (2026-08-25):**
- Use actual partner logos (Swiggy, Zomato, Razorpay) as image files — not text pills
- GST-ready stays as a styled text badge (no official logo)
- Paytm removed, Razorpay replaces it
- Offline mode removed from the badge row
- Final badge row: [Swiggy logo] [Zomato logo] [Razorpay logo] [GST-ready]  
**Priority:** MEDIUM  
**Plan ID:** M8  
**Effort:** 1 hr  
**Improves:** Conv · Trust · India Market  
**Scope:** `frontend/src/components/home/Hero.jsx`, `frontend/src/data/sectors.js`  
**Related:** Marketing brief Issue 4, audit SXO (GST buyer persona 34/100)

---

## 1. Problem Statement

The homepage hero and key sector pages don’t mention India-specific trust signals above the fold: GST compliance, UPI/Paytm payments, Swiggy/Zomato aggregator integration. These are primary decision factors for Indian restaurant operators comparing POS options.

The GST/compliance-focused buyer persona scores only 34/100 in the audit’s SXO assessment.

---

## 2. Exact Changes Required

### Change 1 — `frontend/src/components/home/Hero.jsx`
Add a badge row of India-specific integrations below the hero CTA buttons:
```jsx
{/* India integration badges — below CTA row */}
<div className="mt-5 flex flex-wrap items-center gap-2">
  <span className="text-xs text-brand-muted font-medium">Works with:</span>
  {[
    { label: "Swiggy",  icon: "bike" },
    { label: "Zomato",  icon: "bike" },
    { label: "UPI/Paytm" },
    { label: "GST-ready" },
    { label: "Offline mode" },
  ].map((b) => (
    <span key={b.label} className="bg-white border border-brand-line rounded-full px-3 py-1 text-xs font-semibold text-brand-ink">
      {b.label}
    </span>
  ))}
</div>
```

### Change 2 — `frontend/src/data/sectors.js` — cloud-kitchens `sub`
Update the sub-headline to mention aggregators explicitly:
```js
// BEFORE:
sub: "Juggling Swiggy, Zomato and multiple brands shouldn’t mean five tablets and a spreadsheet. MyGenie unifies it all into one backend.",

// AFTER (already mentions them — just ensure GST is also mentioned):
sub: "Juggling Swiggy, Zomato, Magicpin, and multiple brands shouldn’t mean five tablets. MyGenie unifies everything — GST billing included — into one backend.",
```

---

## 3. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/home/Hero.jsx` | Add India integration badges below CTAs |
| `frontend/src/data/sectors.js` | Update cloud-kitchens sub to mention GST |

---

## 4. Definition of Done

- [ ] Homepage hero shows Swiggy, Zomato, UPI/Paytm, GST-ready badges below CTAs
- [ ] Badges are visible above fold on mobile (375px)
- [ ] Cloud-kitchens sector page sub mentions GST
- [ ] No visual clutter — badges are small and unobtrusive

---

*CR-96 registered 2026-08-20. Source: SEO & QS Audit · Plan ID M8.*
