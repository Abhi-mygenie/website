# GATES — Change Control State Machine

**Applies to:** every change to code, config, `.env`, build, infrastructure (Nginx/Cloudflare/GTM/Freshsales admin), data (DB writes/backfills) and documentation that alters behaviour.
**Approval authority:** owner only. Approval = the literal text `approved CR-<n>` (or `approved CR-<n> plan`) from the owner in chat, quoted verbatim into the CR record with the date.
**Single source of truth for state:** `governance/TRACEABILITY_MATRIX.md` (one row per CR). `CR_INTAKE_REGISTER.md` is intake history only.

```
INTAKE → INVESTIGATION → IMPACT → PLAN → APPROVAL → IMPLEMENTATION → QA → CLOSURE
                                                          ↑                │
                                                          └── QA FAIL ─────┘
Any gate → DEFERRED / REJECTED / OWNER-ACTION (terminal or parked, owner decision only)
```

A CR can only move **one gate forward at a time**, and only when the exit criteria of the current gate are met and the required artefact exists. Skipping a gate is a governance violation and is flagged by `scripts/gov/gov_check.py`.

---

## Gate 0 — INTAKE
**Purpose:** Capture the requirement / issue exactly as reported, without interpretation.
**Who can do it:** anyone (agent, owner, tester).
**Artefact:** row in `CR_INTAKE_REGISTER.md` + `CR-<n>_<slug>.md` using `templates/01_INTAKE.md`.
**Exit criteria:**
- Sequential CR id assigned (next free number; never reuse).
- Type ∈ {bug, feature, config, owner-action, data, docs}.
- Severity ∈ {P0, P1, P2, P3}.
- Source recorded (owner message / test report / monitoring / audit) with date.
- Reporter's words preserved verbatim.
- Row added to matrix with state `INTAKE`.
**Forbidden here:** proposing a fix, touching code.

## Gate 1 — INVESTIGATION
**Purpose:** Reproduce and understand. Read-only.
**Artefact:** `## Investigation` section in the CR file (template `02_INVESTIGATION.md`).
**Exit criteria:**
- Reproduced (or explicitly "cannot reproduce" with steps tried).
- Root cause stated with file:line evidence, or "unknown" with hypotheses ranked.
- Affected surfaces listed: pages/routes, endpoints, collections, integrations (Freshsales, Calendly, GTM, Razorpay, SMS), build/prerender, Nginx/Cloudflare.
- Commands / queries used are recorded so anyone can re-run them.
**Allowed:** `curl`, `grep`, read files, DB reads, log reads, screenshots.
**Forbidden:** any write — no edits, no DB writes, no env changes, no rebuilds of production artefacts.

## Gate 2 — IMPACT
**Purpose:** Decide what will change and what it can break, *before* deciding how.
**Artefact:** `CR-<n>_ImpactAnalysis.md` (template `03_IMPACT_ANALYSIS.md`).
**Exit criteria:**
- Exact list of files/functions/env keys/config objects that WILL be touched.
- Explicit "What does NOT change" section.
- Blast-radius table filled for every category (SEO/prerender, tracking/GTM/consent, CRM/Freshsales, payments, auth/PII, performance/CWV, Nginx/Cloudflare, data).
- Risk rating (Low/Med/High) with justification.
- Rollback path (git revert / redeploy previous hash / config restore) written.
- Dependencies on other CRs and on owner-side actions listed.
- Options considered (≥2 when non-trivial) with recommendation.
**Rule:** if implementation later needs a file not listed here → STOP, amend IA, return to APPROVAL.

## Gate 3 — PLAN
**Purpose:** Turn the chosen option into exact, reviewable operations.
**Artefact:** `CR-<n>_Line_By_Line_Plan.md` (template `04_LINE_BY_LINE_PLAN.md`).
**Exit criteria:**
- Every operation = file + exact find block + exact replace block (or full new-file content).
- Pre-implementation check commands with expected output.
- Post-edit verification commands with expected output.
- Build / restart / deploy steps (preview and production separately).
- Test plan: which regression-suite items run, which new checks, which tool (curl / screenshot / testing_agent).
- Owner-side steps (if any) listed separately with who/where.
- Estimated scope (files, lines) matches the IA file list exactly.

## Gate 4 — APPROVAL
**Purpose:** Owner consciously accepts the plan and its risk.
**Artefact:** `## Approval` block in the CR file: owner's verbatim approval text + date + which plan version.
**Exit criteria:**
- Owner has written `approved CR-<n>` (or equivalent explicit wording) in chat **after** the plan was presented.
- Any conditions the owner attached are recorded and become part of the plan.
**Rules:**
- Silence, "ok", "go ahead" without a CR id, or approval of a *different* CR does **not** count.
- Approval of an IA is not approval of the plan.
- A batch approval must list every CR id.
- If the plan changes after approval → back to APPROVAL.

## Gate 5 — IMPLEMENTATION
**Purpose:** Execute the approved plan — nothing more, nothing less.
**Artefact:** `## Implementation Log` in the CR file: ops executed, commit hash(es), deviations (should be none).
**Exit criteria:**
- Every planned op executed; post-edit verification commands pass.
- No file outside the IA list touched (`git status` / diff attached).
- Commit message(s) start with `CR-<n>:`.
- Preview build hash recorded if frontend changed; backend restart recorded if backend changed.
**Rules:**
- Discovering another bug mid-implementation → raise a new CR at INTAKE; do not fix it.
- No refactors, formatting passes, dependency bumps, or "while I'm here" edits.
- If a planned op cannot be applied as written → STOP, record why, return to PLAN.

## Gate 6 — QA
**Purpose:** Prove the change works and nothing else broke.
**Artefact:** `## QA` section (template `05_QA_CLOSURE.md`) + test report path.
**Exit criteria:**
- Change-specific tests from the plan pass, with evidence (command + output, screenshot path, or `/app/test_reports/iteration_<n>.json`).
- Regression suite (`REGRESSION_SUITE.md`) items marked in the plan pass.
- For frontend: build succeeds, prerender count unchanged (or change explained), target route(s) screenshot reviewed.
- For backend: endpoint curl + backend log tail clean.
- For config/infra: verification command from the plan returns expected value.
- QA FAIL → record failure, return to IMPLEMENTATION (or PLAN if design is wrong).
**Rule:** the agent that implemented may run QA, but a failure can never be "explained away" — it either passes or goes back.

## Gate 7 — CLOSURE
**Purpose:** Change is live where it was meant to be live, and traceability is complete.
**Artefact:** `## Closure` block + matrix row updated + `RELEASES.md` entry (if shipped).
**Exit criteria:**
- Deployed to the target environment (preview only / production) and **verified there** (production hash or curl).
- Matrix row has every link: intake → investigation → IA → plan → approval → implementation (commit) → QA (report) → release.
- Register status updated to `✅ CLOSED <date>` with a one-line evidence note.
- Follow-up CRs (if any) raised and linked.
- Owner informed in chat with CR id + what to verify.
**Owner-action CRs** close when the owner confirms in chat and the agent verifies the effect (e.g. `curl` shows the header / Nginx returns 200).

---

## Parked / terminal states
| State | Meaning | Who sets it |
|---|---|---|
| `DEFERRED` | Valid, not now. Keeps its artefacts. | Owner |
| `REJECTED` | Will not be done. Reason recorded. | Owner |
| `OWNER-ACTION` | No code; waits for owner-side change (GTM, Cloudflare, Nginx, Freshsales admin, keys). Closes at Gate 7 rules. | Agent proposes, owner confirms |
| `SUPERSEDED` | Replaced by another CR (link required). | Agent, owner informed |
| `LEGACY-CLOSED` | Closed before 2026-09-13 baseline with light retro-evidence (D-4). | Baseline only |
| `REOPENED-UNVERIFIED` | Was CLOSED pre-baseline but no evidence could be found (D-4). Needs a QA pass to close again. | Baseline only |

## Fast-track (P0 only)
Owner may say `fast-track CR-<n>`. Gates are still all executed, but INVESTIGATION + IMPACT + PLAN may be delivered in a single document and a single approval covers them. Nothing else is skipped.

## Batching
Multiple CRs may share one IA / plan document **only if** the file lists overlap. The document must carry all CR ids in its title; each CR still has its own matrix row and its own closure evidence.
