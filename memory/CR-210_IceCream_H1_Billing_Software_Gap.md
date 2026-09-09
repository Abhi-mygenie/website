# CR-210 — Ice Cream & Desserts H1 Missing "POS system & billing software"

**Registered:** 2026-09-05
**Source:** Post-CR-187 audit — `/solutions/ice-cream-desserts` H1 still missing keywords
**Status:** 🔲 Open — Ready to implement
**Priority:** P1
**Owner:** Agent (code + rebuild)
**File:** `src/data/sectors.js` — 1 line edit

---

## 1. Problem

CR-187 fixed the H1 keyword gap on **8 sectors** (restaurants, cafes, qsr, cloud-kitchens,
hotels-resorts, food-courts, canteens, chains). The `ice-cream-desserts` sector was the 11th
and last sector in `SECTOR_ORDER` and was not included in CR-187's scope.

The result: every other sector page has `"POS system & billing software"` in its H1.
Ice cream & desserts does not.

**Current H1 (sectors.js line 299):**
```
"Ice cream shop POS — serve sweet moments fast and keep every scoop profitable."
```

**Pattern used by all other 10 sectors:**
```
"[Sector] POS system & billing software — [value proposition]"
```

**Body keyword counts on /solutions/ice-cream-desserts today:**

| Keyword | Body count | In title tag |
|---|---|---|
| `billing software` | 0 ✗ | ✅ |
| `pos system` | 0 ✗ | ✅ |

Both keywords appear in the meta title (`Ice Cream & Desserts POS System & Billing Software | MyGenie`)
but neither appears in the page body — the same gap CR-187 fixed for all other sectors.

---

## 2. Root Cause

CR-187's line-by-line plan explicitly listed 8 sectors to fix. `ice-cream-desserts` was
not listed. Not an oversight in the sector data — the data was written without the standard
keyword pattern before CR-187 was conceived.

---

## 3. Architecture Confirmation

From CR-187 investigation (still valid):

- `h1` field in `sectors.js` is **NOT CMS-overridden** on ice-cream-desserts
- `SectorPage.jsx:94` renders `h1` as the visible `<h1>` heading: `<EditableText id={...} fallback={doc.hero.h1} block />`
- Changing `h1` affects **only** the visible heading — zero impact on meta description (`sub`), JSON-LD, title tag, or any other field
- `sub` field (meta description) is 139ch — well within 160ch limit, not touched

---

## 4. The Fix

**File:** `src/data/sectors.js`
**Line:** 299
**Tool:** `search_replace`

### old_str:
```
    h1: "Ice cream shop POS — serve sweet moments fast and keep every scoop profitable.",
```

### new_str:
```
    h1: "Ice cream shop POS system & billing software — serve sweet moments fast and keep every scoop profitable.",
```

**What changes:** `POS —` → `POS system & billing software —`
**Characters added:** +26ch (from 81ch to 107ch)
**Keywords added:** `pos system` ×1, `billing software` ×1

---

## 5. Pre-flight Check

```bash
# Confirm exact old_str at line 299
sed -n '299p' /app/frontend/src/data/sectors.js
# Expected: h1: "Ice cream shop POS — serve sweet moments fast and keep every scoop profitable.",

# Confirm ice-cream-desserts is the only sector still missing the keywords
grep 'h1:' /app/frontend/src/data/sectors.js | grep -v "billing software"
# Expected: only the ice-cream-desserts line (line 299)
```

---

## 6. Post-edit Verification

```bash
# Confirm fix applied
sed -n '299p' /app/frontend/src/data/sectors.js
# Expected: h1: "Ice cream shop POS system & billing software — ..."

# Confirm ALL sectors now have billing software in h1
grep 'h1:' /app/frontend/src/data/sectors.js | grep -v "billing software"
# Expected: NO OUTPUT (all 11 sectors now have the keyword)
```

---

## 7. Post-build Validation

```bash
python3 -c "
html = open('/app/frontend/build/solutions/ice-cream-desserts/index.html').read()
body = html[html.lower().find('<body'):].lower()
import re
m = re.search(r'<meta name=\"description\" content=\"(.*?)\"', html)
desc_len = len(m.group(1).replace('&amp;','&')) if m else 0
print('billing software:', body.count('billing software'), '(target ≥1)')
print('pos system:', body.count('pos system'), '(target ≥1)')
print('meta desc length:', desc_len, 'ch (limit 160)')
"
# Expected: billing software ≥1, pos system ≥1, meta desc ≤160ch
```

---

## 8. Rebuild

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr210.log 2>&1 &
sudo supervisorctl restart frontend
```

---

## 9. Rollback

Revert `search_replace` (swap new_str → old_str) and rebuild.

---

## 10. Summary

| Item | Detail |
|---|---|
| File | `src/data/sectors.js` |
| Line | 299 |
| Edit | 1 search_replace |
| New files | None |
| React changes | None |
| Rebuild required | Yes |
| Expected SEO gain | Keyword consistency on /solutions/ice-cream-desserts (H1 ↔ title ↔ ad) |
| Risk | Zero |

*Registered 2026-09-05. Gap identified in post-CR-187 audit. E1 Agent.*
*Related: `/app/memory/CR-187_Line_By_Line_Plan.md`*
