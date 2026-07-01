# MyGenie POS Website — PRD

## Project Overview
MyGenie POS marketing + lead capture website.  
Stack: React 19 (CRA + craco) · FastAPI (Python 3.11) · MongoDB · Supervisor

**Repo:** https://github.com/Abhi-mygenie/website.git  **Branch:** 1-july

---

## Architecture

### Backend (/app/backend)
- `server.py` — FastAPI main app + all API routes (prefix `/api`)
- `freshsales.py` — Freshsales CRM client (lead upsert, demo booked)
- `cms_auth.py` — JWT-based 2-admin CMS auth (no DB users)
- `otp.py` — Phone OTP generation + verification (SMS panel)
- `payments.py` — Razorpay order/verify/webhook + GST PDF invoice
- `storage.py` — Local or S3 file storage
- `ad_spend.py` — CSV ad spend parser
- `ads_mcp.py` — Meta + Google Ads sync
- `crm_sync.py` — Freshsales → MongoDB backfill/sync
- `funnel.py` — Lead funnel analytics queries
- `recommendations.py` — AI-powered ads recommendations
- `antijunk.py` — Bot/honeypot detection + rate limiting
- `geo.py` — IP-based city lookup

### Frontend (/app/frontend)
- React 19 + React Router 7 + Tailwind + shadcn/ui
- CMS editor, Lead dashboard, Pricing, Demo booking, Payment flows

---

## What's Been Implemented (as of 2026-07-01)
- ✅ Repo pulled from GitHub (branch: 1-july) into /app
- ✅ Python backend dependencies installed (requirements.txt)
- ✅ Node frontend dependencies installed (yarn)
- ✅ Backend running on :8001 via supervisor (uvicorn hot-reload)
- ✅ Frontend running on :3000 via supervisor (yarn start)
- ✅ MongoDB running locally
- ✅ Website verified live at preview URL

---

## Required Environment Variables

### backend/.env (currently set — base values only)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
```

### All Variables to Configure (add to backend/.env)

#### CMS Admin Auth (REQUIRED to log into /cms)
```
CMS_JWT_SECRET=<long-random-secret>
CMS_USER_1=<admin-username>
CMS_PASS_1=<admin-password>
CMS_USER_2=<optional-second-admin>
CMS_PASS_2=<optional-second-password>
CMS_SESSION_HOURS=12
```

#### Freshsales CRM (REQUIRED for lead push to CRM)
```
FRESHSALES_API_KEY=<your-freshsales-api-key>
FRESHSALES_BASE_URL=https://<your-org>.myfreshworks.com/crm/sales/api
FRESHSALES_DEMO_BOOKED_TAG=Demo Scheduled (Web)
FRESHSALES_LIFECYCLE_LEAD_ID=<lifecycle-stage-id>
FRESHSALES_STATUS_NEW_ID=<status-id>
FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID=<lifecycle-stage-id>
FRESHSALES_STATUS_DEMO_BOOKED_ID=<status-id>
FRESHSALES_LIFECYCLE_CUSTOMER_ID=<lifecycle-stage-id>
FRESHSALES_STATUS_WON_ID=<status-id>
FRESHSALES_STATUS_PAYMENT_AWAITED=402001783018
FRESHSALES_TAG_DEMO_LEAD=Website Demo Lead
FRESHSALES_TAG_OTP_VERIFIED=OTP-Verified
FRESHSALES_TAG_OTP_UNVERIFIED=OTP-Unverified
FRESHSALES_TAG_BUY_ONLINE=Buy Online
FRESHSALES_TAG_QUOTE=Website Quote
FRESHSALES_TAG_CONTACT=Website Contact
FRESHSALES_TAG_MULTI_FORM=Multi-Form
FRESHSALES_LEAD_SOURCE_PAID_SEARCH=402001798783
FRESHSALES_LEAD_SOURCE_FACEBOOK_LEAD=402002468721
FRESHSALES_LEAD_SOURCE_SOCIAL_MEDIA=402001798785
FRESHSALES_LEAD_SOURCE_DISPLAY=402001798786
FRESHSALES_LEAD_SOURCE_EMAIL=402001798777
FRESHSALES_LEAD_SOURCE_REFERRAL=402001798781
FRESHSALES_LEAD_SOURCE_ORGANIC=402001798776
FRESHSALES_LEAD_SOURCE_WEB=402001798775
FRESHSALES_LEAD_SOURCE_DIRECT=402001798782
```

#### OTP / SMS Panel (REQUIRED for OTP verification on demo form)
```
OTP_SMS_ENABLED=false
SMS_BASE_URL=<your-sms-panel-url>
SMS_USERNAME=<sms-username>
SMS_API_KEY=<sms-api-key>
SMS_SENDER=HSEGNI
SMS_ROUTE=TRANS
SMS_TEMPLATE_ID=<dlt-template-id>
```

#### Razorpay Payments (REQUIRED for online payments)
```
RAZORPAY_KEY_ID=<rzp-key-id>
RAZORPAY_KEY_SECRET=<rzp-key-secret>
RAZORPAY_WEBHOOK_SECRET=<rzp-webhook-secret>
PAYMENT_CURRENCY=INR
```

#### GST Invoice (REQUIRED for PDF invoice generation)
```
GST_SELLER_NAME=<legal-entity-name>
GST_SELLER_GSTIN=<your-gstin>
GST_SELLER_ADDRESS=<full-address>
GST_INVOICE_PREFIX=MG_2026_27_JUNE
INVOICE_FOOTER_TEXT=For queries: support@mygenie.in  |  mygenie.in
```

#### Calendly Webhook (OPTIONAL — for auto demo-booked tagging)
```
CALENDLY_WEBHOOK_SIGNING_KEY=<calendly-signing-key>
```

#### Meta (Facebook) Ads (OPTIONAL — for ads sync in CMS dashboard)
```
META_ACCESS_TOKEN=<facebook-long-lived-token>
META_APP_ID=<meta-app-id>
META_APP_SECRET=<meta-app-secret>
```

#### Google Ads OAuth (OPTIONAL — for Google Ads sync)
```
GOOGLE_ADS_CLIENT_ID=<google-oauth-client-id>
GOOGLE_ADS_CLIENT_SECRET=<google-oauth-client-secret>
GOOGLE_ADS_CUSTOMER_ID=<google-ads-customer-id>
```

#### Storage (OPTIONAL — defaults to local disk)
```
STORAGE_BACKEND=local
# For S3:
# STORAGE_BACKEND=s3
# AWS_ACCESS_KEY_ID=<key>
# AWS_SECRET_ACCESS_KEY=<secret>
# AWS_S3_BUCKET=<bucket-name>
# AWS_S3_REGION=<region>
```

#### Misc
```
DEFAULT_COUNTRY=India
APP_URL=<your-production-url>
```

### frontend/.env (currently set — do not change)
```
REACT_APP_BACKEND_URL=https://mygenie-deploy-1.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

---

## Prioritized Backlog
- P0: Add env vars above before production deployment
- P1: Verify Freshsales integration end-to-end with real API key
- P1: Test OTP flow with SMS panel enabled
- P1: Test Razorpay payment + GST invoice flow
- P2: Configure S3 for production media storage
- P2: Set up Calendly webhook for demo booking automation
