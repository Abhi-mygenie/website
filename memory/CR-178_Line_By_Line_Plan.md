# CR-178 — Line-by-Line Implementation Plan
## Homepage Keyword Density (17 Approved Copy Changes)

**Plan written:** 2026-09-01 — Planning Agent
**Impact analysis:** `/app/memory/CR-178_ImpactAnalysis.md`
**Approval decision:** `/app/memory/CR-178_Content_Approval_Decision.md`
**Status:** READY — no code changed. Awaiting "go ahead".
**Files touched:** 6 (Footer.jsx — explicitly NOT touched, Proposal 18 rejected)
**Rebuild required:** ✅ Yes — `yarn build` + `prerender.js` (57 routes) + frontend restart

---

## CRITICAL — Do Not Change

- `src/components/site/Footer.jsx` — Proposal 18 REJECTED. Tagline stays:
  `"The hospitality operating system. More profit. Less chaos. Total control — across every outlet."`
- Passing keywords already at target: "restaurant pos" (5x), "billing software" (5x),
  "restaurant management" (3x) — do NOT alter any text containing these phrases
- Zero changes near GTM/pushLead/dataLayer code

---

## Pre-flight Checklist

```bash
# A. Services running
sudo supervisorctl status
# Expected: backend RUNNING, frontend RUNNING

# B. Confirm zero occurrences of all 9 keywords right now
python3 -c "
import re
html = open('/app/frontend/build/index.html').read().lower()
for k in ['pos system','inventory management','restaurant billing','pos billing',
          'restaurant software','loyalty program','qr menu','table management','food business']:
    print(f'{len(re.findall(k,html)):2}x  {k}')
"
# Expected: all show 0x

# C. Spot-check exact lines before editing (verify unchanged since last read)
sed -n '20p' /app/frontend/src/components/home/Hero.jsx
# Expected: ...fallback="India's Restaurant POS & Billing Software"

sed -n '70p' /app/frontend/src/data/content.js
# Expected: ...desc: "Wrong bills, manual errors, and lost money at the counter."

sed -n '13p' /app/frontend/src/components/home/OutcomePillars.jsx
# Expected:   How MyGenie makes you money.
```

---

## Execution Order

```
STEP 1 → Edit Hero.jsx              (2 changes — Proposals 1, 2)
STEP 2 → Edit ProblemGrid.jsx       (1 change  — Proposal 3)
STEP 3 → Edit content.js            (11 changes — Proposals 4,5,7,9,10,11,12,13,14,15,16)
STEP 4 → Edit OutcomePillars.jsx    (1 change  — Proposal 6)
STEP 5 → Edit ModuleOverview.jsx    (1 change  — Proposal 8)
STEP 6 → Edit CtaDemo.jsx           (1 change  — Proposal 17)
STEP 7 → yarn build
STEP 8 → node scripts/prerender.js
STEP 9 → supervisorctl restart frontend
STEP 10 → Verify (3 gates)
```

Steps 1–6 are independent — can be applied in any order or in parallel.
Steps 7–10 must run in sequence after all edits are complete.

---

## STEP 1 — `src/components/home/Hero.jsx`

**Total lines:** 146. **Changes:** 2.

---

### Change 1-A — Line 20: Hero badge fallback text (Proposal 1)

**Exact current line 20:**
```jsx
            <EditableText id="home.hero.badge" fallback="India's Restaurant POS & Billing Software" />
```

**Exact after:**
```jsx
            <EditableText id="home.hero.badge" fallback="India's Restaurant POS System & Billing Software" />
```

**Diff:** `POS &` → `POS System &`
**Keyword added:** pos system ×1
**CMS override:** None stored for `home.hero.badge` — fallback renders. ✅
**Hot-reload:** ✅ (Hero.jsx is a direct import, not lazy)

**Checkpoint:** After hot-reload, browser DevTools → Elements → find `data-testid="hero-badge"` → inner text should contain "POS System".

**Rollback:** Revert `POS System &` → `POS &`

---

### Change 1-B — Line 38: Hero subtitle fallback text (Proposal 2)

**Exact current line 38:**
```jsx
              fallback={'MyGenie POS boosts profit by up to <span class="font-bold text-brand-orange">25%</span>,* stops revenue leakage, speeds up service, and gives owners total control of billing, kitchen, inventory, and customers — across every outlet.'}
```

**Exact after:**
```jsx
              fallback={'MyGenie POS boosts profit by up to <span class="font-bold text-brand-orange">25%</span>,* stops revenue leakage, speeds up service, and gives owners total control of billing, kitchen, inventory, and customers — across every food business.'}
```

**Diff:** `every outlet.` → `every food business.`
**Keyword added:** food business ×1
**CMS override:** None stored for `home.hero.subtitle` — fallback renders. ✅
**Note:** The `rich` prop on `EditableText` means the fallback string is rendered as HTML
(with the `<span>` tag for the orange "25%"). The `every food business.` part is plain text
at the end — no HTML escaping needed. ✅

**Checkpoint:** Page subtitle ends with "...across every food business."

**Rollback:** Revert `every food business.` → `every outlet.`

---

## STEP 2 — `src/components/home/ProblemGrid.jsx`

**Total lines:** 44. **Changes:** 1.

---

### Change 2-A — Line 16: Problem section description paragraph (Proposal 3)

**Exact current line 16:**
```jsx
              Every day, small leaks and slow processes quietly eat your profit. Here&apos;s what owners tell us keeps them up at night.
```

**Exact after:**
```jsx
              Every day, small leaks and slow processes quietly eat your profit. Here&apos;s what food business owners tell us keeps them up at night.
```

**Diff:** `what owners` → `what food business owners`
**Keyword added:** food business ×1
**Note:** `&apos;` already present in the original line for "Here's" — do not change it. Only change `owners` → `food business owners`.

**Checkpoint:** "Sound familiar?" section description contains "food business owners".

**Rollback:** Revert `food business owners` → `owners`

---

## STEP 3 — `src/data/content.js`

**Total lines:** 160. **Changes:** 11 (all within lines 69–133).

Apply all 11 changes to this single file. Each change is independent within the file.

---

### Change 3-A — Line 70: PAINS[0].desc (Proposal 4)

**Current line 70:**
```js
  { icon: "ReceiptText", title: "Billing mistakes", desc: "Wrong bills, manual errors, and lost money at the counter." },
```

**After:**
```js
  { icon: "ReceiptText", title: "Billing mistakes", desc: "Wrong restaurant billing, manual errors, and lost money at the counter." },
```

**Diff:** `"Wrong bills,` → `"Wrong restaurant billing,`
**Keyword added:** restaurant billing ×1

---

### Change 3-B — Line 76: PAINS[6].desc (Proposal 5)

**Current line 76:**
```js
  { icon: "Trash2", title: "Inventory wastage", desc: "Stock disappears and spoils before it becomes profit." },
```

**After:**
```js
  { icon: "Trash2", title: "Inventory wastage", desc: "Poor inventory management — stock disappears and spoils before it becomes profit." },
```

**Diff:** `"Stock disappears` → `"Poor inventory management — stock disappears`
**Keyword added:** inventory management ×1

---

### Change 3-C — Line 98: PILLARS[2].desc (Proposal 7)

**Current line 98:**
```js
  { icon: "Zap", title: "Serve Faster", desc: "Captain app, KOT/KDS, and scan-&-order clear queues and turn tables faster.", stat: "30%" },
```

**After:**
```js
  { icon: "Zap", title: "Serve Faster", desc: "Captain app, table management, QR menu, and KOT/KDS clear queues and turn tables faster.", stat: "30%" },
```

**Diff:** `KOT/KDS, and scan-&-order` → `table management, QR menu, and KOT/KDS`
**Keywords added:** table management ×1, qr menu ×1
**Note:** "KOT/KDS" stays in the list — moved to end. "scan-&-order" replaced by "QR menu" (industry-standard term for same feature).

---

### Changes 3-D to 3-F — Lines 118–120: MODULE_BUCKETS[0] (Proposals 9, 10, 11, 12)

**Current lines 118–120:**
```js
  { slug: "sell-serve", icon: "ShoppingBag", title: "Sell & Serve Faster", span: "lg:col-span-3",
    items: ["POS / Billing", "Captain / Waiter App", "KOT / KDS", "Scan & Order", "QSR Prepaid Ordering", "Takeaway & Delivery"],
    line: "Bill in seconds, send orders straight to the kitchen, and serve more covers per hour." },
```

**After:**
```js
  { slug: "sell-serve", icon: "ShoppingBag", title: "Sell & Serve Faster", span: "lg:col-span-3",
    items: ["POS Billing", "Captain App & Table Management", "KOT / KDS", "QR Menu & Scan Order", "QSR Prepaid Ordering", "Takeaway & Delivery"],
    line: "Restaurant billing in seconds — our POS system sends orders straight to the kitchen and serves more covers per hour." },
```

**Diffs:**
- `"POS / Billing"` → `"POS Billing"` → Keyword: pos billing ×1
- `"Captain / Waiter App"` → `"Captain App & Table Management"` → Keyword: table management ×1
- `"Scan & Order"` → `"QR Menu & Scan Order"` → Keyword: qr menu ×1
- `line: "Bill in seconds..."` → `line: "Restaurant billing in seconds — our POS system..."` → Keywords: restaurant billing ×1, pos system ×1

**Note on React keys:** Each chip string is a React key. New strings = React remounts chips. Visual result is identical. ✅

---

### Changes 3-G to 3-H — Lines 124–126: MODULE_BUCKETS[2] (Proposals 13, 14)

**Current lines 124–126:**
```js
  { slug: "customers", icon: "HeartHandshake", title: "Bring Customers Back", span: "lg:col-span-2",
    items: ["CRM", "Loyalty", "Coupons", "Wallet", "WhatsApp Automation", "Upsell Intelligence"],
    line: "Turn every bill into a customer who comes back." },
```

**After:**
```js
  { slug: "customers", icon: "HeartHandshake", title: "Bring Customers Back", span: "lg:col-span-2",
    items: ["CRM", "Loyalty Program", "Coupons", "Wallet", "WhatsApp Automation", "Upsell Intelligence"],
    line: "Turn every bill into a returning customer with a built-in loyalty program." },
```

**Diffs:**
- `"Loyalty"` → `"Loyalty Program"` → Keyword: loyalty program ×1
- `line: "Turn every bill into a customer who comes back."` → `line: "Turn every bill into a returning customer with a built-in loyalty program."` → Keyword: loyalty program ×1

---

### Changes 3-I to 3-J — Lines 127–129: MODULE_BUCKETS[3] (Proposals 15, 16)

**Current lines 127–129:**
```js
  { slug: "protect-profit", icon: "ShieldCheck", title: "Protect Your Profit", span: "lg:col-span-3",
    items: ["Inventory", "Central Inventory", "Audit Reports", "Smart Validations"],
    line: "Reduce wastage and catch leakage before it becomes profit loss." },
```

**After:**
```js
  { slug: "protect-profit", icon: "ShieldCheck", title: "Protect Your Profit", span: "lg:col-span-3",
    items: ["Inventory Management", "Central Inventory", "Audit Reports", "Smart Validations"],
    line: "Inventory management that reduces wastage and catches leakage before it becomes profit loss." },
```

**Diffs:**
- `"Inventory"` → `"Inventory Management"` → Keyword: inventory management ×1
- `line: "Reduce wastage..."` → `line: "Inventory management that reduces wastage..."` → Keyword: inventory management ×1

---

**Checkpoint after STEP 3 (hot-reload):**
- "Sell & Serve Faster" module card chips: shows "POS Billing", "Captain App & Table Management", "QR Menu & Scan Order"
- "Bring Customers Back" chips: shows "Loyalty Program"
- "Protect Your Profit" chips: shows "Inventory Management"
- "Billing mistakes" pain card text: starts with "Wrong restaurant billing..."
- "Inventory wastage" pain card text: starts with "Poor inventory management..."

**Rollback (content.js):** Revert all 11 string changes to their original values above.

---

## STEP 4 — `src/components/home/OutcomePillars.jsx`

**Total lines:** 53. **Changes:** 1.

---

### Change 4-A — Line 13: Section H2 heading (Proposal 6)

**Context (lines 12–14):**
```jsx
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              How MyGenie makes you money.
            </h2>
```

**Exact current line 13:**
```
              How MyGenie makes you money.
```

**Exact after:**
```
              How MyGenie's POS system makes you money.
```

**Diff:** `How MyGenie makes` → `How MyGenie's POS system makes`
**Keyword added:** pos system ×1
**Note on apostrophe:** Raw `'` in JSX text content is valid (confirmed from codebase — no escape needed). Do NOT use `&apos;` unless following a strict style preference.

**Checkpoint:** "Outcomes, not features" section H2 reads "How MyGenie's POS system makes you money."

**Rollback:** Revert `How MyGenie's POS system makes` → `How MyGenie makes`

---

## STEP 5 — `src/components/home/ModuleOverview.jsx`

**Total lines:** 56. **Changes:** 1.

---

### Change 5-A — Line 15: Section H2 heading (Proposal 8)

**Context (lines 14–16):**
```jsx
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              Not just billing. Your entire operation.
            </h2>
```

**Exact current line 15:**
```
              Not just billing. Your entire operation.
```

**Exact after:**
```
              Not just restaurant billing. Your entire operation.
```

**Diff:** `Not just billing.` → `Not just restaurant billing.`
**Keyword added:** restaurant billing ×1
**Note:** Zero rhythm change. "restaurant billing" is a two-word drop-in for "billing".

**Checkpoint:** "Everything in one OS" section H2 reads "Not just restaurant billing. Your entire operation."

**Rollback:** Revert `Not just restaurant billing.` → `Not just billing.`

---

## STEP 6 — `src/components/home/CtaDemo.jsx`

**Total lines:** 62. **Changes:** 1.

---

### Change 6-A — Lines 25–27: Section description paragraph (Proposal 17)

**Current lines 25–27:**
```jsx
            <p className="mt-4 text-lg text-brand-muted leading-relaxed">
              Every core tool is included by default — so you get everything you need to run a profitable outlet
              without paying extra for essentials. Get a customized quote and walkthrough for your business.
            </p>
```

**After:**
```jsx
            <p className="mt-4 text-lg text-brand-muted leading-relaxed">
              Our restaurant software includes every core tool — from POS billing and inventory management to
              loyalty programs — so you never pay extra for essentials. Get a customized quote and walkthrough
              for your business.
            </p>
```

**Diffs (same opening `<p>` tag, same closing `</p>` tag, only text content changes):**
- `Every core tool is included by default` → `Our restaurant software includes every core tool`
- `— so you get everything you need to run a profitable outlet without paying extra for essentials.` → `— from POS billing and inventory management to loyalty programs — so you never pay extra for essentials.`

**Keywords added:** restaurant software ×1, pos billing ×1, inventory management ×1, loyalty program ×1 (via "loyalty programs" plural — Google matches variants)

**Note:** The `INCLUDED` list (lines 6–13) and the "Build Your Plan" link (lines 39–49) are NOT changed. Only the `<p>` paragraph. ✅

**Checkpoint:** "One complete package" section description starts with "Our restaurant software includes every core tool..."

**Rollback:** Revert the paragraph text to original.

---

## STEP 7 — `yarn build`

```bash
cd /app/frontend && npx craco build 2>&1 | tail -8
```

**Expected:**
```
The build folder is ready to be deployed.
Done in XX.XXs.
```

**If compilation errors:**
- `SyntaxError` in content.js → check all string quotes are closed correctly (each `desc:` and `line:` value must end with `"`)
- `SyntaxError` in Hero.jsx → check the `fallback={...}` prop still uses a single-quoted JS string inside curly braces
- Module not found → no new imports added, this should not occur

**Never proceed to Step 8 if build fails.**

---

## STEP 8 — `node scripts/prerender.js`

```bash
cd /app/frontend && node scripts/prerender.js > /app/frontend/prerender_cr178.log 2>&1 &
echo "Prerender started. Monitor: tail -5 /app/frontend/prerender_cr178.log"
```

**Duration:** ~5–6 minutes (57 routes × ~5–6s each)

**When complete:**
```bash
tail -5 /app/frontend/prerender_cr178.log
wc -l /app/frontend/prerender_cr178.log
# Expected: last line = "prerendered /thank-you -> ..."
# Expected: 57 lines (one per route)
```

---

## STEP 9 — Restart frontend

```bash
sudo supervisorctl restart frontend && sleep 3 && sudo supervisorctl status frontend
# Expected: RUNNING
```

---

## STEP 10 — Verification Gates

### Gate A — All 9 keywords now present in built homepage

```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read().lower()
targets = {
    'pos system':           3,
    'inventory management': 3,
    'restaurant billing':   3,
    'pos billing':          2,
    'restaurant software':  1,
    'loyalty program':      2,
    'qr menu':              2,
    'table management':     2,
    'food business':        2,
}
all_pass = True
for kw, needed in targets.items():
    count = len(re.findall(kw, html))
    ok = count >= needed
    print(f\"{'PASS' if ok else 'FAIL'}  {count}x  {kw}  (need {needed}+)\")
    if not ok: all_pass = False
print()
print('ALL PASS' if all_pass else 'FAILURES — see above')
"
```

**Expected output:**
```
PASS  3x  pos system            (need 3+)
PASS  4x  inventory management  (need 3+)
PASS  3x  restaurant billing    (need 3+)
PASS  2x  pos billing           (need 2+)
PASS  1x  restaurant software   (need 1+)
PASS  3x  loyalty program       (need 2+)
PASS  2x  qr menu               (need 2+)
PASS  2x  table management      (need 2+)
PASS  2x  food business         (need 2+)
ALL PASS
```

---

### Gate B — Passing keywords NOT degraded

```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read().lower()
for kw, needed in [('restaurant pos',3),('billing software',3),('restaurant management',3)]:
    count = len(re.findall(kw, html))
    print(f\"{'PASS' if count >= needed else 'FAIL REGRESSION'}  {count}x  {kw}  (must stay {needed}+)\")
"
```

**Expected:** All 3 PASS with same or higher counts as baseline.

---

### Gate C — Homepage title, canonical, and footer tagline unchanged

```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
title = re.search(r'<title>(.*?)</title>', html).group(1)
canon = re.search(r'<link rel=\"canonical\" href=\"([^\"]*)\"', html).group(1)
footer_ok = 'hospitality operating system' in html.lower()
print('PASS title' if 'Restaurant POS' in title else 'FAIL title', '->', title[:60])
print('PASS canon' if canon.endswith('/') else 'FAIL canon', '->', canon)
print('PASS footer tagline unchanged' if footer_ok else 'FAIL footer tagline changed')
"
```

**Expected:**
```
PASS title -> Restaurant POS & Billing Software | MyGenie
PASS canon -> https://www.mygenie.online/
PASS footer tagline unchanged
```

---

## Complete Change Summary Table

| Step | File | Proposals | What changes | Keywords gained |
|---|---|---|---|---|
| 1 | `Hero.jsx` line 20 | 1 | `POS &` → `POS System &` | pos system |
| 1 | `Hero.jsx` line 38 | 2 | `every outlet.` → `every food business.` | food business |
| 2 | `ProblemGrid.jsx` line 16 | 3 | `what owners` → `what food business owners` | food business |
| 3 | `content.js` line 70 | 4 | PAINS[0].desc: `Wrong bills` → `Wrong restaurant billing` | restaurant billing |
| 3 | `content.js` line 76 | 5 | PAINS[6].desc: prepend `Poor inventory management — ` | inventory management |
| 3 | `content.js` line 98 | 7 | PILLARS[2].desc: `KOT/KDS, and scan-&-order` → `table management, QR menu, and KOT/KDS` | table management, qr menu |
| 3 | `content.js` line 119 | 9 | MODULE_BUCKETS[0].items[0]: `POS / Billing` → `POS Billing` | pos billing |
| 3 | `content.js` line 119 | 10 | MODULE_BUCKETS[0].items[1]: `Captain / Waiter App` → `Captain App & Table Management` | table management |
| 3 | `content.js` line 119 | 11 | MODULE_BUCKETS[0].items[3]: `Scan & Order` → `QR Menu & Scan Order` | qr menu |
| 3 | `content.js` line 120 | 12 | MODULE_BUCKETS[0].line: `Bill in seconds` → `Restaurant billing in seconds — our POS system sends...` | restaurant billing, pos system |
| 3 | `content.js` line 125 | 13 | MODULE_BUCKETS[2].items[1]: `Loyalty` → `Loyalty Program` | loyalty program |
| 3 | `content.js` line 126 | 14 | MODULE_BUCKETS[2].line: add `loyalty program` at end | loyalty program |
| 3 | `content.js` line 128 | 15 | MODULE_BUCKETS[3].items[0]: `Inventory` → `Inventory Management` | inventory management |
| 3 | `content.js` line 129 | 16 | MODULE_BUCKETS[3].line: prepend `Inventory management that` | inventory management |
| 4 | `OutcomePillars.jsx` line 13 | 6 | H2: `How MyGenie makes` → `How MyGenie's POS system makes` | pos system |
| 5 | `ModuleOverview.jsx` line 15 | 8 | H2: `Not just billing.` → `Not just restaurant billing.` | restaurant billing |
| 6 | `CtaDemo.jsx` lines 25–27 | 17 | Description paragraph rewrite | restaurant software, pos billing, inventory management, loyalty program |

**1 `yarn build` · 1 prerender (57 routes) · 1 restart · 3 verification gates**

---

## Rollback Plan

```bash
cd /app/frontend
git checkout src/components/home/Hero.jsx
git checkout src/components/home/ProblemGrid.jsx
git checkout src/data/content.js
git checkout src/components/home/OutcomePillars.jsx
git checkout src/components/home/ModuleOverview.jsx
git checkout src/components/home/CtaDemo.jsx
npx craco build && node scripts/prerender.js && sudo supervisorctl restart frontend
```

---

*Plan written 2026-09-01. Planning Agent. All 6 target files verified at exact line numbers before writing. No code changed. Awaiting "go ahead".*
