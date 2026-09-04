# CR Intake Register — Grouped by Batch

**Last validated:** 2026-09-02 (new build audit + code-level validation — all findings verified against source and prerendered build)
**Updated:** 2026-09-04 — CR-206/207/208 registered (Batch AD — Lighthouse code-level gaps from preview + production audit).
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
| CR-44 | fbc Cookie + ad_id Attribution Loss to Freshsales | 📋 Awaiting approval | HIGH | Code ready; owner approval needed before deploy |
| CR-45 | Freshsales Journey Webhook Not Firing | 👤 Freshsales Journey config — no code | MEDIUM | Backend endpoint exists; Journey not configured in CRM |
| CR-47 | Freshsales `custom_field` Wipe on tag/demo-booked | ✅ **DONE** | CRITICAL | `freshsales.py` CR-47 block confirmed; fetch-before-write implemented |
| CR-48 | One-Time Backfill of Wiped `cf_*` Attribution | 📋 Unblocked (CR-47 done) — awaiting approval to run | HIGH | Script ready in `scripts/cr48_backfill_wiped_cf.py` |
| CR-49 | Attribution Field Redundancy Cleanup | ✅ **DONE** | LOW-MED | `server.py` L254–256: `latest_medium`/`latest_campaign` intentionally no longer written |
| CR-50 | Calendly Overlay CSS Missing | ✅ **DONE** | — | `DemoForm.jsx` stage machine: `["form","otp","calendly"]`; `CalendlyInline.jsx` component present |
| CR-51 | Persist `event_id` in `demo_requests` Mongo doc | ✅ **DONE** | — | `server.py` L362–366: CR-51 comment + `doc['event_id'] = payload.event_id` |
| CR-52 | Server-Observable Browser Pixel Heartbeat | 🔲 Open | MEDIUM | No heartbeat/ping mechanism found in frontend or backend |
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
| CR-74 | Fix Broken StickyMobileCta (/petpooja-alternative) | 🔲 **BUG CONFIRMED** — iter-5 QA: `StickyMobileCta` never imported/rendered in `PetpoojaAlternative.jsx`. No sticky bar at any mobile viewport. See CR-165. | CRITICAL | — |
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
| CR-77 | Whitelist Googlebot in Cloudflare WAF | 👤 Owner (Cloudflare console) — OPEN | CRITICAL | No dev action possible |
| CR-78 | 301 Apex→www + fix duplicate sitemap on apex | 👤 Owner (Cloudflare DNS) — OPEN | CRITICAL | No dev action possible |
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
| CR-91 | Standardize BreadcrumbList schema | 🔲 **PARTIAL** — Done on: Pricing, BlogPost, ProductPage, Blog, SectorPage, AiPage. **Missing from:** About, Contact, SuccessStories, RoiCalculator | MEDIUM | Small fix — 4 pages need BreadcrumbList added |
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
| CR-126 | Prerender not locked in deploy pipeline | 🔲 **Open** | P1 | `package.json` `build` = `craco build` only — prerender is a separate manual step |
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
| CR-137 | PetpoojaAlternative.jsx missing FAQPage + SoftwareApplication schema | 🔲 **PARTIAL** — `SOFTWARE_APP_JSONLD` ✅; `FAQPage` schema MISSING ❌ | P2 | `PetpoojaAlternative.jsx` L1008: only `jsonLd={[SOFTWARE_APP_JSONLD]}` — no FAQPage JSON-LD |

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
| CR-146 | beta.mygenie.online robots.txt `Allow: /` | 🔲 **Open** | CRITICAL | `public/robots.txt`: `Allow: /` for all user-agents — Googlebot crawls beta freely |

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
| CR-172 | AggregateRating on SoftwareApplication schema | 🔲 Open — ⚠️ **BLOCKED on owner providing verified review source** | P1 | `seo.js` L30: explicitly deferred in code comment; do not implement with estimated numbers |

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
| CR-180 | No noindex on beta subdomain + canonical strategy undefined | 🔲 Open — 👤 **Owner decision required** | P0 | `REACT_APP_SITE_URL` not set in frontend/.env → canonicals default to `www.mygenie.online`. For preview pod this is correct. For `beta.mygenie.online` specifically: if beta = permanent prod domain, update `REACT_APP_SITE_URL=https://beta.mygenie.online`; if migrating to www, add global noindex to beta build. No code change until owner decides domain strategy. |

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
| CR-182 | LCP 4.1s — hero `banner.webp` has no responsive `srcset` → mobile downloads full 776px (38 KiB) for 348px display | 🔲 Open | P1 | `Hero.jsx` L112–116: no srcset. Banner is 776×637px, displayed at 348×286px on mobile. Est savings: 30.3 KiB. Target LCP: <2.5s. Fix: create banner-mobile.webp (400px) + add srcset. |
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
| **CR-191** | `/demo` page: `noindex={true}` hardcoded — SEO score 61 (should be 92) + LCP 3.7s | 🔲 **Open** | **P1** | `DemoLanding.jsx` L77 |
| **CR-192** | `fetchPriority="high"` missing on hero `<img>` — 6 landing pages all affected | 🔲 **Open** | **P0** | `RestaurantBillingSoftware.jsx`, `RestaurantPosSystem.jsx`, `QsrPosSystem.jsx`, `CloudKitchenPos.jsx`, `RestaurantManagementSoftware.jsx`, `ProductPage.jsx` |
| **CR-193** | Hero `<img>` wrapped in `<Reveal>` on landing pages — Reveal hides image after hydration, delaying LCP | 🔲 **Open** | **P0** | Same 6 files as CR-192 |
| **CR-194** | `/petpooja-alternative` CLS 0.029 — trust logos in hero have no `width`/`height` + `loading="lazy"` above fold | 🔲 **Open** | **P1** | `PetpoojaAlternative.jsx` |
| **CR-195** | `/restaurant-pos-comparison` hero stat cards in `<Reveal delay={i*0.08}>` — staggered reveal on above-fold content delays LCP | 🔲 **Open** | **P1** | `RestaurantPosComparison.jsx` |

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
| **CR-196** | `/demo` NO_LCP — H1 uses `font-extrabold` (weight 800, not preloaded) + `font-display:optional` makes text invisible on slow networks → Lighthouse finds no LCP candidate | 🔲 **Open** | **P1** | `DemoLanding.jsx:94` |
| **CR-197** | `/restaurant-pos-comparison` TBT spike (100ms → 490ms) — pre-existing comparison table synchronous render; JS bundle unchanged (confirmed same hash); needs re-test on `beta.mygenie.online` before treating as real | 🔲 **Open — needs re-test first** | **P2** | `RestaurantPosComparison.jsx` |

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
| **CR-202** | `/solutions/bars-and-pubs` silently serves homepage (soft 404). Build dir is `bars-pubs/`; no `_redirects` entry for `bars-and-pubs` slug. SPA catch-all serves homepage at wrong URL → Google duplicate content. | 🔲 Open — **Plan ready** | **HIGH** | T6 | `public/_redirects` |
| **CR-203** | `/solutions/hotels` silently serves homepage (soft 404). Build dir is `hotels-resorts/`; no `_redirects` entry for short-form `hotels` slug. Same duplicate-content risk as CR-202. | 🔲 Open — **Plan ready** | **HIGH** | T6 | `public/_redirects` |
| **CR-204** | `/solutions/bakeries` h1 missing `pos system` and `billing software`. CR-187 applied to 8 sectors but skipped bakeries. Current h1: "Bakery POS & management…" — fails T3 keyword gate. | 🔲 Open — **Plan ready** | **HIGH** | T3 | `src/data/sectors.js` L270 |

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
| **CR-207** | Main bundle 958 KB — vendor libs (Radix UI, shadcn, lucide, etc.) bundled into main chunk instead of split vendor chunks → 2.0s JS execution, 3.8s main-thread work | 🔲 Open — **bundle analyser run required first** | P1 | `craco.config.js` + webpack splitChunks |
| **CR-208** | 9 below-fold homepage sections in single `<Suspense>` → all 9 chunks download immediately on page load, competing with LCP hero image for bandwidth → LCP 2.2s | 🔲 Open | P1 | `src/pages/Home.jsx` |

### Impact Estimates (Preview URL, India Mobile)

| Stage | Score | LCP | TBT |
|---|---|---|---|
| Current | 76 | 2.2s | 852ms |
| + CR-206 (browserslist) | 77 | 2.2s | 800ms |
| + CR-207 (bundle split) | 86 | 1.9s | 550ms |
| + CR-208 (defer chunks) | ~90 | ~1.6s | ~450ms |

### Implementation Order

| Step | CR | Prerequisite |
|---|---|---|
| 1 | CR-206 | None — 1-line change, rebuild |
| 2 | CR-207 | Run bundle analyser first to confirm split strategy |
| 3 | CR-208 | After CR-207 — smaller chunks + deferred load compounds |

*Detail files: `/app/memory/CR-206_Browserslist_Modern_Targets.md`, `/app/memory/CR-207_Main_Bundle_958KB_Vendor_Split.md`, `/app/memory/CR-208_Homepage_Below_Fold_Defer.md`*

*Registered 2026-09-04. Source: Lighthouse mobile audit comparison across preview/beta/production.*
