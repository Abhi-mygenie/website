# CR-266 — `GET /api/demo-requests` has no authentication → lead PII publicly readable

**Type:** Security bug (backend) · **Prio:** **P0** · **Gate:** INTAKE · **Raised:** 2026-09-13 (governance baseline, Finding B-1)
**Reporter:** E1 agent (read-only investigation) · **Owner decision pending:** fast-track or normal queue

## Problem Statement
`/app/backend/server.py` L575–582:
```python
@api_router.get("/demo-requests", response_model=List[DemoRequest])
async def get_demo_requests():
```
has **no `Depends(cms_auth.get_dashboard_admin)`**. Every other dashboard endpoint (L931, 955, 969, 982, 994, 1005, 1075, 1087, 1099, 1112 …) is gated.

## Evidence (2026-09-13)
```
curl -s -o /dev/null -w '%{http_code}' https://www.mygenie.online/api/demo-requests   → 200
curl -s https://www.mygenie.online/api/demo-requests | wc -c                         → 332504 bytes
```
Response contains full lead records: name, phone, email, business name, city, outlet type, attribution (fbclid/gclid, IP, UA), Freshsales ids.

## Exposure
- Public internet, no rate limit, no auth, indexed-able.
- ~70 leads in preview DB; production DB size unknown (332 KB ≈ several hundred records).
- Regulatory: PII of Indian consumers/businesses (DPDP Act 2023 relevance).

## Investigation still required (INVESTIGATION gate)
1. Who consumes this endpoint? (`grep -rn "demo-requests" frontend/src` → determine if `/leads` dashboard uses it or the gated `/api/cms/...` routes.)
2. Are `POST /api/demo-request` siblings (`quote-requests`, `contact-requests` GET lists) similarly open?
3. Nginx/Cloudflare access logs: any non-browser hits to this path?

## Candidate fix (for IMPACT/PLAN gates — not approved)
Add `admin: str = Depends(cms_auth.get_dashboard_admin)` to `get_demo_requests`; if the `/leads` page calls it, it already holds a CMS JWT (login `admin/admin123`) so the frontend change is nil or a header add.

## Blast radius (preliminary)
Backend only. Frontend `/leads` may break if it calls this route without the bearer header — must be confirmed in investigation before planning.

## Closure criteria (proposed)
- Production `curl` without token → 401/403.
- `/leads` dashboard still lists leads after login.
- Test report attached; production backend hash/redeploy recorded.
