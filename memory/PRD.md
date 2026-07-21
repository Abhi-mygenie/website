# MyGenie POS Website — PRD

## Overview
Marketing + lead-capture website for **MyGenie POS**, a hospitality operating system for restaurants, cafés, resorts & chains.

**Repository:** https://github.com/Abhi-mygenie/website.git  
**Branch:** 14-july  
**Stack:** React 19 (CRA + CRACO) + FastAPI (Python) + MongoDB

---

## Architecture

### Backend (`/app/backend/`)
- **server.py** — Main FastAPI app; all routes prefixed `/api`
- **cms_auth.py** — CMS login (env-based users + JWT)
- **freshsales.py** — Freshsales CRM integration
- **otp.py** — SMS OTP verification
- **payments.py** — Razorpay payment + GST invoice PDF
- **storage.py** — Local / S3 file storage
- **antijunk.py** — Lead anti-spam / junk detection
- **crm_sync.py** — Scheduled CRM sync (APScheduler, 6h)
- **leads.py, funnel.py, geo.py, ad_spend.py, ads_mcp.py** — Analytics & ads intelligence
- **recommendations.py** — AI recommendations

### Frontend (`/app/frontend/`)
- React 19, react-router-dom 7, Tailwind CSS, shadcn/ui (Radix)
- CRACO build config
- Pages: Home, Pricing, Solutions, Product, Practical AI, Customers, Resources, CMS dashboard

---

## Setup Done (2026-07-21 — re-cloned from main branch)
- Pulled branch `14-july` from GitHub into `/app`
- Preserved workspace files: `.emergent/`, `.git/`
- Installed all Python deps (`requirements.txt`, litellm pre-installed)
- Installed all Node deps (`yarn install`)
- Created placeholder `.env` files for backend and frontend
- Backend running on port **8001**, frontend on port **3000** via supervisor

---

## Environment Variables

### backend/.env (placeholders created)
| Key | Description |
|-----|-------------|
| MONGO_URL | MongoDB connection string |
| DB_NAME | Database name |
| FRESHSALES_BASE_URL / API_KEY | CRM integration |
| CALENDLY_API_TOKEN / WEBHOOK_CALLBACK_URL / WEBHOOK_SIGNING_KEY | Calendly |
| RAZORPAY_KEY_ID / KEY_SECRET / WEBHOOK_SECRET | Payments |
| SMS_* | SMS OTP provider |
| META_ACCESS_TOKEN / APP_ID / APP_SECRET / PIXEL_ID | Meta Ads CAPI |
| GOOGLE_ADS_* | Google Ads integration |
| AWS_S3_* | S3 media storage |
| CMS_USER_1 / CMS_PASS_1 / CMS_JWT_SECRET | CMS login |

### frontend/.env (placeholders created)
| Key | Description |
|-----|-------------|
| REACT_APP_BACKEND_URL | Backend API URL |
| REACT_APP_GTM_ID | Google Tag Manager |
| REACT_APP_CALENDLY_URL | Calendly booking URL |
| REACT_APP_WHATSAPP_NUMBER | WhatsApp FAB number |
| REACT_APP_WHATSAPP_ENABLED | Toggle WhatsApp FAB |
| REACT_APP_BUY_ONLINE_ENABLED | Toggle Buy Online flow |

---

## Status
- [x] Website running locally — frontend + backend both healthy
- [ ] Env vars to be filled by owner
- [ ] External integrations (Freshsales, Razorpay, Calendly, Meta, Google Ads) pending env config

---

## Batch C — Funnel Tracking Fixes (COMPLETE, 2026-06)
All 7 fixes shipped in preview and verified by testing_agent (100% pass each):
1. Conversion values 0/200/200/300 (gtm.js) — iteration_13
2. conversion_value as Number (gtm.js) — iteration_13
3. G3: removed duplicate lead_verified push (DemoForm.jsx) — iteration_14
4. G1: demo_booked listener gated to isMobile (DemoForm.jsx) — iteration_15
5. G4: stable per-mount event_id in RoiCalculator/MessageForm/CheckoutModal — iteration_16
6. G5: 8 UTM/ad fields added to buildLeadPayload (gtm.js) — iteration_17
7. G6: fbc formatted as fb.1.<unix_ms>.<fbclid> at first capture, persisted in localStorage 'mg_fbc' (attribution.js) — iteration_18

Skipped per user decision (do NOT re-propose): G2 (external CAPI Gateway mapping), G7 (backend CAPI mirror), G8 (Calendly webhook CAPI).

### Deployment status (confirmed by user 2026-07-16)
- Batch C fixes (all 7), CR-58, and CR-59 allow-list guard all **DEPLOYED to production** via "Save to GitHub" + prod deploy.
- CR-58 registered (BACKLOG, user said "later"): capture pathname in handleDemoCtaClick into latest_source — spec in /app/memory/CR-58_CTA_Click_Pathname_LatestSource.md.

## CR-59 — Prod Calendly webhook hijack (FIXED 2026-07-14, RECURRED + RE-FIXED 2026-07-16)
Preview fork's CR-40 startup sync deleted prod's Calendly webhook subscription on 2026-07-13 → 9 bookings lost Demo Time/Meeting Link in Freshsales. Fixed: prod webhook re-registered to https://mygenie.online/api/calendly/webhook (verified live), preview .env callback blanked, code guard added (refuses preview.emergentagent.com URLs — needs GitHub push to reach prod repo), 8/9 leads backfilled into live Freshsales (1 = owner's deleted test contact). Tests: iteration_19.json 100% pass. Full spec: /app/memory/CR-59_Preview_Calendly_Webhook_Hijack.md

**RECURRENCE 2026-07-16 (RE-FIXED + explained):** Different preview fork (`mygenie-runtime.preview...`) re-hijacked prod webhook on 2026-07-15 08:45 UTC. User confirmed CR-59 guard WAS pushed to GitHub + deployed to prod after 2026-07-14 fix. Most likely cause of recurrence: the other preview fork was either (a) already running from before the guard was deployed, or (b) booted from a stale Emergent snapshot predating 2026-07-14 10:11 UTC commit. Container restart alone does not re-clone code. Gap window 2026-07-15 08:45 → 2026-07-16 18:14 UTC lost 3 real leads (Mahendra, Chandrakala, Nishant). Re-fixed: prod webhook re-registered via `scripts/cr59_restore_prod_calendly_webhook.py`; 3 leads backfilled live (fcid 402212732712, 402212768471, 402212701179 respectively). **Prevention going forward:** ensure any dormant/stale preview forks are dismissed after modifying Calendly env in preview.

## CR-60 — Legacy Meta Ad URL Template Contamination (LOGGED 2026-07-16, NOT ACTIONED)
Single lead (Chandrakala, id 402212768471) captured with numeric IDs instead of names (`first_source="fb"`, `first_campaign="120232987483260558"`, etc.). Root cause: she clicked a since-DELETED Meta ad (id 120253458258350558) in "AK: Scaling | Leads" campaign whose URL params template used all-`{{...id}}` macros + `utm_source=fb`, `utm_medium=paid` (legacy). Meta continued delivering the ad briefly post-deletion. All 7 currently-visible ads in the campaign have correct standard template — verified via Graph API. NOT a code bug (git log confirms zero attribution mapping changes in session). User decision: log for reference, do not backfill (impact = 1 lead). Prevention: set `url_tags` at CAMPAIGN LEVEL in Meta Ads Manager (overrides all children). Full spec: /app/memory/CR-60_Legacy_Meta_Ad_URL_Template_Contamination.md

## CR-63/CR-64 — event_id & fbclid in Freshsales (FIXED + QA'd 2026-07-21, 10/10 tests passed, iteration_20.json)

## CR-65 — Demo status → "Follow Up for Scheduling" (IMPLEMENTED 2026-07-21)
- backend/.env: FRESHSALES_STATUS_DEMO_BOOKED_ID=402001331872, FRESHSALES_DEMO_BOOKED_TAG="Follow up for scheduling demo"
- Frontend labels updated: LeadsView.jsx, FunnelPanel.jsx (x2), CrossChannelPanel.jsx
- Zero code-logic change; Mongo enum "demo_scheduled" unchanged. GTM/Meta/Google tracking impact: ZERO (documented in CR-65 doc §3.5a)
- Owner pausing GTM demo_booked tags himself in GTM UI (no code)
- Verified: backend restart OK, env loaded, crm_sync maps new ID, UI screenshot shows new labels

## NEXT: CR-48 backfill (P1) — dry-run first, then live run per /app/memory/CR-48_Backfill_Wiped_CustomField.md
