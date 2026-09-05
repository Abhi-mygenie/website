# CR-178 — Content Approval Decision Record
**Date:** 2026-09-01
**Approver:** Owner
**Status:** APPROVED (17/18 proposals) — ready to implement

---

## Decision Summary

| Proposal | Section | Decision | Keyword(s) |
|---|---|---|---|
| 1 | Hero badge | ✅ APPROVED | pos system |
| 2 | Hero subtitle | ✅ APPROVED | food business |
| 3 | Problems section description | ✅ APPROVED | food business |
| 4 | "Billing mistakes" pain card | ✅ APPROVED | restaurant billing |
| 5 | "Inventory wastage" pain card | ✅ APPROVED | inventory management |
| 6 | OutcomePillars H2 | ✅ APPROVED | pos system |
| 7 | "Serve Faster" outcome description | ✅ APPROVED | table management, qr menu |
| 8 | ModuleOverview H2 | ✅ APPROVED | restaurant billing |
| 9 | Sell & Serve chip: POS Billing | ✅ APPROVED | pos billing |
| 10 | Sell & Serve chip: Table Management | ✅ APPROVED | table management |
| 11 | Sell & Serve chip: QR Menu | ✅ APPROVED | qr menu |
| 12 | Sell & Serve description line | ✅ APPROVED | restaurant billing, pos system |
| 13 | Loyalty Program chip | ✅ APPROVED | loyalty program |
| 14 | Bring Customers Back description | ✅ APPROVED | loyalty program |
| 15 | Inventory Management chip | ✅ APPROVED | inventory management |
| 16 | Protect Your Profit description | ✅ APPROVED | inventory management |
| 17 | CtaDemo description paragraph | ✅ APPROVED | restaurant software, pos billing, inventory management, loyalty program |
| 18 | Footer description tagline | ❌ REJECTED | restaurant software |

**Owner reason for rejecting Proposal 18:** Do not change footer brand tagline ("The hospitality operating system").

---

## Post-approval Keyword Count (Proposals 1–17 only)

| Keyword | Target | Achieved | Proposals |
|---|---|---|---|
| pos system | 3+ | 3 | 1, 6, 12 |
| inventory management | 3+ | 4 | 5, 15, 16, 17 |
| restaurant billing | 3+ | 3 | 4, 8, 12 |
| pos billing | 2+ | 2 | 9, 17 |
| restaurant software | 2+ | 1 | 17 only (18 rejected) |
| loyalty program | 2+ | 3 | 13, 14, 17 |
| qr menu | 2+ | 2 | 7, 11 |
| table management | 2+ | 2 | 7, 10 |
| food business | 2+ | 2 | 2, 3 |

⚠️ **"restaurant software" = 1 occurrence** (Proposal 17 only, Proposal 18 rejected).
Target was 2+. Owner decision to protect brand tagline takes priority. 1 occurrence still signals the keyword to Google; it just won't fully hit the "2+" guideline. Acceptable trade-off.

---

## Files to Change

| File | Proposals | Change count |
|---|---|---|
| `src/components/home/Hero.jsx` | 1, 2 | 2 |
| `src/components/home/ProblemGrid.jsx` | 3 | 1 |
| `src/data/content.js` | 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16 | 11 |
| `src/components/home/OutcomePillars.jsx` | 6 | 1 |
| `src/components/home/ModuleOverview.jsx` | 8 | 1 |
| `src/components/home/CtaDemo.jsx` | 17 | 1 |
| `src/components/site/Footer.jsx` | 18 — REJECTED | 0 |

**Total: 17 copy changes across 6 files. Footer untouched.**

---

*Decision recorded 2026-09-01. Approved by owner.*
