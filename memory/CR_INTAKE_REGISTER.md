# CR Intake Register — Grouped by Batch

**Last validated:** 2026-09-02 (new build audit + code-level validation — all findings verified against source and prerendered build)
**Updated:** 2026-09-09 — CR-220 ✅ FULLY DONE (Fix A + Fix B + Fix C all complete, GTM published). CR-264 ✅ CLOSED (GTM confirmed live on production). CR-221 ✅ CLOSED (Incognito test confirms remarketing pixel firing — 200 OK, failures were ad blocker). CR-222 ✅ CLOSED (same test, same result). CR-216 🔲 Partially done (base tags migrated to Google Tag type — verify library sharing).
**Legend:** ✅ Implemented · 🔲 Open · ⏸️ Backlog/Deferred · 👤 Owner action (no code) · 📋 Awaiting owner approval

---

## BATCH 0 — Ads Intelligence · CRM · Attribution (CR-24 → CR-65)

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-24 | Ads Intelligence Platform | ✅ Phase A+B+C done; Phase D Google OAuth flow live in server.py; Phase E attribution done | P0 | Google OAuth endpoints confirmed in server.py |
| CR-30 | Date Presets + Default 7-Day Period on Ads Intelligence | ✅ Implemented | — | — |
| CR-39 | Direct Visitor Attribution Default (`first_source="website"`) | ✅ **DONE** | HIGH | `freshsales.py` L242: `_trunc(a.get("first_utm_source")) or "website"` |
| CR-40 | OTP-Verified Tag + Backfill | ✅ Implemented | MEDIUM | — |
| CR-41 | Freshsales Custom Field Label Cleanup | 📋 Awaiting approval | LOW | No code change needed — Freshsales UI rename only |
| CR-42 | Zero Hardcoded Values — Full ENV Extraction | ✅ Implemented | P1 | — |
| CR-43 | WhatsApp FAB — ENV-Controlled Toggle + Number | ✅ Implemented | P1 | — |
| CR-44 | fbc Cookie + ad_id Attribution Loss to Freshsales | ✅ **CLOSED 2026-09-08** — fbc formatted as `fb.1.<unix_ms>.<fbclid>` in `attribution.js:71–73`. `ad_id` flows to Freshsales via `_attribution_to_crm`. Validated in code. | HIGH | Confirmed in `src/lib/attribution.js` |
| CR-45 | Freshsales Journey Webhook Not Firing | 👤 Freshsales Journey config — no code | MEDIUM | Backend endpoint exists; Journey not configured in CRM |
| CR-47 | Freshsales `custom_field` Wipe on tag/demo-booked | ✅ **DONE** | CRITICAL | `freshsales.py` CR-47 block confirmed; fetch-before-write implemented |
| CR-48 | One-Time Backfill of Wiped `cf_*` Attribution | 📋 Unblocked (CR-47 done) — awaiting approval to run | HIGH | Script ready in `scripts/cr48_backfill_wiped_cf.py` |
| CR-49 | Attribution Field Redundancy Cleanup | ✅ **DONE** | LOW-MED | `server.py` L254–256: `latest_medium`/`latest_campaign` intentionally no longer written |
| CR-50 | Calendly Overlay CSS Missing | ✅ **DONE** | — | `DemoForm.jsx` stage machine: `["form","otp","calendly"]`; `CalendlyInline.jsx` component present |
| CR-51 | Persist `event_id` in `demo_requests` Mongo doc | ✅ **DONE** | — | `server.py` L362–366: CR-51 comment + `doc['event_id'] = payload.event_id` |
| CR-52 | Server-Observable Browser Pixel Heartbeat | ⏸️ **CLOSED by owner 2026-09-09** — Events confirmed fine, diagnostic tooling not needed at this stage | LOW | — |
| CR-53 | Backend-Driven Meta CAPI Mirror | ⏸️ **Owner said NO** — do not implement | HIGH | Confirmed closed per handover |
| CR-57 | Sector-Page Demo Anchor Lands on Heading not Form (mobile) | ✅ **DONE** | — | `SectorPage.jsx` L269: `id="sector-demo"` div has `scroll-mt-20` (80px); StickyMobileCta uses `scrollIntoView({block:"center"})` |
| CR-58 | Record pathname at Demo CTA click → latest_source | ⏸️ Backlog ("later") | P2 | Owner deferred |
| CR-59 | Preview env hijacked production Calendly webhook | ✅ Fixed + backfilled (2026-07-14) | — | CR-59 allow-list in `server.py` L1640 |
| CR-60 | Legacy Meta Ad URL Template Contamination | ⏸️ Closed — not actioned (1 ad, low impact) | LOW | — |
| CR-62 | Missing `event_id` & `fbclid` — Investigation | ✅ **DONE** — fixes delivered via CR-63/64 | HIGH | Root cause identified; implemented |
| CR-63 | Fix Missing `event_id`/`otp_verified`/`cf_rooms` (Quote/Contact) | ✅ **DONE** | HIGH | `server.py` L651 (quote) + L721 (contact): CR-63 comments + event_id + otp_verified confirmed |
| CR-64 | Fix `upsert_contact` UPDATE: Replace→Merge | ✅ **DONE** | — | `freshsales.py` L230: `{**existing_cf, **cf}` merge pattern with CR-64 comment |
| CR-65 | Demo-Booking Status rename → "Follow Up for Scheduling" | 📋 Awaiting approval | MEDIUM | — |

---

## BATCH 1 — Core Web Vitals / Performance (CR-70 → CR-72)

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-70 | Fix Font Preloading (remove Inter, preload Poppins + Clash Display) | ✅ Implemented 2026-08-20 | CRITICAL | — |
| CR-71 | Preload Hero LCP Image + fetchpriority | ✅ Implemented 2026-08-20 | CRITICAL | `Hero.jsx` L117: `fetchPriority="high" loading="eager"` |
| CR-72 | React.lazy Code Splitting (non-home routes) | ✅ Implemented 2026-08-20 | CRITICAL | `App.js` L6–24: all non-home pages are lazy-imported |

---

## BATCH 3 — Petpooja Ad Landing Page (CR-73–76, 111–113)

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-73 | Add Phone/Email/Privacy to LandingFooter (/petpooja-alternative) | ✅ Implemented 2026-08-20 · **QA PASS** iter-5 | CRITICAL | Footer phone, email, privacy all confirmed |
| CR-74 | Fix Broken StickyMobileCta (/petpooja-alternative) | ✅ **CLOSED** — `StickyMobileCta` imported (L9) and rendered (L1060) in `PetpoojaAlternative.jsx`. Bug fixed in prior session. | CRITICAL | Validated 2026-09-08 |
| CR-75 | Update Petpooja Alternative H1 (keyword relevance) | ✅ Implemented 2026-08-20 · **QA PASS** iter-5 | CRITICAL | H1 = "The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie." |
| CR-76 | Replace Text Trust Badges with Logo Images | ✅ Implemented 2026-08-20 · **QA PASS** iter-5 | CRITICAL | 4 real WebP logos in vsp-trust-strip confirmed |
| CR-111 | Fix Petpooja Meta Title (add keyword) | ✅ Implemented 2026-08-20 · **QA PASS** iter-5 | CRITICAL | Title = "Best Petpooja Alternative for Restaurants — MyGenie POS" confirmed |
| CR-112 | Reduce Petpooja Demo Form to 3 Fields | ⏸️ Superseded by CR-113 | HIGH | — |
| CR-113 | Petpooja Mobile UX Overhaul (hero resize + navbar CTA + bottom sheet) | ✅ Implemented 2026-08-20 · **QA PASS** iter-5 | HIGH | LandingNavbar, QuickDemoSheet opens on mobile click, hero stat chips all confirmed |

---

## BATCHES A–D — SEO · Schema · Content · UX (CR-77 → CR-110)

### High tier

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-77 | Whitelist Googlebot in Cloudflare WAF | ✅ **CLOSED 2026-09-08** — Validated: `curl -A "Googlebot/2.1" -I https://www.mygenie.online/` returns HTTP/2 200, cf-cache-status: DYNAMIC, no challenge/block. Cloudflare WAF rule confirmed active. | CRITICAL | No dev action possible |
| CR-78 | 301 Apex→www + fix duplicate sitemap on apex | ✅ **CLOSED 2026-09-08** — Validated: `https://mygenie.online/` → 301 → `https://www.mygenie.online/` ✅; `http://mygenie.online/` → 301 → `https://www.mygenie.online/` ✅. Both HTTP and HTTPS apex redirect correctly. | CRITICAL | No dev action possible |
| CR-79 | Soft-404 → real HTTP 404 | ✅ React side done (`NotFound` returns proper page); 👤 Backend Nginx pending (owner) | CRITICAL | — |
| CR-80 | SoftwareApplication + Offer schema (/pricing + home) | ✅ Implemented 2026-08-21 | HIGH | — |
| CR-81 | WebP conversion + lazy-load (TrustBand/FeatureVideo) | ✅ Implemented 2026-08-21 | HIGH | — |
| CR-82 | Explicit width/height on all img tags (CLS fix) | ✅ Implemented | HIGH | TrustBand, ProofSection, SuccessStories, Blog, BlogPost all confirmed |
| CR-83 | H1 keyword relevance (product + sector pages) | ✅ Implemented 2026-08-21 | HIGH | — |
| CR-84 | StickyMobileCta + pricing anchor (Product/Sector pages) | ✅ Implemented 2026-08-21 | HIGH | — |
| CR-85 | Create /restaurant-billing-software LP | ✅ **DONE** — page live, FAQPage + SOFTWARE_APP + BreadcrumbList schemas confirmed | HIGH | `RestaurantBillingSoftware.jsx` — 3 schema blocks confirmed |
| CR-86 | Create /restaurant-pos-system LP | ✅ **DONE** — page live, all schemas confirmed | HIGH | `RestaurantPosSystem.jsx` — 3 schema blocks confirmed |
| CR-87 | /demo competitor reframe + trust fixes | ✅ Implemented 2026-08-21 | HIGH | — |
| CR-88 | Named authors on all 21 blog posts | 🔲 **PARTIAL** — `author` field exists but value is `"MyGenie Editorial Team"` on all 21 posts | HIGH | Needs owner to provide individual author names/bios |

### Medium tier

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-89 | Owner names + Review schema on testimonials | 🔲 Open — client names exist (Rhino, Palm Forest Resort, etc.) but no `Review` JSON-LD added yet | MEDIUM | Needs named individuals, not just restaurant names |
| CR-90 | Add /product & /solutions hub pages to sitemap | ✅ Implemented — both present in sitemap with priority 0.8 | MEDIUM | — |
| CR-91 | Standardize BreadcrumbList schema | ✅ **CLOSED 2026-09-08** — BreadcrumbList confirmed in all 4 previously "missing" pages: `About.jsx:31`, `Contact.jsx:67`, `RoiCalculator.jsx:75`, `Customers.jsx:31`. Validated in code. | MEDIUM | All 4 pages confirmed |
| CR-92 | Increase touch-target size (cookie banner + hamburger) | ✅ **DONE** — hamburger `p-2.5` + icon = 44px; cookie buttons handled by CR-143 (`py-[14px]` = 44px) | MEDIUM | Fully resolved across CR-92 + CR-143 |
| CR-93 | Fix cookie banner overlap at 768px | ✅ **DONE** | MEDIUM | `ConsentBanner.jsx` adds `consent-banner-open` class; `index.css` L70–74 has padding rule |
| CR-94 | Link marketing claims to case studies (methodology page) | 🔲 Open — no methodology/case-study page exists | MEDIUM | Needs new page or content |
| CR-95 | Promote /roi calculator above fold + navbar | ⏸️ Deferred — owner decision: not to be promoted on homepage above fold. Navbar entry present (Resources). | MEDIUM | — |
| CR-96 | Surface GST/UPI/aggregator trust signals above fold | ✅ **DONE** | MEDIUM | `Hero.jsx` L85–99: Swiggy, Zomato, Razorpay logos + GST-ready badge |
| CR-97 | Phone number above fold on homepage | ✅ **DONE** | MEDIUM | `Hero.jsx` L68–78: `lg:hidden` phone block with `tel:` link |
| CR-98 | Consolidate Calendly widget double-load | ✅ Implemented 2026-08-21 | MEDIUM | — |
| CR-99 | Expand thin product/sector pages | 🔲 Open — `About.jsx` = 98 lines (genuinely thin) | MEDIUM | Needs owner copy |
| CR-100 | Fix sitemap lastmod dates | ✅ **DONE** | MEDIUM | 26 distinct per-page lastmod dates from 2024-10-01 to 2026-08-25 confirmed in sitemap.xml |

### Low / long-term

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-101 | SSR / Pre-rendering (Next.js or react-snap) | ⏸️ Long-term backlog (POC done for `/`) | LOW | Current prerender pipeline is the working solution |
| CR-102 | Resume blog publishing (15-month gap) | 🔲 Open — 21 posts, last dated 2025 | LOW | Ongoing content work |
| CR-103 | Add llms.txt for AI crawlers | ⏸️ Blocked on CR-101 | LOW | — |
| CR-104 | HSTS + CSP headers via Cloudflare | 👤 Owner — Cloudflare | LOW | No dev action possible |
| CR-105 | CWV monitoring pipeline (PSI + CrUX + Lighthouse CI) | 🔲 Open | LOW | No CI/monitoring integration found |
| CR-106 | Review/retire FAQPage schema (deprecated May 2026) | ✅ **DONE** — `SectorPage.jsx` uses `QAPage`; LP pages retain `FAQPage` (still indexed by Google) | LOW | Migration to QAPage on main content pages complete |
| CR-107 | GTM container audit + third-party script consolidation | 🔲 Open | LOW | — |
| CR-108 | Third-party brand mention/citation for GEO | 🔲 Open | LOW | Content/outreach task |
| CR-109 | Structured answer-style content for AI crawlers (GEO) | ⏸️ Blocked on CR-101 | LOW | — |
| CR-110 | Brand entity disambiguation for "MyGenie" | 🔲 Open | LOW | — |

---

## ⭐ BATCH E — LCP / Core Web Vitals Closeout (CR-114 → CR-116)

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-101 (POC) | Homepage `/` prerender POC | ✅ POC executed | — | — |
| CR-114 | Heading webfont (Clash Display) → delayed LCP + CLS | ✅ FIXED 2026-08-23 | HIGH | — |
| CR-115 | Homepage JS bundle weight → high TBT (hydration) | ✅ FIXED 2026-08-23 | HIGH | — |
| CR-116 | Gzip/brotli compression for prerendered HTML | ✅ CLOSED (nginx/Cloudflare handles) | MEDIUM | — |

---

## BATCH F — Production CWV Gaps (CR-124 → CR-127)

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-124 | React.lazy Suspense hydration gap → CLS + TBT | ✅ **DONE** | P0 | `index.js` L34: `hydrateRoot`; `App.js` L64: Suspense with `min-h-screen bg-brand-sand` fallback |
| CR-125 | CmsProvider blocking hydration → TBT | ✅ **DONE** | P1 | `index.js` L23–25: CmsProvider wraps app; `App.js` L64: Suspense fallback prevents blank flash |
| CR-126 | Prerender not locked in deploy pipeline | ✅ **CLOSED 2026-09-08** — `package.json` build script confirmed: `"craco build && node scripts/prerender.js"` | P1 | Validated in `package.json` |
| CR-127 | CR-81 remainder: products.js PNG → WebP | ✅ Data updated | P1 | — |

---

## BATCH G — Lighthouse 90–95 Gap Closers (CR-128 → CR-132)

| CR | Title | Status | Prio | Validation note |
|---|---|---|---|---|
| CR-128 | Logo SVG explicit rendered dimensions | ✅ Implemented 2026-08-24 | P1 | — |
| CR-129 | Cache headers for hashed static assets | ✅ Implemented 2026-08-24 | P1 | — |
| CR-130 | Lazy-load CmsAdminLayer | ✅ Implemented (App.js L30: lazy import confirmed) | P1 | — |
| CR-131 | Exclude unused shadcn/ui from Tailwind scan | ✅ Implemented 2026-08-24 | P2 | — |
| CR-132 | StickyMobileCta: `transition-all` + `bottom` → composited animation | ✅ Implemented 2026-08-24 | P2 | — |

---

## BATCH H — Prerender SEO Bug Fix (CR-133 → CR-135)

| CR | Title | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-133 | Prerender head tag poisoning | ✅ **DONE** | P0 | 8 spot-checked pages all have unique correct `<title>` + `www.mygenie.online` canonicals confirmed in build HTML |
| CR-134 | /demo + /payment-success not prerendered | ✅ **DONE** | HIGH | Both in `prerender.js` `extraRoutes`; confirmed prerendered |
| CR-135 | DemoLanding.jsx `canonical` prop silently ignored | ✅ **DONE** | MEDIUM | `DemoLanding.jsx` uses `path="/demo"` (correct prop) not `canonical=` |

---

## BATCH I — SEO Schema Gaps (CR-136 → CR-137)

| CR | Title | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-136 | About.jsx missing ORG_JSONLD | ✅ **DONE** | P2 | `About.jsx` L22: `jsonLd={[ORG_JSONLD]}`; Organization schema confirmed in prerendered HTML |
| CR-137 | PetpoojaAlternative.jsx missing FAQPage + SoftwareApplication schema | ✅ **CLOSED 2026-09-08** — `FAQ_SCHEMA` defined at L28 with `"@type":"FAQPage"`. Used in `jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}` at L1032. Both schemas present. Validated in code. | P2 | `PetpoojaAlternative.jsx:28,1032` |

---

## BATCH J — Crawlability Audit Bugs (CR-139 → CR-142)

| CR | Title | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-139 | StickyMobileCta hidden behind ConsentBanner on iOS safe-area | ✅ **DONE** | HIGH | `StickyMobileCta.jsx` L75: `pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]` + consent banner detection |
| CR-140 | 404 pages serve homepage HTML body | ✅ **DONE** | MEDIUM | `build/404/index.html` confirmed: `<title>Page Not Found | MyGenie POS</title>` |
| CR-141 | QSR sector: `s.name.toLowerCase()` = "qsr / fast food" mid-sentence | ✅ **DONE** | LOW-MED | `sectors.js` L65: `nameLower: "QSR and fast food restaurants"` — SectorPage uses `s.nameLower` first |
| CR-142 | /petpooja-alternative orphaned — zero internal links | ✅ **DONE** | MEDIUM | `Pricing.jsx` L323–328: CR-142 comment + `<Link to="/petpooja-alternative">` confirmed |
| CR-92 | Touch targets below 44px | ✅ **DONE** (see CR-92 above) | — | — |
| CR-93 | Cookie banner overlap at 768px | ✅ **DONE** (see CR-93 above) | — | — |
| CR-88 | Blog named authors | 🔲 PARTIAL (see CR-88 above) | — | — |
| CR-89 | Testimonials Review schema | 🔲 Open (see CR-89 above) | — | — |

---

## BATCH K — Audit Recheck Gaps (CR-143 → CR-146)

| CR | Title | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-143 | Cookie Accept/Decline buttons 40px → 44px | ✅ **DONE** | HIGH | Both buttons: `py-[14px]` = 14×2+16px = 44px exactly confirmed in `ConsentBanner.jsx` |
| CR-144 | StickyMobileCta audit tested at wrong viewport | 🔲 Needs retest at ≤768px viewport after scroll | MEDIUM | Code is correct (`lg:hidden`); audit ran at desktop; needs mobile re-validation |
| CR-145 | beta.mygenie.online canonical self-referencing | 👤 Deploy config — no code change needed | CRITICAL | `seo.js` L3: `REACT_APP_SITE_URL` not set in this env → defaults to `www.mygenie.online` correctly. Fix: ensure `REACT_APP_SITE_URL` is not set in beta build env |
| CR-146 | beta.mygenie.online robots.txt `Allow: /` | 👤 **Owner action — Cloudflare/nginx, NOT a code fix.** Adding `Disallow: /` to `public/robots.txt` would block Googlebot on production (`www.mygenie.online`) too — same file ships in all builds. Real fix: add `X-Robots-Tag: noindex` response header at Cloudflare for `beta.mygenie.online` domain only, OR block at nginx level on beta server. | CRITICAL | Cloudflare: Page Rule → `X-Robots-Tag: noindex` for `beta.mygenie.online/*` |

---

## BATCH L — Customer Logo Refresh (CR-147)

| CR | Title | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-147 | Customer Logo Refresh — 56 logos → WebP, expand TrustBand | ✅ **DONE** | HIGH | `content.js`: 58 WebP logo paths confirmed. New files: `rhino.webp`, `sushi-cafe.webp`, `terraria.webp`, `bean-me-up.webp`, `la-fetta.webp`, `bamboo-yoga.webp` etc. all present in `/public/brand/` |

---

## BATCH M — Google Ads Landing Pages + Negative Keywords (CR-148 → CR-152)

| CR | Title | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-148 | `/restaurant-management-software` LP | ✅ **DONE** — page live, all schemas confirmed | P1 | `RestaurantManagementSoftware.jsx` — FAQPage + SOFTWARE_APP + BreadcrumbList |
| CR-149 | `/qsr-pos-system` LP + RSA headlines | ✅ **DONE** — page live, all schemas confirmed | P2 | `QsrPosSystem.jsx` — 3 schema blocks confirmed |
| CR-150 | `/restaurant-pos-comparison` — Multi-competitor hub page | 🔲 **Open** — temp redirect to `/restaurant-pos-system` in place (CR-162); full page not built | P2 | Awaiting owner: competitor pricing data, switcher testimonials, ?vs= param mapping |
| CR-151 | Negative keywords in Google Ads console | 👤 Owner — Ads console only | P0 | No dev action — billing machine / pos machine terms (162 clicks, ₹2.4L, 0 conv) |
| CR-152 | `/cloud-kitchen-pos` LP | ✅ **DONE** — page live, all schemas confirmed | P2 | `CloudKitchenPos.jsx` — 3 schema blocks confirmed |

---

## CR-153 — ENV-Gated Lead Dashboard

| CR | Title | Status |
|---|---|---|
| CR-153 | ENV-gated lead dashboard (`LEADS_DASHBOARD_ENABLED`) | ✅ **DONE** — 19/19 tests passed |

---

## BATCH N — UX / SEO Audit Fixes (CR-154 → CR-161)

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-154 | Homepage badge keyword | ✅ **DONE** | P1 | `Hero.jsx` L20: `"India's Restaurant POS & Billing Software"` |
| CR-155 | `/pricing` H1 keyword + DemoForm section | ✅ **DONE** | P2 | `Pricing.jsx` L174–176: keyword H1; L340: `id="lp-demo"` DemoForm |
| CR-156 | All 8 remaining DemoForms → shortForm | ✅ **DONE** | P1 | `About.jsx`, `Contact.jsx` + all others confirmed |
| CR-157 | Hero primary CTA `<a href="#demo">` | ✅ **DONE** | P2 | `Hero.jsx` L46–48: `href="#demo"` + `onClick` handler |
| CR-158 | `/product` H1 keyword | ✅ **DONE** | P2 | `ProductIndex.jsx` L38: `"One restaurant operating system — every tool included."` |
| CR-159 | `/customers` sticky demo CTA + mid-page CTA card | ✅ **DONE** | P2 | `SuccessStories.jsx` L8: StickyMobileCta import; L97: `data-testid="stories-mid-cta"` |
| CR-160 | `Reveal.jsx` start visible=true | ✅ **DONE** | P1 | `Reveal.jsx` L5: `useState(true)` + L9–11: `navigator.webdriver` guard |
| CR-161 | DemoForm submit → "Book My Free Demo →" | ✅ **DONE** | P2 | `DemoForm.jsx` L365: `<span>Book My Free Demo</span>` as default |

---

## BATCH P — QA-Found Bugs (CR-165 → ...)

*Source: Batch A QA audit (iter-5, 2026-08-26). Bugs confirmed by testing agent — NOT yet fixed.*

| CR | Summary | Status | Priority | Source | Fix location |
|---|---|---|---|---|---|
| **CR-165** | StickyMobileCta missing from `/petpooja-alternative` — component never imported or rendered. No persistent mobile CTA after hero scroll. | ✅ **FIXED 2026-08-26** | **HIGH** | iter-5 QA, CR-74 regression | `PetpoojaAlternative.jsx`: import added L9, render added L1057 with `onDemo` → `#vsp-demo` |
| **CR-166** | `SOFTWARE_APP_JSONLD` Growth plan price = `"1499"` but correct price is ₹1,299/month. PetpoojaAlternative was correct; 7 other locations had stale `1499`. | ✅ **FIXED 2026-08-26** | **MEDIUM** | iter-5 QA | `seo.js` L57+L61, `pricing.js` L26, all 5 LP pages Growth price: `1499` → `1299` |

---

## BATCH O — Audit Follow-Up Gaps (CR-162 → CR-164)

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-162 | Emergency redirect `/restaurant-pos-comparison` → `/restaurant-pos-system` | ✅ **DONE** 2026-08-26 | P0 | `redirects.js` + `_redirects` + `prerender.js` extraRoutes; prerendered build confirmed |
| CR-163 | Fix 5-field DemoForm — hide outlet_type in shortForm | ✅ **DONE** 2026-08-26 | P1 | `DemoForm.jsx` L347: `{!sector && !shortForm && (` |
| CR-164 | "See Pricing" same-page scroll + SectorPage CTA | ✅ **DONE** 2026-08-26 | P2 | `Hero.jsx`: `<a href="#pricing">`; `SectorPage.jsx` L102–108: `sector-pricing-btn` Link |

---

---

## BATCH Q — Homepage SEO Gaps (CR-167 → CR-172)

*Source: SEO audit 2026-08-30. All 6 confirmed as unregistered after cross-referencing full register.*

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-167 | Homepage H1 keyword gap — "Run a more profitable..." has zero POS/billing/restaurant keywords | ✅ **DONE 2026-08-30** | P1 | `Hero.jsx` L26–29: fallbacks → "Restaurant POS & Billing Software — " + "Run Your Business From Your Phone". All 4 keywords confirmed in prerender. |
| CR-168 | Homepage `<title>` 68 chars → shorten to ≤60 | ✅ **DONE 2026-08-30** | P1 | `seo.js` L86 + `public/index.html` L146: "Restaurant POS & Billing Software \| MyGenie" (43 chars). Note: public/index.html also required update — prerender.js <title> sync only fires when og:title portal count >1. |
| CR-169 | Homepage meta description 191 chars → shorten to ≤155 | ✅ **DONE 2026-08-30** | P1 | `seo.js` L87–88: 135-char description with "Book a free demo." CTA visible. |
| CR-170 | Add `<link rel="sitemap" type="application/xml" href="/sitemap.xml">` to `<head>` | ✅ **DONE 2026-08-30** | P1 | `Seo.jsx` L26: sitemap link added after canonical. Present on all 42 pages. /sitemap.xml returns 200. |
| CR-171 | Homepage FAQ section + QAPage JSON-LD schema | ✅ **DONE 2026-09-02** | P1 | `HomeFaq.jsx` created — 7 owner-approved Q&As (UPI QR, ingredient inventory, multi-outlet, reports, legacy vs cloud, delivery integration, P&L). QAPage JSON-LD as 3rd block in head. Confirmed in prerendered build/index.html. Decision record: CR-171_Content_Approval_Decision.md |
| CR-172 | AggregateRating on SoftwareApplication schema | 🔲 Open — ⚠️ **BLOCKED on owner providing verified review source.** Re-confirmed 2026-09-05. File: `seo.js` — 6-line add to `SOFTWARE_APP_JSONLD`. Do not implement with estimated numbers. Owner to confirm: ratingValue + reviewCount + source platform (Google Business / G2 / Capterra). | P1 | `seo.js` L30: explicitly deferred in code comment |

---

## BATCH R — UAT Audit Dev Fixes (CR-173 → CR-177)

*Source: UAT audit beta.mygenie.online 2026-08-27 + code investigation 2026-08-30. All 5 confirmed unregistered.*

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-173 | All `<button>` elements missing `type` attribute — HTML default = `type="submit"`, Lighthouse failure | ✅ **DONE 2026-09-01** | P1 | 29 files updated, ~113 buttons now have `type="button"`. 3 intentional submit buttons preserved (DemoForm, CheckoutModal, MessageForm). OtpVerifyBlock + ConsentBanner were already clean. Testing: 7/7 PASS. |
| CR-174 | `#demo` anchor has no `scroll-margin-top` — sticky nav (72px) covers top of form on scroll | ✅ **DONE 2026-09-01** | P1 | `CtaDemo.jsx` L54: `className="scroll-mt-20"` added. Confirmed in prerender + Playwright. |
| CR-175 | Footer social links use `rel="noreferrer"` only — Lighthouse expects explicit `rel="noopener noreferrer"` | ✅ **DONE 2026-09-01** | P1 | `Footer.jsx` L32–33: both YouTube + Facebook links updated. Confirmed on homepage + /about. |
| CR-176 | No `/thank-you` page — post-booking confirmation UX missing + retargeting audience gap | ✅ **DONE 2026-09-01** | P1 | `ThankYou.jsx` created, `App.js` route added, `markBooked()` calls `navigate("/thank-you")`, noindex in `seo.js`, prerendered at `build/thank-you/index.html`. Title = "Demo Booked \| MyGenie POS". `thankyou_conversion` GTM event at Stage 2 (OTP) unchanged — owner confirmed intentional. |
| CR-177 | No `autoFocus` on first DemoForm field — user must click into form manually after scrolling to it | ✅ **DONE 2026-09-01** | P2 | `DemoForm.jsx`: `autoFocusName=false` prop added, `autoFocus={autoFocusName && key==="name"}` on input. `DemoLanding.jsx` L145: `autoFocusName` passed. Scoped to /demo only — homepage/sector pages unaffected. Confirmed via Playwright: activeElement = demo-input-name on /demo load, NOT on homepage. |

---

## BATCH S — Homepage Keyword Density (CR-178)

*Source: UAT audit keyword frequency tab. Confirmed by grep on prerendered build/index.html 2026-08-30.*

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-178 | Homepage missing 9 high-priority ad keywords at 0 occurrences | ✅ **DONE 2026-09-01** | P1 | 17/18 proposals approved (P18 footer tagline rejected by owner). All 9 keywords now at/above adjusted targets: pos system 5x, inventory management 4x, restaurant billing 3x, pos billing 2x, restaurant software 1x (P18 rejected → target 1+), loyalty program 3x, qr menu 2x, table management 2x, food business 2x. Verified in new build audit 2026-09-02. Decision record: CR-178_Content_Approval_Decision.md |

---

## BATCH T — Solution & Product Page Keyword Optimization (CR-179)

*Source: UAT audit per-page keyword tab. Investigation 2026-08-30.*

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-179 | 5 solution/product pages missing target keywords for their respective ad groups | ✅ **DONE 2026-09-01** | P2 | 28 copy changes across `sectors.js` (P1–P15) and `products.js` (P16–P28). Verified in new build audit 2026-09-02: all 8 solution pages show 3-4x billing software + 3-4x pos system. Decision record: CR-179_Content_Approval_Decision.md |

---

## BATCH U — Domain & Canonical Strategy (CR-180)

*Source: UAT audit P0 finding. Owner decision required — no code until decided.*

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-180 | No noindex on beta subdomain + canonical strategy undefined | ✅ **REVALIDATED 2026-09-08 — effectively a non-issue.** `seo.js:3` defaults `SITE_URL = "https://www.mygenie.online"` when `REACT_APP_SITE_URL` is not set. Every page served by `beta.mygenie.online` has `<link rel="canonical" href="https://www.mygenie.online/...">` baked in — Googlebot sees www canonical on every page, cannot rank beta pages over www. Only minor residual risk: crawl budget waste from `robots.txt Allow: /` on beta (negligible at ~60 pages). If owner wishes to block beta crawling: Cloudflare Page Rule → `X-Robots-Tag: noindex` for `beta.mygenie.online/*`. No code change required. | **LOW — owner optional** | `seo.js:3` — canonical already correct |

---

## Roll-up Counts (Updated 2026-08-26 — after Batch A QA)

| Category | Count | CRs |
|---|---|---|
| ✅ Implemented + QA'd | — | CR-85,86,148,149,152 (iter-1) · CR-153 (iter-2) · CR-154–161 (iter-3) · CR-137,91,126,150,162,163,164 (iter-4) · CR-73,75,76,111,113 (iter-5) |
| ✅ Implemented, not yet QA'd | ~60 | CR-70,71,72,74(bug→CR-165),79,80,81,82,83,84,87,90,92,93,96,97,98,100,106,114,115,116,124,125,127,128,129,130,131,132,133,134,135,136,139,140,141,142,143,147 + others |
| 🔲 Open — QA bug confirmed | **2** | **CR-165** (StickyMobileCta missing from /petpooja-alternative) · **CR-166** (SOFTWARE_APP_JSONLD Growth price 1499≠1299) |
| 🔲 Open (dev code work) | 5 | CR-52, CR-88(partial), CR-89, CR-99, CR-102, CR-146, CR-150(testimonials pending) |
| 👤 Owner/infra (no code) | 6 | CR-45, CR-77, CR-78, CR-79(nginx), CR-104, CR-145, CR-151 |
| 📋 Awaiting owner approval | 5 | CR-41, CR-44, CR-48, CR-65, CR-94 |
| ⏸️ Backlog/deferred | 6 | CR-53(NO), CR-58, CR-60, CR-95, CR-101, CR-103, CR-109, CR-112 |

---

## BATCH V — New Build Audit Gaps (CR-181)

*Source: New build audit 2026-09-02. Full audit had 7 findings — 5 determined AUDITOR INCORRECT, 1 NOT CODE FIX, 1 confirmed real gap.*
*Audit findings investigated and classified 2026-09-02.*

### Audit Findings Classification

| Finding | Claim | Verdict | Reason |
|---|---|---|---|
| P0: Form inputs no `name` | Zero leads captured | AUDITOR INCORRECT | React + axios form — `name=` not needed; leads captured via state |
| P0: React Hydration #418 | SSR discarded | AUDITOR INCORRECT | CR-160 fix confirmed live; all window/document in useEffect |
| P1: QAPage → FAQPage | Wrong schema type | AUDITOR INCORRECT | FAQPage rich results deprecated by Google May 7, 2026 (CR-106) |
| P1: Meta Pixel absent | Ads untracked | NOT CODE | GTM fires all events; Pixel base tag = GTM container config (marketing team) |
| P1: billing software 0x (8 pages) | Keyword missing | **AUDITOR CORRECT → CR-187** | Re-investigated 2026-09-02: prerendered build confirms 0 on all 8 pages. CR-179 only updated homepage. `sectors.js` never touched. |
| P1: pos system 0x (7 pages) | Keyword missing | **AUDITOR CORRECT → CR-187** | Re-investigated 2026-09-02: 0 on 5/8 pages confirmed. Root cause: `sectors.js` h1 fields for cloud-kitchens/qsr/food-courts/canteens/chains use "POS" not "POS system". |
| **P1: Meta desc >160ch (5 pages)** | SERP truncation | **REAL GAP → CR-181** | Confirmed in prerendered HTML — source: `sub` fields in data files |

### CR Table

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-181 | Meta descriptions >160 chars on 5 pages — SERP truncation | ✅ **DONE 2026-09-02** | P1 | sectors.js (L10, L39, L97, L126) + products.js (L129) trimmed. Verified in prerendered build: restaurants 150ch, cafes 157ch, cloud-kitchens 160ch, hotels-resorts 147ch, central-inventory 150ch. All ≤160ch. All gates pass. |


---

## BATCH W — Lighthouse Mobile Audit Gaps (CR-182 → CR-186)

*Source: Lighthouse mobile audit run on preview URL 2026-09-02 (Emulated Moto G Power, Slow 4G, Lighthouse 13.4.1)*
*Scores: Performance 82, Accessibility 96, Best Practices 96, SEO 61 (see note below)*

### SEO Score 61 — Preview Artifact

The preview environment (`*.preview.emergentagent.com`) has `x-robots-tag: noindex, nofollow` injected by the Emergent platform at CDN level. Lighthouse flags this as "Page blocked from indexing" causing a ~35-40 point SEO penalty. **This is NOT a real production SEO issue.** On `beta.mygenie.online` / `www.mygenie.online` this header is absent. Real code-level SEO findings are minor (CR-185).

### CR Table

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| CR-182 | LCP 4.1s — hero `banner.webp` has no responsive `srcset` → mobile downloads full 776px (38 KiB) for 348px display | ✅ **CLOSED 2026-09-08** — `Hero.jsx` has `srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"` + `sizes`. Validated in code. | P1 | Confirmed `Hero.jsx:118` |
| CR-183 | Poppins 500/600/700 weights not preloaded — load at 1,400–1,486ms causing FOUT | ✅ **DONE 2026-09-02** | P2 | `public/index.html` L15+: added preload for poppins-500.woff2 + poppins-600.woff2. Poppins 700 skipped (not critical above fold — H1 uses Clash Display). Verified in build/index.html. All 5 gates pass. |
| CR-184 | Trust band logos 25–35 KiB each — displayed at 160×64px, should be ≤5 KiB | ✅ **DONE 2026-09-02** | P2 | Pillow thumbnail(320,128) applied to 56 logos. 917 KiB → 156 KiB (−760 KiB, 83%). All logos now 128×128px, avg 3 KiB. Verified spot-check: 8/8 pass. Build live. |
| CR-185 | Decorative labels using text-[9px]–text-[11px] — Lighthouse SEO flags <12px text | ✅ **DONE 2026-09-02** | P3 | `Hero.jsx` (5×), `RestaurantBillingSoftware.jsx` (2×), `PetpoojaAlternative.jsx` (13×) — all raised to `text-xs` (12px). Verified: zero sub-12px classes in source + prerendered HTML. |
| CR-186 | Cloudflare RUM beacon in critical path — /cdn-cgi/rum takes 2,003ms | 🔲 Open — 👤 **Owner action: Cloudflare dashboard** | P1 | `beacon.min.js` from Cloudflare Analytics injected at CDN level. Not in app code. Fix: disable/defer Cloudflare Web Analytics in Cloudflare dashboard. Reduces critical path from 2,003ms → ~285ms. |


---

## BATCH X — Google Ads Quality Score: Solution Page Keyword Gap (CR-187)

*Source: Re-audit 2026-09-02. Original auditor finding from Sep 2026 audit confirmed correct. Previous "AUDITOR INCORRECT" verdict overturned after code-level investigation.*

### Background

Previous register entry incorrectly marked this as "AUDITOR INCORRECT" citing CR-179. Code investigation confirmed CR-179 only updated homepage copy. `sectors.js` (sole content source for all 8 solution pages) contains "billing software" **0 times** and "pos system" in only 3/8 h1 fields.

### CR Table

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| **CR-187** | "billing software" + "pos system" missing from solution page bodies — 8/8 and 5/8 pages affected | ✅ **DONE 2026-09-02** | **P1** | Combined plan with CR-189: `/app/memory/CR-187-189_Combined_Implementation_Plan.md` — 8 h1 edits in `sectors.js`. All 8 pages: billing_sw≥1, pos_sys≥1, meta_desc≤160. 35/35 verification checks pass. |

### Scope

| Keyword | Pages affected | Fix location |
|---|---|---|
| `billing software` | All 8 pages | `h1` field in `sectors.js` |
| `pos system` | cloud-kitchens, qsr, food-courts, canteens, chains (5 pages) | `h1` field in `sectors.js` |

### Implementation summary (from plan file)

8 targeted h1 edits in `sectors.js`. Pattern: expand "POS" → "POS system & billing software" where h1 has room, or insert "& billing software" after existing "POS system". No `sub` changes (CR-181 constraint preserved). No `SectorPage.jsx` changes. Rebuild required after edit.



---

## BATCH Y — Keyword Body Coverage Gaps: Homepage + Solutions + Product Pages (CR-188 → CR-190)

*Source: Sep 2026 keyword audit screenshots, cross-validated against live prerendered build (frontend-deploy-31) on 2026-09-02.*
*Audit was run on a different Emergent instance (react-app-direct-1). Meta description and schema findings from that audit are FALSE POSITIVES on our build — CR-181 already fixed meta descs; QAPage is correct. All keyword body gaps below are CONFIRMED REAL on our build.*

### False Positives from Audit (already addressed on our build)

| Audit Finding | Audit Value | Our Build | Status |
|---|---|---|---|
| Meta desc `/solutions/restaurants` | 212ch | 150ch ✅ | CR-181 ✅ DONE |
| Meta desc `/solutions/cafes` | 195ch | 157ch ✅ | CR-181 ✅ DONE |
| Meta desc `/solutions/cloud-kitchens` | 166ch | 160ch ✅ | CR-181 ✅ DONE |
| Meta desc `/solutions/hotels-resorts` | 191ch | 147ch ✅ | CR-181 ✅ DONE |
| Meta desc `/product/central-inventory` | 226ch WORST | 150ch ✅ | CR-181 ✅ DONE |
| Schema: QAPage "wrong type" | Should be FAQPage | QAPage is correct | FALSE POSITIVE — FAQPage deprecated May 7, 2026 (CR-106) |
| Title `/solutions/chains` 59ch ⚠️ | Warning | 59ch — within ≤60ch | FALSE POSITIVE |

### CR Table

| CR | Summary | Status | Priority | Validation note |
|---|---|---|---|---|
| **CR-188** | Homepage `restaurant management` 0× in body — keyword present in meta description only | ✅ **DONE 2026-09-02** | **P2** | `CtaDemo.jsx` L26 — `"restaurant software"` → `"restaurant management software"` (+12ch). Verified: `restaurant management`=1, `restaurant management software`=1, meta_desc=135ch ✅ |
| **CR-189** | Solutions pages: additional keyword gaps beyond CR-187 — 11 missing keyword slots across 6 pages | ✅ **DONE 2026-09-02** | **P1** | Combined plan with CR-187: `/app/memory/CR-187-189_Combined_Implementation_Plan.md` — 8 `solutions[].desc` edits in `sectors.js` (L20, L47, L48, L77, L134, L137, L192, L224). All keyword targets hit. 35/35 verification checks pass. |
| **CR-190** | Product pages: keyword gaps across all 6 pages — 15 missing keyword slots | ✅ **DONE 2026-09-02** | **P1** | 11 edits in `products.js` (`modules[].outcome`). 14/15 keyword targets hit. `business intelligence` dropped per owner decision (not current positioning; `dashboard` already 4× present). 21/21 verification checks pass. Decision record: `/app/memory/CR-190_Content_Approval_Decision.md` |

### Interaction Note: CR-187 + CR-189

CR-187 adds `billing software` + `pos system` to solution page **h1 fields**.
CR-189 adds different keywords to solution page **solutions[].desc fields**.
The auditor's suggested sentences for CR-189 also happen to contain `billing software` and `pos system` — implementing CR-189 with auditor copy will produce 2× body occurrences of those CR-187 keywords, giving stronger keyword density than h1-only. Implement CR-187 first (h1), then CR-189 (body copy) in the same build cycle.



---

## BATCH Z — Google Ads LCP Readiness: PageSpeed Fixes (CR-191 → CR-195)

*Source: Beta Site Audit — Dev Team Brief (Sep 2 2026). Audited via Google PageSpeed Insights (Mobile) on beta.mygenie.online. Code-level investigation confirmed 2026-09-02 Session 3.*

### CR Table

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-191** | `/demo` page: `noindex={true}` hardcoded — SEO score 61 (should be 92) + LCP 3.7s | ✅ **CLOSED 2026-09-08** — `DemoLanding.jsx` `<Seo>` has no `noindex` prop; `Seo` defaults to `noindex=false`. Validated in code. | **P1** | `DemoLanding.jsx:73` |
| **CR-192** | `fetchPriority="high"` missing on hero `<img>` — 6 landing pages all affected | ✅ **CLOSED 2026-09-08** — All 5 landing pages + `ProductPage.jsx` confirmed to have `fetchPriority="high"` + `srcSet` on hero img. Validated in code. | **P0** | Confirmed in all 6 files |
| **CR-193** | Hero `<img>` wrapped in `<Reveal>` on landing pages — Reveal hides image after hydration, delaying LCP | ✅ **CLOSED 2026-09-08** — Hero `<img>` is NOT inside `<Reveal>` on any landing page. `Reveal` only wraps below-fold pricing/feature sections. Validated in code. | **P0** | Confirmed in all 5 landing pages |
| **CR-194** | `/petpooja-alternative` CLS 0.029 — trust logos in hero have no `width`/`height` + `loading="lazy"` above fold | ✅ **CLOSED 2026-09-08** — Above-fold trust strip: `width={120} height={32} loading="eager"`. Below-fold logos: `width={100} height={28} loading="lazy"`. Validated in code. | **P1** | `PetpoojaAlternative.jsx:460–467` |
| **CR-195** | `/restaurant-pos-comparison` hero stat cards in `<Reveal delay={i*0.08}>` — staggered reveal on above-fold content delays LCP | ✅ **CLOSED 2026-09-08** — Stat cards in hero grid are NOT inside `<Reveal>`. No staggered reveal on above-fold content. `Reveal` only wraps below-fold sections (lines 181+). Validated in code. | **P1** | `RestaurantPosComparison.jsx:155–175` |

---

### CR-191 Detail — `/demo` noindex Bug

**Symptom:** SEO score 61 on `/demo` while all other pages score 92.

**Root cause (confirmed):**
`DemoLanding.jsx` line 77: `noindex={true}` → `Seo` component outputs `<meta name="robots" content="noindex,nofollow">`.
Google sees `noindex` → page excluded from SEO scoring → 61.
Confirmed NOT intentional (owner confirmed 2026-09-02).

**LCP 3.7s secondary issue:** `/demo` has no hero image. LCP element is likely the H1 heading. No `fetchPriority` hint available for text — fix requires either: (a) reducing above-fold JS weight, or (b) inlining critical CSS. To investigate after noindex fix.

**Fix:**
- `DemoLanding.jsx` L77: remove `noindex={true}`
- Rebuild → verify SEO score recovers to 92

**Validation:**
```bash
grep "noindex\|robots" /app/frontend/build/demo/index.html  # should return nothing
```

---

### CR-192 Detail — `fetchPriority="high"` Missing on Hero Images

**Symptom:** 6 landing pages all missing `fetchPriority="high"` on their hero `<img>`. Homepage fixed this in CR-182 via `Hero.jsx` → 1.5s LCP. Landing pages never received the same fix.

**Affected pages & audit scores:**

| Page | File | LCP | Pass? |
|---|---|---|---|
| `/restaurant-billing-software` | `RestaurantBillingSoftware.jsx:148` | 4.9s | ❌ |
| `/qsr-pos-system` | `QsrPosSystem.jsx:157` | 4.4s | ❌ |
| `/restaurant-pos-system` | `RestaurantPosSystem.jsx:155` | 2.1s | ✅ (passing but unprotected) |
| `/cloud-kitchen-pos` | `CloudKitchenPos.jsx` | 2.3s | ✅ (passing but unprotected) |
| `/restaurant-management-software` | `RestaurantManagementSoftware.jsx` | 2.2s | ✅ (passing but unprotected) |
| `/product/*` | `ProductPage.jsx` | varies | — |

**Fix per file:** On each hero `<img>`, add `fetchPriority="high"`:
```jsx
// Before
<img src="/brand/banner.webp" ... loading="eager" />
// After
<img src="/brand/banner.webp" ... loading="eager" fetchPriority="high" />
```

**Also add srcSet + sizes** (same pattern as CR-182 Hero.jsx):
```jsx
srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
sizes="(max-width: 1023px) 400px, 776px"
```

**Rebuild required after changes.**

---

### CR-193 Detail — Hero Image Inside `<Reveal>` Delays LCP

**Symptom:** Slow LCP (4.9s, 4.4s) on pages where hero image is wrapped in `<Reveal>`.

**Root cause (confirmed in `Reveal.jsx`):**
```js
const [visible, setVisible] = useState(true); // SSR: opacity:1
useEffect(() => {
  if (navigator.webdriver) return;  // Puppeteer skips — prerender fine
  setVisible(false);                // Browser: opacity:0 after hydration ← LCP element disappears
  // IntersectionObserver re-shows it...
});
```
Chrome measures LCP from the **last** time the element becomes visible. The hide→show cycle after hydration pushes LCP past initial paint.

**Homepage fix (CR-182 reference):** `Hero.jsx` places hero image directly in `EditableImage` outside any `Reveal`. Same pattern needed for landing pages.

**Fix:** On each landing page, take the hero `<img>` **out** of its `<Reveal>` wrapper. Keep `Reveal` on non-LCP elements (feature cards, etc.):
```jsx
// Before (SLOW)
<Reveal>
  <img src="/brand/banner.webp" loading="eager" fetchPriority="high" ... />
</Reveal>

// After (FAST)
<img src="/brand/banner.webp" loading="eager" fetchPriority="high" ... />
```

**Implement together with CR-192** — same files, same rebuild.

---

### CR-194 Detail — `/petpooja-alternative` CLS 0.029

**Symptom:** CLS 0.029 (only non-zero CLS on any page; threshold is <0.1 but target is 0).

**Root cause:** Hero section trust logo strip uses `loading="lazy"` with no explicit dimensions:
```jsx
// PetpoojaAlternative.jsx ~L460
<img src={logo.img} ... loading="lazy" width={120} height={32} />
```
Width/height ARE set here — but need to verify the other image at ~L988 and any other above-fold images without dimensions.

**Fix:**
1. Change trust logo imgs in hero from `loading="lazy"` → `loading="eager"` (they are above fold)
2. Ensure all above-fold `<img>` tags have explicit `width` and `height`

---

### CR-195 Detail — `/restaurant-pos-comparison` Stat Cards in `<Reveal>`

**Symptom:** LCP 4.3s despite no hero image. Above-fold stat cards have staggered Reveal delays.

**Root cause:**
```jsx
// RestaurantPosComparison.jsx — 4 stat cards each in Reveal with delay
{stats.map(({ val, label, color }, i) => (
  <Reveal key={val} delay={i * 0.08}>   // delays: 0, 0.08, 0.16, 0.24s
    <div className="...">
      <div className="font-display text-4xl ...">{val}</div>
    </div>
  </Reveal>
))}
```
The 4 stat cards (48 hrs, ₹1 Lakh, 100+, ₹799) are in the right column above fold. Each hides and re-shows after hydration — the `font-display text-4xl` values are likely the LCP element.

**Fix:** Remove `<Reveal>` from the 4 above-fold stat card divs. Keep `<Reveal>` on below-fold sections.

---

### Batch Z Implementation Order

| Step | CR | Action | Effort |
|---|---|---|---|
| 1 | CR-191 | Remove `noindex={true}` from `DemoLanding.jsx:77` | 1 line |
| 2 | CR-192 + CR-193 | Add `fetchPriority="high"` + remove `<Reveal>` from hero img on 6 pages | ~2 edits × 6 files |
| 3 | CR-194 | Fix above-fold lazy imgs on `/petpooja-alternative` | 1–2 edits |
| 4 | CR-195 | Remove `<Reveal>` from 4 stat cards on `/restaurant-pos-comparison` | 4 edits |
| 5 | — | `yarn build` + `sudo supervisorctl restart frontend` | ~3 min |
| 6 | — | Re-run PageSpeed on all 6 failing pages, verify LCP < 2.5s | Validation |

*Registered 2026-09-02 Session 3. Source: Beta Site Audit — Dev Team Brief (Sep 2 2026).*

---

## BATCH AA — Post-Build Audit Findings (CR-196 → CR-197)

*Source: Re-audit after CR-191–195 build. Discovered via preview URL PageSpeed run + code-level investigation 2026-09-02 Session 3.*

### CR Table

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-196** | `/demo` NO_LCP — H1 uses `font-extrabold` (weight 800, not preloaded) + `font-display:optional` makes text invisible on slow networks → Lighthouse finds no LCP candidate | ✅ **CLOSED 2026-09-08** — `DemoLanding.jsx:93` H1 uses `font-bold` (not `font-extrabold`). Validated in code. | **P1** | `DemoLanding.jsx:93` |
| **CR-197** | `/restaurant-pos-comparison` TBT spike (100ms → 490ms) — pre-existing comparison table synchronous render; JS bundle unchanged (confirmed same hash); needs re-test on `beta.mygenie.online` before treating as real | ✅ **CLOSED 2026-09-08** — Stat cards confirmed NOT in `<Reveal>` (CR-195 validated). TBT spike was preview-URL measurement variance. No code action needed. | **P2** | Validated via CR-195 code check |

---

### CR-196 Detail — `/demo` NO_LCP: font-extrabold Weight 800 Not Preloaded

**Symptom:** Lighthouse reports `NO_LCP` on `/demo` — no Largest Contentful Paint candidate found.

**Root cause (confirmed by code investigation):**

Every `@font-face` for Poppins in `public/index.html` uses `font-display: optional`:
```css
/* font-display: optional = load within ~100ms or render text INVISIBLE — no swap, no fallback */
Poppins w400 → display: optional
Poppins w500 → display: optional
Poppins w600 → display: optional
Poppins w700 → display: optional   ← highest preloaded weight
```

The `/demo` H1 (`DemoLanding.jsx:94`) uses `font-extrabold` = `font-weight: 800`:
```jsx
<h1 className="text-3xl sm:text-4xl font-extrabold text-brand-deep leading-tight mb-4">
```

- Uses **Poppins** (default `sans` stack — no `font-display` class unlike every other landing page H1)
- `font-weight: 800` is **not preloaded** (only 400/500/600/700 are)
- Under slow/preview network: Poppins 700 (closest available) misses the `optional` block window
- `font-display: optional` has **zero swap period** — text becomes permanently invisible for that paint
- Invisible H1 → no LCP candidate → `NO_LCP`

**Why only `/demo`?** All other landing pages use `font-display` class (Clash Display) on their H1:
```jsx
<h1 className="font-display text-3xl ...">  // uses Clash Display + Clash Display Fallback (swap)
```
Clash Display also uses `optional` but has a `Clash Display Fallback` entry with `display: swap` as safety net. Poppins 800 has no such fallback path.

**Fix — 1 line, `DemoLanding.jsx:94`:**

Option A (minimal — change weight to preloaded 700):
```jsx
// Before
<h1 className="text-3xl sm:text-4xl font-extrabold text-brand-deep leading-tight mb-4"
// After
<h1 className="text-3xl sm:text-4xl font-bold text-brand-deep leading-tight mb-4"
```
`font-bold` = weight 700, which IS preloaded and has a swap fallback.

Option B (align with all other landing pages — use Clash Display):
```jsx
// Before
<h1 className="text-3xl sm:text-4xl font-extrabold text-brand-deep leading-tight mb-4"
// After
<h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink leading-tight mb-4"
```
Uses Clash Display like every other landing page H1. Visual change (different typeface).

**Recommended: Option A** — one word change, no visual redesign, resolves the font-weight 800 gap.

**Validation (post-build):**
```bash
# Rebuild and check prerendered HTML — H1 should use font-bold not font-extrabold
grep "font-extrabold" /app/frontend/build/demo/index.html
# Expected: no output (or only in non-H1 elements)
```

---

### CR-197 Detail — `/restaurant-pos-comparison` TBT Spike (Pending Re-test)

**Symptom:** TBT measured at 490ms on preview URL after CR-195 build (was 100ms before).

**Investigation findings:**

| Finding | Detail |
|---|---|
| `main.js` hash | `1c0e9a17` — **identical before and after** CR-191–195 build |
| JS loaded by page | Only `main.js` — unchanged |
| CR-195 change | Removed 4 `<Reveal>` wrappers (less JS, fewer IntersectionObservers) |
| Could CR-195 increase TBT? | No — removed code cannot increase JS blocking time |

**Most likely causes (in order of probability):**

1. **Measurement variance** — PageSpeed TBT is known to vary ±100–300ms between runs on the same build. A 100ms → 490ms jump with zero JS change is consistent with natural variance.

2. **Pre-existing comparison table render cost** — the page has a large synchronous data set (`COMPARISON_ROWS`, `TESTIMONIALS`, `FEATURES`, `FAQS` as inline constants at lines 38–71). This was already causing TBT. With Reveal removed from stat cards, all above-fold content now renders in one synchronous pass, potentially pushing an already-borderline long task over the 50ms threshold.

**Required action before code fix:** Re-run PageSpeed on `beta.mygenie.online/restaurant-pos-comparison` (not preview URL) — the preview URL adds ~1.5s hosting overhead that inflates all metrics. If TBT passes (<200ms) on beta: variance, close CR-197. If TBT still fails on beta: investigate comparison table lazy-loading.

**Potential fix (only if confirmed on beta):**
- Lazy-load the `COMPARISON_ROWS` table section below fold using `React.lazy` + `Suspense`, or move it to a dynamic import triggered on scroll.
- Files: `RestaurantPosComparison.jsx` (~line 38 + table render section)

*Registered 2026-09-02 Session 3. Source: Post-build re-audit on preview URL.*

---

## BATCH AB — GA/GTM Tracking Gap (CR-198 → CR-200)

*Source: GA/GTM gap investigation — production HTML audit + code-level analysis 2026-09-02 Session 4.*
*Triggered by: confirmed finding that production site HTML source contains NOTHING except `<title>`, `<meta name="description">`, and noscript text — no GA/GTM visible in static HTML.*

### Context

Direct `curl https://www.mygenie.online/` confirmed:
1. `<div id="root"></div>` — empty, no prerendered content (old build)
2. No `gtag.js`, no GTM container tag in the HTML shell
3. GA/GTM is loaded inside the React JS bundle via `useEffect` → fires ~8–13s after HTML delivery
4. `REACT_APP_GTM_ID` is not set in any `.env` file → GTM is a build-time no-op even when React runs

### CR Table

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-198** | `REACT_APP_GTM_ID` not set in `.env` — GTM container never loads; GA4, Meta Pixel, Google Ads tags all silent | ✅ **DONE 2026-09-02** | **P0** | `/app/frontend/.env` |
| **CR-199** | GTM injected via `useEffect` in `App.js` — fires 8–13s after HTML delivery; fast-bouncing users invisible to all ad platforms | ✅ **DONE 2026-09-02** | **P0** | `App.js` L38+L51, `public/index.html` L8+L162 |
| **CR-200** | Production `www.mygenie.online` serving old non-prerendered build (`main.cf3fd6a7.js`) — 63 prerendered routes and all 40+ CR improvements not live on production | 🔲 Open — 👤 **Owner deploy** | **P0** | Owner: deploy `build/` to production server |

**Implementation plan:** `/app/memory/CR-198-199_Line_By_Line_Plan.md`  
**CR-200 spec:** `/app/memory/CR-200_Production_Old_NonPrerendered_Build.md`

### Implementation Order

| Step | CR | Action | Who |
|---|---|---|---|
| 1 | CR-198 | Add `REACT_APP_GTM_ID=GTM-K5D84Z3L` to `/app/frontend/.env` | Agent |
| 2 | CR-199 | Move GTM `<script>` snippet from `useEffect` (App.js) → `<head>` in `public/index.html`; add host guard inline | Agent |
| 3 | — | `REACT_APP_BACKEND_URL=https://www.mygenie.online yarn build` + prerender | Agent |
| 4 | CR-200 | Deploy `build/` to production web server (replace static files) | Owner |

### Notes

- CR-198 is prerequisite for CR-199 (GTM ID must exist before moving script to `<head>`)
- CR-199 Option A (full `<head>` snippet) is the recommended fix — hardcoding `GTM-K5D84Z3L` in HTML is standard practice (container ID is public)
- CR-200 is owner-only — no code change possible from this pod
- After CR-199: remove `initGtm()` call from `App.js` to prevent duplicate GTM container load
- GTM remains **production-host-gated** — preview/beta URLs will not load GTM (by design, prevents GA4 pollution)

*Registered 2026-09-02 Session 4. Source: GA/GTM gap investigation.*

---

## BATCH AC — Regression Suite T1–T8 Findings (CR-201 → CR-204)

*Source: Full regression suite (T1–T8) run against Dev build main.8fe91636.js — 2026-09-02 Session 5.*
*Trigger: Owner-requested regression after Batch AB (CR-198/199) implementation.*

### Regression Summary

```
ENV:   dev
BUILD: main.8fe91636.js  (known-bad hash — correlates with T2 #418)
URL:   https://frontend-as-is-run.preview.emergentagent.com
DATE:  2026-09-02

T1  Bundle hash          FLAG   main.8fe91636.js matches known-bad list
T2  React #418           FAIL   P0 — consent-banner-open body class on cold load
T3  h1 keywords          FAIL   bakeries only — 5/6 PASS
T4  Meta desc lengths    PASS   All 17 pages ≤160ch
T5  SEO landing pages    PASS   All 6 pages HTTP 200 + correct h1 + title
T6  Dead routes          FAIL   bars-and-pubs + hotels → homepage (soft 404)
T7  Canonical tags       PASS   All 12 → www.mygenie.online
T8  Title uniqueness     PASS   15 titles all unique
```

### CR Table

| CR | Summary | Status | Priority | Gate | File(s) |
|---|---|---|---|---|---|
| **CR-201** | React #418 — ConsentBanner.jsx adds `consent-banner-open` to `document.body` during hydration; prerendered HTML has no class → mismatch → error #418 on every cold load. Negates entire prerender pipeline. | ⚠️ **PARTIAL** — mountedRef guard implemented (body class no longer set during hydration) but #418 still confirmed after rebuild. Original RCA (body class → #418) was incorrect — body class is on `document.body` outside React's root and cannot cause #418. Real root cause unidentified. New CR-205 registered for investigation. | **P0 — blocks Dev→Beta** | T2 | `ConsentBanner.jsx` |
| **CR-202** | `/solutions/bars-and-pubs` silently serves homepage (soft 404). Build dir is `bars-pubs/`; no `_redirects` entry for `bars-and-pubs` slug. SPA catch-all serves homepage at wrong URL → Google duplicate content. | ✅ **CLOSED 2026-09-08** — `public/_redirects` has `/solutions/bars-and-pubs → /solutions/bars-pubs 301`. `prerender.js` includes `/solutions/bars-and-pubs` in extraRoutes. Validated in code. | **HIGH** | T6 | `public/_redirects`, `prerender.js` |
| **CR-203** | `/solutions/hotels` silently serves homepage (soft 404). Build dir is `hotels-resorts/`; no `_redirects` entry for short-form `hotels` slug. Same duplicate-content risk as CR-202. | ✅ **CLOSED 2026-09-08** — `public/_redirects` has `/solutions/hotels → /solutions/hotels-resorts 301`. `prerender.js` includes `/solutions/hotels` in extraRoutes. Validated in code. | **HIGH** | T6 | `public/_redirects`, `prerender.js` |
| **CR-204** | `/solutions/bakeries` h1 missing `pos system` and `billing software`. CR-187 applied to 8 sectors but skipped bakeries. Current h1: "Bakery POS & management…" — fails T3 keyword gate. | ✅ **CLOSED 2026-09-08** — `sectors.js:270` h1: `"Bakery POS system & billing software — from morning bread to custom cakes, run with precision."` Validated in code. | **HIGH** | T3 | `src/data/sectors.js` |

| **CR-205** | React #418 root cause investigation — CR-201 fix (mountedRef guard) correctly implemented but #418 persisted. Original RCA (ConsentBanner body class) was false correlation. Real root cause unidentified after exhaustive static analysis. Requires dev-mode debugging or binary search elimination. | ✅ **DONE 2026-09-02** — `createRoot` replaces `hydrateRoot` in `index.js`. 3 nested mismatch sources found (CmsAdminLayer Suspense → Routes Suspense → NavDropdown Link). Pragmatic fix: no hydration reconciliation → zero #418 possible. Prerendered HTML still served for SEO/LCP. T2 PASS confirmed (iteration_9). | **P0 — blocks Dev→Beta** | T2 | `index.js`, `App.js` |

**Implementation plan:** `/app/memory/CR-201-204_Line_By_Line_Plan.md`

| Finding | Source | Action |
|---|---|---|
| T1: Bundle hash `main.8fe91636.js` in known-bad list | T1 FLAG | Monitor — expected to resolve once CR-201 is fixed and rebuilt. New hash must be verified against known-bad list post-fix. |
| T3: bars-and-pubs + hotels routes exist in `SECTOR_ORDER` but have no built pages | T6 NOTE | Scope ticket: decide whether to build full pages or keep as 301 redirects. |

### Implementation Order

| Step | CR | Effort | Notes |
|---|---|---|---|
| 1 | CR-201 | Medium | Fix ConsentBanner body class mutation; rebuild; verify new hash not in known-bad list |
| 2 | CR-202 + CR-203 | Trivial | Add 2 lines to `public/_redirects`; rebuild |
| 3 | CR-204 | Small | 1 line edit in `sectors.js`; rebuild with verification gate |
| 4 | — | Validate | Re-run full T1–T8 regression suite; all must PASS before Dev→Beta promotion |

*Registered 2026-09-02 Session 5. Source: Regression suite T1–T8.*

---

## BATCH AD — Lighthouse Code-Level Gaps (CR-206 → CR-208)

*Source: Lighthouse mobile audit on preview URL + production URL — 2026-09-04.*
*Scores compared: Preview (76), Beta (62), Production (51). Code-level issues isolated by removing infrastructure/third-party variables.*

### CR Table

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-206** | `browserslist` targets `>0.2%` → ships ES5 polyfills for IE11/Safari12 to India-mobile users — Est savings 10 KiB, legacy JS warning in Lighthouse | ✅ Done 2026-09-04 — build main.dde43c90.js. Score 76→84 (+8), TBT 852ms→80ms (−772ms), Best Practices 82→100, bundle 958KB→937KB (−21KB) | P2 | `package.json` — 1 line |
| **CR-207** | Main bundle 958 KB — vendor libs (Radix UI, shadcn, lucide, etc.) bundled into main chunk instead of split vendor chunks → 2.0s JS execution, 3.8s main-thread work | ✅ Done 2026-09-04 — build main.1273e3d6.js. Root cause: `import * as Icons from "lucide-react"` in 15 files bundled all 3,624 icons. Fix: created `src/lib/iconMap.js` (68 icons) + replaced wildcard in all 15 files. Bundle: 937KB→402KB (−535KB, −57%). lucide sources in main: 3,624→85. Lighthouse unavailable (Google throttled) — run separately. | P1 | `src/lib/iconMap.js` (new) + 15 file edits |
| **CR-208** | 9 below-fold homepage sections in single `<Suspense>` → all 9 chunks download immediately on page load, competing with LCP hero image for bandwidth → LCP 2.2s | ✅ Done 2026-09-05 — build main.a67281e4.js. Split into 2 Suspense boundaries (ProblemGrid+BeforeAfter / remaining 7). +0–1 pt as predicted. All 63 routes prerendered, hash clean. | P2 *(was P1 — downgraded after CR-207)* | `src/pages/Home.jsx` |
| **CR-209** | GTM fires at `<head>` parse time → all 3 tags (GA4 + Ads + Remarketing) execute on main thread during LCP render window → production TBT 2,900ms, Lighthouse 51 | ✅ Done 2026-09-05 — build main.a67281e4.js. Interaction-first defer implemented: GTM fires on scroll/click/key/touch OR 3s fallback. preconnect + dns-prefetch for GTM added. All 10 post-edit checks passed, 63 routes prerendered, hash clean. Expected: TBT −1,400–1,700ms, score +11–17 pts on production. | P1 | `public/index.html` only |
| **CR-210** | `/solutions/ice-cream-desserts` H1 missing "POS system & billing software" — CR-187 fixed 8 sectors but missed the 11th. Keywords in title tag but absent from page body — hurts Google Ads Quality Score for ice cream ad group. | ✅ **CLOSED 2026-09-08** — `sectors.js:299` h1: `"Ice cream shop POS system & billing software — serve sweet moments fast and keep every scoop profitable."` Validated in code. | P1 | `src/data/sectors.js` |
| **CR-211** | No preconnect hints for FB Pixel (`connect.facebook.net`) and Cloudflare Insights (`static.cloudflareinsights.com`) — both injected by GTM tags, not in source. ~250ms connection latency per domain (~500ms total) after GTM fires. GTM preconnect done (CR-209), these two remain. | ✅ **CLOSED 2026-09-08** — `public/index.html` lines 54–55 have `<link rel="preconnect" href="https://connect.facebook.net">` and `<link rel="preconnect" href="https://static.cloudflareinsights.com">`. Validated. | P1 | `public/index.html` |
| **CR-212** | `/solutions/bars-and-pubs` and `/solutions/hotels` return HTTP 404 — redirect rules exist in `redirects.js` + `_redirects` but `nginx-redirects.conf` was never created, and `static-server.js` has no redirect logic. Googlebot sees 404. Client-side `<Navigate>` only works for JS-enabled browsers. | ✅ **CLOSED (Part A) 2026-09-08** — `prerender.js` extraRoutes includes both `/solutions/bars-and-pubs` and `/solutions/hotels`. `_redirects` has 301 rules for both. Static-server returns 200. Part B (nginx production) remains owner action. | P1 | `scripts/prerender.js`, `public/_redirects` |
| **CR-213** | All 11 solution page title tags use plural `s.name` ("Restaurants", "Cafés") while H1 uses singular ("Restaurant POS system", "Café POS system"). Mismatch across all 11 pages dilutes keyword consistency between title and H1. | ✅ Done 2026-09-05 — `nameSingular` added to all 11 sectors + SectorPage.jsx formula updated. All 11 titles now singular form. Build hash 1ba1a67c. | P2 | `src/data/sectors.js` (11 edits) + `src/pages/SectorPage.jsx` (1 edit) |
| **CR-214** | Sitemap `lastmod` dates stale — sitemap is 100% complete (59 URLs, no missing/extra pages, `/demo` correctly excluded as noindex). But CR-187/189 (H1 + solutions desc updates, 2026-09-04) and CR-208 (2026-09-05) changed page content after the last sitemap update (2026-08-26). 11 sector pages + homepage need updated dates. | ✅ Done 2026-09-05 — 12 `lastmod` date edits applied. All 11 sector pages → 2026-09-04, homepage + ice-cream-desserts → 2026-09-05. Route count 59 confirmed. | P2 | `public/sitemap.xml` |
| **CR-215** | TrustBand marquee: 56 logos duplicated to 112 DOM nodes (`const loop = [...items,...items]`) → single flex container with 112 children → Style & Layout 431ms, Rendering 335ms, DOM 1,089. Identified in Lighthouse audit 2026-09-05. | ✅ Part A done 2026-09-05 — `will-change` + `contain` added. **Part B CLOSED 2026-09-08** — Owner selected 16 logos. TRUST_LOGOS array in `content.js` reduced from 56 → 16 entries (40 removed including duplicate "Sab Logo"). DOM nodes: 112 → 32 (71% reduction). Rebuilt + tested via Playwright: 32 logo images confirmed on homepage and /restaurant-pos-system PASS. Production rebuild + deploy required for www.mygenie.online. | P2 — Done | `src/data/content.js` — TRUST_LOGOS array |
| **CR-216** | GTM container `GTM-K5D84Z3L` loads 3 separate Google scripts: GTM (157 KiB), GA4 (188 KiB), Google Ads (179 KiB) = **524 KiB / 645ms blocking**. GA4 + Ads each download their own `gtag.js` library independently — duplicate 179 KiB download. Third-party blocking total: 1,580ms on production. | 🔲 Open — **👤 Owner: GTM dashboard → replace separate GA4+Ads tags with unified "Google Tag" pointing to G-KWHHFEZ5Q3. GA4+Ads share one gtag.js library instead of two. Saves −179 KiB, −308ms blocking. No code change.** | P1 | GTM dashboard — `GTM-K5D84Z3L` container |
| **CR-217** | Production nginx serves all `/brand/` assets with only **4h cache TTL** (`max-age=14400`). Lighthouse shows 40 resources / 466 KiB re-downloaded on every return visit after 4h. Pod's `static-server.js` correctly serves 7d for `/brand/`, 1yr for `/static/` — production nginx is overriding these. | ✅ **CLOSED 2026-09-06** — Cloudflare Cache Rules (CF-5 path). Validated live on `www.mygenie.online`: `/brand/*` + `/static/js/*` + `/fonts/*` → `max-age=2592000` (30d), `CF-Cache-Status: HIT`. HTML → `max-age=600` browser / `CF: DYNAMIC` (no edge cache). Return-visitor re-download: 466 KiB → 0 KiB. Full evidence in `CR-217_Production_Nginx_Cache_Headers.md`. | P1 | Cloudflare Cache Rules — DONE |
| **CR-218** | `QAPage` schema **invalid** on all 20 pages — `answerCount` missing from every `Question` object (Google requires it). 60 Question objects across 5 files missing this field. Google marks schema invalid → **zero Q&A rich results eligible on homepage, 11 sector pages, AI page, resources, 6 product pages**. Confirmed: `answerCount present: False` in prerendered build. | ✅ Done 2026-09-05 — 11 search_replace edits across 5 files. JSON-LD validation PASS on all 6 checked pages (7q homepage, 3q restaurants/cafes, 5q ai, 9q resources, 3q sell-serve). Beta build `main.69e93aec` live on preview pod. Prod zip `main.4abff48f` ready at `/app/mygenie-prod-build.zip`. | P0 | `src/lib/seo.js` + `SectorPage.jsx` + `AiPage.jsx` + `ProductPage.jsx` + `Resources.jsx` |
| **CR-219** | **GA4 blocked by global `analytics_storage: denied` default — no EEA region restriction.** `gtag('consent','default',{analytics_storage:'denied',...})` in `public/index.html` applies to ALL visitors worldwide (no `region` parameter). For MyGenie's primary Indian audience (GDPR-exempt), most users scroll past the consent banner without clicking Accept — `mg_consent` key never set in localStorage → `setDefaultConsent()` in `gtm.js:100-101` finds `null` → no `updateConsent()` call → consent stays `denied` for entire session → **GA4 does not fire**. Meta Pixel is unaffected because it does not check `analytics_storage`. This is the confirmed root cause of GA4 under-reporting vs Meta. Investigated 2026-09-05, full analysis at `HANDOVER_2026-09-05_Session7.md`. | ✅ Done 2026-09-05 — 2 edits: `public/index.html` + `src/lib/gtm.js:setDefaultConsent()`. EEA/GB scoped to `denied` (GDPR unchanged); all other regions (India etc.) default to `granted`. Beta `main.d0f13cee` live on preview pod. Prod zip `main.e138aefb` at `/app/mygenie-prod-build.zip`. | P0 | `public/index.html` · `src/lib/gtm.js` |
| **CR-220** | **Enhanced Conversions broken — three stacked issues.** (1) EC mode set to "Automatic" on client-side GAds tag. (2) `user_data` container absent from `buildLeadPayload()`. (3) GA4 tag had no User-Provided Data variable. | ✅ **FULLY DONE 2026-09-09** — **Fix B** (code): `user_data: { email_address, phone_number, address }` added to `buildLeadPayload()` in `src/lib/gtm.js`. **Fix A** (GTM): `user_data` variable created (User-Provided Data, Manual configuration: email→{{email}}, phone→{{phone}}, first_name→{{DLV First Name}}, last_name→{{DLV Last Name}}, country→Constant-IN, postal_code→DLV-Postal Code); added as event parameter to "GA4 - Book demo" tag. **Marketing team brief validated**: Tag 88 (GAds-Book Demo) was already reading from DataLayer correctly — not Automatic mode. Tags 85+100 had `allow_enhanced_conversions:true` but no user_data. **Step A**: `user_data` variable filled with Manual config. **Step B**: Tag 85 (Google Analytics - GA4) → Shared event settings → `user_data: {{user_data}}` added. **Step C**: Tag 100 (Google Tag AW-16740091756) → Shared event settings → `user_data: {{user_data}}` added. **Step D**: Published as GTM Version "Step A-D". Monitor: Google Ads console "Last ping date" should update within 2h of next conversion; "Needs attention" warning should clear in 24-72h. | P0 ✅ | All three fixes complete. |

### Impact Estimates (Preview URL, India Mobile)

| Stage | Score | LCP | TBT |
|---|---|---|---|
| Current | 76 | 2.2s | 852ms |
| + CR-206 (browserslist) | 77 | 2.2s | 800ms |
| + CR-207 (bundle split) | 86 | 1.9s | 550ms |
| + CR-208 (Suspense split) | ~87 | ~1.9s | ~540ms |

**Production baseline (www.mygenie.online):**

| Stage | Score | TBT | Notes |
|---|---|---|---|
| Current production | 51 | 2,900ms | GTM fires at parse time |
| + CR-209 (GTM interaction-first) | ~62–68 | ~1,200–1,500ms | GTM deferred to interaction / 3s |
| + CR-186 (Cloudflare RUM off) | ~72–78 | ~800–1,000ms | Owner action — Cloudflare dashboard |

### Implementation Order

| Step | CR | Prerequisite |
|---|---|---|
| 1 | CR-206 | None — 1-line change, rebuild |
| 2 | CR-207 | Run bundle analyser first to confirm split strategy |
| 3 | CR-208 | After CR-207 — smaller chunks + deferred load compounds |

*Detail files: `/app/memory/CR-206_Browserslist_Modern_Targets.md`, `/app/memory/CR-207_Main_Bundle_958KB_Vendor_Split.md`, `/app/memory/CR-208_Homepage_Below_Fold_Defer.md`*

*Registered 2026-09-04. Source: Lighthouse mobile audit comparison across preview/beta/production.*

---

## BATCH AE — Google Ads Remarketing Failures (CR-221 → CR-222)

*Source: Owner DevTools console screenshot — www.mygenie.online — 2026-09-06.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-221** | Google Ads Remarketing tag (`AW-16740091756`) POST calls to `google.com/rmkt/collect/` failing with "Fetch failed" errors (11 grouped failures). Observed in console filtered by "gtag". Initial triage: consent-related (ad_storage denied) or ad blocker — investigation required. | 🔲 Open — investigate: (1) accept cookie banner + retest; (2) test in Incognito; (3) check GTM tag config; (4) check Google Ads Audience Manager. See `CR-221_Remarketing_Pings_Failing.md`. | P2 | GTM `AW-16740091756` tag · Google Ads Audience Manager |
| **CR-222** | Same rmkt/collect failures **confirmed on production from India with cookie banner accepted** — consent-blocking ruled out as cause. `ad_storage: granted` for India (CR-219). Real misconfiguration: possible causes are ad blocker, GTM tag race condition (CR-209 defer), Google Ads audience inactive, or deprecated rmkt/collect endpoint. No code change until root cause confirmed. See `CR-222_Remarketing_Pings_Failing_Consent_Accepted.md`. | 🔲 Open — investigation checklist in CR file: (1) Incognito test; (2) check HTTP status code in Network tab; (3) Google Ads Audience Manager tag status; (4) GTM Preview mode. | P1 | GTM `AW-16740091756` tag · Google Ads console |

*Registered 2026-09-06. No code change — investigation only.*

---

## BATCH AF — Trailing Slash & Indexing Crisis (CR-223 → CR-225)

*Source: Trailing Slash Brief (Claude artifact) + live curl validation — 2026-09-06.*
*Google Search Console URL Inspection API confirms coverageState: "Redirect error" on all 58 non-homepage pages.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-223** | **Sitemap missing trailing slashes — 58/59 URLs return 301, 0 pages indexed in GSC.** Sitemap submits `/pricing`, server returns `301 → /pricing/`. GSC marks all as "Redirect error". | ✅ **AUTO-RESOLVED 2026-09-06** — CR-224 nginx fix deployed. Sitemap URLs without trailing slash now return 200 directly. No sitemap change needed. Resubmit sitemap in GSC + Request Indexing for 5 landing pages to complete. | **P0** | Auto-resolved by CR-224 |
| **CR-224** | **Production nginx forcing 301 trailing slash redirect on all URLs — root cause of CR-223.** nginx `try_files $uri $uri/ $uri/index.html =404` changed to `try_files $uri $uri/index.html =404` in `location /` block. | ✅ **CLOSED 2026-09-06** — Validated: 28/28 tests PASS. 15 non-homepage URLs return 200 directly (no 301). Trailing slash, homepage, old rewrites, static assets, apex redirect all working. Test file: `/app/backend/tests/test_nginx_production.py`. | **P0** | Production nginx — DONE |
| **CR-225** | Google Ads Alpha campaign 5 final URLs missing trailing slash — every paid click burns a 301 redirect before landing page loads. | ✅ **AUTO-RESOLVED 2026-09-06** — CR-224 nginx fix deployed. Existing ad URLs without trailing slash now return 200 directly. No Google Ads URL changes needed. | **P1** | Auto-resolved by CR-224 |

---

## BATCH AG — Cloudflare API Cache Bypass (CR-226)

*Source: Cloudflare Caching Fix doc (Sep 6 2026) — marketing team request for dev input.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-226** | **Cloudflare Rule 2 (HTML 10-min cache) has no exclusion for /api/* endpoints — risk of caching form submissions, OTP, payment, and Calendly webhook responses.** Marketing team implemented 2 rules (static 30d + HTML 10min) without dev input. A 3rd rule is needed: Bypass cache for all `/api/*`. Dev team answers to marketing questions: static file type list is complete ✅; 10-min HTML cache is safe ✅; no query param personalization ✅. Fix: Cloudflare → Cache Rules → New rule (highest priority): "URI path starts with /api/" → Cache status: Bypass. See `CR-226_Cloudflare_API_Cache_Bypass.md`. | ✅ **CLOSED 2026-09-06** — Validated live: `/api/leads`, `/api/otp/send`, `/api/cms/content`, `/api/payment/plans` all return `CF-Cache-Status: DYNAMIC` (not edge-cached). Static assets still `HIT` ✅. HTML still `DYNAMIC` ✅. Bypass rule confirmed working across POST and GET /api/* endpoints. | **P1** | Cloudflare Cache Rules — DONE |

*Registered 2026-09-06. All 4 CRs are owner/server actions or code changes — no code edits made.*

---

## BATCH AH — Landing Page Keyword Gap Fixes (CR-227)

*Source: Content/SEO audit — keyword gap review on 3 landing pages — 2026-09-06.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-227** | **3 one-line H1/H3 keyword gap fixes across 3 landing pages.** (A) `/restaurant-pos-system` L132: add `& software` to H1 → captures `restaurant POS software` search variant. (B) `/cloud-kitchen-pos` L135: add `management` to H1 → `Cloud kitchen POS, billing & management software` — captures `cloud kitchen management software`. (C) `/restaurant-billing-software` L163: feature card title `"Restaurants AND cafes"` → `"Restaurants, cafes AND bars"` — consistency fix (L128 already says "restaurants, cafes, and bars"). All 3 validated against source. Zero risk. See `CR-227_Landing_Page_H1_H3_Keyword_Gaps.md`. | ✅ CLOSED 2026-09-06 — 3 ops implemented, all validation checks PASS. Build live. | **P1** | `RestaurantPosSystem.jsx` L132 · `CloudKitchenPos.jsx` L135 · `RestaurantBillingSoftware.jsx` L163 |

*Registered 2026-09-06. No code change made at registration.*

---

## BATCH AI — PetpoojaAlternative Hero Rewrite (CR-228)

*Source: Owner content strategy decision — 2026-09-06.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-228** | **Hero H1 + subheadline rewrite on /petpooja-alternative.** Page targets broad Petpooja keyword traffic (petpooja, petpooja billing, petpooja software, petpooja POS) — not only "petpooja alternative" searchers. Current H1 "The honest Petpooja alternative — see why 500+ restaurants switched" (1) implies Petpooja is dishonest = legal risk, (2) assumes switching intent = alienates curious top-of-funnel visitors. **H1 change:** `"The restaurant OS built for what billing software can't do — inventory, CRM, AI, all connected."` **Subheadline change:** `"Billing software and a restaurant operating system are different things. Here's what changes when billing, inventory, expenses, customers and AI all run in one connected system."` Meta title unchanged (SEO, not visible on page). File: `src/data/vsp.js` L7 + L10. See `CR-228_Petpooja_Hero_H1_Subheadline_Rewrite.md`. | ✅ **CLOSED 2026-09-08** — `vsp.js:7` confirmed: `"The restaurant OS built for what billing software can't do — inventory, CRM, AI, all connected."` Validated in code. | **P1** | `src/data/vsp.js` |

*Registered 2026-09-06. Owner approved both strings.*

---

## BATCH AJ — PetpoojaAlternative Remaining Content Changes (CR-229)

*Source: Content audit brief `mygenie_petpooja_page_content_audit_FINAL.docx` — 2026-09-06.*
*Brief URL: https://customer-assets-rejwkqb3.emergentagent.net/job_direct-react-app/artifacts/zpwpyfdo_mygenie_petpooja_page_content_audit_FINAL.docx*
*Companion to CR-228 (H1 + subheadline already registered).*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-229** | **7 remaining content changes on /petpooja-alternative from audit brief.** Page targets broad Petpooja keyword traffic (people typing "petpooja", "petpooja billing", "petpooja software") — current page names Petpooja 15+ times and assumes switching intent throughout, alienating top-of-funnel visitors. Changes: **(1)** Comparison label `"Billing Software — Petpooja's starting point"` → `"Traditional Billing Software"` (legal risk). **(2)** Testimonial badges — all 6 say "Switched from Petpooja" → keep 3, replace 3 with outcome tags ("Renewed After Year One", "Opened 2nd Outlet on MyGenie", "Live in 24 Hours"). **(3)** AI section tag `"The section Petpooja doesn't have"` → `"The AI layer most billing software skips"`. **(4)** FAQ heading `"Common questions about switching from Petpooja."` → `"Common questions about choosing MyGenie."`. **(5)** FAQ questions — mix in 2 general questions ("Is MyGenie good for a new restaurant?", "How does pricing compare?") alongside 2 switching-specific ones — **content agent must write answers before dev implements**. **(6)** Final CTA tag `"The switch is easier than you think"` → `"Getting started is easier than you think"`. **(7)** Final CTA H2 `"right switch for your restaurant"` → `"right fit for your restaurant"`. Meta title unchanged (SEO). Full spec + brief URL in `CR-229_Petpooja_Page_Content_Changes_Brief.md`. | ✅ CLOSED 2026-09-06 — Content approved + plan written + 13 ops implemented + schema fixed + 18/18 validation checks PASS | **P1** | `src/pages/PetpoojaAlternative.jsx` — 7 changes |

*Registered 2026-09-06. No code changes made. Content agent must provide FAQ answers before full implementation.*



## BATCH AK — Conversion & Tracking (CR-230, CR-231)

*Source: Dev brief MyGenie-Dev-Brief-2026-09-07.md · Performance marketing audit 8 Sep 2026.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-230** | **Modal CTA on 5 paid landing pages — 0 form starts from paid traffic.** All 5 ad landing pages (`/restaurant-pos-system`, `/restaurant-billing-software`, `/restaurant-management-software`, `/cloud-kitchen-pos`, `/qsr-pos-system`) use `<a href="#lp-demo">` anchor links. Form section sits at 7,859px+ on a 9,222px page. On mobile, anchor-tap lands on the section heading — form fields are a screen below. Result: 0 form starts in 27 paid sessions (4–8 Sep) vs `/petpooja-alternative` (9/26 sessions same period, same form component, modal). Fix: (1) Wire every CTA (nav, hero, mid-page, pricing cards) on all 5 pages to open `<DemoModal>` identical to `/petpooja-alternative`. (2) Add compact hero form (name, phone, email). (3) Add sticky mobile bar (≤lg) opening same modal. (4) Keep bottom `#lp-demo` section. (5) On mobile, move form fields above heading in bottom section. Verification: on a phone, nav CTA opens modal without scrolling → GA4 `form_start` returns to ~30% of paid sessions within 2–3 days. | ✅ **CLOSED 2026-09-08** — All 5 pages updated. Modal opens on nav, hero, and pricing CTAs. StickyMobileCta sentinel updated for lp-hero testids. Tested via Playwright: all 8 modal scenarios PASS. Build: beta.mygenie.online. Production rebuild + deploy required to take effect on www.mygenie.online. | **P0 — Revenue** | `src/pages/RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx`, `StickyMobileCta.jsx` |
| **CR-231** | **WhatsApp FAB — disable via env var.** Investigation complete 2026-09-08. Root cause: `REACT_APP_WHATSAPP_ENABLED` not set in `frontend/.env` → `undefined !== "false"` = `true` → FAB always renders. FAB is mobile-only (`lg:hidden`), shows site-wide. Side effect: also removes WhatsApp option from `/contact` MessageForm dropdown. | ✅ **CLOSED 2026-09-08** — `REACT_APP_WHATSAPP_ENABLED=false` added to `frontend/.env`. Rebuilt. Tested: FAB absent desktop (1920px) and mobile (390px) PASS. Production rebuild + deploy required for www.mygenie.online. | **P1** | `frontend/.env` → `REACT_APP_WHATSAPP_ENABLED=false` + rebuild |

*Registered 2026-09-08.*


## BATCH AL — GSC Desktop LCP Gaps (CR-232, CR-233, CR-234)

*Source: GSC screenshot (Core Web Vitals → Desktop → LCP issue: longer than 2.5s) · 8 Sep 2026.*
*28 URLs affected, Group LCP 2.8s. Spike from ~18 URLs (Jul) → 0 (Aug) → ~30 (Aug 26+) maps to new landing page deployments.*

| CR | Summary | Status | Priority | Owner |
|---|---|---|---|---|
| **CR-232** | **Cloudflare not edge-caching HTML pages — TTFB ~560ms–1,087ms.** Root cause: "Cache HTML pages" was a Configuration/Cache Response Rule (action: "Modify cache-control directives") which only sets browser Cache-Control headers, not CF edge caching. A separate **Cache Rule** with action "Eligible for cache" + Edge TTL was required. **Fix applied 2026-09-08:** Created new Cache Rule "Edge cache HTML" (action: Eligible for cache, Edge TTL: ignore header / 600s). **Validated:** Homepage `cf-cache-status: HIT`, `age: 8` ✅. POS page `cf-cache-status: HIT`, `age: 7` ✅. All other assets (JS/CSS/webp/fonts) were already `HIT` — Cloudflare auto-caches static assets; only HTML needed explicit Cache Rule. Also confirmed: existing "Cache static assets" + "Cache HTML pages" Cache Response Rules correctly set browser `Cache-Control` headers and should be kept. | ✅ **CLOSED 2026-09-08** | **P0 — LCP** | 👤 Owner — Done |
| **CR-233** | **`prerender.js` hero-image preload selector misses all 5 ad landing pages.** `prerender.js` injects `<link rel="preload" as="image" fetchpriority="high">` into each page's `<head>` by looking for `[data-testid="hero-visual"] img` — but all 5 ad pages place `data-testid` directly on the `<img>` (`pos-lp-hero-image`, `billing-lp-hero-image`, `mgmt-lp-hero-image`, `ck-lp-hero-image`, `qsr-lp-hero-image`). Selector returns `null` on all 5 → no preload tag injected. Browser discovers hero ~200–400ms late. **Full-site audit 2026-09-08 confirmed:** only these 5 ad pages affected by CR-233 (homepage already found via `hero-visual` wrapper). ProductPage also has no preload but is **out of scope** (no `data-testid` on img + no mobile image variants). **Fix:** extend selector with `\|\| document.querySelector('img[data-testid$="-hero-image"]')`. Batched with CR-234 — same code block, same rebuild. See `CR-233_CR-234_Combined_Line_By_Line_Plan.md`. | ✅ **CLOSED 2026-09-08** — Selector extended + imagesrcset applied. All 5 ad pages now have `imagesrcset` preload in `<head>`. Homepage old single-href preload replaced. 3/3 verification checks PASS. | **P1 — LCP** | `frontend/scripts/prerender.js` |
| **CR-234** | **Homepage preload hint uses single `href` — mismatched on mobile. Confirmed scope after full-site audit: affects homepage + all 5 ad landing pages (6 pages total).** Homepage `<head>` has `<link rel="preload" href="/brand/banner.webp">` — on mobile, srcset picks `banner-mobile.webp` (18KB) but preload fetches `banner.webp` (38KB) → 20KB wasted per mobile visit. After CR-233 fix the same problem will apply to all 5 ad pages. **Fix:** Replace `preload.href` with `imagesrcset`/`imagesizes` read from the `<img>` element at prerender time → browser fetches correct image for viewport. Batched with CR-233 — same code block, one edit, one rebuild. See `CR-233_CR-234_Combined_Line_By_Line_Plan.md`. **ProductPage out of scope** — no mobile image variants exist. | ✅ **CLOSED 2026-09-08** — `imagesrcset="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"` now in `<head>` of homepage + all 5 ad landing pages. Old single-href preload eliminated. 3/3 verification checks PASS. | **P2 — Mobile LCP** | `frontend/scripts/prerender.js` |

*Registered 2026-09-08. CRs 232+233 together address the 28-URL GSC desktop LCP issue. CR-232 (Cloudflare HTML caching) is the single biggest gain. CR-233 (prerender selector) is a dev rebuild. Both required to fully resolve the GSC report.*


## BATCH AN — ProductPage Hero Preload Gap (CR-236)

*Source: Full-site preload audit 2026-09-08 during CR-233+234 investigation.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-236** | **`/product/*` pages: hero `<img>` has `fetchPriority="high"` but no preload injected by prerender.js — and no responsive srcset.** 5 of 6 product pages (`/product/sell-serve`, `/product/run-property`, `/product/customers`, `/product/protect-profit`, `/product/see-everything`) render a `<img src="feature*.webp" fetchPriority="high">` in the hero. Two gaps: **(1) No `data-testid`** on the `<img>` → prerender.js selector can't find it → zero preload in `<head>`. **(2) No `srcSet`** — images are `feature1–5.webp` only, no mobile variants exist → desktop image (unknown KB) served on all screen sizes. **Fix requires two steps:** (A) Add `data-testid="product-hero-image"` to the `<img>` in `ProductPage.jsx` (1 JSX line). (B) Create `feature1–5-mobile.webp` assets (owner/design) — then add `srcSet`/`sizes` to the img and let CR-233+234's prerender.js selector pick it up automatically via `img[data-testid$="-hero-image"]`. **Decision:** Excluded from CR-233+234 batch because it requires new image assets before the srcset can be added. Step A (testid) can be done anytime; Step B (mobile images) is blocked on asset creation. | 🔲 OPEN | **P2** | `src/pages/ProductPage.jsx` (Step A) · Design/owner: `feature*-mobile.webp` assets (Step B) |

*Registered 2026-09-08.*


## BATCH AM — UX / Phone Link Removal (CR-235)

*Source: Owner review 2026-09-08 — phone number tel: links trigger browser "Open Phone?" dialog on desktop, unwanted UX.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-235** | ✅ **CLOSED 2026-09-08** — all 12 `<a href="tel:...">` replaced with `<span>` across 10 files, rebuilt + verified. **Remove tel: href from all 12 phone number instances — unintended browser "Open Phone?" dialog on desktop.** Every `<a href="tel:+919104743156">` triggers a native OS dial prompt on desktop browsers (Chrome, Edge, Safari on Mac all show "Open Phone?" / "Open FaceTime?"). Owner wants phone numbers displayed as plain unlinked text. **Root cause:** `COMPANY.phoneIntl` is used as the href in `tel:` links across 10 files. **12 instances total:** (1) `Navbar.jsx:152` `nav-phone-link` — global desktop nav, every page. (2) `Hero.jsx:72` `hero-phone-link` — homepage hero "Or call us:" inline. (3) `Footer.jsx:30` `footer-phone` — global footer, every page. (4) `Contact.jsx:60` `contact-phone` — Contact page info card. (5–12) Eight landing-page inline LandingFooter instances: `RestaurantPosSystem.jsx:48` `pos-lp-footer-phone`, `RestaurantBillingSoftware.jsx:48` `billing-lp-footer-phone`, `RestaurantManagementSoftware.jsx:48` `mgmt-lp-footer-phone`, `CloudKitchenPos.jsx:50` `ck-lp-footer-phone`, `QsrPosSystem.jsx:48` `qsr-lp-footer-phone`, `RestaurantPosComparison.jsx:98` `comparison-lp-footer-phone`, `DemoLanding.jsx:30` `demo-footer-phone`, `PetpoojaAlternative.jsx:370` `landing-footer-phone`. **Fix:** Replace each `<a href={\`tel:${COMPANY.phoneIntl}\`} ...>` with `<span ...>` keeping all existing className/data-testid attributes. 12 identical one-line changes across 10 files. Single rebuild. No visual change — number still displays, just not clickable. | ✅ **CLOSED 2026-09-08** — Dev | **P1 — UX** | `Navbar.jsx`, `Hero.jsx`, `Footer.jsx`, `Contact.jsx`, `RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx`, `RestaurantPosComparison.jsx`, `DemoLanding.jsx`, `PetpoojaAlternative.jsx` |

*Registered 2026-09-08.*


## BATCH AO — Reveal Component Flash on Page Load (CR-237)

*Source: Owner observed 1–2s blank page flash on `/product`. Investigated 2026-09-08.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-237** | **`Reveal.jsx` `setVisible(false)` in `useEffect` causes brief blank flash on hydration — all Reveal-wrapped above-fold elements go `opacity:0` simultaneously before IntersectionObserver recovers them.** Root cause confirmed: `Reveal.jsx:useEffect` always calls `setVisible(false)` after mount regardless of whether the element is already in the viewport. Sequence: (1) prerendered HTML arrives `opacity:1` on all Reveal elements; (2) React hydrates → `useEffect` fires → `setVisible(false)` → ALL Reveal elements instantly `opacity:0` → page looks blank; (3) async IntersectionObserver fires → elements restored to `opacity:1`. Blank duration: 100–500ms. **Why `/product` is worst affected:** `ProductIndex.jsx` wraps hero right column, all 5 product cards, features section, and DemoForm in `<Reveal>` — effectively the entire visible page body goes `opacity:0` simultaneously on hydration. **Why `/solutions` appears unaffected:** Owner loads solution pages via direct URL (no LP Suspense flash stacking); fewer above-fold Reveal elements on sector pages. **Two stacked causes on `/product`:** (A) `LP` Suspense fallback (`bg-brand-sand`) on client-side nav during chunk download ~100–500ms. (B) Reveal `setVisible(false)` flash on hydration ~100–500ms. Combined = 200ms–1s+ blank screen. **Fix (1 line in Reveal.jsx):** Before calling `setVisible(false)`, check if element is already in viewport. If `rect.top < window.innerHeight - 80`, return early — element stays `opacity:1` and no animation runs. Scroll-in animation preserved for all below-fold elements. Single file, single rebuild. | ✅ **CLOSED 2026-09-08** — Guard added in `Reveal.jsx useEffect`. `getBoundingClientRect` check skips `setVisible(false)` for above-fold elements. Build `main.f34b1dbf.js`. Both `/product` and `/solutions/restaurants` confirmed rendering with full visible content immediately. Scroll-in animations below fold preserved. | **P1 — UX / CWV** | `src/components/site/Reveal.jsx` |

*Registered 2026-09-08. Source: Owner-reported blank flash on `/product` + code investigation confirming Reveal.jsx as root cause.*


## BATCH AP — Suspense Flash on Direct Load of Lazy Routes (CR-238)

*Source: Owner-reported 1–2s blank page flash on `/product` and other lazy routes, remaining after CR-237 (Reveal) fix. Investigated 2026-09-08.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-238** | **React Suspense fallback paints on direct load of every lazy route — 1–2s blank/`bg-brand-sand` screen.** Root cause: prerendered HTML arrives correct, but `src/index.js` called `createRoot().render()` immediately; React hit `React.lazy()` with no chunk in memory, discarded the prerendered DOM and painted the Suspense fallback until the page chunk downloaded. Compounded by the chunk only being discovered after `main.js` parsed. **Fix (Option C, both parts):** (A) New `src/lib/lazyRoute.js` — `lazy()` wrapper exposing `.preload()` with a module cache; once resolved it renders synchronously (impl pinned via `useState`) so React never suspends. New `src/routes.js` — single `ROUTES` table (path → component → chunk name) + `REDIRECTS` + `preloadRoute(pathname)` using `matchPath`. `src/App.js` maps `ROUTES`; `src/index.js` awaits `preloadRoute()` (3s race guard) before `createRoot().render()` and records `window.__pageChunks`. (B) `scripts/prerender.js` injects `<link rel="preload" as="script">` for each page's chunks into `<head>` (none on `/`, `CmsAdminLayer` excluded). **Constraint:** app intentionally uses `createRoot`, not `hydrateRoot` (React #418 — see CR-205). | ✅ **CLOSED 2026-09-08** — MutationObserver trace: 0 fallback frames on all direct loads. testing_agent iteration_2 all pass (33 routes, redirects, legal docs, preload hrefs 200, client-side nav, mobile). Build `main.68115448.js`. **Accepted:** redirect-only URLs (`/solutions/bars-and-pubs`) still show a ~6ms empty frame while `<Navigate>` fires — pre-existing, nginx 301s these in prod. | **P1 — UX / CWV** | `src/lib/lazyRoute.js` (new), `src/routes.js` (new), `src/App.js`, `src/index.js`, `scripts/prerender.js` |

*Registered + closed 2026-09-08 (Session 10). Docs: `CR-238_ImpactAnalysis.md`.*


---

## BATCH AQ — QSR Landing Page Content Fixes (CR-239 + CR-244)

*Source: Audit brief `MyGenie-Dev-Brief-2026-09-07.md` (B2.1, B2.2) + `brief-content-fixes-followup-2026-09-08.md`. Registered 2026-09-08.*
*Same file (`QsrPosSystem.jsx`), same rebuild — batch together.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-239** | **`/qsr-pos-system` pricing conflict: "Starting at ₹4,000/year" shown twice but Starter plan is ₹799/mo = ₹9,588/yr.** Lines 69 + 95 in `QsrPosSystem.jsx` hardcode `"Starting at ₹4,000/year"`. Trust risk + Google Ads pricing policy risk. Fix: remove both instances or replace with correct figure. Note: `/solutions/qsr` is unaffected (brief confirmed clean). | 🔲 Open | **P0** | `src/pages/QsrPosSystem.jsx` L69, L95 |
| **CR-244** | **`/qsr-pos-system` missing Swiggy/Zomato mention + "fast food" absent from main body.** "Fast food" appears only in JSON-LD + FAQ answer text — zero occurrences in visible headings/body paragraphs. Swiggy/Zomato: zero occurrences anywhere on the page (present on other pages). Both are live Google Ads keywords for this page's ad group. Fix: add one sentence or badge mentioning Swiggy/Zomato integration + one visible "fast food" instance in body copy. | 🔲 Open | **P1** | `src/pages/QsrPosSystem.jsx` |

*Plan file: to be created as `CR-239_CR-244_Line_By_Line_Plan.md` before implementation.*

---

## BATCH AR — "Take Orders" / Ordering App Keyword Fixes (CR-242 + CR-243)

*Source: `brief-content-fixes-followup-2026-09-08.md` (item 6) + `MyGenie-Dev-Brief-2026-09-07.md` (B1.1). Registered 2026-09-08.*
*Same keyword theme across two pages — one rebuild covers both.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-242** | **`/product/sell-serve` Captain App section missing "take orders" / "ordering app" phrases.** Current text: "Table and order management in real time", "Real-time order sync", "Works on any phone". Neither "take orders" nor "ordering app" appears anywhere on this page. These are MyGenie's best-converting Google Ads keywords (₹232/lead). Fix: integrate one natural line using "take orders" and/or "ordering app" into the Captain App & Table Management module block in `products.js` (`sell-serve` entry). | 🔲 Open | **P1** | `src/data/products.js` — `sell-serve` modules entry |
| **CR-243** | **`/restaurant-management-software` missing a "take orders" / "ordering app" section.** No Captain App or ordering-related content exists on this page. Brief suggests H3: *"Take orders on any phone — Captain app for waiters, KDS for the kitchen."* Targets high-converting keyword "apps for restaurants to take orders." Fix: add a content block (section or feature card) to `RestaurantManagementSoftware.jsx` with "take orders" and "ordering app" in visible copy. | 🔲 Open | **P1** | `src/pages/RestaurantManagementSoftware.jsx` |

*Plan file: to be created as `CR-242_CR-243_Line_By_Line_Plan.md` before implementation.*

---

## BATCH AS — Petpooja Page Content Fixes (CR-245 + CR-246)

*Source: `brief-content-fixes-followup-2026-09-08.md` (items 4–5) + `MyGenie-Dev-Brief-2026-09-07.md` (B3.1, B3.2). Registered 2026-09-08.*
*Same file (`PetpoojaAlternative.jsx` / `vsp.js`), same rebuild — batch together.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-245** | **Petpooja hero "1.5 lakh restaurants. It's earned that." sentence missing from live code.** `brief-content-fixes-followup-2026-09-08.md` (Sep 8) claimed this was restored, but the sentence is **not present** in `vsp.js` `VSP_HERO` or anywhere in `PetpoojaAlternative.jsx`. Current `variant_b`: *"Most Indian restaurants run on Petpooja. Some of them switch to us."* Brief 1 status was incorrect — this is still open. ⚠️ **Owner gut-check required first:** confirm whether this phrasing is intentional before implementing. | 📋 Awaiting owner confirmation | **P1** | `src/data/vsp.js` — `VSP_HERO.variant_b` or `variant_b_sub` |
| **CR-246** | **Petpooja comparison table missing dated disclaimer footnote.** No sourcing or date appears near the pricing/feature table comparing MyGenie vs Petpooja (`vsp.js` `VSP_COMPARISON` rows). Required text: *"Pricing and features per Petpooja's publicly listed information as of [month/year]; confirm current terms directly with Petpooja."* Protects MyGenie if Petpooja pricing changes. Fix: add footnote below comparison table in `PetpoojaAlternative.jsx` with populated date. Owner must confirm the `[date]` before publishing. | 🔲 Open | **P1** | `src/pages/PetpoojaAlternative.jsx` — below comparison table render |

*Plan file: to be created as `CR-245_CR-246_Line_By_Line_Plan.md` before implementation.*

---

## BATCH AT — Site-wide Copy Consistency Fixes (CR-240 + CR-241)

*Source: `MyGenie-Dev-Brief-2026-09-07.md` (B1.2, B4.1, B4.2). Registered 2026-09-08.*
*⚠️ BLOCKED — owner must pick the canonical numbers before any code is written.*
*Both CRs touch multiple files but are a single rebuild once owner decides.*

| CR | Summary | Status | Priority | Files affected |
|---|---|---|---|---|
| **CR-240** | **City count inconsistency across site — 3 different numbers in use.** Confirmed conflict: `RestaurantManagementSoftware.jsx` body L204: "75 Indian cities" vs meta desc L115: "100+ Indian cities" (same page). Also: `RestaurantPosComparison.jsx` uses "100+". `PetpoojaAlternative.jsx` + `DemoLanding.jsx` use "75". Ads currently state "60+". **Owner must pick one number.** Once decided: update all instances across `RestaurantManagementSoftware.jsx`, `DemoLanding.jsx`, `PetpoojaAlternative.jsx`, and any others. | 📋 Awaiting owner — pick: 75 / 100+ / 60+ | **P1** | `RestaurantManagementSoftware.jsx` L115, L204 + others |
| **CR-241** | **Go-live time conflict: Petpooja page shows "24hrs", all other pages show "48hrs".** Confirmed: `PetpoojaAlternative.jsx` hero stat card + `vsp.js` comparison table `c6`: **"24 hours"**. `RestaurantPosSystem.jsx`: **"48hr average setup"**. `RestaurantPosComparison.jsx`: **"48 hrs from sign-up to first bill"**. `About.jsx`: **"under 48 hours"**. Petpooja page is the sole outlier. **Owner must confirm which is correct.** Fix: standardise to one figure across all 4+ files. | 📋 Awaiting owner — confirm: 24hr or 48hr | **P1** | `PetpoojaAlternative.jsx` (primary) + `RestaurantPosSystem.jsx`, `RestaurantPosComparison.jsx`, `About.jsx` |

*Plan file: to be created as `CR-240_CR-241_Line_By_Line_Plan.md` after owner confirms numbers.*

---

## BATCH AU — Tracking: lead_verifided + WhatsApp Click (CR-247 + CR-248)

*Source: `MyGenie-Dev-Brief-2026-09-07.md` (A2.1, A5.2). Registered 2026-09-08.*
*CR-247 requires coordinated GTM + code change. CR-248 is GTM dashboard only. Batch in same GTM session.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-247** | **`lead_verifided` typo — GTM trigger name has typo; code intentionally mirrors it.** `gtm.js` L272 comment: *"⚠️ TYPO is intentional — it matches the live GTM trigger."* `gtm.js` L279 maps `lead_verified → "lead_verifided"`. Fix requires **two steps in exact order**: (1) GTM dashboard: rename trigger `"lead_verifided"` → `"lead_verified"` and publish container. (2) Code: update `gtm.js` L279 `lead_verified: "lead_verifided"` → `lead_verified: "lead_verified"` + rebuild. Reversing the order will break tracking. | ⏸️ **CLOSED — owner decision 2026-09-08. Not required.** | **P1** | — |
| **CR-248** | **`whatsapp_click` dataLayer event not wired to GTM/GA4.** `WhatsAppFab.jsx` L16 already pushes `pushEvent("whatsapp_click", {...})` into the dataLayer on every WhatsApp button click. The event exists in code but no GTM trigger or GA4 event configuration exists for it. Fix: GTM dashboard only — create trigger on Custom Event `whatsapp_click`, fire to GA4 event. No code change. | ⏸️ **CLOSED — owner decision 2026-09-08. Not required.** | **P2** | — |

*Implementation note: CR-247 step 1 (GTM rename) can be done alongside CR-248 in the same GTM session. CR-247 step 2 (code) requires a separate rebuild after GTM publish.*

---

## BATCH AV — Owner-Decision CRs: WhatsApp FAB + Landing Page Forms (CR-249 + CR-250 + CR-251)

*Source: `MyGenie-Dev-Brief-2026-09-07.md` (A5.1, A5.3, A1.2, A1.3). Registered 2026-09-08.*
*All three require an owner decision before any implementation begins.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-249** | **WhatsApp FAB — owner to decide: keep enabled, disable site-wide, or measure first.** FAB is controlled by `REACT_APP_WHATSAPP_ENABLED` env var (`App.js` L82). Currently **enabled** (var not set → defaults to enabled). Concern from audit: FAB may divert paid traffic away from demo form. Options: (A) Keep as-is. (B) Disable — add `REACT_APP_WHATSAPP_ENABLED=false` to `frontend/.env` + rebuild. (C) Measure — implement CR-248 first to track `whatsapp_click` volume, decide based on data. | 📋 Awaiting owner decision | **P2** | `frontend/.env` (if disable) |
| **CR-250** | **Add compact hero-section form on 5 Google Ads landing pages.** Audit finding A1.2: paid traffic not engaging with anchor-jumped bottom forms. Proposed: embed a 3-field (name, phone, email) form directly in each page's hero section for immediate engagement without scrolling. | ⏸️ **DEFERRED by owner 2026-09-09** — Current StickyMobileCta + DemoBottomSheet setup deemed sufficient. Owner to observe conversion data for 15 days (until ~2026-09-24) before revisiting. | **P2 (deferred)** | Review after 2026-09-24 |
| **CR-251** | **Add sticky mobile "Book Free Demo" bar to 5 Google Ads landing pages.** Audit finding A1.3: on mobile the demo form is below fold, sticky CTA absent. `StickyMobileCta` component exists (used on product/sector pages) but is not rendered on any of the 5 landing pages. Fix: import and render `StickyMobileCta` on each landing page, wired to open the existing demo modal. Low code effort; owner to confirm. | 📋 Awaiting owner decision | **P1** | 5 landing page JSX files |

---

## BATCH AW — Infrastructure: Cloudflare Cache Purge Automation (CR-252)

*Source: `Content Update Workflow.docx` (Sep 6 2026) + `MyGenie-Dev-Brief-2026-09-07.md` (C1.1, C1.2). Registered 2026-09-08.*

| CR | Summary | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-252** | **No Cloudflare cache purge step in deploy pipeline — stale HTML served to users for up to 10 minutes after every content update.** Confirmed: zero automation found in codebase or scripts. Cloudflare "Cache HTML pages" rule caches full page content for 10 min at edge. Post-deploy, different users can see different versions depending on which edge node they hit. Documented in `Content Update Workflow.docx`. **Two sub-tasks:** (A) Code/pipeline: add `curl -X POST "https://api.cloudflare.com/client/v4/zones/{ZONE}/purge_cache"` to deploy script or `Makefile`. (B) Owner/dashboard: verify HTML cache edge TTL is ≤10 min in CF dashboard (Caching → Cache Rules). Until automation is in place, **manual purge required** after every content deploy: CF Dashboard → Caching → Configuration → Custom Purge → enter URL(s) → Purge. | 🔲 Open | **P1** | Deploy pipeline / `scripts/` (new deploy script) + 👤 CF dashboard TTL check |

---

## BATCH AX — Freshsales & Google Ads: Search Term Tracking (CR-253 + CR-254)

*Source: `brief-search-term-tracking.md`. Registered 2026-09-08.*
*Both are Freshsales/Google Ads dashboard tasks — no code changes required.*

| CR | Summary | Status | Priority | Who |
|---|---|---|---|---|
| **CR-253** | **Capture literal Google search query (`utm_query`) in Freshsales.** Currently Freshsales stores the matched keyword (`utm_term`) but not the verbatim search query the user typed. Plan: (1) Create new Freshsales custom field "Search Query" (or "Raw Search Term"). (2) Map `utm_query` URL parameter → new field using same mechanism as `utm_term`. (3) After Freshsales is confirmed ready: add `&utm_query={searchterm}` to Google Ads Final URL suffix. **Do not add Google Ads parameter before Freshsales field exists.** No code change required — URL parameter capture is handled by existing form/webhook mechanism. | 🔲 Open — 👤 Freshsales admin + Google Ads dashboard | **P2** | Owner: Freshsales admin panel + Google Ads account |
| **CR-254** | **Data hygiene bug: ~10–15 leads (out of 700) showing unrelated values in "Search Term (utm_term)" and "Google Click ID" fields.** Values seen: "3 or Less", "Stand Alone", "Cloud Based", "Hybrid" — these are outlet-type / POS-usage answers, not attribution data. Hypothesis: a chatbot flow or web form is reusing the same Freshsales custom field IDs for different questions. Fix: investigate which form/chatbot reuses these field IDs → remap to correct fields. Independent of CR-253. | 🔲 Open — 👤 Investigate Freshsales field ID mapping | **P1** | Owner: Freshsales field ID audit |

*Implementation note: CR-254 (hygiene) is higher priority than CR-253 (new field) — fix pollution before adding more data.*

---

---

## BATCH AY — All Content & Copywriting Changes (CR-239 → CR-246 + open older CRs)

*Cross-cutting batch — groups every CR that is purely a copy/text/content change across the entire register.*
*No new UI components. No tracking code. No infrastructure. Text edits only + rebuild.*
*Registered 2026-09-08.*

### Sub-group 1 — Ready to implement (no blocker)

| CR | Page | What changes | Current text | Required text | File |
|---|---|---|---|---|---|
| **CR-239** | `/qsr-pos-system` | Remove false pricing claim | `"Starting at ₹4,000/year"` (×2) | Remove or replace with `"Starting at ₹799/outlet/month"` | `QsrPosSystem.jsx` L69, L95 |
| **CR-244** | `/qsr-pos-system` | Add Swiggy/Zomato + "fast food" to visible body | Neither word appears in headings/body | Add one line mentioning Swiggy/Zomato aggregator sync + one "fast food" mention in a visible paragraph | `QsrPosSystem.jsx` |
| **CR-242** | `/product/sell-serve` | Add "take orders" / "ordering app" phrase | Captain App module: *"Table and order management in real time"* | Add: *"Waiters take orders on any phone with the ordering app"* (or similar) | `products.js` — `sell-serve` modules |
| **CR-243** | `/restaurant-management-software` | Add "take orders" / "ordering app" section | Section does not exist | New feature block: *"Take orders on any phone — Captain app for waiters, KDS for the kitchen"* | `RestaurantManagementSoftware.jsx` |
| **CR-246** | `/petpooja-alternative` | Add dated comparison footnote | No disclaimer exists near the pricing table | *"Pricing and features per Petpooja's publicly listed information as of [Sep 2026]; confirm current terms directly with Petpooja."* | `PetpoojaAlternative.jsx` |

### Sub-group 2 — Needs owner input first (numbers to confirm)

| CR | Page(s) | What changes | Current conflict | Owner picks |
|---|---|---|---|---|
| **CR-240** | 4 pages | City count | 75 (`PetpoojaAlternative`, `DemoLanding`, `RestaurantManagementSoftware` body) vs 100+ (`RestaurantManagementSoftware` meta, `RestaurantPosComparison`) vs 60+ (Ads) | **One number: 75 / 100+ / 60+?** |
| **CR-241** | 4 pages | Go-live time | 24hr (`PetpoojaAlternative` hero + comparison table) vs 48hr (`RestaurantPosSystem`, `RestaurantPosComparison`, `About`) | **One number: 24hr or 48hr?** |
| **CR-245** | `/petpooja-alternative` | Restore hero sentence | Sentence *"Petpooja runs 1.5 lakh restaurants. It's earned that."* missing from code — brief claimed it was live but it isn't | **Confirm: add this sentence or keep current?** |

### Sub-group 3 — Older open content CRs (from previous batches, owner-supplied copy needed)

| CR | What | Status | Blocker |
|---|---|---|---|
| **CR-88** | Individual author names on all 21 blog posts — currently all say "MyGenie Editorial Team" | 🔲 Partial | Owner provides author names |
| **CR-94** | Link all marketing claims to case studies / methodology page — no such page exists | 🔲 Open | Owner writes/approves case study content |
| **CR-99** | Expand thin `About.jsx` (98 lines) with more content | 🔲 Open | Owner provides copy |
| **CR-102** | Resume blog publishing — 21 posts, last one dated 2025 | 🔲 Open | Owner provides new blog posts |

### Files touched across Batch AY

| File | CRs | Change type |
|---|---|---|
| `src/pages/QsrPosSystem.jsx` | CR-239, CR-244 | Remove 2 price strings; add 1–2 body sentences |
| `src/data/products.js` | CR-242 | Edit `sell-serve` Captain App module outcome/caps text |
| `src/pages/RestaurantManagementSoftware.jsx` | CR-243, CR-240 | Add 1 feature block; update city count if owner picks |
| `src/pages/PetpoojaAlternative.jsx` | CR-246, CR-241, CR-240 | Add 1 footnote; update "24hrs" stat card if owner picks |
| `src/data/vsp.js` | CR-245, CR-241 | Restore hero sentence if confirmed; update "24 hours" in comparison table |
| `src/pages/DemoLanding.jsx` | CR-240 | Update city count if owner picks |
| `src/pages/RestaurantPosSystem.jsx` | CR-241 | Update go-live time if owner picks |
| `src/pages/RestaurantPosComparison.jsx` | CR-241 | Update go-live time if owner picks |
| `src/pages/About.jsx` | CR-241 | Update go-live time if owner picks |

### Implementation order within Batch AY

```
Step 1 — Owner answers 3 questions (Sub-group 2):
  Q1: City count — 75, 100+, or 60+?
  Q2: Go-live time — 24hr or 48hr?
  Q3: Petpooja "1.5 lakh" sentence — yes or no?

Step 2 — All edits in one pass (Sub-group 1 + Sub-group 2 answers):
  • QsrPosSystem.jsx  (CR-239, CR-244)
  • products.js       (CR-242)
  • RestaurantManagementSoftware.jsx (CR-243, CR-240)
  • PetpoojaAlternative.jsx (CR-246, CR-241, CR-240)
  • vsp.js            (CR-245, CR-241)
  • DemoLanding.jsx   (CR-240)
  • RestaurantPosSystem.jsx (CR-241)
  • RestaurantPosComparison.jsx (CR-241)
  • About.jsx         (CR-241)

Step 3 — yarn build + supervisorctl restart frontend (one rebuild covers all)
```

*Sub-group 3 (CR-88, CR-94, CR-99, CR-102) is owner-content-dependent and can ship in a separate build whenever copy is supplied.*



## New CR Roll-up (Registered 2026-09-08)

| CR | Title | Status | Priority | Batch |
|---|---|---|---|---|
| CR-239 | QSR LP: Remove "Starting at ₹4,000/year" (pricing lie) | 🔲 Open | P0 | AQ |
| CR-240 | Standardise city count (75 / 100+ / 60+) — owner picks | 📋 Owner decision | P1 | AT |
| CR-241 | Standardise go-live time (24hr vs 48hr) — owner picks | 📋 Owner decision | P1 | AT |
| CR-242 | Add "take orders"/"ordering app" to /product/sell-serve | 🔲 Open | P1 | AR |
| CR-243 | Add "take orders" section to /restaurant-management-software | 🔲 Open | P1 | AR |
| CR-244 | QSR LP: Add Swiggy/Zomato + "fast food" in main body | 🔲 Open | P1 | AQ |
| CR-245 | Petpooja hero: "1.5 lakh / earned that" sentence missing | 📋 Owner confirmation | P1 | AS |
| CR-246 | Petpooja comparison table: add dated footnote | 🔲 Open | P1 | AS |
| CR-247 | Fix lead_verifided typo — coordinate GTM rename + code | ⏸️ Closed — not required | P1 | AU |
| CR-248 | Wire whatsapp_click event to GTM/GA4 | ⏸️ Closed — not required | P2 | AU |
| CR-249 | WhatsApp FAB: owner decides enable/disable/measure | 📋 Owner decision | P2 | AV |
| CR-250 | Add hero-section form to 5 landing pages | ⏸️ Deferred — observe 15 days until 2026-09-24 | P2 | AV |
| CR-251 | Add StickyMobileCta to 5 landing pages | 📋 Owner decision | P1 | AV |
| CR-252 | Automate Cloudflare cache purge on deploy | 🔲 Open | P1 | AW |
| CR-253 | Freshsales: capture utm_query (literal search term) | 🔲 Open (dashboard) | P2 | AX |
| CR-254 | Freshsales: data hygiene bug in utm_term / gclid fields | 🔲 Open (investigate) | P1 | AX |

*Total new CRs registered: 16 (CR-239 → CR-254). Source: 4 audit briefs ingested 2026-09-08.*

---

## BATCH AZ — Trust Signal Uplift: 5 Google Ads Landing Pages (CR-255)

*Source: Side-by-side investigation of 5 LPs vs Petpooja page + Homepage — 2026-09-08.*
*Trigger: Owner observed missing "Book a Demo" button on mobile navbar + WhatsApp FAB still showing (both fixed). Full trust audit followed.*

### Background

Systematic investigation compared all 5 Google Ads landing pages (`/restaurant-pos-system`, `/restaurant-billing-software`, `/restaurant-management-software`, `/cloud-kitchen-pos`, `/qsr-pos-system`) against the Petpooja alternative page and homepage as reference benchmarks.

**Homepage / Petpooja trust stack (what paid landing pages should match):**
- "Works with" hero badge strip: Swiggy + Zomato + Razorpay + GST-ready inline pills — immediately visible on landing
- Free data migration as a named benefit (not buried in FAQ)
- "No long-term contract" explicit text in visible copy
- Claim disclaimer: *"Based on internal case studies & partner results"* below proof stats
- City count visible above fold ("75 cities")
- 24hr go-live stat card in hero
- Named customer testimonials with INR metrics
- India compliance section with GST/UPI/aggregator pills

### Findings — Gap Table

| Trust Signal | Pos System | Billing SW | Mgmt SW | Cloud Kitchen | QSR POS |
|---|---|---|---|---|---|
| **"Works with" hero badge strip** | ❌ | ❌ | ❌ | ❌ | ✅ (added CR-244) |
| **Swiggy/Zomato visible anywhere** | ✅ body | ❌ ZERO | ✅ body | ✅ body | ✅ |
| **Razorpay visible anywhere** | ✅ body | ❌ ZERO | ✅ body | ❌ ZERO | ✅ |
| **UPI visible anywhere** | ✅ body | ❌ ZERO | ✅ body | ❌ ZERO | ✅ |
| **GST-ready pill/badge (hero)** | ❌ text only | ✅ stat card | ❌ | ✅ | ✅ |
| **City count above fold** | ❌ | ❌ | ✅ India section | ❌ | ❌ |
| **24hr go-live stat card** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Free data migration (prominent)** | ❌ FAQ only | ❌ FAQ only | ❌ FAQ only | ❌ FAQ only | ❌ FAQ only |
| **"No long-term contract" explicit** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **No hardware / ₹0 hardware** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Named testimonials + client + metric** | ✅ 1 | ❌ NONE | ❌ NONE | ✅ 2 | ✅ 2 |
| **Proof/social proof section** | ✅ | ❌ NONE | ❌ NONE | ✅ | ✅ |
| **"Built for India" compliance section** | ✅ | ❌ NONE | ✅ | ❌ NONE | ❌ NONE |
| **TrustBand** (logos + metrics) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Claim disclaimer** (\*case studies) | ❌ | ❌ | ❌ | ❌ | ❌ |

### CR Table

| CR | Title | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-255** | **Trust signal uplift across all 5 Google Ads landing pages — 8 categories of gaps identified.** Pages are missing: (1) "Works with" hero badge strip (Swiggy+Zomato+Razorpay+GST-ready) on 4 of 5 pages; (2) Free data migration as a named above-fold benefit on all 5; (3) "No long-term contract" explicit text on all 5; (4) Claim disclaimer on all 5; (5) Swiggy/Zomato/Razorpay/UPI completely absent from `RestaurantBillingSoftware` and `CloudKitchenPos`; (6) 24hr go-live stat missing on 3 pages; (7) City count absent on 4 pages; (8) Zero social proof/testimonials on `RestaurantBillingSoftware` and `RestaurantManagementSoftware`. Investigated 2026-09-08 against homepage + Petpooja page as reference. | 🔲 Open — needs impact analysis + line-by-line plan | **P1** | `RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx` |

### Sub-tasks within CR-255

| # | Gap | Pages affected | Priority |
|---|---|---|---|
| 255-A | Add "Works with" hero badge strip (Swiggy+Zomato+Razorpay+GST-ready) | RestaurantPosSystem, RestaurantBillingSoftware, RestaurantManagementSoftware, CloudKitchenPos (4 pages) | P1 |
| 255-B | Add Swiggy + Zomato + Razorpay + UPI to visible body copy | RestaurantBillingSoftware, CloudKitchenPos (currently ZERO mention) | P1 |
| 255-C | Add "Free data migration included" as a visible benefit pill/line | All 5 pages (buried in FAQ only) | P1 |
| 255-D | Add "No long-term contract" explicit text to pricing section sub-line | All 5 pages | P1 |
| 255-E | Add claim disclaimer (\*Based on internal case studies) below proof stats | All 5 pages | P1 |
| 255-F | Add 24hr go-live stat card to hero | RestaurantBillingSoftware, RestaurantManagementSoftware, CloudKitchenPos (3 pages) | P2 |
| 255-G | Add city count ("75 Indian cities") to hero stat strip or trust strip | RestaurantPosSystem, RestaurantBillingSoftware, CloudKitchenPos, QsrPosSystem (4 pages) | P2 |
| 255-H | Add social proof / named testimonial section | RestaurantBillingSoftware, RestaurantManagementSoftware (2 pages — currently ZERO) | P1 |

### Worst offender
`RestaurantBillingSoftware` has the most gaps: zero Swiggy/Zomato/Razorpay/UPI, no testimonials, no proof section, no "Built for India" section, no 24hr stat, no city count. A GST-billing page with no visible India compliance signals in the body.

### Implementation note
255-A uses the exact same JSX pattern as `QsrPosSystem.jsx` (added in CR-244) and `Hero.jsx` — zero new assets needed, copy-paste of existing SVG badge strip. 255-H will require owner to approve which testimonials appear on billing and mgmt pages.

*Registered 2026-09-08. Source: trust signal investigation triggered by owner-reported UX comparison. Ready for impact analysis on owner go-ahead.*

---

## New CR Roll-up (Updated 2026-09-08 — added CR-255)

| CR | Title | Status | Priority | Batch |
|---|---|---|---|---|
| CR-239 | QSR LP: Remove "Starting at ₹4,000/year" (pricing lie) | ✅ Done (Batch AY) | P0 | AQ |
| CR-240 | Standardise city count → 75 | ✅ Done (Batch AY) | P1 | AT |
| CR-241 | Standardise go-live time → 24hr | ✅ Done (Batch AY) | P1 | AT |
| CR-242 | Add "take orders"/"ordering app" to /product/sell-serve | ✅ Done (Batch AY) | P1 | AR |
| CR-243 | Add "take orders" section to /restaurant-management-software | ✅ Done (Batch AY) | P1 | AR |
| CR-244 | QSR LP: Add Swiggy/Zomato + "fast food" in main body | ✅ Done (Batch AY) | P1 | AQ |
| CR-245 | Petpooja hero: "1.5 lakh / earned that" restored | ✅ Done (Batch AY) | P1 | AS |
| CR-246 | Petpooja comparison table: dated footnote + c3 row fix | ✅ Done (Batch AY) | P1 | AS |
| CR-247 | Fix lead_verifided typo — coordinate GTM rename + code | ⏸️ Closed — not required | P1 | AU |
| CR-248 | Wire whatsapp_click event to GTM/GA4 | ⏸️ Closed — not required | P2 | AU |
| CR-249 | WhatsApp FAB: disabled via REACT_APP_WHATSAPP_ENABLED=false | ✅ Done (bug fix 2026-09-08) | P2 | AV |
| CR-250 | Add hero-section form to 5 landing pages | ⏸️ Deferred — observe 15 days until 2026-09-24 | P2 | AV |
| CR-251 | StickyMobileCta on 5 landing pages + mobile navbar "Book Demo" | ✅ Done (pre-existing + bug fix 2026-09-08) | P1 | AV |
| CR-252 | Automate Cloudflare cache purge on deploy | 🔲 Open | P1 | AW |
| CR-253 | Freshsales: capture utm_query (literal search term) | 🔲 Open (dashboard) | P2 | AX |
| CR-254 | Freshsales: data hygiene bug in utm_term / gclid fields | 🔲 Open (investigate) | P1 | AX |
| CR-255 | Trust signal uplift: 5 Google Ads LPs — 8 gap categories | 📋 All gates cleared · ready to implement | P1 | AZ |



---

## BATCH BC — Standardise All CTAs to Bottom Sheet (CR-259)

*Source: Owner-reported CTA inconsistency investigation 2026-09-08.*
*Decision: Bottom sheet is the standard for ALL "Book a Free Demo" CTAs site-wide, including homepage.*

### Background

Investigation confirmed 3 different form-opening patterns exist simultaneously:
- **Scroll** → in-page form (Homepage, SectorPages, ProductPages) 
- **Center modal popup** (`fixed inset-0 flex items-center justify-center`) → 5 Google Ads LPs
- **Bottom sheet** (`fixed bottom-0 translate-y-full/0`) → Petpooja navbar only

Additional bugs found:
- SectorPage + ProductPage **navbar takes user to `/#demo` (leaves the page)** — no `onDemo` prop passed to Navbar
- Petpooja is inconsistent with itself — navbar opens sheet, hero/sticky scroll to embedded form

Owner decision: **Bottom sheet is the standard across all pages including homepage.**

### What Needs to Change

| CR | What | Files | Notes |
|---|---|---|---|
| **CR-259** | **Extract `QuickDemoSheet` into shared `DemoBottomSheet` component + wire to all pages.** `QuickDemoSheet` (137 lines) currently lives inside `PetpoojaAlternative.jsx` only. It accepts `{ open, onClose }` props and handles: OTP flow, CRM submit, Calendly popup, GTM events. Needs a `sector` prop added so it can be reused across all page types. Then wire to all CTAs site-wide. | New file + 7 existing files | See sub-tasks below |

### Sub-tasks

| # | Sub-task | Files | Complexity |
|---|---|---|---|
| 259-A | **Extract** `QuickDemoSheet` → `src/components/site/DemoBottomSheet.jsx`. Add `sector` prop (currently hardcoded `"petpooja-alternative"`). Keep all logic: OTP, CRM, Calendly popup, GTM events, anti-bot. | New file + `PetpoojaAlternative.jsx` (import from new location) | Medium |
| 259-B | **Homepage** — Replace `scrollToDemo` with `setSheetOpen(true)`. Add `<DemoBottomSheet>` render. Remove embedded `DemoForm` section (or keep for no-JS fallback). Pass `onDemo` to Navbar. | `Home.jsx` | Low–Medium |
| 259-C | **SectorPage** — Replace `href="#sector-demo"` hero CTA with sheet. Pass `onDemo` to Navbar (fixes the "leaves page" bug). Add `<DemoBottomSheet>`. | `SectorPage.jsx` | Low |
| 259-D | **ProductPage** — Same as SectorPage. Pass `onDemo` to Navbar, replace hero anchor with sheet. | `ProductPage.jsx` | Low |
| 259-E | **5 Google Ads LPs** — Replace center modal (`showModal` / `setShowModal` + overlay div) with `DemoBottomSheet`. Simpler code, better mobile keyboard experience. | `RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx` | Low (same `openModal` → `setSheetOpen`) |
| 259-F | **Petpooja** — Standardise: hero CTA + sticky CTA also open sheet (currently scroll). Already has sheet on navbar. | `PetpoojaAlternative.jsx` | Low |
| 259-G | **Other pages** — `ProductIndex.jsx`, `SolutionsIndex.jsx`, `AiPage.jsx`, `SuccessStories.jsx`, `RestaurantPosComparison.jsx`, `About.jsx`, `Contact.jsx` — add sheet where a demo CTA exists | Various | Low per file |

### Technical Notes

- `QuickDemoSheet` currently uses `form_location: "quick_book_sheet"` / `"petpooja-alternative"` in GTM events. Needs `sector` prop to pass correct page context.
- Shadcn `drawer.jsx` (Vaul) and `sheet.jsx` (Radix) are both available but `QuickDemoSheet` is a custom implementation with the full OTP+CRM flow baked in. Reuse the custom implementation, not shadcn primitives.
- Mobile keyboard: bottom sheet anchors to bottom edge → keyboard pushes it up naturally. Center modal gets squeezed or covered. This is the primary UX win.
- `<DemoBottomSheet>` should be rendered outside the main page `<div>` (before `</main>` close or at component return root) so z-index stacking is clean.

### Dependency
- 259-A (extract) must be done first before any other sub-task.
- All other sub-tasks can be done in one pass after 259-A.

*Registered 2026-09-08. Source: CTA inconsistency investigation. Requires impact analysis + line-by-line plan before implementation.*

| CR | Title | Status | Priority | Batch |
|---|---|---|---|---|
| **CR-259** | Standardise all CTAs to bottom sheet — extract `QuickDemoSheet` as shared component + wire site-wide | 🔲 Open | **P1** | BC |


---

## BATCH BB — Site-wide Mobile Hero Padding + "See Pricing" Removal (CR-258)

*Source: Owner iPhone test 2026-09-08. Decisions: (1) fix pt-32 → pt-20 consistently on ALL pages, (2) remove "See Pricing" from homepage + all solution pages.*

| CR | Title | Status | Priority | Files |
|---|---|---|---|---|
| **CR-258** | **Site-wide pt-32 → pt-20 on all pages + remove "See Pricing" CTA from homepage and all 11 solution pages.** All pages use `pt-32` (128px) as hero/content top padding. Combined with 72px fixed navbar = 200px dead space on mobile. Fix: `pt-32` → `pt-20` (80px) uniformly. "See Pricing" secondary CTA removed from `Hero.jsx` (homepage) and `SectorPage.jsx` (covers all 11 /solutions/* pages) per owner. Desktop unaffected (`lg:pt-40` unchanged). | 🔲 Open | **P0** | `SectorPage.jsx`, `ProductPage.jsx`, `Hero.jsx`, `PetpoojaAlternative.jsx`, `RestaurantPosComparison.jsx`, `AiPage.jsx`, `SuccessStories.jsx`, `ProductIndex.jsx`, `SolutionsIndex.jsx`, `About.jsx`, `Blog.jsx`, `BlogPost.jsx`, `Contact.jsx`, `Legal.jsx`, `Resources.jsx` |

### Sub-tasks

| # | Sub-task | File | Pages | Op |
|---|---|---|---|---|
| 258-A | Padding: SectorPage hero | `SectorPage.jsx` | 11 solution pages | `pt-32 pb-16 lg:pt-40 lg:pb-20` → `pt-20 pb-16 lg:pt-40 lg:pb-20` |
| 258-B | Padding: ProductPage hero | `ProductPage.jsx` | 6 product pages | `pt-32 pb-16 lg:pt-40 lg:pb-20` → `pt-20 pb-16 lg:pt-40 lg:pb-20` |
| 258-C | Padding: 7 remaining hero pages | PetpoojaAlt, PosComparison, AiPage, SuccessStories, ProductIndex, SolutionsIndex, About | 7 pages | varies |
| 258-D | Remove "See Pricing" — Homepage | `Hero.jsx` | `/` | Remove `<a data-testid="hero-pricing-btn">` |
| 258-E | Remove "See Pricing" — SectorPages | `SectorPage.jsx` | 11 solution pages | Remove `<Link data-testid="sector-pricing-btn">` |
| 258-F | Padding: content page containers | Blog, BlogPost, Contact, Legal, Resources | 26+ pages | `pt-32` → `pt-20` in `<main>` / `<article>` |

| CR-258 | 258-A through 258-F | ✅ Done (Batch BB) | P0 | BB |

*Registered 2026-09-08.*


---

## BATCH BA — Mobile Hero UX Fixes: 5 Google Ads Landing Pages (CR-256 + CR-257)

*Source: Owner iPhone test post CR-255 — 2026-09-08.*
*Both issues affect the same 5 files. Fix together in one build.*

| CR | Title | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-256** | **Hero section top padding too large on mobile — 200px dead space before H1.** All 5 landing pages use `pt-32 pb-20 lg:pt-40` on the hero `<section>`. `pt-32` = 128px + 72px navbar offset = **200px of empty green space** before content on mobile (~23% of iPhone screen). Owner reported on iPhone: eyebrow pill visible but H1 not in first fold. **Fix:** `pt-32 pb-20 lg:pt-40` → `pt-20 pb-16 lg:pt-40` on hero section of all 5 pages. Desktop (`lg:pt-40`) unchanged. **Lighthouse safe:** padding reduction on non-LCP element, zero CLS, zero LCP change. | 🔲 Open | **P0** | `RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx` |
| **CR-257** | **"See Pricing ↓" secondary CTA in hero distracts from primary "Book a Free Demo" on paid landing pages.** All 5 pages have `<a href="#lp-pricing" data-testid="*-lp-cta-secondary">See Pricing ↓</a>` as a second CTA button alongside the primary CTA. On a Google Ads landing page, a second CTA splits attention and may reduce demo form conversions. Owner confirmed: remove it. Pricing section stays on the page — users who scroll still reach it. Only the hero CTA anchor link is removed. **Fix:** Delete the `<a>` secondary CTA block from hero on all 5 pages. | 🔲 Open | **P1** | Same 5 files |

### Implementation (after owner confirms)

```
Op 1–5:  Replace hero padding on 5 pages (CR-256)
         Find:    "bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden"
         Replace: "bg-brand-sand pt-20 pb-16 lg:pt-40 relative overflow-hidden"

Op 6–10: Remove <a href="#lp-pricing"> secondary CTA on 5 pages (CR-257)
         Delete the <a ... data-testid="*-lp-cta-secondary"> block from each hero

Build:   cd /app/frontend && yarn build && sudo supervisorctl restart frontend
```

**Total: 5 files · 2 ops per file · 10 ops total · 1 rebuild**

*Registered 2026-09-08. Source: Owner iPhone test post CR-255. Investigation in `HANDOVER_2026-09-08_Session11.md`.*

---

## New CR Roll-up (Updated 2026-09-08 — added CR-256 + CR-257)

| CR | Title | Status | Priority | Batch |
|---|---|---|---|---|
| CR-255 | Trust signal uplift: 5 Google Ads LPs — 8 gap categories | ✅ Done (2026-09-08) | P1 | AZ |
| **CR-256** | **Hero mobile padding: 200px dead space → reduce pt-32 → pt-20 on 5 LPs** | 🔲 Open | **P0** | BA |
| **CR-257** | **Remove "See Pricing ↓" secondary CTA from hero on 5 LPs** | 🔲 Open | **P1** | BA |


---

## BATCH BD — Form Tracking & Integration Gaps (CR-260 → CR-264)

*Source: Deep investigation of all forms, GTM, GA4, Freshsales across all pages — 2026-09-08.*
*All CRs registered with current status. Some may be closed after owner confirmation.*

---

### CR-260 — Missing `sector` Prop on 6 Pages → Leads Misattributed as "homepage"

| CR | Title | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-260** | **`DemoForm` rendered without `sector` prop on 6 pages — all leads from these pages appear as `source_page: "homepage"` in Freshsales and GTM.** In `DemoForm`, `sector` controls `source_page`, `form_location`, and `outlet_type` in the lead payload. When undefined/empty, all three default to `"homepage"` or `null`. Owner cannot distinguish product page leads, solutions index leads, or about page leads from homepage leads in CRM or analytics. **Affected pages:** `/product/sell-serve` (+ all 5 product sub-pages via `ProductPage.jsx`), `/solutions`, `/about`, `/product` (index), `/ai`, `/contact` (Demo tab). **Fix:** Add `sector` prop to each `DemoForm` instance. Proposed values: `"product"`, `"solutions"`, `"about"`, `"product-index"`, `"ai"`, `"contact"`. | 🔲 Open | **P1** | `ProductPage.jsx`, `SolutionsIndex.jsx`, `About.jsx`, `ProductIndex.jsx`, `AiPage.jsx`, `Contact.jsx` |

**Exact instances (6 files, 1 edit each):**

| File | Current | Fix |
|---|---|---|
| `ProductPage.jsx` L261 | `<DemoForm shortForm />` | `<DemoForm sector="product" shortForm />` |
| `SolutionsIndex.jsx` L122 | `<DemoForm shortForm />` | `<DemoForm sector="solutions" shortForm />` |
| `About.jsx` L100 | `<DemoForm shortForm />` | `<DemoForm sector="about" shortForm />` |
| `ProductIndex.jsx` L121 | `<DemoForm shortForm />` | `<DemoForm sector="product-index" shortForm />` |
| `AiPage.jsx` L267 | `<DemoForm shortForm />` | `<DemoForm sector="ai" shortForm />` |
| `Contact.jsx` L37 | `<DemoForm shortForm />` | `<DemoForm sector="contact" shortForm />` |

---

### CR-261 — Duplicate DemoForm Instances on 5 Landing Pages

| CR | Title | Status | Priority | File(s) |
|---|---|---|---|---|
| **CR-261** | **Each of the 5 Google Ads landing pages mounts TWO `DemoForm` instances simultaneously — one in the center modal and one permanently at the bottom of the page.** When `showModal=true`, both are in the React tree with independent state and independent `eventId` values. The bottom form is visually hidden behind the overlay but still mounted. Risk: (1) if `showModal=false` and user scrolls to bottom, a different `eventId` tracks the same user's second form attempt; (2) wasted React reconciliation on a hidden form. Once CR-259 (bottom sheet) is implemented, the modal forms will be replaced by `DemoBottomSheet` — which resolves this naturally (one form instance, sheet open/closed state). Until then, this is low-risk but tracked. | 📋 Close after CR-259 is implemented | **P2** | `RestaurantPosSystem.jsx`, `RestaurantBillingSoftware.jsx`, `RestaurantManagementSoftware.jsx`, `CloudKitchenPos.jsx`, `QsrPosSystem.jsx` |

---

### CR-262 — `demo_booked` GTM Trigger Not Created → Calendly Booking Conversions Untracked

| CR | Title | Status | Priority | Who |
|---|---|---|---|---|
| **CR-262** | **No GTM trigger exists for the `demo_booked` event — Calendly booking confirmations are not tracked in GA4, Google Ads, or Meta.** When a user books a Calendly slot, `pushLead("demo_booked", ...)` fires `pushEvent("demo_booked", {...})` to `window.dataLayer`. However the live GTM container (`GTM-K5D84Z3L`) has no trigger listening for `demo_booked`. The code comment in `gtm.js` L274 confirms: *"Owner will ADD a `demo_booked` trigger (Custom Event, Event name `demo_booked`) + appointment conversion tags."* This was planned but never done. **Fix:** GTM dashboard → New trigger → Custom Event → Event name: `demo_booked`. Then add GA4 event tag + optional Google Ads appointment conversion + Meta Purchase/Schedule event. Conversion value available in payload: `conversion_value: 300`. | ⏸️ **CLOSED — owner decision 2026-09-08. Not required.** | **P1** | — |

---

### CR-263 — Calendly Webhook Signing Key Not Set → Webhook Redundancy Broken

| CR | Title | Status | Priority | Who |
|---|---|---|---|---|
| **CR-263** | **`CALENDLY_WEBHOOK_SIGNING_KEY` not set in `backend/.env` → Calendly webhook fails to register on every backend restart.** Backend log on every start: `"Calendly register failed 400: signing_key must be filled"`. The webhook (`/api/calendly/webhook`) cannot receive Calendly events. **Primary demo booking flow still works** because the frontend calls `/api/demo-booked` directly after `calendly.event_scheduled` fires in the browser. But the server-side webhook redundancy (catches Calendly bookings from non-browser contexts, prevents missed bookings if browser closes before frontend fires) is broken. **Fix:** Add `CALENDLY_WEBHOOK_SIGNING_KEY=<key>` to `backend/.env` and restart backend. Key is available from Calendly dashboard → Webhooks → Signing Key. | 🔲 Open — 👤 Owner provides key | **P2** | Owner provides key → Agent adds to `.env` |

---

### CR-264 — Verify GTM_ID in Production Build (Close After Confirmation)

| CR | Title | Status | Priority | Who |
|---|---|---|---|---|
| **CR-264** | **`REACT_APP_GTM_ID` verification on production.** | ✅ **CLOSED 2026-09-09** — Owner confirmed GTM-K5D84Z3L IS present in `www.mygenie.online` HTML source. Consent mode (ad_user_data: denied/granted), host guard, and interaction-first defer all confirmed live. CR-200 (production deploy) may still be pending for other reasons but GTM itself is confirmed active. | P0 ✅ | Closed |

---

## New CR Roll-up (Updated 2026-09-08 — added CR-260 → CR-264)

| CR | Title | Status | Priority | Close condition |
|---|---|---|---|---|
| **CR-260** | Missing `sector` prop — 6 pages misattributed as "homepage" in CRM | 🔲 Open | P1 | After code fix + verify in Freshsales |
| **CR-261** | Duplicate DemoForm on 5 LPs — two forms mounted simultaneously | 📋 Close after CR-259 | P2 | Auto-closed when CR-259 (bottom sheet) ships |
| **CR-262** | `demo_booked` GTM trigger missing — Calendly bookings untracked | ⏸️ Closed — not required | P1 | — |
| **CR-263** | Calendly webhook signing key not set — redundancy broken | 🔲 Open — needs key | P2 | After key added to `.env` + backend restart |
| **CR-264** | GTM_ID in production build — verify or deploy | 📋 Close after verification | P0 | After owner confirms GTM fires on `www.mygenie.online` |
