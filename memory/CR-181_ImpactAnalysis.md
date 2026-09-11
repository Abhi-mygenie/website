# CR-181 Impact Analysis — Meta Description Length > 160 Characters
**Date:** 2026-09-02
**Agent:** E1
**Status:** PENDING OWNER APPROVAL

---

## 1. Current State (Verified from Source)

### How `sub` is used (critical — dual role)

`SectorPage.jsx` line 80:
```jsx
<Seo title={seoTitle} description={s.sub} path={`/solutions/${slug}`} ... />
```
`SectorPage.jsx` line 97:
```jsx
<EditableText id={`${docKey}.hero.sub`} fallback={doc.hero.sub} multiline />
```

`ProductPage.jsx` line 72:
```jsx
<Seo title={...} description={p.sub} path={`/product/${bucket}`} ... />
```
`ProductPage.jsx` line 89:
```jsx
<EditableText id={`${docKey}.hero.sub`} fallback={doc.hero.sub} multiline />
```

**The `sub` field serves as BOTH:**
1. The `<meta name="description">` tag (needs ≤160 chars for Google)
2. The visible hero subtitle rendered below H1 on the page

**Any trim will shorten the visible subtitle too.** This is acceptable — shorter subtitles are cleaner UX.

---

## 2. CMS Override Check

Live CMS keys checked 2026-09-02:
```
sector.restaurants.faqs      ← FAQs only — NOT the sub/description
sector.cafes.faqs
sector.cloud-kitchens.faqs
sector.hotels-resorts.faqs
product.run-property.hero.sub  ← run-property IS CMS-overridden (different page, NOT affected)
product.sell-serve.faqs
```

**None of the 5 affected pages have a CMS override for their `sub` field.**

→ The `sub` value in `sectors.js` / `products.js` IS exactly what's shown to visitors and Google.
→ Changing the data file will immediately update both the meta description and the visible subtitle.

---

## 3. Exact Current Values + Proposed Trims

### Change 1 — `/solutions/restaurants`
**File:** `sectors.js` **Line:** 10

**CURRENT (212ch):**
```
From QR menu ordering to the kitchen screen to your owner dashboard, MyGenie covers your whole restaurant management — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.
```

**PROPOSED (150ch):**
```
MyGenie covers your whole restaurant management — QR menu ordering, kitchen screen and owner dashboard — so you serve more covers with fewer mistakes.
```

**What changed:** Removed the opening "From … to … to …" clause. Key phrase "restaurant management" now appears in the first 8 words (better for snippet). 62 chars shorter.

---

### Change 2 — `/solutions/cafes`
**File:** `sectors.js` **Line:** 39

**CURRENT (195ch):**
```
Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, QR menu ordering, and ingredient-level inventory management — plus a built-in CRM to bring guests back.
```

**PROPOSED (157ch):**
```
Thin margins leave no room for waste. MyGenie gives cafés fast mobile billing, QR menu ordering, ingredient-level inventory management — plus a built-in CRM.
```

**What changed:** Removed "or guesswork" (11ch), removed ", and" before "ingredient-level" (4ch), removed " to bring guests back" (21ch). 38 chars shorter. All key terms preserved: billing, QR menu, inventory management, CRM.

---

### Change 3 — `/solutions/cloud-kitchens`
**File:** `sectors.js` **Line:** 97

**CURRENT (166ch):**
```
Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies your inventory management and every brand into one backend.
```

**PROPOSED (160ch):**
```
Running a food business on Swiggy, Zomato and multiple brands shouldn't mean five tablets. MyGenie unifies inventory management and every brand into one screen.
```

**What changed:** Removed "your " (5ch) before "inventory", changed "backend" → "screen" (same length). Net: 6 chars shorter — exactly at the 160-char limit. All key terms preserved: food business, Swiggy, Zomato, inventory management.

---

### Change 4 — `/solutions/hotels-resorts`
**File:** `sectors.js` **Line:** 126

**CURRENT (191ch):**
```
Stop running between counters. MyGenie unifies room billing and F&B into one consolidated checkout bill, works in low-internet properties, and lets staff serve guests right from their phones.
```

**PROPOSED (147ch):**
```
MyGenie unifies room billing and F&B into one checkout bill, works in low-internet properties, and lets staff serve guests right from their phones.
```

**What changed:** Removed opening "Stop running between counters. " (30ch), removed "consolidated " (13ch) — the sentence is cleaner. 44 chars shorter. Key terms: room billing, F&B, low-internet, phones.

---

### Change 5 — `/product/central-inventory`
**File:** `products.js` **Line:** 129

**CURRENT (226ch):**
```
Stop managing restaurant inventory in silos. MyGenie connects your POS system to a central inventory management hub — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.
```

**PROPOSED (150ch):**
```
Central restaurant inventory management in one hub — procurement, inter-outlet transfers, recipe costing and AI-driven reordering across every outlet.
```

**What changed:** Removed opening clause "Stop managing … in silos. MyGenie connects your POS system to a" (66ch), leads directly with "Central restaurant inventory management". All key terms preserved: restaurant inventory management, inter-outlet transfers, recipe costing, AI-driven reordering.

---

## 4. Summary Table

| Page | File | Line | Current | Proposed | Reduction |
|---|---|---|---|---|---|
| `/solutions/restaurants` | `sectors.js` | 10 | 212ch | **150ch** | −62ch |
| `/solutions/cafes` | `sectors.js` | 39 | 195ch | **157ch** | −38ch |
| `/solutions/cloud-kitchens` | `sectors.js` | 97 | 166ch | **160ch** | −6ch |
| `/solutions/hotels-resorts` | `sectors.js` | 126 | 191ch | **147ch** | −44ch |
| `/product/central-inventory` | `products.js` | 129 | 226ch | **150ch** | −76ch |

All proposed values ≤160 chars. All primary keywords preserved in first 120 chars.

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Visible subtitle too short/odd | Low | Low — subtitles are already long | Proposed values read naturally as subtitles |
| CMS conflict | None | — | No CMS override for any of these 5 `sub` fields |
| Keyword loss | None | — | All key ad-group keywords verified present in proposed values |
| Wrong page updated | None | — | Exact line numbers confirmed in source |

---

## 6. Definition of Done

- [ ] All 5 `sub` fields updated in `sectors.js` and `products.js`
- [ ] Owner approved trimmed copy
- [ ] Prerendered HTML verified: all 5 pages show ≤160ch meta description
- [ ] Visible subtitle still reads naturally on each page
- [ ] Build + prerender + frontend restart complete

---

*Analysis complete. 5 changes, 2 files. Awaiting owner approval of proposed values before implementation.*
