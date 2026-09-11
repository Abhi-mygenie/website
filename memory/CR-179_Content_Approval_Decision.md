# CR-179 — Content Approval Decision Record
**Date:** 2026-09-01
**Approver:** Owner
**Status:** APPROVED (28/28 proposals) — ready to implement

---

## Decision Summary

### PAGE A — /solutions/restaurants (P1–P6)

| Proposal | Section | Decision |
|---|---|---|
| P1 | H1: "table management made easy, faster restaurant billing" | ✅ APPROVED |
| P2 | Subtitle: "QR menu ordering", "restaurant management" | ✅ APPROVED |
| P3 | Pain card: "Slow restaurant billing and handwritten KOTs..." | ✅ APPROVED |
| P4 | Solution card Captain App: "Table management in real time" | ✅ APPROVED |
| P5 | Solution card KOT/KDS: "From QR menu scan to kitchen screen" | ✅ APPROVED |
| P6 | Solution card P&L: "Restaurant management reporting" | ✅ APPROVED |

### PAGE B — /solutions/cafes (P7–P12)

| Proposal | Section | Decision |
|---|---|---|
| P7 | Subtitle: "QR menu ordering", "inventory management", "CRM" | ✅ APPROVED |
| P8 | Pain card: "Without inventory management, ingredients spoil..." | ✅ APPROVED |
| P9 | Solution title: "Recipe & inventory management" | ✅ APPROVED |
| P10 | Solution title: "CRM, Loyalty & WhatsApp" | ✅ APPROVED |
| P11 | Solution desc: "Built-in CRM rewards regulars..." | ✅ APPROVED |
| P12 | Solution desc: "QR menu ordering — no expensive hardware" | ✅ APPROVED |

### PAGE C — /solutions/cloud-kitchens (P13–P15)

| Proposal | Section | Decision |
|---|---|---|
| P13 | H1: "inventory management", "food business" | ✅ APPROVED |
| P14 | Subtitle: "food business", "inventory management" | ✅ APPROVED |
| P15 | Solution title: "Central inventory management" | ✅ APPROVED |

### PAGE D — /product/sell-serve (P16–P23)

| Proposal | Section | Decision |
|---|---|---|
| P16 | H1: "restaurant billing", "table management built in" | ✅ APPROVED |
| P17 | Subtitle: "POS billing", "QR menu ordering" | ✅ APPROVED |
| P18 | Module name: "POS Billing" | ✅ APPROVED |
| P19 | Module outcome: "Restaurant billing in seconds" | ✅ APPROVED |
| P20 | Module name: "Captain App & Table Management" | ✅ APPROVED |
| P21 | Module outcome: "Table management in real time" | ✅ APPROVED |
| P22 | Module name: "QR Menu & Scan Order" | ✅ APPROVED |
| P23 | Module outcome: "QR menu — guests scan, order and pay" | ✅ APPROVED |

### PAGE E — /product/central-inventory (P24–P28)

| Proposal | Section | Decision |
|---|---|---|
| P24 | H1: "Central restaurant inventory management" | ✅ APPROVED |
| P25 | Subtitle: **UPDATED** — add "pos system" + "inventory management hub" + "restaurant inventory" | ✅ APPROVED |
| P26 | Module 0 outcome: "Inventory management across every outlet" | ✅ APPROVED |
| P27 | Module 3 outcome: "AI-powered inventory management" | ✅ APPROVED |
| P28 | Module 1 outcome: **NEW** — "Inventory management transfers — move stock between outlets" | ✅ APPROVED |

---

## Owner Decisions on Open Questions

**Decision 1 — pos system on /product/central-inventory:**
→ **ADD IT — work into subtitle**
P25 updated to: `"Stop managing restaurant inventory in silos. MyGenie connects your POS system to a central inventory management hub — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location."`
Adds: pos system ×1 ✅

**Decision 2 — inventory management 5th occurrence on central-inventory:**
→ **YES, add it**
New P28: Module 1 (Inter-Outlet Transfers) outcome changed to `"Inventory management transfers — move stock between outlets in a tap, fully tracked."`
Adds: inventory management ×1 (total now 5x on page) ✅

---

## Final Keyword Achievement (All 28 Approved)

| Page | Keyword | Before | After | Target |
|---|---|---|---|---|
| /solutions/restaurants | restaurant billing | 0x | 2x | 2+ ✓ |
| /solutions/restaurants | restaurant management | 0x | 2x | 2+ ✓ |
| /solutions/restaurants | table management | 0x | 2x | 2+ ✓ |
| /solutions/restaurants | qr menu | 0x | 2x | 2+ ✓ |
| /solutions/cafes | inventory management | 0x | 3x | 2+ ✓ |
| /solutions/cafes | qr menu | 0x | 2x | 2+ ✓ |
| /solutions/cafes | crm | 0x | 2x | 2+ ✓ |
| /solutions/cloud-kitchens | inventory management | 0x | 3x | 3+ ✓ |
| /solutions/cloud-kitchens | food business | 0x | 2x | 2+ ✓ |
| /product/sell-serve | restaurant billing | 0x | 2x | 2+ ✓ |
| /product/sell-serve | pos billing | 0x | 2x | 2+ ✓ |
| /product/sell-serve | table management | 0x | 3x | 2+ ✓ |
| /product/sell-serve | qr menu | 0x | 3x | 2+ ✓ |
| /product/central-inventory | restaurant inventory | 0x | 2x | 1+ ✓ |
| /product/central-inventory | inventory management | 1x | 5x | 5+ ✓ |
| /product/central-inventory | pos system | 0x | 1x | 1+ ✓ |

**All 16 keyword gaps resolved across all 5 pages. ✅**

---

## Files to Change

| File | Proposals | Change count |
|---|---|---|
| `src/data/sectors.js` | P1–P15 | 15 string edits |
| `src/data/products.js` | P16–P28 | 13 string edits |

**Total: 28 changes across 2 files. No template/component files touched.**

---

*Decision recorded 2026-09-01. Approved by owner. All 28 proposals confirmed.*
