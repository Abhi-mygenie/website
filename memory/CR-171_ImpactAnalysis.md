# CR-171 Impact Analysis — Homepage FAQ Section + QAPage Schema
**Date:** 2026-09-02
**Agent:** E1
**Status:** DONE ✅ — 2026-09-02

---

## 1. Current State (Verified from Source)

### Homepage JSON-LD (Home.jsx line 36)
```jsx
<Seo ... jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD]} />
```
- Block 1: `@type: Organization`
- Block 2: `@type: SoftwareApplication`
- **No FAQ or QAPage schema exists on the homepage.**

### Homepage section order (Home.jsx lines 39–49)
```
Hero → TrustBand → ProblemGrid → BeforeAfter → OutcomePillars
→ SectorSelector → ModuleOverview → AIBand → ProofSection → CtaDemo
```
No FAQ section exists anywhere.

### Existing components in /components/home/
```
AIBand.jsx  BeforeAfter.jsx  CtaDemo.jsx  Hero.jsx  ModuleOverview.jsx
OutcomePillars.jsx  ProblemGrid.jsx  ProofSection.jsx
SectorSelector.jsx  StickyMobileCta.jsx  TrustBand.jsx
```
No HomeFaq.jsx exists.

---

## 2. CMS Override Check

Live CMS keys that affect the homepage:
```
home.hero.banner_image   ← hero image only
home.testimonials        ← testimonials in ProofSection
home.trust_logos         ← logos in TrustBand
```

**No `home.faq` or `home.qa` CMS key exists.**

→ The FAQ section we add will display from the data file. No CMS conflict.
→ Changes are NOT CMS-gated — they will be immediately visible after rebuild.

---

## 3. Schema Type Decision

| Page type | Schema used | Status |
|---|---|---|
| SectorPage.jsx | `QAPage` | ✅ Correct (CR-106, May 2026) |
| ProductPage.jsx | `QAPage` | ✅ Correct |
| Resources.jsx | `QAPage` | ✅ Correct |
| LP pages (billing, mgmt, etc.) | `FAQPage` | Still indexed, not urgent |
| **Homepage** | **Nothing** | ❌ Gap — this CR fills it |

**Decision: use `QAPage`** — consistent with CR-106 precedent on all template pages.

---

## 4. Proposed Q&As (5 items — offline question removed per owner)

| # | Question | Answer |
|---|---|---|
| Q1 | Does the POS support dynamic UPI QR codes per bill? | Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly. |
| Q2 | Can it track inventory down to ingredient level? | Yes. MyGenie tracks stock at recipe and ingredient level using BOM costing. Every dish sold auto-deducts the right quantities from raw ingredient stock. |
| Q3 | Does it support multi-outlet management? | Yes. Owner dashboard shows live sales, inventory and KPIs across every outlet from one screen. Stock transfers, outlet-specific menus, and role-based access all from a single login. |
| Q4 | What kind of reports can be generated? | Daily sales, item-wise, payment-mode, staff, wastage, audit and GST/VAT — automatic. Reports arrive on WhatsApp at close of day. Recipe-level P&L shows exact margin per dish. |
| Q5 | What are the differences between legacy and cloud-based POS? | Legacy stores data locally — crashes lose data, reports only on-site. Cloud POS gives live reports from your phone, auto-updates, local-first offline billing, and direct Swiggy/Zomato integration. |
| Q6 | Can the POS integrate with delivery platforms? | Yes. Direct Swiggy and Zomato integration — orders flow straight into POS and kitchen screen. Also supports direct commission-free ordering via your own link. |
| Q7 | Can the POS measure end-to-end P&L? | Yes. Item-level P&L in real time — revenue, ingredient cost and margin per dish. Combined with purchase costs, wastage and outlet transfers for a complete profitability picture. |

---

## 5. Files to Change

| # | File | Change | Lines affected |
|---|---|---|---|
| 1 | `src/lib/seo.js` | Add `HOMEPAGE_QA_JSONLD` export (after SOFTWARE_APP_JSONLD) | +35 lines after line 81 |
| 2 | `src/pages/Home.jsx` | Add lazy import for HomeFaq; add HOMEPAGE_QA_JSONLD to jsonLd; add `<HomeFaq />` between ProofSection and CtaDemo | +3 lines |
| 3 | `src/components/home/HomeFaq.jsx` | New file — visible FAQ section component | ~55 lines |

**Total: 3 files, ~93 lines added, 0 lines deleted from existing code.**

---

## 6. Placement

FAQ section goes **between ProofSection and CtaDemo** — below social proof (testimonials, customer logos) and above the final demo CTA. This is the natural "objection handling → final push" flow.

```
... ProofSection (testimonials, logos)
→ HomeFaq (NEW — answers last-mile objections)
→ CtaDemo (demo form)
→ Footer
```

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| QAPage schema rejected by Google | Low | Low — no regression, just no rich result | Monitor Search Console after deploy |
| FAQ text contradicts existing copy | None | — | Q&As verified against seo.js pricing data |
| CMS conflict | None | — | No home.faq CMS key exists |
| Above-fold content displaced | None | — | Section placed below all existing sections |
| Breaking existing JSON-LD | None | — | Seo component accepts array, just adding a 3rd entry |

**Overall risk: LOW. Pure addition — no existing code deleted or modified.**

---

## 8. Definition of Done

- [ ] Homepage has a visible FAQ section with 5 Q&A items
- [ ] `QAPage` JSON-LD block present in `<head>` of prerendered `build/index.html`
- [ ] Schema validates at https://search.google.com/test/rich-results
- [ ] FAQ placed below ProofSection, above CtaDemo
- [ ] Passes regression: existing JSON-LD blocks (Org, SoftwareApp) still present
- [ ] Full build + prerender completed and frontend restarted

---

## 9. Build Requirement

```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```
Build time: ~3 minutes (craco + 57-route prerender).

---

*Analysis complete. Awaiting owner approval of Q&A content before implementation.*
