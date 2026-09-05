# CR-220 — Line-by-Line Implementation Plan: Enhanced Conversions user_data Fix

**CR:** CR-220
**Date:** 2026-09-05
**Status:** Ready to implement
**Risk:** Zero — additive only, no existing keys removed, no visual change
**Scope:** 1 file, 2 search_replace calls, 1 rebuild

---

## Pre-flight Checks

```bash
# 1. Confirm user_data is absent (expected: no output / exit 1)
grep -n "user_data\|email_address\|phone_number" /app/frontend/src/lib/gtm.js

# 2. Confirm exact location of the identity block
grep -n "identity.*Enhanced\|external_id\|lead context" /app/frontend/src/lib/gtm.js
# Expected:
# 196:    // identity (Enhanced Conversions / Advanced Matching) — #1
# 202:    external_id: phone || email || null,
# 203:    // lead context

# 3. Confirm normEmail and normPhone are called before the return (values already available)
grep -n "normEmail\|normPhone\|splitName" /app/frontend/src/lib/gtm.js
# Expected: lines 192-194 — all three run before the return {} block
```

---

## Edit 1 — Update JSDoc comment on `buildLeadPayload` (lines 184–189)

**Purpose:** Document that the function now emits both flat keys AND a `user_data` block,
so the next maintainer understands why both exist.

**old_str:**
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
 * Emits identity data in TWO formats:
 *   1. Flat keys (email/phone/first_name/last_name) — for Meta Advanced Matching + Path A GAds tag.
 *   2. user_data object (CR-220) — for server-side GA4 → sGTM Enhanced Conversions (Path B).
 * All identity values are normalized before the return. Hashing happens in GTM — raw values
 * never leave hashed.
 */
```

---

## Edit 2 — Add `user_data` block inside `buildLeadPayload` return (lines 196–203)

This is the core fix. Insert the `user_data` block immediately after the existing flat identity
fields and before `// lead context`. All required values (`email`, `phone`, `first_name`,
`last_name`) are already computed on lines 192–194 — no new computation needed.

**old_str:**
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
    // CR-220: Google Enhanced Conversions structured user_data — server-side GA4 → sGTM path.
    // Flat keys above (email/phone/first_name/last_name) remain unchanged for Meta + Path A.
    // Key names match Google's spec exactly: email_address, phone_number, address.first/last_name.
    // Values already normalized: normEmail() → lowercase+trim; normPhone() → E.164 (+91XXXXXXXXXX).
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

---

## Post-Edit Verification (run before rebuild)

```bash
# 1. user_data block is now present
grep -n "user_data\|email_address\|phone_number" /app/frontend/src/lib/gtm.js
# Expected:
# <line>:    user_data: {
# <line>:      email_address: email,
# <line>:      phone_number: phone,

# 2. Flat keys are still present (unchanged)
grep -n "^    email,$\|^    phone,$\|^    first_name,$\|^    last_name," /app/frontend/src/lib/gtm.js
# Expected: 4 matches — all flat keys still there

# 3. Count total keys in return block — should be 37 (+5 for user_data + 3 address lines + comment lines)
grep -c ":" /app/frontend/src/lib/gtm.js

# 4. Structural check — user_data is between external_id and lead context comment
python3 -c "
content = open('/app/frontend/src/lib/gtm.js').read()
idx_ext = content.find('external_id: phone || email || null,')
idx_ud  = content.find('user_data: {')
idx_lc  = content.find('// lead context')
assert idx_ext < idx_ud < idx_lc, f'Order wrong: ext={idx_ext} ud={idx_ud} lc={idx_lc}'
print('Order check: PASS ✅')
has_email_address = 'email_address: email,' in content
has_phone_number  = 'phone_number: phone,' in content
has_address_fn    = 'first_name: first_name || null,' in content
has_address_ln    = 'last_name: last_name || null,' in content
print(f'email_address: {has_email_address}  (expected True)')
print(f'phone_number : {has_phone_number}   (expected True)')
print(f'address.fn   : {has_address_fn}     (expected True)')
print(f'address.ln   : {has_address_ln}     (expected True)')
print('PASS ✅' if all([has_email_address, has_phone_number, has_address_fn, has_address_ln]) else 'FAIL ❌')
"
```

---

## Rebuild

```bash
# Step 1: Beta build (preview pod — for testing)
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr220.log 2>&1 &
echo "PID: $!"
```

Monitor:
```bash
tail -f /app/memory/build-cr220.log
```

Restart:
```bash
sudo supervisorctl restart frontend && sleep 4 && sudo supervisorctl status frontend
```

```bash
# Step 2: Hash check
NEW=$(ls /app/frontend/build/static/js/main.*.js | grep -v .map | grep -o '[a-f0-9]\{8\}')
BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
echo "Hash: $NEW"
echo "$BAD" | grep -q "$NEW" && echo "BAD HASH — abort" || echo "HASH CLEAN ✅"
find /app/frontend/build -name "index.html" | wc -l   # Expected: 65
```

```bash
# Step 3: Validate user_data is present in built JS bundle
grep -c "email_address" /app/frontend/build/static/js/main.*.js
# Expected: >= 1 (the key is in the bundle)
grep -c "phone_number" /app/frontend/build/static/js/main.*.js
# Expected: >= 1
```

```bash
# Step 4: Production zip
REACT_APP_BACKEND_URL=https://www.mygenie.online REACT_APP_GTM_ID=GTM-K5D84Z3L yarn build > /app/memory/build-cr220-prod.log 2>&1 &
# After completion:
zip -r /app/mygenie-prod-build.zip build/
ls -lh /app/mygenie-prod-build.zip
```

---

## GTM Side (Fix A — owner action, no code)

After the code deploy, the GTM "GA4 - Book demo" tag still needs the User Data section
configured to actually forward user_data to the GA4 hit. The code-side fix ensures
user_data is IN the dataLayer event; this GTM step ensures GA4 reads it and includes
it in the event sent to the server container.

### Steps (web GTM container GTM-K5D84Z3L)

1. **Create variable** → New → Variable type: "User-Provided Data"
   - Variable name: `dlv - User Provided Data`
   - Data Layer Variable Name: `user_data`
   - (GTM will read the entire `user_data` object from the dataLayer event)

2. **Edit "GA4 - Book demo" tag**
   - Scroll to "User-Provided Data" section (below Event Parameters)
   - Set: `dlv - User Provided Data`

3. **Preview test**
   - Submit a test Book Demo form
   - In GTM Preview, find the "GA4 - Book demo" tag → expand User Data
   - Confirm: Email, Phone, First Name, Last Name show as hashed values (not empty)

4. **Publish**

5. **Monitor Google Ads** → "Book demo" conversion action → Enhanced Conversions status
   - "Setup issues detected" should clear within 24-72 hours of receiving valid data

---

## What Changes in the dataLayer Event (before vs after)

### Before (current)
```javascript
{
  event: "thankyou_conversion",
  name: "Rajesh Kumar",
  first_name: "Rajesh",         // ← flat, at root
  last_name: "Kumar",           // ← flat, at root
  email: "rajesh@example.com",  // ← flat, at root
  phone: "+919876543210",       // ← flat, at root
  external_id: "+919876543210",
  outlet_type: "Restaurant",
  // ... 30 more flat keys
}
```

### After (with CR-220)
```javascript
{
  event: "thankyou_conversion",
  name: "Rajesh Kumar",
  first_name: "Rajesh",         // ← stays (Meta + Path A still read this)
  last_name: "Kumar",           // ← stays (Meta + Path A still read this)
  email: "rajesh@example.com",  // ← stays (Meta + Path A still read this)
  phone: "+919876543210",       // ← stays (Meta + Path A still read this)
  external_id: "+919876543210",
  user_data: {                  // ← NEW: dedicated container for Path B / EC
    email_address: "rajesh@example.com",
    phone_number: "+919876543210",
    address: {
      first_name: "Rajesh",
      last_name: "Kumar",
    },
  },
  outlet_type: "Restaurant",
  // ... 30 more flat keys (all unchanged)
}
```

---

## Events Affected (all 5 entry points — automatic, no per-file changes)

| Event name in GTM | Source file | Trigger |
|---|---|---|
| `thankyou_conversion` | `DemoForm.jsx:294` | OTP verified → book_demo |
| `thankyou_conversion` | `PetpoojaAlternative.jsx:273` | OTP verified → book_demo |
| `thankyou_conversion` | `MessageForm.jsx:124` | OTP verified → book_demo |
| `thankyou_conversion` | `CheckoutModal.jsx:177` | OTP verified → book_demo |
| `demo_booked` | `CalendlyInline.jsx:77` | Calendly event_scheduled webhook |
| `form_submitted` | all forms | First form submit (no EC tag, harmless) |

---

## Rollback

Remove the `user_data: { ... }` block (lines added by Edit 2) and revert the JSDoc.
Rebuild. The flat keys are untouched so Path A and Meta revert cleanly.

---

## Edit Count Summary

| # | File | What |
|---|---|---|
| 1 | `src/lib/gtm.js` | Update JSDoc on `buildLeadPayload` — document dual-format intent |
| 2 | `src/lib/gtm.js` | Add `user_data` block after `external_id` line inside return object |

**Total: 2 search_replace calls, 1 file, 1 rebuild.**

*Plan written 2026-09-05. Ready to implement on instruction.*
