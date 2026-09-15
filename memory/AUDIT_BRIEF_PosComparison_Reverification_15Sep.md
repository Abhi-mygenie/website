# /restaurant-pos-comparison — Reverification Brief for Audit Agent
**From:** Dev team  
**To:** Audit agent  
**Date:** 15 Sep 2026  
**Preview URL:** https://app-preview-live-16.preview.emergentagent.com  
**Page under test:** https://app-preview-live-16.preview.emergentagent.com/restaurant-pos-comparison  
**Production URL:** https://www.mygenie.online/restaurant-pos-comparison

---

## Why this brief exists

Your previous audit (15 Sep brief) was run against **production (`www.mygenie.online`)**, which is running an old build. The preview URL above is running the current codebase. Several findings in your brief are **already resolved in the current code** — and some **new gaps were found by the dev team during source investigation** that your audit missed. This brief asks you to re-verify everything on the preview URL and confirm the accurate current state.

---

## Section 1 — Items your brief raised that the dev team has already clarified

Read this section before running any tests so you don't file duplicate issues.

### B2 — CTA buttons are JS-only

**Dev team finding: NOT a gap on this page.** All three existing CTAs are already `<a href="#lp-demo">` anchor links in the current code — navbar CTA (`data-testid="comparison-lp-navbar-cta"`), hero CTA (`data-testid="comparison-lp-cta-primary"`), and table-footer CTA (`data-testid="comparison-table-cta"`). There are zero `<button type="button">` elements used as CTAs on this page.

**What to verify on preview:**
- Inspect `[data-testid="comparison-lp-navbar-cta"]` → must be `<a>` tag with `href="#lp-demo"`
- Inspect `[data-testid="comparison-lp-cta-primary"]` → must be `<a>` tag with `href="#lp-demo"`
- Inspect `[data-testid="comparison-table-cta"]` → must be `<a>` tag with `href="#lp-demo"`
- Report: confirm PASS or report any remaining `<button>` CTA

---

### H3 — OG / Twitter meta tags missing

**Dev team finding: NOT a gap.** The `<Seo>` component used on this page automatically generates `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` from the title and description props. This was confirmed both in source code and via curl on production — OG tags are present.

**What to verify on preview:**
- View page source of `/restaurant-pos-comparison`
- In `<head>`: confirm `<meta property="og:title">` is present with non-empty content
- Confirm `<meta name="twitter:card" content="summary_large_image">` is present
- Report: confirm PASS or report any missing tag with exact tag name

**Note:** The OG title currently reads `"Compare Restaurant POS in India — MyGenie vs Posist, GoFrugal & More"` — this is correct for now. It will update automatically once H2 is implemented (no separate fix needed for OG tags).

---

### H4 — GTM dataLayer events

**Dev team finding: CONFIRMED GAP — but the gap is different from what your brief described.**

Your brief said: *"the cta_click and sheet_open pushes to dataLayer should already be firing from this page's CTA components."* This is incorrect. Source investigation found:

1. The comparison page CTAs are plain `<a href="#lp-demo">` anchors with **no `onClick` handler and no `pushEvent` call**. `cta_click` does **not** fire from this page.
2. The comparison page has **no `DemoBottomSheet` component** — no sheet exists on this page, so `sheet_open` cannot fire either.
3. The comparison page has **no `StickyMobileCta`** — no sticky bar event either.

This is the actual H4 gap: **zero dataLayer events from any CTA on this page.** The fix requires the dev team to add `pushEvent("cta_click", {...})` calls to each CTA's onClick and add a `DemoBottomSheet` + `StickyMobileCta` if those are desired.

**What to verify on preview:**
```js
// Run in DevTools console after page loads
window.dataLayer.filter(e => e.event === 'cta_click')  // expect: []
window.dataLayer.filter(e => e.event === 'sheet_open')  // expect: []
```
- Click `[data-testid="comparison-lp-cta-primary"]` → check dataLayer again → `cta_click` should NOT appear (confirms gap is real)
- Report: confirm gap is present as described, or report if events ARE firing (would be unexpected)

**Additional context — H4 gap across other pages:**

The dev team also checked H4 across all pages. The same `cta_click` gap exists on homepage and Petpooja:

| Page | `cta_click` fires? | `sheet_open` fires? |
|------|-------------------|---------------------|
| 5 Alpha LPs (`/restaurant-billing-software` etc.) | ✅ Yes — added in Batch BE (Sep 15) | ✅ Yes |
| `/restaurant-pos-comparison` | ❌ No | ❌ No |
| Homepage (`/`) | ❌ No — hero CTA has no `pushEvent` | ✅ Yes (has bottom sheet) |
| `/petpooja-alternative` | ❌ No — CTAs have no `pushEvent` | ✅ Yes (has bottom sheet) |

Please verify the homepage and Petpooja findings on preview as well and confirm.

---

## Section 2 — Confirmed gaps (dev team agrees, reverify on preview)

### B1 — `[VERIFY]` and placeholder content (content team to supply data, dev to implement)

The following placeholder content is confirmed in source and was also confirmed live on production via curl (7 `[VERIFY]` strings visible):

**Confirmed in source code:**

| Location | Placeholder text | Visible to user |
|----------|-----------------|----------------|
| Comparison table — Starting Price row | `[VERIFY]` for Posist, GoFrugal, Billberry | ✅ Yes |
| Comparison table — Switch Timeline row | `[VERIFY]` for Posist, GoFrugal, Billberry | ✅ Yes |
| Table footer disclaimer | `"[VERIFY] = to be confirmed with product team before launch"` | ✅ Yes — tells users the page is not ready |
| Testimonial card 1 | `name: "[CS Team — Posist switcher]"`, `outlet: "Restaurant Name, City"` | ✅ Yes |
| Testimonial card 3 | `name: "[CS Team — GoFrugal switcher]"`, `outlet: "Restaurant Name, City"` | ✅ Yes |

**What to verify on preview:**
- Visit `/restaurant-pos-comparison` in browser
- Scroll to comparison table — confirm `[VERIFY]` is visible in Starting Price and Switch Timeline rows for Posist, GoFrugal, Billberry
- Confirm the table footer disclaimer is readable
- Scroll to testimonials section — confirm two cards show `[CS Team...]` and `Restaurant Name, City` as the author
- Report: total count of visible placeholder strings, exact location

**Owner action required before dev can fix:** Provide verified competitor pricing, switch timeline data, and real testimonial names/restaurant details to replace all placeholders.

---

### B3 — Anchor jump uses smooth scroll (2–3 second delay)

The site applies `scroll-behavior: smooth` globally on the `html` element via `index.css`. The `#lp-demo` demo form section is near the bottom of this page. On a slow phone, tapping any CTA before hydration triggers a multi-second animated scroll that looks like the tap did nothing.

**What to verify on preview:**
- Open Chrome DevTools → Network throttling → set "Slow 3G"
- Load `/restaurant-pos-comparison`
- Before the page fully loads (within 1–2 seconds of load), click `[data-testid="comparison-lp-cta-primary"]`
- Observe: does the page smooth-scroll to `#lp-demo` slowly, or does it jump instantly?
- Report: approximate scroll duration observed, and confirm whether `prefers-reduced-motion` disables the smooth scroll (test via DevTools → Rendering → Emulate prefers-reduced-motion: reduce)

---

### H2 — Page title and meta description do not include Petpooja

**Confirmed in source and on production.** Current title: `"Compare Restaurant POS in India — MyGenie vs Posist, GoFrugal & More"`. Petpooja is absent despite being the highest-volume competitor keyword in the Competitors campaign.

**Owner decision already made:** Add Petpooja to title and meta. Petpooja column in the table is NOT being added (Petpooja has a dedicated `/petpooja-alternative` page). Only title/meta/H1 subheadline need updating.

**What to verify on preview:**
- View page source → confirm current title value
- Confirm current `<meta name="description">` value
- Report: exact current title and description strings (so dev has a baseline before implementing)

**Proposed values (for dev to implement):**
- Title: `"Compare Restaurant POS in India — MyGenie vs Petpooja, Posist, GoFrugal & More"`
- Meta description: `"Comparing Petpooja, Posist, GoFrugal or Billberry? Switch to MyGenie — AI insights, free migration, go live in 24 hrs. ₹799/outlet/month. Book a free demo."`
- Optional H1 subheadline below current H1: `"See how MyGenie compares to Petpooja, Posist, GoFrugal and more."`

---

## Section 3 — New gaps found by dev team (not in your brief — verify and confirm)

### N1 — Wrong price in testimonial copy

**Source finding:** Testimonial card 3 (GoFrugal switcher) quote reads: `"MyGenie has everything — CRM, loyalty, WhatsApp, AI — in one plan at **₹1,499 a month**."` The current Growth plan price is **₹1,299/month** (corrected in CR-166 across other pages; this page was missed).

**What to verify on preview:**
- Scroll to testimonials section
- Find the card with badge "Switched from GoFrugal"
- Check the quote for any price mention
- Report: exact price shown in the quote

---

### N2 — No StickyMobileCta on this page

**Source finding:** The comparison page has no sticky mobile bottom bar CTA. All 5 Alpha LPs and the homepage have `StickyMobileCta`; this page does not. A user who scrolls past the hero on mobile has no persistent CTA until they reach the form section at the bottom.

**What to verify on preview (mobile emulation, 390×844):**
- Load `/restaurant-pos-comparison`
- Scroll past the hero section
- Observe: is there a sticky green "Book a Free Demo" bar at the bottom of the screen?
- Report: present or absent

---

### N3 — No DemoBottomSheet on this page

**Source finding:** The comparison page routes all CTAs directly to the `#lp-demo` in-page form via anchor navigation. There is no bottom sheet (modal overlay). All other key pages (homepage, Petpooja, all 5 Alpha LPs, sector pages, contact, etc.) have the bottom sheet.

This is a structural decision gap — the dev team needs the owner to confirm:
- Should this page have the bottom sheet (consistent with all other pages), or is the direct anchor-to-form approach intentional for the comparison page?

**What to verify on preview:**
- Click `[data-testid="comparison-lp-cta-primary"]` after the page has fully loaded
- Observe: does a bottom sheet slide up from the bottom, or does the page scroll to the form section?
- Report: which behaviour occurs, and confirm whether this is the intended UX for this page

---

### N4 — Redirect status

A previous emergency fix (CR-162) redirected `/restaurant-pos-comparison` to `/restaurant-pos-system`. Dev team has confirmed the redirect is **no longer in `redirects.js`** — the page should serve correctly.

**What to verify on preview:**
- Navigate to `/restaurant-pos-comparison`
- Confirm the comparison page loads (not a redirect to `/restaurant-pos-system` or anywhere else)
- Check `window.location.pathname` in console — should be `/restaurant-pos-comparison`
- Report: does the page load correctly or does a redirect occur?

---

## Section 4 — Items owner must decide (not dev actions)

These are not verifiable via browser testing. Flagged for owner:

| # | Question | Why it matters |
|---|----------|----------------|
| Q1 | What are verified starting prices for Posist, GoFrugal, Billberry? | Required to fix B1 |
| Q2 | What is Petpooja's starting price (for title/meta comparison, even if no table column)? | Required for H2 credibility |
| Q3 | Should `/restaurant-pos-comparison` have a DemoBottomSheet (same as all other pages), or is direct anchor-to-form intentional? | Required to close N3 and H4 |
| Q4 | Should `StickyMobileCta` be added to this page? | Required to close N2 |
| Q5 | Which additional competitors (urbanpiper, dotpe, posify, ezee pos) should be added as table columns or excluded from the ad group? | Required before activating paused ad groups |
| Q6 | Real names and restaurants for the two placeholder testimonials (Posist switcher, GoFrugal switcher) | Required to fix B1c/d |

---

## Section 5 — Scope clarifications (do NOT raise these as gaps)

| Item | Clarification |
|------|--------------|
| **H1 — Petpooja column in table** | Not being added. Petpooja has its own page (`/petpooja-alternative`). Adding a Petpooja column to this page would duplicate that page's content. |
| **M1 — Petpooja FAQ entries** | Not needed here for the same reason — the dedicated `/petpooja-alternative` page handles Petpooja-specific FAQs. |
| **H3 — OG/Twitter tags** | OG tags are auto-generated by the `<Seo>` component. They exist and are correct. They will update automatically when H2 (title/meta) is implemented. Not a standalone action item. |
| **Q5 (WhatsApp button)** | The WhatsApp FAB is controlled by `REACT_APP_WHATSAPP_ENABLED=false` in the production build environment variable. It does not appear in production builds. Not a code gap. |

---

## Summary — What to report back

| # | Check | Expected result | Report if different |
|---|-------|----------------|---------------------|
| R1 | CTA element types (navbar, hero, table-footer) | All `<a href="#lp-demo">` | Any `<button>` found |
| R2 | OG/Twitter tags in `<head>` | Present, correct title | Any missing tag |
| R3 | `cta_click` in dataLayer after CTA click | NOT present (gap confirmed) | If it IS present |
| R4 | `sheet_open` in dataLayer | NOT present (gap confirmed) | If it IS present |
| R5 | `[VERIFY]` visible in comparison table | Present (gap confirmed) | Count of occurrences |
| R6 | Table footer disclaimer text | `"[VERIFY] = to be confirmed..."` visible | If cleaned up |
| R7 | Testimonial placeholder names | `[CS Team...]` and `Restaurant Name` visible | If real names present |
| R8 | GoFrugal testimonial price | `₹1,499` in quote | If already corrected |
| R9 | Smooth scroll speed on anchor tap (slow network) | 2–3 second animated scroll | If instant already |
| R10 | Current title tag value | `"...vs Posist, GoFrugal & More"` — no Petpooja | If Petpooja already in title |
| R11 | StickyMobileCta present on mobile scroll | Absent | If sticky bar appears |
| R12 | DemoBottomSheet on CTA click | Absent — page scrolls to form | If sheet opens instead |
| R13 | Redirect behaviour | Page loads at `/restaurant-pos-comparison` | If redirected elsewhere |
| R14 | `cta_click` on homepage (`/`) hero CTA | NOT present | If it IS present |
| R15 | `cta_click` on `/petpooja-alternative` hero CTA | NOT present | If it IS present |

---

*Brief prepared by dev team, 15 Sep 2026. Preview URL: https://app-preview-live-16.preview.emergentagent.com*
