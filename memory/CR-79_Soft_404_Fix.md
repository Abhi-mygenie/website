# CR-79 — Fix Soft-404: Return Real HTTP 404 for Unmatched Routes

**Type:** Technical SEO Fix  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** CRITICAL  
**Plan ID:** C10  
**Effort:** 45 min  
**Improves:** SEO · Crawl · Index Hygiene  
**Scope:** `frontend/src/App.js`, Nginx/Cloudflare config  
**Related:** CR-78 (canonical/duplicate domain)

---

## 1. Problem Statement

All unmatched routes silently redirect to the homepage with HTTP 200:
```jsx
// App.js line ~80
<Route path="*" element={<Navigate to="/" replace />} />
```
Google crawls thousands of URLs that return HTTP 200 with homepage content — creating soft-404 pages that dilute crawl budget, confuse indexation, and can trigger Google’s “Duplicate without user-selected canonical” warning.

---

## 2. Root Cause

**`frontend/src/App.js` — wildcard route:**
```jsx
<Route path="*" element={<Navigate to="/" replace />} />
```
Instead of rendering a 404 page, it performs a React-side redirect to `/`, which the server always serves as HTTP 200 (because Nginx serves `index.html` for all SPA routes).

Since this is a CSR SPA, the HTTP status always comes from Nginx — not React. Two changes are needed: (1) React renders a proper 404 UI, (2) Nginx returns HTTP 404 status for truly unmatched paths.

---

## 3. Exact Changes Required

### Change 1 — Create `frontend/src/pages/NotFound.jsx`
```jsx
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

export default function NotFound() {
  return (
    <div className="bg-white">
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center py-24 px-4">
        <div className="text-center max-w-md">
          <p className="font-display text-7xl font-bold text-brand-green">404</p>
          <h1 className="font-display text-2xl font-bold text-brand-ink mt-4">Page not found</h1>
          <p className="text-brand-muted mt-3">The page you’re looking for doesn’t exist.</p>
          <Link to="/" className="mt-8 inline-block bg-brand-green text-white rounded-full px-7 py-3 font-semibold hover:bg-brand-greenDark transition-all">
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

### Change 2 — `frontend/src/App.js`
```jsx
// Add import
import NotFound from "@/pages/NotFound";

// Replace wildcard route
// BEFORE:
<Route path="*" element={<Navigate to="/" replace />} />

// AFTER:
<Route path="*" element={<NotFound />} />
```

### Change 3 — Nginx / Cloudflare Workers (server-side HTTP status)
For an SPA served via Nginx, the typical config (`try_files $uri /index.html`) always returns 200. To return a real 404 HTTP status for unmatched paths while still serving the React SPA:

**Cloudflare Workers approach (no Nginx access needed):**
Create a Cloudflare Worker that:
1. Intercepts requests
2. For known paths (site routes), passes through (200)
3. For unknown paths, fetches `index.html` but returns it with a 404 status

**Alternative (if Nginx config is accessible):**
This is complex for SPAs — coordinate with infrastructure team.

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/NotFound.jsx` | New 404 page component |
| `frontend/src/App.js` | Replace Navigate wildcard with NotFound component |
| Nginx or Cloudflare Workers | Return HTTP 404 status for unmatched paths |

---

## 5. Definition of Done

- [ ] Visiting `/some-random-nonexistent-path` shows the 404 page (not a homepage redirect)
- [ ] HTTP status is 404 (verify via `curl -I https://mygenie.online/random-path`)
- [ ] Google Search Console: no "Crawled — currently not indexed" soft-404 pages
- [ ] All legitimate routes still return 200
- [ ] NotFound page has Navbar + Footer and links back to homepage

---

*CR-79 registered 2026-08-20. Source: SEO & QS Audit · Plan ID C10.*
