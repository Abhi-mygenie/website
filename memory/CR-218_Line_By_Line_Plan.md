# CR-218 — Line-by-Line Plan: QAPage Missing `answerCount`

**CR:** CR-218
**Date:** 2026-09-05
**Status:** Ready to implement
**Scope:** 5 files, 11 search_replace calls
**Risk:** Zero — JSON-LD only, no visual change, no component logic change

---

## Pre-flight Checks

```bash
# 1. Confirm answerCount absent in built homepage schema
python3 -c "
import json, re
html = open('/app/frontend/build/index.html').read()
for s in re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL):
    try:
        d = json.loads(s)
        if d.get('@type') == 'QAPage':
            q = d['mainEntity'][0]
            print('answerCount present:', 'answerCount' in q)  # Expected: False
    except: pass
"

# 2. Confirm 5 files are the only ones with QAPage
grep -rn "QAPage" /app/frontend/src/ --include="*.jsx" --include="*.js" -l
# Expected: seo.js, SectorPage.jsx, AiPage.jsx, ProductPage.jsx, Resources.jsx

# 3. Current build hash
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: main.7d5ff572.js
```

---

## BLOCK 1 — `src/lib/seo.js` (7 edits)

All 7 Question blocks need `answerCount: 1` added after `"@type": "Question"` line,
and `upvoteCount: 0` added to each acceptedAnswer block.

---

### Edit 1 — Q1: UPI QR codes (seo.js L89–96)

**old_str:**
```
    {
      "@type": "Question",
      name: "Does the POS support dynamic UPI QR codes per bill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly.",
      },
    },
```

**new_str:**
```
    {
      "@type": "Question",
      name: "Does the POS support dynamic UPI QR codes per bill?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly.",
      },
    },
```

---

### Edit 2 — Q2: Ingredient inventory (seo.js L97–104)

**old_str:**
```
    {
      "@type": "Question",
      name: "Can it track inventory down to ingredient level?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie tracks stock at recipe and ingredient level using Bill of Materials (BOM) costing. Every dish sold automatically deducts the right quantities from raw ingredient stock — so you always know what's left, what was wasted, and what the per-dish cost is.",
      },
    },
```

**new_str:**
```
    {
      "@type": "Question",
      name: "Can it track inventory down to ingredient level?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie tracks stock at recipe and ingredient level using Bill of Materials (BOM) costing. Every dish sold automatically deducts the right quantities from raw ingredient stock — so you always know what's left, what was wasted, and what the per-dish cost is.",
      },
    },
```

---

### Edit 3 — Q3: Multi-outlet management (seo.js L105–112)

**old_str:**
```
    {
      "@type": "Question",
      name: "Does it support multi-outlet management?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The owner dashboard shows live sales, inventory and KPIs across every outlet from one screen on your phone. You can manage stock transfers between outlets, set outlet-specific menus, and control staff access by location — all from a single login.",
      },
    },
```

**new_str:**
```
    {
      "@type": "Question",
      name: "Does it support multi-outlet management?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. The owner dashboard shows live sales, inventory and KPIs across every outlet from one screen on your phone. You can manage stock transfers between outlets, set outlet-specific menus, and control staff access by location — all from a single login.",
      },
    },
```

---

### Edit 4 — Q4: Reports (seo.js L113–120)

**old_str:**
```
    {
      "@type": "Question",
      name: "What kind of reports can be generated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MyGenie generates daily sales, item-wise, payment-mode, staff performance, wastage, audit and GST/VAT reports — automatically. Reports arrive on WhatsApp at close of day without logging in. Owners also get recipe-level P&L showing the exact margin on every dish sold.",
      },
    },
```

**new_str:**
```
    {
      "@type": "Question",
      name: "What kind of reports can be generated?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "MyGenie generates daily sales, item-wise, payment-mode, staff performance, wastage, audit and GST/VAT reports — automatically. Reports arrive on WhatsApp at close of day without logging in. Owners also get recipe-level P&L showing the exact margin on every dish sold.",
      },
    },
```

---

### Edit 5 — Q5: Legacy vs cloud POS (seo.js L121–128)

**old_str:**
```
    {
      "@type": "Question",
      name: "What are the differences between a legacy and a cloud-based POS system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A legacy POS stores data on a local machine — if it crashes, data is lost, and you can only access reports on-site. A cloud POS like MyGenie stores everything securely online: you get live reports from your phone anywhere, automatic updates with no IT cost, and the system keeps working even if the internet drops (local-first billing). Cloud POS also integrates directly with Swiggy, Zomato and payment gateways — legacy systems typically cannot.",
      },
    },
```

**new_str:**
```
    {
      "@type": "Question",
      name: "What are the differences between a legacy and a cloud-based POS system?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "A legacy POS stores data on a local machine — if it crashes, data is lost, and you can only access reports on-site. A cloud POS like MyGenie stores everything securely online: you get live reports from your phone anywhere, automatic updates with no IT cost, and the system keeps working even if the internet drops (local-first billing). Cloud POS also integrates directly with Swiggy, Zomato and payment gateways — legacy systems typically cannot.",
      },
    },
```

---

### Edit 6 — Q6: Delivery platforms (seo.js L129–136)

**old_str:**
```
    {
      "@type": "Question",
      name: "Can the POS integrate with delivery platforms?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie integrates directly with Swiggy and Zomato — orders from both platforms flow straight into the POS and kitchen screen without manual entry. You can also take direct commission-free delivery orders through your own ordering link.",
      },
    },
```

**new_str:**
```
    {
      "@type": "Question",
      name: "Can the POS integrate with delivery platforms?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie integrates directly with Swiggy and Zomato — orders from both platforms flow straight into the POS and kitchen screen without manual entry. You can also take direct commission-free delivery orders through your own ordering link.",
      },
    },
```

---

### Edit 7 — Q7: End-to-end P&L (seo.js L137–144)

**old_str:**
```
    {
      "@type": "Question",
      name: "Can the POS measure end-to-end P&L?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie tracks P&L at item level — every dish sold shows its revenue, ingredient cost and margin in real time. Combined with purchase costs, wastage data and inter-outlet transfers, owners get a complete picture of profitability across every outlet without assembling spreadsheets.",
      },
    },
```

**new_str:**
```
    {
      "@type": "Question",
      name: "Can the POS measure end-to-end P&L?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie tracks P&L at item level — every dish sold shows its revenue, ingredient cost and margin in real time. Combined with purchase costs, wastage data and inter-outlet transfers, owners get a complete picture of profitability across every outlet without assembling spreadsheets.",
      },
    },
```

---

## Post-seo.js Verification

```bash
python3 -c "
import re
content = open('/app/frontend/src/lib/seo.js').read()
# Find QAPage block
qa = content[content.find('HOMEPAGE_QA_JSONLD'):content.find('PAGE_SEO')]
q_count = qa.count('\"@type\": \"Question\"')
ac_count = qa.count('answerCount: 1')
uv_count = qa.count('upvoteCount: 0')
print(f'Questions: {q_count} (expected 7)')
print(f'answerCount: {ac_count} (expected 7)')
print(f'upvoteCount: {uv_count} (expected 7)')
print('PASS' if q_count == ac_count == uv_count == 7 else 'FAIL')
"
```

---

## BLOCK 2 — `src/pages/SectorPage.jsx` (1 edit, L66)

**old_str:**
```
    mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
```

**new_str:**
```
    mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, answerCount: 1, acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a } })),
```

**Verification:**
```bash
grep -c "answerCount: 1" /app/frontend/src/pages/SectorPage.jsx
# Expected: 1
```

---

## BLOCK 3 — `src/pages/AiPage.jsx` (1 edit, L102)

**old_str:**
```
    mainEntity: AI_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
```

**new_str:**
```
    mainEntity: AI_FAQS.map((f) => ({ "@type": "Question", name: f.q, answerCount: 1, acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a } })),
```

**Verification:**
```bash
grep -c "answerCount: 1" /app/frontend/src/pages/AiPage.jsx
# Expected: 1
```

---

## BLOCK 4 — `src/pages/ProductPage.jsx` (1 edit, L59)

**old_str:**
```
    mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
```

**new_str:**
```
    mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, answerCount: 1, acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a } })),
```

**Verification:**
```bash
grep -c "answerCount: 1" /app/frontend/src/pages/ProductPage.jsx
# Expected: 1
```

---

## BLOCK 5 — `src/pages/Resources.jsx` (1 edit, L65–68)

**old_str:**
```
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
```

**new_str:**
```
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      answerCount: 1,
      acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a },
    })),
```

**Verification:**
```bash
grep -c "answerCount: 1" /app/frontend/src/pages/Resources.jsx
# Expected: 1
```

---

## Full Post-Edit Verification (run before rebuild)

```bash
# All 5 files have answerCount
echo "answerCount counts:"
grep -c "answerCount: 1" /app/frontend/src/lib/seo.js          # Expected: 7
grep -c "answerCount: 1" /app/frontend/src/pages/SectorPage.jsx # Expected: 1
grep -c "answerCount: 1" /app/frontend/src/pages/AiPage.jsx     # Expected: 1
grep -c "answerCount: 1" /app/frontend/src/pages/ProductPage.jsx # Expected: 1
grep -c "answerCount: 1" /app/frontend/src/pages/Resources.jsx  # Expected: 1

echo "upvoteCount counts:"
grep -c "upvoteCount: 0" /app/frontend/src/lib/seo.js           # Expected: 7
grep -c "upvoteCount: 0" /app/frontend/src/pages/SectorPage.jsx # Expected: 1
grep -c "upvoteCount: 0" /app/frontend/src/pages/AiPage.jsx     # Expected: 1
grep -c "upvoteCount: 0" /app/frontend/src/pages/ProductPage.jsx # Expected: 1
grep -c "upvoteCount: 0" /app/frontend/src/pages/Resources.jsx  # Expected: 1

# No QAPage file is still missing answerCount
grep -rn "QAPage" /app/frontend/src/ --include="*.jsx" --include="*.js" -l | while read f; do
  count=$(grep -c "answerCount" "$f" 2>/dev/null || echo 0)
  echo "$f → answerCount occurrences: $count"
done
```

---

## Rebuild

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr218.log 2>&1 &
echo "PID=$!"
tail -f /app/memory/build-cr218.log
```

---

## Restart

```bash
sudo supervisorctl restart frontend && sleep 4 && sudo supervisorctl status frontend
```

---

## Post-Build Validation

```bash
python3 << 'EOF'
import json, re, os

pages_to_check = [
    ('/app/frontend/build/index.html', 'homepage', 7),
    ('/app/frontend/build/solutions/restaurants/index.html', 'restaurants', 3),
    ('/app/frontend/build/solutions/cafes/index.html', 'cafes', 3),
    ('/app/frontend/build/ai/index.html', 'ai', 5),
    ('/app/frontend/build/resources/index.html', 'resources', 9),
    ('/app/frontend/build/product/sell-serve/index.html', 'sell-serve', 1),
]

all_pass = True
for path, name, expected_q in pages_to_check:
    html = open(path).read()
    schemas = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    found = False
    for s in schemas:
        try:
            d = json.loads(s)
            if d.get('@type') == 'QAPage':
                found = True
                questions = d.get('mainEntity', [])
                missing_ac = [q for q in questions if 'answerCount' not in q]
                missing_uv = [q for q in questions if 'upvoteCount' not in q.get('acceptedAnswer', {})]
                ok = len(missing_ac) == 0
                if not ok: all_pass = False
                status = "✅" if ok else "❌"
                print(f"{status} {name}: {len(questions)} questions, "
                      f"answerCount missing={len(missing_ac)}, "
                      f"upvoteCount missing={len(missing_uv)}")
        except: pass
    if not found:
        print(f"⚠️  {name}: no QAPage schema found")

print()
print("OVERALL:", "PASS ✅" if all_pass else "FAIL ❌")
EOF
```

**Expected output:**
```
✅ homepage: 7 questions, answerCount missing=0, upvoteCount missing=0
✅ restaurants: 3 questions, answerCount missing=0, upvoteCount missing=0
✅ cafes: 3 questions, answerCount missing=0, upvoteCount missing=0
✅ ai: 5 questions, answerCount missing=0, upvoteCount missing=0
✅ resources: 9 questions, answerCount missing=0, upvoteCount missing=0
✅ sell-serve: 1 questions, answerCount missing=0, upvoteCount missing=0

OVERALL: PASS ✅
```

---

## Rollback

Revert all 11 edits (remove `answerCount: 1` and `upvoteCount: 0` from each location) and rebuild.

---

## Edit Count Summary

| # | File | Edit | Lines |
|---|---|---|---|
| 1 | `seo.js` | Q1 UPI QR — add answerCount + upvoteCount | L89–96 |
| 2 | `seo.js` | Q2 Inventory — add answerCount + upvoteCount | L97–104 |
| 3 | `seo.js` | Q3 Multi-outlet — add answerCount + upvoteCount | L105–112 |
| 4 | `seo.js` | Q4 Reports — add answerCount + upvoteCount | L113–120 |
| 5 | `seo.js` | Q5 Legacy vs cloud — add answerCount + upvoteCount | L121–128 |
| 6 | `seo.js` | Q6 Delivery platforms — add answerCount + upvoteCount | L129–136 |
| 7 | `seo.js` | Q7 P&L — add answerCount + upvoteCount | L137–144 |
| 8 | `SectorPage.jsx` | inline `.map()` — add both fields | L66 |
| 9 | `AiPage.jsx` | inline `.map()` — add both fields | L102 |
| 10 | `ProductPage.jsx` | inline `.map()` — add both fields | L59 |
| 11 | `Resources.jsx` | multi-line `.map()` — add both fields | L65–68 |

**Total: 11 search_replace calls, 5 files, 1 rebuild.**

*Plan complete — 2026-09-05. Ready to implement on instruction.*
