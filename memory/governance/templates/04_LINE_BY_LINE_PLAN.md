# CR-<n> — Line-by-Line Plan: <short title>

**Gate:** PLAN · **Plan version:** v1 · **Date:** <YYYY-MM-DD> · **IA:** `CR-<n>_ImpactAnalysis.md` (dated <date>)
**Files in this plan (must equal IA §4):** `<file1>`, `<file2>`

## Decision log
| Date | Decision | By |
|---|---|---|
| | Option A chosen | owner |

## Pre-implementation checks (run first; abort if any differs)
```bash
grep -n "<anchor text>" <file>            # Expected: 1 match at ~L<line>
git status --short                        # Expected: clean (or list known untracked: backend/.env frontend/.env)
```

## Op 1 — `<file>` · <one-line purpose>
### Find (exact, current):
```<lang>
<verbatim block>
```
### Replace with:
```<lang>
<verbatim block>
```
### Post-op check:
```bash
grep -n "<new anchor>" <file>             # Expected: 1 match
```

## Op 2 — `<file>` · <purpose>
(same structure)

## New files (full content, if any)
### `<path>`
```<lang>
<complete file>
```

## Env / config ops
| File | Key | Action | Value (redact secrets) |
|---|---|---|---|
| `backend/.env` | `X` | add via search_replace on single key | `<value or "owner provides">` |

## Owner-side ops (not executed by agent)
| # | Where | Exact action | Verification |
|---|---|---|---|
| O1 | Nginx | | `curl -I ... → 200` |

## Build & restart
- Backend changed → `sudo supervisorctl restart backend` → `tail -n 50 /var/log/supervisor/backend.err.log` clean
- Frontend changed → `cd /app/frontend && yarn build` → record hash `main.<hash>.js` → prerender count `find build -name index.html | wc -l` = <expected> → `sudo supervisorctl restart frontend`
- Env changed → restart the affected service

## Test plan (executed at QA gate)
| # | Check | Tool | Expected |
|---|---|---|---|
| T1 | change-specific | curl / screenshot / testing_agent | |
| T2 | regression R-<id> | | pass |
| T3 | regression R-<id> | | pass |

## Production deployment (owner)
1. Pull `main` @ `<commit>` on server
2. Build with server `frontend/.env` (must include: `<keys>`)
3. Deploy; agent verifies `curl -s https://www.mygenie.online/ | grep -o 'main\.[a-f0-9]*\.js'` = new hash
4. Record in `RELEASES.md`

## Rollback (from IA §8, made concrete)
```bash
git revert <commit>   # or: redeploy main.<previous>.js
```

## Approval request
> Owner, please reply **`approved CR-<n> plan v1`** to proceed, or list changes.
