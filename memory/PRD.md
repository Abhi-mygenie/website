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

## Setup Done (2026-07-14)
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

### Next step
- USER ACTION: push preview → production via "Save to GitHub" (all Batch C fixes are preview-only until then).
- CR-58 registered (BACKLOG, user said "later"): capture pathname in handleDemoCtaClick into latest_source — spec in /app/memory/CR-58_CTA_Click_Pathname_LatestSource.md.

## CR-59 — Prod Calendly webhook hijack (FIXED 2026-07-14)
Preview fork's CR-40 startup sync deleted prod's Calendly webhook subscription on 2026-07-13 → 9 bookings lost Demo Time/Meeting Link in Freshsales. Fixed: prod webhook re-registered to https://mygenie.online/api/calendly/webhook (verified live), preview .env callback blanked, code guard added (refuses preview.emergentagent.com URLs — needs GitHub push to reach prod repo), 8/9 leads backfilled into live Freshsales (1 = owner's deleted test contact). Tests: iteration_19.json 100% pass. Full spec: /app/memory/CR-59_Preview_Calendly_Webhook_Hijack.md
