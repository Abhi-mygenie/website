# BUG-001: Funnel Dashboard Double-Counts Leads

**Filed:** 2026-07-25  
**Priority:** P0 — All funnel metrics are inflated ~42%, breaking conversion rate accuracy and ad spend decisions  
**Status:** Open — Fix designed, pending implementation  
**Reporter:** Owner (Abhishek)  
**Component:** `backend/funnel.py` → `_load_all()`  

---

## Summary

The funnel dashboard counts the **same lead twice**: once from the website form collection (`demo_requests`/`quotes`) and again from the CRM-synced collection (`backfilled_leads`). Both collections share the same `freshsales_contact_id` for 126 out of 158 backfilled leads in the June 25–July 25 period.

**Dashboard shows 300 leads. Actual unique leads: ~174.**

---

## Root Cause

`funnel.py` → `_load_all()` (line 101–136) loads documents from four collections and concatenates them into a flat list without any deduplication:

```python
sources = [
    ("demo",       db.demo_requests),       # 138 docs
    ("quote",      db.quotes),              #   4 docs
    ("contact",    db.contact_messages),     #   0 docs
    ("backfilled", db.backfilled_leads),     # 158 docs  ← 126 are duplicates!
]
```

When a visitor submits a form on the website:
1. A doc is inserted into `demo_requests` with `freshsales_contact_id = X`
2. The 6-hourly CRM sync (`crm_sync.py`) pulls the same contact from Freshsales → inserts into `backfilled_leads` with the same `freshsales_contact_id = X`

Result: one real person appears as two rows in every funnel query.

---

## Impact Analysis

### Metrics Affected (June 25 – July 25, 2026)

| Metric | Current (inflated) | After dedup (correct) | Over-count |
|--------|-------------------|-----------------------|------------|
| **Lead In** | 300 | ~174 | +72% |
| **Demo Scheduled** | 129 | ~79 | +63% |
| **Demo Given** | 30 | ~25 | +20% |
| **Won** | 1 | 1 | 0% |
| **Lost** | 4 | 4 | 0% |

### Conversion Rates Affected

| Rate | Current | After dedup | Direction |
|------|---------|-------------|-----------|
| Lead → Demo Sched. | 43.1% | ~47.6% | ↑ better |
| Demo Sched. → Demo Given | 23.3% | ~31.6% | ↑ better |
| Lead → Win | 0.3% | ~0.6% | ↑ better |
| CPL (Meta ₹36,129 / 142 leads) | ₹254 | ₹254 / ~80 = **₹452** | ↑ worse (real cost) |

### By Source Breakdown

| Source | Current Lead In | After dedup | Duplicates removed |
|--------|----------------|-------------|-------------------|
| Meta | 142 | ~80 | ~62 |
| Google | 114 | ~60 | ~54 |
| Website | 30 | ~30 | ~0 (backfilled "website" are mostly unique) |
| Direct | 14 | ~4 | ~10 |

### Downstream Consumers (all affected)

| Endpoint | Frontend Component | Impact |
|----------|-------------------|--------|
| `GET /api/cms/funnel/summary` | `LeadsView.jsx` — Conversion Funnel | Lead In, Demo Sched, Demo Given all inflated |
| `GET /api/cms/funnel/by-source` | `LeadsView.jsx` — Performance by Source table | Per-source counts inflated, CPL deflated |
| `GET /api/cms/funnel/lost` | `LeadsView.jsx` — Lost panel | Lost counts inflated |
| `GET /api/cms/funnel/by-attribution` | `AttributionBreakdown.jsx`, `KeywordIntelTable.jsx`, `MetaCreativeTable.jsx` | Keyword/creative attribution inflated |
| `GET /api/cms/funnel/by-landing-page` | `LandingPagePanel.jsx` | Per-page counts inflated |
| `GET /api/cms/funnel/by-device` | `DeviceCityPanel.jsx` | Device breakdown inflated |

### What Is NOT Affected
- Raw lead capture (`POST /api/demo-request`, `/quote`, `/contact`) — works correctly
- Freshsales CRM data — correct (single contact per person)
- GTM/Meta/Google Ads event firing — correct
- MongoDB `demo_requests` collection — correct (no duplicates there)

---

## Data Observations

- 126 of 158 backfilled leads share a `freshsales_contact_id` with a `demo_requests` doc
- 90 of those 126 have matching `crm_status` in both collections
- 36 have mismatched `crm_status` (backfilled has newer CRM sync data)
- Only 1 backfilled lead has a MORE ADVANCED stage than the website version
- 32 backfilled leads are unique (not in any website collection) — these are pre-launch CRM contacts or leads from non-website sources (e.g., sales team manual entry)
- 9 demo_requests have no `freshsales_contact_id` (Freshsales was unreachable at creation time)

---

## Proposed Fix

**File:** `backend/funnel.py` → `_load_all()` (line 101–136)

**Approach:** Deduplicate by `freshsales_contact_id` after loading. Website collections (`demo_requests`, `quotes`, `contact_messages`) are loaded first and take priority. When a `backfilled_leads` doc has the same `freshsales_contact_id`, skip it. However, merge the `crm_status` from the backfilled version if it's more advanced (the CRM sync updates backfilled_leads every 6 hours with the latest Freshsales status).

**Changes:**
1. Track `seen_fs_ids` set as docs are loaded
2. For backfilled docs: skip if `freshsales_contact_id` already seen
3. For all docs: if backfilled has a more advanced `crm_status`, update the website doc's `crm_status`

**Risk:** Low — read-only function, no writes. Only affects dashboard display. All raw lead capture remains unchanged.

**Testing:**  
- Verify `GET /api/cms/funnel/summary` returns ~174 leads instead of ~300
- Verify per-source counts match Freshsales CRM contact counts
- Verify `crm_status` from CRM sync is preserved (demo_given, won, lost stages not lost)
- Verify backfilled-only leads (32) are still counted

---

## Related Issues

1. **`CALENDLY_WEBHOOK_CALLBACK_URL` is empty** — Calendly webhook not registered, meet link/demo time not written to Freshsales
2. **`FRESHSALES_LIFECYCLE_DEMO_BOOKED_ID` = same as `FRESHSALES_LIFECYCLE_LEAD_ID`** — Lifecycle stage doesn't advance on booking
3. **`FRESHSALES_DEMO_BOOKED_TAG`** — Was using default "Demo Scheduled (Web)" instead of env value "Follow up for scheduling demo" (fixed via restart)
