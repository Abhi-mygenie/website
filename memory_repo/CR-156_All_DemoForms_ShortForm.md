# CR-156 — Convert All Remaining DemoForms to shortForm

**Type:** Conversion Rate Optimisation
**Date Raised:** 2026-08-26
**Status:** OPEN
**Priority:** P1 — Affects all organic/sector traffic conversion paths
**Decision:** 2026-08-26 — user confirmed: all DemoForm instances should use shortForm
**Finding:** #3 from UX/SEO Audit 2026-08-26

---

## 1. Problem Statement

Full DemoForm (7 fields): name, phone, email, business_name\*, years_in_business\*, outlet_type (if no sector), city = 7 fields.  
Industry benchmark: every extra required field after 3 loses ~10% of form submissions.

7 fields vs 3 required = 4 extra barriers. Estimated friction cost: ~30–40% of form submissions lost.

**User decision (2026-08-26):** All DemoForm instances should use `shortForm`. No exceptions.

---

## 2. Affected Pages — 8 locations

| File | Current call | Change |
|---|---|---|
| `frontend/src/pages/SectorPage.jsx` L263 | `<DemoForm sector={s.name} />` | `<DemoForm sector={s.name} shortForm />` |
| `frontend/src/pages/About.jsx` L91 | `<DemoForm />` | `<DemoForm shortForm />` |
| `frontend/src/pages/ProductIndex.jsx` L121 | `<DemoForm />` | `<DemoForm shortForm />` |
| `frontend/src/pages/AiPage.jsx` L267 | `<DemoForm />` | `<DemoForm shortForm />` |
| `frontend/src/pages/SolutionsIndex.jsx` L122 | `<DemoForm />` | `<DemoForm shortForm />` |
| `frontend/src/pages/ProductPage.jsx` L261 | `<DemoForm />` | `<DemoForm shortForm />` |
| `frontend/src/pages/Contact.jsx` L28 | `<DemoForm />` | `<DemoForm shortForm />` |
| `frontend/src/components/home/CtaDemo.jsx` L55 | `<DemoForm sector={sector} />` | `<DemoForm sector={sector} shortForm />` |

**Total: 8 call sites. Each change is 1 word (`shortForm` prop added).**

---

## 3. What shortForm Changes

| Field | Full form | shortForm |
|---|---|---|
| Name | Required | Required |
| Phone | Required | Required |
| Email | Required | Required |
| Business name | Required | Optional (shown but not required) |
| Years in business | Required | **Hidden** |
| Outlet type dropdown | Shown (if no sector) | **Hidden** |
| City | Optional | **Hidden** |

**Fields removed from view:** years_in_business, outlet_type dropdown, city.  
**Fields still collected:** name, phone, email, business_name (optional).

---

## 4. Backend / CRM Impact

`years_in_business` maps to `cf_sku` in Freshsales. When shortForm is used, this field is empty — the CRM field will be blank. This was already accepted on all 7 LP pages (CR-85/86/148/149/152/DemoLanding/PetpoojaAlternative) which all use shortForm.

`city` field is used for geo-enrichment but is already enriched from IP (via `geo.lookup_city`) — removing the form field has negligible impact on geo data quality.

`outlet_type` is passed as `sector` prop instead — no loss when sector is specified.

---

## 5. Files to Change

| File | Change | Lines |
|---|---|---|
| `frontend/src/pages/SectorPage.jsx` | +shortForm | L263: 1 word |
| `frontend/src/pages/About.jsx` | +shortForm | L91: 1 word |
| `frontend/src/pages/ProductIndex.jsx` | +shortForm | L121: 1 word |
| `frontend/src/pages/AiPage.jsx` | +shortForm | L267: 1 word |
| `frontend/src/pages/SolutionsIndex.jsx` | +shortForm | L122: 1 word |
| `frontend/src/pages/ProductPage.jsx` | +shortForm | L261: 1 word |
| `frontend/src/pages/Contact.jsx` | +shortForm | L28: 1 word |
| `frontend/src/components/home/CtaDemo.jsx` | +shortForm | L55: 1 word |

**Total: 8 files, 8 word additions. After this CR, ALL DemoForm instances site-wide will use shortForm.**

---

## 6. Definition of Done

- [ ] All 8 call sites use `shortForm` prop
- [ ] SectorPage form: name, phone, email visible; years_in_business and city hidden
- [ ] About/Product/AI/Solutions forms: same fields visible
- [ ] Contact page demo tab: 4 fields visible (not 7)
- [ ] Form still submits correctly to `/api/demo-request`
- [ ] CRM receives name/phone/email/business_name; years_in_business blank (acceptable)
- [ ] No change to existing shortForm instances (already correct)

*CR-156 registered 2026-08-26. User decision: all forms to shortForm. Source: UX/SEO Audit Finding #3.*
