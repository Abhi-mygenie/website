# CR-67: Funnel Metric Corrections — Demo Given % Base + Won Stage Expansion

**Filed:** 2026-07-25  
**Priority:** P1 — Metrics are misleading; affects conversion rate reporting  
**Status:** Open — Ready for implementation  
**Reporter:** Owner (Abhishek)  
**Components:** `backend/funnel.py`, `backend/crm_sync.py`, `frontend/src/components/funnel/FunnelPanel.jsx`, `frontend/src/components/funnel/FunnelBySource.jsx`  

---

## Change 1: Demo Given % Should Be From Lead In, Not Demo Scheduled

### Current (wrong)
- Demo Given rate = `demo_given / demo_scheduled`
- Example: Meta shows 8 demo given / 34 demo scheduled = **23.5%**
- Label: "% of Sched."

### Correct
- Demo Given rate = `demo_given / lead_in`
- Example: Meta shows 8 demo given / 71 leads = **11.3%**
- Label: "% of leads"

### Why
The current rate can exceed 100% (Google shows 42.4%) because `demo_scheduled` counts are often smaller than `demo_given` counts due to backfill timing. Using `lead_in` as the denominator gives a true conversion rate from top-of-funnel.

### Files to Change

**Backend — `funnel.py`:**

| Function | Line | Current | Change to |
|----------|------|---------|-----------|
| `get_funnel_summary()` | 209 | `"given_rate": _pct(demo_given, demo_scheduled)` | `"given_rate": _pct(demo_given, lead_in)` |
| `get_funnel_by_source()` | 334 | `"given_rate": _pct(demo_given, demo_scheduled)` | `"given_rate": _pct(demo_given, lead_in)` |
| `get_funnel_by_attribution()` | 465 | `"given_rate": _pct(demo_given, demo_scheduled)` | `"given_rate": _pct(demo_given, lead_in)` |
| `get_funnel_by_landing_page()` | ~540 | same pattern | same fix |
| `get_funnel_by_device()` | ~580 | same pattern | same fix |

**Frontend — `FunnelPanel.jsx`:**

| Line | Current | Change to |
|------|---------|-----------|
| 82 | `rateLabel={\`${rates.given_rate ?? 0}% of Sched.\`}` | `rateLabel={\`${rates.given_rate ?? 0}% of leads\`}` |

**Frontend — `FunnelBySource.jsx`:**
- Line 98: percentage label already shows raw `given_rate` — no label change needed (value will be correct after backend fix)

---

## Change 2: Won Should Include Payment Awaited + Payment Received

### Current (wrong)
- Won only counts `crm_status = "won"` (Freshsales status ID `402001137712`)
- Misses contacts at "Payment Awaited" (`402001783018`) and "Payment Received" (`402001755414`)
- Dashboard shows Won = 1

### Correct
- Won should count contacts at ANY of these 3 statuses:
  - `won` (402001137712)
  - `payment_awaited` (402001783018) 
  - `payment_received` (402001755414)
- All 3 represent a successful conversion / commercial intent

### Files to Change

**Backend — `crm_sync.py`:**

Add 2 new status IDs to the sync config:

```python
# Current (line 20-31):
STAGE_STATUS_IDS = {
    "demo_scheduled": DEMO_SCHEDULED_ID,
    "demo_given":     DEMO_GIVEN_ID,
    "won":            WON_ID,
    "lost":           LOST_ID,
}

# New:
PAYMENT_AWAITED_ID = int(os.environ.get("FRESHSALES_STATUS_PAYMENT_AWAITED") or 0)
PAYMENT_RECEIVED_ID = int(os.environ.get("FRESHSALES_STATUS_PAYMENT_RECEIVED") or 0)

STAGE_STATUS_IDS = {
    "demo_scheduled":   DEMO_SCHEDULED_ID,
    "demo_given":       DEMO_GIVEN_ID,
    "payment_awaited":  PAYMENT_AWAITED_ID,
    "payment_received": PAYMENT_RECEIVED_ID,
    "won":              WON_ID,
    "lost":             LOST_ID,
}
```

**Backend — `funnel.py`:**

Update `STAGE_STATUSES` to include the new statuses in the "won" bucket:

```python
# Current (line 88-93):
STAGE_STATUSES = {
    "demo_scheduled": {"demo_scheduled", "demo_given", "won", "lost"},
    "demo_given":     {"demo_given", "won", "lost"},
    "won":            {"won"},
    "lost":           {"lost"},
}

# New:
STAGE_STATUSES = {
    "demo_scheduled": {"demo_scheduled", "demo_given", "payment_awaited", "payment_received", "won", "lost"},
    "demo_given":     {"demo_given", "payment_awaited", "payment_received", "won", "lost"},
    "won":            {"payment_awaited", "payment_received", "won"},
    "lost":           {"lost"},
}
```

Also update `_stage_order()` (BUG-001 addition):

```python
def _stage_order(status):
    return {
        "demo_scheduled": 1, 
        "demo_given": 2, 
        "payment_awaited": 3, 
        "payment_received": 3, 
        "won": 4, 
        "lost": 4
    }.get(status or "", 0)
```

**Backend — `.env`:**

Add new env var (already have `FRESHSALES_STATUS_PAYMENT_AWAITED=402001783018`):

```
FRESHSALES_STATUS_PAYMENT_RECEIVED=402001755414
```

---

## Impact Analysis

| Metric | Before | After |
|--------|--------|-------|
| Demo Given % (Meta, 71 leads, 8 demo given) | 23.5% (of 34 sched) | **11.3%** (of 71 leads) |
| Demo Given % (Google, 57 leads, 14 demo given) | 42.4% (of 33 sched) | **24.6%** (of 57 leads) |
| Won count | 1 (only "Won" status) | 1+ (Won + Payment Awaited + Payment Received) |

### Risk
- Low — read-only funnel display changes only
- CRM sync will start pulling 2 new status buckets from Freshsales (payment_awaited, payment_received)
- No impact on lead capture, GTM events, or Freshsales writes
- First sync after deploy will populate the new statuses (6-hour cycle, or manual trigger)

---

## Testing
- Verify Demo Given % = demo_given / lead_in for each source
- Verify Won count includes all 3 payment/won statuses
- Verify no 100%+ rates on Demo Given column
- Cross-check total Won with Freshsales filter: Status IN (Won, Payment Awaited, Payment Received)
