# CR-223 — Sitemap Missing Trailing Slashes — 0 Pages Indexed (GSC Redirect Error)

**Registered:** 2026-09-06
**Source:** Trailing Slash Brief — Google Search Console URL Inspection API confirmed
**Status:** 🔲 Open — P0 — code fix ready (Option A)
**Priority:** P0
**Owner:** Dev (code) + Owner (GSC resubmit)
**File:** `public/sitemap.xml`

---

## 1. Problem

**58 out of 59 sitemap URLs return HTTP 301 before Google can crawl them.**

Google Search Console URL Inspection API confirms `coverageState: "Redirect error"` for all non-homepage pages. Result: **0 pages currently indexed** despite all 5 landing pages and 50+ other pages being live.

Root cause: Sitemap submits URLs without trailing slash. Production server (nginx) enforces trailing slash and 301-redirects every non-slash URL. Google flags redirected URLs as errors and does not index them.

### Confirmed live (2026-09-06):
```bash
curl -sI https://www.mygenie.online/restaurant-billing-software
# HTTP/2 301 → location: /restaurant-billing-software/

curl -sI https://www.mygenie.online/pricing
# HTTP/2 301 → location: /pricing/

curl -sI https://www.mygenie.online/solutions/restaurants
# HTTP/2 301 → location: /solutions/restaurants/
```

### Sitemap state (confirmed live):
```
Sitemap submits: /pricing            (58 URLs like this)
Server serves:   /pricing/           (301 from nginx)
Google sees:     Redirect Error → not indexed
```

---

## 2. Impact

| Metric | Value |
|---|---|
| URLs in sitemap | 59 |
| URLs with redirect error | 58 (all non-homepage) |
| Pages currently indexed | **0** |
| SEO impact | All landing page ad campaigns pointing to unindexed pages |
| GSC coverage state | `Redirect error` on all 58 pages |

---

## 3. Fix — Option A (Code, ~5 min)

Add trailing slash to all 58 non-homepage `<loc>` entries in `public/sitemap.xml`.

**Pattern:** `https://www.mygenie.online/pricing` → `https://www.mygenie.online/pricing/`

Homepage (`/`) already correct — no change needed.

**After code change:**
1. Rebuild frontend (`yarn build`)
2. Deploy to production
3. GSC → Sitemaps → remove old sitemap → re-add `https://www.mygenie.online/sitemap.xml`
4. GSC → URL Inspection → Request Indexing for each of the 5 landing pages

**Files:** `public/sitemap.xml` — 58 line edits (one per URL)

---

## 4. Fix — Option B (Server, ~1 hr) — see CR-224

Remove the nginx `rewrite` rule that forces trailing slashes. Cleaner fix — URLs return 200 directly, no redirect at all. Saves 50–100ms per page load. See CR-224.

**If Option B is implemented first, Option A is not needed.**
**If Option A is deployed first, Option B can still be done later for performance.**

---

## 5. Verification

```bash
# After fix — should return 200 directly (no 301)
curl -sI https://www.mygenie.online/restaurant-billing-software | grep HTTP
# Expected: HTTP/2 200

# GSC — wait 24–72h after sitemap resubmit
# URL Inspection → coverageState should change from "Redirect error" to indexed
```

---

## 6. Related CRs

| CR | Relationship |
|---|---|
| CR-224 | Option B — remove nginx trailing slash redirect (server config, owner) |
| CR-225 | Google Ads final URLs also need trailing slash update |
| CR-214 | Sitemap lastmod dates — already fixed; this CR is about URL format only |

---

*Registered 2026-09-06. Source: Trailing Slash Brief + live curl confirmation.*
*Priority: P0 — blocking all indexing for 58 pages.*
