# CR-31 — Conversion Funnel by Source (Replace Lead Quality Scoring)

**Opened:** 2026-06-27
**Status:** G2 — Implementation Planning COMPLETE
**Priority:** P1 (clarity + actionability)
**Effort:** ~1.5 hours
**Risk:** LOW — replaces one backend function + one frontend component, no new endpoints

---

## Problem Statement

The current "Lead Quality Dashboard" uses an arbitrary point-scoring system (OTP +3, Demo Scheduled +2, Demo Given +3, Won +5, Business Name +1, City +1) to bucket leads into Unqualified/Qualified/High Intent/Won. This is confusing because:

1. The CRM pipeline stages (Scheduled → Given → Won) already define lead quality — no scoring needed
2. The scoring creates misleading buckets: a lead with OTP + business name + city but no demo = "Qualified" (score 5), while a demo-scheduled lead without OTP = "Unqualified" (score 2)
3. "Avg Score" (0-15) is meaningless to the business — nobody thinks in abstract points

**Owner decision:** Replace with a **Conversion Funnel by Source** table showing stage counts + stage-to-stage qualifying percentages: **Leads → OTP Verified → Scheduled → Demo Given → Won**

---

## Current Data Profile (production DB)

```
Total leads: 1,390 (1,388 backfilled + 2 demo_requests)
OTP verified: 633 (45.5% of total)

CRM stage distribution:
  No stage (null):    845
  Demo Scheduled:      38
  Demo Given:         190
  Lost:               162
  Won:                153
```

**Note:** `_in_stage` uses cumulative counting — "demo_scheduled" includes demo_given + won + lost. So:
- Leads that reached demo_scheduled = 38 + 190 + 153 + 162 = **543**
- Leads that reached demo_given = 190 + 153 = **343** (excludes lost-before-demo)
- Actually, looking at STAGE_STATUSES: demo_given includes {demo_given, won, lost} = 190 + 153 + 162... wait, lost counts as having had demo_given? Let me check.

Actually `_in_stage("lost", "demo_given")` = True because "lost" is in STAGE_STATUSES["demo_given"]. This means lost leads are counted as having passed through demo_given. This is the EXISTING behavior and is correct — you lose a deal AFTER giving the demo.

For the funnel, stage-to-stage %:
- Leads: 992 (those with first_source, excluding null-source contacts)
- OTP Verified: 633 → **63.8%** of leads
- Scheduled (demo_scheduled+demo_given+won+lost): 543 → **85.8%** of OTP... but this includes non-OTP leads who also got scheduled
- These percentages need to be "of previous stage" not "of OTP" — because not all scheduled leads went through OTP

**IMPORTANT design decision:** The % should be **of total leads from that source**, not stage-to-stage. Stage-to-stage is misleading because the pipeline isn't strictly linear (some leads skip OTP, some get scheduled without OTP). Each column % = count ÷ leads from that source.

**Revised design:**
- OTP Verified %: `otp_count / leads × 100`
- Scheduled %: `scheduled_count / leads × 100`
- Demo Given %: `given_count / leads × 100`
- Won %: `won_count / leads × 100`

This shows the **qualifying percentage at each stage** relative to total leads, making it easy to compare sources.

---

## Implementation Plan

### Backend: Replace `get_lead_quality_breakdown()` in `funnel.py`

**Current function** (lines 709-776): Scores each lead (0-15), buckets into 4 categories, groups by source.

**New function:** Count leads at each pipeline stage per source. No scoring, no buckets.

```python
async def get_lead_quality_breakdown(db) -> dict:
    rows = await _load_all(db)
    
    source_data = {}
    for r in rows:
        src = _source_label(r)
        if src not in source_data:
            source_data[src] = {"source": src, "leads": 0, "otp_verified": 0,
                                "scheduled": 0, "demo_given": 0, "won": 0}
        d = source_data[src]
        d["leads"] += 1
        if r.get("otp_verified") is True:
            d["otp_verified"] += 1
        if _in_stage(r.get("crm_status"), "demo_scheduled"):
            d["scheduled"] += 1
        if _in_stage(r.get("crm_status"), "demo_given"):
            d["demo_given"] += 1
        if _in_stage(r.get("crm_status"), "won"):
            d["won"] += 1
    
    sources = []
    for s in sorted(source_data.values(), key=lambda x: -x["leads"]):
        leads = s["leads"] or 1
        s["otp_pct"]       = round(s["otp_verified"] / leads * 100, 1)
        s["scheduled_pct"] = round(s["scheduled"] / leads * 100, 1)
        s["given_pct"]     = round(s["demo_given"] / leads * 100, 1)
        s["won_pct"]       = round(s["won"] / leads * 100, 1)
        sources.append(s)

    total = len(rows)
    total_won = sum(s["won"] for s in sources)
    return {
        "total_leads": total,
        "total_won": total_won,
        "won_rate": round(total_won / total * 100, 1) if total else 0,
        "sources": sources,
    }
```

**Same endpoint, same function name** — frontend calls the same `/api/cms/leads/quality-summary`. Response shape changes but it's consumed only by `LeadQualityPanel.jsx` which we're also rewriting.

### Frontend: Rewrite `LeadQualityPanel.jsx`

**Current:** 4 bucket summary cards + "Quality by Source" table with Unqualified/Qualified/High Intent/Won/Avg Score/Quality %

**New:** Single table — "Conversion Funnel by Source" with columns:

| Source | Leads | OTP Verified | Scheduled | Demo Given | Won |
|---|---|---|---|---|---|
| Meta | **775** | **312** 40.3% | **89** 11.5% | **73** 9.4% | **45** 5.8% |

Each cell shows count (bold) + qualifying % of leads (smaller text below).

**Remove:**
- 4 bucket summary cards (Unqualified/Qualified/High Intent/Won)
- Score legend at bottom
- Avg Score column
- Quality % column

**Add:**
- Stage-colored column headers (matching mockup: black/purple/blue/amber/green)
- % shown below each count
- Footer note: "Each % = of total leads from that source"

---

## Files Impact Summary

| File | Change | Type |
|---|---|---|
| `backend/funnel.py` | Replace `get_lead_quality_breakdown()` function body (~70 lines → ~40 lines) | MOD |
| `frontend/src/components/ads/LeadQualityPanel.jsx` | Full rewrite of component (~131 lines → ~80 lines) | MOD |

**Total files:** 2
**New files:** 0
**Deleted files:** 0
**New endpoints:** 0 (same endpoint, new response shape)
**Backend endpoint:** `GET /api/cms/leads/quality-summary` — response shape changes
**No other consumers** of this endpoint (confirmed: only `LeadQualityPanel.jsx` calls it)

---

## Acceptance Criteria

| # | Criterion | How to verify |
|---|---|---|
| 1 | Table shows 5 columns: Leads, OTP Verified, Scheduled, Demo Given, Won | Screenshot |
| 2 | Each cell shows count + % of total leads for that source | Verify math: count ÷ leads × 100 |
| 3 | Column headers are color-coded (purple OTP, blue Scheduled, amber Given, green Won) | Visual |
| 4 | Sources sorted by lead count descending | Check order |
| 5 | Footer note explains "% = of total leads from that source" | Screenshot |
| 6 | Old bucket cards (Unqualified/Qualified/High Intent/Won) removed | Visual |
| 7 | Old Avg Score and Quality % columns removed | Visual |
| 8 | No other panel/component breaks (only consumer is LeadQualityPanel) | Check all panels load |

---

## Dependencies & Blockers

- **None.** Self-contained change in 2 files. No other component consumes the endpoint.

---

## Gate Progress
- [x] **G1 Discovery & Impact** — DONE (2026-06-27)
- [x] **G2 Planning** — DONE (2026-06-27). Mockup approved, response shape defined, 2-file scope confirmed
- [ ] **G3 Implementation** — Ready to build (~1.5 hrs)
- [ ] **G4 QA**
- [ ] **G5 Owner Smoke Test**

---

*CR-31 registered by E1, Emergent Labs. 27 June 2026.*
