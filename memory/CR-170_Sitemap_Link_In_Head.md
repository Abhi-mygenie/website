# CR-170 — Add `<link rel="sitemap">` to `<head>`

**Type:** SEO / Crawlability
**Date Raised:** 2026-08-30
**Status:** OPEN
**Priority:** P1 (lower impact — robots.txt already covers discovery)
**Source:** SEO audit — no `<link rel="sitemap">` found in `<head>`

---

## 1. Problem

Current state:
- `sitemap.xml` ✅ exists at `/public/sitemap.xml`
- `robots.txt` ✅ references it: `Sitemap: https://www.mygenie.online/sitemap.xml`
- `<head>` ❌ has NO `<link rel="sitemap" type="application/xml" href="/sitemap.xml">`

`robots.txt` Sitemap directive is sufficient for GSC discovery. However, an explicit
`<link rel="sitemap">` in every page's `<head>` reinforces sitemap priority signal
and is a low-effort, zero-risk improvement.

---

## 2. Fix

**File:** `frontend/src/components/site/Seo.jsx`

Add one `<link>` tag inside the `<Helmet>` block (alongside the existing canonical tag):

```jsx
// Add alongside <link rel="canonical" ... />:
<link rel="sitemap" type="application/xml" href="/sitemap.xml" />
```

This will appear on every page that uses the `<Seo>` component (i.e., all pages).

---

## 3. Files to Change

| File | Change | Lines |
|---|---|---|
| `frontend/src/components/site/Seo.jsx` | Add `<link rel="sitemap">` inside `<Helmet>` | +1 line after canonical |

---

## 4. Definition of Done

- [ ] `<link rel="sitemap" type="application/xml" href="/sitemap.xml">` present in prerendered homepage HTML
- [ ] Appears on at least 3 spot-checked pages (homepage, /pricing, /blog)
- [ ] Canonical tag unchanged/unaffected

*CR-170 registered 2026-08-30. Source: SEO audit. Note: robots.txt already covers GSC discovery — this is a reinforcement, not a critical gap.*
