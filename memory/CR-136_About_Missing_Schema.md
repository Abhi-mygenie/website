# CR-136 — About.jsx Has No Structured Data (Missing ORG_JSONLD)

**Type:** Schema / Structured Data
**Date Raised:** 2026-08-24
**Raised By:** SEO Tag Audit 2026-08-24
**Status:** OPEN
**Priority:** P2 — MEDIUM
**Effort:** ~2 min (1 line)
**Improves:** SEO · E-E-A-T · Entity disambiguation · Google Knowledge Panel
**Scope:** `frontend/src/pages/About.jsx`
**Related:** CR-91 (BreadcrumbList), CR-110 (brand entity disambiguation)

---

## 1. Problem Statement

`About.jsx` renders a `<Seo>` call with no `jsonLd` prop:

```jsx
// About.jsx line ~22 (current)
<Seo title={seo.title} description={seo.description} path="/about" />
```

The `/about` page is the natural home for the `Organization` entity declaration. It is the page where Google expects to find:
- The company's official name, URL, logo
- Contact details
- Social media sameAs links

Currently `ORG_JSONLD` is only declared on the homepage (`Home.jsx`). The `/about` page — the most semantically appropriate location for company identity — has zero structured data.

**Why this matters:**
- Google uses the About page to anchor the entity graph for the brand
- `ORG_JSONLD` on `/about` reinforces the homepage declaration and strengthens the brand entity signal
- Supports Google Knowledge Panel eligibility for "MyGenie POS"
- Required for E-E-A-T: demonstrates organizational authoritativeness

---

## 2. Exact Fix

### `frontend/src/pages/About.jsx` — import line + Seo call

**Step 1 — Add ORG_JSONLD to import:**

Current import (approximate, line ~7):
```jsx
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";
```

Replace with:
```jsx
import Seo from "@/components/site/Seo";
import { PAGE_SEO, ORG_JSONLD } from "@/lib/seo";
```

**Step 2 — Add jsonLd prop to Seo call:**

Current:
```jsx
<Seo title={seo.title} description={seo.description} path="/about" />
```

Replace with:
```jsx
<Seo title={seo.title} description={seo.description} path="/about" jsonLd={[ORG_JSONLD]} />
```

**Total change: 2 lines modified. Zero new lines.**

---

## 3. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `frontend/src/pages/About.jsx` | Add `ORG_JSONLD` to import + `jsonLd` prop | 2 modified |

---

## 4. Definition of Done

- [ ] `/about` page emits `Organization` JSON-LD in `<head>`
- [ ] Google Rich Results Test: valid Organization schema on `/about`
- [ ] No visual regression on About page

---

*CR-136 registered 2026-08-24. Source: SEO Tag Audit. 1-minute fix.*
