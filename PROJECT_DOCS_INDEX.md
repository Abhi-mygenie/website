# MyGenie POS — Project Documentation Index (Source of Truth)

> **📌 DURABLE — do not delete/overwrite.** This is the map of every persistent project doc.
> `/app/memory/PRD.md` is rewritten by agents over time, so authoritative detail lives in the docs below, NOT the PRD.
> Any agent picking up work should read this index first.

## 🧭 Documents

### 🧭 Change-request governance (durable — NEW)
| Doc | What it holds |
|---|---|
| **`CR_Control_Dashboard.md`** | CR registry + **5-gate model** (Discovery→Planning→Implementation→QA→Owner Smoke). Done & G4-passed: CR-1a/1b, CR-4 Part A **+ Part B (OTP, iteration_8)**, CR-5, CR-6 Phase 1+2a+2b+2c+2d (iteration_1..7), **CR-2 Attribution+geo (iteration_9)**, **CR-3 A Analytics & Ads (GTM dataLayer, 2026-06-08)**. CR-7 (Leads View) in G1 intake. |
| **`CR-3_Analytics_Ads_Discovery.md`** | CR-3 discovery + locked decisions (§5a–§5g): IDs (GA4 `G-KWHHFEZ5Q3`, Meta Pixel `2862017797322752`, Google Ads `AW-16740091756/NtqdClejmOgaEOyOpq4-`, GTM `GTM-K5D84Z3L`), online-vs-offline reframe, event→conversion mapping, Zapier-drop decision, owner-side GTM/Ads tasks. |
| **`CR-3A_Build_Spec.md`** | CR-3 A build spec + **implementation log (DONE & verified)**: `frontend/src/lib/gtm.js` + edits to App.js/DemoForm/CalendlyInline/MessageForm/.env. Events `form_submitted`/`lead_verified`/`demo_booked`/`page_view`, env+host-gated to www.mygenie.online. |
| **`CR-3B_Tracking_Enhancements_Backlog.md`** | Prioritized best-tracking backlog to address ONE BY ONE: P0 #1 Enhanced Conversions + Advanced Matching, P0 #2 Consent Mode v2, P1 #3 tiered values, P1 #4 quality/segmentation params, P2 #5 suppression, #6 click-ID coverage, #7 GA4 recommended events, P3 #8 user_id. |
| **`CR-2_Attribution_Mapping.md`** | CR-2 confirmed website→Freshsales mapping (native `first_*`/`latest_*` + cf_) + **still-missing CRM fields** list for the owner to create later. |
| **`CR-4B_OTP_Implementation_Spec.md`** | OTP build brief (SHIPPED & live-verified). Demo-form OTP, graceful `OTP-Unverified` fallback, SMS panel contract. |
| **`CR-7_Leads_View_Discovery.md`** | NEXT-CR intake (G1 only): read-only internal leads-triage view over existing Mongo data. |
| **`Freshsales_Field_Mapping_Request.md`** | What the CRM team must send (the `cf_` field API names) to unblock CR-1b custom-field mapping. |

### 👋 Start here (handover)
| Doc | What it holds |
|---|---|
| **`HANDOVER.md`** | Next-agent guide: what to read, current state, gotchas, and the prioritized next tasks. |

### Strategy & brand (original)
| Doc | What it holds |
|---|---|
| `MyGenie_POS_V2.4_Website_Strategy.md` | Full website/positioning strategy (the "why"). |
| `MyGenie_POS_V2.4_Content_Branding_Tone.md` | Brand voice, tone, copy rules. |
| `MyGenie_V2.4_Handover_Tracker.xlsx` | Original handover tracker (phases, pending items, image mapping). |

### SEO migration & cutover (durable)
| Doc | What it holds |
|---|---|
| `SEO_README.md` | **SEO source-of-truth index** (decisions, configs, status). |
| `SEO_Migration_Strategy.md` | Old-site footprint, redirect map, content-gap & technical-SEO plan. |
| `SEO_Migration_Weekly_Monitoring_Report.md` | Closure report (A–K) + Week-0 baseline & 4-week monitoring tables. |
| `SEO_Production_Cutover_Gate.md` | Cutover checklist, 301 readiness, deploy-time QA commands, rollback, go/no-go. |
| `frontend/cloudflare-bulk-redirects.csv`, `frontend/nginx-redirects.conf`, `frontend/public/_redirects` | The 301 redirect configs (19 old→new). |

### Product content, AI & FAQ (durable — NEW)
| Doc | What it holds |
|---|---|
| **`AI_Content_and_FAQ_Guide.md`** | **Main guide for this session's work**: Practical AI page, Central Inventory page, FAQ enrichment system, video/media infrastructure, content tracker, and how to update/add media. |
| `MyGenie_AI_Content_Tracker.xlsx` | Recording tracker: AI feature shot-lists, Central Inventory shot-list, recording specs, and the FAQ-media plan. **Owner fills real metrics + records clips.** |

### Lead routing & CRM (durable — NEW)
| Doc | What it holds |
|---|---|
| **`Freshsales_CRM_Integration.md`** | Website → Freshsales lead sync: forms create Contacts (Lead/New + tags), booking moves Status → "Demo Scheduled". IDs, write-only lifecycle quirk, `cf_` custom-field mapping, ops. Code: `backend/freshsales.py`. |
| **`Calendly_Integration.md`** | Website demo booking: branded inline Calendly (prefilled name/email/phone), `utm_content` contact mapping, booking detection via in-browser event + signed webhook, webhook registration script. Code: `CalendlyInline.jsx`, `/api/calendly/webhook`. |

## 🗂️ Key source files (where content lives)
- Page data: `frontend/src/data/` → `content.js`, `sectors.js`, `products.js`, `ai.js`, `pricing.js`, `stories.js`, `blogPosts.json`, `legal.js`, `company.js`, `redirects.js`
- SEO: `frontend/src/lib/seo.js`, `frontend/src/components/site/Seo.jsx`
- Reusable UI: `frontend/src/components/site/` → `FaqItem.jsx`, `FeatureVideo.jsx`, `Navbar.jsx`, `Footer.jsx`, `Markdown.jsx`
- Generators: `scripts/` → `generate_sitemap.py`, `scrape_blog.py`, `make_ai_tracker.py`, `enrich_faqs.py`

## ✅ High-level status (June 2026)
- Site V2.4 built & running (all phases). SEO migration implemented; **production cutover pending** (see SEO docs).
- Practical AI page (`/ai`) + Central Inventory product page (`/product/central-inventory`) built.
- FAQ enrichment system live across all FAQ pages (text + media slots + CTAs).
- **Owner-pending:** real prices/stats/logo, AI & FAQ media clips, GA4/Pixel IDs, GSC submit, production cutover, prerender/SSR (P1).
