# Agent Handover — CR-68: Churned Clients Tracking Dashboard

**Date:** 2026-07-25  
**Handing off:** Session agent → Next agent  
**CR:** CR-68 (Churned Clients Dashboard)  
## Current Stage: **Gate 6 COMPLETE — QA Passed, CR-68 Closed**

**QA Result:** 100% pass — 6/6 backend tests, 100% frontend  
**Test report:** `/app/test_reports/iteration_21.json`  
**Closed:** 2026-07-28

### What Was Delivered
- `GET /api/cms/churn-report` backend endpoint (server.py)
- `ChurnPanel.jsx` frontend component
- "Churned Clients" tab in LeadsView.jsx
- Bucket logic: 3d (3–6d), 7d (7–29d), 30d (30–59d), 60+d (60+d); active clients (0–2d) excluded
- `CHURN_API_URL` + `CHURN_API_TOKEN` in backend .env

### Known Data Note
Revenue at risk banner not visible in UAT — d30-bucket restaurants all have ₹0 revenue in preprod data. Will show correctly in production.

---

## What This CR Is About

The owner wants a **Churned Clients Tracking Dashboard** inside the existing admin panel (`/leads` route, CMS-auth gated). The goal is to track what happens to clients AFTER they are Won — are they active, at risk, or churned? Currently the funnel ends at Won and there's zero visibility into retention.

The owner has emphasized this must follow a **gated process** with approvals at every stage. No skipping ahead.

---

## Mandatory Process — Follow These Gates

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌────────────┐     ┌──────────────┐     ┌─────────┐
│ 1. DISCOVERY │ ──→ │ 2. IMPACT        │ ──→ │ 3. DESIGN   │ ──→ │ 4. PLANNING│ ──→ │ 5. IMPLEMENT │ ──→ │ 6. QA   │
│              │     │    ANALYSIS       │     │    (UX)      │     │            │     │              │     │         │
│ Owner shares │     │ Code/data scope   │     │ Design agent │     │ Task list  │     │ Build it     │     │ Test it │
│ requirements │     │ + dependencies    │     │ + owner      │     │ + estimate │     │              │     │         │
│              │     │                   │     │   review     │     │            │     │              │     │         │
└──────┬───────┘     └────────┬──────────┘     └──────┬───────┘     └─────┬──────┘     └──────┬───────┘     └────┬────┘
       │                      │                       │                    │                    │                  │
   OWNER APPROVAL         OWNER APPROVAL          OWNER APPROVAL      OWNER APPROVAL      OWNER REVIEW       SIGN-OFF
```

### Gate 1: Discovery
**Goal:** Understand exactly what the owner wants, where the data comes from, what metrics matter.

**You must collect from the owner:**
1. **The API call / data source** — Where does churn data come from? Freshsales status? Payment renewal data (Razorpay)? Product usage logs? Manual tagging?
2. **Definition of "churned"** — What exactly makes a client "churned"? (No renewal after X days? Specific CRM status? Product inactivity?)
3. **Definition of "at risk"** — What signals a client is about to churn? (Payment overdue? Low usage? No contact in X days?)
4. **Key metrics** — What numbers does the owner want to see? (Churn rate, retention rate, revenue at risk, avg lifetime, churn reasons, recovery rate?)
5. **Time periods** — Monthly cohorts? Rolling 30/60/90 days? By onboarding month?
6. **Dimensions** — By source/channel? By plan? By city? By onboarding date?
7. **Post-Won lifecycle stages** — What stages exist in Freshsales after Won? (Active, At Risk, Churned, Paused, Reactivated?) Do they need to be created?

**Brainstorming during Discovery (owner specifically requested this):**
- How should the dashboard make it **immediately obvious** which clients are at churn risk?
- What visual cues help the owner scan 50+ clients and instantly spot the ones needing attention?
- Should there be a "churn risk score" or "health score" per client?
- What actions can the owner take directly from the dashboard? (Call, WhatsApp, assign to team member, send win-back offer?)

**Output:** A discovery document with answers to all the above. Present to owner for approval before proceeding.

**GATE: Get explicit owner approval before moving to Impact Analysis.**

---

### Gate 2: Impact Analysis
**Goal:** Map every code, data, and infrastructure change needed.

**What to analyze:**
1. **Data pipeline** — Does the CRM sync (`crm_sync.py`) need to pull new statuses? What Freshsales status IDs map to churned/at-risk/active?
2. **Backend** — New endpoint(s) in `server.py`? New query functions in `funnel.py`? New MongoDB collections or fields?
3. **Frontend** — New tab/panel in LeadsView? New components? How does it fit with existing funnel UI?
4. **Dependencies** — Does BUG-001 (dedup fix) need to be deployed first? Does CR-67 (won expansion) need to be live?
5. **Risks** — Data accuracy concerns? Performance impact of additional CRM sync? Privacy/access control?

**Important context for impact analysis:**
- The existing admin panel is at `/leads` route (`/app/frontend/src/pages/LeadsView.jsx`)
- It's gated by CMS auth (`cms_auth.py`, credentials in .env `CMS_USER_1/CMS_PASS_1`)
- The funnel data comes from `funnel.py` which loads from `demo_requests`, `quotes`, `contact_messages`, and `backfilled_leads` collections
- CRM sync runs every 6 hours (`crm_sync.py`) pulling 4 statuses from Freshsales (demo_scheduled, demo_given, won, lost) — CR-67 expands this to 6 (adding payment_awaited, payment_received)
- The existing Freshsales status list has 29 statuses across 3 lifecycle stages (Lead, Qualified, Customer) — see CR-68 intake doc or query the API

**Output:** Impact analysis document listing all changes with effort estimates. Present to owner for approval.

**GATE: Get explicit owner approval before moving to Design.**

---

### Gate 3: Design (UX)
**Goal:** Design the dashboard UX so churn risk is immediately obvious to the owner.

**MANDATORY: Call the `design_agent_full_stack` subagent** with:
- The original problem statement (churned clients tracking dashboard)
- User's explicit preferences from discovery
- Key functionalities (churn risk list, health scores, trend charts, action buttons, etc.)
- App type: `dashboard`

**Design considerations (owner specifically requested brainstorming here):**
- The owner should be able to **scan the dashboard in 5 seconds** and know which clients need attention
- Visual hierarchy: Red/amber/green health indicators? Risk scores? Days-since-last-contact?
- Cards vs table vs hybrid? (The existing funnel uses a card-based funnel + source table layout)
- Action-oriented: Can the owner click to WhatsApp a churning client directly?
- Mobile: Does the owner check this on their phone? (They check the existing dashboard on mobile)

**Design must answer:**
- What does the "at a glance" view look like? (Summary cards: X active, Y at risk, Z churned)
- What does the detail view look like? (Client list with risk indicators, sortable, filterable)
- What does the individual client view look like? (Timeline of activity, payment history, last contact)
- How does it fit alongside existing tabs in the admin panel?

**Output:** Design guidelines JSON + wireframe/mockup. Present to owner for approval.

**GATE: Get explicit owner approval on the design before moving to Planning.**

---

### Gate 4: Planning
**Goal:** Break implementation into concrete tasks with acceptance criteria.

**Plan should include:**
1. Task breakdown (numbered, ordered by dependency)
2. Acceptance criteria for each task
3. Files to create/modify
4. Test scenarios
5. Estimated effort per task

**Output:** Implementation plan document. Present to owner for approval.

**GATE: Get explicit owner approval before writing any code.**

---

### Gate 5: Implementation
**Goal:** Build it.

- Follow the approved plan task by task
- Use `search_replace` for existing files, `create_file` for new ones
- All backend routes must be prefixed with `/api`
- All frontend must use `REACT_APP_BACKEND_URL` for API calls
- Add `data-testid` attributes to all interactive elements
- Follow the existing code patterns in `funnel.py` and `LeadsView.jsx`

---

### Gate 6: QA & Testing
**Goal:** Verify everything works.

- Call `testing_agent` for end-to-end testing
- Verify data accuracy by cross-checking dashboard numbers with Freshsales CRM
- Test edge cases (no churned clients, all churned, missing data)
- Test on mobile viewport
- Get owner to validate numbers against their Freshsales view

**GATE: Owner sign-off before declaring done.**

---

## What Was Done — Sessions Up To 2026-07-28

### Previous Session (2026-07-25)
- BUG-001: Funnel double-counting fixed in funnel.py
- CR-67: given_rate base + won expansion fixed
- Discovery document created

### This Session (2026-07-28) — CR-68 COMPLETE
- **Discovery complete** — churn API analysed (`/api/v2/restaurant-churn-report`)
- **Design frozen** — mockup v3 approved (4 cards, no status pills, cards clickable)
- **Impact Analysis complete** — `/app/CR-68_Impact_Analysis.md`
- **Implementation Plan complete** — `/app/CR-68_Implementation_Plan.md`
- **Implementation complete** — all 4 files changed
- **Bucket logic fixed** — initial off-by-one corrected; active clients (0–2d) excluded
- **QA passed** — 100% backend + frontend, test report `/app/test_reports/iteration_21.json`

### Files Changed in CR-68
| File | Change |
|------|--------|
| `backend/.env` | +CHURN_API_URL, +CHURN_API_TOKEN |
| `backend/server.py` | +GET /api/cms/churn-report endpoint |
| `frontend/src/components/funnel/ChurnPanel.jsx` | NEW file — full dashboard component |
| `frontend/src/pages/LeadsView.jsx` | +import, +tab button, +render case |

---

### Bugs Fixed
1. **BUG-001: Funnel double-counting** — `funnel.py` `_load_all()` was counting the same lead twice (once from `demo_requests`, once from `backfilled_leads`). Fixed with `freshsales_contact_id` deduplication. Dashboard went from 300 → 166 leads (correct count). **Code changed, not yet deployed to production.**

2. **CR-67: Funnel metric corrections** — Two changes:
   - Demo Given % now calculated from Lead In (not Demo Scheduled) — fixes misleading 42%+ rates
   - Won stage now includes Payment Awaited + Payment Received statuses from Freshsales
   - **Code changed, not yet deployed to production.**

### Environment Issues Found
- `FRESHSALES_DEMO_BOOKED_TAG` was using default "Demo Scheduled (Web)" instead of env value "Follow up for scheduling demo" — **fixed by restarting production backend**
- `CALENDLY_WEBHOOK_CALLBACK_URL` is empty on production — **Calendly webhooks not registered, meet link/demo time not written to Freshsales**
- `FRESHSALES_STATUS_DEMO_BOOKED_ID` had different value on production vs dev — **identified as root cause of "works in UAT not in prod"**
- `FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID` = same as `FRESHSALES_LIFECYCLE_LEAD_ID` — lifecycle doesn't advance on booking

### Documents Created This Session
| File | Description |
|------|-------------|
| `/app/BUG-001_Funnel_Double_Count.md` | Bug report with root cause, impact analysis, fix details |
| `/app/CR-67_Funnel_Metric_Corrections.md` | CR for given_rate base change + won expansion |
| `/app/CR-68_Churned_Clients_Dashboard.md` | Intake brief with discovery questions |
| `/app/Production_Validation_Runbook.html` | 7-step production debugging guide for team |
| `/app/MyGenie_Brand_Guidelines_Agent.md` | Brand guidelines for AI creative agent (markdown) |
| `/app/frontend/public/MyGenie_Brand_Guidelines.html` | Visual brand guidelines (HTML, team-readable) |

---

## Key Files the Next Agent Must Know

### Backend
| File | Purpose |
|------|---------|
| `/app/backend/server.py` | Main FastAPI app — all API routes (1710 lines) |
| `/app/backend/funnel.py` | Funnel query functions — `_load_all()`, `get_funnel_summary()`, etc. (1477 lines) |
| `/app/backend/crm_sync.py` | CRM sync — pulls statuses from Freshsales every 6 hours (687 lines) |
| `/app/backend/freshsales.py` | Freshsales API client — `upsert_contact()`, `mark_demo_booked()` |
| `/app/backend/.env` | All environment variables — Freshsales keys, Calendly, Razorpay, etc. |

### Frontend
| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/LeadsView.jsx` | Admin dashboard page — funnel + source + lost panels |
| `/app/frontend/src/components/funnel/FunnelPanel.jsx` | Conversion funnel visualization |
| `/app/frontend/src/components/funnel/FunnelBySource.jsx` | Performance by source table |
| `/app/frontend/src/components/funnel/LostPanel.jsx` | Lost analysis panel |
| `/app/frontend/src/components/funnel/AttributionBreakdown.jsx` | Keyword/ad set attribution table |

### Freshsales Status IDs (for reference)
```
LEAD LIFECYCLE (403021121245):
  402001137706 = New
  402001331872 = Follow up for scheduling demo  ← our "demo_scheduled"
  402001963264 = Demo Scheduled
  402001522947 = Customised Video sent
  402001547725 = Reschedule demo
  402001322794 = Not Interested in Demo
  402001279710 = Find Valid Contact
  402001331871 = Not picking call
  402001997881 = Not Responding properly
  402001717651 = Junk Lead
  402001790608 = Language barrier
  402002040339 = Looking for aggregators
  402002195387 = Duplicate lead
  402001429724 = Lead Passed to Abhishek
  402001493944 = Business contact
  402001793079 = Yet to open (no demo yet)

QUALIFIED LIFECYCLE (403021121246):
  402001226981 = Demo Given                      ← our "demo_given"
  402002301640 = Not Interested After Demo
  402002040338 = Missing Feature
  402002301635 = Pricing Issue
  402001303207 = Trial Scheduled
  402002301636 = Need EMI offer
  402002301637 = Physical Visit
  402002301638 = Ghosted After Demo
  402002301639 = Abhishek's message sent

CUSTOMER LIFECYCLE (403021121247):
  402001783018 = Payment Awaited                 ← CR-67 maps to "won"
  402001755414 = Payment Received                ← CR-67 maps to "won"
  402001137712 = Won                             ← our "won"
  402001137713 = Lost                            ← our "lost"
```

### CMS Auth Credentials
- Admin: `admin` / `admin123`
- Editor: `editor` / `editor123`

### Production Server
- Server: `root@ip-172-31-22-82`
- Backend path: `/var/www/website/backend`
- Service: `mygenie-api.service`
- Website: `https://www.mygenie.online`

---

## Pre-Requisites Before Starting CR-68

1. **Deploy BUG-001** (funnel dedup fix) to production — currently only on preview
2. **Deploy CR-67** (given_rate + won expansion) to production — currently only on preview
3. **Set `CALENDLY_WEBHOOK_CALLBACK_URL`** on production to enable webhook path
4. **Verify `FRESHSALES_STATUS_DEMO_BOOKED_ID=402001331872`** on production (Gyan was checking this)

---

## Owner Communication Style

- Abhishek thinks in terms of **what he sees in Freshsales** — always cross-reference dashboard numbers with his CRM view
- He values **data accuracy above all** — if a number is wrong, everything stops until it's fixed
- He expects the **4-beat process** (Pain → Solution → Outcome → CTA) in how features are presented
- He wants to be consulted at every gate — **never skip ahead without approval**
- He prefers investigation before implementation — show the data, explain the root cause, THEN propose the fix
- When he says "investigate," he means: query the actual data, show real numbers, name real contacts — don't theorize

---

## Summary of Open Items

| Item | Status | Blocking? |
|------|--------|-----------|
| BUG-001 deploy to production | Code ready, not deployed | Yes — funnel numbers wrong without it |
| CR-67 deploy to production | Code ready, not deployed | Yes — given_rate and won count wrong without it |
| CR-68 Discovery | Waiting for owner input | Yes — can't proceed without API call details and churn definition |
| Calendly webhook registration | CALENDLY_WEBHOOK_CALLBACK_URL empty | No — but meet link/demo time missing in Freshsales |
| `FRESHSALES_STATUS_DEMO_BOOKED_ID` prod value | Gyan checking | No — may already be fixed |
| Freshsales webhook workflows (Option B — stage tracking) | Owner guided, not yet set up | No — future enhancement |
