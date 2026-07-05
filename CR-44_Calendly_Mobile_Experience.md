# CR-44 — Calendly Mobile Experience: UTM Fix, Loading State & Orientation

**Registered:** 2026-07-03  
**Status:** G2 — Planning Complete  
**Priority:** P1 — CRM Data Integrity + UX  
**Files in scope:** `DemoForm.jsx`, `CalendlyInline.jsx`

---

## 1. Problem Statement

After OTP verification on mobile, the user sees a "Book My Slot" button which opens a Calendly popup widget (`showPopupWidget`). On desktop, the inline `CalendlyInline` component renders directly. Investigation revealed 4 issues in this stage:

1. Mobile popup never receives `utm` object (contactId/leadId) → Calendly webhook can't directly link booking to Freshsales contact
2. "Book My Slot" button shows no feedback during the 1–3 second async script load
3. `isMobile` check is not reactive to device orientation changes
4. CalendlyInline 660px fixed height causes scroll on small desktop/tablet viewports

---

## 2. Impact Analysis

### Issue 1 — Mobile UTM missing (CRM data integrity)

**Desktop flow:**
```
CalendlyInline passes utm={{ utmContent: contactId, utmTerm: leadId }}
→ Calendly records UTM in invitee tracking
→ Webhook receives utm_content + utm_term
→ Direct contact_id lookup in Freshsales → O(1), guaranteed match
```

**Mobile flow (current):**
```
showPopupWidget passes only { prefill: {...} } — no utm
→ Calendly records no UTM
→ Webhook receives utm_content=null, utm_term=null
→ Falls back to email lookup in Freshsales → extra API call, 1 edge case failure
```

**The email fallback (lines 328–332 of freshsales.py) saves ~95% of mobile bookings** — it does a Freshsales email search when contact_id is null. However it fails when:
- User changes the pre-filled email in the Calendly booking form
- User uses different email in Calendly vs what they submitted in the demo form

**This is testable live:** Submit form on mobile → in Calendly popup, change the pre-filled email → complete booking → Freshsales contact will not show "Demo Booked" tag or Meet link.

**Severity:** 🟡 Medium — edge case, not always broken, but a real gap affecting CRM integrity for a subset of mobile bookings.

---

### Issue 2 — No loading state on "Book My Slot"

```javascript
const openPopup = async () => {
  await loadCalendlyScript();   // 1–3 seconds on slow mobile
  if (!window.Calendly) return; // silent failure
  window.Calendly.showPopupWidget(...);
};
```

- Button appears dead for 1–3 seconds after tap
- No spinner, no disabled state, no error message if script fails
- User may tap multiple times → potential double popup queue
- On 2G/3G connections common in tier-2/3 Indian cities, this delay is 3–5 seconds

**Severity:** 🟡 Medium — degrades trust at the most important conversion step.

---

### Issue 3 — `isMobile` not reactive to orientation

```javascript
const isMobile = window.innerWidth < 768; // evaluated at render only
```

- React only re-renders on state/prop changes — orientation change alone doesn't trigger re-render
- Android phones in landscape (e.g., Samsung Galaxy = 800px+) get the inline 660px widget instead of popup
- 660px inline widget on a phone in landscape = nearly full-screen, requires vertical scroll inside iframe
- User sees a poorly sized Calendly iframe with no obvious way to scroll inside it

**Severity:** 🟢 Low — uncommon scenario but affects landscape mobile users.

---

### Issue 4 — CalendlyInline 660px fixed height (desktop)

```javascript
style={{ minWidth: "280px", height: "660px" }}
```

- Card = 660px widget + ~200px header/padding = ~860px total
- On 768–900px viewport height screens: requires full-page scroll to reach booking button inside the widget
- Calendly's widget itself is responsive internally — a taller container just shows more calendar rows

**Severity:** 🟢 Low — desktop only, minor scroll inconvenience.

---

## 3. Root Cause

| Issue | Root cause |
|---|---|
| UTM missing on mobile | `openPopup()` in DemoForm.jsx line 158 calls `showPopupWidget(url, { prefill })` — `utm` key never added |
| No loading state | `openPopup` has no loading state variable, button has no `disabled` or spinner |
| `isMobile` not reactive | Computed inline as `window.innerWidth < 768` — no `useEffect`/`resize` listener |
| 660px fixed height | Hardcoded in `CalendlyInline.jsx` line 109 |

---

## 4. Implementation Plan

---

### Task 1 — `DemoForm.jsx`: Add UTM to mobile popup
**Effort:** 5 min | **Risk:** Zero

Add `utm` object to `showPopupWidget` call matching exactly what desktop CalendlyInline receives:

```javascript
// Before (line 158–167)
window.Calendly.showPopupWidget(url, {
  prefill: {
    name: form.name,
    email: form.email,
    customAnswers: { ... },
  },
});

// After
window.Calendly.showPopupWidget(url, {
  prefill: {
    name: form.name,
    email: form.email,
    customAnswers: { ... },
  },
  utm: {
    utmContent: lead?.contactId ? String(lead.contactId) : undefined,
    utmTerm:    lead?.id        ? String(lead.id)        : undefined,
    utmSource:  "website",
    utmMedium:  "demo_form_mobile",
  },
});
```

`utmMedium: "demo_form_mobile"` (vs `"demo_form"` on desktop) allows you to distinguish mobile vs desktop bookings in Calendly analytics and Freshsales tracking.

---

### Task 2 — `DemoForm.jsx`: Loading state on "Book My Slot" button
**Effort:** 10 min | **Risk:** Zero

Add a `popupLoading` state and wire it to the button:

```javascript
// Add state
const [popupLoading, setPopupLoading] = useState(false);

// Update openPopup
const openPopup = async () => {
  setPopupLoading(true);
  try {
    await loadCalendlyScript();
    if (!window.Calendly) {
      toast.error("Could not load booking widget. Please try again.");
      return;
    }
    window.Calendly.showPopupWidget(url, { prefill: {...}, utm: {...} });
  } finally {
    setPopupLoading(false);
  }
};

// Update button
<button
  onClick={openPopup}
  disabled={popupLoading}
  data-testid="demo-book-slot-btn"
  className="w-full bg-brand-green ... disabled:opacity-60 disabled:cursor-not-allowed"
>
  {popupLoading
    ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading...</>
    : "Book My Slot"
  }
</button>
```

`Loader2` is already imported in `DemoForm.jsx` (line 4).

---

### Task 3 — `DemoForm.jsx`: Reactive `isMobile` check
**Effort:** 10 min | **Risk:** Low

Replace inline check with a reactive state that listens to `resize` events:

```javascript
// Add state (near top of component)
const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

useEffect(() => {
  const handler = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}, []);
```

Remove the inline `const isMobile = window.innerWidth < 768;` from inside the `stage === "calendly"` block.

---

### Task 4 — `CalendlyInline.jsx`: Flexible height on desktop
**Effort:** 5 min | **Risk:** Low

Use `min-height` via CSS class rather than fixed inline style, allowing the widget to use available space:

```javascript
// Before (line 109)
style={{ minWidth: "280px", height: "660px" }}

// After
style={{ minWidth: "280px", minHeight: "660px", height: "100%" }}
```

The parent div in DemoForm already has `overflow` handling — this change lets the widget expand if the viewport is taller without cutting it off on shorter screens.

---

## 5. Implementation Order

| Order | Task | File | Time | Impact |
|---|---|---|---|---|
| 1 | Add UTM to mobile popup | `DemoForm.jsx` | 5 min | 🟡 CRM data integrity |
| 2 | Loading state on button | `DemoForm.jsx` | 10 min | 🟡 UX trust |
| 3 | Reactive `isMobile` | `DemoForm.jsx` | 10 min | 🟢 Edge case |
| 4 | Flexible height | `CalendlyInline.jsx` | 5 min | 🟢 Minor scroll |

Tasks 1–4 are a single deploy. Total code time: ~30 min.

---

## 6. Definition of Done

- [ ] Mobile booking via popup: Calendly webhook `utm_content` = Freshsales contactId
- [ ] Mobile booking via popup: Calendly webhook `utm_term` = MongoDB leadId  
- [ ] "Book My Slot" shows spinner and is disabled during script load
- [ ] "Book My Slot" shows toast error if Calendly script fails to load
- [ ] Rotating phone to landscape re-evaluates mobile/desktop widget choice
- [ ] No regression on desktop inline Calendly flow
- [ ] Tested: Chrome Android, Safari iOS, Chrome Desktop

---

## 7. Out of Scope

- Changing Calendly event type or booking duration
- Server-side Calendly webhook logic changes
- WhatsApp confirmation flow post-booking
- WebOTP API (covered in CR-43)
