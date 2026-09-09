# CR-57: Sector-Page Demo Anchor Lands on Section Heading, Not Form (Mobile)

## Date: 2026-07-05
## Status: **REGISTERED — awaiting owner approval to implement**
## Priority: **HIGH** — every mobile visitor from paid sector-page CTAs lands ~1500 px above the form and must scroll further to reach it
## Reporter: Owner — screenshot from `/petpooja-alternative` on iPhone (real production, 2026-07-05 ~11:52 IST)
## Related:
- CR-50 (Calendly popup fix — different bug, same page)
- CR-45 (unrelated but bundled in this session's memory)

---

## Problem Statement

On every non-homepage that hosts a `<DemoForm>`, tapping any on-page "Book a Free Demo" / "Book Your Free Walkthrough" / "Get Started" CTA jumps the browser to a section anchor (`#vsp-demo`, `#sector-demo`, `#ai-demo`, etc.). The anchor is placed on the **outer `<section>`**, whose first visible content is a heading + subtitle + 3 switch-badge cards (~1500 px tall on mobile).

- **Desktop:** the section uses `grid lg:grid-cols-2` — the heading is on the LEFT and the DemoForm is on the RIGHT of the fold. Both visible after the jump. **Works.**
- **Mobile (`< lg`):** the grid stacks vertically — heading + badges first, then form far below. The user is dropped on the heading; the form is **~1500 px further scroll down**. Many users assume the button did nothing or that there is no form.

**Confirmed observation (2026-07-05, user's screenshot):** tapping "Book a Free Demo" on `/petpooja-alternative` on iPhone landed on the *"See if MyGenie is the right switch for your restaurant"* heading + `"24-hour go-live"` / `"Free data migration"` / `"Dedicated account manager from day 1"` badges. Form was not in viewport.

---

## Root Cause

Common pattern used across sector/product/AI/solutions pages:

```jsx
<section id="vsp-demo" ...>           //  ← anchor on OUTER wrapper
  <div className="grid lg:grid-cols-2 ...">
    <div>{/* heading + subtitle + badges — stacks first on mobile */}</div>
    <div>
      <DemoForm />                    //  ← ACTUAL FORM, but the anchor doesn't point here
    </div>
  </div>
</section>
```

Fixing this is a **2-line change per page**: move the `id="..."` from the `<section>` to the `<div>` that wraps `<DemoForm>`. Anchor still works everywhere it's currently referenced, but now targets the form itself.

---

## Blast Radius — 6 pages affected

Verified via grep of `/app/frontend/src/pages/*.jsx`:

| # | File | Section id | Form location | Impact |
|---|---|---|---|---|
| 1 | `pages/PetpoojaAlternative.jsx` L580 | `vsp-demo` | L642 | ✅ **User-reported**. Top-of-funnel for Petpooja-Alternative paid campaigns. |
| 2 | `pages/SectorPage.jsx` L232 | `sector-demo` | L251 | Drives `/sector/*` dynamic routes — every sector (biryani, cafe, cloud-kitchen, ice-cream, bakery, etc.). Wide reach. |
| 3 | `pages/SolutionsIndex.jsx` L110 | `solutions-demo` | L122 | `/solutions` landing page. |
| 4 | `pages/ProductIndex.jsx` L109 | `product-index-demo` | L121 | `/product` landing page. |
| 5 | `pages/ProductPage.jsx` L229 | `product-demo` | L247 | `/product/*` individual product pages. |
| 6 | `pages/AiPage.jsx` L243 | `ai-demo` | L267 | `/ai` Practical-AI page. |

**Not affected** (confirmed): `Contact.jsx` (form inside tab), `About.jsx` (no section anchor), `DemoLanding.jsx` (form is the primary content, no wrapping section anchor), `CtaDemo.jsx` (homepage — anchor is already correctly on the form wrapper `<div id="demo">`).

---

## Impact Analysis

### 1. Business impact (funnel-side)

- Every mobile visitor coming from Google/Meta ads → sector-specific landing page → tapping any on-page demo CTA gets dropped on the heading/badge section, form not visible.
- Anecdotal evidence from paid-search leads (Himanshu, Dhas, Aryen — investigated earlier this session): high OTP-stage dropoff and 1-second-session abandonments are consistent with users landing above the form, assuming the CTA did nothing, and closing the tab.
- On mobile the incremental scroll to reach the form is ~1500 px = user must scroll 3–5 additional viewport-heights past a hero-repeat + badge stack that looks like content they've already read.
- **Estimated conversion lift** if fixed: probably 5–15 % of paid-mobile traffic that currently abandons at the "why can't I find the form?" moment. Speculative until we A/B; the actual impact is bounded by the mobile-CTA-click population.

### 2. Data / attribution impact

- **None.** No backend, no attribution changes, no DB writes touched.
- Existing `pushLead(...)` GTM events unchanged.
- Freshsales writes unchanged.

### 3. Integration impact

- **None.** No Meta CAPI, Google Ads, Calendly, or SMS pathway is touched.

### 4. UX impact — scoped

- Section visual layout is identical: same heading, same badges, same form position on desktop. On mobile the user arrives directly at the form and the heading is above (scroll-up if they want context).
- Anchor URLs (`href="#vsp-demo"` on line 89 / 557 of PetpoojaAlternative, and the equivalents on each affected page) continue to resolve — they just jump to a slightly lower Y-coordinate. Existing bookmarks, share URLs, and PDF/CMS links continue to work.
- Cosmetic: the fixed navbar (`height ≈ 60 px`) overlaps the top of the form for ~1 sec after jump. Same overlap exists today. Not made worse by this change. Optional follow-up if we want polish: add `scroll-margin-top: 80px` in Tailwind on the new anchor `<div>`. This does not need to be part of the CR-57 patch itself.

### 5. Code / architecture impact

- Pure frontend, 6 files, ~12 lines total (2 lines per file: remove `id="..."` on section, add `id="..."` on the form-wrapping div).
- No new components, no props, no state, no imports.
- No design-system change.
- No dependency change, no env change.
- Reversible in a single commit; per-file diff is a search-and-replace.

### 6. Risk

| Risk | Likelihood | Mitigation |
|---|---|---|
| Existing external link with `#sector-demo` scrolls to slightly different Y-coordinate | Low | The old outer section is still there; form is inside it. Any external link still lands in the same region — just at the form instead of the heading. UX net-positive. |
| CMS-managed anchor changes elsewhere use these ids | Low | Grep confirms no CMS content references these hash ids by name; they're only referenced within the same page files. |
| Data-testid conflict | None | `data-testid` values on section (e.g., `vsp-cta`, `sector-demo-section`) are unchanged. Only the anchor `id` attribute moves. |
| SEO impact from moving an anchor | None | Anchors are not indexed by search engines; content ordering is unchanged. |

### 7. What this does NOT solve

- The **top-nav** "Book a Free Demo" button on non-homepage pages still uses `href="/#demo"`, which navigates to the homepage. On sector pages this is a full navigation away from the sector page. That's a different bug — call it CR-57b if we want to fix it separately (make the nav button context-aware: on `/petpooja-alternative` route to `#vsp-demo` on the same page instead of homepage).
- The `SectorPage` dynamic route uses the same `#sector-demo` id — fixing that one line covers every dynamic sector (biryani, café, cloud kitchen, ice cream, bakery, etc.) in one shot.

---

## Fix Design

For each of the 6 affected files, the diff pattern is identical:

```diff
-  <section id="vsp-demo" className="bg-brand-deep py-20 sm:py-28 ..." data-testid="vsp-cta">
+  <section className="bg-brand-deep py-20 sm:py-28 ..." data-testid="vsp-cta">
     ...
     <Reveal delay={0.1}>
-      <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="vsp-demo-form-wrap">
+      <div id="vsp-demo" className="bg-white rounded-3xl p-8 sm:p-10 scroll-mt-20" data-testid="vsp-demo-form-wrap">
         <DemoForm sector="petpooja-alternative" />
       </div>
     </Reveal>
```

The `scroll-mt-20` Tailwind class adds `scroll-margin-top: 5rem` — accounts for the 60 px fixed navbar so the form heading isn't hidden under it after the jump. This is a nice polish add-on that costs nothing.

### Files touched — exact list

1. `frontend/src/pages/PetpoojaAlternative.jsx` (`vsp-demo` → form wrapper L641)
2. `frontend/src/pages/SectorPage.jsx` (`sector-demo` → form wrapper near L251)
3. `frontend/src/pages/SolutionsIndex.jsx` (`solutions-demo` → form wrapper near L122)
4. `frontend/src/pages/ProductIndex.jsx` (`product-index-demo` → form wrapper near L121)
5. `frontend/src/pages/ProductPage.jsx` (`product-demo` → form wrapper near L247)
6. `frontend/src/pages/AiPage.jsx` (`ai-demo` → form wrapper near L267)

Grand total: **~12 lines changed across 6 files**.

---

## Verification plan

1. Visit each of the 6 affected pages on mobile viewport (Chrome DevTools, iPhone 12 mini ≈ 390 × 844).
2. Scroll to any hero CTA / plan-card CTA / "Book a Free Demo" pill.
3. Tap it. Expect the form's top edge to be at (or ~80 px below) the top of the viewport, not the section heading.
4. On desktop (`≥ lg`): confirm layout is visually identical — form still on the right column, heading on left.
5. Regression: confirm external anchor URLs like `mygenie.online/petpooja-alternative#vsp-demo` still land near the form (they will — the anchor moved 4 elements inward, not to a different section).

---

## Rollback

Single commit reverts all 6 files. Zero cleanup, zero state, zero data implication.

---

## Deployment sequence recommendation

Because CR-50 (Calendly popup fix) is also awaiting a production deploy from this session, **bundle CR-57 into the same deploy** — one prod push, two visible wins on mobile:
- CR-50: **Book My Slot now opens a calendar** on mobile (was silently doing nothing)
- CR-57: **Book a Free Demo now lands on the form**, not on the heading + badges

Sales-ops gets the "6 browser vs 12 server" ratio squeezed as a bonus (fewer OTP-stage abandonments from users who never found the form on their first tap).

---

*CR-57 registered: 2026-07-05. Agent: E1, Emergent Labs.*
