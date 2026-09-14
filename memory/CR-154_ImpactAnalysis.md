# CR-154 — Impact Analysis
# Homepage Badge Keyword Fix + Ad Group Redirect

**Date:** 2026-08-26

---

## 1. Code Investigation

### Badge field
`Hero.jsx` L20:
```jsx
<EditableText id="home.hero.badge" fallback="The Hospitality Operating System" />
```

- **CMS key:** `home.hero.badge`
- **Current live value:** Likely the fallback since no CMS override has been set
- **CMS editable:** Yes — admin can change at `/leads` without deploy

### Subtitle already has keywords (no action needed)
`Hero.jsx` L38:
```
"MyGenie POS boosts profit by up to 25%,* stops revenue leakage, speeds up service, and gives owners 
total control of billing, kitchen, inventory, and customers — across every outlet."
```
`"POS"`, `"billing"`, `"inventory"` are all above the fold in the subtitle. The gap is only the badge.

### H1 is brand-positioned (do not touch)
`"Run a more profitable hospitality business — from your phone."` — this is intentional. No change.

### Meta title already has keywords (no action needed)
`seo.js`: `"POS System for Restaurants & Cafes | Best Billing Software - MyGenie"` — Google Ads relevance for the title tag is separate from QS Ad Relevance. Both are fine.

---

## 2. Fix A Scope — Badge Update

**Code change:**
- **File:** `Hero.jsx` L20 — 1 word change in fallback string
- **Or:** CMS admin edit — zero deploy, instant

**Proposed new text:** `"India's Restaurant POS & Billing Software"`

**Why this exact text:**
- `"Restaurant POS"` — primary keyword cluster (largest ad group)
- `"Billing Software"` — second largest ad group
- `"India's"` — geo qualifier already in other LP H1s (`"India's best restaurant POS system"`)
- Kept short — fits badge pill format (≤ 6 words)

**CMS vs code:**
| Method | Speed | Requires prerender? |
|---|---|---|
| CMS admin edit at `/leads` | Instant — live on production immediately | No |
| Code fallback change | Requires PR + `yarn build` + prerender + deploy | Yes |

**Recommendation:** Do CMS edit first (instant). Update code fallback separately so they stay in sync.

---

## 3. Fix B Scope — Ad Group Final URL Redirects

This is **100% Ads console work, zero dev**.

| Ad Group | Current Final URL | Correct LP | Expected QS improvement |
|---|---|---|---|
| Billing Software (ID: 199781695618) | `mygenie.online/` | `/restaurant-billing-software` | QS 6–7 → QS 8–9 |
| POS System (ID: 200309564562) | `/product/sell-serve` | `/restaurant-pos-system` | QS 3 → QS 6–7 |
| Management (ID: 202501557247) | `/product/see-everything` | `/restaurant-management-software` | QS 1 → QS 5–6 |
| QSR (IDs: 180565370134 etc.) | Homepage | `/qsr-pos-system` | N/A (dormant) |
| Cloud Kitchen (ID: 202501556327) | `/solutions/cloud-kitchens` | `/cloud-kitchen-pos` | Conversion rate ↑ |

**Dependency:** All 5 LPs are already built and live (CR-85/86/148/149/152). No blockers.

---

## 4. Impact Assessment

| Change | Risk | Effort | Expected gain |
|---|---|---|---|
| Badge text update | None — cosmetic above-fold text only | 1 CMS edit | Google sees "restaurant POS" above H1 |
| Ad URL redirects | Low — tested LPs are live | Ads console only | QS +3–5 points on worst-scoring keywords |

**No breaking changes.** Badge is decorative — it carries no navigation or functional role.

---

## 5. Cross-Impact

- **CR-86, CR-85, CR-148:** These LPs already use `"Best restaurant POS system"` / `"Restaurant billing software"` in H1 — once ad groups point there, homepage QS issue becomes irrelevant for those queries
- **PR-154 is lowest-effort, highest-ROI in Batch N** — 1 CMS edit + Ads console change, no deploy needed

*Impact analysis written 2026-08-26.*
