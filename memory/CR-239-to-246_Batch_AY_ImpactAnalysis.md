# Batch AY — Content & Copy Impact Analysis (CR-239 → CR-246)

**Date:** 2026-09-08
**Role:** Planning gate — impact analysis only, no code edits
**Owner answers locked in:** city=75 · go-live=24hr · Petpooja sentence=add back (text TBD) · pricing fix=replace · Swiggy=both · copy proposals=agent suggests

---

## CR-239 — QSR LP Pricing: Replace "Starting at ₹4,000/year"

### Problem
Two hardcoded price strings on `/qsr-pos-system` contradict the pricing table:

| Location | Current text | Why it's wrong |
|---|---|---|
| `QsrPosSystem.jsx` L69 — eyebrow above pricing cards | `"Starting at ₹4,000/year"` | Starter plan = ₹799/mo × 12 = ₹9,588/yr. Lie by ₹5,588. |
| `QsrPosSystem.jsx` L95 — sub-line below pricing cards | `"Starting at ₹4,000/year · No hardware required · Cancel anytime"` | Same lie, repeated. |

### Fix
Replace both with owner-approved text: `"Starting at ₹799/outlet/month · billed annually"`

| Location | Old | New |
|---|---|---|
| L69 | `Starting at ₹4,000/year` | `Starting at ₹799/outlet/month · billed annually` |
| L95 | `Starting at ₹4,000/year · No hardware required · Cancel anytime` | `Starting at ₹799/outlet/month · billed annually · No hardware required · Cancel anytime` |

### Files touched
- `src/pages/QsrPosSystem.jsx` — 2 string replacements

### Risk
None. Pure text replacement. No logic, no routing, no schema change.

---

## CR-244 — QSR LP: Add Swiggy/Zomato Badge + "Fast Food" to Visible Body

### Problem
- **Swiggy/Zomato:** The `<TrustBand />` on this page shows customer logos (restaurants) — **not** aggregator badges. The homepage Hero has inline Swiggy/Zomato badges in a "WORKS WITH" strip. The QSR page has no equivalent. Swiggy/Zomato appear only in a FAQ answer (not visible above fold).
- **Fast food:** The phrase appears only inside JSON-LD structured data and a FAQ answer — zero occurrences in any visible heading or body paragraph. Google Ads ad copy uses "fast food" as a keyword.

### Owner decision: Both (badge + text)

### Proposed fix — two additions to `QsrPosSystem.jsx`

**Part A — Swiggy/Zomato "WORKS WITH" strip in hero** (below CTA buttons, before hero image column):
Replicate the homepage Hero pattern. Add inline trust badges directly below the CTA buttons in the hero left column:

```
WORKS WITH  [Swiggy logo] Swiggy  [Zomato logo] Zomato  [Razorpay logo] Razorpay  GST-ready
```
Uses existing `/brand/integrations/swiggy.svg`, `zomato.svg`, `razorpay.svg` — no new assets needed.

**Part B — "fast food" in visible body** (sub-description paragraph in hero):
Current sub: *"Take counter orders, fire to kitchen display, print bills, and track inventory — all from one app. Built for QSR speed."*

Proposed sub: *"Take counter orders, fire to kitchen display, print bills, and track inventory — all from one app. Built for fast food and quick service restaurant speed."*

One word change: adds "fast food" naturally to an existing sentence.

### Files touched
- `src/pages/QsrPosSystem.jsx` — 1 string edit (hero sub) + 1 JSX block (trust strip ~5 lines)

### Risk
Low. The trust badge strip uses existing SVG assets already in `/public/brand/integrations/`. Same pattern as homepage Hero.jsx L83–99.

### ⚠️ One observation flagged for owner
The QSR page hero already renders `<TrustBand />` immediately below the hero section. TrustBand shows customer logos. Adding a "WORKS WITH" aggregator strip in the hero itself will give the page two types of trust signals close together. This is intentional (aggregators + customer logos are different trust types) — confirming this is the right approach.

---

## CR-242 — `/product/sell-serve`: Add "take orders"/"ordering app" to Captain App Module

### Problem
`products.js` Captain App & Table Management module:
- Current outcome: `"Table and order management in real time — multiple waiters, one table, no clashes."`
- Current caps: `["Real-time order sync", "Works on any phone", "Modifiers & special instructions"]`
- Neither "take orders" nor "ordering app" appears anywhere on this page.
- These are MyGenie's best-converting Google Ads keywords (₹232/lead). Ad-to-page message mismatch.

### Proposed copy (agent's rehash)

**Outcome line** (replaces current):
> "Waiters take orders on any phone using the ordering app — multiple staff, one table, zero clashes."

**Cap change** (replaces "Real-time order sync"):
> "Take orders from table on any phone"

**Result:**
```js
{ icon: "Smartphone", name: "Captain App & Table Management",
  outcome: "Waiters take orders on any phone using the ordering app — multiple staff, one table, zero clashes.",
  caps: ["Take orders from table on any phone", "Works on any device", "Modifiers & special instructions"] }
```

**Keyword count on page after change:** "take orders" = 1 · "ordering app" = 1 · both within a visible module card.

### Files touched
- `src/data/products.js` — `sell-serve.modules[1]` (Captain App entry) — `outcome` + 1 cap string

### Risk
None. Pure data string edit. The `products.js` data feeds `ProductPage.jsx` via props — no JSX changes needed.

---

## CR-243 — `/restaurant-management-software`: Add "take orders" Feature Section

### Problem
Page has no section about ordering. Keyword "apps for restaurants to take orders" is a live Google Ads keyword for this page's ad group. Current structure: Hero → TrustBand → Problem ("running across 4 apps") → Built for India → Pricing → FAQ → Demo.

### Placement
Insert a new feature section between `mgmt-lp-problem` (line ~190) and `mgmt-lp-india` (line ~193).

### Proposed copy (agent's rehash — refined from brief)

```
[Section eyebrow — small caps]
CAPTAIN APP & ORDERING

[H2]
Take orders on any phone — ordering app built in

[Body]
Every waiter's phone becomes an order terminal. The Captain ordering app lets staff take orders tableside,
which fire straight to the kitchen display — no paper KOTs, no shouting across the pass.

[3 feature chips]
  ✓ Take orders from table on any device
  ✓ Orders fire to KDS the moment they're placed
  ✓ Multiple waiters, one table — no double orders
```

### Files touched
- `src/pages/RestaurantManagementSoftware.jsx` — 1 new `<section>` block (~20 lines)

### Risk
Low. New section added between two existing sections. No existing code removed or modified. Section follows same visual pattern as `mgmt-lp-problem` section (bg-white, max-w-7xl, Reveal wrapper).

---

## CR-246 — Petpooja Comparison Table: Dated Footnote

### Petpooja pricing check (verified Sep 8, 2026)
Crawled `petpooja.com/pricing` live today. Findings:

| Claim in our comparison table | Petpooja's live page | Accurate? |
|---|---|---|
| `pp: "✗ Contact us"` for pricing | No INR prices shown anywhere — "Book A Demo" on all plans | ✅ Accurate |
| `pp: "⚠ Terminal ₹15–30k"` for hardware | Page says *"works smoothly with iOS, Windows, and Android laptops, computers, tablets and phones"* — no hardware purchase mentioned | ⚠️ **Potentially outdated** — see flag below |
| Captain ordering app — Growth+ plan | Listed as an Add-on on Core, included on Growth | ✅ Accurate |

### ⚠️ Flag: Terminal row — DECISION LOCKED 2026-09-08

Owner confirmed: Petpooja runs on a **local POS terminal** (hardware). The row concept is accurate. The issue is the **price figure** (`₹15–30k`) may be outdated, not the concept itself.

**Proposed replacement for `vsp.js` row `c3`:**

| Field | Current | Proposed |
|---|---|---|
| `pp` | `"⚠  Terminal ₹15–30k"` | `"⚠  Local POS terminal"` |
| `ppType` | `"warn"` | `"warn"` — unchanged |
| `feature` | `"Runs on any device"` | `"Runs on any device"` — unchanged |
| `sub` | `"No terminal purchase needed"` | `"No terminal purchase needed"` — unchanged |
| `mg` | `"✓  Any device"` | `"✓  Any device"` — unchanged |

**Rationale:** Removes the potentially outdated ₹15–30k price claim. Keeps the accurate differentiation — Petpooja needs dedicated hardware, MyGenie runs on any phone/tablet. The footnote below the table covers the "verify at petpooja.com" disclaimer.

**Additional file:** `src/data/vsp.js` — 1 string edit on row `c3` `pp` field (alongside the footnote addition in `PetpoojaAlternative.jsx`).

### Footnote text (approved — Sep 2026 date verified)
Petpooja pricing checked live on Sep 8, 2026: **no INR prices shown** — all plans say "Book A Demo" (Contact us). Footnote text:
```
Pricing and features based on Petpooja's publicly listed information as of Sep 2026.
Petpooja does not publicly display INR pricing — confirm current plans and pricing directly at petpooja.com.
```

### Placement (confirmed by code inspection)
Directly below the closing dark table card div, inside the `VspPhilosophy` section (`#vsp-comparison`). After the "See full comparison (10 features)" expand button, before the "Real numbers. Named restaurants." metrics section. Styled as `text-xs text-[#5B7A68] mt-3 text-center` — matches the intro line above the table.

### Files touched
- `src/pages/PetpoojaAlternative.jsx` — 1 new `<p>` footnote element
- Possibly `src/data/vsp.js` row `c3` — if owner confirms terminal cost is outdated

### Risk
Low for footnote addition. Medium for `c3` row change — changing a comparison cell could affect the competitive framing. Owner decision required.

---

## CR-240 — Standardise City Count to 75

### Owner decision: 75 cities everywhere

### Current state — full inventory

| File | Line | Current value | Action |
|---|---|---|---|
| `RestaurantManagementSoftware.jsx` | L23 (JSON-LD) | `"75+ Indian cities"` | ✅ Keep (already 75+) |
| `RestaurantManagementSoftware.jsx` | L115 (meta desc) | `"100+ Indian cities"` | ❌ → `"75 Indian cities"` |
| `RestaurantManagementSoftware.jsx` | L204 (body) | `"75 Indian cities"` | ✅ Keep |
| `RestaurantManagementSoftware.jsx` | L107 (FAQ answer) | `"75+ Indian cities"` | ✅ Keep (already 75+) |
| `PetpoojaAlternative.jsx` | L471 | `"75 cities in India"` | ✅ Keep |
| `DemoLanding.jsx` | L166 | `"75 cities"` | ✅ Keep |
| `DemoForm.jsx` | L372 | `"75 cities"` | ✅ Keep |
| `RestaurantPosComparison.jsx` | L152 | `"100+ cities across India"` | ❌ → `"75 cities across India"` |
| `RestaurantPosComparison.jsx` | L163 | `{ val: "100+", label: "cities across India" }` | ❌ → `{ val: "75", label: "cities across India" }` |
| `RestaurantPosComparison.jsx` | L241 | `{ val: "100+", label: "Cities" }` | ❌ → `{ val: "75", label: "Cities" }` |

**Total changes: 4 string replacements across 2 files.**

### Files touched
- `src/pages/RestaurantManagementSoftware.jsx` — 1 edit (L115 meta desc)
- `src/pages/RestaurantPosComparison.jsx` — 3 edits (L152, L163, L241)

### Risk
None. Pure string replacements.

---

## CR-241 — Standardise Go-Live Time to 24hr

### Owner decision: 24hr everywhere

### Current state — full inventory

| File | Line | Current value | Type | Action |
|---|---|---|---|---|
| `vsp.js` | L128 `c6` | `"✓ 24 hours"` | Comparison table | ✅ Already 24hr |
| `vsp.js` | L150 | `"24-hour go-live"` | Feature chip | ✅ Already 24hr |
| `PetpoojaAlternative.jsx` | L480 | `{ val: "24hrs", label: "from sign-up to first bill" }` | Stat card | ✅ Already 24hr |
| `PetpoojaAlternative.jsx` | L34 (JSON-LD FAQ) | `"Setup takes under 24 hours"` | FAQ schema | ✅ Already 24hr |
| `PetpoojaAlternative.jsx` | L1049 (FAQ) | `"Setup takes under 24 hours"` | FAQ body | ✅ Already 24hr |
| `PetpoojaAlternative.jsx` | L1050 (FAQ) | `"in under 48 hours"` | Migration FAQ | ✅ **Keep as 48hr** — this is migration time, not go-live time. Different claim. |
| `About.jsx` | L94 | `"go live in under 48 hours"` | Feature list | ❌ → `"go live in under 24 hours"` |
| `RestaurantPosComparison.jsx` | L45 | `"48 hours"` (Switch Timeline) | Comparison table | ❌ → `"24 hours"` |
| `RestaurantPosComparison.jsx` | L161 | `{ val: "48 hrs", label: "from sign-up to first bill" }` | Stat card | ❌ → `{ val: "24 hrs", ... }` |
| `RestaurantPosComparison.jsx` | L17 (JSON-LD FAQ) | `"go-live in 48 hours"` | FAQ schema | ❌ → `"go-live in 24 hours"` |
| `RestaurantPosComparison.jsx` | L72 (FAQ) | `"48-hour go-live"` | FAQ body | ❌ → `"24-hour go-live"` |
| `RestaurantPosComparison.jsx` | L121 (meta desc) | `"go live in 48 hrs"` | Meta desc | ❌ → `"go live in 24 hrs"` |
| `RestaurantPosSystem.jsx` | L115 (FAQ) | `"within 48 hours"` | FAQ body | ❌ → `"within 24 hours"` |
| `Resources.jsx` | L24 | `"under 48 hours"` | FAQ body | ❌ → `"under 24 hours"` |
| `CloudKitchenPos.jsx` | L118 | `"within 48 hours"` | FAQ body | ❌ → `"within 24 hours"` |
| `sectors.js` | L47 | `"Go live in under 48 hours"` | Feature desc | ❌ → `"Go live in under 24 hours"` |
| `sectors.js` | L54 | `"live in 48 hours"` | Testimonial quote | ⚠️ **See flag below** |
| `sectors.js` | L58 | `"under 48 hours"` | FAQ answer | ❌ → `"under 24 hours"` |
| `sectors.js` | L316 | `"live in 48 hours"` | Testimonial quote | ⚠️ **See flag below** |
| `stories.js` | L10 | `"live in under 48 hours"` | Customer quote | ⚠️ **See flag below** |

### ⚠️ Flag: Customer testimonial quotes — DECISION LOCKED 2026-09-08

Owner confirmed: **Replace all 48hr with 24hr — including testimonial instances.**

All 3 Matryyoshka Café instances updated to 24hr:
- `sectors.js` L54: `"live in under 48 hours"` → `"live in under 24 hours"`
- `sectors.js` L316: same → same fix
- `stories.js` L10: `"live in under 48 hours"` → `"live in under 24 hours"`

**Total changes: 14 string replacements across 7 files** (11 non-quote + 3 testimonial).

**Files touched (complete list):**
- `src/pages/About.jsx` — 1 edit
- `src/pages/RestaurantPosComparison.jsx` — 5 edits
- `src/pages/RestaurantPosSystem.jsx` — 1 edit
- `src/pages/Resources.jsx` — 1 edit
- `src/pages/CloudKitchenPos.jsx` — 1 edit
- `src/data/sectors.js` — 4 edits (2 non-quote + 2 testimonial)
- `src/data/stories.js` — 1 edit (testimonial)

### Files touched (changes only)
- `src/pages/About.jsx` — 1 edit
- `src/pages/RestaurantPosComparison.jsx` — 5 edits
- `src/pages/RestaurantPosSystem.jsx` — 1 edit
- `src/pages/Resources.jsx` — 1 edit
- `src/pages/CloudKitchenPos.jsx` — 1 edit
- `src/data/sectors.js` — 2 edits (non-quote instances only)

### Risk
Low for non-quote instances. The 3 testimonial quotes are flagged — leave at 48hr pending owner confirmation.

---

## CR-245 — Petpooja Hero: "1.5 Lakh" Sentence

### Status: ✅ COPY APPROVED — Option A

Owner confirmed Option A on 2026-09-08.

### Approved copy
> *"Petpooja runs 1.5 lakh restaurants. It's earned that. But billing software and a restaurant operating system are different things — here's what changes when billing, inventory, customers and AI all run in one connected system."*

### Placement
This replaces `VSP_HERO.variant_a_sub` in `vsp.js` (line 9–10). The page renders `variant_a_sub` by default (confirmed at `PetpoojaAlternative.jsx` L396).

**Current value:**
```js
variant_a_sub:
  "Billing software and a restaurant operating system are different things. Here's what changes when billing, inventory, expenses, customers and AI all run in one connected system.",
```

**New value:**
```js
variant_a_sub:
  "Petpooja runs 1.5 lakh restaurants. It's earned that. But billing software and a restaurant operating system are different things — here's what changes when billing, inventory, customers and AI all run in one connected system.",
```

Note: "expenses" removed from the list (tightened per Option A). "customers" retained. Dash connector used to improve flow.

### Files touched
- `src/data/vsp.js` — `VSP_HERO.variant_a_sub` string replacement

### Risk
None — pure copy string replacement in a data file.

---

## Full Batch Summary — All Decisions Locked ✅

| CR | File(s) | Changes | Status |
|---|---|---|---|
| CR-239 | `QsrPosSystem.jsx` | 2 string replacements (pricing) | ✅ Ready |
| CR-240 | `RestaurantManagementSoftware.jsx`, `RestaurantPosComparison.jsx` | 4 string replacements (city=75) | ✅ Ready |
| CR-241 | `About.jsx`, `RestaurantPosComparison.jsx`, `RestaurantPosSystem.jsx`, `Resources.jsx`, `CloudKitchenPos.jsx`, `sectors.js`, `stories.js` | 14 string replacements (go-live=24hr everywhere incl. testimonial) | ✅ Ready |
| CR-242 | `products.js` | 2 string edits (outcome + 1 cap) | ✅ Ready |
| CR-243 | `RestaurantManagementSoftware.jsx` | 1 new `<section>` block | ✅ Ready |
| CR-244 | `QsrPosSystem.jsx` | 1 string edit (sub) + 1 new JSX trust strip | ✅ Ready |
| CR-245 | `vsp.js` | 1 string replacement (`variant_a_sub` — Option A) | ✅ Ready |
| CR-246 | `PetpoojaAlternative.jsx`, `vsp.js` | 1 new `<p>` footnote + 1 row `c3` string edit | ✅ Ready |

### Totals
- **9 files touched**
- **~25 edits** (string replacements + 1 new section + 1 new footnote + 1 JSX trust strip)
- **1 rebuild** (yarn build)

### No remaining flags. Gate cleared. Ready for line-by-line plan.

*All decisions finalised 2026-09-08.*
