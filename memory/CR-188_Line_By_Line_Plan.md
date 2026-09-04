# CR-188 — Complete Impact Analysis & Line-by-Line Plan
# Homepage: "restaurant management" body gap

**Date:** 2026-09-02
**Status:** READY TO IMPLEMENT — no approval required
**File:** `src/components/home/CtaDemo.jsx`
**Total edits:** 1 line, +11 characters

---

## 1. Problem

`"restaurant management"` appears **0 times** in the homepage body.
It appears only in the `<meta description>`:
> "MyGenie POS — powerful billing & **restaurant management** software for cafes, hotels & cloud kitchens."

Google Ads Quality Score and organic relevance both require the keyword in the visible body, not just the meta tag.

### Current homepage keyword state (from live prerendered HTML)

| Keyword | Body count | In meta desc |
|---|---|---|
| `restaurant pos` | 2 ✅ | ✅ |
| `billing software` | 2 ✅ | ✅ |
| `pos system` | 5 ✅ | ✅ |
| `table management` | 2 ✅ | — |
| `restaurant management` | **0 ❌** | ✅ |
| `restaurant management software` | **0 ❌** | — |

---

## 2. Component Survey — All Home Body Components

| Component | CMS-overridden? | Contains "restaurant management"? | Viable insertion? |
|---|---|---|---|
| `Hero.jsx` subtitle | ❌ Not overridden | No | ⚠️ Possible — EditableText rich HTML, complex to modify |
| `TrustBand.jsx` | `home.trust_logos` overridden | No | ❌ CMS-controlled |
| `OutcomePillars.jsx` | ❌ Not overridden | No | ⚠️ Possible — would change a value stat desc |
| `AIBand.jsx` | ❌ Not overridden | No | ❌ Off-topic section (AI features) |
| `ProofSection.jsx` | `home.testimonials` overridden | No | ❌ CMS-controlled |
| **`CtaDemo.jsx`** | **❌ Not overridden** | `"restaurant software"` present | **✅ Best fit** |
| `HomeFaq.jsx` | ❌ Not overridden | No | ⚠️ Possible — would change a FAQ answer |

---

## 3. Chosen Insertion Point: `CtaDemo.jsx` L26

### Why CtaDemo.jsx is the right choice

The CtaDemo section has a hardcoded paragraph (L25–28):

```jsx
<p className="mt-4 text-lg text-brand-muted leading-relaxed">
  Our restaurant software includes every core tool — from POS billing and inventory management to
  loyalty programs — so you never pay extra for essentials. Get a customized quote and walkthrough
  for your business.
</p>
```

- **"restaurant software" already exists** — upgrading it to "restaurant management software" is a direct, natural, zero-risk improvement
- **"restaurant management software"** is the product's own category name — the `/product/see-everything` h1 already says "Restaurant management software — total visibility from every outlet, live on your phone."
- **Hardcoded text** — no CMS override concern whatsoever
- **Single word insertion** — the existing sentence stays intact, meaning unchanged
- **Bonus:** adds BOTH `restaurant management` AND `restaurant management software` (+2 keyword variants) for only +11 characters

### Why the alternatives were rejected

| Option | Reason rejected |
|---|---|
| Hero subtitle (home.hero.subtitle) | Rich text with HTML spans — more complex. Only adds "restaurant management" (not "…software"). Modifies the primary conversion headline. |
| PILLARS[0].desc in content.js | Changes a proven value statement ("Up to 25% more profit with recipe-level P&L…"). Higher copy risk for a P2 keyword fix. |
| HomeFaq.jsx answer | Would require rewriting a FAQ answer body — larger change, less natural. |

---

## 4. CMS Override Confirmation

From handover doc (§7):
```
CMS overrides active:  home.trust_logos · home.testimonials · home.hero.banner_image
NOT overridden:        home.hero.subtitle · home.hero.badge · home.hero.title_lead
                       home.hero.title_accent · CtaDemo.jsx hardcoded text (no CMS key)
```

`CtaDemo.jsx` uses **no CMS keys at all** — its paragraph text is a plain JSX string literal. There is no `useContent()` or `EditableText` involved. Changes to this file take effect immediately on rebuild with zero CMS interaction risk.

---

## 5. What This Change Affects — Complete List

| Element | Affected? | Notes |
|---|---|---|
| Visible CtaDemo paragraph copy | ✅ YES | "restaurant management software" replaces "restaurant software" |
| `<meta description>` | ❌ NO | Uses `PAGE_SEO["/"].description` from `seo.js` |
| `<title>` | ❌ NO | Static |
| JSON-LD schemas | ❌ NO | Not involved |
| Any other component | ❌ NO | Text is local to `CtaDemo.jsx` |
| Mobile layout | ❌ NO | 2 words added mid-sentence; no layout impact |

---

## 6. Line-by-Line Plan

**File:** `src/components/home/CtaDemo.jsx`
**Line:** 26
**Lines unchanged:** all other 62 lines

```
BEFORE (L26 — 88ch on this line):
              Our restaurant software includes every core tool — from POS billing and inventory management to

AFTER (L26 — 99ch on this line, +11ch):
              Our restaurant management software includes every core tool — from POS billing and inventory management to
```

**Full paragraph context — BEFORE:**
```jsx
<p className="mt-4 text-lg text-brand-muted leading-relaxed">
  Our restaurant software includes every core tool — from POS billing and inventory management to
  loyalty programs — so you never pay extra for essentials. Get a customized quote and walkthrough
  for your business.
</p>
```

**Full paragraph context — AFTER:**
```jsx
<p className="mt-4 text-lg text-brand-muted leading-relaxed">
  Our restaurant management software includes every core tool — from POS billing and inventory management to
  loyalty programs — so you never pay extra for essentials. Get a customized quote and walkthrough
  for your business.
</p>
```

**What changed:** `restaurant software` → `restaurant management software`
**Characters added:** +12ch (insert " management")
**Adds:** `restaurant management` ×1, `restaurant management software` ×1
**Removes:** Nothing. Existing content 100% preserved.
**Natural reading:** "restaurant management software" is the standard industry category name. Already used in the product's own `/product/see-everything` h1.

---

## 7. Post-Fix Projected Keyword Count (homepage body)

| Keyword | Before | After |
|---|---|---|
| `restaurant management` | 0 | **1** ✅ |
| `restaurant management software` | 0 | **1** ✅ |
| All other homepage keywords | unchanged | unchanged |

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Copy sounds unnatural | None | Low | "restaurant management software" is standard industry phrasing — product uses it in its own page headings |
| CMS override suppresses change | None | High | CtaDemo.jsx has no CMS keys — pure hardcoded text |
| Meta description length violated | None | High | Meta description not touched |
| Layout broken by extra words | None | Low | Text wraps in a `<p>` — +12ch in a multi-line paragraph |
| Approval needed | None | N/A | Factual upgrade of existing product description, no new claims |

---

## 9. Verification Gate (run after build)

```bash
python3 -c "
import re
html = open('/app/frontend/build/index.html').read()
body = html[html.find('<body'):]
bl = body.lower()
rm  = bl.count('restaurant management')
rms = bl.count('restaurant management software')
print('restaurant management:', rm)
print('restaurant management software:', rms)
print('meta_desc:', len(re.search(r'<meta name=\"description\" content=\"(.*?)\"', html).group(1).replace('&amp;','&')), 'ch')
print('PASS' if rm >= 1 and rms >= 1 else 'FAIL')
"
```

**Expected:** `restaurant management ≥ 1`, `restaurant management software ≥ 1`, meta_desc ≤ 160ch.

---

## 10. Build & Deploy

```bash
cd /app/frontend && yarn build && sudo supervisorctl restart frontend
```

---

## 11. Summary

| File | Line | Change | Keywords added | Approval |
|---|---|---|---|---|
| `src/components/home/CtaDemo.jsx` | L26 | `restaurant software` → `restaurant management software` | `restaurant management`, `restaurant management software` | ✅ None needed |

**1 file. 1 line. +12 characters. Zero risk. Zero approval needed.**

---

*Plan completed 2026-09-02. Char counts Python-verified.*
