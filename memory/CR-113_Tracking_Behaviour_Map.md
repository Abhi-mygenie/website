# CR-113 — Exact Tracking Behaviour Map
**Purpose:** Line-by-line audit of DemoForm.jsx tracking. QuickDemoSheet must replicate EVERY event identically.  
**Written:** 2026-08-20 — Pre-implementation audit  
**Critical:** Do NOT implement QuickDemoSheet without this doc in hand.

---

## 1. DemoForm Complete Tracking Sequence (Source of Truth)

### EVENT 1 — `form_submitted` (GTM: `"form_submitted"`)
**Triggered:** After `/api/demo-request` returns success  
**File/Line:** `DemoForm.jsx:156`
```js
pushLead("form_submitted", form, outletValue, eventId, {
  otp_verified: false,
  form_location: sector ? `sector:${sector}` : "homepage",
  lead_quality: leadQuality(signals()),
})
```
**Payload includes:** name, phone, email, business_name, attribution (gclid, fbclid, UTMs), eventId  
**`outletValue`:** `sector` prop (e.g. `"petpooja-alternative"`) OR `form.outlet_type` if no sector  
**`form_location`:** `"sector:petpooja-alternative"` on the VSP page  
**Conversion value:** ₹0 (see `CONVERSION_VALUES` in gtm.js)

---

### EVENT 2 — `book_demo` → GTM `"thankyou_conversion"` ← THE MAIN CONVERSION
**Triggered:** Immediately after OTP is verified successfully  
**File/Line:** `DemoForm.jsx:305`
```js
pushLead("book_demo", form, outletValue, eventId, {
  otp_verified: true,
  form_location: sector ? `sector:${sector}` : "homepage",
  // NOTE: lead_quality is NOT passed here (only at form_submitted stage)
})
```
**Why `thankyou_conversion`:** GTM maps `"book_demo"` → `"thankyou_conversion"` (the live GTM trigger name).  
**Conversion value:** ₹200  
**⚠️ NO `lead_verified` push here:** Comment in code (line 303): "removed duplicate push — fired Meta Lead 2x"  
**`form_location`:** `"sector:petpooja-alternative"` on the VSP page

---

### EVENT 3 — `demo_booked` (GTM: `"demo_booked"`)
**Triggered:** When Calendly `event_scheduled` postMessage fires  
**Conversion value:** ₹300

**3a — MOBILE path (isMobile = window.innerWidth < 768)**  
Calendly opens via `window.Calendly.initPopupWidget()`  
Handler in DemoForm itself (lines 115-131) — ONLY attaches when `stage === "calendly"` AND `isMobile === true`
```js
pushLead("demo_booked", form, outletValue, eventId, {
  form_location: "calendly_popup",
  otp_verified: true,
})
markBooked()
```

**3b — DESKTOP path (isMobile = false)**  
Calendly rendered via `<CalendlyInline>` component  
Handler in `CalendlyInline.jsx:95-102` — `CalendlyInline` owns this event:
```js
pushLead("demo_booked", ctx, ctx.sector, eventIdRef.current, {
  form_location: "calendly",
  otp_verified: ctx.otp_verified,   // passed as leadContext.otp_verified = true
})
onScheduled()  // → markBooked()
```
`ctx = { ...form, outlet_type: outletValue, sector: outletValue, otp_verified: true }`

**Double-fire prevention:**  
- `scheduledRef.current` flag guards against duplicate fires  
- DemoForm handler: `if (!isMobile) return` — only runs on mobile  
- CalendlyInline handler: only runs when mounted (desktop only)  
- These two paths are MUTUALLY EXCLUSIVE — one fires, never both

---

### API CALLS (not GTM events, but part of the flow)

**API 1 — `/api/demo-request` (form submit)**  
```js
axios.post(`${API}/demo-request`, {
  ...form,               // name, phone, email, business_name, city, years_in_business, outlet_type
  ...signals(),          // hp (honeypot), elapsed_ms
  event_id: eventId,
  otp_token: null,
  attribution: getAttribution(),
  outlet_type: outletValue,
  source_page: sector ? `sector:${sector}` : "homepage",
})
```
Returns: `{ id, freshsales_contact_id, saved }`  
`id` and `freshsales_contact_id` stored in `lead` state for use in Calendly UTM passthrough

**API 2 — `/api/demo-booked` (after Calendly booking)**  
```js
axios.post(`${API}/demo-booked`, {
  freshsales_contact_id: lead?.contactId ?? null,
  email: form.email || null,
  lead_id: lead?.id ?? null,
})
```
This is best-effort (errors silently caught). Updates CRM with booked status.

---

### Calendly Prefill + UTM Passthrough

**Mobile popup prefill:**
```js
prefill: {
  name: form.name,
  email: form.email,
  customAnswers: {
    a1: `Outlet: ${outletValue} | Biz: ${form.business_name}`,  // custom Q1
    a2: `+91${phone}`,                                           // custom Q2 — phone
  },
},
utm: {
  utmContent: String(lead.contactId),   // Freshsales contact ID
  utmTerm:    String(lead.id),          // MongoDB lead ID
  utmSource:  "website",
  utmMedium:  "demo_form_mobile",       // ← "mobile" suffix
}
```

**Desktop inline prefill (CalendlyInline):**
```js
prefill: {
  name: form.name,
  email: form.email,
  customAnswers: {
    a1: `Outlet: ${outletValue} | Business: ${form.business_name} | City: ${form.city}`,  // includes city
    a2: `+91${phone}`,
  },
},
utm: {
  utmContent: String(lead.contactId),
  utmTerm:    String(lead.id),
  utmSource:  "website",
  utmMedium:  "demo_form",             // ← no "mobile" suffix
}
```

---

### Anti-bot
- `useAntiBot()` → `signals()` returns `{ hp, elapsed_ms }` — attached to `/api/demo-request`
- `Honeypot` component renders an off-screen hidden input (real users never fill it)
- `leadQuality(signals())` → `"ok"` or `"junk"` — attached to `form_submitted` event only
- `eventId` generated once per form mount via `newEventId()` — same ID flows through all 3 events for deduplication

---

## 2. QuickDemoSheet — Required Tracking Behaviour (MUST MATCH)

### Fields available in QuickDemoSheet form:
- `name` (required)
- `phone` (required)
- `email` (required)
- `business_name` (optional)
- ~~city~~ — NOT collected
- ~~years_in_business~~ — NOT collected
- ~~outlet_type~~ — NOT collected (sector hardcoded to `"petpooja-alternative"`)

---

### EVENT 1 — `form_submitted`
```js
pushLead("form_submitted", form, "petpooja-alternative", eventId, {
  otp_verified: false,
  form_location: "quick_book_sheet",      // ← distinguishes from main form
  lead_quality: leadQuality(signals()),
})
```
**API call:**
```js
axios.post(`${API}/demo-request`, {
  ...form,                                // name, phone, email, business_name (city/years = "")
  ...signals(),
  event_id: eventId,
  otp_token: null,
  attribution: getAttribution(),
  outlet_type: "petpooja-alternative",    // hardcoded sector
  source_page: "petpooja-quick-book",     // distinguishes from main form
})
```

---

### EVENT 2 — `book_demo` → GTM `"thankyou_conversion"`
```js
pushLead("book_demo", form, "petpooja-alternative", eventId, {
  otp_verified: true,
  form_location: "quick_book_sheet",
  // lead_quality NOT passed — matches DemoForm exact behaviour
})
```

---

### EVENT 3 — `demo_booked`
QuickDemoSheet ALWAYS uses popup (sheet is too narrow for CalendlyInline, regardless of device).  
QuickDemoSheet owns its OWN postMessage handler:
```js
pushLead("demo_booked", form, "petpooja-alternative", eventId, {
  form_location: "quick_book_sheet_calendly",
  otp_verified: true,
})
markBooked()
```

**Double-fire prevention:**
- `scheduledRef.current` flag in QuickDemoSheet guards against duplicate fires
- DemoForm (VspCta main form) starts in "form" stage — its postMessage handler NOT attached until it reaches Calendly stage
- In practice: only ONE form can be at Calendly stage at a time — no double-fire risk
- If somehow both are at Calendly simultaneously (edge case): each has its OWN `scheduledRef.current` — each fires `demo_booked` ONCE. This is a known acceptable edge case (same as opening two browser tabs).

---

### Calendly Popup Prefill (QuickDemoSheet — always popup):
```js
window.Calendly.initPopupWidget({
  url: brandedUrl(CALENDLY_URL),          // same branded URL
  prefill: {
    name: form.name,
    email: form.email,
    customAnswers: {
      a1: form.business_name ? `Biz: ${form.business_name}` : undefined,
      a2: form.phone ? `+91${form.phone.replace(/\D/g,"").slice(-10)}` : undefined,
    },
  },
  utm: {
    utmContent: lead?.contactId ? String(lead.contactId) : undefined,
    utmTerm:    lead?.id        ? String(lead.id)        : undefined,
    utmSource:  "website",
    utmMedium:  "quick_book_sheet",         // ← new medium value, distinguishes source
  },
})
```
Note: `a1` has no `Outlet:` prefix (outlet_type not collected), no `City:` (not collected). `business_name` included if provided.

---

### API 2 — `/api/demo-booked` (after booking):
```js
axios.post(`${API}/demo-booked`, {
  freshsales_contact_id: lead?.contactId ?? null,
  email: form.email || null,             // ← email IS collected in QuickDemoSheet
  lead_id: lead?.id ?? null,
})
```

---

### Anti-bot (QuickDemoSheet must include ALL of these):
- `useAntiBot()` called inside QuickDemoSheet component
- `<Honeypot>` rendered in the form JSX
- `signals()` attached to `/api/demo-request` call
- `leadQuality(signals())` attached to `form_submitted` event
- `newEventId()` called once at QuickDemoSheet mount

---

## 3. Complete Behavioural Difference Map: DemoForm vs QuickDemoSheet

| Behaviour | DemoForm (existing) | QuickDemoSheet (new) |
|---|---|---|
| `form_location` value | `"sector:petpooja-alternative"` | `"quick_book_sheet"` |
| `source_page` to API | `"sector:petpooja-alternative"` | `"petpooja-quick-book"` |
| Calendly method | mobile → popup, desktop → inline | Always popup |
| `utmMedium` Calendly | `"demo_form_mobile"` / `"demo_form"` | `"quick_book_sheet"` |
| `demo_booked form_location` | `"calendly_popup"` / `"calendly"` | `"quick_book_sheet_calendly"` |
| `a1` custom answer | `Outlet: X \| Business: X \| City: X` | `Biz: X` (no outlet/city) |
| GTM event names | identical | identical |
| Conversion values | identical | identical |
| eventId lifecycle | per DemoForm mount | per QuickDemoSheet mount |
| `lead` state (contactId/id) | set from API response | set from API response — same |
| `scheduledRef` | prevents double-fire | prevents double-fire — same |
| Anti-bot | all 3 mechanisms | all 3 mechanisms — same |

---

## 4. Files That Must NOT Be Touched

| File | Reason |
|---|---|
| `src/lib/gtm.js` | Contains GTM event mapping — ANY edit could break live Meta/Google Ads |
| `src/lib/attribution.js` | Attribution collection — must not change |
| `src/lib/antiBot.jsx` | Anti-bot signals — import only, do not modify |
| `src/components/site/OtpVerifyBlock.jsx` | OTP flow — import only |
| `src/components/site/CalendlyInline.jsx` | NOT used in QuickDemoSheet — do not modify |
| `src/components/site/DemoForm.jsx` | NOT modified for this CR |

---

## 5. CR-113 Document Update — Decision Confirmed

The CR-113 document (`CR-113_Petpooja_Mobile_UX_Overhaul.md`) Section 4 (QuickDemoSheet stage flow) is updated with this precise tracking map. All implementation must follow Section 2 of this document exactly.

---

*Tracking map written 2026-08-20. Line numbers verified against live DemoForm.jsx. Must be reviewed before implementation begins.*
