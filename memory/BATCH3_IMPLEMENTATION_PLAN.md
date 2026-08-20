# Batch 3 — Final Line-by-Line Implementation Plan
**CRs:** CR-73 · CR-74 · CR-75 · CR-76 · CR-111  
**Plan written:** 2026-08-20 — Planning Agent  
**Design approved:** 2026-08-20 (Option A footer, same sticky bar, greyscale logos)  
**Status:** APPROVED FOR IMPLEMENTATION  
**Files touched:** 3 (`PetpoojaAlternative.jsx`, `vsp.js`, `StickyMobileCta.jsx`)  
**Estimated time:** ~1.5 hrs  
**Execution order:** Step 1 → 2 → 3 → 4 → 5 → 6 → 7 (mandatory — see notes per step)

---

## Pre-flight Checklist

- [ ] Both services running: `sudo supervisorctl status`
- [ ] Open `/petpooja-alternative` in browser — note current state as baseline
- [ ] Confirm homepage sticky bar works on mobile (scroll past hero — bar should appear)
- [ ] Confirm homepage form still shows 6 fields (CR-112 deferred — must not regress)

---

## STEP 1 — CR-111 — Meta Title  
**File:** `frontend/src/pages/PetpoojaAlternative.jsx`  
**Line:** 662  
**Effort:** 2 min

**Before (exact):**
```jsx
        title="MyGenie vs Petpooja — The honest POS comparison | MyGenie"
```

**After:**
```jsx
        title="Best Petpooja Alternative for Restaurants — MyGenie POS"
```

**Why first:** Smallest change, same file, zero risk. Gets it out of the way.

**Checkpoint:**
- Hot-reload fires immediately
- View page source in browser → `<title>` tag reads `Best Petpooja Alternative for Restaurants — MyGenie POS`
- Meta description unchanged (line 663)

**Rollback:** Revert the title string to `"MyGenie vs Petpooja — The honest POS comparison | MyGenie"`

---

## STEP 2 — CR-75 — H1 Keyword  
**File:** `frontend/src/data/vsp.js`  
**Line:** 7  
**Effort:** 2 min

**Before (exact, line 7):**
```js
  variant_a: "We get compared to Petpooja every week. Here's the honest answer.",
```

**After:**
```js
  variant_a: "The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie.",
```

**Why after Step 1:** Same file group (both are content changes). Get all text changes done before touching components.

**Important — CMS override note:** `variant_a` in vsp.js is the *fallback* value. `EditableText id="vsp.hero.variant_a"` first checks MongoDB CMS for a stored override. On production, the CMS has no override set — vsp.js value takes effect immediately. In preview, same (no CMS override for this key confirmed in planning session).

**Checkpoint:**
- Hot-reload fires immediately
- `/petpooja-alternative` hero H1 reads: *"The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie."*
- `data-testid="vsp-hero-headline"` element — confirm text in browser DevTools

**Rollback:** Revert `variant_a` to original string.

---

## STEP 3 — CR-76 — VSP_TRUST_LOGOS: string array → object array  
**File:** `frontend/src/data/vsp.js`  
**Lines:** 132–136  
**Effort:** 5 min

**Before (exact, lines 132–136):**
```js
export const VSP_TRUST_LOGOS = [
  "Hyatt Centric", "Palm Forest Resort", "Love Bites",
  "The Mill Bakery", "Bamboo Yoga", "Ubuntu Café",
  "Terraria Café", "La Fetta Pizzeria",
];
```

**After:**
```js
export const VSP_TRUST_LOGOS = [
  { name: "Hyatt Centric",      img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest Resort", img: "/brand/palm-forest.png"   },
  { name: "Love Bites",         img: "/brand/love-bites.png"    },
  { name: "The Mill Bakery",    img: "/brand/mill-bakery.png"   },
  { name: "Bamboo Yoga",        img: "/brand/bamboo-yoga.png"   },
  { name: "Ubuntu Café",        img: "/brand/ubuntu.png"        },
  { name: "Terraria Café",      img: "/brand/terra.png"         },
  { name: "La Fetta Pizzeria",  img: "/brand/lafetta.png"       },
];
```

**Why Step 3 before Step 4:** The VspCta component (Step 4) consumes `VSP_TRUST_LOGOS`. Data shape must be updated before the component renders it, otherwise Step 4 would break the build. Step 3 alone will also break VspCta momentarily (accessing `.name` on a string) — Steps 3 and 4 must be done in the same save-cycle or in immediate succession. Hot-reload may briefly show an error between Step 3 and Step 4 — this is expected and resolves after Step 4.

**All 8 image files confirmed present in `/public/brand/`:**
- `hyatt-centric.png` ✅ `palm-forest.png` ✅ `love-bites.png` ✅ `mill-bakery.png` ✅
- `bamboo-yoga.png` ✅ `ubuntu.png` ✅ `terra.png` ✅ `lafetta.png` ✅

**Checkpoint (after Step 4):** Do not checkpoint Step 3 alone — see Step 4.

**Rollback:** Revert to original string array. Must also revert Step 4 simultaneously.

---

## STEP 4 — CR-76 — VspCta logo strip render + VspHero trust strip  
**File:** `frontend/src/pages/PetpoojaAlternative.jsx`  
**Lines:** 627–632 (VspCta strip) and 108–112 (VspHero trust strip)  
**Effort:** 10 min

### 4a — VspCta logo strip (lines 627–632)

**Before (exact):**
```jsx
                <div className="flex flex-wrap gap-2">
                  {VSP_TRUST_LOGOS.map((name) => (
                    <span key={name} className="bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#a3b8ac]">
                      {name}
                    </span>
                  ))}
                </div>
```

**After:**
```jsx
                <div className="flex flex-wrap gap-3 items-center">
                  {VSP_TRUST_LOGOS.map((logo) => (
                    <img
                      key={logo.name}
                      src={logo.img}
                      alt={logo.name}
                      title={logo.name}
                      className="h-7 w-auto object-contain opacity-50 hover:opacity-90 transition-opacity"
                      loading="lazy"
                      width={100}
                      height={28}
                    />
                  ))}
                </div>
```

### 4b — VspHero trust strip (lines 108–112)

**Before (exact):**
```jsx
              {["Hyatt Centric", "Palm Forest Resort", "Love Bites", "The Mill Bakery"].map((name) => (
                <span key={name} className="bg-white border border-brand-line rounded-lg px-3 py-1 text-xs font-semibold text-brand-ink">
                  {name}
                </span>
              ))}
```

**After:**
```jsx
              {VSP_TRUST_LOGOS.slice(0, 4).map((logo) => (
                <img
                  key={logo.name}
                  src={logo.img}
                  alt={logo.name}
                  title={logo.name}
                  className="h-8 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
                  loading="lazy"
                  width={120}
                  height={32}
                />
              ))}
```

**Note on 4b:** The hero strip was previously a hardcoded 4-item array. After Step 3 converts `VSP_TRUST_LOGOS` to objects, `slice(0, 4)` gives the same first 4 logos (Hyatt Centric, Palm Forest Resort, Love Bites, The Mill Bakery) — eliminating the duplication between the two strips. This is the approach documented in the Batch 3 handover (Finding B3-10).

**Checkpoint after Steps 3+4:**
- Hot-reload fires immediately
- VspHero trust strip: 4 logo images displayed (grayscale, colour on hover)
- VspCta logo strip: 8 logo images displayed (semi-transparent, brighter on hover)
- No broken image icons — all 8 files confirmed present
- No console errors about `.name` of undefined (confirms Step 3 data shape is correct)
- `data-testid="vsp-trust-strip"` shows images not text chips

**Rollback:** Revert both 4a and 4b, AND revert Step 3 (data shape) simultaneously.

---

## STEP 5 — CR-73 — LandingFooter: add phone + email + privacy  
**File:** `frontend/src/pages/PetpoojaAlternative.jsx`  
**Lines:** 1 (imports) and 29–38 (LandingFooter function)  
**Effort:** 10 min

### 5a — Add COMPANY import (line 1, after existing imports)

**Before (line 15, last import block):**
```jsx
import {
  VSP_HERO, VSP_STATS, VSP_QUOTES, VSP_AI,
  VSP_COMP_LEAN, VSP_COMP_FULL, VSP_TRUST_LOGOS,
  VSP_SWITCH_BADGES,
} from "@/data/vsp";
```

**After (add one line immediately below, line 16):**
```jsx
import {
  VSP_HERO, VSP_STATS, VSP_QUOTES, VSP_AI,
  VSP_COMP_LEAN, VSP_COMP_FULL, VSP_TRUST_LOGOS,
  VSP_SWITCH_BADGES,
} from "@/data/vsp";
import { COMPANY } from "@/data/company";
```

**Note:** `Link` is already imported at line 3 (`import { Link } from "react-router-dom"`) — no additional import needed for the Privacy Policy link.

### 5b — Replace LandingFooter function (lines 29–38)

**Before (exact, lines 28–38):**
```jsx
// ─── Minimal landing Footer (logo + copyright — no outbound links) ────────────
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Logo light />
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd. All rights reserved.</span>
      </div>
    </footer>
  );
}
```

**After:**
```jsx
// ─── Minimal landing Footer (logo + contact + privacy — Option A, CR-73) ──────
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="landing-footer-phone">{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-brand-yellow transition-colors" data-testid="landing-footer-email">{COMPANY.supportEmail}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="landing-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}
```

**What changed:**
- `h-16 flex items-center` → `py-4 flex flex-col sm:flex-row items-center` — taller on mobile to fit 3 rows
- Added middle column: phone (tel: link) + email (mailto: link) + Privacy Policy (router Link)
- `COMPANY.phone` → `9104743156` | `COMPANY.supportEmail` → `customersupport@mygenie.online`
- Copyright shortened slightly (removed "All rights reserved" — too long on one line)
- All new elements have `data-testid` for testing

**Checkpoint:**
- Scroll to bottom of `/petpooja-alternative`
- Footer shows: logo | 9104743156 · customersupport@mygenie.online · Privacy Policy | © 2026
- On mobile: stacks into 3 rows (logo top, contacts middle, copyright bottom)
- Phone link opens dialler, email opens mail client, Privacy Policy navigates to `/privacy`
- No navigation links to other site sections (intentional — ad LP restriction)

**Rollback:** Revert LandingFooter function to original + remove COMPANY import.

---

## STEP 6 — CR-74a — Fix StickyMobileCta hero selector  
**File:** `frontend/src/components/home/StickyMobileCta.jsx`  
**Line:** 37  
**Effort:** 5 min

**Before (exact, line 37):**
```js
    heroRef.current = document.querySelector('[data-testid="hero"]');
```

**After:**
```js
    heroRef.current =
      document.querySelector('[data-testid="hero"]') ||
      document.querySelector('[data-testid="vsp-hero"]') ||
      document.querySelector('[data-testid="sector-hero"]') ||
      document.querySelector('[data-testid="product-hero"]');
```

**Why this order:** Homepage (`"hero"`) is checked first — most common path, no performance cost. Remaining testids cover VSP page, sector pages, product pages.

**Regression check:** Homepage uses `data-testid="hero"` (Hero.jsx line 8 — confirmed). The first selector still matches on homepage — zero behaviour change on homepage.

**Checkpoint (on homepage, mobile):**
- Scroll down past hero → sticky bar still appears ✅ (confirms homepage regression-free)
- Do NOT test on `/petpooja-alternative` yet — Step 7 adds the component to that page

**Rollback:** Revert line 37 to single `document.querySelector('[data-testid="hero"]')`.

---

## STEP 7 — CR-74b — Add StickyMobileCta to PetpoojaAlternative  
**File:** `frontend/src/pages/PetpoojaAlternative.jsx`  
**Lines:** 1 (import) and 675 (usage in page shell)  
**Effort:** 5 min

### 7a — Add import

**Before (line 1):**
```jsx
import { useState } from "react";
```

**After:**
```jsx
import { useState } from "react";
import StickyMobileCta from "@/components/home/StickyMobileCta";
```

### 7b — Add component to page shell

**Before (lines 674–676):**
```jsx
      </main>
      <LandingFooter />
    </div>
```

**After:**
```jsx
      </main>
      <LandingFooter />
      <StickyMobileCta onDemo={() => document.getElementById("vsp-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
    </div>
```

**Why after LandingFooter:** The sticky bar is `position: fixed` — DOM order doesn't affect visual position. Placed after footer by convention (same pattern as homepage). The `onDemo` handler scrolls to `id="vsp-demo"` (line 640 of PetpoojaAlternative.jsx — confirmed present).

**Checkpoint (mobile viewport — 390px wide):**
- Load `/petpooja-alternative`
- Scroll down past the hero section (`data-testid="vsp-hero"`)
- Sticky bar slides up from bottom: dark green background, "Book a Free Demo →" button, ✕ dismiss
- Tap button → page scrolls smoothly to the demo form
- Tap ✕ → bar dismisses and does not reappear in same session
- Consent banner showing → bar sits 48px above bottom (not overlapping banner)
- Desktop (≥1024px) → bar invisible (`lg:hidden` class)

**Rollback:** Remove StickyMobileCta import + remove from page shell JSX.

---

## Post-Implementation Validation Checklist

### CR-111 — Meta title
- [ ] `<title>` tag = `Best Petpooja Alternative for Restaurants — MyGenie POS`
- [ ] Under 60 characters ✅ (57 chars)
- [ ] Meta description unchanged

### CR-75 — H1
- [ ] H1 on `/petpooja-alternative` reads: *"The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie."*
- [ ] `data-testid="vsp-hero-headline"` — confirm in DevTools Elements

### CR-76 — Trust logos
- [ ] Hero trust strip: 4 logo images (grayscale default, colour on hover)
- [ ] CTA logo strip: 8 logo images (semi-transparent default, brighter on hover)
- [ ] No broken image icons
- [ ] No text chips visible anywhere on the page
- [ ] Mobile layout wraps without overflow

### CR-73 — Footer
- [ ] Footer shows phone: `9104743156`
- [ ] Footer shows email: `customersupport@mygenie.online`
- [ ] Footer shows Privacy Policy link
- [ ] Phone link uses `tel:` protocol
- [ ] Privacy Policy navigates to `/privacy` (React Router — no full page reload)
- [ ] Mobile layout: stacks vertically, no overflow

### CR-74 — Sticky CTA
- [ ] Bar absent on desktop (≥1024px)
- [ ] Bar appears on mobile after scrolling past `data-testid="vsp-hero"`
- [ ] Tap button scrolls to demo form
- [ ] ✕ dismisses bar
- [ ] Homepage sticky bar regression-free (still works on homepage mobile)

---

## Execution Summary Table

| Step | CR | File | Lines | Hot-reload? | Reversible? |
|---|---|---|---|---|---|
| 1 | CR-111 | `PetpoojaAlternative.jsx` | 662 | ✅ | ✅ |
| 2 | CR-75 | `vsp.js` | 7 | ✅ | ✅ |
| 3 | CR-76 | `vsp.js` | 132–136 | ✅ (brief error until Step 4) | ✅ (with Step 4) |
| 4a | CR-76 | `PetpoojaAlternative.jsx` | 627–632 | ✅ | ✅ (with Step 3) |
| 4b | CR-76 | `PetpoojaAlternative.jsx` | 108–112 | ✅ | ✅ (with Step 3) |
| 5a | CR-73 | `PetpoojaAlternative.jsx` | import block | ✅ | ✅ |
| 5b | CR-73 | `PetpoojaAlternative.jsx` | 29–38 | ✅ | ✅ |
| 6 | CR-74a | `StickyMobileCta.jsx` | 37 | ✅ | ✅ |
| 7a | CR-74b | `PetpoojaAlternative.jsx` | import line 1 | ✅ | ✅ |
| 7b | CR-74b | `PetpoojaAlternative.jsx` | 674–676 | ✅ | ✅ |

**Mandatory order constraints:**
- Step 3 must come before Step 4 (data shape before component render)
- Step 6 must come before Step 7 (selector fix before component is added to page)
- Steps 1, 2, 5 are independent — can be done in any order relative to each other

---

## Out of Scope (Deferred)

- CR-112: Short form (3 fields) — separate session
- Petpooja H2 keyword improvements — CR to be raised (CR-112 slot taken, will be CR-113)
- Petpooja JSON-LD schema — CR to be raised (CR-114)

---

*Plan written 2026-08-20. Planning Agent. All line numbers verified against live file. Ready for implementation on owner approval.*
