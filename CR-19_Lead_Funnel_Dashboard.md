# CR-19 — G2 Implementation Planning (Complete)

> **Status:** G2 ✅ Implementation Planning complete. Ready for G3 Build.
> **Date:** 2026-06-23
> **For:** Implementation agent — read this + the Handover doc `CR-19_Implementation_Handover.md`
> **Mockup:** `/app/frontend/public/CR-19_Mockup.html` (live at `/CR-19_Mockup.html`)

---

## 1. Confirmed Data (from live Freshsales API)

### 1.1 Contact Status IDs

| Status | ID | Lifecycle | Used in funnel |
|---|---|---|---|
| New | `402001137706` | Lead | No (existing) |
| Demo Scheduled | `402001963264` | Lead | Stage 3 ✅ |
| Demo Given | `402001226981` | Qualified | Stage 4 |
| Won | `402001137712` | Customer | Stage 5 |
| Lost | `402001137713` | Customer | Stage 6 (negative) |
| Junk Lead | `402001717651` | Lead | Exclude from funnel |

> **Confirmed:** Demo Scheduled ID `402001963264` is the same for both website Calendly path
> and CRM-side manual scheduling. Single signal covers both paths. ✅

### 1.2 Lifecycle Stage IDs

| Label | ID |
|---|---|
| Lead | `403021121245` |
| Qualified | `403021121246` |
| Customer | `403021121247` |

### 1.3 Lost Reason IDs

| ID | Label |
|---|---|
| `403021121249` | Not able to reach |
| `403021121250` | Not interested |
| `403021121251` | Budget |
| `403021121252` | Lost to competitor |
| `403025076872` | Small Set up |
| `403025076881` | Personal reasons |
| `403025081184` | Hotel only / small restaurant |
| `403025085248` | Already using POS |
| `403038210055` | Multiple Aggregator |

### 1.4 Historical Contact Counts (Freshsales, all time)

| Stage | Count | Backfill pages (100/page) |
|---|---|---|
| Demo Scheduled | 36 | 1 |
| Demo Given | 167 | 2 |
| Won | 132 | 2 |
| Lost | 162 | 2 |
| **Total to backfill** | **497** | **7 pages max** |

> **Key finding:** Historical contacts have `first_source = null` and `cf_latitude = null`.
> The old live website did NOT send attribution fields (first_source, utm, gclid, fbclid) to
> Freshsales. Filtering backfill by "paid sources only" is therefore NOT POSSIBLE — there is
> no paid-source signal on old contacts.
>
> **Decision:** Backfill ALL 497 contacts across stages 3–6. Volume is small (7 API pages),
> no complex batching needed. Historical contacts will appear in the funnel under source
> "Legacy (pre-launch)" since attribution is empty.

---

## 2. Environment Variables to Add

Add these to `/app/backend/.env`. Do NOT remove any existing key.

```
FRESHSALES_STATUS_DEMO_GIVEN_ID=402001226981
FRESHSALES_STATUS_WON_ID=402001137712
FRESHSALES_STATUS_LOST_ID=402001137713
CRM_SYNC_ENABLED=true
```

---

## 3. New Files to Create

```
/app/backend/crm_sync.py      ← sync + backfill logic
/app/backend/funnel.py        ← aggregation queries (read-only)
/app/frontend/src/components/funnel/FunnelPanel.jsx
/app/frontend/src/components/funnel/FunnelBySource.jsx
/app/frontend/src/components/funnel/LostPanel.jsx
/app/frontend/src/components/funnel/SyncStatus.jsx
```

---

## 4. Existing Files to Modify

```
/app/backend/server.py          ← add scheduler, 5 new endpoints, new imports
/app/backend/leads.py           ← add crm_status fields to row output + new filter
/app/backend/freshsales.py      ← add 2 new read methods
/app/backend/requirements.txt   ← add apscheduler
/app/backend/.env               ← add 4 new env vars
/app/frontend/src/pages/LeadsView.jsx  ← import + mount funnel panels, Stage column, Lost filter
```

---

## 5. Backend — `crm_sync.py` (Complete Spec)

### Constants (read from env at module load)
```python
DEMO_SCHEDULED_ID = int(os.environ.get("FRESHSALES_STATUS_DEMO_BOOKED_ID", 0))  # existing
DEMO_GIVEN_ID     = int(os.environ.get("FRESHSALES_STATUS_DEMO_GIVEN_ID", 0))
WON_ID            = int(os.environ.get("FRESHSALES_STATUS_WON_ID", 0))
LOST_ID           = int(os.environ.get("FRESHSALES_STATUS_LOST_ID", 0))
SYNC_ENABLED      = os.environ.get("CRM_SYNC_ENABLED", "true").lower() == "true"

STAGE_STATUS_IDS = {
    "demo_scheduled": DEMO_SCHEDULED_ID,
    "demo_given":     DEMO_GIVEN_ID,
    "won":            WON_ID,
    "lost":           LOST_ID,
}

LOST_REASON_MAP = {
    403021121249: "Not able to reach",
    403021121250: "Not interested",
    403021121251: "Budget",
    403021121252: "Lost to competitor",
    403025076872: "Small Set up",
    403025076881: "Personal reasons",
    403025081184: "Hotel only / small restaurant",
    403025085248: "Already using POS",
    403038210055: "Multiple Aggregator",
}
```

### `run_sync(db)` — main sync job
```python
async def run_sync(db) -> dict:
    """Pull all contacts at funnel stages 3-6 from Freshsales. Update MongoDB.
    Returns summary dict: {fetched, matched, unmatched, errors, duration_s}
    Never raises — all exceptions caught and logged."""

    if not SYNC_ENABLED:
        return {"skipped": True}

    started = datetime.now(timezone.utc)
    stats = {"fetched": 0, "matched": 0, "unmatched": 0, "errors": 0}

    for crm_status, status_id in STAGE_STATUS_IDS.items():
        if not status_id:
            continue
        page = 1
        while True:
            try:
                resp = await freshsales.get_contacts_by_status(status_id, page)
            except Exception as e:
                logger.error("crm_sync fetch error stage=%s page=%d: %s", crm_status, page, e)
                stats["errors"] += 1
                break

            contacts = resp.get("contacts") or []
            if not contacts:
                break

            for contact in contacts:
                stats["fetched"] += 1
                contact_id = contact.get("id")
                lost_reason_id = contact.get("lost_reason_id")
                lost_reason = LOST_REASON_MAP.get(lost_reason_id) if lost_reason_id else None
                lifecycle = _lifecycle_label(contact.get("lifecycle_stage_id"))

                matched = await _update_lead_stage(
                    db, contact_id, crm_status, lost_reason, lifecycle
                )
                if matched:
                    stats["matched"] += 1
                else:
                    # Not in MongoDB — create a backfilled_leads doc
                    await _upsert_backfilled(db, contact, crm_status, lost_reason, lifecycle)
                    stats["unmatched"] += 1

            if len(contacts) < 100:
                break
            page += 1
            await asyncio.sleep(1.5)  # rate limit guard: max ~40 req/min

    ended = datetime.now(timezone.utc)
    duration = (ended - started).total_seconds()
    log_entry = {**stats, "started_at": started.isoformat(),
                 "ended_at": ended.isoformat(), "duration_s": duration,
                 "trigger": "scheduled"}
    await db.crm_sync_log.insert_one(log_entry)
    logger.info("crm_sync complete: %s", stats)
    return stats
```

### `_update_lead_stage(db, contact_id, crm_status, lost_reason, lifecycle)` 
```python
async def _update_lead_stage(db, contact_id, crm_status, lost_reason, lifecycle) -> bool:
    """Update crm_status fields on any collection that has this freshsales_contact_id.
    Returns True if at least one doc was updated."""
    update = {"$set": {
        "crm_status": crm_status,
        "crm_status_updated_at": datetime.now(timezone.utc).isoformat(),
        "crm_lost_reason": lost_reason,
        "crm_lifecycle_stage": lifecycle,
    }}
    matched = 0
    for col in (db.demo_requests, db.quotes, db.contact_messages):
        result = await col.update_many({"freshsales_contact_id": contact_id}, update)
        matched += result.matched_count
    return matched > 0
```

### `_upsert_backfilled(db, contact, crm_status, lost_reason, lifecycle)`
```python
async def _upsert_backfilled(db, contact, crm_status, lost_reason, lifecycle):
    """Create or update a lightweight backfilled_leads doc for historical contacts."""
    contact_id = contact.get("id")
    name = f"{contact.get('first_name','') or ''} {contact.get('last_name','') or ''}".strip()
    cf = contact.get("custom_field") or {}
    doc = {
        "freshsales_contact_id": contact_id,
        "name": name,
        "phone": contact.get("mobile_number") or contact.get("work_number"),
        "email": (contact.get("emails") or [{}])[0].get("value"),
        "city": contact.get("city"),
        "first_source": contact.get("first_source"),
        "first_medium": contact.get("first_medium"),
        "first_campaign": contact.get("first_campaign"),
        "latest_source": contact.get("latest_source"),
        "latest_medium": contact.get("latest_medium"),
        "ad_set": cf.get("cf_est_name"),
        "fbclid": cf.get("cf_latitude"),
        "crm_status": crm_status,
        "crm_status_updated_at": datetime.now(timezone.utc).isoformat(),
        "crm_lost_reason": lost_reason,
        "crm_lifecycle_stage": lifecycle,
        "created_at": contact.get("created_at"),
        "backfilled": True,
        "backfill_source": "freshsales",
    }
    await db.backfilled_leads.update_one(
        {"freshsales_contact_id": contact_id},
        {"$set": doc},
        upsert=True,
    )
```

### `run_backfill(db)` — one-time historical sync (same logic as run_sync but logs separately)
```python
async def run_backfill(db) -> dict:
    """One-time backfill of all historical contacts at stages 3-6.
    Identical to run_sync but logs trigger='backfill'.
    Call once via POST /api/cms/sync/backfill (admin only)."""
    # Same logic as run_sync but log_entry["trigger"] = "backfill"
```

### `_lifecycle_label(stage_id)` helper
```python
def _lifecycle_label(stage_id):
    return {403021121245: "lead", 403021121246: "qualified", 403021121247: "customer"}.get(stage_id)
```

---

## 6. Backend — `funnel.py` (Complete Spec)

### `get_funnel_summary(db, date_from, date_to, lead_type, source)`

Queries all three lead collections + backfilled_leads. Returns:
```json
{
  "lead_in": 248,
  "otp_verified": 181,
  "demo_scheduled": 94,
  "demo_given": 61,
  "won": 31,
  "lost": 28,
  "rates": {
    "otp_rate": 73.0,
    "schedule_rate": 51.9,
    "given_rate": 64.9,
    "won_rate": 50.8,
    "lead_to_win": 12.5,
    "lost_rate": 11.3
  },
  "dropoff": {
    "after_lead": 27.0,
    "after_otp": 48.1,
    "after_schedule": 35.1,
    "after_given": 49.2
  }
}
```

**Logic:**
- `lead_in` = COUNT all docs in scope (date filter + type filter)
- `otp_verified` = COUNT where `otp_verified == True` (only on demo_requests; quote/contact always null)
- `demo_scheduled` = COUNT where `crm_status IN ('demo_scheduled', 'demo_given', 'won', 'lost')` — any contact that reached or passed this stage
- `demo_given` = COUNT where `crm_status IN ('demo_given', 'won', 'lost')`
- `won` = COUNT where `crm_status == 'won'`
- `lost` = COUNT where `crm_status == 'lost'` (separate, not part of positive funnel)
- Backfilled leads included in all counts where applicable

**Source filter logic:**
```python
def _source_label(doc):
    a = doc.get("attribution") or {}
    src = (a.get("first_utm_source") or doc.get("first_source") or "").lower()
    gclid = a.get("gclid") or doc.get("fbclid") # fbclid here is cf_latitude value in backfilled
    fbclid = a.get("fbclid")
    if gclid and "google" in (src or "google"):
        return "google_paid"
    if fbclid or "facebook" in src or "meta" in src or "fb" in src:
        return "meta"
    if "google" in src:
        return "organic"
    if src and src not in ("", "direct", "(direct)"):
        return "other"
    if doc.get("backfilled"):
        return "legacy"
    return "direct"
```

### `get_funnel_by_source(db, date_from, date_to, lead_type)`
Returns array of source rows:
```json
[
  {
    "source": "google_paid",
    "label": "Google Paid",
    "lead_in": 92, "otp_verified": 74, "demo_scheduled": 42,
    "demo_given": 30, "won": 17, "lost": 8,
    "lead_to_win_pct": 18.5
  },
  ...
]
```

### `get_lost_breakdown(db, date_from, date_to)`
Returns:
```json
{
  "total_lost": 28,
  "avg_days_to_lost": 6.2,
  "reasons": [
    {"reason": "Price too high", "count": 13, "pct": 46.4},
    {"reason": "No show", "count": 7, "pct": 25.0},
    ...
  ]
}
```

### `get_sync_status(db)`
Returns:
```json
{
  "last_sync_at": "2026-06-23T09:14:00Z",
  "last_sync_trigger": "scheduled",
  "contacts_updated": 94,
  "errors": 0,
  "sync_enabled": true
}
```

---

## 7. Backend — `freshsales.py` New Methods (Complete Spec)

### `get_contacts_by_status(status_id, page=1)`
```python
async def get_contacts_by_status(status_id: int, page: int = 1) -> dict:
    """POST /filtered_search/contact filtered by contact_status_id.
    Returns {"contacts": [...], "meta": {"total": N}}
    Raises on HTTP error (caller handles retry/backoff)."""
    payload = {
        "filter_rule": [
            {"attribute": "contact_status_id", "operator": "is_in", "value": [str(status_id)]}
        ],
        "page": page,
        "per_page": 100,
        "sort": "created_at",
        "sort_type": "asc",
    }
    # Use existing _post() pattern from freshsales.py
    # Include: id, first_name, last_name, mobile_number, work_number, emails,
    #          city, first_source, first_medium, first_campaign, latest_source,
    #          latest_medium, contact_status_id, lifecycle_stage_id,
    #          lost_reason_id, created_at, custom_field
```

### `get_contact_status(contact_id: int)` — Phase 2 only
```python
async def get_contact_status(contact_id: int) -> dict:
    """GET /contacts/{id} — returns status fields for webhook handler."""
    # Returns contact_status_id, lifecycle_stage_id, lost_reason_id
```

---

## 8. Backend — `server.py` Changes (Complete Spec)

### New imports (add at top, after existing imports)
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import crm_sync
import funnel as funnel_module
```

### Scheduler instance (add after `logger = ...`)
```python
_scheduler = AsyncIOScheduler(timezone="UTC")
```

### Updated startup event
```python
@app.on_event("startup")
async def ensure_indexes():
    # === EXISTING (do not change) ===
    await antijunk.ensure_indexes(db)
    await otp.ensure_indexes(db)
    await db.cms_content.create_index("key", unique=True)
    # === NEW: funnel indexes ===
    for col in (db.demo_requests, db.quotes, db.contact_messages):
        await col.create_index("freshsales_contact_id")
        await col.create_index("crm_status")
    await db.backfilled_leads.create_index("freshsales_contact_id", unique=True)
    await db.crm_sync_log.create_index("started_at")
    # === NEW: start scheduler ===
    _scheduler.add_job(
        lambda: asyncio.create_task(crm_sync.run_sync(db)),
        "interval", hours=6, id="crm_sync",
        next_run_time=datetime.now(timezone.utc)  # run once on startup
    )
    _scheduler.start()
```

### Updated shutdown event
```python
@app.on_event("shutdown")
async def shutdown_db_client():
    _scheduler.shutdown(wait=False)   # NEW
    client.close()                    # existing
```

### 5 New endpoints (add after existing `/api/cms/leads` endpoint)

```python
# ── Funnel summary ──────────────────────────────────────────────────────────
@api_router.get("/cms/funnel/summary")
async def cms_funnel_summary(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    type: str | None = None,
    source: str | None = None,
):
    return await funnel_module.get_funnel_summary(
        db, date_from=date_from, date_to=date_to, lead_type=type, source=source
    )


# ── Funnel by source ─────────────────────────────────────────────────────────
@api_router.get("/cms/funnel/by-source")
async def cms_funnel_by_source(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
    type: str | None = None,
):
    return await funnel_module.get_funnel_by_source(
        db, date_from=date_from, date_to=date_to, lead_type=type
    )


# ── Lost breakdown ───────────────────────────────────────────────────────────
@api_router.get("/cms/funnel/lost")
async def cms_funnel_lost(
    admin: str = Depends(cms_auth.get_current_admin),
    date_from: str | None = None,
    date_to: str | None = None,
):
    return await funnel_module.get_lost_breakdown(db, date_from=date_from, date_to=date_to)


# ── Sync status ──────────────────────────────────────────────────────────────
@api_router.get("/cms/sync/status")
async def cms_sync_status(admin: str = Depends(cms_auth.get_current_admin)):
    return await funnel_module.get_sync_status(db)


# ── Manual sync trigger ──────────────────────────────────────────────────────
@api_router.post("/cms/sync/trigger")
async def cms_sync_trigger(admin: str = Depends(cms_auth.get_current_admin)):
    asyncio.create_task(crm_sync.run_sync(db))
    return {"ok": True, "message": "Sync started in background"}


# ── One-time backfill (run once at go-live) ───────────────────────────────────
@api_router.post("/cms/sync/backfill")
async def cms_sync_backfill(admin: str = Depends(cms_auth.get_current_admin)):
    asyncio.create_task(crm_sync.run_backfill(db))
    return {"ok": True, "message": "Backfill started in background"}
```

---

## 9. Backend — `leads.py` Changes (Complete Spec)

### In `_normalise_demo(doc)` — add 2 fields to returned dict
```python
# Add after existing fields:
"crm_status":      doc.get("crm_status"),        # NEW
"crm_lost_reason": doc.get("crm_lost_reason"),   # NEW
```
Apply same addition to `_normalise_quote(doc)` and `_normalise_contact(doc)`.

### In `query_leads()` — add `stage` parameter
```python
async def query_leads(db, ..., stage: str | None = None, ...):
```
Apply stage filter in MongoDB query:
```python
if stage:
    q["crm_status"] = stage   # e.g. stage="lost", stage="won"
```

### In `server.py /api/cms/leads` endpoint — add `stage` param
```python
@api_router.get("/cms/leads")
async def cms_leads(
    ...existing params...,
    stage: str | None = None,   # NEW
):
    return await leads_view.query_leads(
        db, ..., stage=stage,   # NEW
    )
```

### In `query_leads()` summary section — add 4 counts
```python
# Add to existing summary dict (do NOT remove any existing key):
"demo_scheduled": await col.count_documents({**base_q, "crm_status": {"$in": ["demo_scheduled","demo_given","won","lost"]}}),
"demo_given":     await col.count_documents({**base_q, "crm_status": {"$in": ["demo_given","won","lost"]}}),
"won":            await col.count_documents({**base_q, "crm_status": "won"}),
"lost":           await col.count_documents({**base_q, "crm_status": "lost"}),
```

---

## 10. Frontend — Component Specs

### Directory structure
```
/app/frontend/src/components/funnel/
  FunnelPanel.jsx       ← 6-stage summary cards
  FunnelBySource.jsx    ← attribution breakdown table
  LostPanel.jsx         ← lost count + reasons
  SyncStatus.jsx        ← last sync time + trigger button
```

### `FunnelPanel.jsx`

Props: `{ data, loading }` where `data` = response from `/api/cms/funnel/summary`

Renders 6 stage cards in a horizontal flex row. Stage 6 (Lost) separated by a vertical divider.

Each stage card shows:
- Stage label (UPPERCASE, xs, tracking-widest)
- Count (text-3xl font-bold)
- Conversion rate from previous stage (xs, colour-coded)
- Drop-off % badge (red, xs)

Stage colours (from design_guidelines.json):
```
lead_in        → bg-slate-50    border-slate-200
otp_verified   → bg-blue-50     border-blue-200
demo_scheduled → bg-indigo-50   border-indigo-200
demo_given     → bg-violet-50   border-violet-200
won            → bg-emerald-50  border-emerald-200
lost           → bg-red-50      border-red-200  (separated with | divider)
```

Summary banner below cards:
- Overall Lead→Win % | Lead→Demo Scheduled % | Demo→Win % | Biggest drop-off stage

`data-testid` values:
```
funnel-card-lead-in
funnel-card-otp-verified
funnel-card-demo-scheduled
funnel-card-demo-given
funnel-card-won
funnel-card-lost
funnel-summary-banner
```

### `FunnelBySource.jsx`

Props: `{ data, loading }` where `data` = array from `/api/cms/funnel/by-source`

Dense table. Columns: Source | Lead In | OTP OK | Demo Sched. | Demo Given | Won | Lost | Lead→Win %

Rows: Google Paid / Meta / Organic / Direct / Legacy / Other

Won column has green background. Highest Lead→Win % gets emerald badge. Lowest gets slate badge.

`data-testid` values:
```
funnel-by-source-table
funnel-source-row-{source}      (e.g. funnel-source-row-google-paid)
```

### `LostPanel.jsx`

Props: `{ data, loading }` where `data` = response from `/api/cms/funnel/lost`

Grid: 1 col (Total Lost card) + 2 cols (reasons bar chart).
Reasons: horizontal bar per reason, showing count and %.
Use inline CSS widths (no Recharts needed — simple CSS bars are cleaner and lighter for this).

`data-testid` values:
```
lost-total-card
lost-reasons-panel
lost-reason-bar-{index}
```

### `SyncStatus.jsx`

Props: `{ data, onSync }` where `data` = response from `/api/cms/sync/status`

Single flex row (right-aligned):
- "Last sync: [relative time]" in text-xs text-slate-400
- "Sync now" ghost button (calls POST `/api/cms/sync/trigger`)
- Shows "Syncing…" spinner while in progress

`data-testid` values:
```
sync-status-text
sync-now-btn
```

---

## 11. Frontend — `LeadsView.jsx` Changes

### New state and fetching
```javascript
const [funnelData, setFunnelData] = useState(null);
const [funnelBySource, setFunnelBySource] = useState(null);
const [lostData, setLostData] = useState(null);
const [syncStatus, setSyncStatus] = useState(null);
const [funnelFilters, setFunnelFilters] = useState({
  date_from: "", date_to: "", source: "", type: ""
});

// Load all funnel data when authed
const loadFunnel = useCallback(async () => {
  const p = new URLSearchParams(funnelFilters);
  const [summary, bySource, lost, sync] = await Promise.all([
    fetch(`${API}/api/cms/funnel/summary?${p}`, { headers: authHeader }),
    fetch(`${API}/api/cms/funnel/by-source?${p}`, { headers: authHeader }),
    fetch(`${API}/api/cms/funnel/lost?${p}`, { headers: authHeader }),
    fetch(`${API}/api/cms/sync/status`, { headers: authHeader }),
  ]);
  setFunnelData(await summary.json());
  setFunnelBySource(await bySource.json());
  setLostData(await lost.json());
  setSyncStatus(await sync.json());
}, [token, authed, funnelFilters]);

useEffect(() => { if (authed) loadFunnel(); }, [authed, funnelFilters]);
```

### New filters state — add `stage` to existing filters
```javascript
const [filters, setFilters] = useState({
  type: "", verified: false, paid: false, city: "",
  date_from: "", date_to: "", q: "",
  stage: "",   // NEW — for Lost quick filter
});
```

### JSX additions (in render, after `<header>`)
```jsx
{/* NEW: Funnel filter bar */}
<FunnelFilterBar filters={funnelFilters} onChange={setFunnelFilters} />

{/* NEW: Funnel summary */}
<FunnelPanel data={funnelData} loading={!funnelData} />

{/* NEW: Funnel by source */}
<FunnelBySource data={funnelBySource} loading={!funnelBySource} />

{/* NEW: Lost panel + sync status */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <LostPanel data={lostData} loading={!lostData} />
  <div className="md:col-span-2 flex flex-col justify-end">
    <SyncStatus data={syncStatus} onSync={handleSyncNow} />
  </div>
</div>

{/* EXISTING: Summary chips (unchanged) */}
{/* EXISTING: Filter row (add Lost filter chip) */}
{/* EXISTING: Table (add Stage column) */}
```

### Stage column in table (additive — after Details column, before Created)
```jsx
<th className="px-4 py-3">Stage</th>
...
<td className="px-4 py-3">
  <StageBadge status={r.crm_status} />
</td>
```

### `StageBadge` inline component
```jsx
const STAGE_STYLE = {
  demo_scheduled: "bg-indigo-100 text-indigo-700",
  demo_given:     "bg-violet-100 text-violet-700",
  won:            "bg-emerald-100 text-emerald-700",
  lost:           "bg-red-100 text-red-600",
};
const STAGE_LABEL = {
  demo_scheduled: "Demo Scheduled",
  demo_given:     "Demo Given",
  won:            "Won",
  lost:           "Lost",
};
function StageBadge({ status }) {
  if (!status) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <span data-testid="lead-stage-badge"
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${STAGE_STYLE[status] || "bg-slate-100 text-slate-500"}`}>
      {STAGE_LABEL[status] || status}
    </span>
  );
}
```

### Lost quick-filter chip (additive — after existing "Paid source only" checkbox)
```jsx
<label className="inline-flex items-center gap-2 text-sm text-red-600 cursor-pointer">
  <input
    data-testid="leads-filter-lost"
    type="checkbox"
    checked={filters.stage === "lost"}
    onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.checked ? "lost" : "" }))}
  />
  Lost leads only
</label>
```

### CSV export — add new columns (additive only)
```javascript
const cols = ["created_at", "type", "intent", "name", "phone", "email", "city",
  "otp_verified", "paid", "source", "medium", "campaign", "summary",
  "freshsales_contact_id",
  "crm_status",       // NEW
  "crm_lost_reason",  // NEW
];
```

---

## 12. MongoDB Index Summary

All created in `ensure_indexes()` on startup. Additive only.

```python
# demo_requests
await db.demo_requests.create_index("freshsales_contact_id")
await db.demo_requests.create_index("crm_status")

# quotes
await db.quotes.create_index("freshsales_contact_id")
await db.quotes.create_index("crm_status")

# contact_messages
await db.contact_messages.create_index("freshsales_contact_id")
await db.contact_messages.create_index("crm_status")

# backfilled_leads
await db.backfilled_leads.create_index("freshsales_contact_id", unique=True)
await db.backfilled_leads.create_index("crm_status")
await db.backfilled_leads.create_index("backfilled")

# crm_sync_log — TTL: keep 30 days
await db.crm_sync_log.create_index("started_at", expireAfterSeconds=2592000)
```

---

## 13. API Contract Summary (for frontend ↔ backend)

### `GET /api/cms/funnel/summary`
Query params: `date_from`, `date_to`, `type` (demo/quote/contact), `source` (google_paid/meta/organic/direct)
Response: see §6 `get_funnel_summary` schema

### `GET /api/cms/funnel/by-source`
Query params: `date_from`, `date_to`, `type`
Response: array of source rows (see §6)

### `GET /api/cms/funnel/lost`
Query params: `date_from`, `date_to`
Response: see §6 `get_lost_breakdown` schema

### `GET /api/cms/sync/status`
No params.
Response: `{ last_sync_at, last_sync_trigger, contacts_updated, errors, sync_enabled }`

### `POST /api/cms/sync/trigger`
No body. Returns `{ ok: true, message: "Sync started in background" }`

### `POST /api/cms/sync/backfill`
No body. Returns `{ ok: true, message: "Backfill started in background" }`

All endpoints: JWT Bearer token required (`Authorization: Bearer <token>`).

---

## 14. Implementation Sequence (for agent)

```
Step 1: Add env vars to /app/backend/.env (4 new keys — §2)
Step 2: pip install apscheduler, update requirements.txt
Step 3: Create crm_sync.py (§5)
Step 4: Create funnel.py (§6)
Step 5: Update freshsales.py — add get_contacts_by_status() (§7)
Step 6: Update leads.py — additive changes only (§9)
Step 7: Update server.py — scheduler + 6 new endpoints + imports (§8)
Step 8: Restart backend: sudo supervisorctl restart backend
Step 9: Verify startup: curl /api/ and check logs for scheduler started
Step 10: Trigger manual sync: POST /api/cms/sync/trigger
Step 11: Verify sync wrote crm_status to a known demo doc in MongoDB
Step 12: Trigger backfill: POST /api/cms/sync/backfill
Step 13: Verify backfilled_leads collection has docs
Step 14: Verify /api/cms/funnel/summary returns non-zero data
Step 15: Create frontend components (§10) — FunnelPanel, FunnelBySource, LostPanel, SyncStatus
Step 16: Update LeadsView.jsx (§11) — import, mount, Stage column, Lost filter
Step 17: Verify /leads page renders all panels, existing table still works
Step 18: Run G4 QA checklist (§15)
```

---

## 15. G4 QA Checklist

```
Backend:
[ ] GET /api/cms/funnel/summary returns 200 with valid stage counts
[ ] GET /api/cms/funnel/by-source returns rows for at least one source
[ ] GET /api/cms/funnel/lost returns total + reasons list
[ ] GET /api/cms/sync/status returns last_sync_at
[ ] POST /api/cms/sync/trigger returns { ok: true } and sync runs in background
[ ] POST /api/cms/sync/backfill creates docs in backfilled_leads collection
[ ] crm_sync_log has at least one entry after sync
[ ] demo_requests docs with freshsales_contact_id get crm_status updated
[ ] Freshsales 429 handled gracefully — no crash, error logged
[ ] Scheduler fires every 6 hrs (check log after 6 hrs or set to 1 min for test)

Frontend:
[ ] /leads page loads without console errors
[ ] Funnel filter bar renders and Apply/Reset work
[ ] All 6 funnel stage cards show correct counts
[ ] "Stage" column shows correct badge in leads table
[ ] "Lost leads only" filter chip filters the table correctly
[ ] Funnel by source table renders all source rows
[ ] Lost panel shows total + reasons bars
[ ] "Sync now" button calls /api/cms/sync/trigger
[ ] CSV export includes crm_status + crm_lost_reason columns

Regression (CR-7 must be 100% intact):
[ ] Login / JWT auth still works
[ ] All existing summary chips show correct values
[ ] All existing filters (type, verified, paid, city, date, search) still work
[ ] Pagination still works
[ ] Export CSV of existing columns still works (cols 1-14 unchanged)
[ ] Freshsales CRM link still opens in new tab
```
