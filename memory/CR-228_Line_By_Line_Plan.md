# CR-228 — Line-by-Line Implementation Plan
# PetpoojaAlternative Hero H1 + Subheadline Rewrite

**CR:** CR-228
**Status:** Plan written — awaiting dev execution
**Files:** 1 file (`src/data/vsp.js`), 2 search_replace operations, 1 rebuild

---

## PRE-FLIGHT CHECK

```bash
grep -n "variant_a" /app/frontend/src/data/vsp.js | head -5
# Expected:
# line 7:  variant_a: "The honest Petpooja alternative..."
# line 9:  variant_a_sub:

grep -n "honest Petpooja" /app/frontend/src/data/vsp.js
# Expected: line 7

grep -n "Petpooja runs 1.5" /app/frontend/src/data/vsp.js
# Expected: line 10
```

---

## FILE — `src/data/vsp.js`

### Op 1 — Line 7: Replace H1 (variant_a)

**Context:** "honest Petpooja alternative" has two problems:
(1) "honest" implies Petpooja is dishonest — legal/trademark risk.
(2) Assumes switching intent — alienates top-of-funnel visitors who just searched "petpooja".
New copy leads with MyGenie's value proposition. Works for all funnel stages.

```js
// BEFORE (line 7):
  variant_a: "The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie.",

// AFTER:
  variant_a: "The restaurant OS built for what billing software can't do — inventory, CRM, AI, all connected.",
```

---

### Op 2 — Lines 9–10: Replace subheadline (variant_a_sub)

**Context:** Current subheadline opens by naming Petpooja before the visitor has seen
any MyGenie value. New copy makes the same product differentiation point (billing software
vs full OS) without opening with the competitor name. Curious visitors discover the
difference rather than feeling lectured.

```js
// BEFORE (lines 9–10):
  variant_a_sub:
    "Petpooja runs 1.5 lakh restaurants. It's earned that. But a holistic OS — billing, inventory, expenses, customers and AI, all connected — is a different thing entirely.",

// AFTER:
  variant_a_sub:
    "Billing software and a restaurant operating system are different things. Here's what changes when billing, inventory, expenses, customers and AI all run in one connected system.",
```

---

## EXECUTION ORDER

Both ops are in the same file — run sequentially.

```
Step 1 — Op 1: variant_a string
Step 2 — Op 2: variant_a_sub string
Step 3 — yarn build
Step 4 — sudo supervisorctl restart frontend
Step 5 — Run validation checks
```

---

## VALIDATION CHECKS (post-build)

```bash
BUILD=/app/frontend/build/petpooja-alternative/index.html

# Op 1 — H1
grep -c "restaurant OS built for what billing software" $BUILD
# Expected: 1 or more

grep -c "honest Petpooja alternative" $BUILD
# Expected: 0

# Op 2 — Subheadline
grep -c "Billing software and a restaurant operating system" $BUILD
# Expected: 1 or more

grep -c "Petpooja runs 1.5 lakh" $BUILD
# Expected: 0
```

---

## WHAT IS NOT CHANGING

| Element | Value | Reason |
|---|---|---|
| Meta title | "Best Petpooja Alternative for Restaurants — MyGenie POS" | SEO — not visible on page |
| `variant_b` | "Most Indian restaurants run on Petpooja. Some of them switch to us." | Unchanged |
| `variant_b_sub` | "We don't say Petpooja is bad…" | Unchanged |
| CTA buttons | "Book a Free Demo →" / "See the comparison ↓" | Unchanged |

---

## SUMMARY

| Op | File | Line | Change |
|---|---|---|---|
| 1 | `src/data/vsp.js` | 7 | `variant_a` — H1 text |
| 2 | `src/data/vsp.js` | 9–10 | `variant_a_sub` — subheadline text |

**Total: 2 search_replace ops in 1 file + 1 rebuild**

---

*Plan written 2026-09-06. Owner approved both strings. No code changed yet.*
*Next step: say "implement CR-228" to proceed.*
