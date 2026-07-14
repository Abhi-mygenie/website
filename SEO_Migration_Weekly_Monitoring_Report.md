# MyGenie POS — SEO Migration Closure & Weekly Monitoring Report

_Generated: 2026-06-07 • Scope: SEO closure/hardening only (no blog admin, no CMS, no lead-email, no design polish)._

> **Critical context for every verdict below:** The new V2.4 React app currently runs in the **preview** environment
> (`git-pull-deploy.preview.emergentagent.com`). The production domain **`mygenie.online` still serves the OLD server-rendered site.**
> The migration has **not yet been cut over to production.** All items that depend on the production host (real server-side
> 301s, GA/Pixel/GSC, sitemap submission, prerender at deploy) therefore **cannot be marked PASS yet** — they are correctly
> marked **OWNER-PENDING** or **RISK**, per the owner rule.

---

## A. FINAL VERDICT

### ⚠️ PASS WITH OWNER-PENDING ITEMS — **NOT fully closed**

All engineering that can be completed in this environment is **done and verified**: per-page meta/canonical, JSON-LD,
redirect map (code + server configs), full 21-post blog migration with preserved slugs, missing pages built, sitemap +
robots generated, FB domain-verification preserved.

**Full closure is BLOCKED on production cutover + owner actions.** Do **not** declare "fully closed" until the P0 items in
section K are complete (deploy with server-side 301s, verify canonical on live, configure GA4/GSC, submit sitemap,
address prerender risk).

---

## B. CANONICAL VERDICT

- **Final canonical domain: `https://www.mygenie.online` (WWW).**
- **Reason / evidence:** the live production site already enforces www and the new app's canonical/OG/sitemap all use www.

| Test | Result | Evidence (HTTP) |
|---|---|---|
| `http://mygenie.online/` | 301 → `https://www.mygenie.online/` | `HTTP/1.1 301 Moved Permanently` |
| `https://mygenie.online/` | 301 → `https://www.mygenie.online/` | `HTTP/2 301`, `location: https://www.mygenie.online/` |
| `http://www.mygenie.online/` | 200 | `HTTP/1.1 200 OK` |
| `https://www.mygenie.online/` | 200 | `HTTP/2 200` |

- **non-www → www 301 is LIVE on current production (old infra).** ✅
- **Action at cutover:** the new deployment MUST preserve this host 301 (config provided in `nginx-redirects.conf`,
  commented host-redirect block). All `<link rel="canonical">` tags in the new app already point to www (verified).
- New app canonical tags verified rendering, e.g. home → `https://www.mygenie.online/`, blog post →
  `https://www.mygenie.online/blog/<slug>`.

---

## C. REDIRECT QA (old → new)

**Method:** HTTP status on the new app (preview). **Finding:** the SPA returns **HTTP 200** for every path (client-side
`<Navigate replace>` then renders the target). A control test of a garbage path (`/this-page-does-not-exist-xyz`) also
returns **200**, proving the SPA catch-all. **Therefore real server-side 301s are NOT yet live** — they require the
production deploy to honor `public/_redirects` / `nginx-redirects.conf`.

| Old URL | Expected destination | Actual status (preview) | Redirect type | Final resolved page | PASS/FAIL |
|---|---|---|---|---|---|
| `/fine-dining` | `/solutions/restaurants` | 200 | Client-side Navigate | Restaurants ✅ | ⚠️ PARTIAL (server 301 pending) |
| `/quick-service` | `/solutions/qsr` | 200 | Client-side Navigate | QSR ✅ | ⚠️ PARTIAL |
| `/Cafe-and-coffee-shop` | `/solutions/cafes` | 200 | Client-side Navigate | Cafes ✅ | ⚠️ PARTIAL |
| `/cloud-kithen` | `/solutions/cloud-kitchens` | 200 | Client-side Navigate | Cloud Kitchens ✅ | ⚠️ PARTIAL |
| `/bar-and-pubs` | `/solutions/bars-pubs` | 200 | Client-side Navigate | Bars & Pubs ✅ | ⚠️ PARTIAL |
| `/bakeries` | `/solutions/bakeries` | 200 | Client-side Navigate | Bakeries ✅ | ⚠️ PARTIAL |
| `/buffet-stations-restaurant` | `/solutions/food-courts` | 200 | Client-side Navigate | Food Courts ✅ | ⚠️ PARTIAL |
| `/ice-green-and-dessert` | `/solutions/ice-cream-desserts` | 200 | Client-side Navigate | Ice Cream & Desserts ✅ | ⚠️ PARTIAL |
| `/pizzerias` | `/solutions/restaurants` | 200 | Client-side Navigate | Restaurants ✅ | ⚠️ PARTIAL |
| `/smart-billing` | `/product/sell-serve` | 200 | Client-side Navigate | Sell & Serve ✅ | ⚠️ PARTIAL |
| `/inventory-management` | `/product/protect-profit` | 200 | Client-side Navigate | Protect Profit ✅ | ⚠️ PARTIAL |
| `/reports_and-analytics` | `/product/see-everything` | 200 | Client-side Navigate | See Everything ✅ | ⚠️ PARTIAL |
| `/menu-management` | `/product/sell-serve` | 200 | Client-side Navigate | Sell & Serve ✅ | ⚠️ PARTIAL |
| `/about-us` | `/about` | 200 | Client-side Navigate | About ✅ | ⚠️ PARTIAL |
| `/contact-us` | `/contact` | 200 | Client-side Navigate | Contact ✅ | ⚠️ PARTIAL |
| `/terms-and-conditions` | `/terms` | 200 | Client-side Navigate | Terms ✅ | ⚠️ PARTIAL |
| `/privacy-policy` | `/privacy` | 200 | Client-side Navigate | Privacy ✅ | ⚠️ PARTIAL |
| `/refund-policy` | `/refund` | 200 | Client-side Navigate | Refund ✅ | ⚠️ PARTIAL |
| `/blogs` | `/blog` | 200 | Client-side Navigate | Blog index ✅ | ⚠️ PARTIAL |

> **PASS condition (post-deploy):** re-run `curl -I <old-url>` on production and confirm `HTTP/.. 301` + correct
> `Location`. Configs are ready in `frontend/_redirects` (referenced) and `frontend/nginx-redirects.conf`.

---

## D. BLOG QA (21 posts)

- All 21 posts migrated 1:1 with **identical slugs** (no redirect needed; old `/blog/<slug>` resolves directly).
- All have full body content (none thin), each renders `BlogPosting` Article schema, all 21 in sitemap.
- HTTP status on preview is 200 for all (SPA), and content renders client-side (verified on 3 posts).

| # | Slug | 200? | Same slug? | In sitemap? | Article schema? | PASS/FAIL |
|---|---|---|---|---|---|---|
| 1 | How-Small-Changes-in-Restaurant-Inventory-Management-Can-Give-Big-Rewards-For-Owners | ✅ | ✅ | ✅ | ✅ | PASS |
| 2 | 5-ways-MyGenie-can-streamline-your-restaurant-business | ✅ | ✅ | ✅ | ✅ | PASS |
| 3 | How-Indian-restaurants-can-spice-up-their-social-media-game! | ✅ | ✅ | ✅ | ✅ | PASS |
| 4 | How-to-make-restaurant-successful | ✅ | ✅ | ✅ | ✅ | PASS |
| 5 | Restaurant-Success-Mantra-Customer-Satisfaction | ✅ | ✅ | ✅ | ✅ | PASS |
| 6 | Top_10_perks_of_a_cloud_based_POS_for_cafes | ✅ | ✅ | ✅ | ✅ | PASS |
| 7 | The-ultimate-guide-to-choosing-the-best-POS-system-for-restaurants | ✅ | ✅ | ✅ | ✅ | PASS |
| 8 | mobile_pos_for_restaurants | ✅ | ✅ | ✅ | ✅ | PASS |
| 9 | POS-system-must-have-features | ✅ | ✅ | ✅ | ✅ | PASS |
| 10 | How_modern_POS_turns_multi-location_chaos_into_symphony | ✅ | ✅ | ✅ | ✅ | PASS |
| 11 | How-to-use-POS-data-to-grow-your-small-business | ✅ | ✅ | ✅ | ✅ | PASS |
| 12 | Cloud-vs-traditional-POS-systems | ✅ | ✅ | ✅ | ✅ | PASS |
| 13 | 10-Must-Have-Features-in-Restaurant-POS-Software | ✅ | ✅ | ✅ | ✅ | PASS |
| 14 | POS-System-For-Food-Truck | ✅ | ✅ | ✅ | ✅ | PASS |
| 15 | 5-POS-Technology-Trends-to-Watch-in-2025 | ✅ | ✅ | ✅ | ✅ | PASS |
| 16 | How-a-POS-system-can-help-you-slash-food-waste-and-boost-profits | ✅ | ✅ | ✅ | ✅ | PASS |
| 17 | What-the-rise-of-contactless-payments-means-for-your-business | ✅ | ✅ | ✅ | ✅ | PASS |
| 18 | How-POS-systems-help-deliver-tailored-hospitality-experiences | ✅ | ✅ | ✅ | ✅ | PASS |
| 19 | How-a-smart-POS-system-can-boost-your-restaurant-profit-margins | ✅ | ✅ | ✅ | ✅ | PASS |
| 20 | how-pos-systems-cut-food-waste-cafes-restaurants | ✅ | ✅ | ✅ | ✅ | PASS |
| 21 | improve-table-turnover-pos-order-management | ✅ | ✅ | ✅ | ✅ | PASS |

> Note: the old XML sitemap only listed 10 of these; the live blog index actually has 21. All 21 were captured.
> **Post-deploy caveat:** "200" must be re-confirmed on production (currently SPA-200 in preview). Content renders via JS
> (see section H risk).

---

## E. SITEMAP / ROBOTS QA

- **Sitemap URL count:** 48 (`11 core + 11 sectors + 5 products + 21 blog`). ✅
- **Sitemap host:** single host `https://www.mygenie.online` only — **no non-www, no preview-domain leakage.** ✅
- **Broken sitemap URLs:** 0 in preview (all routes render). ⚠️ On production these resolve **only after cutover** (the
  old site has none of `/solutions/*`, `/product/*`, new `/blog/*`). Re-validate after deploy.
- **robots.txt:** present in `public/robots.txt`; `Allow: /` + `Sitemap: https://www.mygenie.online/sitemap.xml`. ✅
- **Sitemap reference in robots:** ✅ correct, canonical www.
- ⚠️ **Preview note:** the preview is fronted by Cloudflare which **prepends a managed robots.txt** (disallows some AI bots,
  `search=yes`). On the real `mygenie.online` host, our `public/robots.txt` will be served. Validate on production.

---

## F. META / CANONICAL QA (rendered, verified in browser)

| Page | Title | Canonical | JSON-LD | Verdict |
|---|---|---|---|---|
| Home `/` | POS System for Restaurants & Cafes \| Best Billing Software - MyGenie | `…/` | Organization | PASS |
| Sector `/solutions/restaurants` | Restaurants POS System & Billing Software \| MyGenie | `…/solutions/restaurants` | FAQPage | PASS |
| Blog index `/blog` | MyGenie Blog \| Restaurant POS Tips, Guides & Industry Insights | `…/blog` | Blog | PASS |
| Post: cloud-perks | Top 10 perks of a cloud-based POS for cafes \| MyGenie Blog | `…/blog/Top_10_…` | BlogPosting | PASS |
| Post: mobile-pos | Mobile POS puts the power in your pocket \| MyGenie Blog | `…/blog/mobile_pos_for_restaurants` | BlogPosting | PASS |
| Post: food-truck | The secret ingredient behind successful food trucks… \| MyGenie Blog | `…/blog/POS-System-For-Food-Truck` | BlogPosting | PASS |
| About `/about` | About MyGenie \| A Smart POS System for Restaurants & Cafes | `…/about` | — | PASS |
| Contact `/contact` | Contact MyGenie \| Get in Touch for the Best Restaurant POS | `…/contact` | ContactPage | PASS |
| Terms `/terms` | Terms and Conditions \| MyGenie POS | `…/terms` | — | PASS |
| Privacy `/privacy` | Privacy Policy \| MyGenie POS | `…/privacy` | — | PASS |
| Refund `/refund` | Refund Policy \| MyGenie POS | `…/refund` | — | PASS |

All canonical tags resolve to the **www** canonical host. ✅

---

## G. ANALYTICS / SEARCH VERIFICATION

| Item | Status | Notes |
|---|---|---|
| GA4 | **OWNER-PENDING** | No GA4 Measurement ID configured (placeholders only). Owner to provide `G-XXXXXXX`. |
| Meta Pixel | **OWNER-PENDING** | No Pixel ID configured. Owner to provide Pixel ID. |
| Google Search Console verification | **OWNER-PENDING** | Cannot verify ownership from this environment. Owner to add GSC property + verify (DNS or HTML tag). No `google-site-verification` tag found on the live site HTML. |
| Facebook / domain verification | **PASS (preserved)** | `facebook-domain-verification = 52wnu6dg7xaa18lrghxek38u535rtw` carried over from live site into new `public/index.html` (verified served). Effective once deployed to the domain. |

---

## H. PRERENDER / SPA STATUS

| Check | Result |
|---|---|
| Raw HTML has meaningful content (no JS) | **NO** — `<div id="root">` is **empty (0 chars)**; marketing copy not present in raw HTML. |
| Blog content visible without JS | **NO** — post body not in raw HTML; rendered only after JS executes. |
| `<title>`, meta description, FB verification in raw HTML | **YES** (static in `index.html`). Per-page titles/canonical are injected by JS (react-helmet-async). |
| **Risk level** | **🟠 SEO RISK — P1 (NOT a PASS).** |

**Assessment:** Googlebot renders JS and will see per-page content + Helmet meta, so basic indexing should work. However,
the previous site was fully server-rendered; shipping a JS-only SPA is a regression for non-JS crawlers, social/link
scrapers, and crawl efficiency. **Recommendation: implement `react-snap` static pre-render at build (or move to Next.js
SSR)** so each route ships full HTML. Marked **P1 RISK**, not closed.

---

## I. WEEK 0 BASELINE (capture from Google Search Console — OWNER-PENDING)

> These baselines must be captured from GSC for `www.mygenie.online` **before** cutover, to measure migration impact.
> Fill in from GSC → Performance + Pages + Sitemaps.

| Metric | Baseline (fill from GSC) |
|---|---|
| Indexed pages | OWNER-PENDING |
| Top landing pages | OWNER-PENDING |
| Top queries | OWNER-PENDING |
| Organic clicks (28d) | OWNER-PENDING |
| Impressions (28d) | OWNER-PENDING |
| CTR | OWNER-PENDING |
| Average position | OWNER-PENDING |
| 404 count | OWNER-PENDING |
| Sitemap submitted | **NOT SUBMITTED** (submit `https://www.mygenie.online/sitemap.xml` post-deploy) |

---

## J. 1-MONTH MONITORING (fill weekly post-cutover from GSC)

| Metric | Week 1 | Week 2 | Week 3 | Week 4 |
|---|---|---|---|---|
| 404s | | | | |
| Redirect errors | | | | |
| Indexed pages | | | | |
| Sitemap processing | | | | |
| Clicks | | | | |
| Impressions | | | | |
| CTR | | | | |
| Average position | | | | |
| Top losing pages | | | | |
| Top losing queries | | | | |
| Blog indexing (of 21) | | | | |
| Sector page indexing (of 11) | | | | |
| Actions taken | | | | |

**Weekly routine:** GSC → Pages (check 404/redirect), Sitemaps (processed count), Performance (clicks/impr/CTR/pos vs
Week 0), URL Inspection on a sample of redirected old URLs + new blog posts.

---

## K. REMAINING ISSUES (P0 / P1 / P2)

### P0 — blocks SEO acceptance / closure
1. **Deploy the new site to production (`www.mygenie.online`).** Until cutover, none of the migration is live.
2. **Server-side 301s not live.** Apply `nginx-redirects.conf` (or `_redirects`) at deploy so all 19 old URLs return real
   HTTP 301. Re-verify with `curl -I`.
3. **Preserve host canonical redirect** (non-www → www) on the new infra at cutover.
4. **Google Search Console:** verify property + **submit `sitemap.xml`** (currently not submitted).
5. **Avoid 404s on old indexed URLs at cutover** — the 301 config (P0-2) must be live the moment the new site goes up.
   (Currently safe only because the OLD site still serves these URLs with 200.)

### P1 — must fix soon
6. **Prerender/SSR (react-snap or Next.js)** — SPA ships empty HTML without JS (section H). SEO RISK.
7. **GA4 + Meta Pixel** — add real IDs (OWNER-PENDING).
8. **Capture Week 0 GSC baseline** before cutover (section I).

### P2 — improvement
9. Add `BreadcrumbList` JSON-LD to sector/product/blog for richer SERP breadcrumbs.
10. Add `image` sitemap entries / dedicated image sitemap for blog hero images.
11. Add per-blog `og:image` from migrated hero images (already set via Seo `image` prop; validate in FB/Twitter debuggers post-deploy).

---

### Evidence appendix (commands to re-run for verification)
- Host/canonical: `curl -sI http://mygenie.online/` , `curl -sI https://mygenie.online/`
- Server 301 (post-deploy): `for u in /fine-dining /smart-billing /blogs; do curl -sI https://www.mygenie.online$u; done`
- Sitemap host: `curl -s https://www.mygenie.online/sitemap.xml | grep -oE '<loc>https?://[^/<]+' | sort -u`
- Robots: `curl -s https://www.mygenie.online/robots.txt`
- Blog 200 + content: `curl -s https://www.mygenie.online/blog/<slug>`
- Configs in repo: `frontend/public/_redirects`, `frontend/nginx-redirects.conf`, `scripts/generate_sitemap.py`, `scripts/scrape_blog.py`
