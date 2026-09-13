# RELEASES — production deployment record

One entry per production deploy. A CR cannot reach CLOSURE (production target) unless it appears in a release entry here **and** the hash was verified live.
Verify command: `curl -s https://www.mygenie.online/ | grep -o 'main\.[a-f0-9]*\.js'`

| Release | Date verified | Prod hash | Source commit | Built by | Frontend env baked in | Backend deployed? | CRs included | Regression on prod | Notes |
|---|---|---|---|---|---|---|---|---|---|
| **R0** | 2026-09-13 | `main.b23cd364.js` | *not confirmed* (frontend source unchanged since `48d07a4`; owner built on prod server) | owner | `REACT_APP_BACKEND_URL=https://www.mygenie.online`, `REACT_APP_WHATSAPP_ENABLED=false` (inferred — FAB absent), `REACT_APP_GTM_ID=GTM-K5D84Z3L` (present in HTML) | unknown — `server.py` CR-265 filter not confirmed on prod | Baseline: every CR marked `LEGACY-CLOSED` / `CLOSED` in matrix as of 2026-09-13 is assumed present (best-effort, see below) | R-23 ✅ (no FAB) · R-34 not run · R-35 ❌ (`/leads` 404, Nginx) · R-13 ❌ (public PII endpoints, CR-266) · R-40 ✅ | Declared Release 0 by owner decision D-5 |

## R0 — live-site spot checks performed 2026-09-13 (read-only)
| Check | Result |
|---|---|
| `GET /` | 200, hash `main.b23cd364.js` |
| `whatsapp-fab` in HTML | 0 (CR-249 effective) |
| `GTM-K5D84Z3L` in HTML | present (CR-264) |
| `GET /leads` | **404** (CR-79/Nginx owner fix pending) |
| `GET /api/demo-requests` anonymous | **200, 332 KB PII** (CR-266) |
| `GET /api/quotes` anonymous | **200, 32 KB** (CR-266) |
| `GET /api/contact-messages` anonymous | **200, 4.6 KB** (CR-266) |

## Superseded / undeployed artefacts
| Artefact | Hash | Built | Env | Status |
|---|---|---|---|---|
| `/app/mygenie-prod-20260911-no-whatsapp.zip` | `main.8907c40f.js` | 2026-09-11, pod | `BACKEND_URL=https://www.mygenie.online`, `WHATSAPP_ENABLED=false` | superseded by owner's own build (R0); never deployed |
| Preview build | `main.e9f67272.js` | 2026-09-13 06:06, pod | preview URL, WhatsApp key missing | wiped by platform restore; preview left down by owner decision |

## Next release checklist (R1+)
1. All CRs in the release are at QA-PASS in the matrix.
2. Server `frontend/.env` contains: `REACT_APP_BACKEND_URL=https://www.mygenie.online`, `REACT_APP_WHATSAPP_ENABLED=false`, `REACT_APP_GTM_ID=GTM-K5D84Z3L` (+ any key added by an included CR).
3. Owner builds from the recorded commit; agent verifies hash live; runs "Any production release" set from `REGRESSION_SUITE.md` on `$PROD`.
4. Cloudflare cache purge (CR-252 pending — until then, purge manually).
5. Add the row above; move included CRs to CLOSURE.
