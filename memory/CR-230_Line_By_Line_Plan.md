# CR-230 — Line-by-Line Implementation Plan: Modal CTA on 5 Ad Pages

**Date:** 2026-09-08
**Priority:** P0 — Revenue
**Applies to:** RestaurantPosSystem.jsx, RestaurantBillingSoftware.jsx, RestaurantManagementSoftware.jsx, CloudKitchenPos.jsx, QsrPosSystem.jsx
**Also requires:** StickyMobileCta.jsx (1 line change for hero sentinel)

---

## Overview of Changes Per File

| File | Operations |
|---|---|
| `StickyMobileCta.jsx` | Op 1 — 1 line: add lp-hero sentinel |
| `RestaurantPosSystem.jsx` | Ops 2–9 — 8 edits |
| `RestaurantBillingSoftware.jsx` | Ops 10–16 — 7 edits (no hero form needed — confirm) |
| `RestaurantManagementSoftware.jsx` | Ops 17–23 — 7 edits |
| `CloudKitchenPos.jsx` | Ops 24–29 — 6 edits (hero form already present) |
| `QsrPosSystem.jsx` | Ops 30–35 — 6 edits (hero form already present) |

---

## PRE-CONDITION: StickyMobileCta.jsx sentinel fix

### Op 1 — `src/components/home/StickyMobileCta.jsx`

**Why:** StickyMobileCta watches for specific hero `data-testid` values to trigger visibility. The ad pages use testids like `pos-lp-hero`, `billing-lp-hero`, etc. — none match the current list. Without this fix, the sticky bar never becomes visible on any of the 5 ad pages.

**Current (lines ~43–49):**
```js
heroRef.current =
  document.querySelector('[data-testid="hero"]') ||
  document.querySelector('[data-testid="vsp-hero"]') ||
  document.querySelector('[data-testid="sector-hero"]') ||
  document.querySelector('[data-testid="product-hero"]') ||
  document.querySelector('[data-testid="stories-hero"]');
```

**Replace with:**
```js
heroRef.current =
  document.querySelector('[data-testid="hero"]') ||
  document.querySelector('[data-testid="vsp-hero"]') ||
  document.querySelector('[data-testid="sector-hero"]') ||
  document.querySelector('[data-testid="product-hero"]') ||
  document.querySelector('[data-testid="stories-hero"]') ||
  document.querySelector('[data-testid$="-lp-hero"]');
```

**What changes:** One `||` line added at the end. `data-testid$="-lp-hero"` matches all 5 ad page hero sections (pos-lp-hero, billing-lp-hero, mgmt-lp-hero, ck-lp-hero, qsr-lp-hero).

---

## FILE 1: RestaurantPosSystem.jsx

### Op 2 — Add useState import (line 1)

**Current line 1:**
```js
import { ArrowRight, Check, CreditCard, ClipboardList, Flame, BarChart3 } from "lucide-react";
```

**Add new line AFTER line 1:**
```js
import { useState } from "react";
```

---

### Op 3 — Add StickyMobileCta import (after line 8)

**Current line 8:**
```js
import TrustBand from "@/components/home/TrustBand";
```

**Add new line AFTER line 8:**
```js
import StickyMobileCta from "@/components/home/StickyMobileCta";
```

---

### Op 4 — LandingNavbar: accept onDemo prop + fix nav CTA (lines 27–38)

**Current:**
```js
function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="pos-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <a href="#lp-demo" className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="pos-lp-navbar-cta">
          Book Free Demo
        </a>
      </div>
    </header>
  );
}
```

**Replace with:**
```js
function LandingNavbar({ onDemo }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="pos-lp-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <button type="button" onClick={onDemo} className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]" data-testid="pos-lp-navbar-cta">
          Book Free Demo
        </button>
      </div>
    </header>
  );
}
```

**What changes:** `function LandingNavbar()` → `function LandingNavbar({ onDemo })` and `<a href="#lp-demo">` → `<button type="button" onClick={onDemo}>`.

---

### Op 5 — Pricing card CTAs: change anchor to button (line 86)

**Current line 86:**
```jsx
<a href="#lp-demo" className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`pos-plan-cta-${plan.name.toLowerCase()}`}>
  Get Started
</a>
```

**Replace with:**
```jsx
<button type="button" onClick={openModal} className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.pop ? "bg-brand-green hover:bg-brand-greenDark text-white" : "border border-brand-green text-brand-green hover:bg-brand-green/10"}`} data-testid={`pos-plan-cta-${plan.name.toLowerCase()}`}>
  Get Started
</button>
```

**Note:** `LpPricing` function must receive `openModal` as a prop. See Op 6.

---

### Op 6 — Pass openModal into LpPricing function (line 61)

**Current line 61:**
```js
function LpPricing() {
```

**Replace with:**
```js
function LpPricing({ openModal }) {
```

---

### Op 7 — Main component: add modal state + wire LandingNavbar + LpPricing (lines 99–123)

**Current line 99:**
```js
export default function RestaurantPosSystem() {
```

**Replace with:**
```js
export default function RestaurantPosSystem() {
  const [showModal, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);
```

**Current line 122:**
```jsx
      <LandingNavbar />
```

**Replace with:**
```jsx
      <LandingNavbar onDemo={openModal} />
```

**Current (LpPricing usage, line 247):**
```jsx
        <LpPricing />
```

**Replace with:**
```jsx
        <LpPricing openModal={openModal} />
```

---

### Op 8 — Hero primary CTA: change anchor to button (line 146)

**Current lines 146–148:**
```jsx
<a href="#lp-demo" className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="pos-lp-cta-primary">
  Book a Free POS Demo <ArrowRight className="w-5 h-5" />
</a>
```

**Replace with:**
```jsx
<button type="button" onClick={openModal} className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)]" data-testid="pos-lp-cta-primary">
  Book a Free POS Demo <ArrowRight className="w-5 h-5" />
</button>
```

---

### Op 9 — Add StickyMobileCta + Modal overlay (before closing `</div>` of root, line 273–275)

**Current lines 272–276:**
```jsx
      </main>
      <LandingFooter />
    </div>
  );
}
```

**Replace with:**
```jsx
      </main>
      <LandingFooter />
      <StickyMobileCta onDemo={openModal} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" data-testid="pos-demo-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="pos-demo-modal">
            <button type="button" onClick={() => setShowModal(false)} className="float-right text-brand-muted hover:text-brand-ink text-xl font-light" aria-label="Close" data-testid="pos-demo-modal-close">✕</button>
            <DemoForm sector="restaurant-pos" shortForm submitLabel="Book a Free POS Demo →" />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## FILE 2: RestaurantBillingSoftware.jsx

Apply the identical pattern to the billing page. All operations mirror PosSystem with these substitution tokens:

| PosSystem token | Billing token |
|---|---|
| `pos-lp-navbar-cta` | `billing-lp-navbar-cta` |
| `pos-lp-cta-primary` | `billing-lp-cta-primary` |
| `billing-plan-cta-${...}` | already correct |
| `sector="restaurant-pos"` | `sector="billing-software"` |
| `pos-demo-modal-overlay` | `billing-demo-modal-overlay` |
| `pos-demo-modal` | `billing-demo-modal` |
| `pos-demo-modal-close` | `billing-demo-modal-close` |
| `function LandingNavbar()` | `function LandingNavbar()` (same local function name — no conflict) |

**Ops:**
- Op 10: Add `import { useState } from "react";` after line 1
- Op 11: Add `import StickyMobileCta from "@/components/home/StickyMobileCta";` after TrustBand import
- Op 12: `function LandingNavbar()` → `function LandingNavbar({ onDemo })`, `<a href="#lp-demo">` nav → `<button onClick={onDemo}>`
- Op 13: `function LpPricing()` → `function LpPricing({ openModal })`, pricing card `<a href="#lp-demo">` → `<button onClick={openModal}>`
- Op 14: `export default function RestaurantBillingSoftware()` → add `const [showModal, setShowModal] = useState(false); const openModal = () => setShowModal(true);`
- Op 15: `<LandingNavbar />` → `<LandingNavbar onDemo={openModal} />` and `<LpPricing />` → `<LpPricing openModal={openModal} />`
- Op 16: Hero primary CTA `<a href="#lp-demo" ... data-testid="billing-lp-cta-primary">` → `<button onClick={openModal}>`; add `<StickyMobileCta>` + modal overlay before closing `</div>`

---

## FILE 3: RestaurantManagementSoftware.jsx

Same pattern. Substitution tokens:

| Token | Value |
|---|---|
| testid prefix | `mgmt-` |
| sector | `"restaurant-management"` |
| modal testids | `mgmt-demo-modal-overlay`, `mgmt-demo-modal`, `mgmt-demo-modal-close` |

**Ops:**
- Op 17–23: Same 7 ops as Billing above with `mgmt` prefix substitutions.

---

## FILE 4: CloudKitchenPos.jsx

Cloud Kitchen already has a `<DemoForm sector="cloud-kitchen" shortForm>` at the bottom of the page (`#lp-demo`). No hero form addition needed. Apply ops for modal only.

**Ops:**
- Op 24: Add `import { useState } from "react";`
- Op 25: Add `import StickyMobileCta from "@/components/home/StickyMobileCta";`
- Op 26: `LandingNavbar()` → `LandingNavbar({ onDemo })`, nav `<a href="#lp-demo">` → `<button onClick={onDemo}>`
- Op 27: `LpPricing()` → `LpPricing({ openModal })`, pricing card `<a href="#lp-demo">` → `<button onClick={openModal}>`
- Op 28: Add `const [showModal, setShowModal] = useState(false); const openModal = () => setShowModal(true);` + wire `LandingNavbar` + `LpPricing`
- Op 29: Hero `<a href="#lp-demo" data-testid="ck-lp-cta-primary">` → `<button onClick={openModal}>`. Add `<StickyMobileCta>` + modal (sector="cloud-kitchen") before closing div.

---

## FILE 5: QsrPosSystem.jsx

QSR already has `<DemoForm sector="qsr" shortForm>` at the bottom. Same as Cloud Kitchen — no hero form addition.

**Ops:**
- Op 30–35: Same pattern as CloudKitchenPos with `qsr` prefix and `sector="qsr"`.

---

## Summary: Complete Edit List

| Op | File | Edit type | Line(s) |
|---|---|---|---|
| 1 | StickyMobileCta.jsx | Add 1 line (sentinel) | ~48 |
| 2 | RestaurantPosSystem.jsx | Add import useState | after L1 |
| 3 | RestaurantPosSystem.jsx | Add import StickyMobileCta | after L8 |
| 4 | RestaurantPosSystem.jsx | LandingNavbar: add onDemo prop + button | L27–38 |
| 5 | RestaurantPosSystem.jsx | LpPricing: add openModal prop + pricing button | L61, L86 |
| 6 | RestaurantPosSystem.jsx | Main component: add state + wire LandingNavbar | L99 + L122 + L247 |
| 7 | RestaurantPosSystem.jsx | Hero CTA: anchor → button | L146 |
| 8 | RestaurantPosSystem.jsx | Add StickyMobileCta + modal overlay | L272–275 |
| 9–15 | RestaurantBillingSoftware.jsx | Same 7 ops with billing tokens | — |
| 16–22 | RestaurantManagementSoftware.jsx | Same 7 ops with mgmt tokens | — |
| 23–28 | CloudKitchenPos.jsx | 6 ops (no hero form) | — |
| 29–34 | QsrPosSystem.jsx | 6 ops (no hero form) | — |

**Total: 34 individual search-replace operations across 6 files. One rebuild covers all.**

---

## Post-Deploy Verification

1. Phone (iOS Safari): tap nav "Book Free Demo" on `/restaurant-pos-system` → modal opens, no scrolling
2. Phone: scroll past hero → sticky bar appears at bottom → tap → same modal opens
3. Tag Assistant: complete form + OTP → confirm `form_start`, `form_submitted`, `Book demo` all fire
4. Desktop: sticky bar hidden (lg:hidden) — no visible change
5. Existing `#lp-demo` bottom section: still accessible by scrolling, still works

---

*Plan written 2026-09-08. Based on source inspection of RestaurantPosSystem.jsx + PetpoojaAlternative.jsx + StickyMobileCta.jsx.*
