# CR-142 — /petpooja-alternative Orphaned from Navigation (No Internal Links)

**Type:** SEO / Internal Linking
**Date Raised:** 2026-08-24
**Raised By:** Crawlability Audit — August 2026
**Status:** OPEN
**Priority:** MEDIUM
**Effort:** ~5 min (code) + owner decision
**Improves:** SEO · PageRank flow · Discoverability
**Scope:** `frontend/src/components/site/Navbar.jsx` and/or other pages
**Related:** CR-137 (Petpooja schema — plan written), CR-85/86 (new landing pages)

---

## 1. Problem Statement

`/petpooja-alternative` receives paid Google Ads traffic and is in `sitemap.xml`. But:

- **Zero internal links** point to it from any page on the site
- It uses `LandingNavbar` (logo-only) — no global Navbar, no exit navigation (correct for ads LP)
- Grep across all `src/pages/`, `src/components/`, `src/data/` = **0 mentions of `/petpooja-alternative`** as a link destination

**SEO consequence:** Google crawls it via sitemap but sees no internal PageRank flowing to it. Internal links are a strong signal of page importance. A page with zero internal links ranks poorly even if the content is good.

**Intent clarification needed from owner:** The page is intentionally stripped of navigation to keep paid traffic captive (no escape links). Adding it to the main Navbar might conflict with this intent. But there are low-risk options.

---

## 2. Options

### Option A — Add to Navbar under "Solutions" or "Resources" (high link equity, but exposes to organic bounce risk)

```jsx
// Navbar.jsx — under a relevant group
{ label: "Petpooja Alternative", to: "/petpooja-alternative" }
```

Pros: Direct internal link, PageRank flows.
Cons: Organic visitors land on an ad-optimised page without global nav — disorienting.

### Option B — Add a contextual link from /solutions, /pricing, or homepage (preferred)

Add a subtle link from relevant pages, e.g.:
- `/pricing` page: "Switching from Petpooja? [See our comparison →]"
- Homepage comparison section: link to `/petpooja-alternative`
- `/solutions/restaurants` page: add link in the "See other solutions" section

This is the best balance: internal PageRank flows without exposing all visitors to the ad LP.

### Option C — Add a `<link rel="canonical">` referral from a blog post

Write a blog post about "Petpooja vs MyGenie" (also valuable for CR-102 blog publishing) that links to `/petpooja-alternative`. Lower implementation lift.

### Option D — Add to sitemap's existing `/solutions` hub page

The `/solutions` hub page could list the Petpooja comparison as a featured link without adding it to the global nav.

**Recommendation: Option B** — a single contextual link from the `/pricing` page (high intent context) pointing to `/petpooja-alternative`. One `<Link>` component addition, no nav change.

---

## 3. Owner Decision Required

Before implementing: confirm whether `/petpooja-alternative` should be:
1. Linked from the main Navbar (high visibility)
2. Linked contextually from /pricing or /solutions (low-visibility, SEO benefit)
3. Left as-is (ad-traffic only, sitemap coverage only)

---

## 4. Files Changed (Option B — pricing page link)

| File | Change |
|------|--------|
| `frontend/src/pages/Pricing.jsx` | Add contextual link: "Comparing with Petpooja? See the full breakdown →" |

---

## 5. Definition of Done

- [ ] At least 1 internal link pointing to `/petpooja-alternative` from a page that is itself linked from the homepage
- [ ] Link uses descriptive anchor text (e.g., "Petpooja alternative", "switching from Petpooja")
- [ ] `/petpooja-alternative` LandingNavbar remains unchanged (no global nav added to the page itself)
- [ ] Verified in site crawl: `/petpooja-alternative` has at least 1 inbound internal link

---

*CR-142 registered 2026-08-24. Source: Crawlability Audit August 2026. Owner decision needed on linking strategy before implementing.*
