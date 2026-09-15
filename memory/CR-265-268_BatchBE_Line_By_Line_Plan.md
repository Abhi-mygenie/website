# CR-265–268 · Batch BE · Line-by-Line Plan
**Written:** 2026-09-14 (planning agent, no code changed)
**Status:** DRAFT — owner reviews Impact Analysis first, then approves this plan
**Preceding doc:** `CR-265-268_BatchBE_ImpactAnalysis.md`
**Implements:** CR-265 (5 LP CTAs → anchor), CR-266 (ScrollToTop guard), CR-267 (cta_click / sheet_open events), CR-268 (remove consent banner)

---

## How to use this plan

- Apply every step using `search_replace` tool (not file rewrite).
- Steps within the same file are listed in ORDER — apply top-to-bottom within each file.
- Each step shows the EXACT current string (`OLD`) and the replacement (`NEW`).
- After all steps: run `yarn build` (≈2 min), then `sudo supervisorctl restart frontend`.
- QA checklist is at the end (§12).

---

## STEP 1 — `src/App.js` · CR-266 + CR-268

### 1a — Add `useRef` to React import (CR-266)

**OLD:**
```
import { useEffect, useState, Suspense, lazy } from "react";
```

**NEW:**
```
import { useEffect, useState, Suspense, lazy, useRef } from "react";
```

---

### 1b — Remove `ConsentBanner` import (CR-268)

**OLD:**
```
import ConsentBanner from "@/components/site/ConsentBanner";
```

**NEW:** *(empty — delete the line)*
```

```

---

### 1c — Add `isFirstRun` guard to `ScrollToTop` (CR-266)

**OLD:**
```
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
```

**NEW:**
```
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
```

---

### 1d — Remove `<ConsentBanner />` render (CR-268)

**OLD:**
```
      <ConsentBanner />
```

**NEW:** *(empty — delete the line)*
```

```

---

## STEP 2 — `src/pages/RestaurantBillingSoftware.jsx` · CR-265 + CR-267

### 2a — Add `pushEvent` import

**OLD:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**NEW:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
import { pushEvent } from "@/lib/gtm";
```

---

### 2b — Navbar CTA: button → anchor + cta_click event (CR-265 + CR-267)

**OLD:**
```
        <button type="button" onClick={onDemo} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="billing-lp-navbar-cta">
          Book Free Demo
        </button>
```

**NEW:**
```
        <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "navbar", page_path: window.location.pathname }); onDemo(); }} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="billing-lp-navbar-cta">
          Book Free Demo
        </a>
```

---

### 2c — Pricing CTA: button → anchor + cta_click event (CR-265 + CR-267)

**OLD:**
```
                <button type="button" onClick={openSheet} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`billing-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </button>
```

**NEW:**
```
                <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: `pricing-${plan.name.toLowerCase()}`, page_path: window.location.pathname }); openSheet(); }} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`billing-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </a>
```

---

### 2d — Hero CTA: button → anchor + cta_click event (CR-265 + CR-267)

**OLD:**
```
                  <button type="button" onClick={openSheet} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="billing-lp-cta-primary">
                    Book a Free Demo <ArrowRight className="w-5 h-5" />
                  </button>
```

**NEW:**
```
                  <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "hero", page_path: window.location.pathname }); openSheet(); }} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="billing-lp-cta-primary">
                    Book a Free Demo <ArrowRight className="w-5 h-5" />
                  </a>
```

---

## STEP 3 — `src/pages/RestaurantPosSystem.jsx` · CR-265 + CR-267

### 3a — Add `pushEvent` import

**OLD:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**NEW:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
import { pushEvent } from "@/lib/gtm";
```

---

### 3b — Navbar CTA (CR-265 + CR-267)

**OLD:**
```
        <button type="button" onClick={onDemo} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="pos-lp-navbar-cta">
          Book Free Demo
        </button>
```

**NEW:**
```
        <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "navbar", page_path: window.location.pathname }); onDemo(); }} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="pos-lp-navbar-cta">
          Book Free Demo
        </a>
```

---

### 3c — Pricing CTA (CR-265 + CR-267)

**OLD:**
```
                <button type="button" onClick={openSheet} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`pos-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </button>
```

**NEW:**
```
                <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: `pricing-${plan.name.toLowerCase()}`, page_path: window.location.pathname }); openSheet(); }} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`pos-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </a>
```

---

### 3d — Hero CTA (CR-265 + CR-267)

**OLD:**
```
                  <button type="button" onClick={openSheet} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="pos-lp-cta-primary">
                    Book a Free POS Demo <ArrowRight className="w-5 h-5" />
                  </button>
```

**NEW:**
```
                  <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "hero", page_path: window.location.pathname }); openSheet(); }} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="pos-lp-cta-primary">
                    Book a Free POS Demo <ArrowRight className="w-5 h-5" />
                  </a>
```

---

## STEP 4 — `src/pages/RestaurantManagementSoftware.jsx` · CR-265 + CR-267

### 4a — Add `pushEvent` import

**OLD:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**NEW:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
import { pushEvent } from "@/lib/gtm";
```

---

### 4b — Navbar CTA (CR-265 + CR-267)

**OLD:**
```
        <button type="button" onClick={onDemo} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="mgmt-lp-navbar-cta">
          Book Free Demo
        </button>
```

**NEW:**
```
        <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "navbar", page_path: window.location.pathname }); onDemo(); }} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="mgmt-lp-navbar-cta">
          Book Free Demo
        </a>
```

---

### 4c — Pricing CTA (CR-265 + CR-267)

**OLD:**
```
                <button type="button" onClick={openSheet} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`mgmt-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </button>
```

**NEW:**
```
                <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: `pricing-${plan.name.toLowerCase()}`, page_path: window.location.pathname }); openSheet(); }} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`mgmt-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </a>
```

---

### 4d — Hero CTA (CR-265 + CR-267)

**OLD:**
```
                  <button type="button" onClick={openSheet} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="mgmt-lp-cta-primary">
                    Book a Free Management Demo <ArrowRight className="w-5 h-5" />
                  </button>
```

**NEW:**
```
                  <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "hero", page_path: window.location.pathname }); openSheet(); }} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="mgmt-lp-cta-primary">
                    Book a Free Management Demo <ArrowRight className="w-5 h-5" />
                  </a>
```

---

## STEP 5 — `src/pages/CloudKitchenPos.jsx` · CR-265 + CR-267

### 5a — Add `pushEvent` import

**OLD:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**NEW:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
import { pushEvent } from "@/lib/gtm";
```

---

### 5b — Navbar CTA (CR-265 + CR-267)

**OLD:**
```
        <button type="button" onClick={onDemo} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="ck-lp-navbar-cta">
          Book Free Demo
        </button>
```

**NEW:**
```
        <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "navbar", page_path: window.location.pathname }); onDemo(); }} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="ck-lp-navbar-cta">
          Book Free Demo
        </a>
```

---

### 5c — Pricing CTA (CR-265 + CR-267)

**OLD:**
```
                <button type="button" onClick={openSheet} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`ck-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </button>
```

**NEW:**
```
                <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: `pricing-${plan.name.toLowerCase()}`, page_path: window.location.pathname }); openSheet(); }} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`ck-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </a>
```

---

### 5d — Hero CTA (CR-265 + CR-267)

**OLD:**
```
                  <button type="button" onClick={openSheet} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="ck-lp-cta-primary">
                    Book a Free Cloud Kitchen Demo <ArrowRight className="w-5 h-5" />
                  </button>
```

**NEW:**
```
                  <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "hero", page_path: window.location.pathname }); openSheet(); }} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="ck-lp-cta-primary">
                    Book a Free Cloud Kitchen Demo <ArrowRight className="w-5 h-5" />
                  </a>
```

---

## STEP 6 — `src/pages/QsrPosSystem.jsx` · CR-265 + CR-267

### 6a — Add `pushEvent` import

**OLD:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**NEW:**
```
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
import { pushEvent } from "@/lib/gtm";
```

---

### 6b — Navbar CTA (CR-265 + CR-267)

**OLD:**
```
        <button type="button" onClick={onDemo} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="qsr-lp-navbar-cta">
          Book Free Demo
        </button>
```

**NEW:**
```
        <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "navbar", page_path: window.location.pathname }); onDemo(); }} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="qsr-lp-navbar-cta">
          Book Free Demo
        </a>
```

---

### 6c — Pricing CTA (CR-265 + CR-267)

**OLD:**
```
                <button type="button" onClick={openSheet} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`qsr-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </button>
```

**NEW:**
```
                <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: `pricing-${plan.name.toLowerCase()}`, page_path: window.location.pathname }); openSheet(); }} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`qsr-plan-cta-${plan.name.toLowerCase()}`}>
                  Get Started
                </a>
```

---

### 6d — Hero CTA (CR-265 + CR-267)

**OLD:**
```
                  <button type="button" onClick={openSheet} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="qsr-lp-cta-primary">
                    Book a Free QSR Demo <ArrowRight className="w-5 h-5" />
                  </button>
```

**NEW:**
```
                  <a href="#lp-demo" onClick={(e) => { e.preventDefault(); pushEvent("cta_click", { cta_location: "hero", page_path: window.location.pathname }); openSheet(); }} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="qsr-lp-cta-primary">
                    Book a Free QSR Demo <ArrowRight className="w-5 h-5" />
                  </a>
```

---

## STEP 7 — `src/components/site/DemoBottomSheet.jsx` · CR-267

### 7a — Add `pushEvent` to existing gtm import

**OLD:**
```
import { pushLead, newEventId } from "@/lib/gtm";
```

**NEW:**
```
import { pushLead, newEventId, pushEvent } from "@/lib/gtm";
```

---

### 7b — Add `sheet_open` useEffect after the existing reset useEffect

The existing reset `useEffect` (the first one, which fires when `open` changes to false) ends at line ~60 with `}, [open]);`. The `sheet_open` effect is added immediately after it.

**OLD:**
```
  // Reset when sheet closes (after close animation completes)
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setForm(QDS_EMPTY); setErrors({}); setStage("form");
        setLead(null); setLoading(false); scheduledRef.current = false;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);
```

**NEW:**
```
  // Reset when sheet closes (after close animation completes)
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setForm(QDS_EMPTY); setErrors({}); setStage("form");
        setLead(null); setLoading(false); scheduledRef.current = false;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // CR-267: fire sheet_open when sheet transitions from closed → open
  useEffect(() => {
    if (open) pushEvent("sheet_open", { sector });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
```

---

## STEP 8 — `src/components/home/StickyMobileCta.jsx` · CR-267 + CR-268

### 8a — Replace `hasConsentChoice` import with `pushEvent` import (CR-268 + CR-267)

**OLD:**
```
import { hasConsentChoice } from "@/lib/gtm";
```

**NEW:**
```
import { pushEvent } from "@/lib/gtm";
```

---

### 8b — Remove `consentUp` state (CR-268)

**OLD:**
```
  const [consentUp, setConsentUp] = useState(!hasConsentChoice());
```

**NEW:** *(empty — delete the line)*
```

```

---

### 8c — Remove consent MutationObserver useEffect (CR-268)

**OLD:**
```
  // Track consent banner in DOM — adjust bottom offset when it's showing.
  // Initial value from useState(!hasConsentChoice()) is correct at mount.
  // MutationObserver updates when banner mounts/unmounts (e.g. after user accepts).
  useEffect(() => {
    const check = () => setConsentUp(!!document.querySelector('[data-testid="consent-banner"]'));
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
```

**NEW:** *(empty — delete these lines)*
```

```

---

### 8d — Add `cta_click` event to `handleClick` (CR-267)

**OLD:**
```
  const handleClick = () => {
    if (onDemo) {
      onDemo();
    } else {
      document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
```

**NEW:**
```
  const handleClick = () => {
    pushEvent("cta_click", { cta_location: "sticky", page_path: window.location.pathname });
    if (onDemo) {
      onDemo();
    } else {
      document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
```

---

### 8e — Simplify translate class: remove `consentUp` ternary (CR-268)

**OLD:**
```
        visible ? (consentUp ? "-translate-y-12" : "translate-y-0") : "translate-y-full"
```

**NEW:**
```
        visible ? "translate-y-0" : "translate-y-full"
```

---

## STEP 9 — Delete `src/components/site/ConsentBanner.jsx` · CR-268

Run this shell command (not a search_replace — file deletion):
```bash
rm /app/frontend/src/components/site/ConsentBanner.jsx
```

Confirm no other file imports it first:
```bash
grep -r "ConsentBanner" /app/frontend/src/
```
Expected result: zero matches (after Step 1b and 1d are applied).

---

## STEP 10 — `src/index.css` · CR-268

Remove the `body.consent-banner-open` block (CR-93 rules). These are lines 69–77 in the current file.

**OLD:**
```

/* CR-93 — push content above consent banner on mobile/tablet */
body.consent-banner-open {
  padding-bottom: 48px; /* h-12 banner height */
}
@media (min-width: 1024px) {
  body.consent-banner-open {
    padding-bottom: 0; /* desktop: thin banner, no overlap */
  }
}
```

**NEW:** *(empty — delete these lines)*
```

```

---

## STEP 11 — `scripts/prerender.js` · CR-268

Remove the banner-strip code block (lines 115–120 in the current file, inside the `page.evaluate` callback).

**OLD:**
```
        // ── CR-167: strip ConsentBanner — session-dependent UI must not bake into prerendered HTML ─
        // ConsentBanner useEffect fires at mount → Puppeteer captures show=true (banner visible).
        // React hydrates with show=false (initial state) → DOM mismatch → React error #418 → CSR fallback.
        // Strip the element and its body class so prerendered HTML matches React's initial render state.
        document.querySelectorAll('[data-testid="consent-banner"]').forEach(n => n.remove());
        document.body.classList.remove("consent-banner-open");
```

**NEW:** *(empty — delete these lines)*
```

```

---

## STEP 12 — Build, verify, and QA checklist

### Build command (preview)
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

### Production build command (owner runs this on production server)
```bash
REACT_APP_BACKEND_URL=https://www.mygenie.online \
REACT_APP_GTM_ID=GTM-K5D84Z3L \
REACT_APP_WHATSAPP_ENABLED=false \
yarn build
```
Zip `frontend/build/`. Owner deploys + Cloudflare "Purge Everything" + **records `main.*.js` hash and IST time in CR_INTAKE_REGISTER.md**.

### QA checklist (testing agent, preview first)

Run on **both** 1920×800 (desktop) and 390×844 (mobile).

| # | Test | Pass condition |
|---|------|---------------|
| 1 | Visit `/restaurant-billing-software`. Check page HTML. | `grep -c 'href="#lp-demo"'` ≥ 5 |
| 2 | Same check for remaining 4 Alpha pages. | ≥ 5 `href="#lp-demo"` each |
| 3 | Playwright, JS delayed 2.5 s: tap `[data-testid="billing-lp-cta-primary"]` at ~1 s. | `window.location.hash === "#lp-demo"` and `#lp-demo` section in viewport |
| 4 | Playwright, JS ready: tap same CTA. | `[data-testid="quick-demo-sheet"]` has `translate-y-0`; hash unchanged |
| 5 | Open sheet, fill form, submit. | `POST /api/demo-request` 200; dataLayer contains `form_submitted { form_location: "quick_book_sheet" }` |
| 6 | Scroll any LP page to scrollY=1500 during dead window. Wait for React mount. | `window.scrollY` ≈ 1500 after mount (not 0) |
| 7 | Client-side navigate `/pricing` → `/` via in-app link. | `scrollY` = 0 |
| 8 | Tap any CTA on any Alpha LP. | `cta_click { cta_location: "hero"\|"navbar"\|"pricing-*" }` in `window.dataLayer` |
| 9 | Open bottom sheet. | `sheet_open { sector: "..." }` in `window.dataLayer` |
| 10 | 390×844, cleared localStorage: check for consent banner. | `[data-testid="consent-banner"]` absent; sticky CTA at `bottom-0`; no padding-bottom on body |
| 11 | Open sheet on mobile (no banner). | Submit button and "No spam" text fully visible; nothing overlapping |
| 12 | Check `window.dataLayer` on any page load. | Contains `consent default` entries (region-aware) from `setDefaultConsent` |
| 13 | Visit homepage and Petpooja. | No visual or functional regression. Anchors still work. |
| 14 | `grep -r "consent-banner" /app/frontend/src/` | Zero matches |
| 15 | `grep -r "ConsentBanner" /app/frontend/src/` | Zero matches |

---

## Change summary

| CR | Files changed | Edits |
|----|--------------|-------|
| CR-265 | 5 LP files | 25 CTA button→anchor changes |
| CR-266 | `App.js` | 2 edits (useRef import, guard in ScrollToTop) |
| CR-267 | 5 LP files, `DemoBottomSheet.jsx`, `StickyMobileCta.jsx` | 8 pushEvent additions |
| CR-268 | `App.js`, `StickyMobileCta.jsx`, `index.css`, `prerender.js`, delete `ConsentBanner.jsx` | 9 edits + 1 deletion |
| **Total** | **11 files** | **~44 targeted edits, 1 file deleted** |

`lib/gtm.js` and `public/index.html` are **not touched**.

---

*Line-by-line plan complete. No code has been changed. Ready for owner review.*
