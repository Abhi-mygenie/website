# GTM Batch — Combined Plan: CR-216 + CR-220 A+C + CR-221/222
# One GTM Session, One Publish

**Date:** 2026-09-08
**Container:** Web GTM — `GTM-K5D84Z3L`
**Priority:** P0 (CR-220) + P1 (CR-216, CR-221/222)
**Who does this:** Owner / GTM editor (no code changes — all GTM dashboard)
**Prerequisite:** CR-220 Fix B (user_data in dataLayer) is already DONE in the build

---

## What Each CR Is

| CR | Problem | Fix | Type |
|---|---|---|---|
| **CR-216** | GTM loads 3 separate Google scripts — 524KB / 645ms blocking | Replace separate GA4+Ads base tags with unified Google Tag | GTM config |
| **CR-220 Fix A** | GA4 tag not forwarding user_data to server container → EC Path B broken | Create `dlv - user_data` variable + attach to GA4 Book demo tag | GTM config |
| **CR-220 Fix C** | GAds tag EC mode "Automatic" scans empty DOM (React unmounts inputs) | Switch "GAds - Book Demo" tag EC mode → Code, use same variable | GTM config |
| **CR-221/222** | Google Ads Remarketing pings failing — root cause unconfirmed | After CR-216 publish, test if race condition resolved; escalate if not | Investigation |

---

## Why Batch Together

1. **Same container** — All changes live in GTM-K5D84Z3L. One Publish covers all.
2. **CR-216 + CR-220 target different tags** — no conflict (see tag taxonomy below).
3. **CR-221/222 may self-resolve via CR-216** — consolidating the gtag library eliminates the initialisation race condition (Cause B) that's one of the top suspects for the failing remarketing pings.
4. **Test once together** — GTM Preview test covers all 4 changes in one form submission.

---

## Tag Taxonomy — What Touches What

```
GTM Container: GTM-K5D84Z3L
│
├── BASE LIBRARY TAGS (fire on All Pages — load gtag.js)
│   ├── "Google Analytics 4 Configuration" tag  ← CR-216: REPLACE this
│   └── "Google Ads Conversion Linker" tag       ← CR-216: REPLACE this
│   (both replaced by one "Google Tag" — saves 179KB)
│
├── EVENT / CONVERSION TAGS (fire on specific triggers)
│   ├── "GA4 - Book demo" tag                   ← CR-220 Fix A: EDIT this
│   └── "GAds - Book Demo" tag                  ← CR-220 Fix C: EDIT this
│
├── REMARKETING TAG
│   └── "Google Ads Remarketing" tag (AW-16740091756)  ← CR-221/222: INVESTIGATE
│
└── VARIABLES
    └── NEW: "dlv - user_data"                  ← CR-220 Fix A: CREATE this
```

CR-216 and CR-220 touch **different tags** — zero conflict.

---

## Step-by-Step GTM Session

Open: `tagmanager.google.com` → Container: GTM-K5D84Z3L → Workspace

---

### STEP 1 — CR-216: Create Unified Google Tag (replaces 2 separate tags)

**Why first:** Sets up the shared library foundation. GA4+Ads will reuse one gtag.js file.

#### 1a — Create the new unified Google Tag

```
Tags → New
  Tag type:    Google Tag
  Tag name:    "Google Tag - G-KWHHFEZ5Q3"
  Tag ID:      G-KWHHFEZ5Q3

  (Optional) Configuration parameters:
    ads_data_redaction = true     (EEA compliance)

  Trigger:     All Pages
  Save
```

#### 1b — Pause (not delete) the old separate base tags

```
Tags → find "Google Analytics 4 Configuration" tag
  → Click ⋮ menu → Pause

Tags → find "Google Ads Conversion Linker" tag (or similar name loading AW-16740091756 as base config)
  → Click ⋮ menu → Pause
```

⚠️ **Pause, do not delete yet** — verify in Preview first before removing.

**Why this saves 179KB:** Previously GA4 and Google Ads each loaded their own copy of the `gtag.js` library (188KB + 179KB = 367KB). The unified Google Tag loads it once (188KB) and both products share it.

---

### STEP 2 — CR-220 Fix A: Create User-Provided Data Variable

**Why:** Gives GTM a way to read the `user_data` object from the dataLayer event. Used by both Fix A (GA4 tag) and Fix C (GAds tag) — create it once, use twice.

```
Variables → New → Variable Configuration
  Type:    User-Provided Data
  Name:    dlv - user_data

  Configuration:
    ☑ Use Data Layer Variable
    Data Layer Variable Name:   user_data

  Save
```

**What `user_data` contains (already baked into the build via CR-220 Fix B):**
```js
user_data: {
  email_address: "rajesh@example.com",   // normalized, lowercase
  phone_number: "+919876543210",         // E.164 format
  address: {
    first_name: "Rajesh",
    last_name: "Kumar",
  }
}
```

---

### STEP 3 — CR-220 Fix A: Edit "GA4 - Book demo" Tag

**Why:** GA4 event sent to Google's server must carry `user_data` so the Stape server-side container (GTM-KN4B3Q2H) can extract Enhanced Conversions data and forward it to Google Ads.

```
Tags → "GA4 - Book demo"
  Scroll to: "User-Provided Data" section
    (a DEDICATED section, separate from Event Parameters table)
  Set value:   {{dlv - user_data}}

  Save
```

**Result:** GA4 event payload now includes hashed email + phone + name → server-side sgtmadsct tag forwards EC data to Google Ads → Path B Enhanced Conversions works.

---

### STEP 4 — CR-220 Fix C: Edit "GAds - Book Demo" Tag

**Why:** "Automatic" EC mode scans the DOM at conversion time. React's stage machine unmounts all form inputs before the conversion fires (OTP stage replaces the form stage). Google scans the DOM, finds nothing, sends empty EC. Switching to "Code" reads directly from the `user_data` object instead.

```
Tags → "GAds - Book Demo"   (client-side Google Ads conversion tag)
  Scroll to: "Enhanced conversions" section
    Current:   ● Automatic
    Change to: ● Code  (also labelled "In-page code" in older GTM versions)

  User-Provided Data:   {{dlv - user_data}}   ← same variable from Step 2

  Save
```

**Result:** Google Ads tag reads email/phone/name from `user_data` (captured when the form was visible) — no DOM scan needed, EC data always present regardless of which React stage is visible.

---

### STEP 5 — CR-221/222: Check Remarketing Tag

**While in GTM, inspect the remarketing tag to diagnose the failing pings:**

```
Tags → find "Google Ads Remarketing" tag  (fires AW-16740091756)

Check:
  1. Trigger: what event fires this tag? (should be "All Pages" or "DOM Ready")
     → If trigger is "All Pages (gtm.js)" and CR-209 defer is active, tag may fire
       before the gtag library is ready → race condition → POST fails

  2. Tag type version: is it the latest "Google Ads Remarketing" tag type?
     → Old tag type = fires rmkt/collect endpoint (may be deprecated)
     → New tag type = fires a different endpoint

  3. Conversion ID: confirm it's 16740091756 (not a different/old pixel ID)
```

**If Cause B (race condition) is confirmed:**
```
Tags → "Google Ads Remarketing"
  Trigger:  change from "All Pages (gtm.js)" → "All Pages (DOM Ready)"
            or add condition: "gtm.start fires AFTER gtag library loads"
  Save
```

**Alternatively:** After STEP 1 (CR-216 unified Google Tag), the race condition may already be resolved — the unified tag initialises both GA4 and Ads in one go. Test in Preview before making additional changes.

---

### STEP 6 — GTM Preview Test (before publishing)

```
GTM → Preview
  → URL: https://beta.mygenie.online  (or www.mygenie.online)
  → Open the page in preview mode
  → Accept cookie banner (required for ad_storage: granted)
  → Fill Book Demo form with REAL email + phone (needed for hash match)
  → Complete OTP
```

**In the Debug panel after OTP verified, check these 4 things:**

```
CHECK 1 — "thankyou_conversion" event fires?
  → Click event in left panel → Tags tab
  → "GA4 - Book demo" listed as FIRED (not Blocked/Not Fired)
  PASS ✅ / FAIL ❌

CHECK 2 — GA4 tag has user_data populated?
  → Click "GA4 - Book demo" tag in debug panel
  → Expand "User Data" or "User-Provided Data" section
  → Should show hashed values (not empty/null)
  PASS ✅ / FAIL ❌

CHECK 3 — GAds tag shows EC data?
  → Click "GAds - Book Demo" tag in debug panel
  → Expand "Enhanced Conversions" section
  → Should show hashed email + phone (not empty)
  PASS ✅ / FAIL ❌

CHECK 4 — Google Tag (new) fires on page load?
  → Click "gtm.js" event (page load)
  → Tags tab → "Google Tag - G-KWHHFEZ5Q3" = FIRED
  → Old separate "GA4 Configuration" + "Ads Conversion Linker" = PAUSED/Not Fired
  PASS ✅ / FAIL ❌
```

**Also check remarketing:**
```
CHECK 5 — Remarketing tag fires? Any error in debug panel?
  → "Google Ads Remarketing" tag in page load events
  → Note: if PAUSED (from CR-216), check it fires under unified Google Tag instead
  PASS ✅ / FAIL ❌ / INVESTIGATE
```

---

### STEP 7 — Publish

All 4 checks PASS → **Submit → Publish**

```
Version name:  "CR-216 + CR-220 A+C — Unified Google Tag + Enhanced Conversions"
Version notes: "Consolidate GA4+Ads into unified Google Tag (−179KB).
                Add user_data EC variable to GA4 Book demo tag (Fix A).
                Switch GAds Book Demo tag EC mode Automatic→Code (Fix C).
                Ref: CR-216, CR-220 A+C"
```

---

### STEP 8 — Post-Publish Monitoring

#### Same day
```
Google Ads → Conversions → "Book demo"
  → "Last ping date" should update to today within ~2 hours
```

#### 24–72 hours
```
Google Ads → Conversions → "Book demo" → Enhanced Conversions tab
  → "Implement in-page code in addition to Automatic" warning → should clear
  → Status → should change from "Needs attention" to normal
  → Enhanced Conversions coverage % → should appear/increase
```

#### Remarketing (CR-221/222)
```
Google Ads → Tools → Audience Manager → Audience sources → Website tag
  → Check: "Recording activity" vs "No recent activity"
  → If still failing: check Network tab on www.mygenie.online for actual HTTP status
    of rmkt/collect POST (403? 404? CORS?)
  → If 404: old endpoint deprecated → recreate tag in GTM with latest tag type
```

---

## If Any Check Fails in Preview

| Failure | Likely cause | Fix |
|---|---|---|
| CHECK 2: GA4 tag user_data empty | Variable name typo; or user_data not in build | Verify `dlv - user_data` reads key `user_data` exactly; verify CR-220 Fix B is in build |
| CHECK 3: GAds EC section empty | Same variable not attached to GAds tag | Re-check Step 4 — confirm `{{dlv - user_data}}` set in Enhanced Conversions field |
| CHECK 4: Old tags still firing | Paused tags not recognised | Check old tag trigger is truly paused; if firing, delete instead of pause |
| CHECK 5: Remarketing still failing | Race condition or account issue | Try changing trigger to DOM Ready; check Google Ads Audience Manager |

---

## Rollback

```
GTM → Versions → select previous published version → Re-publish
This reverts all 4 changes at once. Zero impact on conversion counting (cookies still work).
```

---

## Summary Table

| Step | CR | Action | Where |
|---|---|---|---|
| 1a | CR-216 | Create "Google Tag - G-KWHHFEZ5Q3" | GTM → Tags → New |
| 1b | CR-216 | Pause old "GA4 Configuration" + "Ads Conversion Linker" tags | GTM → Tags |
| 2 | CR-220 Fix A | Create variable "dlv - user_data" (User-Provided Data type) | GTM → Variables → New |
| 3 | CR-220 Fix A | Edit "GA4 - Book demo" → set User-Provided Data = `{{dlv - user_data}}` | GTM → Tags |
| 4 | CR-220 Fix C | Edit "GAds - Book Demo" → EC mode Automatic→Code + same variable | GTM → Tags |
| 5 | CR-221/222 | Inspect remarketing tag trigger + tag type; fix if needed | GTM → Tags |
| 6 | All | Preview test — 5 checks | GTM → Preview |
| 7 | All | Submit + Publish with version notes | GTM → Submit |
| 8 | All | Monitor Google Ads console + remarketing 24-72h | Google Ads |

**Total GTM actions: 1 new variable, 3 tag edits (+ possible 1 remarketing tag fix), 1 Preview, 1 Publish**

---

*Plan written 2026-09-08. CR-220 Fix B (user_data in code) already shipped in current build.*
*All other steps are GTM dashboard — no code change, no rebuild required.*
