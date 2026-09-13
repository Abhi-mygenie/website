# Governance / Control Layer — index

Start here. Read order for a new agent or developer: **1 → 2 → 3**, then whatever the task needs.

| # | File | What it is | Edit policy |
|---|---|---|---|
| 1 | `AGENT_RULES.md` | Binding operating rules. "No CR id → no change." Session-start checklist. | Owner-approved changes only |
| 2 | `GATES.md` | The 8-gate state machine, entry/exit criteria, artefact per gate, parked states, fast-track, batching. | Owner-approved changes only |
| 3 | `TRACEABILITY_MATRIX.md` | **Single source of truth** for every CR's state and its chain: intake → IA → plan → approval → commit → QA → release. | **Generated** — never hand-edit; change `/app/scripts/gov/overrides.json` or add artefacts, re-run `python3 /app/scripts/gov/build_matrix.py` |
| 4 | `templates/01_INTAKE.md` … `05_QA_CLOSURE.md` | Copy-paste skeletons for each gate. | Improve via CR |
| 5 | `REGRESSION_SUITE.md` | Fixed list of critical flows (R-ids) + minimum set per change type + mandatory production-release set. | Improve via CR |
| 6 | `RELEASES.md` | Production deployment record. R0 = `main.b23cd364.js` (2026-09-13). | Append per release |
| 7 | `BASELINE_2026-09-13.md` | Frozen baseline + owner decisions D-1…D-6. | Historical — append corrections only |
| 8 | `REGISTER_RECONCILIATION_2026-09-13.md` | How the 211 register rows were classified; conflict resolutions. | Historical |
| — | `/app/memory/CR_INTAKE_REGISTER.md` | Intake history (all CR rows, batch tables). Still where a new CR is first written. | Append only |
| — | `/app/memory/CR-LEGACY_Retro_Register_CR1-68_CR117-123.md` | D-3 retro records for 28 pre-register CRs. | Historical |
| — | `/app/scripts/gov/build_matrix.py`, `overrides.json` | Matrix generator + manual state decisions (each with a decision reference). | Code changes via CR; overrides appended with decision ref |
| — | `/app/scripts/gov/gov_check.py` | **Step 5 — not yet built.** Will flag: CRs at a gate without the required artefact, code files changed since baseline without a `CR-n` commit/comment, approvals missing verbatim text, closed CRs without release entry. | — |

## Lifecycle in one glance
```
owner message ──► INTAKE (CR-n row + CR-n_*.md)
              ──► INVESTIGATION (read-only, in CR doc)
              ──► IMPACT (CR-n_ImpactAnalysis.md)
              ──► PLAN (CR-n_Line_By_Line_Plan.md)
              ──► APPROVAL ("approved CR-n plan vK" from owner, quoted in CR doc)
              ──► IMPLEMENTATION (commit "CR-n: …", only files in IA §4)
              ──► QA (plan tests + REGRESSION_SUITE R-ids, evidence in CR doc / test_reports)
              ──► CLOSURE (verified in target env, RELEASES.md row, register + matrix updated, owner told)
```

## Current governance state (2026-09-13)
- Step 1 baseline: **signed off** (D-1…D-6).
- Step 2 rules/templates/matrix/regression/releases: **written, awaiting owner review**.
- Step 5 `gov_check.py`: pending.
- Open P0 at INTAKE: **CR-266** (public lead PII endpoints — 3 routes).
