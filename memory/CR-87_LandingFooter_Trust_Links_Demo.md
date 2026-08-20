# CR-87 — Add Phone + Privacy Link to LandingFooter on /demo Page

**Type:** Trust Signal Fix  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** HIGH  
**Plan ID:** H9  
**Effort:** 15 min  
**Improves:** Trust · Conv  
**Scope:** `frontend/src/pages/DemoLanding.jsx`  
**Related:** CR-73 (same fix for /petpooja-alternative)

---

## 1. Problem Statement

The `/demo` page (Meta ad traffic LP) uses the same minimal `LandingFooter` pattern as `/petpooja-alternative` — logo + copyright only. No phone, no email, no privacy policy link. Same transparency issue as CR-73.

---

## 2. Root Cause

**`frontend/src/pages/DemoLanding.jsx` — `LandingFooter` function:**
```jsx
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="demo-landing-footer">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo light />
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd. All rights reserved.</span>
      </div>
    </footer>
  );
}
```

---

## 3. Exact Changes Required

**`frontend/src/pages/DemoLanding.jsx`:**

Add COMPANY import:
```js
import { COMPANY } from "@/data/company";
```

Update LandingFooter:
```jsx
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="demo-landing-footer">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors">{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-brand-yellow transition-colors">{COMPANY.supportEmail}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">&copy; {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
      </div>
    </footer>
  );
}
```

Verify `Link` is imported from `react-router-dom` (add if not present).

---

## 4. Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/DemoLanding.jsx` | Add COMPANY import; update LandingFooter with phone, email, privacy |

---

## 5. Definition of Done

- [ ] /demo footer shows phone, email, and Privacy Policy link
- [ ] Links function correctly (tel:, mailto:, /privacy route)
- [ ] Layout not broken on mobile

---

*CR-87 registered 2026-08-20. Source: SEO & QS Audit · Plan ID H9.*
