# AGENT RULES — MyGenie Website

Binding for every agent or developer working in this repo. Read at the start of every session, before any other file. Owner: Abhi (mygenie). Respond to the owner in English.

## 0. The one rule
**No CR id → no change.** You may read, investigate, and write documents freely. You may not edit code, config, `.env`, DB data, builds, or infrastructure unless a CR exists, has reached `APPROVAL` in `governance/TRACEABILITY_MATRIX.md`, and you are executing its approved plan.

## 1. Session start (mandatory, in this order)
1. Read `governance/AGENT_RULES.md` (this file) and `governance/GATES.md`.
2. Read `governance/TRACEABILITY_MATRIX.md` — know which CRs are at which gate.
3. Read the latest `HANDOVER_*.md` and `PRD.md`.
4. Run `python3 scripts/gov/gov_check.py` and report violations to the owner **before** doing anything else. (Until the script exists: `git status --short` and compare touched files against the matrix.)
5. Report to owner: services state, build hash, open P0s, any violations. Then ask what to work on.

## 2. When the owner reports a problem or asks for a change
1. Create the CR (Gate 0) with the owner's words verbatim. Tell the owner the CR id.
2. Investigate read-only (Gate 1). Show findings.
3. Write the IA (Gate 2). Show it. Do not propose code yet unless the owner asks for options.
4. Write the plan (Gate 3). Show it. Ask for `approved CR-<n>`.
5. Only after the literal approval: implement (Gate 5), QA (Gate 6), close (Gate 7).
A P0 may be fast-tracked (`fast-track CR-<n>` from owner) — see GATES.md.

## 3. Hard prohibitions
- Never fix something you noticed while doing something else. Raise a CR.
- Never touch a file not listed in the approved IA. If needed → STOP, amend IA, re-approve.
- Never refactor, reformat, rename, or "clean up" without its own CR.
- Never bump dependencies without a CR.
- Never write to the database (insert/update/delete/backfill) without a CR that names the collection, the filter, and the expected document count.
- Never edit `.env` files except by `search_replace` on a single key, under a CR.
- Never rebuild for production, create a zip, or claim "deployed" without recording hash + commit + env in `RELEASES.md`.
- Never mark anything CLOSED without QA evidence and production/preview verification.
- Never treat "ok", "yes", "go", or a thumbs-up as approval. Only `approved CR-<n>`.
- Never re-number, delete, or rewrite existing CR records. Append corrections with a date.

## 4. Commits and handovers
- Commit messages: `CR-<n>: <what>`. Multiple CRs → `CR-<a>, CR-<b>: <what>`.
- Every handover lists, per CR touched: gate before → gate after, artefacts created, evidence links.
- If you were interrupted mid-gate, say exactly which op of the plan was last executed.

## 5. Documents & locations
| What | Where |
|---|---|
| Intake register (history) | `/app/memory/CR_INTAKE_REGISTER.md` |
| Source of truth for state | `/app/memory/governance/TRACEABILITY_MATRIX.md` |
| Gate definitions | `/app/memory/governance/GATES.md` |
| Templates | `/app/memory/governance/templates/` |
| Per-CR record | `/app/memory/CR-<n>_<slug>.md` (+ `_ImpactAnalysis.md`, `_Line_By_Line_Plan.md`) |
| Regression suite | `/app/memory/governance/REGRESSION_SUITE.md` |
| Releases | `/app/memory/governance/RELEASES.md` |
| Baseline | `/app/memory/governance/BASELINE_2026-09-13.md` |
| Test reports | `/app/test_reports/iteration_<n>.json` |
| Governance tooling | `/app/scripts/gov/` |

## 6. Environment facts you must not "fix"
- Backend runs on :8001, frontend on :3000 under supervisor. Do not change ports.
- `frontend/.env` `REACT_APP_BACKEND_URL` is platform-managed. Never overwrite the file.
- Production is `https://www.mygenie.online`, deployed by the owner from their server. The pod never deploys to production.
- Frontend env values are baked in at build time; a rebuild with different env = different hash. Record env with every build.
- `frontend/build/` can be wiped by platform restores. Rebuilding preview is an operational action: announce it, record the hash, do not call it a change.

## 7. If you are unsure
Ask the owner one question at a time, with lettered options, and record the answer in the CR. Unsure ≠ permission.
