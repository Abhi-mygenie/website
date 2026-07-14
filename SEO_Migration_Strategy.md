# MyGenie POS — SEO Migration Strategy (V2.4 → live domain)

**Goal:** Replace the current `mygenie.online` site with the new V2.4 React site **without losing any organic ranking, traffic, or backlink equity.**

---

## 1. Current live site — SEO footprint (what we must protect)

**Domain canonical:** `https://www.mygenie.online` (www version)
**Rendering:** Server-rendered HTML (PHP) — Google sees full content in source. ✅ strong for SEO.
**robots.txt:** present, allows all, points to sitemap.
**sitemap.xml:** present — **30 indexed URLs.**
**Tags present:** title, meta description, meta keywords, OG (title/desc/image/url/type), Twitter card, Facebook domain verification.

**Homepage title (ranks well — do NOT discard the keywords):**
> `POS System for Restaurants & Cafes | Best Billing Software - MyGenie`

**The 30 indexed URLs (ranking equity lives here):**

| Group | Old URLs |
|---|---|
| Core | `/`, `/about-us`, `/pricing`, `/contact-us` |
| Sectors | `/fine-dining`, `/quick-service`, `/Cafe-and-coffee-shop`, `/cloud-kithen`, `/bar-and-pubs`, `/bakeries`, `/buffet-stations-restaurant`, `/ice-green-and-dessert`, `/pizzerias` |
| Features | `/smart-billing`, `/inventory-management`, `/reports_and-analytics`, `/menu-management` |
| Legal | `/terms-and-conditions`, `/privacy-policy`, `/refund-policy` |
| Blog | `/blogs` + **10 blog posts** (inventory mgmt, choosing a POS, mobile POS, multi-location, social media, etc.) |

---

## 2. The new site — current SEO state (what's wrong today)

| Issue | Current new site | Risk |
|---|---|---|
| **Generic meta** | title = "Emergent \| Fullstack App", desc = "A product of emergent.sh" | 🔴 Catastrophic — would destroy all rankings on day 1 |
| **Client-side render (CRA SPA)** | All content injected by JS; `<title>`/meta identical on every route | 🔴 Major regression vs current server-rendered site |
| **No sitemap.xml / robots.txt** | absent | 🟠 Crawlers lose the map |
| **Different URL structure** | `/solutions/:slug`, `/product/:bucket` | 🔴 Every old URL 404s without redirects = lost equity |
| **Missing pages** | No about, contact, blog (10 posts), legal, or feature pages | 🔴 Loses the pages that actually pull organic traffic |

---

## 3. URL Redirect Map (301 — the #1 priority)

Every old URL must **301-redirect** to its closest new equivalent so Google transfers ranking + backlinks.

### Sectors (old → new `/solutions/:slug`)
| Old URL | → New URL |
|---|---|
| `/fine-dining` | `/solutions/restaurants` |
| `/quick-service` | `/solutions/qsr` |
| `/Cafe-and-coffee-shop` | `/solutions/cafes` |
| `/cloud-kithen` | `/solutions/cloud-kitchens` |
| `/bar-and-pubs` | `/solutions/restaurants` *(no bar page yet — gap)* |
| `/bakeries` | `/solutions/cafes` *(closest — gap)* |
| `/buffet-stations-restaurant` | `/solutions/food-courts` |
| `/ice-green-and-dessert` | `/solutions/cafes` *(closest — gap)* |
| `/pizzerias` | `/solutions/restaurants` |

### Features (old → new `/product/:bucket`)
| Old URL | → New URL |
|---|---|
| `/smart-billing` | `/product/sell-serve` |
| `/inventory-management` | `/product/protect-profit` |
| `/reports_and-analytics` | `/product/see-everything` |
| `/menu-management` | `/product/sell-serve` |

### Core / legal / blog
| Old URL | → New URL | Status |
|---|---|---|
| `/` | `/` | ✅ matches |
| `/pricing` | `/pricing` | ✅ matches |
| `/about-us` | `/about` | 🟠 must build About page |
| `/contact-us` | `/contact` | 🟠 must build Contact page |
| `/terms-and-conditions` | `/terms` | 🟠 must build |
| `/privacy-policy` | `/privacy` | 🟠 must build |
| `/refund-policy` | `/refund` | 🟠 must build |
| `/blogs` | `/blog` | 🔴 must build blog index |
| `/blog/{10 posts}` | `/blog/{same-slug}` | 🔴 **migrate content 1:1, keep slugs** |

> **Rule:** Keep blog slugs identical where possible so the URL itself is preserved (best-case = no redirect needed, full equity retained).

---

## 4. Content gaps that MUST be filled before go-live
These pages currently pull organic traffic on the old site. Removing them = ranking loss:
1. **Blog (10 posts)** — highest SEO value. Migrate the actual article content into the new site (`/blog` + posts).
2. **About, Contact** pages.
3. **Legal pages** — Terms, Privacy, Refund (also required for trust/payment).
4. **Feature pages** — covered by new `/product/*` buckets (redirect handles these).

---

## 5. Technical SEO fixes for the new React site

### A. Per-page meta (CRITICAL)
Add **react-helmet-async** so every route emits its own unique:
- `<title>` (keep proven keywords: "POS System", "Billing Software", "Restaurant")
- `<meta description>`, canonical, OG + Twitter tags.
- Reuse/upgrade the strong homepage title rather than inventing a new one.

### B. Make it crawlable (SPA → static HTML)
CRA renders client-side; the old site was server-rendered. To avoid a ranking drop, **pre-render to static HTML at build** using **react-snap** (no stack change) — Googlebot then gets full HTML per route. *(Alternative: migrate to Next.js SSR — bigger lift; not required for a mostly-static marketing site.)*

### C. sitemap.xml + robots.txt
Generate a fresh `sitemap.xml` with all new URLs + `robots.txt` pointing to it.

### D. Structured data (schema.org)
Add `Organization`, `Product`/`SoftwareApplication`, `FAQPage` (we already have FAQ content), and `BreadcrumbList` JSON-LD — the old site lacks this, so it's an SEO *upgrade*.

### E. www vs non-www
Old canonical = `www.mygenie.online`. Pick one canonical host and 301 the other consistently; set canonical tags to match.

### F. Preserve verification & analytics
- Keep **Facebook domain verification** meta (`52wnu6dg...`).
- Re-add **GA4 / Meta Pixel** (and keep PostHog if desired).

---

## 6. Go-live cutover checklist (day of switch)
1. ✅ All 301 redirects live (Section 3).
2. ✅ Per-page meta + canonical on every route.
3. ✅ Pre-rendered HTML deployed (react-snap).
4. ✅ New `sitemap.xml` + `robots.txt` live.
5. ✅ Blog + About + Contact + legal pages published.
6. ✅ Structured data validated (Google Rich Results test).
7. ✅ FB verification + analytics in place.
8. **Post-launch:** submit new sitemap in Google Search Console, use the **"Change of Address"/URL inspection**, monitor Coverage + 404 reports for 4–6 weeks, fix any stragglers.

---

## 7. Recommended phasing
- **Phase A (blockers):** react-helmet per-page meta + fix generic title/desc + 301 redirect map + sitemap/robots.
- **Phase B (content):** migrate 10 blog posts, build About/Contact/legal pages.
- **Phase C (polish):** react-snap pre-render, JSON-LD schema, analytics/pixel, GSC submission.

---

## 8. IMPLEMENTATION STATUS (completed)
Implemented in the V2.4 React app:
- ✅ **Per-page SEO** via `react-helmet-async` — unique title/description/canonical/OG/Twitter on every route (`src/components/site/Seo.jsx`, `src/lib/seo.js`). Generic "Emergent" title/desc removed from `index.html`.
- ✅ **301 redirect map** for all old URLs (`src/data/redirects.js`, client-side `<Navigate>`); plus server configs: `public/_redirects` (Netlify/Cloudflare) and `nginx-redirects.conf` (true 301s for deploy).
- ✅ **Blog fully migrated** — all **21 posts** scraped 1:1 (slugs preserved) into `src/data/blogPosts.json` + images in `public/blog/`. Pages: `/blog`, `/blog/:slug` with Article + Blog JSON-LD. Scraper: `scripts/scrape_blog.py`.
- ✅ **Missing pages built**: `/about`, `/contact` (real phone/email/social), `/terms`, `/privacy`, `/refund` (content ported from live site).
- ✅ **3 dedicated sector pages** added: `/solutions/bars-pubs`, `/solutions/bakeries`, `/solutions/ice-cream-desserts` (no longer just redirects).
- ✅ **sitemap.xml** (48 URLs) + **robots.txt** generated (`scripts/generate_sitemap.py`).
- ✅ **Structured data**: Organization (home), FAQPage (resources/sector/product), Article (blog), ContactPage.
- ✅ Navbar + Footer updated with Blog/About/Contact/legal links + social icons.

### Remaining production-hardening (apply at deploy on live domain)
- ⏳ **Server-side 301s**: apply `nginx-redirects.conf` (or `_redirects`) on the production host — true 301s beat client-side for SEO equity.
- ⏳ **Canonical host (www vs non-www)**: SITE_URL set to `https://www.mygenie.online` (configurable via `REACT_APP_SITE_URL`). VALIDATE on live DNS and 301 the other host.
- ⏳ **Pre-render/SSR**: add `react-snap` (or move to Next.js) so non-JS crawlers/social scrapers get full HTML. Helmet already covers Googlebot (renders JS).
- ⏳ **Analytics**: add GA4 + Meta Pixel IDs (placeholders for now).
- ⏳ **Post-launch**: submit `sitemap.xml` in Google Search Console, use URL inspection / Change of Address, monitor Coverage + 404s for 4–6 weeks.
