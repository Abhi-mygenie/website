# CR-171 Line-by-Line Implementation Plan
**Date:** 2026-09-02
**Status:** READY TO IMPLEMENT
**Approved Q&As:** 7 (see CR-171_Content_Approval_Decision.md)

---

## Files Changed: 3

| # | File | Action | Lines touched |
|---|---|---|---|
| 1 | `src/lib/seo.js` | Add `HOMEPAGE_QA_JSONLD` export | Insert after line 81 |
| 2 | `src/pages/Home.jsx` | Import + lazy + jsonLd + JSX | Lines 8, 17, 36, 48–49 |
| 3 | `src/components/home/HomeFaq.jsx` | **New file** | ~60 lines |

---

## Change 1 — `src/lib/seo.js`

**Insert after line 81** (the closing `};` of `SOFTWARE_APP_JSONLD`).
Nothing else in this file changes.

```
Line 81:  };          ← end of SOFTWARE_APP_JSONLD — stays as-is
          ↓ INSERT HERE
Line 82+: (new block — see below)
Line 83:  // Static per-route SEO...  ← shifts down, stays unchanged
```

**Text to insert (after line 81):**

```js
// QAPage schema for homepage — 7 approved Q&As (CR-171, 2026-09-02)
// Uses QAPage (not FAQPage) per CR-106 May 2026 precedent.
export const HOMEPAGE_QA_JSONLD = {
  "@context": "https://schema.org",
  "@type": "QAPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does the POS support dynamic UPI QR codes per bill?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly.",
      },
    },
    {
      "@type": "Question",
      name: "Can it track inventory down to ingredient level?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie tracks stock at recipe and ingredient level using Bill of Materials (BOM) costing. Every dish sold automatically deducts the right quantities from raw ingredient stock — so you always know what's left, what was wasted, and what the per-dish cost is.",
      },
    },
    {
      "@type": "Question",
      name: "Does it support multi-outlet management?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The owner dashboard shows live sales, inventory and KPIs across every outlet from one screen on your phone. You can manage stock transfers between outlets, set outlet-specific menus, and control staff access by location — all from a single login.",
      },
    },
    {
      "@type": "Question",
      name: "What kind of reports can be generated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MyGenie generates daily sales, item-wise, payment-mode, staff performance, wastage, audit and GST/VAT reports — automatically. Reports arrive on WhatsApp at close of day without logging in. Owners also get recipe-level P&L showing the exact margin on every dish sold.",
      },
    },
    {
      "@type": "Question",
      name: "What are the differences between a legacy and a cloud-based POS system?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A legacy POS stores data on a local machine — if it crashes, data is lost, and you can only access reports on-site. A cloud POS like MyGenie stores everything securely online: you get live reports from your phone anywhere, automatic updates with no IT cost, and the system keeps working even if the internet drops (local-first billing). Cloud POS also integrates directly with Swiggy, Zomato and payment gateways — legacy systems typically cannot.",
      },
    },
    {
      "@type": "Question",
      name: "Can the POS integrate with delivery platforms?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie integrates directly with Swiggy and Zomato — orders from both platforms flow straight into the POS and kitchen screen without manual entry. You can also take direct commission-free delivery orders through your own ordering link.",
      },
    },
    {
      "@type": "Question",
      name: "Can the POS measure end-to-end P&L?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. MyGenie tracks P&L at item level — every dish sold shows its revenue, ingredient cost and margin in real time. Combined with purchase costs, wastage data and inter-outlet transfers, owners get a complete picture of profitability across every outlet without assembling spreadsheets.",
      },
    },
  ],
};
```

---

## Change 2 — `src/pages/Home.jsx`

**4 targeted edits, no deletions.**

---

### 2a — Line 8: add `HOMEPAGE_QA_JSONLD` to named import

**BEFORE (line 8):**
```js
import { PAGE_SEO, ORG_JSONLD, SOFTWARE_APP_JSONLD } from "@/lib/seo";
```

**AFTER (line 8):**
```js
import { PAGE_SEO, ORG_JSONLD, SOFTWARE_APP_JSONLD, HOMEPAGE_QA_JSONLD } from "@/lib/seo";
```

---

### 2b — After line 17: add lazy import for HomeFaq

**BEFORE (lines 16–18):**
```js
const ProofSection   = lazy(() => import("@/components/home/ProofSection"));
const CtaDemo        = lazy(() => import("@/components/home/CtaDemo"));
                                                                           ← blank line 18
```

**AFTER:**
```js
const ProofSection   = lazy(() => import("@/components/home/ProofSection"));
const CtaDemo        = lazy(() => import("@/components/home/CtaDemo"));
const HomeFaq        = lazy(() => import("@/components/home/HomeFaq"));
                                                                           ← blank line
```

---

### 2c — Line 36: add HOMEPAGE_QA_JSONLD to jsonLd array

**BEFORE (line 36):**
```jsx
      <Seo title={PAGE_SEO["/"].title} description={PAGE_SEO["/"].description} path="/" jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD]} />
```

**AFTER (line 36):**
```jsx
      <Seo title={PAGE_SEO["/"].title} description={PAGE_SEO["/"].description} path="/" jsonLd={[ORG_JSONLD, SOFTWARE_APP_JSONLD, HOMEPAGE_QA_JSONLD]} />
```

---

### 2d — Between lines 48 and 49: insert HomeFaq between ProofSection and CtaDemo

**BEFORE (lines 48–49):**
```jsx
          <ProofSection />
          <CtaDemo sector={sector} />
```

**AFTER:**
```jsx
          <ProofSection />
          <HomeFaq />
          <CtaDemo sector={sector} />
```

---

## Change 3 — NEW FILE `src/components/home/HomeFaq.jsx`

New file, ~60 lines. Follows exact same structure as `SectorPage.jsx` FAQ section (lines 230–247).
Uses existing `FaqItem` and `Reveal` components — no new dependencies.

```jsx
import FaqItem from "@/components/site/FaqItem";
import Reveal from "@/components/site/Reveal";

const FAQS = [
  {
    q: "Does the POS support dynamic UPI QR codes per bill?",
    a: "Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly.",
  },
  {
    q: "Can it track inventory down to ingredient level?",
    a: "Yes. MyGenie tracks stock at recipe and ingredient level using Bill of Materials (BOM) costing. Every dish sold automatically deducts the right quantities from raw ingredient stock — so you always know what's left, what was wasted, and what the per-dish cost is.",
  },
  {
    q: "Does it support multi-outlet management?",
    a: "Yes. The owner dashboard shows live sales, inventory and KPIs across every outlet from one screen on your phone. You can manage stock transfers between outlets, set outlet-specific menus, and control staff access by location — all from a single login.",
  },
  {
    q: "What kind of reports can be generated?",
    a: "MyGenie generates daily sales, item-wise, payment-mode, staff performance, wastage, audit and GST/VAT reports — automatically. Reports arrive on WhatsApp at close of day without logging in. Owners also get recipe-level P&L showing the exact margin on every dish sold.",
  },
  {
    q: "What are the differences between a legacy and a cloud-based POS system?",
    a: "A legacy POS stores data on a local machine — if it crashes, data is lost, and you can only access reports on-site. A cloud POS like MyGenie stores everything securely online: you get live reports from your phone anywhere, automatic updates with no IT cost, and the system keeps working even if the internet drops (local-first billing). Cloud POS also integrates directly with Swiggy, Zomato and payment gateways — legacy systems typically cannot.",
  },
  {
    q: "Can the POS integrate with delivery platforms?",
    a: "Yes. MyGenie integrates directly with Swiggy and Zomato — orders from both platforms flow straight into the POS and kitchen screen without manual entry. You can also take direct commission-free delivery orders through your own ordering link.",
  },
  {
    q: "Can the POS measure end-to-end P&L?",
    a: "Yes. MyGenie tracks P&L at item level — every dish sold shows its revenue, ingredient cost and margin in real time. Combined with purchase costs, wastage data and inter-outlet transfers, owners get a complete picture of profitability across every outlet without assembling spreadsheets.",
  },
];

export default function HomeFaq() {
  return (
    <section className="py-20 sm:py-24" data-testid="home-faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight text-center">
            Frequently asked questions
          </h2>
        </Reveal>
        <div className="mt-8">
          {FAQS.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} testid={`home-faq-${i}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Verification Gates (run after build)

### Gate A — QAPage schema in prerendered HTML
```bash
python3 -c "
html = open('/app/frontend/build/index.html').read()
print('QAPage present:', 'QAPage' in html)
print('UPI QR question present:', 'dynamic UPI QR' in html)
print('P&L question present:', 'end-to-end P' in html)
print('ORG_JSONLD still present:', 'Organization' in html)
print('SOFTWARE_APP still present:', 'SoftwareApplication' in html)
"
```
All 5 must print `True`.

### Gate B — Section in HTML
```bash
python3 -c "
html = open('/app/frontend/build/index.html').read()
print('FAQ section heading present:', 'Frequently asked questions' in html)
print('home-faq testid present:', 'home-faq' in html)
"
```
Both must print `True`.

### Gate C — Regression: no existing sections displaced
No changes to Hero, TrustBand, ProblemGrid, CtaDemo or any other component.
Visual regression: FAQ section appears between ProofSection and CtaDemo.

---

## Build Command (after implementation)
```bash
cd /app/frontend && yarn build
sudo supervisorctl restart frontend
```

---

*Plan written 2026-09-02. All 3 changes are additive — zero deletions from existing files.*
