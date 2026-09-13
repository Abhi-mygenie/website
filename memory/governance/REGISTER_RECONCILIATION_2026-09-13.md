# CR REGISTER RECONCILIATION — 2026-09-13

**Source:** `/app/memory/CR_INTAKE_REGISTER.md` (211 unique CRs, CR-24 → CR-264). Parsed from every table row; where a CR appears in more than one table, the **first** occurrence (batch table) is taken as "Register state" and conflicts are listed in §3.
**Method:** read-only. State = legend emoji in the Status cell. Docs = files in `/app/memory` whose name contains the CR id (including range/combined files such as `CR-239-to-246_*`, `CR-154_157_158_*`).
**Gate (proposed):** the gate the CR would sit at under the target model `INTAKE → INVESTIGATION → IMPACT → PLAN → APPROVAL → IMPLEMENTATION → QA → CLOSURE`. Proposed only — not yet applied.

---

## 1. Summary

| State | Count |
|---|---|
| CLOSED ✅ | 149 |
| OPEN 🔲 | 26 |
| Awaiting approval 📋 | 9 |
| Owner action 👤 | 11 |
| Deferred ⏸️ | 13 |
| Unclassified | 3 |
| **Total** | **211** |

| Integrity flag | Count | Meaning |
|---|---|---|
| closed, no artefact | 8 | No CR file of any kind — closure cannot be evidenced |
| closed, no IA/plan | 55 | A brief exists but no Impact Analysis or Line-by-Line plan |
| open, no CR doc | 9 | Registered in a table only; nothing to investigate from |
| status cell has no legend emoji | 3 | CR-201, CR-233, CR-259 |

## 2. Out-of-register items

- **Code references without a register row:** CR-1, 2, 3, 4, 7, 10, 18, 19, 20, 21, 23, 25, 26, 27, 28, 33, 36, 37, 67, 68 (pre-register era; `IMPLEMENTATION_PLAN_CR35_36_37.md` and `HANDOVER_CR68_NEXT_AGENT.md` exist).
- **CR docs without a register row:** CR-117, 118, 119, 120, 121, 122, 123 (all have IA + Plan + brief — likely closed, never rolled into the register).
- **Numbering gaps (24–264):** 25–29, 31–38, 46, 54–56, 61, 66–69, 117–123, 138.

## 3. Conflicting statuses (same CR, different rows) — proposed resolution

| CR | Statuses found | Proposed resolution | Evidence needed |
|---|---|---|---|
| CR-101 | ⏸ vs ✅ | ✅ CLOSED (full prerender rollout is live — 65 prerendered routes in build) | none |
| CR-195 | ✅ vs (none) | ✅ CLOSED | none |
| CR-239–246 | 🔲/📋 vs ✅ | Batch AY: roll-up says ✅ done 2026-09-08; batch table not updated → mark ✅ CLOSED except CR-240/241/245 which need owner value confirmation | owner: confirm city count, go-live hours, Petpooja sentence |
| CR-249 | 📋 vs ✅ | ✅ owner decided "disable" 2026-09-11; **but** env key missing in pod and not deployed → reopen as IMPLEMENTATION (see Baseline B-2/B-3) | deploy + verify prod |
| CR-251 | 📋 vs ✅ | ✅ CLOSED per roll-up | none |
| CR-253, CR-254 | 👤 vs 🔲 | 👤 OWNER-ACTION (Freshsales admin) | none |
| CR-255 | 🔲/📋 vs ✅ | ✅ CLOSED per roll-up (IA+Plan exist) | none |
| CR-258 | 🔲 vs ✅ | ✅ CLOSED per roll-up | none |
| CR-259 | (none) vs 🔲 | 🔲 OPEN — at PLAN gate (line count row, no status) | none |
| CR-263 | 👤 vs 🔲 | 👤 OWNER-ACTION — needs signing key | owner provides key |
| CR-264 | ✅ vs 📋 | ✅ CLOSED 2026-09-09 (header confirms) | none |

**Root cause of conflicts:** three "New CR Roll-up" tables were appended over time without updating the batch tables. Fix in Step 2: one row per CR in `TRACEABILITY_MATRIX.md`; the register becomes intake-only.

## 4. New CRs raised by the baseline

| CR | Title | Gate | Prio |
|---|---|---|---|
| CR-265 | Retro-register: `GET /api/demo-requests` probe-doc filter (2026-09-11 untracked change) | CLOSURE (retro) | P2 |
| CR-266 | `GET /api/demo-requests` has no auth — lead PII publicly readable on production | INTAKE | **P0** |

## 5. Full per-CR table

Sorted: OPEN → Unclassified → Awaiting approval → Owner → Deferred → Closed.

| CR | Title | Register state | Gate (proposed) | IA doc | Plan doc | Any CR doc | Code ref | Flag |
|---|---|---|---|---|---|---|---|---|
| CR-88 | Named authors on all 21 blog posts | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-89 | Owner names + Review schema on testimonials | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-94 | Link marketing claims to case studies (methodology page) | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-99 | Expand thin product/sector pages | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-102 | Resume blog publishing (15-month gap) | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-105 | CWV monitoring pipeline (PSI + CrUX + Lighthouse CI) | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-107 | GTM container audit + third-party script consolidation | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-108 | Third-party brand mention/citation for GEO | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-110 | Brand entity disambiguation for "MyGenie" | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-144 | StickyMobileCta audit tested at wrong viewport | OPEN | INTAKE/INVESTIGATION | — | — | 0 | — | open, no CR doc |
| CR-150 | `/restaurant-pos-comparison` — Multi-competitor hub page | OPEN | INTAKE/INVESTIGATION | — | ✅ | 3 | ✅ |  |
| CR-172 | AggregateRating on SoftwareApplication schema | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-221 | Google Ads Remarketing tag (`AW-16740091756`) POST calls to `google.co | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-222 | Same rmkt/collect failures confirmed on production from India with c | OPEN | INTAKE/INVESTIGATION | — | — | 1 | — |  |
| CR-236 | `/product/*` pages: hero `<img>` has `fetchPriority="high"` but no p | OPEN | INTAKE/INVESTIGATION | ✅ | ✅ | 3 | — |  |
| CR-239 | `/qsr-pos-system` pricing conflict: "Starting at ₹4,000/year" shown  | OPEN | INTAKE/INVESTIGATION | ✅ | ✅ | 2 | — |  |
| CR-242 | `/product/sell-serve` Captain App section missing "take orders" / "o | OPEN | INTAKE/INVESTIGATION | ✅ | ✅ | 2 | — |  |
| CR-243 | `/restaurant-management-software` missing a "take orders" / "orderin | OPEN | INTAKE/INVESTIGATION | ✅ | ✅ | 2 | — |  |
| CR-244 | `/qsr-pos-system` missing Swiggy/Zomato mention + "fast food" absent | OPEN | INTAKE/INVESTIGATION | ✅ | ✅ | 2 | — |  |
| CR-246 | Petpooja comparison table missing dated disclaimer footnote. No so | OPEN | INTAKE/INVESTIGATION | ✅ | ✅ | 2 | — |  |
| CR-252 | No Cloudflare cache purge step in deploy pipeline — stale HTML serve | OPEN | INTAKE/INVESTIGATION | — | — | 0 | — | open, no CR doc |
| CR-255 | Trust signal uplift across all 5 Google Ads landing pages — 8 catego | OPEN | INTAKE/INVESTIGATION | ✅ | ✅ | 1 | — |  |
| CR-256 | Hero section top padding too large on mobile — 200px dead space befo | OPEN | INTAKE/INVESTIGATION | — | — | 0 | — | open, no CR doc |
| CR-257 | "See Pricing ↓" secondary CTA in hero distracts from primary "Book a | OPEN | INTAKE/INVESTIGATION | — | — | 0 | — | open, no CR doc |
| CR-258 | Site-wide pt-32 → pt-20 on all pages + remove "See Pricing" CTA from | OPEN | INTAKE/INVESTIGATION | — | — | 0 | — | open, no CR doc |
| CR-260 | `DemoForm` rendered without `sector` prop on 6 pages — all leads fro | OPEN | INTAKE/INVESTIGATION | — | — | 0 | — | open, no CR doc |
| CR-201 | React #418 — ConsentBanner.jsx adds `consent-banner-open` to `document | UNKNOWN | ⚠️ UNCLASSIFIED | — | ✅ | 2 | ✅ | status cell has no legend emoji |
| CR-233 | `prerender.js` hero-image preload selector misses all 5 ad landing p | UNKNOWN | ⚠️ UNCLASSIFIED | ✅ | ✅ | 2 | ✅ | status cell has no legend emoji |
| CR-259 | Extract `QuickDemoSheet` into shared `DemoBottomSheet` component + w | UNKNOWN | ⚠️ UNCLASSIFIED | — | — | 0 | ✅ | status cell has no legend emoji |
| CR-41 | Freshsales Custom Field Label Cleanup | AWAIT_APPROVAL | APPROVAL (waiting owner) | — | — | 1 | ✅ |  |
| CR-48 | One-Time Backfill of Wiped `cf_*` Attribution | AWAIT_APPROVAL | APPROVAL (waiting owner) | — | — | 1 | — |  |
| CR-65 | Demo-Booking Status rename → "Follow Up for Scheduling" | AWAIT_APPROVAL | APPROVAL (waiting owner) | — | — | 1 | — |  |
| CR-240 | City count inconsistency across site — 3 different numbers in use. | AWAIT_APPROVAL | APPROVAL (waiting owner) | ✅ | ✅ | 2 | — |  |
| CR-241 | Go-live time conflict: Petpooja page shows "24hrs", all other pages  | AWAIT_APPROVAL | APPROVAL (waiting owner) | ✅ | ✅ | 2 | — |  |
| CR-245 | Petpooja hero "1.5 lakh restaurants. It's earned that." sentence mis | AWAIT_APPROVAL | APPROVAL (waiting owner) | ✅ | ✅ | 2 | — |  |
| CR-249 | WhatsApp FAB — owner to decide: keep enabled, disable site-wide, or  | AWAIT_APPROVAL | APPROVAL (waiting owner) | — | — | 0 | — | open, no CR doc |
| CR-251 | Add sticky mobile "Book Free Demo" bar to 5 Google Ads landing pages | AWAIT_APPROVAL | APPROVAL (waiting owner) | — | — | 0 | — | open, no CR doc |
| CR-261 | Each of the 5 Google Ads landing pages mounts TWO `DemoForm` instanc | AWAIT_APPROVAL | APPROVAL (waiting owner) | — | — | 0 | — | open, no CR doc |
| CR-45 | Freshsales Journey Webhook Not Firing | OWNER | OWNER-ACTION | — | — | 1 | — |  |
| CR-104 | HSTS + CSP headers via Cloudflare | OWNER | OWNER-ACTION | — | — | 1 | — |  |
| CR-145 | beta.mygenie.online canonical self-referencing | OWNER | OWNER-ACTION | — | — | 0 | — |  |
| CR-146 | beta.mygenie.online robots.txt `Allow: /` | OWNER | OWNER-ACTION | — | — | 0 | — |  |
| CR-151 | Negative keywords in Google Ads console | OWNER | OWNER-ACTION | — | — | 1 | — |  |
| CR-186 | Cloudflare RUM beacon in critical path — /cdn-cgi/rum takes 2,003ms | OWNER | OWNER-ACTION | — | — | 1 | — |  |
| CR-200 | Production `www.mygenie.online` serving old non-prerendered build (`ma | OWNER | OWNER-ACTION | — | — | 1 | — |  |
| CR-216 | GTM container `GTM-K5D84Z3L` loads 3 separate Google scripts: GTM (157 | OWNER | OWNER-ACTION | — | — | 1 | — |  |
| CR-253 | Capture literal Google search query (`utm_query`) in Freshsales. C | OWNER | OWNER-ACTION | — | — | 0 | — |  |
| CR-254 | Data hygiene bug: ~10–15 leads (out of 700) showing unrelated values | OWNER | OWNER-ACTION | — | — | 0 | — |  |
| CR-263 | `CALENDLY_WEBHOOK_SIGNING_KEY` not set in `backend/.env` → Calendly  | OWNER | OWNER-ACTION | — | — | 0 | — |  |
| CR-52 | Server-Observable Browser Pixel Heartbeat | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-53 | Backend-Driven Meta CAPI Mirror | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-58 | Record pathname at Demo CTA click → latest_source | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-60 | Legacy Meta Ad URL Template Contamination | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-95 | Promote /roi calculator above fold + navbar | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-101 | SSR / Pre-rendering (Next.js or react-snap) | DEFERRED | DEFERRED | ✅ | ✅ | 6 | — |  |
| CR-103 | Add llms.txt for AI crawlers | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-109 | Structured answer-style content for AI crawlers (GEO) | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-112 | Reduce Petpooja Demo Form to 3 Fields | DEFERRED | DEFERRED | — | — | 1 | — |  |
| CR-247 | `lead_verifided` typo — GTM trigger name has typo; code intentionall | DEFERRED | DEFERRED | — | — | 0 | — |  |
| CR-248 | `whatsapp_click` dataLayer event not wired to GTM/GA4. `WhatsAppFa | DEFERRED | DEFERRED | — | — | 0 | — |  |
| CR-250 | Add compact hero-section form on 5 Google Ads landing pages. Audit | DEFERRED | DEFERRED | — | — | 0 | — |  |
| CR-262 | No GTM trigger exists for the `demo_booked` event — Calendly booking | DEFERRED | DEFERRED | — | — | 0 | — |  |
| CR-24 | Ads Intelligence Platform | CLOSED | CLOSURE | ✅ | ✅ | 3 | ✅ |  |
| CR-30 | Date Presets + Default 7-Day Period on Ads Intelligence | CLOSED | CLOSURE | ✅ | ✅ | 1 | ✅ |  |
| CR-39 | Direct Visitor Attribution Default (`first_source="website"`) | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-40 | OTP-Verified Tag + Backfill | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-42 | Zero Hardcoded Values — Full ENV Extraction | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-43 | WhatsApp FAB — ENV-Controlled Toggle + Number | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-44 | fbc Cookie + ad_id Attribution Loss to Freshsales | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-47 | Freshsales `custom_field` Wipe on tag/demo-booked | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-49 | Attribution Field Redundancy Cleanup | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-50 | Calendly Overlay CSS Missing | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-51 | Persist `event_id` in `demo_requests` Mongo doc | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-57 | Sector-Page Demo Anchor Lands on Heading not Form (mobile) | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-59 | Preview env hijacked production Calendly webhook | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-62 | Missing `event_id` & `fbclid` — Investigation | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-63 | Fix Missing `event_id`/`otp_verified`/`cf_rooms` (Quote/Contact) | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-64 | Fix `upsert_contact` UPDATE: Replace→Merge | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-70 | Fix Font Preloading (remove Inter, preload Poppins + Clash Display) | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-71 | Preload Hero LCP Image + fetchpriority | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-72 | React.lazy Code Splitting (non-home routes) | CLOSED | CLOSURE | ✅ | ✅ | 4 | — |  |
| CR-73 | Add Phone/Email/Privacy to LandingFooter (/petpooja-alternative) | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-74 | Fix Broken StickyMobileCta (/petpooja-alternative) | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-75 | Update Petpooja Alternative H1 (keyword relevance) | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-76 | Replace Text Trust Badges with Logo Images | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-77 | Whitelist Googlebot in Cloudflare WAF | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-78 | 301 Apex→www + fix duplicate sitemap on apex | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-79 | Soft-404 → real HTTP 404 | CLOSED | CLOSURE | — | ✅ | 3 | ✅ |  |
| CR-80 | SoftwareApplication + Offer schema (/pricing + home) | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-81 | WebP conversion + lazy-load (TrustBand/FeatureVideo) | CLOSED | CLOSURE | ✅ | ✅ | 5 | — |  |
| CR-82 | Explicit width/height on all img tags (CLS fix) | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-83 | H1 keyword relevance (product + sector pages) | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-84 | StickyMobileCta + pricing anchor (Product/Sector pages) | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-85 | Create /restaurant-billing-software LP | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-86 | Create /restaurant-pos-system LP | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-87 | /demo competitor reframe + trust fixes | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-90 | Add /product & /solutions hub pages to sitemap | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-91 | Standardize BreadcrumbList schema | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-92 | Increase touch-target size (cookie banner + hamburger) | CLOSED | CLOSURE | ✅ | — | 2 | — |  |
| CR-93 | Fix cookie banner overlap at 768px | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-96 | Surface GST/UPI/aggregator trust signals above fold | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-97 | Phone number above fold on homepage | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-98 | Consolidate Calendly widget double-load | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-100 | Fix sitemap lastmod dates | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-106 | Review/retire FAQPage schema (deprecated May 2026) | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-111 | Fix Petpooja Meta Title (add keyword) | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-113 | Petpooja Mobile UX Overhaul (hero resize + navbar CTA + bottom sheet) | CLOSED | CLOSURE | — | ✅ | 3 | ✅ |  |
| CR-114 | Heading webfont (Clash Display) → delayed LCP + CLS | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-115 | Homepage JS bundle weight → high TBT (hydration) | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-116 | Gzip/brotli compression for prerendered HTML | CLOSED | CLOSURE | ✅ | — | 2 | — |  |
| CR-124 | React.lazy Suspense hydration gap → CLS + TBT | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-125 | CmsProvider blocking hydration → TBT | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-126 | Prerender not locked in deploy pipeline | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-127 | CR-81 remainder: products.js PNG → WebP | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-128 | Logo SVG explicit rendered dimensions | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-129 | Cache headers for hashed static assets | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-130 | Lazy-load CmsAdminLayer | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-131 | Exclude unused shadcn/ui from Tailwind scan | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-132 | StickyMobileCta: `transition-all` + `bottom` → composited animation | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-133 | Prerender head tag poisoning | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-134 | /demo + /payment-success not prerendered | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-135 | DemoLanding.jsx `canonical` prop silently ignored | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-136 | About.jsx missing ORG_JSONLD | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-137 | PetpoojaAlternative.jsx missing FAQPage + SoftwareApplication schema | CLOSED | CLOSURE | ✅ | ✅ | 4 | ✅ |  |
| CR-139 | StickyMobileCta hidden behind ConsentBanner on iOS safe-area | CLOSED | CLOSURE | ✅ | — | 2 | — |  |
| CR-140 | 404 pages serve homepage HTML body | CLOSED | CLOSURE | ✅ | — | 2 | — |  |
| CR-141 | QSR sector: `s.name.toLowerCase()` = "qsr / fast food" mid-sentence | CLOSED | CLOSURE | ✅ | — | 2 | — |  |
| CR-142 | /petpooja-alternative orphaned — zero internal links | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-143 | Cookie Accept/Decline buttons 40px → 44px | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
| CR-147 | Customer Logo Refresh — 56 logos → WebP, expand TrustBand | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
| CR-148 | `/restaurant-management-software` LP | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-149 | `/qsr-pos-system` LP + RSA headlines | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-152 | `/cloud-kitchen-pos` LP | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-153 | ENV-gated lead dashboard (`LEADS_DASHBOARD_ENABLED`) | CLOSED | CLOSURE | ✅ | ✅ | 3 | ✅ |  |
| CR-154 | Homepage badge keyword | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-155 | `/pricing` H1 keyword + DemoForm section | CLOSED | CLOSURE | ✅ | ✅ | 3 | ✅ |  |
| CR-156 | All 8 remaining DemoForms → shortForm | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-157 | Hero primary CTA `<a href="#demo">` | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-158 | `/product` H1 keyword | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-159 | `/customers` sticky demo CTA + mid-page CTA card | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-160 | `Reveal.jsx` start visible=true | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-161 | DemoForm submit → "Book My Free Demo →" | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-162 | Emergency redirect `/restaurant-pos-comparison` → `/restaurant-pos-sys | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-163 | Fix 5-field DemoForm — hide outlet_type in shortForm | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-164 | "See Pricing" same-page scroll + SectorPage CTA | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-165 | StickyMobileCta missing from `/petpooja-alternative` — component never | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
| CR-166 | `SOFTWARE_APP_JSONLD` Growth plan price = `"1499"` but correct price i | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
| CR-167 | Homepage H1 keyword gap — "Run a more profitable..." has zero POS/bill | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-168 | Homepage `<title>` 68 chars → shorten to ≤60 | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-169 | Homepage meta description 191 chars → shorten to ≤155 | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-170 | Add `<link rel="sitemap" type="application/xml" href="/sitemap.xml">`  | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-171 | Homepage FAQ section + QAPage JSON-LD schema | CLOSED | CLOSURE | ✅ | ✅ | 4 | ✅ |  |
| CR-173 | All `<button>` elements missing `type` attribute — HTML default = `typ | CLOSED | CLOSURE | ✅ | ✅ | 2 | — |  |
| CR-174 | `#demo` anchor has no `scroll-margin-top` — sticky nav (72px) covers t | CLOSED | CLOSURE | — | ✅ | 1 | — |  |
| CR-175 | Footer social links use `rel="noreferrer"` only — Lighthouse expects e | CLOSED | CLOSURE | — | ✅ | 1 | — |  |
| CR-176 | No `/thank-you` page — post-booking confirmation UX missing + retarget | CLOSED | CLOSURE | ✅ | ✅ | 2 | ✅ |  |
| CR-177 | No `autoFocus` on first DemoForm field — user must click into form man | CLOSED | CLOSURE | ✅ | ✅ | 2 | — |  |
| CR-178 | Homepage missing 9 high-priority ad keywords at 0 occurrences | CLOSED | CLOSURE | ✅ | ✅ | 4 | — |  |
| CR-179 | 5 solution/product pages missing target keywords for their respective  | CLOSED | CLOSURE | ✅ | ✅ | 4 | — |  |
| CR-180 | No noindex on beta subdomain + canonical strategy undefined | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-181 | Meta descriptions >160 chars on 5 pages — SERP truncation | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-182 | LCP 4.1s — hero `banner.webp` has no responsive `srcset` → mobile down | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-183 | Poppins 500/600/700 weights not preloaded — load at 1,400–1,486ms caus | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-184 | Trust band logos 25–35 KiB each — displayed at 160×64px, should be ≤5  | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-185 | Decorative labels using text-[9px]–text-[11px] — Lighthouse SEO flags  | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-187 | "billing software" + "pos system" missing from solution page bodies —  | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-188 | Homepage `restaurant management` 0× in body — keyword present in meta  | CLOSED | CLOSURE | — | ✅ | 3 | — |  |
| CR-189 | Solutions pages: additional keyword gaps beyond CR-187 — 11 missing ke | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-190 | Product pages: keyword gaps across all 6 pages — 15 missing keyword sl | CLOSED | CLOSURE | — | ✅ | 3 | — |  |
| CR-191 | `/demo` page: `noindex={true}` hardcoded — SEO score 61 (should be 92) | CLOSED | CLOSURE | — | ✅ | 1 | — |  |
| CR-192 | `fetchPriority="high"` missing on hero `<img>` — 6 landing pages all a | CLOSED | CLOSURE | — | ✅ | 1 | — |  |
| CR-193 | Hero `<img>` wrapped in `<Reveal>` on landing pages — Reveal hides ima | CLOSED | CLOSURE | — | ✅ | 1 | — |  |
| CR-194 | `/petpooja-alternative` CLS 0.029 — trust logos in hero have no `width | CLOSED | CLOSURE | — | ✅ | 1 | — |  |
| CR-195 | `/restaurant-pos-comparison` hero stat cards in `<Reveal delay={i*0.08 | CLOSED | CLOSURE | — | ✅ | 1 | — |  |
| CR-196 | `/demo` NO_LCP — H1 uses `font-extrabold` (weight 800, not preloaded)  | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
| CR-197 | `/restaurant-pos-comparison` TBT spike (100ms → 490ms) — pre-existing  | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
| CR-198 | `REACT_APP_GTM_ID` not set in `.env` — GTM container never loads; GA4, | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-199 | GTM injected via `useEffect` in `App.js` — fires 8–13s after HTML deli | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-202 | `/solutions/bars-and-pubs` silently serves homepage (soft 404). Build  | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-203 | `/solutions/hotels` silently serves homepage (soft 404). Build dir is  | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-204 | `/solutions/bakeries` h1 missing `pos system` and `billing software`.  | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-205 | React #418 root cause investigation — CR-201 fix (mountedRef guard) co | CLOSED | CLOSURE | — | — | 1 | ✅ | closed, no IA/plan |
| CR-206 | `browserslist` targets `>0.2%` → ships ES5 polyfills for IE11/Safari12 | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-207 | Main bundle 958 KB — vendor libs (Radix UI, shadcn, lucide, etc.) bund | CLOSED | CLOSURE | ✅ | ✅ | 3 | ✅ |  |
| CR-208 | 9 below-fold homepage sections in single `<Suspense>` → all 9 chunks d | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-209 | GTM fires at `<head>` parse time → all 3 tags (GA4 + Ads + Remarketing | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-210 | `/solutions/ice-cream-desserts` H1 missing "POS system & billing softw | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-211 | No preconnect hints for FB Pixel (`connect.facebook.net`) and Cloudfla | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-212 | `/solutions/bars-and-pubs` and `/solutions/hotels` return HTTP 404 — r | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-213 | All 11 solution page title tags use plural `s.name` ("Restaurants", "C | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-214 | Sitemap `lastmod` dates stale — sitemap is 100% complete (59 URLs, no  | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-215 | TrustBand marquee: 56 logos duplicated to 112 DOM nodes (`const loop = | CLOSED | CLOSURE | ✅ | ✅ | 3 | — |  |
| CR-217 | Production nginx serves all `/brand/` assets with only 4h cache TTL* | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-218 | `QAPage` schema invalid on all 20 pages — `answerCount` missing fr | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-219 | GA4 blocked by global `analytics_storage: denied` default — no EEA r | CLOSED | CLOSURE | — | ✅ | 2 | ✅ |  |
| CR-220 | Enhanced Conversions broken — three stacked issues. (1) EC mode se | CLOSED | CLOSURE | ✅ | ✅ | 3 | ✅ |  |
| CR-223 | Sitemap missing trailing slashes — 58/59 URLs return 301, 0 pages in | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-224 | Production nginx forcing 301 trailing slash redirect on all URLs — r | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-225 | Google Ads Alpha campaign 5 final URLs missing trailing slash — every  | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-226 | Cloudflare Rule 2 (HTML 10-min cache) has no exclusion for /api/* en | CLOSED | CLOSURE | — | — | 1 | — | closed, no IA/plan |
| CR-227 | 3 one-line H1/H3 keyword gap fixes across 3 landing pages. (A) `/r | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-228 | Hero H1 + subheadline rewrite on /petpooja-alternative. Page targe | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-229 | 7 remaining content changes on /petpooja-alternative from audit brie | CLOSED | CLOSURE | — | ✅ | 2 | — |  |
| CR-230 | Modal CTA on 5 paid landing pages — 0 form starts from paid traffic. | CLOSED | CLOSURE | ✅ | ✅ | 2 | — |  |
| CR-231 | WhatsApp FAB — disable via env var. Investigation complete 2026-09 | CLOSED | CLOSURE | ✅ | ✅ | 2 | — |  |
| CR-232 | Cloudflare not edge-caching HTML pages — TTFB ~560ms–1,087ms. Root | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
| CR-234 | Homepage preload hint uses single `href` — mismatched on mobile. Con | CLOSED | CLOSURE | ✅ | ✅ | 2 | ✅ |  |
| CR-235 | ✅ CLOSED 2026-09-08 — all 12 `<a href="tel:...">` replaced with `< | CLOSED | CLOSURE | ✅ | ✅ | 2 | — |  |
| CR-237 | `Reveal.jsx` `setVisible(false)` in `useEffect` causes brief blank f | CLOSED | CLOSURE | ✅ | ✅ | 2 | ✅ |  |
| CR-238 | React Suspense fallback paints on direct load of every lazy route —  | CLOSED | CLOSURE | ✅ | — | 1 | ✅ |  |
| CR-264 | `REACT_APP_GTM_ID` verification on production. | CLOSED | CLOSURE | — | — | 0 | — | closed, no artefact |
