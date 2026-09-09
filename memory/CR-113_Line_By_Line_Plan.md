# CR-113 — Line-by-Line Implementation Plan
**Written:** 2026-08-20  
**Tracking reference:** `/app/memory/CR-113_Tracking_Behaviour_Map.md`  
**Files touched:** `PetpoojaAlternative.jsx` only (3 files untouched: StickyMobileCta.jsx, DemoForm.jsx, all lib files)  
**Execution order:** Steps 1 → 2 → 3 → 4 → 5 → 6 → 7 (mandatory)  
**Hot-reload:** All steps auto-reload except none (no .env changes)

---

## Pre-flight

- [ ] `sudo supervisorctl status` — both services running
- [ ] Open `/petpooja-alternative` on real mobile device or 390px DevTools viewport
- [ ] Note current state: H1 7 lines, no navbar CTA, bottom sticky bar visible

---

## STEP 1 — Remove StickyMobileCta (CR-74b revert)

**Why first:** Removes the component we're replacing. Clean slate before adding new ones.  
**File:** `PetpoojaAlternative.jsx`

### 1a — Remove import (line 2)
**Before:**
```jsx
import { useState } from "react";
import StickyMobileCta from "@/components/home/StickyMobileCta";
```
**After:**
```jsx
import { useState, useEffect, useRef } from "react";
```
Note: `useEffect` and `useRef` added here — needed for QuickDemoSheet in Step 3.

### 1b — Remove usage (line 697)
**Before (lines 696–698):**
```jsx
      <LandingFooter />
      <StickyMobileCta onDemo={() => document.getElementById("vsp-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
    </div>
```
**After:**
```jsx
      <LandingFooter />
    </div>
```
(QuickDemoSheet will be added back in Step 7b)

**Checkpoint after Step 1:**
- Hot-reload compiles clean
- No sticky bar at bottom of `/petpooja-alternative`
- Homepage sticky bar unaffected (StickyMobileCta.jsx not touched)

**Rollback:** Re-add `StickyMobileCta` import + JSX usage.

---

## STEP 2 — Add required imports

**File:** `PetpoojaAlternative.jsx`  
**Current import block (lines 1–17):**
```jsx
import { useState, useEffect, useRef } from "react";  // already updated in Step 1
import { ArrowRight, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Link } from "react-router-dom";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import Logo from "@/components/site/Logo";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc, useCms } from "@/lib/cms/CmsProvider";
import { pushEvent } from "@/lib/gtm";
import {
  VSP_HERO, VSP_STATS, VSP_QUOTES, VSP_AI,
  VSP_COMP_LEAN, VSP_COMP_FULL, VSP_TRUST_LOGOS,
  VSP_SWITCH_BADGES,
} from "@/data/vsp";
import { COMPANY } from "@/data/company";
```

**After (add 7 new import lines):**
```jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, ChevronUp, Check, CalendarCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import DemoForm from "@/components/site/DemoForm";
import OtpVerifyBlock from "@/components/site/OtpVerifyBlock";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import Logo from "@/components/site/Logo";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc, useCms } from "@/lib/cms/CmsProvider";
import { pushLead, newEventId } from "@/lib/gtm";
import { getAttribution } from "@/lib/attribution";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { ensureCalendlyCss } from "@/lib/calendlyCss";
import { CALENDLY_URL } from "@/data/content";
import {
  VSP_HERO, VSP_STATS, VSP_QUOTES, VSP_AI,
  VSP_COMP_LEAN, VSP_COMP_FULL, VSP_TRUST_LOGOS,
  VSP_SWITCH_BADGES,
} from "@/data/vsp";
import { COMPANY } from "@/data/company";
```

**What changed:**
- `axios` — for `/api/demo-request` and `/api/demo-booked` calls
- `toast` from sonner — for error/success toasts
- `CalendarCheck, Loader2` added to lucide-react import — for booked confirmation icon and loading spinner
- `OtpVerifyBlock` — reused as-is for OTP stage
- `pushLead, newEventId` — ad tracking (replaces `pushEvent` only import)
- `getAttribution` — attribution data at form submit
- `useAntiBot, Honeypot, leadQuality` — anti-bot signals
- `ensureCalendlyCss` — CR-50 fix for Calendly popup CSS
- `CALENDLY_URL` — Calendly booking URL from env

**Note:** `pushEvent` is removed from the `@/lib/gtm` import — `pushLead` supersedes it for form tracking. But check if `pushEvent` is used elsewhere in the file first.

**Checkpoint:** Verify `pushEvent` usage in file before removing it.

---

## STEP 3 — Add QuickDemoSheet constants + component

**File:** `PetpoojaAlternative.jsx`  
**Insert after line 17 (after `import { COMPANY }...`), before `// ─── Minimal landing Navbar`**

### 3a — Constants (insert after imports, before LandingNavbar)
```jsx
// ─── QuickDemoSheet constants ─────────────────────────────────────────────────
const QDS_API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const QDS_EMPTY = { name: "", phone: "", email: "", business_name: "" };
const QDS_REQUIRED = ["name", "phone", "email"];

function qdsValidate(field, value) {
  if (field === "phone") {
    return /^\d{10}$/.test((value || "").replace(/\D/g, ""))
      ? null : "Enter a valid 10-digit number";
  }
  if (field === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim())
      ? null : "Enter a valid email address";
  }
  return (value || "").trim() ? null : "This field is required";
}

function qdsBrandedUrl(url) {
  try {
    const u = new URL(url);
    [["background_color","ffffff"],["primary_color","18A84A"],["text_color","14201A"],
     ["hide_gdpr_banner","1"],["hide_landing_page_details","1"],["hide_event_type_details","1"]]
      .forEach(([k, v]) => u.searchParams.set(k, v));
    return u.toString();
  } catch { return url; }
}

function loadCalendlyForSheet() {
  ensureCalendlyCss();
  const SRC = "https://assets.calendly.com/assets/external/widget.js";
  return new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const ex = document.querySelector(`script[src="${SRC}"]`);
    if (ex) { ex.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = SRC; s.async = true; s.onload = () => resolve();
    document.body.appendChild(s);
  });
}
```

### 3b — QuickDemoSheet component (insert immediately after 3a constants)
```jsx
// ─── QuickDemoSheet — bottom sheet quick-book form (CR-113) ──────────────────
function QuickDemoSheet({ open, onClose }) {
  const [form, setForm]       = useState(QDS_EMPTY);
  const [errors, setErrors]   = useState({});
  const [stage, setStage]     = useState("form");
  const [lead, setLead]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);
  const { hp, setHp, signals } = useAntiBot();
  const [eventId]   = useState(() => newEventId());
  const scheduledRef = useRef(false);

  // Reset when sheet closes (after close animation)
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setForm(QDS_EMPTY); setErrors({}); setStage("form");
        setLead(null); setLoading(false); scheduledRef.current = false;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Calendly postMessage — always popup path (sheet is narrow, no inline)
  // Mirrors DemoForm mobile path exactly. scheduledRef prevents double-fire.
  useEffect(() => {
    if (stage !== "calendly") return;
    const handler = (e) => {
      if (typeof e.data !== "object" || !e.data) return;
      if (String(e.data.event || "").indexOf("calendly") !== 0) return;
      if (e.data.event === "calendly.event_scheduled" && !scheduledRef.current) {
        scheduledRef.current = true;
        pushLead("demo_booked", form, "petpooja-alternative", eventId, {
          form_location: "quick_book_sheet_calendly",
          otp_verified: true,
        });
        markBooked();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fieldCls = (name) =>
    `w-full rounded-xl border px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus:outline-none transition-all ${
      errors[name]
        ? "border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
        : "border-brand-line bg-brand-sand/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
    }`;

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: qdsValidate(k, v) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    QDS_REQUIRED.forEach((f) => { newErrors[f] = qdsValidate(f, form[f]); });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${QDS_API}/demo-request`, {
        ...form,
        ...signals(),
        event_id: eventId,
        otp_token: null,
        attribution: getAttribution(),
        outlet_type: "petpooja-alternative",
        source_page: "petpooja-quick-book",
      });
      if (res.data?.saved === false) { toast.error("Something went wrong. Please try again."); return; }
      setLead({ id: res.data?.id, contactId: res.data?.freshsales_contact_id });
      // EVENT 1: form_submitted (₹0)
      pushLead("form_submitted", form, "petpooja-alternative", eventId, {
        otp_verified: false,
        form_location: "quick_book_sheet",
        lead_quality: leadQuality(signals()),
      });
      setStage("otp");
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const markBooked = async () => {
    setStage("booked");
    toast.success("Demo booked! Check your email for the invite.");
    try {
      await axios.post(`${QDS_API}/demo-booked`, {
        freshsales_contact_id: lead?.contactId ?? null,
        email: form.email || null,
        lead_id: lead?.id ?? null,
      });
    } catch { /* best-effort */ }
  };

  const openCalendly = async () => {
    setPopupLoading(true);
    try {
      await loadCalendlyForSheet();
      if (!window.Calendly) { toast.error("Could not load booking widget. Please try again."); return; }
      window.Calendly.initPopupWidget({
        url: qdsBrandedUrl(CALENDLY_URL),
        prefill: {
          name: form.name,
          email: form.email,
          customAnswers: {
            a1: form.business_name ? `Biz: ${form.business_name}` : undefined,
            a2: form.phone ? `+91${form.phone.replace(/\D/g, "").slice(-10)}` : undefined,
          },
        },
        utm: {
          utmContent: lead?.contactId ? String(lead.contactId) : undefined,
          utmTerm:    lead?.id        ? String(lead.id)        : undefined,
          utmSource:  "website",
          utmMedium:  "quick_book_sheet",
        },
      });
    } finally { setPopupLoading(false); }
  };

  const stageIdx = ["form", "otp", "calendly"].indexOf(stage);

  return (
    <>
      {/* Backdrop — tap to close only on form stage */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => { if (stage === "form") onClose(); }}
        data-testid="quick-demo-backdrop"
      />
      {/* Sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[70] bg-white rounded-t-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto ${open ? "translate-y-0" : "translate-y-full"}`}
        data-testid="quick-demo-sheet"
      >
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white">
          <div className="w-10 h-1 bg-brand-line rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= Math.min(stageIdx, 2) ? "w-5 bg-brand-green" : "w-1.5 bg-brand-line"}`} />
            ))}
          </div>

          {/* ── BOOKED ── */}
          {stage === "booked" && (
            <div className="text-center py-6" data-testid="quick-demo-booked">
              <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="w-8 h-8 text-brand-green" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-ink">
                You&apos;re booked, {form.name.split(" ")[0]}!
              </h3>
              <p className="text-sm text-brand-muted mt-2 leading-relaxed">
                Google Meet invite is on its way. We&apos;ve sent details on WhatsApp too.
              </p>
            </div>
          )}

          {/* ── CALENDLY ── */}
          {stage === "calendly" && (
            <div data-testid="quick-demo-calendly">
              <h3 className="font-display text-xl font-bold text-brand-ink mb-1">
                Almost there, {form.name.split(" ")[0]} —
              </h3>
              <p className="text-sm text-brand-muted mb-5">
                Pick a time for your free <strong className="text-brand-ink">45-min walkthrough</strong>.
              </p>
              <button
                onClick={openCalendly}
                disabled={popupLoading}
                data-testid="quick-demo-book-slot-btn"
                className="w-full bg-brand-green hover:bg-brand-greenDark text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_8px_22px_rgba(24,168,74,0.32)]"
              >
                {popupLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                  : "Book My Slot →"}
              </button>
            </div>
          )}

          {/* ── OTP ── */}
          {stage === "otp" && (
            <div data-testid="quick-demo-otp">
              <p className="text-xs text-brand-green font-semibold mb-1">Details saved!</p>
              <h3 className="font-display text-xl font-bold text-brand-ink mb-4">Verify your phone</h3>
              <OtpVerifyBlock
                phone={form.phone}
                leadId={lead?.id}
                formType="demo"
                onVerified={() => {
                  // EVENT 2: book_demo → GTM "thankyou_conversion" (₹200)
                  // NO lead_verified push — matches DemoForm exactly (prevents double Meta fire)
                  pushLead("book_demo", form, "petpooja-alternative", eventId, {
                    otp_verified: true,
                    form_location: "quick_book_sheet",
                  });
                  setStage("calendly");
                }}
                onBack={() => setStage("form")}
              />
            </div>
          )}

          {/* ── FORM ── */}
          {stage === "form" && (
            <form onSubmit={submit} data-testid="quick-demo-form">
              <Honeypot value={hp} onChange={setHp} />
              <h3 className="font-display text-xl font-bold text-brand-ink mb-1">Book a Free Demo</h3>
              <p className="text-sm text-brand-muted mb-4">
                45-min walkthrough for your outlet — live, not a slide deck.
              </p>
              <div className="space-y-3">
                {[
                  { key: "name",  placeholder: "Your name *",     type: "text"  },
                  { key: "phone", placeholder: "Phone number *",  type: "tel"   },
                  { key: "email", placeholder: "Email address *", type: "email" },
                ].map(({ key, placeholder, type }) => (
                  <div key={key}>
                    <input
                      type={type}
                      className={fieldCls(key)}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      onBlur={() => setErrors((er) => ({ ...er, [key]: qdsValidate(key, form[key]) }))}
                      data-testid={`quick-demo-input-${key}`}
                    />
                    {errors[key] && (
                      <p className="text-xs text-red-500 mt-1" data-testid={`quick-demo-error-${key}`}>
                        {errors[key]}
                      </p>
                    )}
                  </div>
                ))}
                <input
                  type="text"
                  className={`${fieldCls("business_name")} border-dashed`}
                  placeholder="Business name (optional)"
                  value={form.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  data-testid="quick-demo-input-business"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                data-testid="quick-demo-submit-btn"
                className="mt-5 w-full bg-brand-green hover:bg-brand-greenDark text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_8px_22px_rgba(24,168,74,0.32)]"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <>Get My Free Walkthrough <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-brand-muted text-center mt-2">
                No spam. Only used to schedule your demo.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
```

**Checkpoint after Step 3:**
- Hot-reload fires, compiles clean
- No visual change yet (QuickDemoSheet not used in page shell)
- No console errors

**Rollback:** Delete entire QuickDemoSheet constants + component block.

---

## STEP 4 — Update LandingNavbar: add `onQuickBook` prop + button

**File:** `PetpoojaAlternative.jsx`  
**Target:** Lines 20–28 (LandingNavbar function)

**Before (exact):**
```jsx
// ─── Minimal landing Navbar (logo only — no exit links) ──────────────────────
function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="landing-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center">
        <Logo />
      </div>
    </header>
  );
}
```

**After:**
```jsx
// ─── Minimal landing Navbar (logo + CTA — CR-113) ─────────────────────────────
function LandingNavbar({ onQuickBook }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="landing-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <button
          onClick={onQuickBook}
          data-testid="landing-navbar-book-btn"
          className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]"
        >
          Book Free Demo
        </button>
      </div>
    </header>
  );
}
```

**What changed:**
- Added `{ onQuickBook }` prop
- `flex items-center` → `flex items-center justify-between` (pushes button to right)
- Added green pill button: `data-testid="landing-navbar-book-btn"`

**Checkpoint:**
- Navbar shows "Book Free Demo" green button on right
- Button visible on desktop AND mobile immediately (no scroll needed)
- Clicking button does nothing yet (page shell not wired — Step 7)

**Rollback:** Revert LandingNavbar to original single-item version.

---

## STEP 5 — H1 font size: mobile text-4xl → text-3xl (Change A part 1)

**File:** `PetpoojaAlternative.jsx`  
**Line:** 76

**Before (exact):**
```jsx
              className="font-display text-4xl sm:text-5xl lg:text-[52px] font-bold text-brand-ink leading-[1.1] tracking-tight mb-5"
```

**After:**
```jsx
              className="font-display text-3xl sm:text-5xl lg:text-[52px] font-bold text-brand-ink leading-[1.1] tracking-tight mb-5"
```

One class change: `text-4xl` → `text-3xl`. Tablet (`sm:`) and desktop (`lg:`) unchanged.

**Checkpoint:**
- Mobile (390px): H1 wraps to ~5 lines instead of 7
- Tablet (640px+): H1 unchanged
- Desktop (1024px+): H1 unchanged

**Rollback:** Revert `text-3xl` → `text-4xl`.

---

## STEP 6 — Add inline stat chips above H1 (Change A part 2)

**File:** `PetpoojaAlternative.jsx`  
**Insert:** After `<div>` at line 74, BEFORE `<h1>` at line 75

**Before (line 73–76):**
```jsx
          {/* Left */}
          <div>
            <h1
              className="font-display text-3xl sm:text-5xl lg:text-[52px] font-bold text-brand-ink leading-[1.1] tracking-tight mb-5"
```

**After:**
```jsx
          {/* Left */}
          <div>
            {/* Mobile stat chips — proof above fold, hidden lg+ (stat cards show on desktop) */}
            <div className="flex gap-3 mb-5 lg:hidden" data-testid="vsp-hero-stat-chips">
              <div className="bg-white border border-brand-line rounded-2xl px-4 py-3 flex-1">
                <div className="font-display text-2xl font-bold text-brand-green leading-none">₹1L</div>
                <div className="text-[11px] text-brand-muted mt-1 leading-tight">leakage caught in 2 weeks</div>
              </div>
              <div className="bg-white border border-brand-line rounded-2xl px-4 py-3 flex-1">
                <div className="font-display text-2xl font-bold text-brand-orange leading-none">40%</div>
                <div className="text-[11px] text-brand-muted mt-1 leading-tight">lower fixed costs</div>
              </div>
            </div>
            <h1
              className="font-display text-3xl sm:text-5xl lg:text-[52px] font-bold text-brand-ink leading-[1.1] tracking-tight mb-5"
```

**Checkpoint:**
- Mobile (390px): Two stat chips (₹1L green, 40% orange) visible ABOVE H1
- Desktop (1024px+): Stat chips hidden (`lg:hidden`), desktop stat card grid still visible
- `data-testid="vsp-hero-stat-chips"` present

**Rollback:** Remove the `<div className="flex gap-3 mb-5 lg:hidden" ...>` block.

---

## STEP 7 — Wire page shell: state + QuickDemoSheet + LandingNavbar prop

**File:** `PetpoojaAlternative.jsx`  
**Target:** Lines 672–701 (PetpoojaAlternative function)

### 7a — Add `sheetOpen` state to page shell

**Before (line 672–678):**
```jsx
export default function PetpoojaAlternative() {
  // CMS content doc
  const doc = useContentDoc("vsp", {
    hero: VSP_HERO,
    s2: { eyebrow: "Why we exist differently" },
    s3: { video_url: null },
  });
```

**After:**
```jsx
export default function PetpoojaAlternative() {
  const [sheetOpen, setSheetOpen] = useState(false);
  // CMS content doc
  const doc = useContentDoc("vsp", {
    hero: VSP_HERO,
    s2: { eyebrow: "Why we exist differently" },
    s3: { video_url: null },
  });
```

### 7b — Pass `onQuickBook` to LandingNavbar + add QuickDemoSheet

**Before (lines 687–699):**
```jsx
      <LandingNavbar />
      <main>
        <VspHero                    doc={doc} />
        <VspPhilosophy              doc={doc} />
        <VspProof                   doc={doc} />
        <VspAi                      doc={doc} />
        <VspPricing                 doc={doc} />
        <VspCta                     doc={doc} />
      </main>
      <LandingFooter />
    </div>
```

**After:**
```jsx
      <LandingNavbar onQuickBook={() => setSheetOpen(true)} />
      <main>
        <VspHero                    doc={doc} />
        <VspPhilosophy              doc={doc} />
        <VspProof                   doc={doc} />
        <VspAi                      doc={doc} />
        <VspPricing                 doc={doc} />
        <VspCta                     doc={doc} />
      </main>
      <LandingFooter />
      <QuickDemoSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
```

**Checkpoint after Step 7:**
- "Book Free Demo" button in navbar opens the bottom sheet
- Sheet slides up from bottom with dark backdrop
- All 4 stages work: form → OTP → Calendly → booked
- Tapping backdrop (on form stage) closes the sheet
- Desktop: sheet works via popup (not inline Calendly)
- Mobile: sheet works via popup
- No bottom sticky bar visible
- Main VspCta DemoForm still works as before

**Rollback:** Remove `sheetOpen` state, revert LandingNavbar line, remove QuickDemoSheet from JSX.

---

## STEP 8 — Verify `pushEvent` usage (pre-implementation check)

Before executing, confirm `pushEvent` is still used elsewhere in the file:

```bash
grep -n "pushEvent" /app/frontend/src/pages/PetpoojaAlternative.jsx
```

Expected: one usage in the comparison expand handler. If found, keep `pushEvent` in the gtm import alongside `pushLead, newEventId`. If not found, `pushEvent` can be dropped.

**Exact import fix based on grep result:**
- If `pushEvent` IS used: `import { pushLead, newEventId, pushEvent } from "@/lib/gtm";`
- If `pushEvent` NOT used: `import { pushLead, newEventId } from "@/lib/gtm";`

---

## Post-Implementation Validation Checklist

### Change A — Hero resize
- [ ] Mobile 390px: H1 is ~5 lines (not 7) — inspect computed font-size = 30px
- [ ] Mobile: ₹1L (green) + 40% (orange) stat chips visible above H1
- [ ] Desktop: stat chips hidden, desktop stat card grid visible (unchanged)

### Change B — Navbar CTA
- [ ] "Book Free Demo" button visible on right side of navbar on all screen sizes
- [ ] Button visible on page load without scrolling
- [ ] `data-testid="landing-navbar-book-btn"` present in DOM

### Change C — QuickDemoSheet
- [ ] Tapping navbar button opens sheet (slides up from bottom)
- [ ] Dark backdrop visible behind sheet
- [ ] `data-testid="quick-demo-sheet"` present
- [ ] Progress dots show 3 stages
- [ ] Form: name + phone + email (required) + business name (dashed border = optional)
- [ ] `data-testid` on all 4 inputs: `quick-demo-input-name/phone/email/business`
- [ ] Validation: submit with empty fields shows errors
- [ ] Submit: calls `/api/demo-request` with correct params
- [ ] `form_submitted` GTM event fires (check DevTools → Console → dataLayer)
- [ ] OTP stage: `OtpVerifyBlock` renders within sheet
- [ ] OTP verified: `book_demo` → `thankyou_conversion` fires (check dataLayer)
- [ ] Calendly stage: "Book My Slot" button triggers popup
- [ ] Calendly popup: name + email pre-filled
- [ ] Calendly booked: `demo_booked` fires, `/api/demo-booked` called
- [ ] Booked confirmation: CalendarCheck icon + personalised message
- [ ] Backdrop tap (form stage): sheet closes
- [ ] Backdrop tap (OTP/calendly stage): sheet stays open
- [ ] Reset on close: reopening sheet shows clean form

### Change D — Sticky bar removed
- [ ] No bottom sticky bar on `/petpooja-alternative`
- [ ] Homepage sticky bar still works (scroll past hero on homepage)

### Ad tracking verification
- [ ] Open DevTools → Console, run: `window.dataLayer` — see events array
- [ ] `form_submitted` event in dataLayer after form submit
- [ ] `thankyou_conversion` event in dataLayer after OTP
- [ ] `demo_booked` event in dataLayer after Calendly booking
- [ ] All events contain `gclid`, `fbclid` fields (populated from attribution)

---

## Execution Summary Table

| Step | What | Lines affected | Risk |
|---|---|---|---|
| 1a | Remove StickyMobileCta import | Line 1–2 | Low |
| 1b | Remove StickyMobileCta JSX | Line 697 | Low |
| 2 | Add 7 new imports | Lines 1–17 | Low |
| 3a | Add QDS constants | After line 17 | Low |
| 3b | Add QuickDemoSheet component | After 3a | Medium (new component) |
| 4 | Update LandingNavbar | Lines 20–28 | Low |
| 5 | H1 font class | Line 76 | Low |
| 6 | Add stat chips | After line 74 | Low |
| 7a | Add sheetOpen state | Line 672 | Low |
| 7b | Wire navbar + QuickDemoSheet | Lines 687–699 | Low |

**Mandatory order:** 1 → 2 → 3 → 4 → 5 → 6 → 7  
**Step 8** (pushEvent check): do BEFORE step 2, takes 5 seconds.  
**All changes in one file only.**

---

*Plan written 2026-08-20. All line numbers verified against live file. Tracking behaviour cross-referenced against CR-113_Tracking_Behaviour_Map.md.*
