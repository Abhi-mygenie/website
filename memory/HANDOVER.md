# Session Handover — MyGenie Website
**Date:** 2026-11-27 (updated end of session)  
**Sessions covered:** 25 Nov (deployment) + 27 Nov (bug fix + CR registration)

---

## Current State of the System

| Component | Status | Notes |
|-----------|--------|-------|
| Preview frontend | ✅ Running | Static server port 3000, CR-261 not yet built |
| Preview backend | ✅ Running | CR-260 fix applied, port 8001 |
| Calendly subscription | ✅ Active | UUID `5fb6bf30-...`, key `...74cd`, registered 27 Nov 08:21 UTC |
| Production (mygenie.online) | ⚠️ Old code | CR-260 fix NOT yet deployed — subscription may disable again by ~09:05 UTC 28 Nov |
| CRM sync (Freshsales) | ⚠️ Disabled | FRESHSALES_API_KEY not set |
| 203 missed bookings | ⚠️ Not recovered | 6 Nov–25 Nov, backfill script not yet built |

---

## Must Do — Before 09:05 UTC 28 Nov (URGENT)

### Deploy CR-260 to production
Production `mygenie.online` still has the OLD `server.py`. The Calendly subscription's retry window expires ~09:05 UTC 28 Nov. If the fix isn't deployed before then, the subscription disables again.

**Steps:**
```bash
# On production server
cp /app/backend/server.py /app/backend/server.py.bak.20261127

# Replace with fixed file (download from preview or use the zip)
# Download: https://mygenie-web--587byhb7.preview.emergentagent.com/server_cr260.zip

sudo supervisorctl restart backend
tail -20 /var/log/supervisor/backend.err.log
# Expect: "CR-40: Calendly webhook already active — no action needed"
```

**Confirm production signing key:**  
`CALENDLY_WEBHOOK_SIGNING_KEY` on production server must end in `...74cd` (64 chars).  
If different — subscription will reject again within 24h.

---

## CR-260 — Calendly Webhook Self-Recovery
**Status:** Implemented in preview. NOT yet on production.

### What was fixed (5 lines in server.py)
| Line | Fix |
|------|-----|
| 482 | Removed frozen module-level `CALENDLY_WEBHOOK_SIGNING_KEY` |
| 487 | Now reads `os.environ.get(...)` fresh at every request (Bug C) |
| 499 | Uses local `key` variable (Bug C) |
| 1679 | Deletion condition widened to include `disabled` state (Bug A) |
| 1683 | Log message updated to show subscription state |

### What this prevents going forward
- Disabled subscriptions no longer block re-registration (Bug A fixed)
- Server restart picks up new signing key immediately (Bug C fixed)
- Subscription self-heals on every backend restart

### Still pending
- **203 missed bookings** (6 Nov–25 Nov) — no backfill script yet. All 203 emails/names/meeting-times are in Calendly API. Build script per CR-260 spec.
- **Bug B** (signing key rotation detection) — deferred. Covered by Bug C in practice.

---

## CR-261 — Lead Form Unification + Asha Fields
**Status:** Registered + designed. Awaiting Abhishek approval.

### Why it matters
Asha (AI voice agent) calls leads within 60s of form submission. Today she has zero context for Petpooja page leads (shortForm — only 3 fields). CR-261 unifies all pages.

### The form after CR-261

**Tier 1 — Main form (6 elements, fires before Asha calls)**
1. Name (required)
2. Phone (required)
3. Email (required)
4. Restaurant/Business name (required — currently optional on Petpooja page)
5. "How long running?" — 3 chips: **Opening soon** / **Under 2 years** / **2+ years** *(merged from Business Status + Years in biz)*
6. "How do you bill today?" — 3 chips: **Manual** / **Billing Software** / **Not started**
   - Conditional: "Which software?" chips (Petpooja/Posist/Rista/DotPe/Other) if Software selected

**Tier 2 — Thank-you page (optional enrichment)**
- Outlet type (select)
- Number of outlets (4 chips: 1 / 2–3 / 4–10 / 10+)

### Freshsales CFs needed (Sales Ops must create before build)
| CF API name | Label | Type | Values |
|-------------|-------|------|--------|
| `cf_business_status` | Business Status | Dropdown | Running, Opening soon |
| `cf_outlet_count` | Number of Outlets | Dropdown | 1, 2-3, 4-10, 10+ |
| `cf_lead_page` | Lead Page | Text | auto-filled |

### Backend changes (after Freshsales CFs created + Abhishek approval)
- Add `business_status_years` field to `DemoRequestCreate` model
- Derive `cf_business_status` from it (`yet-to-open` → Opening soon, else → Running)
- Map `cf_outlet_count`, `cf_lead_page` in `create_demo_request`

### Frontend files to change
- `frontend/src/components/site/DemoForm.jsx`
- `frontend/src/components/site/DemoBottomSheet.jsx`
- `frontend/src/pages/PetpoojaAlternative.jsx` (remove `shortForm`, pre-select Software+Petpooja)
- `frontend/src/pages/ThankYou.jsx` (add Tier 2 enrichment card)
- `frontend/src/data/content.js` (add BILLING_TYPES, SOFTWARE_NAMES, OUTLET_COUNTS constants)

### Key design decisions (Rev 2)
- Business Status + Years in business merged into one 3-chip field (were duplicates: "Opening soon" = "Yet to open")
- Petpooja page: pre-select "Billing Software" + "Petpooja" chips (0 extra clicks for most visitors)
- Design spec: `design_guidelines.json` — white card, rounded-3xl, green chips, Clash Display headings
- All chip components: pure Tailwind, no new libraries, 42px min touch target, aria-checked

### Open questions for Abhishek
1. Approve Tier 1 / Tier 2 split as proposed?
2. Petpooja page adding chips — acceptable (6 fields) or keep 4 and use BottomSheet for Tier 2?
3. `cf_channel_manager_name` — text field currently; need proper date-time CF?
4. Release date: month-end (30 Nov) confirmed?

---

## Secrets Set This Session

| Key | Ends in / Notes |
|-----|----------------|
| EMERGENT_LLM_KEY | Managed by platform |
| SMS_API_KEY | Set |
| CMS_JWT_SECRET | Set |
| CALENDLY_API_TOKEN | Set |
| CALENDLY_WEBHOOK_SIGNING_KEY | `...74cd` (64 chars) — must match production |
| RECEIPT_EMAIL_API_KEY | Set |

---

## CMS Credentials
- `/leads` → `admin / admin123`
- Editor → `editor / editor123`

---

## Files Produced This Session

| File | Use |
|------|-----|
| `memory/CR-260.md` | Full Calendly fix spec |
| `memory/CR-261.md` | Lead form unification spec (rev 2) |
| `memory/brief_asha_lead_form.md` | Original Asha brief |
| `design_guidelines.json` | Two-tier form design + chip spec |
| `memory/server_cr260.py` | Fixed `server.py` (deploy to production) |
| `memory/server_cr260.zip` | Zipped (download link above) |
| `memory/server_production.py` | Production backup pre-fix |
| `memory/cr260_server.patch` | Git patch (alternative to full file replace) |
| `backend/tests/test_calendly_webhook_cr260.py` | 8 CR-260 tests |

---

## Next Session Checklist
- [ ] Confirm CR-260 deployed to production (check logs, no 401 errors)
- [ ] Confirm Calendly subscription still active (`python scripts/register_calendly_webhook.py --list`)
- [ ] Abhishek approves CR-261
- [ ] Sales Ops creates 3 Freshsales CFs
- [ ] Build CR-261 (5 files)
- [ ] Build backfill script for 203 missed bookings
- [ ] Add FRESHSALES_API_KEY to enable CRM sync
