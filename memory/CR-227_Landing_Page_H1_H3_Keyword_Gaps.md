# CR-227 — Landing Page H1/H3 Keyword Gap Fixes (3 one-line edits)

**Registered:** 2026-09-06
**Source:** Content/SEO audit — keyword gap review on 3 landing pages
**Status:** 🔲 Open — dev/content, three one-line edits
**Priority:** P1
**Owner:** Dev (code change + rebuild)
**Files:**
- `src/pages/RestaurantPosSystem.jsx` L132
- `src/pages/CloudKitchenPos.jsx` L135
- `src/pages/RestaurantBillingSoftware.jsx` L163

---

## 1. Changes Required

### Change A — /restaurant-pos-system H1 (L132)

**File:** `src/pages/RestaurantPosSystem.jsx` line 132

```jsx
// BEFORE:
Best restaurant POS system — orders, billing, and reports in one place, on any device.

// AFTER:
Best restaurant POS system & software — orders, billing, and reports in one place, on any device.
```

**Reason:** Adds `& software` to capture both `restaurant POS system` AND `restaurant POS software` as separate search keyword variants. POS system and POS software are queried independently. Current H1 misses the `software` variant entirely.

---

### Change B — /cloud-kitchen-pos H1 (L135)

**File:** `src/pages/CloudKitchenPos.jsx` line 135

```jsx
// BEFORE:
Cloud kitchen POS & billing software — every brand, every aggregator, one screen.

// AFTER:
Cloud kitchen POS, billing & management software — every brand, every aggregator, one screen.
```

**Reason:** Adds `management` to capture `cloud kitchen management software` keyword. Natural phrasing — cloud kitchens need management beyond billing. Not redundant.

---

### Change C — /restaurant-billing-software H3 feature card title (L163)

**File:** `src/pages/RestaurantBillingSoftware.jsx` line 163

```jsx
// BEFORE:
{ icon: "☕", title: "Restaurants AND cafes", body: "Dine-in, takeaway, delivery, QSR, cafe — same software, any format.", testid: "billing-feature-cafe" },

// AFTER:
{ icon: "☕", title: "Restaurants, cafes AND bars", body: "Dine-in, takeaway, delivery, QSR, cafe — same software, any format.", testid: "billing-feature-cafe" },
```

**Reason:** Internal consistency fix. Line 128 of the same file already states "Built for restaurants, cafes, and bars." — the feature card is the only place that omits "bars". Also adds `bars billing software` keyword signal.

---

## 2. Validation (post-build)

```bash
grep "POS system & software" /app/frontend/build/restaurant-pos-system/index.html
# Expected: match found

grep "billing & management software" /app/frontend/build/cloud-kitchen-pos/index.html
# Expected: match found

grep "Restaurants, cafes AND bars" /app/frontend/build/restaurant-billing-software/index.html
# Expected: match found
```

---

## 3. Impact

| Page | Keyword added | Search queries captured |
|---|---|---|
| `/restaurant-pos-system` | `restaurant POS software` | Separate query from "POS system" |
| `/cloud-kitchen-pos` | `cloud kitchen management software` | New keyword variant |
| `/restaurant-billing-software` | `bars billing software` + consistency | Internal content alignment |

**Effort:** 3 search_replace edits + 1 rebuild (~3 min total)
**Risk:** Zero — headline copy only, no logic changes

---

*Registered 2026-09-06. Source: Content/SEO audit — keyword gap review.*
*No code change made at registration. Implement when approved.*
