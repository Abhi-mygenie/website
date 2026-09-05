# CR-180 — Domain & Canonical Strategy: beta.mygenie.online

**Type:** SEO / Infrastructure
**Date Raised:** 2026-08-30
**Status:** OPEN — 👤 OWNER DECISION REQUIRED
**Priority:** P0 (once decided, implementation is trivial)
**Source:** UAT audit P0 finding (beta.mygenie.online, 2026-08-27)

---

## 1. Problem

`beta.mygenie.online` has no `<meta name="robots" content="noindex">`. Googlebot is
actively crawling and indexing the beta subdomain. If beta coexists with www.mygenie.online,
this creates:
- Duplicate content (same pages on two domains)
- Split PageRank (link equity divided between beta and www)
- Confusing GSC data (impressions/clicks split between two properties)

---

## 2. Current State

```
frontend/.env:
  REACT_APP_SITE_URL — NOT SET

seo.js L3:
  export const SITE_URL = (process.env.REACT_APP_SITE_URL || "https://www.mygenie.online")
```

Result: All 61+ prerendered pages have canonicals pointing to `www.mygenie.online`,
regardless of which domain they're actually served from.

For **this preview pod** (`mygenie-react-app.preview.emergentagent.com`): ✅ Correct.
Canonicals correctly signal to Google that www.mygenie.online is the authoritative source.

For **`beta.mygenie.online`**: ⚠️ Depends on owner's domain strategy.

---

## 3. Decision Required

**Owner must choose ONE of the following:**

---

### Option A — beta.mygenie.online IS the permanent production domain

If "beta" will remain the production domain (no migration planned):

**Fix:** Set env var in `frontend/.env` on the beta server:
```
REACT_APP_SITE_URL=https://beta.mygenie.online
```
Then rebuild. All 61+ canonicals update to `https://beta.mygenie.online/...`.

**Also:** Consider removing "beta" from the domain name (cosmetically misleading for users).

---

### Option B — Will migrate to www.mygenie.online after UAT

If beta is a staging/UAT environment that will be replaced by www:

**Fix:** Add a global noindex to the beta build only. Two approaches:

**Approach B1 — `public/index.html` template:**
Add to `<head>` in `public/index.html`:
```html
<meta name="robots" content="noindex,nofollow">
```
Every prerendered page inherits this. Remove it when switching to production.

**Approach B2 — Conditional via env var (cleaner):**
Add to `Seo.jsx`:
```jsx
{process.env.REACT_APP_NOINDEX_ENV === "true" && (
  <meta name="robots" content="noindex,nofollow" />
)}
```
Set `REACT_APP_NOINDEX_ENV=true` in beta `.env`, leave unset in production `.env`.

---

## 4. No Code Change Until Owner Decides

Do not implement either option until the owner confirms the domain strategy.
Wrong choice = either:
- Noindex production site (Option B applied to wrong env) — catastrophic
- Canonicals pointing to wrong domain (Option A with wrong URL) — confusing for Google

---

## 5. Definition of Done

**Option A:**
- [ ] `REACT_APP_SITE_URL=https://beta.mygenie.online` set in beta server `.env`
- [ ] Rebuilt — canonicals in prerendered HTML = `https://beta.mygenie.online/...`
- [ ] GSC property added for beta.mygenie.online

**Option B:**
- [ ] Noindex meta present on all beta pages
- [ ] GSC: beta property blocked (verify via Coverage report — all pages = "Excluded")
- [ ] When migrating to www: remove noindex, set `REACT_APP_SITE_URL=https://www.mygenie.online`

*CR-180 registered 2026-08-30. Source: UAT audit P0 finding. Owner decision required before any implementation.*
