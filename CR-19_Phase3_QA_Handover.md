# CR-19 Phase 3 — Ad Spend Upload & Cost Metrics: QA Handover

**Date:** 2026-06-24  
**Status:** Implemented & backend-tested  
**Feature:** Upload Google Ads / Meta Ads CSV cost reports → view CPL, CP Demo Scheduled, CP Demo Given, CP Won in the Lead Funnel dashboard  

---

## Pre-requisites

- App URL: see `REACT_APP_BACKEND_URL` in `/app/frontend/.env`
- CMS login: `admin` / `admin123`
- Navigate to: **CMS Admin → Leads & Funnel tab**
- Test files available at:
  - Meta CSV: `https://customer-assets.emergentagent.com/job_full-stack-deploy-104/artifacts/gjetllhe_Untitled-report-Jun-23-2025-to-Jun-23-2026.csv`
  - Google CSV: `https://customer-assets.emergentagent.com/job_full-stack-deploy-104/artifacts/kg5phwkq_Campaign%20report%20%282%29.csv`

---

## Feature Overview

### What was built
1. **Ad Spend Upload component** (bottom of Leads & Funnel page) — upload Google Ads or Meta Ads Manager CSV exports
2. **Upload history** — shows all past uploads with total spend, period, filename and delete button
3. **Cost metrics in Performance by Source table** — 5 new columns: Spend, CPL, CP Sched, CP Demo, CP Win
4. **Totals row** — aggregates cost metrics across all paid sources

### Data flow
```
Upload CSV → Backend parses (auto-detects Google/Meta) → Stores in MongoDB ad_spend + ad_spend_uploads
→ Funnel by-source API aggregates spend per source → Frontend table shows cost columns
```

---

## Test Cases

### TC-01: Meta CSV Upload (Happy Path)
**Steps:**
1. Log into CMS, navigate to Leads & Funnel
2. Scroll to "Ad Spend Upload" section
3. Select platform: **Auto-detect**
4. Choose file: download Meta CSV from URL above
5. Verify preview appears showing ~18 campaign rows + total spend
6. Click **Confirm & Save**

**Expected:**
- Preview table shows Campaign, Ad Set, Spend (INR) columns
- Total shown as ₹ in Indian format (e.g., ₹8,23,833)
- After confirm: history row appears: `Meta  2025-06-23 – 2026-06-23  ₹8,23,833  18 rows`
- Performance by Source table → Meta row shows Spend + CPL + CP Sched + CP Demo + CP Win filled
- No cost data shown for Website and Chat rows (shows `—`)

---

### TC-02: Google CSV Upload (Happy Path)
**Steps:**
1. Select platform: **Auto-detect** (or Google Ads)
2. Enter Reporting period: From `2025-06-23` To `2026-06-23`
3. Choose file: download Google CSV from URL above
4. Verify preview shows 3 campaign rows (after filtering zero-spend rows)
5. Click **Confirm & Save**

**Expected:**
- Preview shows 3 rows: AK: Search | MyGenie, AK: Leads | Search | 19 Nov | Alpha, AK: Search | Competitors
- Total = ₹10,178
- History row: `Google  2025-06-23 – 2026-06-23  ₹10,178  3 rows`
- Performance table → Google row shows all 4 cost columns filled

---

### TC-03: Cost Metrics Accuracy
**After uploading both CSVs, verify these exact values in the Performance by Source table:**

| Source | Lead In | Spend | CPL | CP Sched | CP Demo | CP Win |
|---|---|---|---|---|---|---|
| Google | 199 | ₹10,178 | ₹51 | ₹185 | ₹192 | ₹536 |
| Meta | 772 | ₹8,23,833 | ₹1,067 | ₹5,214 | ₹5,843 | ₹15,843 |
| Website | 6 | — | — | — | — | — |
| Chat | 2 | — | — | — | — | — |

> Note: Google spend in the sample file covers only 3 days (Jun 21-23, 2026) — cost per lead will be unrealistically low. QA just needs to verify the maths are correct, not the business value of the numbers.

**Formula check (manual):**
- Meta CPL = 823,833 ÷ 772 = 1,067 ✓
- Meta CP Sched = 823,833 ÷ 158 = 5,214 ✓
- Meta CP Demo = 823,833 ÷ 141 = 5,843 ✓
- Meta CP Win = 823,833 ÷ 52 = 15,843 ✓

---

### TC-04: Upload History Display
**Steps:**
1. After both uploads, scroll to Upload History
2. Verify both uploads listed with correct details
3. Click collapse toggle → history hides
4. Click again → history shows

**Expected:**
- Both Google and Meta rows in history
- Each shows: platform, period, total spend, row count, filename
- Toggle works (ChevronUp/Down icon)

---

### TC-05: Delete Upload
**Steps:**
1. In Upload History, click the trash icon on the Meta upload
2. Confirm the delete prompt
3. Check Performance by Source table

**Expected:**
- Meta row deleted from history
- Meta Spend, CPL, CP Sched, CP Demo, CP Win all revert to `—`
- Google row still shows cost data unaffected
- Re-upload Meta CSV to restore

---

### TC-06: Google CSV Without Period Dates
**Steps:**
1. Select platform: Google Ads (or Auto-detect)
2. Leave period dates blank
3. Upload Google CSV

**Expected:**
- Backend returns 400 error: "period_start and period_end are required for Google Ads CSV"
- UI shows red error message under file input

---

### TC-07: Invalid / Wrong File
**Steps:**
1. Try uploading a non-CSV file (e.g., a .png or a random .txt)
2. Try uploading a CSV with no recognisable columns

**Expected:**
- Error message: "Unrecognised CSV format — could not detect Google Ads or Meta platform"

---

### TC-08: Discard Preview
**Steps:**
1. Select and upload a valid CSV (preview appears)
2. Click **Discard** instead of Confirm

**Expected:**
- Preview disappears
- No row added to history
- File input resets (can upload again)
- No data written to MongoDB (upload is cleaned up on discard)

---

### TC-09: Spend Period Footnote
**After uploading both CSVs:**

**Expected:**
- Below the Performance by Source table: `* Spend data period: 2025-06-23 – 2026-06-23`
- Footnote only appears when spend data is loaded

---

### TC-10: Totals Row
**Expected at bottom of Performance by Source table:**
- Total Lead In = 979 (sum of all sources)
- Total Spend = sum of Google + Meta spend
- Total CPL, CP Sched, CP Demo, CP Win = total spend ÷ total counts across paid sources

---

## API Reference (for backend verification)

```bash
API_URL=<REACT_APP_BACKEND_URL>
TOKEN=$(curl -s -X POST "$API_URL/api/cms/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Upload Meta CSV
curl -X POST "$API_URL/api/cms/ad-spend/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@meta.csv"

# Upload Google CSV (period required)
curl -X POST "$API_URL/api/cms/ad-spend/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@google.csv" \
  -F "period_start=2025-06-23" \
  -F "period_end=2026-06-23"

# View history
curl "$API_URL/api/cms/ad-spend/history" -H "Authorization: Bearer $TOKEN"

# View funnel with cost metrics
curl "$API_URL/api/cms/funnel/by-source" -H "Authorization: Bearer $TOKEN"

# Delete upload
curl -X DELETE "$API_URL/api/cms/ad-spend/{upload_id}" -H "Authorization: Bearer $TOKEN"
```

---

## Known Limitations (not bugs)

| Limitation | Details |
|---|---|
| No date-range filtering of spend | Spend data is always the full upload period. If funnel date filter = "last 3 months" but spend upload = "full year", CPL will be understated. Phase 4 enhancement. |
| Google sample file = 3 days only | The provided test file covers Jun 21-23 only. Google CPL will appear very low (₹51). This is expected for the test file. |
| Meta "Results" column not used | Meta's own lead count is stored but not used for CPL — we use our CRM lead count. This is intentional. |
| No duplicate upload warning | Uploading the same period twice for one source just adds another upload. The most recent one is used. |

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `backend/ad_spend.py` | NEW | CSV parsers for Meta (UTF-8 CSV) + Google (UTF-16 LE, TSV) |
| `backend/server.py` | Edit | 3 endpoints: POST upload, GET history, DELETE |
| `backend/funnel.py` | Edit | `_get_spend_by_source()` + 5 cost fields in `get_funnel_by_source()` |
| `frontend/src/components/funnel/AdSpendUpload.jsx` | NEW | Upload UI + preview + history |
| `frontend/src/components/funnel/FunnelBySource.jsx` | Rewrite | 5 cost columns + totals row + footnote |
| `frontend/src/pages/LeadsView.jsx` | Edit | Mount AdSpendUpload, import |

---

## data-testid Reference

| testid | Element |
|---|---|
| `ad-spend-upload` | Root container |
| `platform-auto` | Auto-detect radio |
| `platform-google` | Google Ads radio |
| `platform-meta` | Meta Ads radio |
| `period-start` | Period start date input |
| `period-end` | Period end date input |
| `ad-spend-file-input` | Hidden file input |
| `ad-spend-file-input-label` | Clickable label |
| `ad-spend-preview` | Preview table container |
| `ad-spend-confirm-btn` | Confirm & Save button |
| `ad-spend-discard-btn` | Discard button |
| `ad-spend-error` | Error message div |
| `toggle-history` | Collapse/expand history button |
| `ad-spend-history` | History list container |
| `delete-upload-{id}` | Delete button per upload |
| `funnel-by-source-table` | Main source table |
| `funnel-source-row-{source}` | Row per source (google_paid, meta, etc.) |
| `cpl-{source}` | CPL cell per source |
| `cpwin-{source}` | CP Win cell per source |
