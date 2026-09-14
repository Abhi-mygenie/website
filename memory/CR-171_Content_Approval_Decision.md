# CR-171 Content Approval Decision
**Date:** 2026-09-02
**Owner session:** E1 Agent
**Status:** APPROVED — ready to implement

---

## Final Approved Q&As (7 items)

All 7 approved by owner on 2026-09-02. Wording finalised below.

---

### Q1 — Dynamic UPI QR codes per bill
**Owner decision:** CONFIRMED feature exists. MyGenie generates dynamic UPI QR codes **natively, without a payment gateway (no Razorpay or third-party PG required).**

> **FINAL ANSWER:**
> Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly.

---

### Q2 — Ingredient-level inventory tracking
**Owner decision:** APPROVED as drafted.

> **FINAL ANSWER:**
> Yes. MyGenie tracks stock at recipe and ingredient level using Bill of Materials (BOM) costing. Every dish sold automatically deducts the right quantities from raw ingredient stock — so you always know what's left, what was wasted, and what the per-dish cost is.

---

### Q3 — Multi-outlet management
**Owner decision:** APPROVED as drafted.

> **FINAL ANSWER:**
> Yes. The owner dashboard shows live sales, inventory and KPIs across every outlet from one screen on your phone. You can manage stock transfers between outlets, set outlet-specific menus, and control staff access by location — all from a single login.

---

### Q4 — Report types
**Owner decision:** APPROVED as drafted.

> **FINAL ANSWER:**
> MyGenie generates daily sales, item-wise, payment-mode, staff performance, wastage, audit and GST/VAT reports — automatically. Reports arrive on WhatsApp at close of day without logging in. Owners also get recipe-level P&L showing the exact margin on every dish sold.

---

### Q5 — Legacy vs cloud-based POS
**Owner decision:** APPROVED as drafted.

> **FINAL ANSWER:**
> A legacy POS stores data on a local machine — if it crashes, data is lost, and you can only access reports on-site. A cloud POS like MyGenie stores everything securely online: you get live reports from your phone anywhere, automatic updates with no IT cost, and the system keeps working even if the internet drops (local-first billing). Cloud POS also integrates directly with Swiggy, Zomato and payment gateways — legacy systems typically cannot.

---

### Q6 — Delivery platform integration
**Owner decision:** APPROVED as drafted.

> **FINAL ANSWER:**
> Yes. MyGenie integrates directly with Swiggy and Zomato — orders from both platforms flow straight into the POS and kitchen screen without manual entry. You can also take direct commission-free delivery orders through your own ordering link.

---

### Q7 — End-to-end P&L
**Owner decision:** APPROVED as drafted.

> **FINAL ANSWER:**
> Yes. MyGenie tracks P&L at item level — every dish sold shows its revenue, ingredient cost and margin in real time. Combined with purchase costs, wastage data and inter-outlet transfers, owners get a complete picture of profitability across every outlet without assembling spreadsheets.

---

## Key Technical Notes for Implementation

- Schema type: `QAPage` (not FAQPage — per CR-106 May 2026 precedent)
- Placement: between ProofSection and CtaDemo in Home.jsx
- Q1 UPI answer: do NOT mention Razorpay — feature is native, no PG
- 7 Q&As total (original spec had 6; "offline" question removed by owner; 7 new questions approved)
- No CMS conflict — no `home.faq` key exists in CMS

## Rejected / Removed Questions
- "Does it work offline?" — removed by owner before approval session

---

*Decision recorded 2026-09-02. Approved by owner. Ready for implementation.*
