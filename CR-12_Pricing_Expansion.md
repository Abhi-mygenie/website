# CR-12 — Pricing page expansion (plans, add-ons, comparison table, demo popup, cart polish)

> Intake: 2026-06-20. Source: owner feedback round on the Pricing page.
> **Status: G1 Discovery — summarized & captured. NOT planned/built yet. Awaiting owner confirmations (see end).**
> Build only after G2 scope lock. Bundles several pricing items into one CR for coherence.

---

## Scope items

### 1. Chain / Enterprise tier — remove Hotel/Room billing
- Chain/Enterprise is for **franchise & chain / multi-outlet only** — NOT hotels.
- Remove **"Hotel / Room billing"** from `PLANS[chain].includes`.
- Update tagline `"Multi-outlet, hotels & franchises"` → drop "hotels" (e.g. "Multi-outlet & franchises").
- Hotel/Room billing moves to the new **Hotels** plan (item 2).

### 2. Add 2 new plans → 6 tiers total
Current: Starter, Growth, Pro, Chain/Enterprise. Add:
- **Hotels plan** — for hotels/resorts; this tier carries **Hotel/Room billing** + relevant features. Icon e.g. `BedDouble`.
- **Custom / Customized-workflow plan** — bespoke/tailored. Likely **"Talk to us / custom quote"** (no fixed ₹, no Buy-online → CTA = book demo / contact). Icon e.g. `Settings2` or `Wand2`.
- ⚠️ Confirm: Hotels price + included features; Custom = contact-only vs fixed price.
- Layout impact: 6 cards won't fit the current 2-col grid cleanly → likely 3-col grid + the comparison table (item 5) becomes the primary compare surface.

### 3. Add-on changes
**Remove:** `captain_device` (Extra Captain Device).
**Club** `scan_order` (Scan & Order QR) **+** `online_delivery` (Online Ordering & Delivery) into ONE add-on:
- New: **"Branded website — ordering across channels" @ ₹399** (new id e.g. `branded_ordering`).
- ⚠️ `scan_order` is currently an *included* add-on in Growth/Pro/Chain `includedAddons` — those references must repoint to the new clubbed id.
**Add new add-ons:**
| Add-on | Price | Notes |
|---|---|---|
| Aggregator Integration (Swiggy, Zomato, Magicpin) | ₹199 / **brand** | per-brand pricing — confirm qty selector vs flat |
| Kiosk | ₹499 / month | |
| Token Management | ₹199 / month | |
| Payment Gateway Integration | ₹199 | |
| EDC Integration | ₹199 | |
**Keep:** whatsapp, loyalty_wallet, central_inventory, hotel_billing, ai_insights, priority_support.
- ⚠️ Recompute `recommend()` / `alsoAdded()` maps that reference removed/clubbed ids (`captain_device`, `scan_order`, `online_delivery`).

### 4. Cart — drop "₹0/yr" on included add-ons (carry-over)
- In `CartSummary.jsx`, the included-add-on rows show `₹0/yr` — **remove the price**, keep name + green **INCLUDED** badge only. Paid add-ons keep `₹X/yr`.

### 5. Feature demo → icon + full-screen popup (carry-over, redesign of CR-11 B2)
- The large inline `PlanShowcase` media doesn't stay in view when a lower plan (e.g. Chain) is selected.
- Replace the inline GIF area with a small **"▶ Feature demo" icon/button per plan** → opens a **full-screen modal** with that plan's GIF/video + a **✕ close** button.
- Keep per-plan CMS media (`plan.<id>.demo_gif`). Popup should ideally support **both GIF and video** (mp4/YouTube) — confirm.
- ⚠️ Open (asked, unanswered): icon placement (on each plan card vs near title); keep or drop the "What {plan} adds" inline strip; GIF-only vs also-video.

### 6. Full comparison table
- A single **plan × features matrix** (plans = columns, all features/add-ons = rows, tick/cross) so customers compare **everything in one view** without scrolling between cards.
- ⚠️ Confirm: table **in addition to** the plan cards, or **replaces** them. Mobile behaviour (horizontal scroll / accordion).

---

## 🔴 Owner confirmations needed to exit G1 → G2
1. **Hotels plan** — price, included features, included add-ons, icon.
2. **Custom plan** — contact-only (book demo / quote) or fixed price? CTA behaviour.
3. **Aggregator ₹199/brand** — quantity selector (brands × 199) or flat ₹199?
4. **Comparison table** — in addition to cards, or replace cards? Mobile pattern.
5. **Feature-demo popup** — icon placement; keep "What plan adds" strip?; GIF-only or also video.
6. Confirm final **icons** for Hotels + Custom plans, and naming for the clubbed/branded add-on.

## Impacted files (for next agent's planning — not yet built)
- `frontend/src/data/pricing.js` — PLANS (chain edit + Hotels + Custom), ADDONS (remove/club/add), `recommend()`/`alsoAdded()` maps, `includedAddons` repointing.
- `frontend/src/pages/Pricing.jsx` — 6-plan grid, comparison table, demo-popup wiring.
- `frontend/src/components/pricing/PlanCard.jsx` — demo icon; custom/contact CTA variant.
- `frontend/src/components/pricing/CartSummary.jsx` — remove ₹0/yr on included.
- `frontend/src/components/pricing/PlanShowcase.jsx` — convert to modal (`FeatureDemoModal`) or replace.
- NEW: `components/pricing/ComparisonTable.jsx`, `components/pricing/FeatureDemoModal.jsx`.
- CMS display fallbacks (`PLAN_DISPLAY`/`ADDON_DISPLAY`, `PLAN_FIELDS`) auto-extend; logic fields (id, icon, includedAddons) stay code-controlled.
