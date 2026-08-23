# CR Intake Register — Grouped by Batch

**Updated:** 2026-06 · Legend: ✅ Implemented · 🔲 Open · ⏸️ Backlog/Blocked · 👤 Owner action (infra/CRM, no code) · 📋 Registered — awaiting owner approval · ⭐ Current focus

---

## BATCH 0 — Ads Intelligence · CRM · Attribution (CR-24 → CR-65)
| CR | Title | Status | Prio |
|---|---|---|---|
| CR-24 | Ads Intelligence Platform | ✅ Phase A+B+C done; Phase D (Google API) + E (Attribution/CRM) pending | P0 |
| CR-30 | Date Presets + Default 7-Day Period on Ads Intelligence | ✅ Implemented | — |
| CR-39 | Direct Visitor Attribution Default (`first_source="website"`) | 📋 Discovery complete — awaiting approval | HIGH |
| CR-40 | OTP-Verified Tag + Backfill | ✅ Implemented | MEDIUM |
| CR-41 | Freshsales Custom Field Label Cleanup | 📋 Registered — awaiting approval | LOW |
| CR-42 | Zero Hardcoded Values — Full ENV Extraction | ✅ Implemented | P1 |
| CR-43 | WhatsApp FAB — ENV-Controlled Toggle + Number | ✅ Implemented | P1 |
| CR-44 | fbc Cookie + ad_id Attribution Loss to Freshsales | 📋 Registered — fix pending approval | HIGH |
| CR-45 | Freshsales Journey Webhook Not Firing (`crm_stage_events` empty) | 👤 Freshsales config | MEDIUM |
| CR-47 | Freshsales `custom_field` Wipe on tag/demo-booked | 📋 Registered — fix pending approval | CRITICAL |
| CR-48 | One-Time Backfill of Wiped `cf_*` Attribution | 📋 After CR-47 deploy | HIGH |
| CR-49 | Attribution Field Redundancy Cleanup | 📋 Bundle w/ CR-47 | LOW-MED |
| CR-50 | Calendly Overlay CSS Missing (popup + inline broken) | 🔲 In progress | — |
| CR-51 | Persist `event_id` in `demo_requests` Mongo doc | 🔲 Registered | — |
| CR-52 | Server-Observable Browser Pixel Heartbeat | 🔲 Registered | MEDIUM |
| CR-53 | Backend-Driven Meta CAPI Mirror | 🔲 Registered | HIGH |
| CR-57 | Sector-Page Demo Anchor Lands on Heading not Form (mobile) | 🔲 Registered | — |
| CR-58 | Record pathname at Demo CTA click → latest_source | ⏸️ Backlog ("later") | P2 |
| CR-59 | Preview env hijacked production Calendly webhook | ✅ Fixed + backfilled (2026-07-14) | — |
| CR-60 | Legacy Meta Ad URL Template Contamination | ⏸️ Closed — not actioned (1 ad) | LOW |
| CR-62 | Missing `event_id` & `fbclid` in Freshsales — Investigation | 🔲 Investigation complete — fixes pending | HIGH |
| CR-63 | Fix Missing `event_id`/`otp_verified`/`cf_rooms` (Quote/Contact) | 🔲 Ready for implementation | HIGH |
| CR-64 | Fix `upsert_contact` UPDATE: Replace→Merge | 🔲 After CR-63 live | — |
| CR-65 | Demo-Booking Status rename → "Follow Up for Scheduling" | 📋 Registered | MEDIUM |

---

## BATCH 1 — Core Web Vitals / Performance (CR-70 → CR-72)
| CR | Title | Status | Prio |
|---|---|---|---|
| CR-70 | Fix Font Preloading (remove Inter, preload Poppins + Clash Display) | ✅ Implemented 2026-08-20 | CRITICAL |
| CR-71 | Preload Hero LCP Image + fetchpriority | ✅ Implemented 2026-08-20 | CRITICAL |
| CR-72 | React.lazy Code Splitting (non-home routes) | ✅ Implemented 2026-08-20 | CRITICAL |

---

## BATCH 3 — Petpooja Ad Landing Page (CR-73–76, 111–113)
| CR | Title | Status | Prio |
|---|---|---|---|
| CR-73 | Add Phone/Email/Privacy to LandingFooter (/petpooja-alternative) | ✅ Implemented 2026-08-20 | CRITICAL |
| CR-74 | Fix Broken StickyMobileCta (/petpooja-alternative) | ✅ Implemented 2026-08-20 | CRITICAL |
| CR-75 | Update Petpooja Alternative H1 (keyword relevance) | ✅ Implemented 2026-08-20 | CRITICAL |
| CR-76 | Replace Text Trust Badges with Logo Images | ✅ Implemented 2026-08-20 | CRITICAL |
| CR-111 | Fix Petpooja Meta Title (add keyword) | ✅ Implemented 2026-08-20 | CRITICAL |
| CR-112 | Reduce Petpooja Demo Form to 3 Fields | ⏸️ Superseded by CR-113 | HIGH |
| CR-113 | Petpooja Mobile UX Overhaul (hero resize + navbar CTA + bottom sheet) | ✅ Implemented 2026-08-20 | HIGH |

---

## BATCHES A–D — SEO · Schema · Content · UX (CR-77 → CR-110)

### High tier
| CR | Title | Status | Prio |
|---|---|---|---|
| CR-77 | Whitelist Googlebot in Cloudflare WAF | 👤 Owner (Cloudflare) — OPEN | CRITICAL |
| CR-78 | 301 Apex→www + fix duplicate sitemap on apex | 👤 Owner (Cloudflare) — OPEN | CRITICAL |
| CR-79 | Soft-404 → real HTTP 404 | ✅ React side done; ⏸️ backend Nginx pending | CRITICAL |
| CR-80 | SoftwareApplication + Offer schema (/pricing + home) | ✅ Implemented 2026-08-21 (AggregateRating deferred) | HIGH |
| CR-81 | WebP conversion + lazy-load (TrustBand/FeatureVideo) | ✅ Implemented 2026-08-21 | HIGH |
| CR-82 | Explicit width/height on all img tags (CLS fix) | 🔲 OPEN | HIGH |
| CR-83 | H1 keyword relevance (product + sector pages) | ✅ Implemented 2026-08-21 (Phase 1+2) | HIGH |
| CR-84 | StickyMobileCta + pricing anchor (Product/Sector pages) | ✅ Implemented 2026-08-21 | HIGH |
| CR-85 | Create /restaurant-billing-software landing page | 🔲 OPEN | HIGH |
| CR-86 | Create /restaurant-pos landing page | 🔲 OPEN | HIGH |
| CR-87 | /demo competitor reframe + trust fixes | ✅ Implemented 2026-08-21 | HIGH |
| CR-88 | Named authors on all 21 blog posts | 🔲 OPEN | HIGH |

### Medium tier
| CR | Title | Status | Prio |
|---|---|---|---|
| CR-89 | Owner names + Review schema on testimonials | 🔲 OPEN (needs owner names) | MEDIUM |
| CR-90 | Add /product & /solutions hub pages to sitemap | 🔲 OPEN | MEDIUM |
| CR-91 | Standardize BreadcrumbList schema | 🔲 OPEN | MEDIUM |
| CR-92 | Increase touch-target size (cookie banner + hamburger) | 🔲 OPEN | MEDIUM |
| CR-93 | Fix cookie banner overlap at 768px | 🔲 OPEN | MEDIUM |
| CR-94 | Link marketing claims to case studies (methodology page) | 🔲 OPEN | MEDIUM |
| CR-95 | Promote /roi calculator above fold + navbar | 🔲 OPEN | MEDIUM |
| CR-96 | Surface GST/UPI/aggregator trust signals above fold | 🔲 OPEN | MEDIUM |
| CR-97 | Phone number above fold on homepage | 🔲 OPEN | MEDIUM |
| CR-98 | Consolidate Calendly widget double-load | ✅ Implemented 2026-08-21 | MEDIUM |
| CR-99 | Expand thin product/sector pages | 🔲 OPEN | MEDIUM |
| CR-100 | Fix sitemap lastmod dates | 🔲 OPEN | MEDIUM |

### Low / long-term
| CR | Title | Status | Prio |
|---|---|---|---|
| CR-101 | SSR / Pre-rendering (Next.js or react-snap) | ⏸️ OPEN — long-term backlog (POC done for `/`, see ⭐ below) | LOW (high impact/effort) |
| CR-102 | Resume blog publishing (15-month gap) | 🔲 OPEN — ongoing | LOW |
| CR-103 | Add llms.txt for AI crawlers | ⏸️ Blocked on CR-101 | LOW |
| CR-104 | HSTS + CSP headers via Cloudflare | 👤 Owner — OPEN | LOW |
| CR-105 | CWV monitoring pipeline (PSI + CrUX + Lighthouse CI) | 🔲 OPEN | LOW |
| CR-106 | Review/retire FAQPage schema (deprecated May 2026) | 🔲 OPEN | LOW |
| CR-107 | GTM container audit + third-party script consolidation | 🔲 OPEN | LOW |
| CR-108 | Third-party brand mention/citation for GEO | 🔲 OPEN | LOW |
| CR-109 | Structured answer-style content for AI crawlers (GEO) | ⏸️ Blocked on CR-101 | LOW |
| CR-110 | Brand entity disambiguation for "MyGenie" | 🔲 OPEN | LOW |

---

## ⭐ BATCH E (NEW) — LCP / Core Web Vitals Closeout (CR-114 → CR-116)
*Raised from the CR-101 homepage-prerender POC. Goal: close LCP/TBT/CLS end-to-end. See `HANDOVER_CR114_115_116_LCP_Closeout.md`.*
| CR | Title | Status | Prio |
|---|---|---|---|
| CR-101 (POC) | Homepage `/` prerender POC — Impact Analysis / Plan / RESULTS | ✅ POC executed in preview (architecture fixed; SI 95) | — |
| CR-114 | Heading webfont (Clash Display) → delayed LCP + CLS (mobile) | 🔲 OPEN | HIGH |
| CR-115 | Homepage JS bundle weight → high TBT (hydration) | 🔲 OPEN | HIGH |
| CR-116 | Ensure gzip/brotli compression for prerendered HTML (prod) | 🔲 OPEN | MEDIUM |
| CR-82 | (cross-ref) img width/height CLS fix — overlaps CR-114 CLS | 🔲 OPEN | HIGH |

---

## Roll-up counts
- ✅ Implemented: CR-30, 40, 42, 43, 59, 70, 71, 72, 73, 74, 75, 76, 79(react), 80, 81, 83, 84, 87, 98, 111, 113 (+CR-24 partial)
- 🔲 Open (code): CR-50, 51, 52, 53, 57, 62, 63, 64, 82, 85, 86, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 99, 100, 102, 105, 106, 107, 108, 110, **114, 115**
- 👤 Owner/infra (no code): CR-45, 77, 78, 79(nginx), 104, **116**
- 📋 Awaiting owner approval: CR-39, 41, 44, 47, 48, 49, 65
- ⏸️ Backlog/blocked/closed: CR-58, 60, 101, 103, 109, 112

*Register generated 2026-06 from `/app/memory/CR-*.md`.*
