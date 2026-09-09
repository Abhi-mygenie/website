# CR-220 — Enhanced Conversions Monitoring Log
# Google Ads Console: "Book demo" Conversion Action (AW-16740091756/NtqdClejmOgaEOyOpq4-)

**Purpose:** Track the Google Ads diagnostic status over time to confirm Enhanced Conversions is working after the GTM fix published on 2026-09-09.

---

## How to check this

1. Go to **Google Ads** → **Goals** → **Conversions** → find "Book demo"
2. Note: "Last recorded conversion", "Last event ping", and the diagnostic warning (if any)
3. Add a new entry below with the date + what you see

---

## Status Log

---

### Entry 1 — 2026-09-09 (Pre-fix baseline, same day as GTM publish)

| Field | Value |
|---|---|
| Timestamp checked | Sep 9, 2026 (morning, ~after 8:23 AM) |
| Last recorded conversion | **Sep 8, 2026 at 5:30 PM** |
| Last event ping | **Sep 9, 2026 at 8:23 AM** |
| Diagnostic | ⚠️ "Needs attention — Conversions have been recorded within the last 7 days, but there are issues." |
| Warning detail | "Implement in-page code in addition to Automatic for better results" |
| Warning expanded | "Based on your current coverage, you might get more accurate conversion data if you edit your website code." |

**Interpretation:**

| Signal | Meaning |
|---|---|
| Last event ping = Sep 9 at 8:23 AM | ✅ GTM changes are live and the tag IS firing on production today |
| Last recorded conversion = Sep 8 | ✅ Normal — no new OTP-verified booking has happened yet today since the fix was published |
| "Automatic" warning still showing | ⚠️ Diagnostic not yet updated — Google Ads diagnostics typically take 24-72h to re-evaluate after a GTM change. This warning was present before the fix. It may clear after the next conversion fires with the new user_data variable attached. |

**GA4 Property-level user-provided data setting (checked Sep 9, 2026):**
Location: Google Analytics → MyGenie Website (G-KWHHFEZ5Q3) → Google Tag → Settings → "Allow user-provided data capabilities"

| Setting | State | Correct? |
|---|---|---|
| "Allow user-provided data capabilities" master toggle | ON (blue) | ✅ Required — correctly enabled |
| "Automatically detect user-provided data" | UNCHECKED | ✅ Correct — DOM scanning fails with React |
| "Specify CSS selectors or JS variables" | UNCHECKED | ✅ Correct — not needed |
| Method in use | "Add a code snippet" (GTM user_data event parameter) | ✅ Correct — our GTM setup is this method |

No additional changes needed in GA4 property settings. Master toggle is ON and saved.

**What changed at GTM publish (Sep 9):**
- `user_data` variable created with Manual configuration (Email, Phone, First Name, Last Name, Country=IN)
- Tag 85 "Google Analytics - GA4": `user_data: {{user_data}}` added to Shared event settings
- Tag 100 "Google Tag AW-16740091756": `user_data: {{user_data}}` added to Shared event settings
- Tag 88 "GAds - Book Demo": Already reading EC data from DataLayer via "Provide new customer data" + event parameters — confirmed correct, no change needed
- GTM Version "Step A-D" published

**Next check due:** Sep 11, 2026 (48h after fix) — check if "Needs attention" warning has cleared.

---

### Entry 2 — [PENDING — check Sep 11, 2026]

| Field | Value |
|---|---|
| Timestamp checked | TBD |
| Last recorded conversion | TBD |
| Last event ping | TBD |
| Diagnostic | TBD |
| Warning detail | TBD |

**Expected outcome:** "Needs attention" warning clears, "Automatic" diagnostic disappears. Enhanced Conversions coverage % begins to appear (may take 7+ days of conversion volume).

---

### Entry 3 — [PENDING — check Sep 16, 2026]

| Field | Value |
|---|---|
| Timestamp checked | TBD |
| Last recorded conversion | TBD |
| Last event ping | TBD |
| Diagnostic | TBD |
| EC Coverage % | TBD |

**Expected outcome:** Enhanced Conversions coverage % visible. "Needs attention" gone. Tag status shows "Recording conversions."

---

## What "success" looks like

| Metric | Pass condition |
|---|---|
| Diagnostic warning | Gone — no "Needs attention", no "Implement in-page code" |
| Last event ping | Updates within hours of each new conversion |
| EC Coverage % | Appears in conversion report (any non-zero %) |
| Google Ads tag status | "Recording conversions" (green) |

---

## What to do if warning persists after Sep 13

If the "Implement in-page code in addition to Automatic" warning is still showing after 72h+ of actual conversions flowing through:

1. **Check Tag 88 "GAds - Book Demo" config in GTM:** Open the tag → confirm "Provide new customer data" is CHECKED + Data Source = "Data Layer". If the EC fields (Email, Phone, First Name, Last Name) show values in GTM Preview debug panel → tag is working, warning is just a UI lag.

2. **Test in GTM Preview mode:** Accept cookie banner → submit a real demo form with real phone number → complete OTP. In GTM Debug panel → click the "book_demo" / "thankyou_conversion" event → check "GAds - Book Demo" tag → expand the "Enhanced Conversions" section. If it shows hashed values → EC is working, ignore Google Ads console warning.

3. **If no EC data in GTM Preview:** The `{{user_data}}` variable may not be resolving. Re-check: Variables → `user_data` → confirm Manual configuration fields are all populated with correct GTM variable references.

---

## Related files
- `/app/memory/GTM_TAG_REGISTRY.md` — full GTM tag documentation
- `/app/memory/GTM_BATCH_CR216_CR220_CR221_CR222_Plan.md` — original CR-220 implementation plan
- `/app/memory/CR-220_Enhanced_Conversions_Impact_Analysis.md` — original analysis
- `/app/memory/CR_INTAKE_REGISTER.md` — CR-220 entry (marked ✅ DONE 2026-09-09)
