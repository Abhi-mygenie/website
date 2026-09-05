# CR-149 — Create /qsr-pos-system Dedicated Landing Page + Rewrite QSR RSA Headlines

**Type:** New Page / Ad Group LP + RSA Headline Rewrite
**Date Raised:** 2026-08-25
**Updated — impact analysis:** 2026-08-25
**Status:** OPEN
**Priority:** P2 (ad groups dormant — build LP first, then activate spend)
**Ad Groups:** Qsr (IDs: 180565370134, 182827530380, 188441867914) · Beta + Goa Generic Campaigns

---

## 1. Problem Statement

3 QSR ad groups exist across Beta + Goa Generic campaigns but have served **0 impressions in the last 30 days**. Root causes:

1. **Current RSA headlines contain zero "QSR"** — Google cannot score Ad Relevance component of QS. Expected QS 1–3 if traffic starts with current headlines.
2. **Final URLs pointing to homepage** — no dedicated LP exists.
3. **Exact-match QSR terms have very low search volume in India** — broader match types needed.

**Build the LP and rewrite RSA first, then increase bids.**

**Live keywords (all QS N/A — never served):**
- [qsr pos] [qsr pos system] [qsr pos software] [qsr billing software]
- [qsr software for restaurant] [best pos for qsr] [qsr kitchen management]

---

## 2. RSA Headline Rewrite

**Current headlines (to replace):**
Smart POS for Restaurants · Smart Restaurant Billing POS · Top POS for Billing & Orders · Easy POS App For Restaurants · Minimal Training Required · No Need for POS Machine · Up To 25% Boost in Profits · Real-time Restaurant Reports · {KeyWord:Starting at ₹4,000}

**Replacement headlines:**
POS System for QSR · Best QSR POS Software · QSR Billing & KDS Software · Fast Counter Billing for QSR · Quick Service Restaurant POS · No Need for Hardware POS · Manage Kitchen Display & Bills · Runs on Any Tablet or Phone · {KeyWord:Starting at ₹4,000}

*(At least 3 headlines must contain "QSR" for Ad Relevance scoring)*

**Recommended additional match types (beyond exact):**
- "quick service restaurant software"
- "fast food pos system"
- "burger restaurant billing software"
*(Exact-match QSR terms alone have very low India search volume)*

---

## 3. Page Specification

### SEO
| Field | Value |
|---|---|
| **URL** | `/qsr-pos-system` |
| **Meta Title** | `QSR POS System — Fast Billing for Quick Service Restaurants` |
| **Meta Description** | `Cloud POS built for QSR speed — counter billing, kitchen display, inventory, and reports on any device. GST-ready. Book a free demo.` |
| **H1** | `POS system built for quick service restaurants — fast, accurate, no hardware needed.` |
| **Hero Sub-headline** | `Take counter orders, fire to kitchen display, print bills, and track inventory — all from one app. Built for QSR speed.` |
| **Primary CTA** | `Book a Free QSR Demo →` |
| **Secondary CTA** | `See Pricing ↓` — scrolls to `#lp-pricing` (inline, not `/pricing` link — LP uses LandingNavbar, no exit links) |

### QSR-Specific CTA Copy (all instances)

| Location | Copy |
|---|---|
| Hero primary button | `Book a Free QSR Demo →` |
| DemoForm submit button | `Book a Free QSR Demo →` |
| Demo section H2 | `See the QSR POS live — book a free demo for your outlet` |
| Bottom CTA section | `Book a Free QSR Demo →` |

**Why explicit:** The existing `SectorPage` renders `Book a {s.name} Demo` = "Book a QSR / Fast Food Demo" for the sector slug. The new dedicated LP must hardcode "QSR Demo" — do not use the dynamic sector pattern.

### QSR-Specific Messaging Points
- **Speed is the differentiator:** Counter service, not table service. "Bill in under 10 seconds" not just "easy billing"
- **KDS (Kitchen Display System):** Counter takes order → kitchen sees it instantly → no paper KOT
- **No table assignment:** QSR flow is item → quantity → payment → print (not dine-in table flow)
- **Multi-counter support:** 3–5 billing counters per outlet on one account

### Page Structure (8 sections in order)

1. **Hero** — H1 + sub + CTA + product screenshot (counter billing screen, QSR flow not dine-in)
2. **QSR feature strip** — Counter billing · Kitchen display · Inventory · Multi-counter · GST · Reports
3. **"How it works" — 3 steps** — Take order at counter → Kitchen gets it instantly → Bill printed in seconds
4. **Social proof — QSR outlets** — "100+ QSR outlets" more specific than "500+ restaurants"
5. **Comparison: hardware POS vs MyGenie** — No upfront hardware cost, works on any tablet
6. **Inline Pricing — `id="lp-pricing"`**
   3-card pricing block (keeps visitor on-page — secondary CTA scrolls here):
   - Starter ₹799/mo — 1 outlet, billing + KOT
   - Growth ₹1,499/mo ⭐ MOST POPULAR — 1 outlet, full suite
   - Pro ₹2,499/mo — multi-outlet + reports
   Footer note: "Starting at ₹4,000 (annual) · No hardware required · Cancel anytime"
   *(matches {KeyWord:Starting at ₹4,000} RSA keyword insertion)*

7. **FAQ** — Fast food/burger chains? Multiple counters? KDS feature? GST compliant?

8. **CTA footer** — `"Book a Free QSR Demo →"` — Set up in 1 day

### Page structure
- `LandingNavbar` (logo-only)
- `LandingFooter` with phone + privacy link

---

## 4. Files to Create/Change

| File | Change |
|---|---|
| `frontend/src/pages/QsrPosSystem.jsx` | New page (create) — reuse component pattern from /restaurant-pos-system with QSR framing |
| `frontend/src/App.js` | Add lazy import + route `/qsr-pos-system` |
| `frontend/public/sitemap.xml` | Add URL entry (priority 0.8) |

---

## 5. Google Ads Actions Required (not dev)

- **ADS:** Rewrite RSA headlines in all 3 QSR ad groups — add at least 3 with "QSR"
- **ADS:** Update Final URL → `/qsr-pos-system` once LP is live
- **ADS:** Add phrase/BMM match types: "quick service restaurant software", "fast food pos system"

---

## 6. Definition of Done

- [ ] `/qsr-pos-system` renders on desktop + mobile
- [ ] H1 contains "quick service restaurant" and "POS system"
- [ ] Meta title contains "QSR POS System"
- [ ] "QSR" appears in H1, first paragraph, section headings
- [ ] DemoForm submits leads with sector="qsr"
- [ ] DemoForm submit button reads `"Book a Free QSR Demo →"` (not generic "Book a Free Demo")
- [ ] Primary CTA in hero reads `"Book a Free QSR Demo →"`
- [ ] Demo section H2 reads `"See the QSR POS live — book a free demo for your outlet"`
- [ ] Secondary CTA scrolls to `#lp-pricing` (not a `/pricing` link)
- [ ] `id="lp-pricing"` pricing section present with 3 tiers
- [ ] RSA headlines updated in all 3 ad groups (at least 3 with "QSR")
- [ ] URL in sitemap + prerendered

---

---

## 7. Impact Analysis — 2026-08-25

### Change A — Primary CTA: "Book a Free Demo →" → "Book a Free QSR Demo →"

**Why:** Three reasons for keyword-specific CTA copy:
1. **Ad Relevance:** QSR RSA headlines include "POS System for QSR", "QSR Billing & KDS Software" — the LP CTA that echoes "QSR" reinforces Google's Ad Relevance score
2. **Conversion psychology:** "QSR Demo" tells the visitor the demo is purpose-built for their format (counter service, not dine-in table service) — reduces "is this the right product for me?" friction
3. **Differentiation from generic LP:** Distinguishes this LP from CR-86/85/148 which use "POS Demo" / "Management Demo" / "Billing Demo" — each LP now has a unique CTA that matches its keyword cluster

**Applies to 4 locations on page:** hero button, DemoForm submit, demo section H2, footer CTA.

### Change B — Pricing section: integrated as Section 6 (replaces standalone "Pricing block")

**Why:** The original spec had "Pricing block — Starting at ₹4,000/month" as Section 6. This is kept but given a proper `id="lp-pricing"` anchor so the secondary CTA can scroll to it. The content matches the `{KeyWord:Starting at ₹4,000}` RSA keyword insertion — LP and ad now quote the same entry price.

### Change C — Secondary CTA: off-page link → scroll anchor

| Before | After |
|---|---|
| `<Link to="/pricing">See Pricing</Link>` | `<a href="#lp-pricing">See Pricing ↓</a>` |

*CR-149 registered 2026-08-25. Impact analysis added 2026-08-25.*
