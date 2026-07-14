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
