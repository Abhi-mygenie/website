# Agent Handover — 2026-09-13 · Session 14
# Governance / Control Layer: Baseline (Step 1) + Rules & Traceability (Step 2)

**Written by:** E1 agent · **Repo:** `https://github.com/Abhi-mygenie/website.git` · branch `main` · HEAD `900ce42`
**Production:** `https://www.mygenie.online` · prod hash `main.b23cd364.js` (= Release R0)
**Preview:** `REACT_APP_BACKEND_URL` in `/app/frontend/.env` (currently `https://react-app-runner-1.preview.emergentagent.com`) — **frontend is DOWN by owner decision** (see §4)
**Owner language:** English. Owner name: Abhi.

---

## 0. READ THIS FIRST — the rules changed this session

The owner has installed a **governance/control layer**. From now on, **nobody (agent or developer) may edit code, config, `.env`, DB data, builds or infrastructure without a CR that has reached the APPROVAL gate with the owner's literal text `approved CR-<n>`.** Investigation and documentation are free; changes are not.

Mandatory session start, in order:
1. Read `/app/memory/governance/AGENT_RULES.md`
2. Read `/app/memory/governance/GATES.md`
3. Read `/app/memory/governance/TRACEABILITY_MATRIX.md` (single source of truth for CR state)
4. Read this handover, then `/app/memory/PRD.md`
5. Run `git status --short` and compare touched files against the matrix (until `gov_check.py` exists — Step 5)
6. Report to owner: services state, build hash, open P0s, any violations. **Then ask what to work on.** Do not start anything on your own.

If the owner asks for a fix, the answer is: "Registered as CR-n. Investigating read-only." Never "Fixed."

---

## 1. What this session did (chronological)

### Step 1 — Baseline freeze (read-only) — SIGNED OFF by owner
- `governance/BASELINE_2026-09-13.md` — build identities, env key inventory (names only), DB snapshot, 9 findings B-1…B-9, owner decisions D-1…D-6 (§6).
- `governance/REGISTER_RECONCILIATION_2026-09-13.md` — all 211 register CRs classified; 19 CRs had contradictory statuses across duplicate roll-up tables; 8 closed with zero artefacts; 55 closed with no IA/plan; 21 code-referenced CRs missing from register; CR-117–123 had docs but no register row.
- Retro-registered **CR-265** (`server.py` L577–578 probe filter shipped 2026-09-11 without CR) — `CR-265_DemoRequests_500_Probe_Filter.md`.
- Raised **CR-266 (P0 SECURITY)** — see §3.
- Raised **CR-267 (P1)** — `.env` files not in `.gitignore` (register only, D-6).
- Appended **BATCH BE** to `CR_INTAKE_REGISTER.md` (CR-265/266/267) and a dated header line. No existing register rows were edited.
- Corrected a mistake mid-session: I first claimed production still had the WhatsApp FAB; verified false (prod HTML has no `data-testid="whatsapp-fab"`; hits were marketing copy). Baseline B-2/B-3 corrected. Owner built `b23cd364` themselves on the prod server with WhatsApp off.

### Owner decisions (verbatim outcome, recorded in BASELINE §6)
| # | Decision |
|---|---|
| D-1 | CR-266 → **normal queue** (stays at INTAKE until rules exist) — owner chose "B" |
| D-2 | 19 conflicting statuses → **accept my proposed resolutions** |
| D-3 | 28 legacy CRs (1–23, 25–28, 33, 35–37, 67, 68, 117–123) → **full retro-registration** |
| D-4 | 63 closed-without-evidence → **light retro-evidence**; unconfirmable → `REOPENED-UNVERIFIED` |
| D-5 | **`main.b23cd364.js` = Release R0**; preview build stays down; re-add `REACT_APP_WHATSAPP_ENABLED=false` before any rebuild |
| D-6 | `.gitignore` fix → **CR-267 register only** |

### Step 2 — Rules, templates, traceability — WRITTEN, awaiting owner review
All in `/app/memory/governance/` (index: `README.md`):
| File | Purpose |
|---|---|
| `GATES.md` | 8-gate state machine `INTAKE → INVESTIGATION → IMPACT → PLAN → APPROVAL → IMPLEMENTATION → QA → CLOSURE`; entry/exit criteria + required artefact per gate; parked states (`DEFERRED`, `REJECTED`, `OWNER-ACTION`, `SUPERSEDED`, `LEGACY-CLOSED`, `REOPENED-UNVERIFIED`); fast-track (P0 only, owner says `fast-track CR-n`); batching rules |
| `AGENT_RULES.md` | Binding rules, session-start checklist, hard prohibitions, commit format `CR-n: …`, environment facts not to "fix" |
| `templates/01_INTAKE.md` … `05_QA_CLOSURE.md` | Skeletons for each gate |
| `REGRESSION_SUITE.md` | R-01…R-61 critical flows; minimum set per change type; mandatory set for any production release |
| `RELEASES.md` | R0 row + live spot-checks + superseded artefacts + next-release checklist |
| `TRACEABILITY_MATRIX.md` | **GENERATED — never hand-edit.** One row per CR: state, prio, brief/IA/plan docs, code refs, evidence, release, note |
| `/app/memory/CR-LEGACY_Retro_Register_CR1-68_CR117-123.md` | D-3 retro records (28 sections: title recovered from code comments/docs, code refs, docs) |
| `/app/scripts/gov/build_matrix.py` | Generator: parses register + `/app/memory/CR-*.md` + `grep CR-n` in code + `overrides.json` → matrix. Run: `python3 /app/scripts/gov/build_matrix.py` |
| `/app/scripts/gov/overrides.json` | Manual state decisions. **Every entry must cite a decision (D-n or dated chat).** Append, never delete |

Matrix counts (2026-09-13): **242 CRs** — LEGACY-CLOSED 187 · INTAKE 21 · APPROVAL 7 · OWNER-ACTION 11 · DEFERRED 12 · IMPLEMENTATION 2 (CR-201, CR-259) · CLOSURE 1 (CR-265) · REOPENED-UNVERIFIED 1 (CR-197).

D-4 evidence pass: 16 CRs initially had no evidence; I verified 15 in code/prod (details in `overrides.json` notes, e.g. CR-70 fonts, CR-129 cache headers, CR-232 `cf-cache-status: REVALIDATED`, CR-35 three recovered phones present in Mongo). Only **CR-197** (TBT performance claim) remains unverifiable without a Lighthouse run.

---

## 2. System state at handover

| Item | State |
|---|---|
| backend (:8001) | RUNNING, healthy. `GET /api/` → 200 |
| frontend (:3000) | **CRASH-LOOPING** — `/app/frontend/build/` was wiped by a platform restore (`ENOENT build/index.html`). Owner chose to leave it down (D-5). Preview URL returns nothing |
| mongodb local | RUNNING, unused |
| Remote Mongo | `52.66.232.149:27017/test_database` — `demo_requests` 72 docs (2 probe docs without `name`, 26 with `freshsales_contact_id: null`); quotes/contact/cms_users/blog/payments = 0 |
| `backend/.env` | 64 keys. **Absent:** `FRESHSALES_API_KEY`, `FRESHSALES_BASE_URL` (CRM sync silently off), `CALENDLY_WEBHOOK_SIGNING_KEY` (CR-263), Razorpay/Meta/Google Ads keys, `LEADS_DASHBOARD_ENABLED` (defaults true) |
| `frontend/.env` | `REACT_APP_BACKEND_URL`, `WDS_SOCKET_PORT`, `ENABLE_HEALTH_CHECK` only. **`REACT_APP_WHATSAPP_ENABLED=false` is missing** → any rebuild re-enables the FAB in preview. Do not rebuild without a CR/owner instruction and without re-adding the key first (single-key `search_replace`) |
| git | HEAD `900ce42`; untracked: `backend/.env`, `frontend/.env`, `frontend/yarn.lock`, plus new governance files (uncommitted — platform commits on its own) |
| Test credentials | `/app/memory/test_credentials.md` — CMS `admin/admin123` |

**Rebuild preview (ONLY when owner says so):**
```bash
# 1. re-add key via search_replace (never overwrite .env): add line REACT_APP_WHATSAPP_ENABLED=false
cd /app/frontend && yarn build            # craco build + prerender → expect 65 index.html
find build -name index.html | wc -l
ls build/static/js/main.*.js              # record hash
sudo supervisorctl restart frontend
```
Record the hash + env in the CR / handover. It is an operational action, not a change — but announce it.

---

## 3. Open items by gate (what the next agent will be asked about)

### P0 at INTAKE — CR-266 · public lead PII endpoints (normal queue per D-1)
`server.py` — three list endpoints have **no `Depends(cms_auth.get_dashboard_admin)`**:
- `GET /api/demo-requests` L575 `get_demo_requests()` → prod HTTP 200, **332 KB** of names/phones/emails/attribution
- `GET /api/quotes` L664 `get_quotes()` → prod 200, 32 KB
- `GET /api/contact-messages` L739 `get_contact_messages()` → prod 200, 4.6 KB
Gated equivalent already exists: `GET /api/cms/leads` L930. Doc: `CR-266_DemoRequests_Public_PII_Exposure.md` (partial investigation recorded).
Next gate = INVESTIGATION: `grep -rn "demo-requests\|/quotes\|contact-messages" frontend/src` to see whether `/leads` (LeadsView) calls these public routes or the gated `/api/cms/leads`. If it uses the public ones, the fix needs a frontend header change too. Then IA → Plan → ask `approved CR-266`. **Do not fix without approval, even though it is P0.** Owner may say `fast-track CR-266`.

### IMPLEMENTATION (built, never QA'd/closed)
- **CR-259** DemoBottomSheet — code exists (`frontend/src/components/site/DemoBottomSheet.jsx` + LP pages carry `CR-259` comments) but register still 🔲 and no QA record. Needs QA gate (R-20…R-23, screenshot at mobile viewport) then closure. **CR-261** ("auto-close after 259") must be re-checked at the same time.
- **CR-201** React #418 ConsentBanner — register says PARTIAL (mountedRef guard done, remainder open). Plan: `CR-201-204_Line_By_Line_Plan.md`.

### APPROVAL — waiting on owner values (7)
CR-41 (Freshsales label rename), CR-48 (backfill script `backend/scripts/cr48_backfill_wiped_cf.py` — DB write, needs explicit approval), CR-65 (status rename), CR-240 (city count 75/100+/60+), CR-241 (go-live 24h/48h), CR-245 (Petpooja "1.5 lakh" sentence), CR-249-related nothing pending.

### OWNER-ACTION (11) — no code
CR-45 Freshsales Journey · CR-104 HSTS/CSP Cloudflare · CR-145/146 beta subdomain canonical/robots · CR-151 negative keywords · CR-186 Cloudflare RUM · CR-200 prod deploy (now superseded by R0 — propose closing) · CR-216 GTM unified Google tag (steps 2–3) · CR-253/254 Freshsales admin · CR-263 Calendly signing key.
Also owner-side but tracked under older CRs: **Nginx `/leads` 404** (CR-79) — fixed config drafted at `/app/memory/mygenie_nginx_fixed.conf`: change `try_files $uri $uri/index.html =404;` → `try_files $uri $uri/index.html /index.html;`, reload Nginx. Verified still 404 on 2026-09-13.

### INTAKE (21) — includes
CR-266 (P0), CR-267 (`.gitignore`), CR-88/89/94/99/102/105/107/108/110 (content/SEO backlog), CR-144, CR-150, CR-172 (blocked on review source), CR-221/222 (register rows say open; header says closed — matrix trusts rows; owner may want to close), CR-236, CR-239-batch leftovers (CR-242/243/244/246 are LEGACY-CLOSED per D-2), CR-252 (Cloudflare purge step), CR-256/257/258/260.

### REOPENED-UNVERIFIED (1)
CR-197 `/restaurant-pos-comparison` TBT — needs a Lighthouse run to re-close.

### CLOSURE (1)
CR-265 — closes when owner acknowledges the retro record.

---

## 4. Governance steps remaining (owner's original 8-step plan)

| Step | Status |
|---|---|
| 1 Baseline | ✅ signed off |
| 2 Registry/intake rules + templates | ✅ written — **owner review pending** |
| 3 Impact-analysis rules | ✅ covered in `GATES.md` Gate 2 + template 03 |
| 4 Planning & approval | ✅ covered in Gates 3–4 + template 04 |
| 5 Implementation control + **`scripts/gov/gov_check.py`** | ❌ **NEXT** — spec below |
| 6 QA / regression / closure | ✅ `REGRESSION_SUITE.md` + Gate 6–7 + template 05 |
| 7 Traceability matrix | ✅ generated; approvals log section is empty until first gated CR |
| 8 Enforcement (session-start ritual) | partial — rules written; script missing |

### Spec for `gov_check.py` (Step 5) — owner approved "script + docs"
Read-only. Exit non-zero on violations. Checks:
1. **Artefact-per-gate:** for every matrix row, the state's required artefact exists (IMPACT → `CR-n_ImpactAnalysis*.md`; PLAN → `*Line_By_Line_Plan*.md`; APPROVAL/IMPLEMENTATION/QA/CLOSURE → `## Approval` block containing `approved CR-n` verbatim in the CR doc; CLOSURE with production target → row in `RELEASES.md`).
2. **Untracked code changes:** `git log <baseline-commit>..HEAD --name-only` and `git status --short` for `backend/*.py`, `frontend/src/**`, `frontend/scripts/**`, `frontend/public/**`, `*.env`, `.gitignore` — every touched file must map to a CR whose commit message starts with `CR-n:` and whose state ≥ IMPLEMENTATION. Baseline commit = `900ce42`.
3. **Register vs matrix drift:** a CR in register not in matrix or vice-versa.
4. **Overrides hygiene:** every `overrides.json` entry has a note containing `D-` or a date.
5. **Env drift:** `frontend/.env` missing `REACT_APP_WHATSAPP_ENABLED=false` → warning (owner decision CR-249).
6. Print a one-screen summary the agent pastes to the owner at session start.
Writing the script itself is a change under governance → raise it as **CR-268** (type: docs/tooling), get `approved CR-268`, then build. Same for any edit to `GATES.md`/`AGENT_RULES.md`.

---

## 5. Known traps (learned this session)

- **Build hashes differ for env reasons, not code reasons.** `REACT_APP_BACKEND_URL` and `REACT_APP_WHATSAPP_ENABLED` are baked in at build time. Zip `8907c40f`, preview `e9f67272`, prod `b23cd364` were all the same frontend source. Always record commit + env with a hash.
- **"whatsapp" in HTML ≠ FAB.** Marketing copy mentions WhatsApp. Test with `grep -c 'whatsapp-fab'`.
- **Register has duplicate rows per CR with different statuses.** Never trust a single table; the matrix is the truth. New CRs go in the register (latest batch section) AND get a matrix row via `overrides.json` + rebuild.
- **`frontend/build/` gets wiped by platform restores.** Not a bug in the repo. Don't "fix" it silently.
- **`.env` untracked but not ignored** (CR-267). Never `git add .`; the platform handles commits.
- **Handover claimed 71 leads without CRM id; real number is 26 of 72.** Always re-query.
- The testing agent's earlier "ROI calculator 404" was a false positive (route is `/roi`).
- Owner answers questions **one at a time** with lettered options and short replies ("B", "a", "C"). Ask that way.

---

## 6. Files created / modified this session

**Created**
- `/app/memory/governance/{README,GATES,AGENT_RULES,REGRESSION_SUITE,RELEASES,TRACEABILITY_MATRIX,BASELINE_2026-09-13,REGISTER_RECONCILIATION_2026-09-13}.md`
- `/app/memory/governance/templates/{01_INTAKE,02_INVESTIGATION,03_IMPACT_ANALYSIS,04_LINE_BY_LINE_PLAN,05_QA_CLOSURE}.md`
- `/app/memory/CR-265_DemoRequests_500_Probe_Filter.md`, `/app/memory/CR-266_DemoRequests_Public_PII_Exposure.md`, `/app/memory/CR-LEGACY_Retro_Register_CR1-68_CR117-123.md`
- `/app/scripts/gov/build_matrix.py`, `/app/scripts/gov/overrides.json`
- this file

**Modified (append-only)**
- `/app/memory/CR_INTAKE_REGISTER.md` — header line + BATCH BE (CR-265/266/267)
- `/app/memory/PRD.md` — governance section + decisions

**Not modified:** any code, config, `.env`, DB, build. Zero functional change this session.

---

## 7. First message to send the owner next session (fill in live values)
> Session start per AGENT_RULES. Services: backend RUNNING, frontend DOWN (build wiped, per your D-5). Prod hash `main.b23cd364.js` = R0. Open P0: CR-266 (3 public lead endpoints) at INTAKE. Governance Step 2 docs await your review; Step 5 (`gov_check.py`) needs CR-268 approval. `git status`: no code files changed since baseline. What would you like to work on?
