# CR-154 — Homepage Eyebrow Keyword Fix + Ad Group Redirect

**Type:** SEO / Google Ads QS Fix
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P1 — Affects QS across all homepage-targeted ad groups
**Finding:** #1 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

Homepage H1 (`"Run a more profitable hospitality business — from your phone."`) is intentional brand positioning — **do not rewrite it**.

BUT the eyebrow badge above the H1 says `"The Hospitality Operating System"` — also zero keyword. Google's Ad Relevance component scores the **entire above-fold content cluster** (badge + H1 + subtitle). The subtitle (`"MyGenie POS…billing, kitchen, inventory"`) does carry keywords, but it's below the H1.

Additionally, all homepage-targeted Google Ads campaigns (POS System, Billing Software, Management) currently point to `/` — a brand page, not a keyword-matched LP. The 5 new LPs (CR-85/86/148/149/152) exist but Ads Final URLs haven't been updated.

**Two separate fixes — one dev (badge), one Ads console (URL redirect).**

---

## 2. Fix A — Eyebrow Badge Update (Dev — 1 line)

**File:** `frontend/src/components/home/Hero.jsx` L20  
**What:** Change the CMS fallback text of the badge

```jsx
// BEFORE:
<EditableText id="home.hero.badge" fallback="The Hospitality Operating System" />

// AFTER:
<EditableText id="home.hero.badge" fallback="India's Restaurant POS & Billing Software" />
```

**Why:** The badge is a small pill above the H1. It carries no brand weight (no one identifies MyGenie by the badge line) but it does give Google a keyword signal in the above-fold cluster — `"restaurant POS"` and `"billing software"` appear before the H1. This directly improves Ad Relevance scoring for POS/billing queries pointed at homepage.

**CMS note:** The badge is also CMS-editable via `id="home.hero.badge"`. The fallback change is the code change; the live value can be further adjusted via CMS admin without a deploy.

---

## 3. Fix B — Redirect Ad Groups to Dedicated LPs (Ads Console — No Dev)

| Ad Group | Current Final URL | Correct Final URL |
|---|---|---|
| Billing Software | `mygenie.online/` (homepage) | `/restaurant-billing-software` |
| POS System | `/product/sell-serve` | `/restaurant-pos-system` |
| Management & Ordering | `/product/see-everything` | `/restaurant-management-software` |
| QSR (after RSA rewrite) | homepage | `/qsr-pos-system` |
| Cloud Kitchen | `/solutions/cloud-kitchens` | `/cloud-kitchen-pos` |

**Expected QS impact per LP:** POS System QS 3 → QS 6–7. Management QS 1 → QS 5+.

---

## 4. Files to Change

| File | Operation |
|---|---|
| `frontend/src/components/home/Hero.jsx` L20 | EDIT — badge fallback text |
| `frontend/public/sitemap.xml` | No change — homepage already in sitemap |
| Ads console | Ads action — update 5 Final URLs |

---

## 5. Definition of Done

- [ ] Badge fallback reads `"India's Restaurant POS & Billing Software"` (or approved variant)
- [ ] `"restaurant POS"` appears above the H1 on homepage (visible in HTML source)
- [ ] All 5 Alpha campaign ad groups updated to new LP Final URLs (Ads console)
- [ ] Homepage H1 UNCHANGED (`"Run a more profitable hospitality business — from your phone."`)

*CR-154 registered 2026-08-26. Source: UX/SEO Audit Finding #1.*
