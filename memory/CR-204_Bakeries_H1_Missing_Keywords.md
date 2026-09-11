# CR-204 — `/solutions/bakeries` h1 Missing CR-187 Keywords

**Registered:** 2026-09-02  
**Source:** Regression suite T3 — Dev build  
**Status:** 🔲 Open  
**Priority:** HIGH — Google Ads Quality Score / keyword relevance  
**Regression gate:** T3

---

## Symptom

The `/solutions/bakeries` page fails the CR-187 h1 keyword check:

```
Current h1:   "Bakery POS & management — from morning bread to custom cakes, run with precision."
Required:     BOTH "pos system" AND "billing software" must be present (case-insensitive)
Result:       FAIL — both keywords absent
```

---

## Root Cause

CR-187 applied the `& billing software` / `POS system` keyword pattern to **8 sectors** in `sectors.js`. The bakeries sector was not included in that batch.

**`sectors.js` line 270 (current):**
```js
h1: "Bakery POS & management — from morning bread to custom cakes, run with precision.",
```

Missing:
- `pos system` — uses "POS" but not "POS system"
- `billing software` — not present anywhere in the h1

**All other sectors updated by CR-187 (confirmed passing T3):**
restaurants ✅ · cafes ✅ · qsr ✅ · cloud-kitchens ✅ · food-courts ✅

**Bakeries:** explicitly noted in the T3 table in the regression brief as `❌ failing on all builds — open item`.

---

## Affected File

| File | Line | Field | Current value |
|---|---|---|---|
| `src/data/sectors.js` | L270 | `h1` | `"Bakery POS & management — from morning bread to custom cakes, run with precision."` |

---

## Fix Direction (no code — planning only)

Apply the same CR-187 pattern used on all other sectors — insert `POS system & billing software` to replace the current `POS & management` phrasing:

```js
// BEFORE
h1: "Bakery POS & management — from morning bread to custom cakes, run with precision.",

// AFTER (example — exact wording subject to owner review)
h1: "Bakery POS system & billing software — from morning bread to custom cakes, run with precision.",
```

**Character count:**
- Before: 79 chars  
- After: 94 chars (+15 chars — within safe h1 length)

**Keywords added:** `pos system` ×1, `billing software` ×1

**Note:** `management` is removed from the h1 with this change. It should remain present in the body copy (`sub`, `pains`, or `solutions` fields) — verify before implementing.

---

## Validation (post-fix)

```bash
python3 -c "
html = open('/app/frontend/build/solutions/bakeries/index.html').read().lower()
body = html[html.find('<body'):]
ps = body.count('pos system')
bs = body.count('billing software')
print(f'pos system={ps}  billing software={bs}')
print('PASS ✅' if ps >= 1 and bs >= 1 else 'FAIL ❌')
"
```

---

## Related CRs

| CR | Relation |
|---|---|
| CR-187 | Original batch that added POS system + billing software to 8 sectors — bakeries was not included |
| CR-189 | Extended keyword density on solution pages — same file (`sectors.js`) |
