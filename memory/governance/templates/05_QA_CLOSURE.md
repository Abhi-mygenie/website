## Approval — CR-<n>
**Date:** <YYYY-MM-DD> · **Plan version approved:** v<k>
> <verbatim owner text, e.g. "approved CR-266 plan v1">
Conditions attached by owner: <none | list>

---

## Implementation Log — CR-<n>
**Gate:** IMPLEMENTATION · **Date:** <YYYY-MM-DD> · **Executed by:** <agent/dev>
| Op | File | Status | Post-op check output |
|---|---|---|---|
| 1 | | done | `1 match at L577` |
| 2 | | done | |

- Commit(s): `<hash>` — `CR-<n>: <msg>`
- `git status --short` after commit: <clean / known untracked only>
- Files touched vs IA §4: identical ✅ | deviation ❌ → <explain, return to PLAN>
- Backend restarted: yes/no · Frontend built: hash `main.<hash>.js`, prerender count <n>

---

## QA — CR-<n>
**Gate:** QA · **Date:** <YYYY-MM-DD> · **Environment:** preview | production · **Tester:** <agent / testing_agent / owner>

### Change-specific tests (from plan)
| # | Check | Command / action | Expected | Actual | Result |
|---|---|---|---|---|---|
| T1 | | | | | ✅ / ❌ |

### Regression suite items run
| R-id | Item | Result | Evidence |
|---|---|---|---|
| R-01 | Demo form → Mongo | ✅ | `curl ...` output / report path |

### Evidence
- Test report: `/app/test_reports/iteration_<n>.json`
- Screenshots: <paths>
- Backend log tail: clean | <excerpt>

### Verdict
**PASS** → proceed to CLOSURE · **FAIL** → back to IMPLEMENTATION (reason: <…>) · back to PLAN (reason: <…>)

---

## Closure — CR-<n>
**Gate:** CLOSURE · **Date:** <YYYY-MM-DD>
| Item | Value |
|---|---|
| Target environment | preview only · production |
| Verified in target | `curl -s https://www.mygenie.online/... → <result>` / prod hash `main.<hash>.js` |
| Release | `RELEASES.md` → R<k> |
| Register row updated | ✅ `CR_INTAKE_REGISTER.md` → `✅ CLOSED <date> — <one-line evidence>` |
| Matrix row complete | ✅ intake · investigation · IA · plan · approval · commit · QA report · release |
| Follow-up CRs raised | CR-<m> (<why>) · none |
| Owner informed | <date> — "CR-<n> closed; verify: <what to click / check>" |

Closure checklist
- [ ] All links above resolve to real files/hashes
- [ ] No open QA failures
- [ ] Owner-side items (if any) confirmed by owner and verified by agent
