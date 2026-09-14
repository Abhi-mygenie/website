# CR-156 — Impact Analysis
# All DemoForms → shortForm

**Date:** 2026-08-26
**User decision confirmed 2026-08-26:** All DemoForm instances should use shortForm.

---

## 1. Code Investigation

### Full form fields (current)
`DemoForm.jsx` L14:
```js
const EMPTY = { name: "", phone: "", email: "", outlet_type: "", business_name: "", city: "", years_in_business: "" };
const REQUIRED = ["name", "phone", "email", "business_name", "years_in_business"];
```

Full form renders:
- name, phone, email, business_name (required) — 4 fields
- years_in_business select (required) — 1 field
- outlet_type dropdown (if no sector passed) — 1 field
- city (optional) — 1 field
**= 6–7 fields depending on sector**

### shortForm removes:
- `years_in_business` — **hidden** (`{!shortForm && (...)}` L329)
- `outlet_type` dropdown — already hidden when `sector` prop passed (L347: `{!sector && (...)}`)
- `city` — **hidden** (`{!shortForm && sector !== "meta-demo" && (...)}` L354)
- `business_name` — shown but **optional** (placeholder changes L313)

### Required fields in shortForm:
name, phone, email — 3 required. business_name optional. **4 visible fields, 3 required.**

### 8 affected call sites
| File | Current call | Line |
|---|---|---|
| `SectorPage.jsx` | `<DemoForm sector={s.name} />` | 263 |
| `About.jsx` | `<DemoForm />` | 91 |
| `ProductIndex.jsx` | `<DemoForm />` | 121 |
| `AiPage.jsx` | `<DemoForm />` | 267 |
| `SolutionsIndex.jsx` | `<DemoForm />` | 122 |
| `ProductPage.jsx` | `<DemoForm />` | 261 |
| `Contact.jsx` | `<DemoForm />` | 28 |
| `CtaDemo.jsx` | `<DemoForm sector={sector} />` | 55 |

---

## 2. Backend / CRM Impact

### Fields that go missing
| Field | Freshsales mapping | Impact when missing |
|---|---|---|
| `years_in_business` | `cf_sku` | CRM field blank. Was already blank on all 7 LP pages. Accepted precedent. |
| `city` | `obj.city` passed to `geo.lookup_city()` | City enriched from IP via geo module regardless — no data loss |
| `outlet_type` | `obj.outlet_type` / `cf_outlet_type` | Blank when no `sector` prop. Only affects About/ProductIndex/AiPage/SolutionsIndex/ProductPage. |

### Sector prop usage
- `SectorPage`: passes `sector={s.name}` — e.g. "QSR / Fast Food", "Hotels & Resorts" — correct
- `CtaDemo`: passes `sector={sector}` from Home.jsx — usually `undefined` or the homepage sector
- All others: no sector prop — `outlet_type` will be blank in CRM

**Verdict:** Acceptable. `years_in_business` data was low-quality anyway (self-reported). City from IP is more accurate. Sector can be inferred from `source_page`.

---

## 3. Contact Page Special Case

`Contact.jsx` L28: `{tab === "message" ? <MessageForm /> : <DemoForm />}`

The "Book a demo" tab on Contact shows `DemoForm`. With shortForm:
- Visitor explicitly chose "Book a demo" tab — high intent
- 3 required fields (name, phone, email) is appropriate for contact-initiated demo

**No concern.** shortForm is correct for Contact page.

---

## 4. CtaDemo.jsx — Combined Impact with CR-160 (Reveal)

**Critical finding:** `CtaDemo.jsx` L53–57:
```jsx
<Reveal delay={0.1}>
  <div id="demo" data-testid="demo-anchor">
    <DemoForm sector={sector} />
  </div>
</Reveal>
```

The DemoForm on the homepage is wrapped in `<Reveal delay={0.1}>` — which starts at `opacity: 0`. When a user clicks "Book a Free Demo" (nav or hero CTA) and the page scrolls to `id="demo"`, **the form could be invisible if IntersectionObserver hasn't fired yet** (e.g. slow connection, JS not fully loaded).

This is a pre-existing issue independent of CR-156, but it means **CR-156 and CR-160 should be implemented together** for maximum effect on the homepage form.

---

## 5. Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Reduced lead data quality (fewer fields) | Low | business_name optional field still visible; sector captures outlet type on key pages |
| Broken form submission | None | shortForm is already battle-tested on 7 LP pages |
| CRM `cf_sku` blank | Low impact | Was already blank on all LP leads — accepted |
| Regression on SectorPage (sector prop) | None | shortForm + sector prop already used on QSR, Cloud Kitchen LPs |

---

## 6. Implementation Notes

Each change is exactly 1 prop addition (`shortForm`). All 8 are independent — no sequencing required.

After implementing:
- `yarn build` + `node scripts/prerender.js` required for prerendered pages to reflect change
- No backend changes

---

## 7. Cross-Impact

- **CR-160 (Reveal):** Fix Reveal opacity:0 at same time — the homepage CtaDemo DemoForm is wrapped in Reveal
- **CR-161 (submit text):** After CR-161, submit button says `"Book My Free Demo →"` — works well with shortForm's simplified layout
- **CR-155 (Pricing DemoForm):** Use shortForm for the new Pricing page form too

*Impact analysis written 2026-08-26.*
