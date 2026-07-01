# CR-33 — Owner GTM Action Brief (`fbc` Wireup)

**Use this checklist to wire `fbc` end-to-end after the code change has shipped.**

**Estimated time:** 10–15 minutes total
**Containers to update:** 2 (web container `GTM-K5D84Z3L` + server container `GTM-KN4B3Q2H`)
**Pre-requisite:** Code change in `frontend/src/lib/gtm.js` is LIVE (✅ shipped 2026-06-27 as part of CR-33 G3)

---

## ✅ Pre-flight Verification (1 min)

Before touching GTM, confirm the code change is live in production:

1. Open Chrome → `https://www.mygenie.online`
2. **F12** → Console tab
3. Submit a real demo form
4. In Console, type: `dataLayer.find(d => 'fbc' in d)`
5. Press Enter

**Expected:** Returns an object with `fbc: "fb.1.xxxxx.yyyyy"` (if you arrived via a Meta ad URL containing `fbclid`) or `fbc: null` (direct/organic traffic).

**If you see `undefined`** — code change hasn't deployed yet; wait a few minutes and re-test before continuing.

---

## 📦 Part 1 — Web Container (`GTM-K5D84Z3L`) — 5 min

### Step 1.1 — Create the `fbc` Data Layer Variable

1. Open **Variables** in left nav
2. **User-Defined Variables** → **New**
3. **Variable Title (top):** `fbc`
4. Click **Variable Configuration** → choose **Data Layer Variable**
5. Configure:

| Field | Value |
|---|---|
| **Data Layer Variable Name** | `fbc` *(plain — no braces!)* |
| **Data Layer Version** | Version 2 |
| **Set Default Value** | unchecked |

6. **Save**

### Step 1.2 — Add `fbc` Event Parameter to all 3 GA4 Event Tags

For **each** of these tags, open them and add **one new Event Parameter row**:

| Tag Name | Trigger | New Row to Add |
|---|---|---|
| **`GA4 - Book demo`** | Book demo | Event Parameter: `fbc` · Value: `{{fbc}}` |
| **`GA4 - OTP Verified`** | lead_verified | Event Parameter: `fbc` · Value: `{{fbc}}` |
| **`GA4 - Book Appointment`** | calendly Trigger | Event Parameter: `fbc` · Value: `{{fbc}}` |

⚠️ **Important:**
- Left column (Event Parameter) = `fbc` (plain text, no braces)
- Right column (Value) = `{{fbc}}` (WITH braces — it's a variable reference)

After updating each tag → **Save**

### Step 1.3 — Validate + Publish Web Container

1. Top-right → **Validate Workspace** → should show **zero errors**
2. Top-right → **Submit**
3. Version name: `CR-33 - Add fbc Event Parameter to GA4 conversion tags`
4. **Publish**

---

## 🖥 Part 2 — Server Container (`GTM-KN4B3Q2H`) — 5 min

### Step 2.1 — Create the `fbc` Event Data Variable

1. Open **Variables** in left nav
2. **User-Defined Variables** → **New**
3. **Variable Title (top):** `fbc`
4. Click **Variable Configuration** → choose **Event Data**
5. Configure:

| Field | Value |
|---|---|
| **Key Path** | `fbc` *(plain — no braces!)* |
| **Default Value** | leave blank |

6. **Save**

### Step 2.2 — Wire `fbc` into the Facebook Conversion API Tag

1. Open **Tags** → click **Facebook Conversion API** tag
2. Find the **userDataList** field (the table with rows like `{name: "em", value: ...}`, `{name: "ph", value: ...}`, etc.)
3. Click **Add Row** at the bottom
4. Fill the new row:

| Field | Value |
|---|---|
| **name** | `fbc` |
| **value** | `{{fbc}}` |

5. **Save**

### Step 2.3 — Validate + Publish Server Container

1. Top-right → **Validate Workspace** → should show **zero errors**
2. Top-right → **Submit**
3. Version name: `CR-33 - Add fbc to Facebook CAPI userDataList`
4. **Publish**

---

## 🧪 Part 3 — Verify End-to-End (3 min)

### Test 3.1 — Server Container Preview

1. Server container → **Preview**
2. In a separate tab, submit a demo form on `https://www.mygenie.online`
3. In Tag Assistant → click the incoming event
4. **Event Data** tab → confirm `fbc` row is present (value = `"fb.1.xxxxx"` or `null` for non-Meta traffic)
5. Click **Facebook Conversion API** tag → **Tag Details** → expand **userDataList**
6. **Confirm:** New row `{name: "fbc", value: "..."}` appears alongside `em`, `ph`, `fn`, `ln`, `ct`

### Test 3.2 — Meta Test Events (Most Authoritative)

1. **Meta Events Manager** → your dataset → **Test Events** tab
2. Copy the test event code (e.g. `TEST12345`)
3. Open `https://www.mygenie.online/?fbclid=ABCDEF123&test_event_code=TEST12345` *(the `fbclid` ensures `_fbc` cookie is set, simulating a real ad click)*
4. Submit a form
5. Within 30 sec, the event appears in Test Events
6. Click the event → **Customer Information**
7. **Confirm:** "Click ID (fbc)" is listed alongside Email, Phone, First Name, Last Name, City, Browser ID

### Test 3.3 — Cookie-less Traffic (Sanity Check)

1. Open `https://www.mygenie.online` in **incognito** (no `fbclid` in URL)
2. Submit a form
3. In server container Preview → Event Data tab → `fbc` should be `null` (or row absent)
4. CAPI tag should still fire successfully (200 OK) — Meta accepts events without `fbc` from non-attributed traffic

---

## 📊 Part 4 — Monitor Match Quality Lift (24–72 hours)

After publishing both containers, **wait 24–72 hours** then check:

1. **Meta Events Manager** → Datasets → Book demo → **Event match quality**
2. Scroll to **Click ID (fbc)** row
3. **Coverage should climb** from current ~50% → ~80%+ for Meta-attributed events
4. **EMQ score** should lift by +0.5 to +0.7 points

If coverage doesn't climb after 72 hours:
- Verify both containers published the right versions (GTM → Versions tab → confirm CR-33 versions are LIVE)
- Re-run Test 3.1 to confirm `fbc` is reaching server
- Check for ad-blocker / consent issues blocking `_fbc` cookie creation

---

## 🚨 Rollback (If Anything Breaks)

If CAPI events start failing or match quality drops:

### Code rollback (5 sec)
Ask dev to `git revert` the CR-33 commit on `gtm.js`. `fbc` reverts to `undefined` in dataLayer → GTM gracefully sends `null` → CAPI continues working with prior 4 user_data fields.

### GTM rollback (2 clicks per container)
1. Each container → **Versions** tab
2. Find the previous published version (just before CR-33)
3. Click **Publish to live**
4. Both Meta CAPI tag and GA4 tags revert to pre-CR-33 state instantly

**No data loss. No production downtime.**

---

## ✅ Completion Checklist

| Step | Done |
|---|---|
| Pre-flight: `fbc` visible in browser dataLayer | ☐ |
| Web container: `fbc` DLV created | ☐ |
| Web container: `fbc` added to `GA4 - Book demo` | ☐ |
| Web container: `fbc` added to `GA4 - OTP Verified` | ☐ |
| Web container: `fbc` added to `GA4 - Book Appointment` | ☐ |
| Web container: Validated + Published | ☐ |
| Server container: `fbc` Event Data variable created | ☐ |
| Server container: `fbc` added to CAPI userDataList | ☐ |
| Server container: Validated + Published | ☐ |
| Server Preview test passed (Test 3.1) | ☐ |
| Meta Test Events shows `Click ID (fbc)` (Test 3.2) | ☐ |
| Cookie-less traffic still works (Test 3.3) | ☐ |
| 48–72hr later: EMQ + fbc coverage lift confirmed | ☐ |

---

## 📞 Questions?

Reach out if any step is unclear. The code-side is done; this entire wireup is config-only in GTM. If a step fails, screenshot the error and we'll triage.
