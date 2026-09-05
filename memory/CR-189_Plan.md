# CR-189 — Solutions Pages: Additional Keyword Gaps (Beyond CR-187)

**Date registered:** 2026-09-02
**Status:** READY TO IMPLEMENT (coordinate with CR-187)
**Priority:** P1
**Source:** Sep 2026 audit screenshot — confirmed against live prerendered build

---

## Relationship to CR-187

CR-187 addresses `billing software` and `pos system` via **h1 field edits** in `sectors.js`.
CR-189 addresses **additional, different keywords** per solution page via **body copy sentences** in the same file.

They target different fields and can be implemented independently. However, implementing together in one build is more efficient.

**Important:** The auditor's suggested sentences (below) each naturally contain MULTIPLE keywords — some of those keywords overlap with CR-187's targets (`billing software`, `pos system`). Implementing CR-189 with the auditor's suggested copy will add a second body occurrence of those CR-187 keywords, reinforcing keyword density beyond the h1 alone.

---

## Confirmed Gaps (all verified against live prerendered build)

| Page | Missing Keywords | Confirmed Count |
|---|---|---|
| `/solutions/restaurants` | `inventory management` | 0 |
| `/solutions/cafes` | `cafe pos`, `table management` | 0, 0 |
| `/solutions/qsr` | `qr menu`, `quick service` | 0, 0 |
| `/solutions/hotels-resorts` | `hotel billing`, `property management`, `hotel management` | 0, 0, 0 |
| `/solutions/canteens` | `canteen pos` | 0 |
| `/solutions/chains` | `chain pos`, `multi-location` | 0, 0 |

**Not in scope** (covered by CR-187 or already present): `billing software` and `pos system` — CR-187 adds them via h1 edits. CR-189 sentences can reinforce them further.

---

## Fix Approach

Add one natural body sentence per page that covers the missing keyword(s). Sentences must be added to `sectors.js` — specifically into the `solutions[].desc` field of an existing feature card (most natural) or into a `pains[].desc` if contextually appropriate.

**CR-181 constraint:** `sub` field is NOT to be edited (meta description dual-use, at/near 160ch limit on several pages).
**CR-187 constraint:** `h1` is being edited separately — no duplication needed here.

---

## Per-Page Auditor-Suggested Copy & Source Field

### /solutions/restaurants (L17–22 in sectors.js)

**Gap:** `inventory management` (0)

**Suggested sentence:**
> "Built-in inventory management tracks ingredients in real time so you never 86 an item mid-service."

**Insert into:** `solutions[2]` (currently: "Recipe-level P&L") → add to `desc`, or `solutions[3]` (CRM & Loyalty) → or add a new sentence to the existing Recipe-level P&L desc.

Best fit: Expand `solutions[2].desc` (L20):
- Current: `"Restaurant management reporting — profit by item and table, optimized by the rupee."`
- Extended: Keep existing + add "Inventory management gives you real-time ingredient costs per dish."

---

### /solutions/cafes (L46–51 in sectors.js)

**Gaps:** `cafe pos` (0), `table management` (0)

**Suggested sentence:**
> "MyGenie is the cafe POS system built for fast turnarounds — table management, billing software, and QR ordering from one dashboard."

*(Also reinforces `billing software` + `pos system` from CR-187)*

**Insert into:** `solutions[0].desc` (L47 — "Mobile-first billing"):
- Current: `"Run on a few phones with QR menu ordering — no expensive hardware. Go live in under 48 hours."`
- Best location: New sentence in solutions[1] (Recipe & inventory) desc, or solutions[0] extended.

---

### /solutions/qsr (L75–80 in sectors.js)

**Gaps:** `qr menu` (0), `quick service` (0)

**Suggested sentence:**
> "MyGenie QSR POS system and billing software speeds up counter service — QR menu, fast billing and cash drawer control all in one."

*(Also reinforces `billing software` + `pos system` from CR-187)*

**Insert into:** `solutions[1].desc` (L77 — "Scan & Order"):
- Current: `"Guests order from their phone — fewer staff, faster flow."`
- Extended: "Guests scan the QR menu and order from their phone — quick service, fewer staff, faster flow."

Or extend `solutions[0].desc` (QSR prepaid ordering) with "quick service" naturally.

---

### /solutions/hotels-resorts (L133–138 in sectors.js)

**Gaps:** `hotel billing` (0), `property management` (0), `hotel management` (0)

**Suggested sentence:**
> "MyGenie hotel billing software handles room service, restaurant, spa and bar on one POS — complete property management from your phone."

*(Also reinforces `billing software` from CR-187)*

**Insert into:** `solutions[0].desc` (L134 — "Hotel / room billing"):
- Current: `"One consolidated bill at checkout across every department."`
- Extended: "Hotel billing software generates one consolidated bill at checkout across every department — rooms, restaurant, spa and bar."

And extend `solutions[3].desc` (Owner dashboard) with "hotel management" or "property management":
- Current: `"See rooms, F&B and services live, from anywhere."`
- Extended: "Hotel management dashboard — see rooms, F&B and services live from anywhere, on your phone."

---

### /solutions/canteens (L191–196 in sectors.js)

**Gap:** `canteen pos` (0)

**Suggested sentence:**
> "MyGenie canteen POS and billing software handles prepaid wallets, subsidized meals and fully auditable accounts — zero leakage guaranteed."

*(Also reinforces `billing software` + `pos system` from CR-187)*

**Insert into:** `solutions[0].desc` (L192 — "Wallet & prepaid"):
- Current: `"Load balances and deduct per meal automatically."`
- Extended: "Canteen POS loads balances and deducts per meal automatically — zero manual tracking, zero disputes."

---

### /solutions/chains (L220–225 in sectors.js)

**Gaps:** `chain pos` (0), `multi-location` (0)

**Suggested sentence:**
> "A single multi-location POS system and billing software for your entire chain — franchise-ready, cloud-based and fully auditable."

*(Also reinforces `billing software` + `pos system` from CR-187)*

**Insert into:** `solutions[3].desc` (L224 — "Multi-outlet dashboard"):
- Current: `"Every outlet's performance, live, in one view."`
- Extended: "Multi-location dashboard — every outlet's performance, live, in one view across your entire chain."

---

## Files Changed

| # | File | Lines touched |
|---|---|---|
| 1 | `src/data/sectors.js` | `solutions[].desc` fields: L20, L47 (or L48), L77, L134, L224 + hotels-resorts solutions |

---

## CR-181 Constraint Check

All edits are in `solutions[].desc` — these are **not** used as meta descriptions. CR-181 constraints are fully preserved. ✅

---

## Verification Gate (after build)

```python
python3 << 'EOF'
import os, re

checks = {
    'solutions/restaurants': ['inventory management'],
    'solutions/cafes':       ['cafe pos','table management'],
    'solutions/qsr':         ['qr menu','quick service'],
    'solutions/hotels-resorts': ['hotel billing','property management','hotel management'],
    'solutions/canteens':    ['canteen pos'],
    'solutions/chains':      ['chain pos','multi-location'],
}
base = '/app/frontend/build'
all_pass = True
for slug, kws in checks.items():
    html = open(f'{base}/{slug}/index.html').read()
    body = html[html.find('<body'):].lower()
    for kw in kws:
        cnt = body.count(kw)
        ok = cnt >= 1
        if not ok: all_pass = False
        print(f'  {"✅" if ok else "❌"} /{slug}: {kw}={cnt}')
print()
print('OVERALL:', 'PASS ✅' if all_pass else 'FAIL ❌')
EOF
```

---

*Plan registered 2026-09-02. 1 file (`sectors.js`), 6–8 solutions[].desc edits across 6 sector pages.*
