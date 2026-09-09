# CR-227 — Line-by-Line Implementation Plan
# Landing Page H1/H3 Keyword Gap Fixes (3 one-line edits)

**CR:** CR-227
**Status:** Plan written — awaiting dev execution
**Files:** 3 files, 3 search_replace operations, 1 rebuild

---

## PRE-FLIGHT CHECK

```bash
grep -n "Best restaurant POS system —" /app/frontend/src/pages/RestaurantPosSystem.jsx
# Expected: line 132

grep -n "Cloud kitchen POS & billing software" /app/frontend/src/pages/CloudKitchenPos.jsx
# Expected: line 135

grep -n "Restaurants AND cafes" /app/frontend/src/pages/RestaurantBillingSoftware.jsx
# Expected: line 163
```

---

## FILE 1 — `src/pages/RestaurantPosSystem.jsx`

### Op 1 — Line 132: Add "& software" to H1

**Context:** Captures `restaurant POS software` keyword alongside `restaurant POS system`.
Both are separate search queries. Current H1 misses the `software` variant.

```jsx
// BEFORE (line 132):
                  Best restaurant POS system — orders, billing, and reports in one place, on any device.

// AFTER:
                  Best restaurant POS system & software — orders, billing, and reports in one place, on any device.
```

---

## FILE 2 — `src/pages/CloudKitchenPos.jsx`

### Op 2 — Line 135: Add "management" to H1

**Context:** Adds `cloud kitchen management software` keyword. Natural phrasing —
cloud kitchens need management beyond just billing.

```jsx
// BEFORE (line 135):
                  Cloud kitchen POS & billing software — every brand, every aggregator, one screen.

// AFTER:
                  Cloud kitchen POS, billing & management software — every brand, every aggregator, one screen.
```

---

## FILE 3 — `src/pages/RestaurantBillingSoftware.jsx`

### Op 3 — Line 163: Add "bars" to feature card title

**Context:** Internal consistency fix. Line 128 of same file already says
"Built for restaurants, cafes, and bars." — this card was the only place that omitted bars.
Also adds `bars billing software` keyword signal.

```jsx
// BEFORE (line 163):
                { icon: "☕", title: "Restaurants AND cafes", body: "Dine-in, takeaway, delivery, QSR, cafe — same software, any format.", testid: "billing-feature-cafe" },

// AFTER:
                { icon: "☕", title: "Restaurants, cafes AND bars", body: "Dine-in, takeaway, delivery, QSR, cafe — same software, any format.", testid: "billing-feature-cafe" },
```

---

## EXECUTION ORDER

All 3 ops are in different files — can be run in parallel.

```
Step 1 — Run Ops 1, 2, 3 in parallel (independent files)
Step 2 — yarn build
Step 3 — sudo supervisorctl restart frontend
Step 4 — Run validation checks
```

---

## VALIDATION CHECKS (post-build)

```bash
# Op 1 — RestaurantPosSystem
grep -c "POS system & software" /app/frontend/build/restaurant-pos-system/index.html
# Expected: 1 or more

grep -c "POS system — orders" /app/frontend/build/restaurant-pos-system/index.html
# Expected: 0

# Op 2 — CloudKitchenPos
grep -c "billing & management software" /app/frontend/build/cloud-kitchen-pos/index.html
# Expected: 1 or more

grep -c "POS & billing software" /app/frontend/build/cloud-kitchen-pos/index.html
# Expected: 0

# Op 3 — RestaurantBillingSoftware
grep -c "Restaurants, cafes AND bars" /app/frontend/build/restaurant-billing-software/index.html
# Expected: 1

grep -c "Restaurants AND cafes" /app/frontend/build/restaurant-billing-software/index.html
# Expected: 0
```

---

## SUMMARY

| Op | File | Line | Change |
|---|---|---|---|
| 1 | `RestaurantPosSystem.jsx` | 132 | `POS system` → `POS system & software` |
| 2 | `CloudKitchenPos.jsx` | 135 | `POS & billing software` → `POS, billing & management software` |
| 3 | `RestaurantBillingSoftware.jsx` | 163 | `Restaurants AND cafes` → `Restaurants, cafes AND bars` |

**Total: 3 search_replace ops across 3 files + 1 rebuild**

---

*Plan written 2026-09-06. No code changed yet.*
*Next step: say "implement CR-227" to proceed.*
