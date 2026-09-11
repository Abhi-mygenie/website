# CR-179 — Impact Analysis: Solution & Product Page Keyword Gaps
**Date:** 2026-09-01 — Planning Agent
**Status:** IMPACT ANALYSIS COMPLETE — content proposals below for owner approval
**Files read:** `sectors.js` (327 lines), `products.js` (152 lines), `SectorPage.jsx` (280 lines), `ProductPage.jsx` (269 lines), `CmsProvider.jsx` (relevant sections)
**Pages covered:** 5 (`/solutions/restaurants`, `/solutions/cafes`, `/solutions/cloud-kitchens`, `/product/sell-serve`, `/product/central-inventory`)

---

## Part 1 — Architecture Confirmation

### How These Pages Work

All 5 pages are **template-driven**. Two template files render all content:

| Template | Data file | Pages powered |
|---|---|---|
| `SectorPage.jsx` | `src/data/sectors.js` | /solutions/restaurants, /solutions/cafes, /solutions/cloud-kitchens |
| `ProductPage.jsx` | `src/data/products.js` | /product/sell-serve, /product/central-inventory |

**Rule confirmed:** Template files (SectorPage.jsx, ProductPage.jsx) are NOT touched.
All keyword changes go into `sectors.js` and `products.js` data strings only.

### What Renders on Each Sector Page (from SectorPage.jsx)

| Section | Data source | CMS-editable? |
|---|---|---|
| `<title>` tag | Template: `${s.name} POS System & Billing Software \| MyGenie` | ❌ Hardcoded in template |
| H1 | `s.h1` via `EditableText` | ✅ If CMS override stored |
| Subtitle | `s.sub` via `EditableText` | ✅ If CMS override stored |
| Pain cards | `s.pains[].title` + `s.pains[].desc` via `EditableList` | ✅ If CMS override stored |
| Solution cards | `s.solutions[].title` + `s.solutions[].desc` via `EditableList` | ✅ If CMS override stored |
| Proof cards | `s.proof[].quote` etc via `EditableList` | ✅ If CMS override stored |
| FAQ items | `s.faqs` via `EditableFaqList` | ✅ If CMS override stored |
| H2 headings (template) | `"We know {nameLower} run on..."` etc | ❌ Hardcoded in template |

### What Renders on Each Product Page (from ProductPage.jsx)

| Section | Data source | CMS-editable? |
|---|---|---|
| `<title>` tag | Template: `${p.title} \| MyGenie POS Features` | ❌ Hardcoded in template |
| H1 | `p.h1` via `EditableText` | ✅ If CMS override stored |
| Subtitle | `p.sub` via `EditableText` | ✅ If CMS override stored |
| Module cards | `p.modules[].name` + `.outcome` + `.caps` via `EditableList` | ✅ If CMS override stored |
| Proof cards | `p.proof[].quote` etc via `EditableList` | ✅ If CMS override stored |
| FAQ items | `p.faqs` via `EditableFaqList` | ✅ If CMS override stored |
| Modules H2 | `"${p.title} — every tool, a business outcome."` | ❌ Hardcoded in template |

---

## Part 2 — CMS Override Audit (Live API Call)

**Result from `/api/cms/content`:**

| Page | CMS keys stored | Impact on our changes |
|---|---|---|
| sector.restaurants | `sector.restaurants.faqs` only | FAQs use CMS. H1, sub, pains, solutions, proof use data file fallback → **changes will render** ✅ |
| sector.cafes | `sector.cafes.faqs` only | Same — changes will render ✅ |
| sector.cloud-kitchens | `sector.cloud-kitchens.faqs` only | Same — changes will render ✅ |
| product.sell-serve | `product.sell-serve.faqs`, `product.sell-serve.video` | Modules, H1, sub, proof use data file fallback → **changes will render** ✅ |
| product.central-inventory | **NONE** | Everything uses data file fallback → **all changes will render** ✅ |

**Key finding:** FAQs for 4 of the 5 pages are stored in CMS. We do NOT propose any FAQ changes. All proposed changes target H1, sub, pain cards, solution cards, and module cards — none of which have CMS overrides. ✅

---

## Part 3 — Baseline Keyword Audit (Confirmed from Live Build)

### Title Tags (template-generated — cannot change without template edit)

| Page | Title | pos system in title | billing software in title |
|---|---|---|---|
| /solutions/restaurants | Restaurants POS System & Billing Software \| MyGenie | 3x (in title+og+twitter) | 3x |
| /solutions/cafes | Cafés POS System & Billing Software \| MyGenie | 4x | 3x |
| /solutions/cloud-kitchens | Cloud Kitchens POS System & Billing Software \| MyGenie | 3x | 3x |
| /product/sell-serve | Sell & Serve Faster \| MyGenie POS Features | 0x | 1x (in H1 only) |
| /product/central-inventory | Central Inventory \| MyGenie POS Features | 0x | 0x |

**Key finding:** Sector page titles auto-contain "POS System & Billing Software" from the template. These keywords are already covered in sector pages via meta tags. Product pages do NOT get this benefit — they use `${p.title} | MyGenie POS Features`.

### Body Content Gaps (confirmed from build/*/index.html)

**Target keywords per page, per ad campaign mapping:**

| Keyword | Restaurants | Cafés | Cloud Kitchens | Sell-Serve | Central Inv |
|---|---|---|---|---|---|
| restaurant billing | **0x** ❌ | — | — | **0x** ❌ | — |
| restaurant management | **0x** ❌ | — | — | — | — |
| table management | **0x** ❌ | — | — | **0x** ❌ | — |
| qr menu | **0x** ❌ | **0x** ❌ | — | **0x** ❌ | — |
| inventory management | — | **0x** ❌ | **0x** ❌ | — | **1x** (need 5+) |
| crm | — | **0x** ❌ | — | — | — |
| food business | — | — | **0x** ❌ | — | — |
| pos billing | — | — | — | **0x** ❌ | — |
| restaurant inventory | — | — | — | — | **0x** ❌ |
| pos system | — (3x ✓) | — (4x ✓) | — (3x ✓) | **0x** ❌ | **0x** ❌ |

"—" = not a target for that page (or already passing). ❌ = gap confirmed.

---

## Part 4 — New Findings

### FINDING CR179-A — Sector page title covers pos system and billing software automatically
`SectorPage.jsx` line 62: `const seoTitle = \`${s.name} POS System & Billing Software | MyGenie\``
This generates 3x "pos system" and 3x "billing software" per sector page across title/og/twitter meta tags.
Sector pages do NOT need additional "pos system" or "billing software" in body content.
Product pages (sell-serve, central-inventory) do NOT get this — `ProductPage.jsx` line 72 uses `${p.title} | MyGenie POS Features`.

### FINDING CR179-B — Sell-serve has only 1x "billing software" (from H1 only)
`products.js` line 8: `h1: "Restaurant POS & billing software — bill in seconds..."`
The word "billing" appears but not as "billing software" elsewhere. The page title `"Sell & Serve Faster | MyGenie POS Features"` doesn't include it. Sell-serve needs its own body-content keyword coverage.

### FINDING CR179-C — central-inventory has only 1x "inventory management" — all in H1
`products.js` line 128: `h1: "Central inventory management for chains — one stock source of truth across all your outlets."`
The rest of the page (sub, modules, proof) does not use the phrase "inventory management" at all. The page is about inventory but uses single word "inventory" or compound "central inventory". The phrase "inventory management" (the searchable term) needs significant reinforcement.

### FINDING CR179-D — Cafés page has 0x "crm" despite CRM being a core feature
Looking at cafés solutions: `{ title: "Loyalty + WhatsApp", desc: "Reward regulars and bring guests back automatically." }` — CRM is the underlying feature but the word "CRM" never appears. The solutions, pains, and H1 are all CRM-adjacent but the keyword itself is absent.

### FINDING CR179-E — Restaurants page has 0x "qr menu" and 0x "table management" despite these being primary features
The solutions cards mention "Captain App" (which IS table management) and "KOT/KDS" but not as "table management". The QR menu / scan & order feature is not mentioned at all on the restaurants page.

### FINDING CR179-F — No proposals will touch FAQ content (CMS-stored)
All 27 proposals below target: h1, sub, pains, solutions, module names, module outcomes.
None touch `faqs` arrays. The CMS-stored FAQ overrides are not affected. ✅

### FINDING CR179-G — Proof (testimonial) quotes not proposed for change
Testimonial quotes are attributed to real clients. Changing them would be inauthentic.
All proposals stay in: h1, sub, pain card descriptions, solution card titles/descs, module names/outcomes.

### FINDING CR179-H — "restaurant management" not a target for any page except /solutions/restaurants
The UAT audit specifically flags this gap for the restaurants landing page only (it's in the "Management & Ordering" ad group for that page's campaign). Other pages don't need it.

---

## Part 5 — Content Proposals for Owner Approval

**27 proposals across 5 pages. Numbered P1–P27.**
Reply with Approve / Reject / Edit for each.

---

### PAGE A: /solutions/restaurants
**Gaps:** restaurant billing (0x→2+), restaurant management (0x→2+), table management (0x→2+), qr menu (0x→2+)

---

**P1 — Restaurants H1** *(sectors.js, line 9)*
```
BEFORE: Restaurant POS software — faster tables, fewer errors, more profit per cover.
AFTER:  Restaurant POS system — table management made easy, faster restaurant billing, more profit per cover.
```
Adds: table management ×1, restaurant billing ×1

---

**P2 — Restaurants subtitle** *(sectors.js, line 10)*
```
BEFORE: From the captain's tab to the kitchen screen to your owner dashboard, MyGenie runs your whole dining room — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.
AFTER:  From QR menu ordering to the kitchen screen to your owner dashboard, MyGenie covers your whole restaurant management — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.
```
Adds: qr menu ×1, restaurant management ×1

---

**P3 — Restaurants pain card 1: "Order errors & lost chits" description** *(sectors.js, line 13)*
```
BEFORE: Handwritten KOTs get lost or misread — wrong dishes and wasted food.
AFTER:  Slow restaurant billing and handwritten KOTs create errors — wrong dishes, wrong charges, wasted food.
```
Adds: restaurant billing ×1

---

**P4 — Restaurants solution card 0: Captain App description** *(sectors.js, line 18)*
```
BEFORE: Multiple waiters take orders at the same table, in real time — no clashes, no delays.
AFTER:  Table management in real time — multiple waiters, one table, no clashes, no delays.
```
Adds: table management ×1

---

**P5 — Restaurants solution card 1: KOT/KDS description** *(sectors.js, line 19)*
```
BEFORE: Orders hit the kitchen screen instantly. No lost chits, no shouting.
AFTER:  From QR menu scan to kitchen screen instantly. No lost chits, no shouting.
```
Adds: qr menu ×1

---

**P6 — Restaurants solution card 2: Recipe-level P&L description** *(sectors.js, line 20)*
```
BEFORE: See profit by item and by table — optimize your menu by the rupee.
AFTER:  Restaurant management reporting — profit by item and table, optimized by the rupee.
```
Adds: restaurant management ×1

**Restaurants count after P1–P6:** restaurant billing 2x ✓ · restaurant management 2x ✓ · table management 2x ✓ · qr menu 2x ✓

---

### PAGE B: /solutions/cafes
**Gaps:** inventory management (0x→2+), qr menu (0x→2+), crm (0x→2+)

---

**P7 — Cafés subtitle** *(sectors.js, line 39)*
```
BEFORE: Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, ingredient-level control, and a built-in repeat-customer engine.
AFTER:  Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, QR menu ordering, and ingredient-level inventory management — plus a built-in CRM to bring guests back.
```
Adds: qr menu ×1, inventory management ×1, crm ×1

---

**P8 — Cafés pain card 0: "Thin margins, hidden waste" description** *(sectors.js, line 41)*
```
BEFORE: Ingredients spoil or over-portion before they ever become profit.
AFTER:  Without inventory management, ingredients spoil or over-portion before they become profit.
```
Adds: inventory management ×1

---

**P9 — Cafés solution card 1: title** *(sectors.js, line 48)*
```
BEFORE: Recipe & inventory control
AFTER:  Recipe & inventory management
```
Adds: inventory management ×1

---

**P10 — Cafés solution card 2: title** *(sectors.js, line 49)*
```
BEFORE: Loyalty + WhatsApp
AFTER:  CRM, Loyalty & WhatsApp
```
Adds: crm ×1

---

**P11 — Cafés solution card 2: description** *(sectors.js, line 49)*
```
BEFORE: Reward regulars and bring guests back automatically.
AFTER:  Built-in CRM rewards regulars and brings guests back automatically.
```
Adds: crm ×1

---

**P12 — Cafés solution card 0: description** *(sectors.js, line 47)*
```
BEFORE: Run on a few phones — no expensive hardware. Go live in under 48 hours.
AFTER:  Run on a few phones with QR menu ordering — no expensive hardware. Go live in under 48 hours.
```
Adds: qr menu ×1

**Cafés count after P7–P12:** inventory management 3x ✓ · qr menu 2x ✓ · crm 2x ✓

---

### PAGE C: /solutions/cloud-kitchens
**Gaps:** inventory management (0x→3+), food business (0x→2+)

---

**P13 — Cloud Kitchens H1** *(sectors.js, line 96)*
```
BEFORE: Cloud kitchen POS — every brand and aggregator on one screen, one inventory.
AFTER:  Cloud kitchen POS & inventory management — every food business brand and aggregator on one screen.
```
Adds: inventory management ×1, food business ×1

---

**P14 — Cloud Kitchens subtitle** *(sectors.js, line 97)*
```
BEFORE: Juggling Swiggy, Zomato and multiple brands shouldn't mean five tablets and a spreadsheet. MyGenie unifies it all into one backend.
AFTER:  Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies your inventory management and every brand into one backend.
```
Adds: food business ×1, inventory management ×1

---

**P15 — Cloud Kitchens solution card 2: title** *(sectors.js, line 107)*
```
BEFORE: Central inventory
AFTER:  Central inventory management
```
Adds: inventory management ×1

**Cloud Kitchens count after P13–P15:** inventory management 3x ✓ · food business 2x ✓

---

### PAGE D: /product/sell-serve
**Gaps:** table management (0x→2+), qr menu (0x→2+), pos billing (0x→2+), restaurant billing (0x→2+)

---

**P16 — Sell & Serve H1** *(products.js, line 8)*
```
BEFORE: Restaurant POS & billing software — bill in seconds, serve more covers, lose zero orders.
AFTER:  Restaurant POS & billing software — fast restaurant billing, table management built in, lose zero orders.
```
Adds: restaurant billing ×1, table management ×1

---

**P17 — Sell & Serve subtitle** *(products.js, line 9)*
```
BEFORE: From the counter to the captain's tab to the kitchen screen, MyGenie keeps service fast and flawless at every rush.
AFTER:  From POS billing at the counter to QR menu ordering to the kitchen screen, MyGenie keeps service fast and flawless at every rush.
```
Adds: pos billing ×1, qr menu ×1

---

**P18 — Sell & Serve module 0: name** *(products.js, line 11)*
```
BEFORE: POS / Billing
AFTER:  POS Billing
```
Adds: pos billing ×1

---

**P19 — Sell & Serve module 0: outcome** *(products.js, line 11)*
```
BEFORE: Bill in seconds, even at peak rush.
AFTER:  Restaurant billing in seconds, even at peak rush.
```
Adds: restaurant billing ×1

---

**P20 — Sell & Serve module 1: name** *(products.js, line 12)*
```
BEFORE: Captain / Waiter App
AFTER:  Captain App & Table Management
```
Adds: table management ×1

---

**P21 — Sell & Serve module 1: outcome** *(products.js, line 12)*
```
BEFORE: Take orders tableside — multiple waiters, one table, no clashes.
AFTER:  Table management in real time — multiple waiters, one table, no clashes.
```
Adds: table management ×1

---

**P22 — Sell & Serve module 3: name** *(products.js, line 14)*
```
BEFORE: Scan & Order
AFTER:  QR Menu & Scan Order
```
Adds: qr menu ×1

---

**P23 — Sell & Serve module 3: outcome** *(products.js, line 14)*
```
BEFORE: Guests scan, order and pay from their phone.
AFTER:  QR menu — guests scan, order and pay from their phone.
```
Adds: qr menu ×1

**Sell & Serve count after P16–P23:** restaurant billing 2x ✓ · pos billing 2x ✓ · table management 3x ✓ · qr menu 3x ✓

---

### PAGE E: /product/central-inventory
**Gaps:** restaurant inventory (0x→1+), inventory management (1x→5+), pos system (0x→1+)

---

**P24 — Central Inventory H1** *(products.js, line 128)*
```
BEFORE: Central inventory management for chains — one stock source of truth across all your outlets.
AFTER:  Central restaurant inventory management — one stock source of truth across all your outlets.
```
Adds: restaurant inventory ×1
Note: "Central restaurant inventory management" contains both "restaurant inventory" AND "inventory management" as overlapping phrases. The existing 1x "inventory management" shifts to be inside the new phrase. ✅

---

**P25 — Central Inventory subtitle** *(products.js, line 129)*
```
BEFORE: Stop managing each outlet's stock in silos. MyGenie gives multi-outlet businesses one central source of truth — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.
AFTER:  Stop managing restaurant inventory in silos. MyGenie gives multi-outlet businesses one inventory management hub — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.
```
Adds: restaurant inventory ×1, inventory management ×1

---

**P26 — Central Inventory module 0: outcome** *(products.js, line 131)*
```
BEFORE: See live stock across every outlet from one dashboard.
AFTER:  Inventory management across every outlet — live stock, one dashboard.
```
Adds: inventory management ×1

---

**P27 — Central Inventory module 3: outcome** *(products.js, line 134)*
```
BEFORE: AI predicts demand and suggests what to reorder, per outlet.
AFTER:  AI-powered inventory management — predicts demand and suggests what to reorder, per outlet.
```
Adds: inventory management ×1

⚠️ **Note on pos system for central-inventory:** The UAT audit flagged `pos system 0x` for this page. We have NOT proposed adding it. The inventory management page is naturally about stock control, not POS. Adding "POS system" artificially would feel out of context. Recommendation: skip pos system for central-inventory. Inventory management (5x target) is the primary keyword for this page. **Owner to decide.**

---

## Part 6 — Keyword Achievement Summary (if all 27 approved)

| Page | Keyword | Before | After | Target |
|---|---|---|---|---|
| /solutions/restaurants | restaurant billing | 0x | 2x | 2+ ✓ |
| /solutions/restaurants | restaurant management | 0x | 2x | 2+ ✓ |
| /solutions/restaurants | table management | 0x | 2x | 2+ ✓ |
| /solutions/restaurants | qr menu | 0x | 2x | 2+ ✓ |
| /solutions/cafes | inventory management | 0x | 3x | 2+ ✓ |
| /solutions/cafes | qr menu | 0x | 2x | 2+ ✓ |
| /solutions/cafes | crm | 0x | 2x | 2+ ✓ |
| /solutions/cloud-kitchens | inventory management | 0x | 3x | 3+ ✓ |
| /solutions/cloud-kitchens | food business | 0x | 2x | 2+ ✓ |
| /product/sell-serve | restaurant billing | 0x | 2x | 2+ ✓ |
| /product/sell-serve | pos billing | 0x | 2x | 2+ ✓ |
| /product/sell-serve | table management | 0x | 3x | 2+ ✓ |
| /product/sell-serve | qr menu | 0x | 3x | 2+ ✓ |
| /product/central-inventory | restaurant inventory | 0x | 2x | 1+ ✓ |
| /product/central-inventory | inventory management | 1x | 4x | 5+ (falls short — see below) |
| /product/central-inventory | pos system | 0x | 0x | SKIPPED — see note above |

⚠️ **Central Inventory shortfall:** With P24–P27, inventory management reaches 4x (1 existing from H1 changes + 3 new). The UAT audit target was 5+. To reach 5, one more addition is needed. Left to owner: either add one more via an additional proposal, or accept 4x.

---

## Part 7 — Risk Register

| Risk | Assessment | Verdict |
|---|---|---|
| CMS overrides conflict with data file changes | Confirmed: only `.faqs` keys are in CMS. Hero, sub, pains, solutions, modules — all fallback to data files | ✅ Zero risk |
| Template H2s affected | H2 texts in templates use `s.nameLower` — not changed. Template is not touched | ✅ Zero risk |
| Testimonial quotes changed | No proposals touch proof/testimonial quotes | ✅ Zero risk |
| FAQ content changed | No proposals touch faqs arrays | ✅ Zero risk |
| Passing keywords on sector pages degraded | Title auto-generates pos system + billing software — not touched | ✅ Zero risk |
| sell-serve H1 "Restaurant POS & billing software" is changed by P16 | P16 keeps "Restaurant POS & billing software" at the start — only replaces the clause after the dash | ✅ Safe |
| Module name changes (P18, P20, P22) affect React keys | Same situation as CR-178 chips. New string = remount. Visual result identical. | ✅ Safe |
| Build fails | All changes are string edits in JS data files. No imports or logic changes | ✅ Very low |
| Prerender captures all changes | All changes are in data imported synchronously before render. Puppeteer will capture them | ✅ Confirmed |

---

## Part 8 — Files to Change

| File | Proposals | Changes |
|---|---|---|
| `src/data/sectors.js` | P1–P15 | 15 string edits |
| `src/data/products.js` | P16–P27 | 12 string edits |

**Two files only. No component files touched.**

---

*Impact analysis written 2026-09-01. Planning Agent. All 5 target pages audited from live build. CMS state verified via live API. All relevant data files read in full. No code changed. Awaiting owner approval on P1–P27.*
