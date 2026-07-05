# CR-7 — Internal Leads View (read-only sales triage) — INTAKE & DISCOVERY (G1)

> Status: **G1 — Discovery only (captured 2026-06-08).** No build, no commitment yet. This doc records
> the intake so the next planning pass (G2) can scope it. Owner-requested as a "note it as a new CR".

---

## 1. Intake — what was asked
A lightweight **internal, read-only leads view** so the sales team can triage incoming website leads at a
glance — **without opening Freshsales**. Each lead row would surface the high-signal fields we now capture:
- **Source / Medium / Campaign** (first-touch + last-touch, gclid/fbclid)
- **City** (typed or geo-IP)
- **OTP status** (verified vs OTP-Unverified)
- **Intent / form type** (Demo, Quote/Buy, ROI, Contact) + plan/total where relevant
- Name, phone, created-at, Freshsales contact id (link out)

**Why:** triage high-intent leads fast — e.g. "phone-verified + paid source (gclid) + Buy intent" should jump
the queue. Today that requires digging through Freshsales.

## 2. Data already available (no new capture needed)
All of this is **already persisted in MongoDB** by CR-1b / CR-2 / CR-4B:
- `demo_requests`, `quotes`, `contact_messages` collections
- per-lead: `attribution{}` (utm first/last, gclid, fbclid, device/os/browser, landing/referrer, pages/time),
  `geo{}` (city/region/country), `otp_verified` (demo), plan/billing/addons/total (quote),
  ROI numbers (in `source_page`), `freshsales_contact_id`, `created_at`.
→ CR-7 is essentially a **read/aggregate + UI** layer over existing data. No schema changes expected.

## 3. Open questions (must answer to exit G1 → G2)
1. **Access / auth** — reuse the existing **CMS JWT login** (`admin`/`editor`) and mount at `/cms/leads`?
   Or a separate protected route? (Reusing CMS auth = fastest, no new auth surface.)
2. **Scope of read** — all 3 collections in one unified table, or tabs per form type?
3. **Filters/sort** — which matter most: OTP-verified only, paid-source only (has gclid/fbclid), by city,
   by date range, by intent? Default sort = newest first.
4. **Actions** — purely read-only, or allow light actions (mark contacted, export CSV, open-in-Freshsales link)?
5. **Volume / pagination** — expected lead volume/day → server-side pagination + search needed?
6. **PII / who can see** — any fields to mask (phone/email) for certain roles? (CMS today has 2 fixed users.)

## 4. Proposed approach (high level — for G2, not committed)
- **Backend:** new read-only endpoints behind `cms_auth.get_current_admin`, e.g.
  `GET /api/cms/leads?type=&verified=&paid=&q=&page=` → normalised, paginated lead rows merged across the
  3 collections (projection of the high-signal fields). No writes.
- **Frontend:** a protected page (reuse CMS auth/session) with a filterable table + summary chips
  (today's leads, % OTP-verified, % paid-source). data-testids throughout.
- **Effort estimate (rough):** small-to-medium — 1 backend aggregate endpoint + 1 table page. No new
  integrations, no new data capture.

## 5. Gates
- [x] **G1 Discovery** — this doc (intake captured).
- [ ] **G2 Planning** — answer §3 open questions, lock scope (auth, filters, actions, pagination).
- [ ] **G3 Build** · [ ] **G4 QA** · [ ] **G5 Owner smoke**.

## 6. Dependencies / notes
- Depends on nothing new — all data is already captured (CR-1b/CR-2/CR-4B). Safe to build any time after G2.
- Natural follow-on: a "high-intent" score (verified + paid-source + buy-intent) for auto-prioritisation.
