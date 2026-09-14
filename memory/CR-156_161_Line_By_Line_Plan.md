# Batch N — Line-By-Line Implementation Plans
# CR-156 + CR-161 (DemoForm.jsx — same file, implement together)

**Date:** 2026-08-26  
**Files changed:** `DemoForm.jsx` only (both CRs)  
**Total lines changed:** ~10 lines  
**Recommended:** Single edit session — CR-156 changes props at call sites, CR-161 changes DemoForm.jsx

---

## CR-156 — All DemoForms → shortForm

### Overview
Add `shortForm` prop to 8 call sites. Each change is exactly 1 word.  
**No changes to `DemoForm.jsx` itself** — only the call sites.

---

### File 1 — `frontend/src/pages/SectorPage.jsx` (L263)

**Current:**
```jsx
                <DemoForm sector={s.name} />
```
**Change to:**
```jsx
                <DemoForm sector={s.name} shortForm />
```

---

### File 2 — `frontend/src/pages/About.jsx` (L91)

**Current:**
```jsx
            <Reveal delay={0.1}><DemoForm /></Reveal>
```
**Change to:**
```jsx
            <Reveal delay={0.1}><DemoForm shortForm /></Reveal>
```

---

### File 3 — `frontend/src/pages/ProductIndex.jsx` (L121)

**Current:**
```jsx
            <Reveal delay={0.1}><div id="product-index-demo" className="scroll-mt-20"><DemoForm /></div></Reveal>
```
**Change to:**
```jsx
            <Reveal delay={0.1}><div id="product-index-demo" className="scroll-mt-20"><DemoForm shortForm /></div></Reveal>
```

---

### File 4 — `frontend/src/pages/AiPage.jsx` (L267)

**Current:**
```jsx
            <Reveal delay={0.1}><div id="ai-demo" className="scroll-mt-20"><DemoForm /></div></Reveal>
```
**Change to:**
```jsx
            <Reveal delay={0.1}><div id="ai-demo" className="scroll-mt-20"><DemoForm shortForm /></div></Reveal>
```

---

### File 5 — `frontend/src/pages/SolutionsIndex.jsx` (L122)

**Current:**
```jsx
            <Reveal delay={0.1}><div id="solutions-demo" className="scroll-mt-20"><DemoForm /></div></Reveal>
```
**Change to:**
```jsx
            <Reveal delay={0.1}><div id="solutions-demo" className="scroll-mt-20"><DemoForm shortForm /></div></Reveal>
```

---

### File 6 — `frontend/src/pages/ProductPage.jsx` (L261)

**Current:**
```jsx
            <Reveal delay={0.1}><div id="product-demo" className="scroll-mt-20"><DemoForm /></div></Reveal>
```
**Change to:**
```jsx
            <Reveal delay={0.1}><div id="product-demo" className="scroll-mt-20"><DemoForm shortForm /></div></Reveal>
```

---

### File 7 — `frontend/src/pages/Contact.jsx` (L28)

**Current:**
```jsx
      {tab === "message" ? <MessageForm /> : <DemoForm />}
```
**Change to:**
```jsx
      {tab === "message" ? <MessageForm /> : <DemoForm shortForm />}
```

---

### File 8 — `frontend/src/components/home/CtaDemo.jsx` (L55)

**Current:**
```jsx
            <DemoForm sector={sector} />
```
**Change to:**
```jsx
            <DemoForm sector={sector} shortForm />
```

---

### What shortForm hides (for QA verification)
After CR-156, on ALL 8 pages the DemoForm should show:
- **Visible:** Name field, Phone field, Email field, Business name field (optional label)
- **Hidden:** Years in business select (`{!shortForm && ...}` at L329)
- **Hidden:** Outlet type dropdown (hidden when `sector` passed OR when `shortForm`) — note: About/ProductIndex/AiPage/SolutionsIndex/ProductPage don't pass sector, so outlet_type was previously shown
- **Hidden:** City field (`{!shortForm && sector !== "meta-demo" && ...}` at L354)

---

### Definition of Done — CR-156
- [ ] All 8 call sites have `shortForm` prop
- [ ] SectorPage form: years_in_business select hidden, city hidden
- [ ] CtaDemo (homepage): same 4 fields visible
- [ ] Contact page "Book a demo" tab: same 4 fields
- [ ] Form still submits successfully (`/api/demo-request` returns 200)
- [ ] Backend: lead saves with blank `years_in_business` — acceptable

---

## CR-161 — DemoForm Submit Button Default Text

### File — `frontend/src/components/site/DemoForm.jsx` (L365)

**Current L365 (entire button text line):**
```jsx
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : submitLabel ? <><span>{submitLabel}</span><ArrowRight className="w-4 h-4" /></> : sector === "meta-demo" ? <><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></> : "Get My Customized Walkthrough"}
```

**Change L365 to:**
```jsx
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : submitLabel ? <><span>{submitLabel}</span><ArrowRight className="w-4 h-4" /></> : <><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></>}
```

**What changed:**
- Removed: `sector === "meta-demo" ? <><span>Book My Free Demo</span>...</> : "Get My Customized Walkthrough"`
- Kept: loading state, submitLabel override
- New default: `<><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></>` — same as meta-demo was

**Also update L367-371** — the `sector === "meta-demo"` sub-note below the button:

**Current L367-371:**
```jsx
      {sector === "meta-demo" ? (
        <p className="text-xs text-brand-muted text-center mt-3">100s of restaurants switched to MyGenie across 75 cities</p>
      ) : (
        <p className="text-xs text-brand-muted text-center mt-3">No spam. We&apos;ll only use this to schedule your demo.</p>
      )}
```

**No change needed here** — the `meta-demo` conditional for the sub-note is fine to keep. It just shows different footer text. Functionally correct.

---

### Definition of Done — CR-161
- [ ] Default submit button reads `"Book My Free Demo →"` (with ArrowRight icon) on all forms without `submitLabel`
- [ ] `sector="meta-demo"` (DemoLanding) shows same "Book My Free Demo →" — same result, simpler code
- [ ] `submitLabel` prop forms (QSR, Cloud Kitchen, Billing, POS, Management LPs) unchanged
- [ ] Loading state (`Sending...` with spinner) unchanged
- [ ] `data-testid="demo-submit-btn"` unchanged

---

## Combined Verification (CR-156 + CR-161 together)

After both changes, test the homepage CtaDemo form:
1. Visit `/` — scroll to demo section
2. Form shows: name, phone, email, business name (4 fields visible)
3. Years in business NOT visible
4. City NOT visible
5. Submit button shows: `"Book My Free Demo →"` with arrow icon

Test SectorPage (e.g. `/solutions/qsr`):
1. Scroll to demo form
2. Same 4 fields
3. Outlet type dropdown NOT visible (sector passed)
4. Submit button: `"Book My Free Demo →"`

*Plans written 2026-08-26. Both CRs affect DemoForm ecosystem — implement in same session.*
