# CR-11 — Plan differentiation: per-plan icons + feature-GIF showcase

> Intake: 2026-06-19. Source: owner feedback on the Pricing page — help customers SEE how plans
> differ and that higher-tier features matter (conversion/upsell lever). Bundled with a small
> add-on-behavior fix (Part A) that came from the same pricing review.

---

## Part A — Add-on attach/detach on plan change (LOCKED, ready to build)
Owner answers: **1a + 2a + 3b**.
- **On every plan switch → reset manual add-on picks** (`setSelectedAddons([])`). The new plan's
  `includedAddons` auto-attach (derived → shown "Included / ₹0"). Fixes "phantom paid add-on after switching".
- **Keep a default plan** selected on load (Pro). The existing default Loyalty+Wallet pick stays harmless
  (it's included in Pro; cleared on first switch).
- **Files:** `pages/Pricing.jsx` — add `selectPlan(id) = { setSelectedPlanId(id); setSelectedAddons([]); }`,
  wire to `PlanCard onSelect` + the upsell "switch" button. Quiz "Recommend" unchanged (sets plan+addons together).
- **Edge:** accepting an upsell also clears manual picks — absorbed add-ons become included (free) anyway, cart stays correct.
- **Effort:** ~3 lines. No inputs needed.

---

## Part B — Per-plan icon + feature-GIF showcase (LOCKED scope; GIFs come later)
Owner answers: **1 = per-plan feature GIF** (animated screenshots) · **placement = B (dynamic showcase)** ·
**icons = I pick Lucide (site-consistent)** · **scope = pricing + product/sector** · **4b = build slots with placeholders, owner uploads via CMS later**.

### B1. Per-plan icons
- Add `icon` (Lucide name string) to each entry in `data/pricing.js` `PLANS` — **code-controlled**, rendered with the
  site's existing pattern `import * as Icons; const Icon = Icons[name] || Icons.Box` (same as `AddonCard.jsx`, sectors, products).
- Proposed icons (distinct, on-brand): **Starter → `Store`**, **Growth → `TrendingUp`**, **Pro → `Rocket`**, **Chain → `Building2`**.
  Shown on each `PlanCard` (top) + in the showcase header. Color-coded with brand tokens.
- Consistent with CR-6 decision (icons stay code-controlled; the Lucide icon-picker is Phase 3).

### B2. Feature-GIF showcase panel (Option B — dynamic)
- New component `components/pricing/PlanShowcase.jsx`, driven by `selectedPlanId`.
- Shows: selected plan's **icon + name**, a **large feature GIF**, a 1-line caption, and the **delta highlights**
  ("What {plan} adds:" — derived from `plan.includes` / `includedAddons` vs the previous tier).
- **Updates on plan select** with a smooth fade/slide micro-animation (animate opacity/transform only).
- **GIF is CMS-editable per plan:** new keys `plan.<id>.demo_gif` (image) + optional `plan.<id>.demo_caption` (text)
  via `EditableImage`/`EditableText`. GIF uploads through existing CMS media flow (`gif` is in `CMS_ALLOWED_EXT`,
  served `image/gif`). **Placeholder shown until owner uploads** (4b).
- Placement: prominent band near the top of the plan builder (above or beside the plan grid). Mobile: stacks above the cards.

### B3. Reuse on product + sector pages (scope)
- Add a CMS-editable **feature-GIF/image slot** to `ProductPage.jsx` and `SectorPage.jsx` to show feature screens,
  using the same `EditableImage` pattern. Product pages already have a `video` slot — the GIF can sit alongside it
  or reuse the media area. Keys: `product.<bucket>.feature_gif`, `sector.<slug>.feature_gif`. Placeholders until uploaded.
- Build the pricing showcase first (B1+B2), then the product/sector reuse (B3) as a follow-on slice.

### Data / CMS summary
- Code-controlled: `PLANS[].icon` (Lucide names).
- CMS-editable (new keys, placeholder fallback): `plan.<id>.demo_gif`, `plan.<id>.demo_caption`,
  `product.<bucket>.feature_gif`, `sector.<slug>.feature_gif`.
- No business-logic change; recommend/upsell/GST/cart untouched.

### Components touched
- New: `PlanShowcase.jsx`. Edited: `PlanCard.jsx` (icon), `Pricing.jsx` (render showcase + selectPlan from Part A),
  `ProductPage.jsx` + `SectorPage.jsx` (B3 GIF slot). Reuse: `EditableImage`, `EditableText`, Lucide `Icons[name]`.

### Acceptance criteria (G4)
1. Each plan card shows its distinct icon; showcase header shows the selected plan's icon+name.
2. Selecting a different plan swaps the showcase GIF + delta highlights with a smooth transition.
3. GIF slot is editable in CMS edit mode; placeholder renders until a GIF is uploaded; uploaded GIF persists after publish.
4. Delta highlights correctly reflect what each plan adds over the prior tier.
5. Product + sector feature-GIF slots editable with placeholders.
6. No regression: cart/recommend/upsell/GST + Part A add-on reset all still correct; no hydration/console errors.

### Effort & inputs
- **Medium** (new showcase component + icon field + CMS slots + product/sector reuse). No integration, no migration.
- **Owner inputs (deferred, 4b):** the 4 per-plan feature GIFs (+ optional product/sector GIFs) — uploaded via CMS after build.

**Status:** **G2 scope LOCKED.** Ready to build on go-ahead (Part A + B1 + B2 first; B3 as follow-on). GIFs uploaded later by owner.

---

## ✅ BUILT & VERIFIED (2026-06-19) — Part A + B1 + B2
- **Part A:** `Pricing.jsx` `selectPlan(id)` resets `selectedAddons` on plan switch; wired to `PlanCard onSelect` + upsell-accept. Verified: add Central Inventory on Pro → switch to Starter → add-on cleared ("No add-ons yet").
- **B1 icons:** `data/pricing.js` `PLANS[].icon` (Store/TrendingUp/Rocket/Building2), rendered in `PlanCard.jsx` via `Icons[plan.icon]`. Distinct icon badge per card.
- **B2 showcase:** new `components/pricing/PlanShowcase.jsx` — dynamic panel above the plan grid; shows selected plan's icon/name/tagline, CMS-editable **feature GIF** (`plan.<id>.demo_gif`, placeholder `/brand/plan-demo-placeholder.svg`), editable caption (`plan.<id>.demo_caption`), and **delta highlights** ("What {plan} adds" vs "What you get") derived from `includes` minus the "Everything in…" line + price. Fade/slide transition on plan switch (`animate-in`). Verified: Pro→"WHAT PRO ADDS", Starter→"WHAT YOU GET", GIF + cart/GST all correct.
- **B3 (product/sector feature-GIF reuse):** NOT yet built — follow-on slice.
- **Owner TODO:** upload the 4 plan feature GIFs via CMS (edit mode → pencil on the showcase image).
