# MyGenie POS — Production SEO Cutover Gate

_Generated: 2026-06-07 • Scope: production cutover readiness only. No blog admin, CMS, email-lead, design, or new content._

References: `SEO_Migration_Weekly_Monitoring_Report.md`, `SEO_Migration_Strategy.md`.

> **Platform reality (confirmed with Emergent support):** Emergent **managed hosting does NOT support** `_redirects`,
> custom nginx, or edge 301 rules. `www.mygenie.online` already sits behind **Cloudflare** (confirmed: Cloudflare-managed
> robots + the existing non-www→www 301). **Therefore the SEO-safe place to enforce real HTTP 301s is Cloudflare** (origin-
> agnostic), OR your existing nginx origin if you self-host the build.

---

## A. PRODUCTION CUTOVER CHECKLIST (in order)

**Pre-cutover (staging, no traffic impact)**
1. ☐ Capture **Week 0 GSC baseline** for `www.mygenie.online` (indexed pages, top pages/queries, clicks, impressions, CTR, avg position, current 404s). *(report §I)*
2. ☐ Decide origin host:
   - **Route A (recommended):** Cloudflare (proxied) in front → origin = Emergent managed hosting (custom domain via "Link domain → Entri") **or** your existing nginx.
   - **Route B:** Self-host the static `build/` on your existing Ubuntu/nginx origin (full control, reuse Cloudflare).
3. ☐ Set production env before building/deploying:
   - `REACT_APP_BACKEND_URL` = **production backend URL** (currently still the preview URL — see §F leak note). **P0 functional.**
   - `REACT_APP_SITE_URL=https://www.mygenie.online` (explicit; defaults to this anyway).
4. ☐ Build: `cd frontend && yarn build` → deploy `build/` (artifact already validated, §D).
5. ☐ Stage the **301 layer** (do NOT rely on React client-side Navigate):
   - **Cloudflare:** import `frontend/cloudflare-bulk-redirects.csv` as a **Bulk Redirect List** + attach a Bulk Redirect Rule; keep the **non-www → www** Redirect Rule active.
   - **nginx:** include `frontend/nginx-redirects.conf` inside the production `server {}` block (uncomment the host-canonical block).
6. ☐ Confirm `sitemap.xml` + `robots.txt` will serve at the domain root (they're in `build/`; validated §D).

**Cutover (DNS switch)**
7. ☐ Point `www.mygenie.online` (and apex `mygenie.online`) to the new origin. If using Emergent custom domain: remove conflicting **A records** first, then "Link domain → Entri". If staying on Cloudflare: update the CNAME/A to the new origin, keep proxy **ON** so Bulk Redirects execute at the edge.
8. ☐ Verify SSL is green on `https://www.mygenie.online`.
9. ☐ The **301 layer (step 5) MUST be live the moment DNS flips** — otherwise old URLs 404.

**Post-cutover (immediately)**
10. ☐ Run the **deploy-time QA checklist (§F)**.
11. ☐ GSC: confirm verification, **submit `https://www.mygenie.online/sitemap.xml`**, use URL Inspection on 3 redirected old URLs + 3 new blog posts.
12. ☐ Validate OG with Facebook Sharing Debugger + Twitter Card Validator on home + 1 blog post.
13. ☐ Begin the 4-week monitoring table (report §J).

---

## B. SERVER-SIDE 301 READINESS — VERDICT: ⚠️ **READY TO APPLY, NOT YET LIVE**

- **Configs prepared & validated** for all **19** old→new mappings:
  - `frontend/cloudflare-bulk-redirects.csv` (Cloudflare Bulk Redirects — recommended, origin-agnostic).
  - `frontend/nginx-redirects.conf` (true nginx 301s for self-host).
  - `frontend/public/_redirects` (Netlify/Vercel-style fallback).
- **Will old URLs return real HTTP 301 (not React client-side)?** — **YES, once the Cloudflare list / nginx rules are applied.** The React `<Navigate>` is only a safety net for direct in-app navigation; the authoritative 301 happens at the edge/origin **before** the SPA loads.
- ⚠️ **Emergent managed hosting alone cannot do this** — you must use Cloudflare (or nginx). This is the single most important gate item.
- Blog: old `/blog/<slug>` = new `/blog/<slug>` (identical slugs) → no redirect needed, served as 200.

---

## C. CANONICAL / DOMAIN READINESS — VERDICT: ✅ **READY**

- **Canonical domain: `https://www.mygenie.online` (WWW).**
- **non-www → www 301:** currently LIVE on production (Cloudflare/nginx). **Keep this rule active after cutover** (Cloudflare Redirect Rule, or uncomment the host block in `nginx-redirects.conf`).
- All app `<link rel="canonical">`, OG `og:url`, and JSON-LD `url` use the **www** host (verified in build JS via `SITE_URL`).
- No mixed-host canonical. Apex `mygenie.online` must continue 301-ing to www.

---

## D. SITEMAP / ROBOTS READINESS — VERDICT: ✅ **READY** (validated in build artifact)

- `build/sitemap.xml`: **48 URLs**, single host `https://www.mygenie.online` only, **21 blog URLs**, zero preview/non-www leakage.
- `build/robots.txt`: `Allow: /` + `Sitemap: https://www.mygenie.online/sitemap.xml`.
- Both serve from domain root after deploy.
- ⚠️ The Cloudflare-managed robots seen in **preview** is a preview-only artifact; the real origin `robots.txt` will serve post-cutover. Re-confirm with `curl`.
- ⚠️ Sitemap URLs (`/solutions/*`, `/product/*`, new `/blog/*`) only resolve **after** the new build is live — re-validate post-cutover.

---

## E. ANALYTICS / SEARCH CONSOLE — OWNER-PENDING LIST

| Item | Status | Owner action needed |
|---|---|---|
| GA4 | OWNER-PENDING | Provide `G-XXXXXXXXXX` Measurement ID to wire in. |
| Meta Pixel | OWNER-PENDING | Provide Pixel ID. |
| Google Search Console | OWNER-PENDING | Verify property for `https://www.mygenie.online` (DNS TXT or HTML tag) + submit sitemap post-cutover. |
| Facebook domain verification | ✅ PRESERVED | `52wnu6dg7xaa18lrghxek38u535rtw` already in `index.html` (validated in build). |
| Bing Webmaster (optional) | OWNER-PENDING | Optional: add + submit sitemap. |

> Until GA4/Pixel/GSC IDs are supplied, these stay **OWNER-PENDING — not PASS**.

---

## F. EXACT DEPLOY-TIME QA CHECKLIST (run immediately after cutover)

```bash
# 1) Canonical host 301s
curl -sI http://mygenie.online/            | grep -iE 'HTTP|location'   # expect 301 -> https://www.mygenie.online/
curl -sI https://mygenie.online/           | grep -iE 'HTTP|location'   # expect 301 -> https://www.mygenie.online/
curl -sI https://www.mygenie.online/       | grep -i  'HTTP'            # expect 200

# 2) ALL old URLs must return HTTP 301 to the correct new path
for u in /fine-dining /quick-service /Cafe-and-coffee-shop /cloud-kithen /bar-and-pubs \
         /bakeries /buffet-stations-restaurant /ice-green-and-dessert /pizzerias \
         /smart-billing /inventory-management /reports_and-analytics /menu-management \
         /about-us /contact-us /terms-and-conditions /privacy-policy /refund-policy /blogs; do
  echo "$u -> $(curl -sI https://www.mygenie.online$u | awk 'tolower($1) ~ /^http|^location/{printf "%s ", $2}')"
done   # each MUST show 301 + correct /new/path

# 3) New pages return 200
for u in / /pricing /solutions/restaurants /solutions/bars-pubs /product/sell-serve \
         /customers /roi /resources /blog /about /contact /terms /privacy /refund; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' https://www.mygenie.online$u)"
done   # all 200

# 4) All 21 blog posts return 200 (same slugs)
# (loop the 21 slugs from data/blogPosts.json) -> all 200

# 5) Sitemap + robots from production domain
curl -s https://www.mygenie.online/sitemap.xml | grep -oE '<loc>https?://[^/<]+' | sort -u   # only www
curl -s https://www.mygenie.online/sitemap.xml | grep -c '<loc>'                              # expect 48
curl -s https://www.mygenie.online/robots.txt                                                 # correct sitemap line

# 6) Canonical/meta on a rendered page (JS) + FB verification in raw HTML
curl -s https://www.mygenie.online/ | grep -i 'facebook-domain-verification'                  # present
# Open /, /blog, /blog/<slug> in browser -> confirm <link rel=canonical> = www and per-page title

# 7) No preview/staging leak
curl -s https://www.mygenie.online/sitemap.xml | grep -i 'preview\|localhost'                 # expect empty
```

**PASS bar:** §F-2 all 301, §F-3/§F-4 all 200, §F-5 only-www + count 48, §F-7 empty.

---

## G. ROLLBACK TRIGGERS (revert DNS to old site if ANY occur within first 1–24h)

1. **Old URLs returning 404/200-without-301** (redirect layer not firing) → SEO equity loss. **Immediate rollback.**
2. **Canonical host broken** (non-www not 301-ing, or SSL error on www).
3. **Sitemap/robots 404 or serving wrong domain** at the root.
4. **>5% of indexed old URLs 404** in GSC Coverage / crawl spike of 404s.
5. **Homepage or blog rendering blank** (JS bundle / backend API failure — e.g. `REACT_APP_BACKEND_URL` still pointing to preview/unreachable).
6. **Mass canonical/OG pointing to preview domain** (would deindex). 
7. Significant **5xx** rate from origin.

**Rollback = repoint DNS/CNAME back to the existing old origin** (old site still intact). Because it's a DNS/edge switch, rollback is fast and non-destructive. Keep the old origin running until 7 days of clean GSC data.

---

## H. FINAL GO / NO-GO

### 🟡 CONDITIONAL GO

**The build is SEO-ready** (canonical, sitemap, robots, blog, meta, FB verification all validated in the production
artifact). **Cutover is GO only when ALL of these are staged to go live at the DNS flip:**

- ✅ **GATE 1 — 301 layer live at edge/origin** (Cloudflare Bulk Redirects from the provided CSV, or nginx-redirects.conf). *Not Emergent managed hosting alone.* **(P0)**
- ✅ **GATE 2 — non-www → www 301 preserved.** **(P0)**
- ✅ **GATE 3 — `REACT_APP_BACKEND_URL` repointed to the production backend** (currently still preview — would break the demo form). **(P0 functional)**
- ✅ **GATE 4 — GSC ready** to submit sitemap immediately post-cutover. **(P0)**
- 🟠 **GATE 5 — Prerender/SSR risk** (SPA ships empty HTML without JS) acknowledged as **P1** — does not block GO but should be scheduled (react-snap).
- 🟠 GA4 / Meta Pixel IDs — **P1**, can be added post-cutover.

**NO-GO if** any of GATE 1–4 is not in place at the moment of DNS switch.

> **Do not declare SEO "fully closed"** until the site is live on `www.mygenie.online` AND §F-2 shows real 301s AND §F-3/4
> show 200s for new + blog pages.
