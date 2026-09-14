# CR-230 — Impact Analysis: Modal CTA on 5 Paid Landing Pages

**Date:** 2026-09-08
**Priority:** P0 — Revenue (bleeding daily)
**Pages affected:** `/restaurant-pos-system`, `/restaurant-billing-software`, `/restaurant-management-software`, `/cloud-kitchen-pos`, `/qsr-pos-system`
**Source:** Dev brief 2026-09-07 · GA4 data 4–8 Sep 2026

---

## 1. Problem Statement

All 5 paid landing pages send every "Book a Free Demo" CTA to an anchor `#lp-demo` that scrolls to a form section **7,859px+ down** a 9,222px page. On mobile, the anchor lands on the section heading — form fields are a full screen below the fold. The user has to scroll again to reach the first input.

`/petpooja-alternative` — the only ad page using a **modal** — converts at 35% of paid sessions that scroll. The 5 new pages convert at **0%** with identical traffic and identical form component.

---

## 2. Evidence

| Page | Paid sessions 4–8 Sep | Form starts | CTA implementation |
|---|---|---|---|
| /restaurant-pos-system | 10 | **0** | `<a href="#lp-demo">` anchor |
| /restaurant-billing-software | 19 | **0** | `<a href="#lp-demo">` anchor |
| /restaurant-management-software | 6 | **0** | `<a href="#lp-demo">` anchor |
| /cloud-kitchen-pos | — | **0** | `<a href="#lp-demo">` anchor |
| /qsr-pos-system | 0 (ad delivery gap) | — | `<a href="#lp-demo">` anchor |
| **/petpooja-alternative** | **26** | **9 (35%)** | Modal button |

Google Ads Alpha quality signal: **"below average post-click landing page experience"** on restaurant billing software, restaurant POS, restaurant software keywords — despite above-average ad relevance and CTR.

---

## 3. Root Cause (confirmed from source code)

```jsx
// ALL 5 pages — every CTA is an anchor link
<a href="#lp-demo" data-testid="pos-lp-navbar-cta">Book Free Demo</a>
<a href="#lp-demo" data-testid="pos-lp-cta-primary">Book a Free POS Demo</a>
<a href="#lp-demo" data-testid="pos-plan-cta-starter">Book Free Demo</a>  // ×3 pricing cards
```

The `#lp-demo` section sits near the bottom of a long scrollable page. On mobile (390px width), tapping the nav CTA forces scroll past 7,800px of content before the form section appears — and the heading renders first, fields one more screen below.

**Contrast with petpooja-alternative:**
```jsx
// PetpoojaAlternative.jsx — internal modal state
const [stage, setStage] = useState("form");
// Nav CTA → setStage("form") → form renders in modal overlay immediately
```

---

## 4. What Changes

### Change 1 — Wire all CTAs to open modal (critical, all 5 pages)

All anchor `<a href="#lp-demo">` tags in nav, hero, mid-page, and pricing cards → converted to `<button onClick={() => setShowModal(true)}>`.

**CTAs per page to convert (confirmed from source):**

| data-testid | Location | All 5 pages? |
|---|---|---|
| `[page]-lp-navbar-cta` | Fixed nav bar | Yes |
| `[page]-lp-cta-primary` | Hero section | Yes |
| `[page]-plan-cta-starter` | Pricing card | Yes |
| `[page]-plan-cta-growth` | Pricing card | Yes |
| `[page]-plan-cta-pro` | Pricing card | Yes |

**Modal pattern reference:** `src/pages/PetpoojaAlternative.jsx` — modal state is managed inline within the page component using `useState`. No separate `<DemoModal>` component exists — the form renders inline with a conditional render or overlay div.

### Change 2 — Add compact hero form (inline above the fold)

A 3-field short form (name, phone, email) directly in the hero section of the 3 pages that don't have it yet (POS, Billing, Management). Cloud Kitchen and QSR already have `<DemoForm shortForm>` at the bottom — needs moving to hero or adding a second instance above the fold.

Component: `<DemoForm shortForm submitLabel="Book Free Demo →" />` — already exists and used on these same pages at bottom.

### Change 3 — Add sticky mobile CTA bar

`<StickyMobileCta>` component already exists at `src/components/site/StickyMobileCta.jsx`. Already used on `/petpooja-alternative`, all product pages, all sector pages. Add to all 5 pages — opens the same modal.

### Change 4 — Keep bottom `#lp-demo` section

Do not remove. Retain as secondary fallback for users who scroll.

### Change 5 — Fix bottom section mobile layout

In the `#lp-demo` section of each page, `<DemoForm>` renders below the heading/benefit copy on mobile. Move form above heading on mobile (`order-first` or flex-col-reverse), or reduce `py-20/py-28` padding so anchor-jump lands on the first input field, not the heading text.

---

## 5. Files to Change

| File | Changes needed |
|---|---|
| `src/pages/RestaurantPosSystem.jsx` | Change 1 + 2 + 3 + 5 |
| `src/pages/RestaurantBillingSoftware.jsx` | Change 1 + 2 + 3 + 5 |
| `src/pages/RestaurantManagementSoftware.jsx` | Change 1 + 2 + 3 + 5 |
| `src/pages/CloudKitchenPos.jsx` | Change 1 + 3 + 5 (shortForm already at bottom) |
| `src/pages/QsrPosSystem.jsx` | Change 1 + 3 + 5 (shortForm already at bottom) |

**No new components needed.** All required components already exist in the codebase.

---

## 6. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Modal breaks OTP → Calendly tracking flow | Low — same DemoForm component, no changes to form logic | Test Tag Assistant after deploy: confirm `form_start` → `form_submitted` → `Book demo` sequence |
| Sticky bar overlaps consent banner on mobile | Low — `StickyMobileCta` already handles this on other pages via `z-index` | Visual QA on iPhone Safari |
| React hydration mismatch from modal state | Low — modal is client-side only, no prerender impact | No action needed |

---

## 7. Expected Outcomes

| Metric | Before | After (expected, 2–3 days) |
|---|---|---|
| Form starts per paid session | 0% | ~30% (petpooja benchmark) |
| Google Ads post-click experience | Below average | Above average |
| Alpha conversions per 100 clicks | ~2% | ~8–9% (pre-URL-switch rate) |
| Freshsales leads from ad pages | 0 | Resumes |
| Cost per lead from Alpha campaign | N/A (no leads) | ~₹1,100 (historical rate) |

---

## 8. Verification Checklist (post-deploy)

- [ ] Phone test: tap nav CTA on `/restaurant-pos-system` → form modal appears immediately, no scroll
- [ ] Phone test: tap sticky bar → same modal
- [ ] Tag Assistant session: `form_start` fires → `form_submitted` → OTP → `Book demo` conversion tag fires
- [ ] GA4: `form_start` events appear for paid sessions on all 5 pages within 24h
- [ ] Google Ads: Alpha conversions resume within 2–3 days
- [ ] Freshsales: new leads arriving with correct source/page attribution

---

## 9. Build & Deploy Notes

- One rebuild covers all 5 pages (all in same bundle)
- Can be batched with CR-231 (WhatsApp FAB disable) and CR-215B (logo reduction) in same deploy
- After deploy: Cloudflare → Purge Everything

---

*Written 2026-09-08. Source: dev brief MyGenie-Dev-Brief-2026-09-07.md + GA4 4–8 Sep + source code investigation.*
