# CR-159 — /customers: Add Sticky Demo CTA

**Type:** Conversion Rate Optimisation
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P2
**Finding:** #6 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

`/customers` (SuccessStories.jsx) is a bottom-funnel page — visitors arrive to check social proof before deciding. High purchase intent.

Current conversion paths:
- Bottom-of-page CTA section: `<a href="/#demo">Book a Free Demo</a>` — only reachable after scrolling past all stories
- No sticky CTA, no inline mini-form, no mid-page conversion point

A visitor who reads 3–4 stories and is convinced has **no way to convert mid-scroll**. They must scroll to the bottom (or go back to the nav) to find a demo button.

**H1 (`"Owners don't just like MyGenie. They count the difference."`) is intentional brand voice — do NOT rewrite it.** The sub-text already says "across restaurants, cafés, QSRs, resorts, canteens and chains."

---

## 2. Fix A — Sticky "Book a Demo" bar above the footer

Add a sticky bottom bar that appears after the user scrolls past the hero (e.g. after 300px scroll):

```jsx
// Component: StickyDemoCta (reuse/adapt existing StickyMobileCta pattern)
// Appears: after 300px scroll on /customers
// Content: "Convinced? Book a free walkthrough." + "Book a Free Demo →" button (href="/#demo")
// Dismiss: X button stores in sessionStorage so it doesn't reappear
```

Pattern reference: `frontend/src/components/home/StickyMobileCta.jsx` — same scroll-trigger logic.

**Alternatively (simpler):** Add a sticky right-rail CTA card on desktop that appears after scrolling past the hero:
- Small card: "Ready to see MyGenie?" + CTA button
- Mobile: use existing `StickyMobileCta` component passed `onDemo={() => window.location.href='/#demo'}`

---

## 3. Fix B — Add inline mini-CTA between story cards (mid-page)

After every 6 story cards in the grid, insert a "Your story could be next" CTA card:

```jsx
// After every 6th story card in the grid:
<div className="rounded-3xl bg-brand-green text-white p-8 flex flex-col justify-between">
  <h3 className="font-display text-2xl font-bold">Your story could be next.</h3>
  <a href="/#demo" className="mt-4 inline-flex items-center gap-2 bg-white text-brand-green rounded-full px-5 py-3 font-semibold">
    Book a Free Demo <ArrowRight />
  </a>
</div>
```

---

## 4. Files to Change

| File | Operation | Lines |
|---|---|---|
| `frontend/src/pages/SuccessStories.jsx` | ADD mid-page CTA card after every 6 stories | +15 lines |
| `frontend/src/pages/SuccessStories.jsx` | ADD sticky demo CTA (or use StickyMobileCta) | +5 lines |

---

## 5. Definition of Done

- [ ] A "Book a Free Demo" CTA is reachable without scrolling to bottom of page
- [ ] Sticky CTA visible after scrolling past hero on mobile
- [ ] Mid-page CTA card appears in story grid
- [ ] All CTA links go to `/#demo` (or scroll to local form if one is added to the page)
- [ ] H1 unchanged

*CR-159 registered 2026-08-26. Source: UX/SEO Audit Finding #6.*
