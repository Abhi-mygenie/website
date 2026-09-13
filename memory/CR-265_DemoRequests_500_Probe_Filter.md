# CR-265 — RETRO-REGISTERED: `GET /api/demo-requests` 500 → probe-doc filter

**Type:** Bug fix (backend) · **Prio:** P2 · **Gate:** CLOSURE (retro) · **Raised:** 2026-09-13 (baseline) · **Change date:** 2026-09-11
**Why retro:** Change shipped in commit `900ce42` without a CR, impact analysis, plan or recorded approval. Registered so the baseline has zero untracked code changes. Owner acceptance of this record = closure.

## Problem Statement
`GET /api/demo-requests` returned HTTP 500. Testing agent (`/app/test_reports/iteration_2.json`) traced it to a Pydantic validation error: the `response_model=List[DemoRequest]` serialiser hit documents in `demo_requests` without a `name` field (2 probe docs left by CR-59 webhook testing, id prefix `cr59-probe`).

## Root Cause
Corrupt/probe documents in the collection + strict response model. Not a regression — latent since CR-59 (2026-07-14); surfaced when the endpoint was exercised end-to-end.

## Change Made (as-built)
File: `/app/backend/server.py` L577–578

```python
# Filter out probe/invalid docs that are missing required fields (e.g. cr59-probe)
items = await db.demo_requests.find({"name": {"$exists": True, "$ne": None}}, {"_id": 0}).sort("created_at", -1).to_list(1000)
```
Previously: `db.demo_requests.find({}, {"_id": 0})`.

## Impact Analysis (retro)
| Area | Impact |
|---|---|
| Data | None written. Read filter only; probe docs remain in DB. |
| API contract | Same shape. Returns 70 instead of failing. |
| Frontend `/leads` dashboard | Unblocked (was showing error). |
| CRM / GTM / SEO / prerender | None. |
| Security | **Not addressed** — endpoint remained unauthenticated (→ CR-266). |

## What was NOT done
- Probe docs not deleted (would need owner approval — DB write).
- No auth added.
- No test added.

## Verification evidence
- Local: `GET /api/demo-requests` → 200, 70 items (2026-09-11).
- Production: not deployed (backend change; production backend deploy state unknown).

## Alternatives considered
Delete the 2 probe docs (cleaner, but a DB write without approval) — rejected at the time.

## Closure criteria
Owner acknowledges this retro record. Optional follow-up CR: delete probe docs once CR-266 is closed.
