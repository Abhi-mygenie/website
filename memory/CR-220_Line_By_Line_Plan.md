# CR-220 — Line-by-Line Implementation Plan (Revised)
# Enhanced Conversions: Three-Part Fix

**CR:** CR-220
**Date revised:** 2026-09-05
**Status:** Ready to implement
**Risk:** Zero — Fix B is additive only (no keys removed, no visual change). Fix A + C are GTM config only.
**Scope:**
  - **Fix B (code):** 1 file · 2 search_replace calls · 1 rebuild
  - **Fix A (GTM):** 1 new GTM variable · 1 tag edit
  - **Fix C (GTM):** 1 tag edit (reuses variable from Fix A)

---

## Context — Why Three Fixes

| Fix | What it solves | Who does it | Rebuild? |
|---|---|---|---|
| **Fix B** | `user_data` container absent from dataLayer — Path B sGTM has nothing to read | Dev | Yes |
| **Fix A** | GA4 tag in web GTM not forwarding user_data to server container | GTM editor | No |
| **Fix C** | "Automatic" EC mode scans empty DOM (React unmounts inputs before conversion fires) | GTM editor | No |

All three must be done. Order: Fix B first (deploys user_data into dataLayer), then Fix A + Fix C
in the same GTM session (they share the same variable).

---

## Part 1 — Pre-flight Checks

```bash
# 1. Confirm user_data, email_address, phone_number are currently absent (expected: exit code 1, no output)
grep -n "user_data\|email_address\|phone_number" /app/frontend/src/lib/gtm.js
echo "Exit: $?"   # Expected: 1 (not found)

# 2. Confirm current identity block location
grep -n "identity.*Enhanced\|external_id\|lead context" /app/frontend/src/lib/gtm.js
# Expected:
#   196:    // identity (Enhanced Conversions / Advanced Matching) — #1
#   202:    external_id: phone || email || null,
#   203:    // lead context

# 3. Confirm normEmail/normPhone/splitName run BEFORE the return block (values available)
grep -n "normEmail\|normPhone\|splitName" /app/frontend/src/lib/gtm.js
# Expected: lines 192, 193, 194 — all three before line 195 (return {)

# 4. Confirm JSDoc is the exact string to be replaced
sed -n '184,189p' /app/frontend/src/lib/gtm.js
# Expected: 6-line JSDoc block starting with /**
```

---

## Part 2 — Fix B: Code Edits (`src/lib/gtm.js`)

### Edit 1 — Update JSDoc on `buildLeadPayload` (lines 184–189)

**Purpose:** Document the dual-format intent so no future maintainer removes one of the
two formats thinking it's redundant.

**old_str** (exact — 6 lines):
```
/**
 * Single source of truth for the lead conversion payload (mirrors the live-site contract).
 * Best-effort form fields; missing keys -> null (never omitted). Pulls click ids from CR-2.
 * Includes Enhanced Conversions / Advanced Matching fields (email/phone normalized, name split,
 * external_id) so GTM can hash + map them. Hashing happens in GTM — raw values never leave hashed.
 */
```

**new_str:**
```
/**
 * Single source of truth for the lead conversion payload (mirrors the live-site contract).
 * Best-effort form fields; missing keys -> null (never omitted). Pulls click ids from CR-2.
 * Emits identity data in TWO formats (CR-220):
 *   1. Flat keys (email/phone/first_name/last_name) — Meta Advanced Matching + Path A client GAds tag.
 *   2. user_data object — Google Enhanced Conversions server-side path (GA4 → sGTM → sgtmadsct).
 * All identity values normalized before return. Hashing happens in GTM — raw values never leave hashed.
 */
```

**Verification:**
```bash
sed -n '184,191p' /app/frontend/src/lib/gtm.js
# Expected: new 7-line JSDoc with "TWO formats (CR-220)" on line 3
```

---

### Edit 2 — Add `user_data` block inside `buildLeadPayload` return (lines 196–203)

**Purpose:** This is the core fix. Inserts the dedicated `user_data` container immediately
after the flat identity fields. All four required values (`email`, `phone`, `first_name`,
`last_name`) are already computed as local variables on lines 192–194 — no new logic needed.

**Indentation rules (confirmed from source):**
- Function body: 2-space indent
- Return object top-level keys: 4-space indent
- Nested object keys: 6-space indent
- Doubly-nested keys: 8-space indent

**old_str** (exact — 8 lines):
```
    // identity (Enhanced Conversions / Advanced Matching) — #1
    name: form.name || null,
    first_name,
    last_name,
    email,
    phone,
    external_id: phone || email || null,
    // lead context
```

**new_str:**
```
    // identity (Enhanced Conversions / Advanced Matching) — #1
    name: form.name || null,
    first_name,
    last_name,
    email,
    phone,
    external_id: phone || email || null,
    // CR-220: Structured user_data for Google Enhanced Conversions (server-side GA4 → sGTM path).
    // Flat keys above stay unchanged — Meta Advanced Matching + Path A client-side GAds tag read them.
    // Key names follow Google's EC spec exactly. Values already normalized (normEmail / normPhone).
    user_data: {
      email_address: email,
      phone_number: phone,
      address: {
        first_name: first_name || null,
        last_name: last_name || null,
      },
    },
    // lead context
```

**Notes on the values:**
| Field | Source variable | Normalization already applied |
|---|---|---|
| `email_address` | `email` (line 192) | `normEmail()` — lowercase + trim |
| `phone_number` | `phone` (line 193) | `normPhone()` — E.164 format, e.g. `+919876543210` |
| `address.first_name` | `first_name` (line 194) | `splitName()` — first word of name, null if empty |
| `address.last_name` | `last_name` (line 194) | `splitName()` — remaining words, null if single name |

All four are local variables in scope at the point of insertion. Google hashes these values
inside GTM — the raw values never leave the browser hashed.

**Verification:**
```bash
grep -n "user_data\|email_address\|phone_number\|address:" /app/frontend/src/lib/gtm.js
# Expected output (exact lines may shift by a few):
#   203:    user_data: {
#   204:      email_address: email,
#   205:      phone_number: phone,
#   206:      address: {
#   207:        first_name: first_name || null,
#   208:        last_name: last_name || null,
#   209:      },
#   210:    },
```

**Flat keys unchanged (verify Meta + Path A are still intact):**
```bash
grep -n "^    email,$\|^    phone,$\|^    first_name,$\|^    last_name,$" /app/frontend/src/lib/gtm.js
# Expected: 4 matches — all flat keys still in return block
```

---

## Part 3 — Full Post-Edit Structural Validation

Run before rebuilding. All assertions must pass.

```bash
python3 -c "
content = open('/app/frontend/src/lib/gtm.js').read()

# 1. user_data present
assert 'user_data: {' in content, 'FAIL: user_data block missing'
print('user_data block:     PRESENT ✅')

# 2. Correct field names (Google spec)
assert 'email_address: email,' in content, 'FAIL: email_address missing'
assert 'phone_number: phone,' in content, 'FAIL: phone_number missing'
assert 'first_name: first_name || null,' in content, 'FAIL: address.first_name missing'
assert 'last_name: last_name || null,' in content, 'FAIL: address.last_name missing'
print('email_address field: PRESENT ✅')
print('phone_number field:  PRESENT ✅')
print('address.first_name:  PRESENT ✅')
print('address.last_name:   PRESENT ✅')

# 3. Flat keys still present (Meta + Path A not broken)
assert '    email,\n' in content, 'FAIL: flat email key removed'
assert '    phone,\n' in content, 'FAIL: flat phone key removed'
assert '    first_name,\n' in content, 'FAIL: flat first_name key removed'
assert '    last_name,\n' in content, 'FAIL: flat last_name key removed'
print('Flat keys intact:    ✅ (Meta + Path A unaffected)')

# 4. Correct order: external_id → user_data → lead context
idx_ext = content.find('external_id: phone || email || null,')
idx_ud  = content.find('user_data: {')
idx_lc  = content.find('// lead context')
assert idx_ext < idx_ud < idx_lc, f'FAIL: wrong order ext={idx_ext} ud={idx_ud} lc={idx_lc}'
print('Insertion order:     CORRECT ✅  (external_id → user_data → lead context)')

# 5. Updated JSDoc
assert 'TWO formats (CR-220)' in content, 'FAIL: JSDoc not updated'
print('JSDoc updated:       ✅')

print()
print('ALL CHECKS PASSED ✅ — ready to rebuild')
"
```

---

## Part 4 — Rebuild Sequence

### Step 1: Beta build (preview pod — confirms fix works, used for audit)

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr220.log 2>&1 &
echo "PID: $!"
```

Monitor:
```bash
while ps aux | grep "craco build" | grep -v grep > /dev/null 2>&1; do
  sleep 15; echo "$(date '+%H:%M:%S'): building..."
done
echo "DONE"
tail -5 /app/memory/build-cr220.log
```

Restart frontend:
```bash
sudo supervisorctl restart frontend && sleep 4 && sudo supervisorctl status frontend
```

### Step 2: Hash check + route count

```bash
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "Hash: $NEW"
echo "$BAD" | grep -q "$NEW" && echo "BAD HASH — abort" || echo "HASH CLEAN ✅"
find /app/frontend/build -name "index.html" | wc -l   # Expected: 65
```

### Step 3: Validate user_data in built JS bundle

```bash
grep -c "email_address" /app/frontend/build/static/js/main.*.js   # Expected: >= 1
grep -c "phone_number"  /app/frontend/build/static/js/main.*.js   # Expected: >= 1
grep -c "user_data"     /app/frontend/build/static/js/main.*.js   # Expected: >= 1
echo "Bundle validation PASS ✅"
```

### Step 4: Production build + zip

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L \
  yarn build > /app/memory/build-cr220-prod.log 2>&1 &
# (wait for completion)
PROD=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
echo "Prod hash: $PROD"
echo "$BAD" | grep -q "$PROD" && echo "BAD HASH" || echo "HASH CLEAN ✅"
cd /app && zip -r /app/mygenie-prod-build.zip frontend/build/
ls -lh /app/mygenie-prod-build.zip
```

---

## Part 5 — Fix A: GTM — User-Provided Data Variable + GA4 Tag

**Container:** Web GTM — GTM-K5D84Z3L
**Solves:** Problem 3 — GA4 tag not forwarding user_data to server container (Stape sGTM)
**Prerequisite:** Fix B deployed (user_data is now in the dataLayer event)

### Step A-1: Create the User-Provided Data variable

```
GTM → Variables → New → Variable Configuration
  Type:  User-Provided Data
  Name:  dlv - user_data

  Configuration:
    Data Layer Variable Name: user_data

  Save
```

This tells GTM: "when the `user_data` key appears in a dataLayer event, read the whole object."

### Step A-2: Edit "GA4 - Book demo" tag

```
GTM → Tags → "GA4 - Book demo"
  Scroll to: "User-Provided Data" section
    (this is a dedicated section, SEPARATE from the Event Parameters table)
  Set: {{dlv - user_data}}
  Save
```

**What this achieves:** The GA4 event sent to Google's collection endpoint will now include
the `user_data` object with `email_address`, `phone_number`, and `address`. The Stape
server-side GTM container intercepts this event and the `sgtmadsct` tag reads `user_data`
automatically — Enhanced Conversions data forwarded to Google Ads on Path B.

---

## Part 6 — Fix C: GTM — Switch "GAds - Book Demo" EC Mode Automatic → Code

**Container:** Web GTM — GTM-K5D84Z3L
**Solves:** Problem 1 — Automatic EC scans DOM at conversion time, finds no inputs (React
unmounts form fields before conversion fires)
**Can be done in the same GTM session as Fix A (same variable, different tag)**

### Step C-1: Edit "GAds - Book Demo" tag

```
GTM → Tags → "GAds - Book Demo"  (client-side Google Ads conversion tag)
  Scroll to: "Enhanced conversions" section
    Current setting: Automatic
    Change to:       Code  (also shown as "In-page code" in some GTM versions)

  Set User-Provided Data:
    {{dlv - user_data}}      ← same variable created in Fix A

  Save
```

**What this achieves:** The Google Ads tag stops trying to scan the DOM for input fields
(which are already unmounted at conversion time). Instead it reads `email_address`,
`phone_number`, `first_name`, `last_name` directly from the `user_data` object in the
dataLayer event — which was captured from the form before the stage machine changed views.
EC data always present, regardless of what's visible on screen.

---

## Part 7 — GTM Preview Test (before publishing)

Run this BEFORE hitting Publish. Uses GTM's built-in Preview/Debug mode.

```
GTM → Preview
  → Enter: https://www.mygenie.online (or beta URL)
  → Submit a real test Book Demo form (use real email/phone — needed for hash match)
  → Complete OTP

In GTM Debug panel after OTP verified:
  1. Find event: "thankyou_conversion"
  2. Click: "GA4 - Book demo" tag
     → Expand "User Data" section
     → Confirm: Email, Phone, First Name, Last Name show as HASHED values (not empty/null)
     → PASS ✅ if hashed, FAIL ❌ if empty

  3. Click: "GAds - Book Demo" tag
     → Expand "Enhanced Conversions" section
     → Confirm: shows hashed email/phone
     → PASS ✅ if hashed, FAIL ❌ if empty

If both PASS → Publish
If either FAIL → check variable name spelling, confirm Fix B deployed, re-test
```

---

## Part 8 — Post-Publish Monitoring

### Immediate (same day)
```
Google Ads → Conversions → "Book demo"
  → "Last ping date" should update to today's date within ~2 hours
```

### Within 24-72 hours
```
Google Ads → Conversions → "Book demo" → Enhanced conversions tab
  → "Implement in-page code in addition to Automatic" warning should clear
  → Status should change from "Needs attention" to normal/active
  → "Enhanced conversions" coverage % should appear/increase
```

---

## Part 9 — Rollback Procedure

**Fix B rollback (if needed):**
Remove the `user_data: { ... }` block from `buildLeadPayload()` (Edit 2 only).
Revert JSDoc (Edit 1). Rebuild. Flat keys never touched — Meta and Path A unaffected.

**Fix A rollback:**
GTM → "GA4 - Book demo" tag → remove User-Provided Data variable → Save → Publish.

**Fix C rollback:**
GTM → "GAds - Book Demo" tag → Enhanced Conversions → switch back to Automatic → Save → Publish.

---

## Part 10 — Complete Edit Summary

### Fix B — Code (this pod, this session)

| # | File | Lines | Change |
|---|---|---|---|
| 1 | `src/lib/gtm.js` | 184–189 | Update JSDoc — document dual-format intent |
| 2 | `src/lib/gtm.js` | 196–203 | Add `user_data` block after `external_id`, before `// lead context` |

**2 search_replace calls · 1 file · 1 rebuild**

### Fix A — GTM (owner/editor, after Fix B deployed)

| # | Where | Action |
|---|---|---|
| 1 | GTM → Variables | Create "User-Provided Data" variable named `dlv - user_data`, reading `user_data` from dataLayer |
| 2 | GTM → "GA4 - Book demo" tag | Set User-Provided Data section to `{{dlv - user_data}}` |

### Fix C — GTM (owner/editor, same session as Fix A)

| # | Where | Action |
|---|---|---|
| 1 | GTM → "GAds - Book Demo" tag | Switch Enhanced Conversions mode from Automatic to Code |
| 2 | GTM → "GAds - Book Demo" tag | Set User-Provided Data to `{{dlv - user_data}}` (same variable) |

**Total GTM: 1 new variable · 2 tag edits · 1 Preview test · 1 Publish**

---

## Part 11 — dataLayer Event Shape: Before vs After

### Before
```javascript
{
  event: "thankyou_conversion",
  name: "Rajesh Kumar",
  first_name: "Rajesh",              // flat, root level
  last_name: "Kumar",                // flat, root level
  email: "rajesh@example.com",       // flat, root level — key: "email"
  phone: "+919876543210",            // flat, root level — key: "phone"
  external_id: "+919876543210",
  // 30+ other flat keys (UTMs, click IDs, etc.)
  // user_data: ABSENT
}
```

### After Fix B
```javascript
{
  event: "thankyou_conversion",
  name: "Rajesh Kumar",
  first_name: "Rajesh",              // STAYS — Meta + Path A still read this
  last_name: "Kumar",                // STAYS — Meta + Path A still read this
  email: "rajesh@example.com",       // STAYS — Meta + Path A still read this
  phone: "+919876543210",            // STAYS — Meta + Path A still read this
  external_id: "+919876543210",
  user_data: {                       // NEW — server-side GA4 path reads this
    email_address: "rajesh@example.com",   // Google's required key name
    phone_number: "+919876543210",         // Google's required key name
    address: {
      first_name: "Rajesh",               // null-safe
      last_name: "Kumar",                 // null-safe
    },
  },
  // 30+ other flat keys — ALL UNCHANGED
}
```

---

*Plan revised 2026-09-05. All strings verified against live source.*
*Fix B: 2 search_replace, 1 file. Fix A + C: GTM config steps, no code.*
*Ready to implement Fix B on instruction.*
