# CR-113 — Petpooja Page Mobile UX Overhaul: Hero Resize + Navbar CTA + Quick-Book Bottom Sheet

**Type:** Mobile UX / Conversion Rate Optimisation  
**Date Raised:** 2026-08-20  
**Raised By:** Owner review — real device screenshot showed broken above-fold experience  
**Status:** OPEN — INTAKE COMPLETE  
**Priority:** HIGH  
**Plan ID:** H-113  
**Effort:** ~2.5 hrs  
**Improves:** Mobile UX · Conv · QS LP Experience · Above-fold clarity  
**Scope:** `frontend/src/pages/PetpoojaAlternative.jsx` (new local component + navbar + hero)  
**Replaces/supersedes:** CR-112 (Petpooja Short Form 3 Fields) — see Section 7  
**Related:** CR-74 (StickyMobileCta — partial revert, see Section 4), CR-75 (H1 text change)

---

## 1. Problem Statement

Real device screenshot (owner, iPhone, 390px) revealed three broken UX patterns on `/petpooja-alternative`:

### Problem A — H1 occupies the entire above-fold on mobile
The H1 `text-4xl` (36px) with our CR-75 text (82 chars) wraps to **7 lines** on a 390px screen, consuming the full viewport. The CTA "Book a Free Demo" is barely visible. The subtext and stat cards are completely below the fold.

Root causes:
- Font size `text-4xl` was always 36px — pre-existing
- CR-75 made it worse: new text is 82 chars vs old 63 chars; "alternative", "restaurants" don't break cleanly; em dash (—) creates a long unbreakable token

### Problem B — No visual proof above the fold on mobile
The grid is `lg:grid-cols-2`. On mobile, the right column (4 stat cards) stacks **below** the entire left column. A mobile visitor sees only the headline and subtext — no proof numbers, no credibility signals above the fold.

### Problem C — No persistent CTA accessible without scrolling
The only form is buried at the bottom of a long page. CR-74 added a bottom sticky bar, but it uses IntersectionObserver (requires scrolling past the hero to appear). There is no immediately visible booking path from the top of the page.

---

## 2. Solution — Three Changes in One CR

### Change A — Mobile hero resize + stat cards above fold

**H1 font change:**
- Mobile: `text-4xl` → `text-3xl` (36px → 30px)  
- Tablet/Desktop: unchanged (`sm:text-5xl lg:text-[52px]`)  
- One class change on line 76 of `PetpoojaAlternative.jsx`

**Stat cards on mobile:**
Show 2 key stats as a horizontal strip **between H1 and subtext** on mobile only. This gives users an immediate credibility signal without scrolling.
- Show: `₹1L leakage caught` + `40% lower fixed costs` (most impactful pair)
- Only visible on mobile — hidden on `lg+` (stat cards grid still shows on desktop)
- Simple inline markup inside the left column, `lg:hidden`

**Result:** H1 drops from 7 lines to ~5 lines. Two proof stats visible above fold. CTA visible without scrolling.

---

### Change B — Add "Book Demo" CTA to LandingNavbar

**Current LandingNavbar:** logo only.

**After:** logo (left) + "Book Free Demo" button (right side).

```jsx
// AFTER — LandingNavbar
function LandingNavbar({ onQuickBook }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="landing-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <button
          onClick={onQuickBook}
          data-testid="landing-navbar-book-btn"
          className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all"
        >
          Book Free Demo
        </button>
      </div>
    </header>
  );
}
```

`onQuickBook` is a callback passed from the page shell that opens the bottom sheet.

---

### Change C — QuickDemoSheet (bottom sheet mini form)

**What it is:** A new local component inside `PetpoojaAlternative.jsx`. Slides up from the bottom of the screen when the navbar CTA is tapped. Contains a mini form with the agreed field set.

**Why bottom sheet (not slide-down or modal):**
- User is in "should I do this?" mode when tapping Book Demo
- Bottom sheet keeps top ~40% of page visible — user can still see the H1 and proof stats that brought them to this decision
- Native mobile pattern (Zomato, Swiggy, Uber, Google Maps all use it)
- Slide-down panel covers the hero they were just reading
- Full-screen modal removes all decision context

**Field set — owner decision 2026-08-20:**
| Field | Required | Removed from full form? |
|---|---|---|
| Name | ✅ Required | — |
| Phone | ✅ Required | — |
| Email | ✅ Required | — |
| Business name | Optional | — |
| ~~City~~ | ~~Optional~~ | ✅ Removed |
| ~~Years in business~~ | ~~Required~~ | ✅ Removed |
| ~~Outlet type~~ | ~~Optional~~ | ✅ Removed |

**Stage flow:** Reuses existing infrastructure
```
[QuickDemoSheet form] → /api/demo-request → [OTP stage] → [Calendly stage] → [Booked]
```
OtpVerifyBlock and CalendlyInline/popup are reused as-is. The sheet expands through all 3 stages without closing.

**Visual behaviour:**
- Closed: off-screen (transform: translateY(100%))
- Opening: slides up with 300ms ease-out transition
- Height: auto, max-height 90vh, overflow-y scroll
- Handle bar at top (drag indicator — cosmetic only)
- Dark backdrop (bg-black/40) behind the sheet — tapping backdrop closes it (only on form stage; OTP and Calendly stages lock the sheet)
- Sheet does NOT close mid-flow (during OTP or Calendly) — only dismissible before submitting

**Sheet structure:**
```
┌─────────────────────────────────┐
│  ▬  (drag handle)               │
│  Book a Free Demo               │
│  [name input]                   │
│  [phone input]                  │
│  [email input]                  │
│  [business name input optional] │
│  [Submit button]                │
│  No spam. Only to schedule...   │
└─────────────────────────────────┘
```

---

## 3. Change D — Remove StickyMobileCta from PetpoojaAlternative (CR-74 partial revert)

**Owner decision 2026-08-20:** Navbar CTA is the only persistent CTA. Bottom sticky bar removed.

**Revert scope:**
- Remove `StickyMobileCta` import from `PetpoojaAlternative.jsx`
- Remove `<StickyMobileCta ... />` from page shell JSX
- **Keep** the selector fix in `StickyMobileCta.jsx` (CR-74a) — that fix benefits homepage and sector pages; no reason to revert it

**CR-74 status update:** CR-74a (selector fix) ✅ stays. CR-74b (VSP page usage) ❌ reverted by this CR.

---

## 4. Files Changed

| File | Change | CR scope |
|---|---|---|
| `frontend/src/pages/PetpoojaAlternative.jsx` | H1 font class · inline mobile stats · LandingNavbar update · new QuickDemoSheet component · page shell wiring · remove StickyMobileCta | A, B, C, D |
| `frontend/src/components/home/StickyMobileCta.jsx` | **No change** — CR-74a selector fix stays | — |

**New components (local to PetpoojaAlternative.jsx, not exported):**
- `QuickDemoSheet` — bottom sheet container + state machine
- `SheetFormStage` — 4-field mini form
- Stage management reuses `OtpVerifyBlock` + Calendly from DemoForm pattern

**Backend:** No changes. `/api/demo-request` already accepts email as optional, business_name as optional.

---

## 5. Definition of Done

### Change A — Hero
- [ ] H1 on mobile renders in `text-3xl` (inspect DevTools → computed font-size: 30px)
- [ ] H1 takes ≤5 lines on 390px screen
- [ ] 2 stat chips (₹1L + 40%) visible on mobile above the CTA buttons
- [ ] Stat chips hidden on desktop (`lg:hidden` confirmed)
- [ ] Desktop hero layout unchanged

### Change B — Navbar CTA
- [ ] "Book Free Demo" button visible on right side of navbar on all screen sizes
- [ ] Button visible immediately on page load without scrolling
- [ ] Tapping button opens the QuickDemoSheet
- [ ] Button has `data-testid="landing-navbar-book-btn"`

### Change C — Bottom Sheet
- [ ] Sheet slides up from bottom on navbar CTA tap
- [ ] Shows 4 fields: name, phone, email (required), business name (optional, labelled)
- [ ] Submitting form → OTP stage within same sheet
- [ ] OTP verified → Calendly stage within same sheet
- [ ] Calendly booked → confirmation state
- [ ] Backdrop tap dismisses sheet (form stage only)
- [ ] Sheet does NOT dismiss during OTP or Calendly stages
- [ ] Sheet scrollable if content exceeds viewport
- [ ] No regression on main page form (VspCta section) — still works
- [ ] `data-testid="quick-demo-sheet"` on sheet container

### Change D — Sticky bar removal
- [ ] No sticky bar at bottom of `/petpooja-alternative`
- [ ] Homepage sticky bar unaffected
- [ ] Selector fix in `StickyMobileCta.jsx` still in place

---

## 6. What is NOT in this CR

- Main form (VspCta section DemoForm) — unchanged, still has full 6 fields
- Homepage / sector page DemoForm — completely unaffected
- StickyMobileCta on homepage — unaffected
- CR-74a selector fix — kept, not reverted

---

## 7. CR-112 Status Update

CR-112 (Petpooja Short Form 3 Fields via `shortForm` prop on DemoForm) is **superseded** by this CR.

The short form concept is being implemented differently here:
- CR-112 proposed: modify shared DemoForm with `shortForm` prop
- CR-113 implements: a standalone `QuickDemoSheet` component, local to the VSP page, with its own form state and field set

CR-112 can be **closed** once CR-113 is implemented. The `shortForm` prop approach may still be useful for other pages in the future, but it is not needed for the Petpooja page.

---

## 8. Implementation Order (within this CR)

1. Change D (remove StickyMobileCta) — smallest, reduces noise before building
2. Change A (hero resize + mobile stats) — visual, self-contained
3. Change B (LandingNavbar CTA) — needs `onQuickBook` callback from page shell
4. Change C (QuickDemoSheet) — largest change, wired up last

---

## 9. Testing Required

1. Real device or 390px DevTools: above-fold shows H1 (≤5 lines) + 2 stat chips + CTA button visible
2. Tap navbar "Book Free Demo" → bottom sheet slides up
3. Fill name + phone + email → submit → OTP arrives, verify → Calendly opens → book slot → confirmation
4. Tap backdrop before submitting → sheet closes cleanly
5. Homepage: sticky bar still works, form still has 6 fields
6. `/petpooja-alternative` desktop: hero unchanged, no bottom sticky bar (it was mobile-only anyway)

---

*CR-113 registered 2026-08-20. Intake complete. All design decisions locked. Ready for impact analysis and implementation plan on approval.*
