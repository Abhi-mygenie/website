# CR-87 — /demo Page: Competitor-Focused Reframe + Trust Fixes

**Type:** Conversion Optimisation / Trust Signal Fix / Copy  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** INTAKE COMPLETE — DESIGN APPROVED 2026-08-21  
**Priority:** HIGH  
**Plan ID:** H9  
**Effort:** ~1.5 hrs  
**Improves:** Conv · Trust · QS LP Experience · Competitor traffic relevance  
**Scope:** `frontend/src/pages/DemoLanding.jsx`  
**Related:** CR-73 (same footer fix on /petpooja-alternative), CR-76 (same logo fix)

---

## Page Purpose (Updated 2026-08-21)

**Original purpose:** Cold Meta/Google ad traffic — discovery stage ("I haven't heard of MyGenie")  
**Owner decision (2026-08-21):** Reposition as **competitor comparison page** — consideration stage ("I'm using GoFrugal/UrbanPiper, is MyGenie better?")

This is a 4-tweak copy adaptation + 3 code fixes. Same template, same form, reframed for "comparing alternatives" mindset.

---

## Change 1 — H1: Generic → Comparison-Intent

| | |
|---|---|
| **Current** | "See MyGenie live — built for your restaurant" |
| **New** | "Compare MyGenie With Your Current POS" |
| **Why** | Comparison shoppers know they want a demo — they're asking "is MyGenie better than what I have?" |
| **File / field** | `DemoLanding.jsx` line 49: `DEMO_DEFAULTS.headline` |

---

## Change 2 — Stat reframe: setup speed → switching speed

| Stat | Current label | New label |
|---|---|---|
| ₹1L+ | "leakage caught in 2 weeks" | ✅ Keep |
| 48hr | **"from sign-up to first bill"** | **"to switch from your current POS"** |
| +18% | "avg bill via AI upsell" | ✅ Keep |

**Why:** Comparison shopper cares about switching cost, not setup time. "48hr to switch" directly addresses migration anxiety.  
**File / field:** `DemoLanding.jsx` line 94: `ProofCard value="48hr" label="..."`

---

## Change 3 — Add 5th walkthrough bullet: Side-by-side comparison

**Current 4 bullets:**
1. Live billing demo
2. Your leakage report
3. AI features live
4. Your pricing

**Add as 5th bullet:**
- **Title:** "Side-by-side comparison"
- **Desc:** "We show you exactly how MyGenie stacks up against your current setup, feature by feature."
- **Why:** Directly addresses comparison-shopper mindset without naming any specific competitor.
- **File / field:** `DemoLanding.jsx` lines 109–113 — add 5th array item

---

## Change 4 — Trust line: "already on" → "switched to"

| | |
|---|---|
| **Current** | "100s of outlets across 75 cities already on MyGenie" |
| **New** | "100s of restaurants switched to MyGenie across 75 cities" |
| **Why** | "switched to" implies they came FROM somewhere — resonates with comparison shoppers |
| **File / field** | `DemoForm.jsx` line 380: `sector === "meta-demo"` conditional trust text |

---

## Change 5 — Form: 6 fields → 4 fields (shortForm)

| | |
|---|---|
| **Current** | `<DemoForm sector="meta-demo" />` — 5 fields (meta-demo hides city only) |
| **New** | `<DemoForm sector="meta-demo" shortForm />` — 4 fields (name, phone, email required + business name optional) |
| **File** | `DemoLanding.jsx` line 131 |

---

## Change 6 — Trust logos: text chips → images (same as CR-76)

| | |
|---|---|
| **Current** | `TRUST_NAMES` array rendered as `<span>` text chips |
| **New** | Real logo images (same grayscale → colour on hover treatment as /petpooja-alternative) |
| **Note** | "Aanya's Kitchen" — check if logo exists in `/brand/`. Others (Hyatt Centric, Palm Forest, Love Bites, Mill Bakery) confirmed ✅ |
| **File** | `DemoLanding.jsx` lines 44 + 140–148 |

---

## Change 7 — Footer: add phone + email + Privacy Policy (same as CR-73)

| | |
|---|---|
| **Current** | Logo + copyright only |
| **New** | Logo + phone + email + Privacy Policy link + copyright |
| **File** | `DemoLanding.jsx` LandingFooter function + COMPANY import |

```jsx
// Add import:
import { COMPANY } from "@/data/company";

// Update LandingFooter:
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="demo-landing-footer">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors">{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-brand-yellow transition-colors">{COMPANY.supportEmail}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">&copy; {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}
```

---

## Files Changed

| File | Changes |
|---|---|
| `frontend/src/pages/DemoLanding.jsx` | Changes 1, 2, 3, 4 (copy), 5 (shortForm prop), 6 (logos), 7 (footer + COMPANY import) |
| `frontend/src/components/site/DemoForm.jsx` | Change 4 (trust line text — `sector === "meta-demo"` conditional) |

---

## Definition of Done

- [ ] H1 = "Compare MyGenie With Your Current POS"
- [ ] Stat 2 label = "to switch from your current POS"
- [ ] 5 walkthrough bullets (4 existing + 1 new comparison bullet)
- [ ] Trust line below CTA = "100s of restaurants switched to MyGenie across 75 cities"
- [ ] Form shows 4 fields (name, phone, email, business name optional)
- [ ] Trust strip shows logo images not text chips
- [ ] Footer shows phone + email + Privacy Policy

---

*CR-87 registered 2026-08-20. Scope expanded and redesigned as competitor-focused LP 2026-08-21. Owner brief applied.*

