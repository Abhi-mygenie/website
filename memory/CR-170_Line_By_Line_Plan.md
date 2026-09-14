# CR-170 — Line-by-Line Implementation Plan
## Add `<link rel="sitemap">` to `<head>`

**File count:** 1
**Total lines changed:** 1 (insertion after existing canonical line)
**Rebuild required:** Yes
**Risk:** LOW — purely informational HTML tag, no rendering or performance impact

---

## Scope clarification (from impact analysis)

CR-170 was originally written as "add to homepage `<head>`". The correct implementation
is in `Seo.jsx` — the shared SEO component used on **all 42 pages**. This is the right
approach: sitemaps are site-wide, every page should reference it. Confirmed correct.

---

## Pre-flight checks

```bash
# 1. Confirm no sitemap link currently exists anywhere in build
grep -r "rel=\"sitemap\"" /app/frontend/build/ | wc -l
# Expected: 0

# 2. Confirm sitemap.xml exists at the target path
ls /app/frontend/build/sitemap.xml && echo "EXISTS" || echo "MISSING"
# Expected: EXISTS (copied from public/ during craco build)

# 3. Confirm canonical line location in Seo.jsx
grep -n "canonical" /app/frontend/src/components/site/Seo.jsx
# Expected: line 25: <link rel="canonical" href={url} />
```

---

## File 1 of 1 — `frontend/src/components/site/Seo.jsx`

### Change 1 — Insert after Line 25: Add sitemap link tag

```
BEFORE (L25 only, L26 is blank):
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

AFTER (new L26 inserted):
      <link rel="canonical" href={url} />
      <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
```

**Exact insertion:** After L25, before the blank line L26. New line is inserted at L26.
All existing lines shift down by 1 (L26 blank → L27, etc.). File grows from 47 → 48 lines.

**Attribute breakdown:**
| Attribute | Value | Why |
|---|---|---|
| `rel` | `"sitemap"` | Standard relation type per HTML spec |
| `type` | `"application/xml"` | Correct MIME type for XML sitemaps |
| `href` | `"/sitemap.xml"` | Root-relative — works on all domains/environments |

**Why root-relative `"/sitemap.xml"` not absolute URL:**
- Absolute `${SITE_URL}/sitemap.xml` would hardcode `www.mygenie.online` in the preview environment
- Root-relative `/sitemap.xml` resolves correctly on both preview and production
- `sitemap.xml` is confirmed present at `build/sitemap.xml` (copied from `public/` by craco)

**Pages affected:** All 42 pages that render `<Seo>`. Every page gets the sitemap link in its `<head>`. This is the intended behaviour.

---

## Verification steps (post-rebuild)

```bash
# 1. Confirm sitemap link in homepage prerender
grep "rel=\"sitemap\"" /app/frontend/build/index.html
# Expected: <link rel="sitemap" type="application/xml" href="/sitemap.xml"/>

# 2. Confirm it appears on other pages too (spot check 3 pages)
for page in "pricing" "blog" "about"; do
  result=$(grep -l "rel=\"sitemap\"" /app/frontend/build/${page}/index.html 2>/dev/null)
  echo "${page}: ${result:-MISSING}"
done
# Expected: all 3 show the file path (FOUND)

# 3. Confirm canonical tag unchanged
grep "rel=\"canonical\"" /app/frontend/build/index.html | head -1
# Must still be present

# 4. Confirm sitemap.xml accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sitemap.xml
# Expected: 200
```

---

## Rollback

```
Remove the added <link rel="sitemap" .../> line from Seo.jsx.
Rebuild.
```

*Plan written 2026-08-30. No code edits made — plan only.*
