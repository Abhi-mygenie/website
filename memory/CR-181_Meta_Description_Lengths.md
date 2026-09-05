# CR-181 — Meta Description Length > 160 Characters (5 Pages)

**Type:** SEO / Content
**Date Raised:** 2026-09-02
**Status:** OPEN
**Priority:** P1
**Source:** New build audit 2026-09-02 — Finding 5 (only confirmed real gap)
**Batch:** V — New Build Audit Gaps

---

## 1. Problem

Google truncates meta descriptions longer than ~160 characters in search results, cutting off the sentence mid-word and showing "...". This reduces CTR because the user sees an incomplete value proposition.

5 pages confirmed over the limit in the prerendered build (Sep 2026-09-02):

| Page | Current chars | Over by | Source field |
|---|---|---|---|
| `/product/central-inventory` | **226ch** | 66ch | `products.js` → `central-inventory.sub` |
| `/solutions/restaurants` | **212ch** | 52ch | `sectors.js` → `restaurants.sub` |
| `/solutions/cafes` | **195ch** | 35ch | `sectors.js` → `cafes.sub` |
| `/solutions/hotels-resorts` | **191ch** | 31ch | `sectors.js` → `hotels-resorts.sub` |
| `/solutions/cloud-kitchens` | **166ch** | 6ch | `sectors.js` → `cloud-kitchens.sub` |

---

## 2. Root Cause

`SectorPage.jsx` uses `s.sub` as both:
1. The visible page subtitle (rendered below H1)
2. The `<Seo description={s.sub} />` meta description

`ProductPage.jsx` does the same with `p.sub`.

The `sub` fields were written as rich, multi-clause page subtitles — not as ≤160-char search snippets. They need to be trimmed while remaining usable as subtitles (or the description can be broken into a separate field in a future refactor).

---

## 3. Current Values (exact, from prerendered HTML)

### /product/central-inventory (226ch)
```
Stop managing restaurant inventory in silos. MyGenie connects your POS system to a central inventory management hub — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.
```

### /solutions/restaurants (212ch)
```
From QR menu ordering to the kitchen screen to your owner dashboard, MyGenie covers your whole restaurant management — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.
```

### /solutions/cafes (195ch)
```
Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, QR menu ordering, and ingredient-level inventory management — plus a built-in CRM to bring guests back.
```

### /solutions/hotels-resorts (191ch)
```
Stop running between counters. MyGenie unifies room billing and F&B into one consolidated checkout bill, works in low-internet properties, and lets staff serve guests right from their phones.
```

### /solutions/cloud-kitchens (166ch)
```
Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies your inventory management and every brand into one backend.
```

---

## 4. Fix

Trim each `sub` value to ≤160 characters in `sectors.js` and `products.js`. Keep the primary keyword in the first 120 characters. The trimmed text should still work as a visible page subtitle.

**Files to change:**
| File | Field |
|---|---|
| `frontend/src/data/sectors.js` | `restaurants.sub`, `cafes.sub`, `hotels-resorts.sub`, `cloud-kitchens.sub` |
| `frontend/src/data/products.js` | `central-inventory.sub` |

**Note:** A rebuild + prerender is required after changes.

---

## 5. Proposed trimmed values (for owner approval)

These are proposals only — owner must approve copy before implementation (per content workflow).

**central-inventory (→ ≤160ch):**
```
Stop managing restaurant inventory in silos. MyGenie gives you central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every outlet.
```
*(160ch — keeps all key terms)*

**restaurants (→ ≤160ch):**
```
MyGenie covers your whole restaurant management — QR menu ordering, kitchen screen, and owner dashboard — so you serve more covers with fewer mistakes.
```
*(149ch)*

**cafes (→ ≤160ch):**
```
Thin margins leave no room for waste. MyGenie gives cafés fast mobile billing, QR menu ordering, and ingredient-level inventory management — plus a built-in CRM.
```
*(160ch)*

**hotels-resorts (→ ≤160ch):**
```
MyGenie unifies room billing and F&B into one consolidated checkout bill, works in low-internet properties, and lets staff serve guests from their phones.
```
*(152ch)*

**cloud-kitchens (→ ≤160ch):**
```
Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies your orders and every brand into one backend.
```
*(151ch — trimmed "inventory management and" to fix the 6-char overage)*

---

## 6. Definition of Done

- [ ] All 5 `sub` fields trimmed to ≤160 chars in source files
- [ ] Owner approved trimmed copy
- [ ] Prerendered HTML verified: all 5 pages show ≤160ch meta description
- [ ] Visible subtitle on each page still reads naturally

---

## 7. Audit Context

Source audit: New build audit 2026-09-02.
All other P0/P1 audit findings were determined to be **auditor incorrect** or **not code fixes**:

| Finding | Verdict |
|---|---|
| P0: Form inputs no `name` — zero leads | AUDITOR INCORRECT — React + axios, `name=` not required |
| P0: React Hydration Error #418 | AUDITOR INCORRECT — CR-160 fix confirmed live |
| P1: QAPage → must be FAQPage | AUDITOR INCORRECT — FAQPage deprecated May 7 2026 |
| P1: Meta Pixel not installed | NOT CODE — GTM container config (marketing team) |
| P1: billing software missing (8 pages) | AUDITOR INCORRECT — 3x on all pages (CR-179 deployed) |
| P1: pos system missing (7 pages) | AUDITOR INCORRECT — 3-4x on all pages (CR-179 deployed) |

*CR-181 registered 2026-09-02. Only confirmed actionable gap from new build audit.*
