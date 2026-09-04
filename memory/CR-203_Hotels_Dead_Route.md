# CR-203 — `/solutions/hotels` Silent Homepage Redirect (Soft 404)

**Registered:** 2026-09-02  
**Source:** Regression suite T6 — Dev build  
**Status:** 🔲 Open  
**Priority:** HIGH — SEO (duplicate content)  
**Regression gate:** T6

---

## Symptom

Direct navigation to `https://[host]/solutions/hotels` silently serves **homepage content** at that URL.

Per the regression brief: *"Unacceptable anywhere — silent redirect to homepage. Google indexes this as duplicate homepage content."*

---

## Root Cause

Same two-part mismatch as CR-202:

**1. Build directory slug mismatch:**

The build step prerendered this sector using the data key `hotels-resorts`:
```
/app/frontend/build/solutions/hotels-resorts/index.html   ← EXISTS
/app/frontend/build/solutions/hotels/                     ← DOES NOT EXIST
```

**2. No `_redirects` mapping for the short-form URL:**

`public/_redirects` contains **no entry** for `/solutions/hotels`. A visitor navigating to the short URL (likely from an external link, ad, or shortened reference) hits the SPA catch-all:
```
/*    /index.html    200
```

React loads at root context and renders homepage content at the `hotels` URL.

---

## SEO Impact

Same consequences as CR-202:

| Consequence | Detail |
|---|---|
| Google duplicate content | Homepage HTML indexed at `/solutions/hotels` |
| Ad landing page failure | If any Google/Meta ad points to `/solutions/hotels`, it lands on homepage (wrong conversion intent) |
| Hotels-resorts sector invisible | The correct page at `/solutions/hotels-resorts` is never discovered via `/solutions/hotels` |

---

## Affected Files

| File | Issue |
|---|---|
| `public/_redirects` | Missing: `/solutions/hotels → /solutions/hotels-resorts 301` |

---

## Fix Direction (no code — planning only)

Add one line to `public/_redirects` **before** the SPA catch-all rule:

```
/solutions/hotels    /solutions/hotels-resorts    301
```

This 301 redirects the short URL to the correct prerendered sector page.

Rebuild required after `_redirects` change.

---

## Validation (post-fix)

```bash
# Check redirect in _redirects
grep "hotels" /app/frontend/public/_redirects
# Expected: /solutions/hotels entry present before /* catch-all

# Browser test: navigate to /solutions/hotels
# Expected: 301 → /solutions/hotels-resorts with correct sector content
# FAIL condition: homepage content served at /solutions/hotels URL
```

---

## Related CRs

| CR | Relation |
|---|---|
| CR-202 | Same issue — `/solutions/bars-and-pubs` slug mismatch |
| CR-79 | Soft-404 fix — same family of issues |
