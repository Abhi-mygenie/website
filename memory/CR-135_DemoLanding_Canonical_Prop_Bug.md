# CR-135 — DemoLanding.jsx Passes `canonical` Prop That Seo.jsx Silently Ignores

**Type:** Bug / Code Defect
**Date Raised:** 2026-08-24
**Raised By:** Prerender SEO Audit (PRERENDER_SEO_AUDIT_2026-08-24.md)
**Status:** OPEN
**Priority:** MEDIUM
**Effort:** ~2 min (1-line fix)
**Improves:** Code correctness · Canonical accuracy for /demo
**Scope:** `frontend/src/pages/DemoLanding.jsx`
**Related:** CR-134 (demo prerender), CR-133 (canonical poisoning)

---

## 1. Problem Statement

`DemoLanding.jsx` passes `canonical="/demo"` to `<Seo>`:

```jsx
// DemoLanding.jsx line 73-78
<Seo
  title={seo.title}
  description={seo.description}
  canonical="/demo"      ← this prop does NOT exist in Seo.jsx
  noindex={true}
/>
```

`Seo.jsx` does NOT accept a `canonical` prop — it only accepts `path`:

```jsx
// Seo.jsx function signature
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",           ← accepts 'path', not 'canonical'
  image,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const url = `${SITE_URL}${path || ""}`;
  <link rel="canonical" href={url} />   ← uses 'path', so canonical = SITE_URL + "" = homepage
```

**Effect:** The `canonical="/demo"` prop is silently discarded. `path` defaults to `""`. The canonical rendered is `https://www.mygenie.online/` (homepage).

---

## 2. SEO Impact

**Current severity: LOW** — `/demo` has `noindex={true}`, so Google does not index this page. A wrong canonical on a noindex page has no direct ranking impact.

**But:** If `noindex` is ever removed (e.g., if `/demo` is promoted to an indexable landing page), the canonical bug will immediately cause Google to treat `/demo` as a duplicate of the homepage. The fix is trivial now and prevents a future footgun.

**Also:** The `og:url` meta tag is also wrong (uses the same `url` variable). Any social share of `/demo` will show the homepage URL as the canonical URL.

---

## 3. Exact Fix

### `frontend/src/pages/DemoLanding.jsx` — line 75

**Current:**
```jsx
<Seo
  title={seo.title}
  description={seo.description}
  canonical="/demo"
  noindex={true}
/>
```

**Replace with:**
```jsx
<Seo
  title={seo.title}
  description={seo.description}
  path="/demo"
  noindex={true}
/>
```

**Change:** Rename prop from `canonical` to `path`. One word changed.

---

## 4. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `frontend/src/pages/DemoLanding.jsx` | `canonical="/demo"` → `path="/demo"` | 1 modified |

---

## 5. Definition of Done

- [ ] `DemoLanding.jsx` passes `path="/demo"` (not `canonical="/demo"`)
- [ ] After re-prerender: `/demo/index.html` canonical = `https://www.mygenie.online/demo`
- [ ] `og:url` on `/demo` = `https://www.mygenie.online/demo`
- [ ] `noindex` meta tag still present (unchanged)

---

*CR-135 registered 2026-08-24. Source: PRERENDER_SEO_AUDIT_2026-08-24.md. LOW risk, 1-line fix.*
