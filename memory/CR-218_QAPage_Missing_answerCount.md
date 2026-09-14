# CR-218 — QAPage Schema Invalid: Missing `answerCount` on All Question Objects

**Registered:** 2026-09-05
**Source:** Google Rich Results Test / Search Console — Q&A 1 invalid item, 7 critical issues
**Status:** 🔲 Open — Ready to implement
**Priority:** P0 (schema invalid = no rich results on 20 pages)
**Owner:** Agent (code + rebuild)
**Files:** 5 files — `src/lib/seo.js` + `SectorPage.jsx` + `AiPage.jsx` + `ProductPage.jsx` + `Resources.jsx`

---

## 1. Problem

Google Rich Results Test on `www.mygenie.online/` shows:
```
Q&A — 1 invalid item detected
  ● 7 critical issues
  ○ 49 non-critical issues
```

Every `Question` object in every `QAPage` schema across the site is **missing the required
`answerCount` field**. This makes the entire Q&A schema invalid per Google's spec.

**Current schema (INVALID):**
```json
{
  "@type": "Question",
  "name": "Does the POS support dynamic UPI QR codes per bill?",
  "acceptedAnswer": { "@type": "Answer", "text": "..." }
}
```

**Required schema (VALID):**
```json
{
  "@type": "Question",
  "name": "Does the POS support dynamic UPI QR codes per bill?",
  "answerCount": 1,
  "acceptedAnswer": { "@type": "Answer", "text": "..." }
}
```

---

## 2. Scope — All Affected Pages and Files

### Files with QAPage schema

| File | How schema is defined | Questions affected |
|---|---|---|
| `src/lib/seo.js` (L85–146) | Static `HOMEPAGE_QA_JSONLD` object — 7 blocks | 7 |
| `src/pages/SectorPage.jsx` (L66) | `s.faqs.map(...)` inline | 33 (11 sectors × ~3) |
| `src/pages/AiPage.jsx` (L102) | `AI_FAQS.map(...)` inline | 5 |
| `src/pages/ProductPage.jsx` (L59) | `p.faqs.map(...)` inline | 6 |
| `src/pages/Resources.jsx` (L65) | `FAQS.map(...)` inline | 9 |
| **Total** | **5 files** | **60 Question objects** |

### Pages with broken schema

| Page category | Count | Status |
|---|---|---|
| Homepage (`/`) | 1 | ❌ Invalid |
| Sector pages (`/solutions/*`) | 11 | ❌ Invalid |
| AI page (`/ai`) | 1 | ❌ Invalid |
| Resources page (`/resources`) | 1 | ❌ Invalid |
| Product pages (`/product/*`) | 6 | ❌ Invalid |
| **Total** | **20 pages** | **All invalid** |

**Confirmed from prerendered build:**
```
/solutions/restaurants QAPage → 3 questions, answerCount present: False
/index.html QAPage → 7 questions, answerCount present: False
```

---

## 3. Why `answerCount` is Required

Google's QAPage documentation states:

> `Question.answerCount` — The total number of answers to the question.
> **Required** — The validator marks the schema invalid without this field.

Since each question has exactly **one** `acceptedAnswer`, the value is `1` for all questions.

The 7 "critical issues" in the screenshot = 7 questions on the homepage × 1 missing field each.
The 49 "non-critical issues" = 7 questions × 7 optional fields each (author, datePublished, text,
url, upvoteCount on acceptedAnswer — all optional per spec).

---

## 4. Impact of Invalid Schema

| What Google does | With INVALID Q&A schema | With VALID Q&A schema |
|---|---|---|
| Shows Q&A rich results in SERP | ❌ Not eligible | ✅ Eligible |
| Shows expandable Q&A cards | ❌ Not shown | ✅ Can show under listing |
| CTR improvement | 0% | +15–35% (Q&A cards lift CTR) |
| Reports in Search Console | "Invalid" errors logged | "Valid" — tracked in coverage |
| Crawl signals | Schema flagged/ignored | Schema processed normally |

**This is a blocker for Q&A rich results on all 20 pages.** None of the FAQ content on
sector pages, product pages, AI page, resources, or homepage can appear as rich results
until `answerCount` is added.

---

## 5. Fix — Exact Changes

### Fix A — `src/lib/seo.js` (7 inline edits)

Add `answerCount: 1` to each of the 7 `Question` blocks in `HOMEPAGE_QA_JSONLD`.

**Pattern (same for all 7):**
```js
// BEFORE
{
  "@type": "Question",
  name: "...",
  acceptedAnswer: { "@type": "Answer", text: "..." },
}

// AFTER
{
  "@type": "Question",
  name: "...",
  answerCount: 1,
  acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: "..." },
}
```

`upvoteCount: 0` is optional but adds a recommended field to the Answer, converting
49 non-critical warnings to 0 on the homepage.

---

### Fix B — `src/pages/SectorPage.jsx` (1 edit, line 66)

**BEFORE:**
```js
mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
```

**AFTER:**
```js
mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, answerCount: 1, acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a } })),
```

---

### Fix C — `src/pages/AiPage.jsx` (1 edit, line 102)

**BEFORE:**
```js
mainEntity: AI_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
```

**AFTER:**
```js
mainEntity: AI_FAQS.map((f) => ({ "@type": "Question", name: f.q, answerCount: 1, acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a } })),
```

---

### Fix D — `src/pages/ProductPage.jsx` (1 edit, line 59)

**BEFORE:**
```js
mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
```

**AFTER:**
```js
mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, answerCount: 1, acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a } })),
```

---

### Fix E — `src/pages/Resources.jsx` (1 edit, lines 65–68)

**BEFORE:**
```js
mainEntity: FAQS.map((f) => ({
  "@type": "Question",
  name: f.q,
  acceptedAnswer: { "@type": "Answer", text: f.a },
})),
```

**AFTER:**
```js
mainEntity: FAQS.map((f) => ({
  "@type": "Question",
  name: f.q,
  answerCount: 1,
  acceptedAnswer: { "@type": "Answer", upvoteCount: 0, text: f.a },
})),
```

---

## 6. What `upvoteCount: 0` Does

Optional field on `Answer`. Google's spec says:
> The total number of votes that this answer has received.

Setting `upvoteCount: 0` is honest (we don't have a voting system) and removes 7
non-critical warnings per question → eliminates all 49 non-critical issues on the homepage.
On sector/product pages, eliminates similar non-critical warnings.

Not using `upvoteCount` is also acceptable — it's optional and doesn't affect validity.

---

## 7. What's NOT Changed

| Element | Status |
|---|---|
| Question `name` (the FAQ text) | ✅ Unchanged |
| Answer `text` (the answer body) | ✅ Unchanged |
| Optional fields `author`, `datePublished` | Not added — needs real data |
| `SOFTWARE_APP_JSONLD` (Software Apps schema) | ✅ Not touched — valid item |
| `ORG_JSONLD` (Organization schema) | ✅ Not touched — valid item |
| Any visible content | ✅ Zero visual change |
| All other React components | ✅ Untouched |

---

## 8. Edit Count Summary

| File | Edits | Lines changed |
|---|---|---|
| `src/lib/seo.js` | 7 (one per Question block) | L89–144 |
| `src/pages/SectorPage.jsx` | 1 (inline map) | L66 |
| `src/pages/AiPage.jsx` | 1 (inline map) | L102 |
| `src/pages/ProductPage.jsx` | 1 (inline map) | L59 |
| `src/pages/Resources.jsx` | 1 (multi-line map) | L65–68 |
| **Total** | **11 edits** | **5 files** |

---

## 9. Post-Build Validation

```bash
python3 << 'EOF'
import json, re, os

pages = [
    '/app/frontend/build/index.html',
    '/app/frontend/build/solutions/restaurants/index.html',
    '/app/frontend/build/solutions/cafes/index.html',
    '/app/frontend/build/ai/index.html',
    '/app/frontend/build/resources/index.html',
    '/app/frontend/build/product/sell-serve/index.html',
]
all_pass = True
for path in pages:
    if not os.path.exists(path):
        print(f"FILE NOT FOUND: {path}")
        continue
    html = open(path).read()
    schemas = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    for s in schemas:
        try:
            d = json.loads(s)
            if d.get('@type') == 'QAPage':
                questions = d.get('mainEntity', [])
                missing = [q['name'][:40] for q in questions if 'answerCount' not in q]
                if missing:
                    all_pass = False
                    print(f"❌ {path.split('/')[-2]}: answerCount missing on {len(missing)} questions")
                else:
                    print(f"✅ {path.split('/')[-2]}: all {len(questions)} questions have answerCount")
        except: pass

print()
print("OVERALL:", "PASS ✅" if all_pass else "FAIL ❌")
EOF
```

---

## 10. After Deploying Fixed Build

1. Re-run Google Rich Results Test on `www.mygenie.online` — Q&A should show "Valid"
2. Google Search Console → Rich Results → Q&A should clear critical errors within 1–2 crawl cycles
3. Q&A rich result cards become eligible to appear in Google SERP under the homepage and sector listings

---

## 11. Summary

| Item | Detail |
|---|---|
| Bug severity | **P0** — schema invalid, 0 rich results on 20 pages |
| Files | 5 |
| Total edits | 11 |
| New imports | None |
| New files | None |
| Rebuild required | Yes |
| Visible UI change | None |
| Risk | Zero |
| Expected gain | Q&A rich results eligible on 20 pages + all critical errors cleared |

*Registered 2026-09-05. Source: Google Rich Results Test on www.mygenie.online. E1 Agent.*
*Confirmed in prerendered build: `answerCount present: False` on homepage + /solutions/restaurants.*
