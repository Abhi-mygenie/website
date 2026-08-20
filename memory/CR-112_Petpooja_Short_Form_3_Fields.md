# CR-112 — Reduce Petpooja Demo Form to 3 Fields (Short Form Variant)

**Type:** Conversion Rate Optimisation / UX  
**Date Raised:** 2026-08-20  
**Raised By:** Owner review during Batch 3 planning  
**Status:** OPEN — DEFERRED (not in Batch 3)  
**Priority:** HIGH  
**Plan ID:** H-112  
**Effort:** 45 min  
**Improves:** Conv · QS LP Experience · Mobile Form Completion  
**Scope:** `frontend/src/components/site/DemoForm.jsx`, `frontend/src/pages/PetpoojaAlternative.jsx`  
**Related:** CR-73 (footer trust), CR-74 (sticky CTA), CR-75 (H1 keyword), CR-76 (logos)  
**Backend changes required:** None

---

## 1. Problem Statement

The demo form on `/petpooja-alternative` currently shows **6 fields**:
1. Name *(required)*
2. Phone *(required)*
3. Email *(required)*
4. Business name *(required)*
5. Years in business *(required)*
6. City *(optional)*

For a cold-traffic Google Ads landing page, 6 fields is a significant friction point. Industry benchmarks show form completion rates drop sharply above 3 fields for cold paid traffic.

**Owner's proposed flow:**
- **Form stage:** Name, Phone, Years in business (3 fields only)
- **OTP stage:** Verify phone — unchanged
- **Calendly stage:** User books slot and provides email directly in Calendly

---

## 2. Investigation Findings (2026-08-20)

### Backend — zero changes needed
`DemoRequestCreate` model in `server.py` (lines 64–79):
```python
name: str          # required
phone: str         # required
email: str | None = None          # already optional
business_name: str | None = None  # already optional
years_in_business: str | None = None  # already optional
```
Backend already accepts a lead with just name + phone. No backend changes required.

### Email handling — all paths safe without email at form stage
| Usage | Impact if email blank at form stage |
|---|---|
| Calendly prefill | Field left blank — user fills it during Calendly booking (Calendly always requires email) |
| `/api/demo-booked` call | Already coded `email: form.email \|\| null` — handles None gracefully |
| Freshsales CRM sync | Calendly webhook (`/api/calendly-webhook`) captures email from booking event — arrives separately |
| GTM / Meta Pixel events | Fire on name + phone + eventId — email not required |

Email is captured at Calendly stage and synced to Freshsales via the existing webhook. No data loss.

### DemoForm.jsx is a shared component
Used across 4 pages: homepage, all sector pages, Petpooja page, Demo landing page (`meta-demo`).
- Current hardcoded `REQUIRED`: `["name", "phone", "email", "business_name", "years_in_business"]`
- Must not break any other page's form

### Reason deferred from Batch 3
The change touches `DemoForm.jsx` — a shared component across the whole site. While the implementation is clean and low-risk (opt-in prop), it requires testing all 4 form contexts to confirm no regression. Deferred to its own focused session.

---

## 3. Exact Changes Required

### Change 1 — `frontend/src/components/site/DemoForm.jsx`

Add `shortForm` prop to the component signature:
```jsx
// BEFORE (line 70)
export default function DemoForm({ sector }) {

// AFTER
export default function DemoForm({ sector, shortForm = false }) {
```

Make REQUIRED dynamic:
```jsx
// BEFORE (line 15)
const REQUIRED = ["name", "phone", "email", "business_name", "years_in_business"];

// AFTER
const REQUIRED = shortForm
  ? ["name", "phone", "years_in_business"]
  : ["name", "phone", "email", "business_name", "years_in_business"];
```

Conditionally render fields in the form stage:
```jsx
// In the form stage JSX (lines 323–368)
// BEFORE: always renders all fields
// AFTER: when shortForm, only render name, phone, years_in_business

{[
  { key: "name",  placeholder: "Your name *",     type: "text" },
  { key: "phone", placeholder: "Phone number *",  type: "tel"  },
  // only show email + business_name when NOT shortForm:
  ...(!shortForm ? [
    { key: "email",         placeholder: "Email address *",  type: "email" },
    { key: "business_name", placeholder: "Business name *",  type: "text"  },
  ] : []),
].map(...)}

// Years in business select: always show
// City input: hide when shortForm (already hidden for meta-demo)
// Outlet type select: hide when shortForm
{!shortForm && !sector && (
  <select ...outlet_type... />
)}
{!shortForm && sector !== "meta-demo" && (
  <input ...city... />
)}
```

### Change 2 — `frontend/src/pages/PetpoojaAlternative.jsx`

Pass `shortForm` prop to DemoForm (line 641):
```jsx
// BEFORE
<DemoForm sector="petpooja-alternative" />

// AFTER
<DemoForm sector="petpooja-alternative" shortForm />
```

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/components/site/DemoForm.jsx` | Add `shortForm` prop; make REQUIRED dynamic; conditionally hide email, business_name, city, outlet_type |
| `frontend/src/pages/PetpoojaAlternative.jsx` | Pass `shortForm` to DemoForm |

**Backend:** No changes.

---

## 5. Definition of Done

- [ ] `/petpooja-alternative` form shows exactly 3 fields: name, phone, years_in_business
- [ ] OTP flow unchanged — triggers after form submit
- [ ] Calendly stage unchanged — user provides email there
- [ ] Homepage form unchanged — still shows all 6 fields
- [ ] All sector page forms unchanged
- [ ] Demo landing page (`meta-demo`) unchanged
- [ ] Backend receives lead without email — saves correctly, `email: null` in MongoDB
- [ ] Freshsales sync still works — email arrives via Calendly webhook post-booking
- [ ] Form submit button label unchanged: "Get My Customized Walkthrough"

---

## 6. Testing Required

Because `DemoForm.jsx` is shared, regression test all form contexts:
1. `/` homepage form — must show all 6 fields
2. `/solutions/:slug` sector page — must show all 6 fields
3. `/petpooja-alternative` — must show 3 fields only
4. `/demo` (meta-demo) — must be unchanged

---

*CR-112 registered 2026-08-20. Owner decision: deferred from Batch 3, implement in its own focused session. All investigation complete — ready to implement on approval.*
