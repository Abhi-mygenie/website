# CR-<n> — Impact Analysis: <short title>

**Gate:** IMPACT · **Date:** <YYYY-MM-DD> · **Based on investigation dated:** <date> · **Author:** <agent/dev>

## 1. Problem statement (from intake, one paragraph)

## 2. Root cause (from investigation, one paragraph + file:line)

## 3. Options considered
| # | Option | Effort | Risk | Recommendation |
|---|---|---|---|---|
| A | | | | ✅ recommended |
| B | | | | |
| C | Do nothing | 0 | | |

## 4. Chosen option — what WILL change (exhaustive)
| File / object | Function / section / key | Change (one line) |
|---|---|---|
| `backend/server.py` | `get_demo_requests()` L575 | add `Depends(...)` |
| `frontend/.env` | `REACT_APP_X` | add key |
| Nginx `/etc/nginx/sites-available/mygenie` | `location /` | owner-side |

**Rule:** implementation may touch ONLY the rows above. Anything else → stop, amend, re-approve.

## 5. What does NOT change (explicit)
- 
- 

## 6. Blast radius
| Area | Affected? | How / mitigation |
|---|---|---|
| SEO / prerender / sitemap / schema | no · yes | |
| Tracking: GTM, consent mode, dataLayer, conversions | no · yes | |
| CRM: Freshsales fields/tags/lifecycle, Calendly webhook | no · yes | |
| Payments: Razorpay, invoices | no · yes | |
| Auth / PII / security | no · yes | |
| Performance: LCP/CLS/TBT, bundle size, prerender count | no · yes | |
| Infra: Nginx, Cloudflare cache, DNS, env | no · yes | |
| Data: collections written, document counts | no · yes | |
| Other CRs (dependency / conflict) | no · yes | CR-<m> |

## 7. Risk rating
**Low | Medium | High** — because: <one sentence>

## 8. Rollback
- Code: `git revert <hash>` / redeploy previous hash `main.<hash>.js`
- Config: restore `<file>` from `<backup>`
- Data: <reverse query or "not reversible — requires backup first">
- Time to roll back: <minutes>

## 9. Dependencies & owner-side work
| Item | Who | Before or after code? |
|---|---|---|
| | owner | |

## 10. Verification strategy (summary — details go in the plan)
- Change-specific check:
- Regression-suite items: R-<ids from REGRESSION_SUITE.md>
- Environment(s) to verify: preview · production

## 11. IA exit check
- [ ] Every file in §4 exists and line refs verified today
- [ ] §5 filled (not "N/A")
- [ ] §6 every row answered
- [ ] Rollback written
- [ ] Owner questions (if any): <list>
