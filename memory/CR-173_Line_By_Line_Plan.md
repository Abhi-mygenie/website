# CR-173 — Line-by-Line Implementation Plan
## Add `type="button"` to All Non-Submit Buttons

**Total files:** 29 (1 already clean — OtpVerifyBlock.jsx ✅, ConsentBanner.jsx ✅)
**Total button changes:** ~113
**Files already fully clean (skip entirely):** OtpVerifyBlock.jsx, ConsentBanner.jsx
**Rebuild required:** Yes — single rebuild after all changes

---

## Pre-flight checks

```bash
# Confirm current count — should be ~119
grep -rn "<button" /app/frontend/src/ | grep -v node_modules | grep -v "type=" | wc -l

# Confirm which already have type= (do NOT touch these)
grep -rn "<button" /app/frontend/src/ | grep -v node_modules | grep "type="
# Expected intentional ones:
# OtpVerifyBlock.jsx L168, L179    → type="button" ✅
# ConsentBanner.jsx L55, L63       → type="button" ✅
# MessageForm.jsx L179              → type="button" ✅
# MessageForm.jsx L190              → type="submit" ✅
# CmsAdminLayer.jsx L54             → type="button" ✅
# FaqEditor.jsx L106                → type="button" ✅
# RecommendQuiz.jsx L56–69 (map)   → type="button" ✅
# CheckoutModal.jsx L251            → type="submit" ✅
# DemoForm.jsx L360                 → type="submit" ✅
```

---

## Implementation Strategy

### Rule
Every `<button` that does NOT already have `type=` gets `type="button"` added
as the FIRST attribute immediately after `<button`.

### Pattern A — Inline button (single line):
```jsx
// BEFORE:
<button onClick={fn} className="...">

// AFTER:
<button type="button" onClick={fn} className="...">
```

### Pattern B — Multiline button (opening tag on own line):
```jsx
// BEFORE:
<button
  onClick={fn}
  className="...">

// AFTER:
<button
  type="button"
  onClick={fn}
  className="...">
```

### Pattern C — Button IS the root element (e.g. PlanCard):
```jsx
// BEFORE:
<button
  onClick={() => onSelect(plan.id)}
  data-testid={...}
  className="...">

// AFTER:
<button
  type="button"
  onClick={() => onSelect(plan.id)}
  data-testid={...}
  className="...">
```

---

## TIER 1 — Public-Facing Components (8 files)

---

### File 1: `frontend/src/components/site/Navbar.jsx`

4 buttons need `type="button"`:

**Change 1 — L61: NavDropdown "Resources" trigger**
```jsx
// BEFORE:
        <button className={triggerCls} data-testid={`nav-dd-${label.toLowerCase()}`} aria-expanded={open} onClick={() => setOpen(true)}>

// AFTER:
        <button type="button" className={triggerCls} data-testid={`nav-dd-${label.toLowerCase()}`} aria-expanded={open} onClick={() => setOpen(true)}>
```

**Change 2 — L160: "Book a Free Demo" (onDemo branch)**
```jsx
// BEFORE:
            <button onClick={() => onDemo()} data-testid="nav-demo-btn" className="bg-brand-green ...">Book a Free Demo</button>

// AFTER:
            <button type="button" onClick={() => onDemo()} data-testid="nav-demo-btn" className="bg-brand-green ...">Book a Free Demo</button>
```

**Change 3 — L166: Mobile hamburger/X toggle**
```jsx
// BEFORE:
        <button className="lg:hidden p-2.5 text-brand-ink" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle" aria-label="Menu">

// AFTER:
        <button type="button" className="lg:hidden p-2.5 text-brand-ink" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle" aria-label="Menu">
```

**Change 4 — L175: Mobile section expand toggle (Solutions / Product)**
```jsx
// BEFORE:
              <button onClick={() => setMobileSec(mobileSec === grp.key ? null : grp.key)} className="w-full flex items-center justify-between py-3 text-brand-ink font-semibold" data-testid={`nav-mobile-${grp.key}`}>

// AFTER:
              <button type="button" onClick={() => setMobileSec(mobileSec === grp.key ? null : grp.key)} className="w-full flex items-center justify-between py-3 text-brand-ink font-semibold" data-testid={`nav-mobile-${grp.key}`}>
```

---

### File 2: `frontend/src/components/home/StickyMobileCta.jsx`

2 buttons:

**Change 1 — L76: "Book a Free Demo" CTA button**
```jsx
// BEFORE:
        <button
          onClick={handleClick}
          data-testid="sticky-mobile-cta-btn"

// AFTER:
        <button
          type="button"
          onClick={handleClick}
          data-testid="sticky-mobile-cta-btn"
```

**Change 2 — L84: Dismiss ✕ button**
```jsx
// BEFORE:
        <button
          onClick={() => { setVisible(false); setDismissed(true); }}
          data-testid="sticky-mobile-cta-dismiss"

// AFTER:
        <button
          type="button"
          onClick={() => { setVisible(false); setDismissed(true); }}
          data-testid="sticky-mobile-cta-dismiss"
```

---

### File 3: `frontend/src/components/site/FaqItem.jsx`

1 button:

**Change 1 — L15: Accordion toggle**
```jsx
// BEFORE:
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        data-testid={`${testid}-toggle`}

// AFTER:
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        data-testid={`${testid}-toggle`}
```

---

### File 4: `frontend/src/components/home/SectorSelector.jsx`

2 buttons (inside `.map()`):

**Change 1 — L33: Sector tab pills (map)**
```jsx
// BEFORE:
                <button
                  key={sec.slug}
                  onClick={() => setActive(i)}
                  data-testid={`sector-tab-${sec.slug}`}

// AFTER:
                <button
                  type="button"
                  key={sec.slug}
                  onClick={() => setActive(i)}
                  data-testid={`sector-tab-${sec.slug}`}
```

**Change 2 — L67: "Book a Demo" sector panel button**
```jsx
// BEFORE:
                  <button
                    onClick={() => onSectorDemo(s.name)}
                    data-testid={`sector-demo-${s.slug}`}

// AFTER:
                  <button
                    type="button"
                    onClick={() => onSectorDemo(s.name)}
                    data-testid={`sector-demo-${s.slug}`}
```

---

### File 5: `frontend/src/components/site/Footer.jsx`

1 button:

**Change 1 — L20: "Book a Free Demo" footer button**
```jsx
// BEFORE:
            <button
              onClick={() => (onDemo ? onDemo() : (window.location.href = "/#demo"))}
              data-testid="footer-demo-btn"

// AFTER:
            <button
              type="button"
              onClick={() => (onDemo ? onDemo() : (window.location.href = "/#demo"))}
              data-testid="footer-demo-btn"
```

---

### File 6: `frontend/src/pages/SuccessStories.jsx`

1 button:

**Change 1 — L70: CTA button**
```jsx
// BEFORE: (view file to get exact surrounding context — multiline button L70)
// Add type="button" as first attribute after <button
```
> **Note for implementer:** View L68–75 to get exact surrounding text for search_replace uniqueness.

---

## TIER 2 — Pricing Components (7 files)

---

### File 7: `frontend/src/pages/Pricing.jsx`

4 buttons — L201, L228, L263 (inline), L295 (inline):

**Changes 1–2 — L201, L228: Multiline buttons**
> View L199–205 and L226–232 for exact context.
> Pattern: add `type="button"` as first attribute.

**Change 3 — L263: Inline upsell button**
```jsx
// BEFORE:
                    <button onClick={() => selectPlan(upsell.next.id)} data-testid="upsell-accept" className="mt-2 text-sm font-semibold text-brand-green hover:underline">

// AFTER:
                    <button type="button" onClick={() => selectPlan(upsell.next.id)} data-testid="upsell-accept" className="mt-2 text-sm font-semibold text-brand-green hover:underline">
```

**Change 4 — L295: Inline cross-sell button**
```jsx
// BEFORE:
                        <button key={a.id} onClick={() => toggleAddon(a.id)} data-testid={`cross-sell-${a.id}`} className="inline-flex ...">

// AFTER:
                        <button type="button" key={a.id} onClick={() => toggleAddon(a.id)} data-testid={`cross-sell-${a.id}`} className="inline-flex ...">
```

---

### File 8: `frontend/src/components/pricing/PlanCard.jsx`

1 button — the entire component root is a `<button>`:

**Change 1 — L12: Plan card root button**
```jsx
// BEFORE:
    <button
      onClick={() => onSelect(plan.id)}
      data-testid={`plan-card-${plan.id}`}

// AFTER:
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      data-testid={`plan-card-${plan.id}`}
```

---

### File 9: `frontend/src/components/pricing/AddonCard.jsx`

1 button — L28:
> View L26–32 for exact context. Add `type="button"` as first attribute.

---

### File 10: `frontend/src/components/pricing/CartSummary.jsx`

3 inline buttons — L39, L101, L105:

**Change 1 — L39: "Book a Demo" button**
```jsx
// BEFORE:
            <button onClick={onDemo} data-testid="cart-demo-btn" className="mt-3 w-full bg-brand-orange ...">

// AFTER:
            <button type="button" onClick={onDemo} data-testid="cart-demo-btn" className="mt-3 w-full bg-brand-orange ...">
```

**Change 2 — L101: "Buy Now" button**
```jsx
// BEFORE:
              <button onClick={onBuy} data-testid="cart-buy-btn" className="group mt-5 w-full bg-brand-green ...">

// AFTER:
              <button type="button" onClick={onBuy} data-testid="cart-buy-btn" className="group mt-5 w-full bg-brand-green ...">
```

**Change 3 — L105: "Book a Demo" alt variant**
```jsx
// BEFORE:
            <button onClick={onDemo} data-testid="cart-demo-btn" className="mt-3 w-full bg-white border-2 ...">

// AFTER:
            <button type="button" onClick={onDemo} data-testid="cart-demo-btn" className="mt-3 w-full bg-white border-2 ...">
```

---

### File 11: `frontend/src/components/pricing/PlanCompareModal.jsx`

1 button — L30. View file for context. Add `type="button"`.

---

### File 12: `frontend/src/components/pricing/RecommendQuiz.jsx`

1 button — L79 only (priority chips L56–69 already have `type="button"`):

**Change 1 — L79: "Recommend my plan" button**
```jsx
// BEFORE:
      <button
        onClick={run}
        disabled={!ready}
        data-testid="quiz-recommend-btn"

// AFTER:
      <button
        type="button"
        onClick={run}
        disabled={!ready}
        data-testid="quiz-recommend-btn"
```

---

### File 13: `frontend/src/components/pricing/FeatureDemoModal.jsx`

2 buttons — L15 and L53. View file for exact context.

---

## TIER 3 — Form-Adjacent Files (3 files)

---

### File 14: `frontend/src/components/site/DemoForm.jsx`

1 button — L241 (mobile Calendly popup; NOT inside `<form>`, returns early before form):

**Change 1 — L241: "Book My Slot" mobile popup button**
```jsx
// BEFORE:
          <button
            onClick={openPopup}
            disabled={popupLoading}
            data-testid="demo-book-slot-btn"

// AFTER:
          <button
            type="button"
            onClick={openPopup}
            disabled={popupLoading}
            data-testid="demo-book-slot-btn"
```

**DO NOT TOUCH L360:** `<button type="submit" ...>` — already correct ✅

---

### File 15: `frontend/src/components/pricing/CheckoutModal.jsx`

2 buttons — L151, L162 (L251 already `type="submit"` ✅):

**Change 1 — L151: Close modal (✕)**
```jsx
// BEFORE:
        <button onClick={onClose} className="absolute top-5 right-5 text-brand-muted hover:text-brand-ink" data-testid="checkout-close"><X /></button>

// AFTER:
        <button type="button" onClick={onClose} className="absolute top-5 right-5 text-brand-muted hover:text-brand-ink" data-testid="checkout-close"><X /></button>
```

**Change 2 — L162: "Done" button**
```jsx
// BEFORE:
            <button onClick={onClose} className="mt-6 w-full bg-brand-green text-white rounded-full py-3 font-semibold" data-testid="checkout-done-btn">Done</button>

// AFTER:
            <button type="button" onClick={onClose} className="mt-6 w-full bg-brand-green text-white rounded-full py-3 font-semibold" data-testid="checkout-done-btn">Done</button>
```

---

### File 16: `frontend/src/components/site/MessageForm.jsx`

1 button — L103 only (L179 = `type="button"` ✅, L190 = `type="submit"` ✅):

**Change 1 — L103: WhatsApp button**
```jsx
// BEFORE:
          <button onClick={openWhatsApp} data-testid="message-whatsapp-btn"

// AFTER:
          <button type="button" onClick={openWhatsApp} data-testid="message-whatsapp-btn"
```

---

## TIER 4 — Internal / Admin Files (13 files)

For all Tier 4 files, the approach is identical:
- Find every `<button` without `type=`
- Add `type="button"` as first attribute
- No logic or behaviour changes

File-by-file button counts:

| File | Lines needing change | Count |
|---|---|---|
| `LeadsView.jsx` | L135, L337, L344, L351, L361, L373, L377, L383, L434, L437, L632, L652, L660, L686, L690 | 15 |
| `PaymentSuccess.jsx` | L47, L123 (inline), L130 | 3 |
| `PetpoojaAlternative.jsx` | L247, L323, L349, L642 | 4 |
| `CmsAdminLayer.jsx` | L78, L121, L128, L135, L144, L152 (L54 already done ✅) | 6 |
| `Editable.jsx` | L44, L120, L123, L192, L195, L282, L298, L299, L300, L360, L361, L477 | 12 |
| `FaqEditor.jsx` | L43, L142, L234, L248, L249, L250, L302, L303, L326 (L106 already done ✅) | 9 |
| `AdsIntelTab.jsx` | L218, L248, L256, L275, L301, L321, L360, L378 | 8 |
| `AiRecommendations.jsx` | L82, L109, L121, L229 | 4 |
| `StrategyLabPanel.jsx` | L87, L94, L101, L114, L120, L126, L191, L200 | 8 |
| `AdSpendUpload.jsx` | L212, L219, L233, L256 | 4 |
| `AttributionBreakdown.jsx` | L127, L136 | 2 |
| `ChurnPanel.jsx` | L203, L243, L297, L308, L325, L332, L464, L485, L496 | 9 |
| `SyncStatus.jsx` | L41 | 1 |

> **Implementation note for Tier 4:** Each file has only multiline and inline buttons following
> the same patterns. Use `search_replace` with enough surrounding context (2–3 lines) to
> uniquely identify each button. For truly identical patterns in the same file (e.g. multiple
> `<button onClick={() => move(i, -1)}`), the `replace_all=true` option can batch identical ones.

---

## Verification

After all changes and rebuild:

```bash
# PASS condition: should return 0
grep -rn "<button" /app/frontend/src/ | grep -v node_modules | grep -v "type=" | wc -l
# Expected: 0

# Confirm submit buttons still correct (should see exactly these):
grep -rn "type=\"submit\"" /app/frontend/src/ | grep -v node_modules
# Expected: DemoForm.jsx, CheckoutModal.jsx, MessageForm.jsx — nothing else

# Spot-check prerendered homepage
grep -c "type=\"button\"" /app/frontend/build/index.html
# Expected: several (Navbar, SectorSelector, StickyMobileCta, Footer, etc.)
```

---

## Rollback

If any button stops working after the change:
- `type="button"` never changes click behavior or event firing
- All onClick handlers continue to work identically
- If a form accidentally re-enabled submission (edge case): check file has form, check button inside form tree
- Remove `type="button"` from suspected button and rebuild

---

## Summary

| Tier | Files | Buttons | Already clean |
|---|---|---|---|
| Tier 1 — Public | 6 files | ~11 | ConsentBanner ✅ |
| Tier 2 — Pricing | 7 files | ~13 | RecommendQuiz chips ✅ |
| Tier 3 — Form | 3 files | 4 | OtpVerifyBlock ✅, MessageForm partial ✅ |
| Tier 4 — Internal | 13 files | ~85 | CmsAdminLayer L54 ✅, FaqEditor L106 ✅ |
| **Total** | **29 files** | **~113** | |

*Plan written 2026-09-01. No code edits made.*
