# MyGenie POS — Product Requirements Document

## Project Overview
Full-stack marketing website + CRM operations platform for MyGenie POS — a hospitality point-of-sale system targeting restaurants, cafes, resorts, hotel chains across India.

**Live production:** https://www.mygenie.online
**Stack:** React 19 (CRACO) + FastAPI + MongoDB + Freshsales CRM + Razorpay + AWS S3
**GTM Container:** GTM-K5D84Z3L | GA4: G-KWHHFEZ5Q3 | Meta: 2862017797322752

---

## Architecture

### Backend
- FastAPI on port 8001, MongoDB via `MONGO_URL`
- Key modules: `server.py`, `freshsales.py`, `leads.py`, `funnel.py`, `crm_sync.py`, `ads_mcp.py`, `recommendations.py`, `payments.py`, `otp.py`, `antijunk.py`, `cms_auth.py`, `storage.py`
- Freshsales CRM integration for lead management
- Meta Graph API v21.0 + Google Ads GAQL for ad intelligence
- Claude Sonnet via Emergent LLM key for AI insights

### Frontend
- React 19 + CRACO, Tailwind CSS, Framer Motion
- CMS via `?admin=1` — 153+ inline editors across all pages
- Radix UI components, Recharts for data viz, Sonner for toasts

---

## What's Been Implemented (all CRs through CR-28)

| CR | What | Status |
|---|---|---|
| CR-1 | Forms + Freshsales CRM Integration | G4 ✅ |
| CR-2 | UTM Attribution (first/last touch, geo, gclid/fbclid) | G4 ✅ |
| CR-3A | GTM dataLayer (GA4 + Meta Pixel + Google Ads) | G4 ✅ |
| CR-3B | Consent Mode v2 + Enhanced Conversions | G4 ✅ |
| CR-4 | Anti-junk (honeypot/rate-limit) + OTP SMS | G4 ✅ |
| CR-5 | Solutions/Product overview pages | G4 ✅ |
| CR-6 | CMS inline editing Phase 1-2d (153 editors) | G4 ✅ |
| CR-7 | Internal Leads View (/leads) | G4 ✅ |
| CR-8 | Annual-only pricing model | ✅ |
| CR-9 | GST cart display | G3 ✅ |
| CR-10 | Razorpay Online Payment | G3 (blocked on keys) |
| CR-11 | Plan Differentiation Showcase | ✅ |
| CR-14 | Honeypot autofill bug fix | G4 ✅ |
| CR-16 | Video autoplay fix | G4 ✅ |
| CR-17 | S3 media storage | G3 ✅ |
| CR-19 | Lead funnel + ad spend dashboard | G2 ✅ |
| CR-20 | Petpooja Alternative landing page | G4 ✅ |
| CR-21 | Mobile Conversion Stack (A+B+C+E) | G3 ✅ |
| CR-24 A-H | Ads Intelligence Platform (all phases) | COMPLETE ✅ |
| CR-25 | 5 new attribution fields + cf_demo_fixed bug fix | COMPLETE ✅ (27 Jun) |
| CR-26 | Source sync overhaul + delete button + hardcoding removal | COMPLETE ✅ (27 Jun) |
| CR-27 | Phase G: 3-level attribution stitching | COMPLETE ✅ (27 Jun) |
| CR-28 | gclid fix + "New" badge + cross-channel comparison | COMPLETE ✅ (27 Jun) |

---

## Current Session — 27 June 2026

### What was done
- Pulled code from GitHub `Abhi-mygenie/website.git` into `/app`
- Preserved `.emergent` and `.git` folders
- Installed backend/frontend dependencies (resolved litellm pip conflict)
- Created minimal `.env` files with platform defaults (MONGO_URL, DB_NAME, REACT_APP_BACKEND_URL)
- Backend and frontend are running and accessible on preview URL

### Status
- ✅ Backend: FastAPI running on port 8001, API responding
- ✅ Frontend: React app compiled and serving on port 3000
- ⚠️ `.env` files have only platform defaults — user will fill in full credentials

---

## Next Tasks (Priority Order)

### P0 — Immediate
1. **User fills .env files** with full credentials (Freshsales, Meta, Google Ads, Razorpay, SMS, S3, CMS creds)
2. **CR-12 Pricing expansion** (blocked on owner confirmations for Hotels/Custom plans)
3. **CR-10 Razorpay payment** (blocked on Razorpay keys)

### P1 — Next Sprint
4. Strategy Lab persistence — save hypotheses to MongoDB
5. Budget Reallocation Advisor — auto-suggest spend shifts
6. Weekly Slack/email digest — automated CPL/Won summary
7. Blog per-article CRUD — full post management

### P2 — Backlog
8. CR-13: Post-payment onboarding
9. CR-15: Zapier Offline Conversions
10. CR-22: Freshsales webhook payload parser fix
11. CR-23: Calendly → Meet Link → Freshsales

---

## Key Documents
| Document | Path |
|---|---|
| CR Control Dashboard | `/app/CR_Control_Dashboard.md` |
| Project Docs Index | `/app/PROJECT_DOCS_INDEX.md` |
| Handover (latest) | `/app/memory/HANDOVER_NEXT_AGENT.md` |
| Handover (root) | `/app/HANDOVER_NEXT_AGENT.md` |
| Handover (original) | `/app/HANDOVER.md` |
| Field Contract v2.1 | `/app/Freshsales_Field_Contract_v2.md` |

---

*Updated by E1, Emergent Labs. 27 June 2026.*
