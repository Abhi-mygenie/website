# CR-202 — `/solutions/bars-and-pubs` Silent Homepage Redirect (Soft 404)

**Registered:** 2026-09-02  
**Source:** Regression suite T6 — Dev build  
**Status:** 🔲 Open  
**Priority:** HIGH — SEO (duplicate content)  
**Regression gate:** T6

---

## Symptom

Direct navigation to `https://[host]/solutions/bars-and-pubs` silently serves **homepage content** at that URL.

Per the regression brief: *"Unacceptable anywhere — silent redirect to homepage. Google indexes this as duplicate homepage content."*

---

## Root Cause

Two mismatches:

**1. Build directory slug mismatch:**

The build step prerendered this sector using the data key `bars-pubs`:
```
/app/frontend/build/solutions/bars-pubs/index.html   ← EXISTS
/app/frontend/build/solutions/bars-and-pubs/         ← DOES NOT EXIST
```

**2. No `_redirects` mapping for the user-facing URL:**

`public/_redirects` contains:
```
/bar-and-pubs    /solutions/bars-pubs    301   ← maps the OLD legacy URL (no /solutions/ prefix)
```

But there is **no entry** for `/solutions/bars-and-pubs`. When a visitor or Googlebot navigates to this URL, the static server finds no matching directory and falls back to the SPA catch-all:
```
/*    /index.html    200
```

React loads at the root URL context, renders the homepage, and the browser URL remains `...bars-and-pubs` — a duplicate of the homepage content at a different URL.

---

## SEO Impact

| Consequence | Detail |
|---|---|
| Google duplicate content | Homepage HTML served at `/solutions/bars-and-pubs` — may be indexed as a second copy of the homepage |
| PageRank dilution | Any inbound links to the bars-and-pubs URL pass authority to a duplicate page |
| Internal link integrity | Nav menus or sector lists that link to `bars-and-pubs` silently fail |

---

## Affected Files

| File | Issue |
|---|---|
| `public/_redirects` | Missing: `/solutions/bars-and-pubs → /solutions/bars-pubs 301` |
| `public/_redirects` | OR: `/solutions/bars-and-pubs → /404 410` (if sector is not intended to exist) |

---

## Fix Direction (no code — planning only)

Add one line to `public/_redirects` **before** the SPA catch-all rule (`/* /index.html 200`):

```
/solutions/bars-and-pubs    /solutions/bars-pubs    301
```

This 301 redirects the incorrect URL to the correct prerendered sector page, preserving any link equity and preventing Google from indexing duplicate homepage content.

**Alternative (if sector is not intended to have a public page):**
```
/solutions/bars-and-pubs    /404    301
```

Rebuild required after `_redirects` change.

---

## Validation (post-fix)

```bash
# After fix + rebuild, check redirect in prerendered build
grep "bars-and-pubs" /app/frontend/public/_redirects
# Expected: entry present before the /* catch-all

# Browser test: navigate to /solutions/bars-and-pubs
# Expected: 301 → /solutions/bars-pubs with bars-and-pubs sector content
# FAIL condition: homepage content served at bars-and-pubs URL
```

---

## Related CRs

| CR | Relation |
|---|---|
| CR-203 | Same issue — `/solutions/hotels` slug mismatch (hotels vs hotels-resorts) |
| CR-79 | Soft-404 fix — same family of issues (soft 404 → real 404) |
