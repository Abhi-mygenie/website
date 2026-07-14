# MyGenie POS — Shotboard & Production Plan
**Version:** 1.0 | **Date:** June 2026
**Source brief:** `/app/CREATIVE_BRIEF_VIDEO.md`
**For:** Video Production Agent

---

## HOW TO USE THIS DOCUMENT

1. Pick one asset by priority order.
2. Read its shotboard table — every row = one clip to record.
3. Set up the demo data listed in the "Demo Data" column before recording.
4. Record clips in order. Name them exactly as listed in "Raw File Name."
5. Edit using the Final Edit Timeline at the bottom of each asset section.
6. Export with the filename listed. Upload to the CMS key listed.
7. Mark blockers before starting — do not record a scene if a blocker is unresolved.

**Capture type legend:**
- `SS` = Static screenshot (single frame, used in GIF or stat card)
- `SR` = Screen recording (single device, screen mirror to laptop)
- `DD` = Dual device recording (two devices simultaneously)
- `BR` = B-roll (real environment footage, phone/camera)
- `AC` = Animated card (motion graphic — built in post)
- `CTA` = CTA card (final frame — built in post)

---
---
# PART 1 — PRICING GIFs
---

---
## ASSET 01 — Starter Plan GIF
**Export filename:** `plan-starter-demo.gif`
**CMS key:** `plan.starter.demo_gif`
**Format:** GIF/webp animated | **Duration:** 8 sec loop | **Audio:** None
**Priority:** 6 | **Source brief:** Section 2, GIF 1

### Pre-recording setup
- Account: Single outlet — "Terraria Café, Pune"
- Menu pre-loaded: Masala Dosa ₹120, Chai ₹30 (both visible on POS home without scrolling)
- Today's summary data: ₹8,400 total, 47 orders (set in demo data)
- Device: Phone, screen mirror active
- Do NOT show: Settings, onboarding, multiple staff, complex menu

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO/Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0.0–1.5s | Establish POS — simple, clean | POS home screen, idle, counter view, no items selected yet | POS / Billing home | Outlet: Terraria Café. Menu visible: Dosa, Chai, etc. Clean grid. | SS | "₹0 hardware. Any phone." | — | No zoom. Full screen. Show full menu grid. | `s01-starter-pos-home.png` | None |
| S2 | 1.5–4.0s | 4-tap bill creation | Taps: Masala Dosa ×1 → Chai ×2 → bill total ₹180 visible | POS billing / item selection | Masala Dosa ₹120, Chai ₹30 ×2 = ₹60. Total ₹180. GST line visible. | SR | "Bill in 4 taps." | — | Zoom in slightly on item tap. Highlight total ₹180 in green flash at end. | `s02-starter-billing-4taps.mp4` | None |
| S3 | 4.0–6.5s | GST invoice auto-generates | Tap PRINT/SEND → invoice preview modal flashes on screen | POS → Print / Invoice preview | Invoice: Masala Dosa ₹120 + Chai ₹60. CGST ₹9. SGST ₹9. Total ₹198. | SR | "GST invoice. Automatic." | — | Zoom to invoice preview. Highlight "CGST / SGST" line briefly. | `s03-starter-gst-invoice.mp4` | None |
| S4 | 6.5–8.0s | Day summary — result moment | Today's summary card: ₹8,400 total, 47 orders | POS Dashboard / Summary | Total: ₹8,400. Orders: 47. Avg bill: ₹178. | SS | "Your day. One number." | — | Zoom to the ₹8,400 number. Hold 1 second before loop. | `s04-starter-day-summary.png` | Demo data: set ₹8,400 / 47 orders in test account |

### Caption & Overlay Text (final)
```
S1: "₹0 hardware. Any phone."          [white, "₹0" in brand green]
S2: "Bill in 4 taps."                  [white, "4 taps" in brand green]
S3: "GST invoice. Automatic."          [white, "Automatic" in brand green]
S4: "Your day. One number."            [white, "One number" in brand green]
```

### Edit Timeline
```
0.0–1.5s  → S1 (static frame, hold)
1.5–4.0s  → S2 (screen recording, speed up 1.2×)
4.0–6.5s  → S3 (screen recording, speed up 1.2×)
6.5–8.0s  → S4 (static frame, hold — loop end)
LOOP → back to 0.0s
```

### Blockers / Missing Inputs
- [ ] Demo account must have ₹8,400 / 47 orders in today's summary — set before recording
- [ ] Confirm GST rate configured in test account (CGST + SGST split)

---

## ASSET 02 — Growth Plan GIF
**Export filename:** `plan-growth-demo.gif`
**CMS key:** `plan.growth.demo_gif`
**Format:** GIF/webp animated | **Duration:** 12 sec loop | **Audio:** None
**Priority:** 7 | **Source brief:** Section 2, GIF 2

### Pre-recording setup
- Account: "Terraria Café, Pune" — Captain App active, KDS configured
- Tables: Table 7 visible, unoccupied
- Staff profiles: Waiter 1 (Amit), Waiter 2 (Ravi) — both logged in on separate devices
- Menu: Pasta ₹280, Espresso ₹120 — items in menu
- KDS: Configured for Hot Kitchen station routing
- Devices: 2 phones for split-screen (Captain App) + 1 for KDS

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO/Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0.0–2.0s | Establish dual-device split view | LEFT: Captain App floor view (table grid). RIGHT: KDS kitchen screen (empty, waiting). Both idle. | Captain App + KDS | Tables grid visible left. KDS "No active orders" right. | DD | "2 waiters. 1 table. No clashes." | — | Side-by-side. No zoom. | `s01-growth-split-idle.mp4` | Dual device recording setup needed |
| S2 | 2.0–5.0s | Waiter takes order, KOT sent | LEFT: Waiter selects Table 7 → taps Pasta ×1, Espresso ×2 → adds note "no onion" → hits SEND KOT | Captain App — Table 7 order entry | Pasta ×1 ₹280, Espresso ×2 ₹240. Note: "no onion". Total ₹520. | SR | "Order sent in 8 seconds." | — | Zoom to "SEND KOT" tap. Timer overlay: "8 sec" in green briefly. | `s02-growth-captain-order.mp4` | None |
| S3 | 5.0–8.0s | KDS receives order instantly | RIGHT: KDS pings. Table 7 order appears: Pasta, 2× Espresso, "no onion". Station: Hot Kitchen. Chef taps ACCEPT. Green tick. | KDS — Hot Kitchen station | Table 7. Items listed. Station tag "Hot Kitchen". Accept button. | SR | "Kitchen sees it. Instantly." | — | Zoom to KDS ping moment. Highlight "Table 7" card appearing. | `s03-growth-kds-receive.mp4` | KDS station routing must be set up |
| S4 | 8.0–10.5s | Waiter sees confirmation | LEFT: Waiter app shows Table 7 → IN PREPARATION. No follow-up needed. Status badge green. | Captain App — order status | Table 7 status: "IN PREPARATION". Green badge. | SR | "No lost chits. Ever." | — | Zoom to status badge "IN PREPARATION". | `s04-growth-status-confirm.mp4` | None |
| S5 | 10.5–12.0s | Day result — social proof | Daily counter: 128 orders, 0 kitchen errors. Clean summary screen. | POS Dashboard | Orders today: 128. Errors: 0. | SS | "Included in Growth. ₹1,499/mo." | — | Full screen. ₹1,499 in brand green. | `s05-growth-daily-counter.png` | Set 128 orders in demo data |

### Edit Timeline
```
0.0–2.0s  → S1 (split-screen, both devices)
2.0–5.0s  → S2 (Captain App recording — left panel)
5.0–8.0s  → S3 (KDS recording — right panel, sync with S2 timeline)
8.0–10.5s → S4 (Captain App status update)
10.5–12.0s→ S5 (static frame, hold — loop end)
LOOP
```

### Blockers
- [ ] Dual-device recording rig needed (simultaneous screen capture of 2 phones)
- [ ] KDS must be pre-configured with "Hot Kitchen" station routing for Pasta

---

## ASSET 03 — Pro Plan GIF
**Export filename:** `plan-pro-demo.gif`
**CMS key:** `plan.pro.demo_gif`
**Format:** GIF/webp animated | **Duration:** 15 sec loop | **Audio:** None
**Priority:** 2 | **Source brief:** Section 2, GIF 3

### Pre-recording setup
- Account: Terraria Café, Pune — Loyalty + WhatsApp automation enabled
- CRM customer: Anita Sharma | Phone: 9812345678 | Visit #3 | 240 loyalty points
- Loyalty config: 1 point per ₹10 spent. Redemption: ₹50 per 100 points.
- Bill: ₹1,840 pre-built and ready
- WhatsApp automation template: configured and active
- Owner dashboard: Repeat customers this week = 64 (+18%)
- Inventory: Chicken stock = 2 kg (low stock alert active)

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO/Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0.0–2.5s | Customer recognised at billing | Staff enters phone 9812345678 → profile card appears: Anita Sharma, Visit #3, 240 loyalty points | POS Billing → CRM lookup | Phone: 9812345678. Profile: Anita Sharma. Visit #3. 240 pts. | SR | "Every returning guest, recognised." | — | Zoom to profile card pop-up. Highlight "Visit #3" and "240 pts". | `s01-pro-crm-profile.mp4` | CRM customer Anita Sharma must be pre-created |
| S2 | 2.5–5.5s | Loyalty auto-applied | Bill ₹1,840. System prompt: "Apply ₹50 reward?" Staff taps YES. Final: ₹1,790. | POS Billing → Loyalty redemption | Bill ₹1,840. Loyalty deduction −₹50. Final ₹1,790. Points after: 290. | SR | "Rewards auto-apply. Zero effort." | — | Zoom to loyalty deduction line "−₹50". Then zoom out to final total ₹1,790. | `s02-pro-loyalty-applied.mp4` | Loyalty redemption must be enabled and configured |
| S3 | 5.5–9.0s | WhatsApp auto-sent | WhatsApp conversation with Anita Sharma. Message: "Thanks for visiting! You now have 290 points. Redeem on your next visit 🎉" Sent timestamp visible. | WhatsApp (phone screen — real WhatsApp) | Message to Anita Sharma. Text visible. Sent tick. Timestamp. | SR | "WhatsApp. Automatic. While you serve." | — | Zoom to WhatsApp message text. Hold on double tick. | `s03-pro-whatsapp-sent.mp4` | WhatsApp automation must be live and send real message to test number |
| S4 | 9.0–12.0s | Owner dashboard — repeat metric | Owner dashboard. Repeat customers this week: 64 (+18% vs last week). | Owner Dashboard → CRM metrics | Repeat customers: 64. Change: +18%. Week-over-week chart. | SS | "Regulars = most profitable customers." | — | Zoom to "+18%" figure in green. | `s04-pro-dashboard-repeat.png` | Set repeat customer data in demo account |
| S5 | 12.0–15.0s | Inventory alert + PO in 2 taps | Inventory alert: "Chicken: 2 kg remaining". Owner taps → raises purchase order in 2 taps. | Inventory → Low stock alert → PO | Item: Chicken. Stock: 2 kg. Alert: red. PO screen: Supplier, qty. | SR | "Stock. CRM. WhatsApp. One plan." | — | Zoom to alert badge, then to PO submit button. | `s05-pro-inventory-alert.mp4` | Inventory module must be active. Stock set to 2 kg. |

### Edit Timeline
```
0.0–2.5s  → S1 (SR)
2.5–5.5s  → S2 (SR)
5.5–9.0s  → S3 (SR — phone WhatsApp)
9.0–12.0s → S4 (SS, hold)
12.0–15.0s→ S5 (SR)
LOOP
```

### Blockers
- [ ] WhatsApp automation must be live — confirm test number receives real message
- [ ] CRM customer Anita Sharma (9812345678) must be pre-created with 240 points

---

## ASSET 04 — Chain/Custom Plan GIF
**Export filename:** `plan-custom-demo.gif`
**CMS key:** `plan.custom.demo_gif`
**Format:** GIF/webp animated | **Duration:** 12 sec loop | **Audio:** None
**Priority:** 8 | **Source brief:** Section 2, GIF 4

### Pre-recording setup
- Account: Multi-outlet — 4 outlets: Bandra, Andheri, Pune, Nashik
- Andheri: set today's sales ₹8,200, low stock (2 items out of stock)
- Bandra: ₹34,200. Pune: ₹26,100. Nashik: ₹8,200.
- Central Inventory: Andheri chicken 1.2 kg (critical red), others normal
- WhatsApp report: scheduled to send at 11 PM — capture on phone

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO/Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0.0–2.5s | Multi-outlet dashboard — live | 4 outlet tiles with live sales. All updating. | Owner Dashboard → Multi-outlet | Bandra ₹34,200. Andheri ₹8,200 (amber). Pune ₹26,100. Nashik ₹18,400. | SR | "4 outlets. One screen." | — | Slow pan / zoom across 4 tiles. | `s01-custom-dashboard-4outlets.mp4` | Multi-outlet account required |
| S2 | 2.5–5.5s | Problem spotted — Andheri | Nashik tile turns amber. Owner taps → drill-in: 2 items out of stock shown. | Owner Dashboard → Outlet drill-down → Stock | Andheri ₹8,200. Amber flag. Stock: Chicken 1.2 kg 🔴. Oil 0.5 L 🔴. | SR | "Spot the problem before it costs you." | — | Zoom to amber Andheri tile. Then zoom to stock flags. | `s02-custom-andheri-problem.mp4` | Andheri stock must be set to critical |
| S3 | 5.5–8.5s | Inter-outlet transfer — 3 taps | Inventory → Transfer: Pune → Andheri, 5 kg chicken. Approved. Stock updates. | Central Inventory → Inter-outlet transfer | FROM: Pune 9 kg. TO: Andheri 1.2 kg. QTY: 5 kg. Approve tap. | SR | "Fix it. In 3 taps. From anywhere." | — | Count taps with "1 / 2 / 3" micro overlays. Zoom to updated stock. | `s03-custom-transfer.mp4` | Transfer feature must be available in test account |
| S4 | 8.5–10.5s | Central stock + P&L — control | Central stock view: all 4 outlets. Consolidated P&L below. | Central Inventory → Summary + P&L | Stock: all 4 outlets. P&L: Total ₹1,14,500. | SS | "No spreadsheets. No calls." | — | Wide view. No zoom. Full dashboard visible. | `s04-custom-central-stock.png` | Consolidated P&L must be available |
| S5 | 10.5–12.0s | WhatsApp report — autopilot | WhatsApp notification 11 PM: "Total ₹1,14,500. Best: Bandra ₹34,200" | WhatsApp (phone screen) | Message: "Total: ₹1,14,500 | Best outlet: Bandra ₹34,200" | SR | "Your business. On autopilot." | — | Zoom to the numbers ₹1,14,500 and ₹34,200. | `s05-custom-whatsapp-report.mp4` | WhatsApp report must be enabled and triggered |

### Edit Timeline
```
0.0–2.5s  → S1 (SR)
2.5–5.5s  → S2 (SR)
5.5–8.5s  → S3 (SR)
8.5–10.5s → S4 (SS hold)
10.5–12.0s→ S5 (SR)
LOOP
```

### Blockers
- [ ] Multi-outlet account with 4 live outlets required (Bandra / Andheri / Pune / Nashik)
- [ ] WhatsApp daily report feature must be active on test account

---
---
# PART 2 — PRODUCT VIDEOS
---

---
## ASSET 05 — Sell & Serve Faster
**Export filename:** `product-sell-serve.mp4`
**CMS key:** `product.sell-serve.video`
**Format:** MP4 H.264 1920×1080 | **Duration:** 75 sec | **Audio:** VO + music
**Priority:** 4 | **Source brief:** Section 3, Video 1

### Pre-recording setup
- Account: Terraria Café, Pune
- Tables: Table 12 active, 2 waiters logged in (Amit + Ravi on separate devices)
- Menu: Paneer Tikka ₹240, Dal Makhani ₹220 — visible in Captain App
- KDS: Hot Kitchen station, Scan & Order QR code active on Table 8
- POS: 3-item test bill ready (Biryani ₹280, Lassi ₹80, Raita ₹60 = ₹420)
- Network: WiFi available to disconnect for offline scene

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO Line | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H | 0–5s | PAIN HOOK | Busy restaurant. Waiter writing on paper chit. Kitchen shouting. Bill counter queue. | B-roll | Real restaurant rush environment. Paper chits. | BR | None | "Every rush hour — lost orders, wrong dishes, billing delays." | None | `h01-ss-broll-rush.mp4` | Need access to real restaurant for shoot OR stock footage |
| S1a | 5–11s | Captain App — waiter 1 takes order | Waiter (Amit) opens Captain App. Selects Table 12. Taps Paneer Tikka ×2, Dal Makhani ×1. Adds note "less spicy". | Captain App — table selection + order entry | Table 12. Items: Paneer Tikka ×2 ₹480, Dal Makhani ×1 ₹220. Note: less spicy. | SR | "Captain App. Works on any Android phone." | "Multiple waiters. One table." | Zoom to note field "less spicy" — highlight briefly. | `s1a-ss-captain-order.mp4` | None |
| S1b | 11–18s | Captain App — waiter 2 joins same table, no clash | Second waiter (Ravi) on separate phone — opens Table 12. Adds Mango Lassi ×1 ₹80. No conflict. Orders merge seamlessly. | Captain App — second waiter same table | Table 12 now shows: Paneer Tikka ×2, Dal Makhani ×1, Lassi ×1. Both waiters visible in order log. | DD | — | "Orders sync in real time — no clashes, no re-entries." | Highlight "2 waiters, 1 table" in table header. | `s1b-ss-dual-waiter.mp4` | Dual-device recording needed |
| S2 | 18–32s | KDS — order appears, chef accepts | KDS screen pings. Table 12 order shown. Routed to Hot Kitchen. Chef taps ACCEPT. Timer starts: 0:00. | KDS — Hot Kitchen station | Table 12: Paneer Tikka ×2, Dal Makhani ×1, Lassi ×1. Station: Hot Kitchen. Timer active. | SR | "Kitchen Display System. Zero lost chits." | "No printed chit. No shouting. The kitchen screen shows every order live — routed to the right station." | Zoom to order card appearance. Slow zoom to prep timer start. | `s2-ss-kds-accept.mp4` | KDS station routing must be active |
| S3 | 32–46s | Scan & Order — guest self-orders | Guest holds phone over QR code on table card. Menu opens in phone browser (no app download prompt). Adds Biryani + Lassi. Pays via UPI. Order hits KDS. | Scan & Order — QR menu flow | Menu open in Chrome browser. Biryani ₹280 + Lassi ₹80. UPI payment. Order confirmed. | BR+SR | "Scan & Order. No app. No hardware." | "Guests scan, order and pay from their own phone. No app download. No extra staff needed at peak." | Close-up of QR scan. Then show browser menu (no app store). Highlight "UPI Pay" button. | `s3-ss-scan-order.mp4` | QR code + Scan & Order must be active for this outlet |
| S4a | 46–54s | POS billing — fast, GST, split | POS screen. 3 items: Biryani ₹280, Raita ₹60, Chai ₹30 = ₹370. GST auto-calculated. Split bill shown (Table + Counter). PRINT. | POS billing | Biryani ₹280 + Raita ₹60 + Chai ₹30 = ₹370. GST ₹18.50. Final ₹388.50. Split bill option visible. | SR | "Offline mode. Never stop billing." | "Bill in seconds — with GST, split bills, and holds." | Zoom to GST line auto-populating. Then zoom to PRINT button tap. | `s4a-ss-pos-billing.mp4` | None |
| S4b | 54–62s | Offline mode — no internet, still billing | WiFi icon drops to zero. Offline badge appears. Staff completes 3 more transactions. WiFi returns. Sync animation runs — all 3 upload. | POS — offline mode | Offline badge: orange. 3 bills processed. On reconnect: sync count "3 pending → synced". | SR | — | "Even when the internet drops." | Zoom to offline badge. Then zoom to sync count animation. | `s4b-ss-offline-sync.mp4` | Need to physically disconnect WiFi during recording |
| P | 62–75s | Proof stats + CTA | Two white stat cards animate in on dark bg. Card 1: "22% more revenue per shift — Terraria Café". Card 2: "40% fewer order delays — La Fetta Pizzeria". Then CTA card. | Animated card (post-production) | Stats as defined. Logo + "Book a free demo" + mygenie.in | AC + CTA | — | "Serve more. Lose nothing." | Cards slide in from bottom. Each holds 3 seconds. CTA holds 3 seconds. | `p-ss-proof-cta.mp4` | Post-production asset |

### Voiceover Script (full)
```
[0–5s]    "Every rush hour — lost orders, wrong dishes, billing delays."
[5–18s]   "Multiple waiters. One table. Orders sync in real time — no clashes, no re-entries."
[18–32s]  "No printed chit. No shouting. The kitchen screen shows every order live — routed to the right station."
[32–46s]  "Guests scan, order and pay from their own phone. No app download. No extra staff needed at peak."
[46–62s]  "Bill in seconds — with GST, split bills, and holds. Even when the internet drops."
[62–75s]  "Serve more. Lose nothing."
```

### Caption Text List
```
[5s]   "Captain App. Works on any Android phone."
[18s]  "Kitchen Display System. Zero lost chits."
[32s]  "Scan & Order. No app. No hardware."
[46s]  "Offline mode. Never stop billing."
[62s]  "22% more revenue per shift — Terraria Café"
[66s]  "40% fewer order delays — La Fetta Pizzeria"
```

### Edit Timeline
```
0–5s    → H (B-roll hook)
5–11s   → S1a (SR — Captain App)
11–18s  → S1b (DD — dual waiter)
18–32s  → S2 (SR — KDS)
32–46s  → S3 (BR+SR — Scan & Order)
46–54s  → S4a (SR — POS billing)
54–62s  → S4b (SR — offline + sync)
62–75s  → P (AC — proof cards + CTA)
```

### Blockers
- [ ] B-roll: real restaurant rush hour footage (own outlet or stock)
- [ ] Dual-device rig for S1b
- [ ] QR code / Scan & Order module must be active on account

---

## ASSET 06 — Run the Whole Property
**Export filename:** `product-run-property.mp4`
**CMS key:** `product.run-property.video`
**Format:** MP4 H.264 1920×1080 | **Duration:** 70 sec | **Audio:** VO + music
**Priority:** 9 | **Source brief:** Section 3, Video 2

### Pre-recording setup
- Account: "Luxevista Resort" — Hotel billing, Food Court, and Offline mode active
- Room 204 folio: Night stay ₹8,400 + Breakfast ₹640 + Spa ₹1,800 + Mini bar ₹380 pre-posted
- Food court: 4 counters (Pizza, Chinese, Juice, Desserts) active. Shared wallet: ₹480 test transaction ready
- Settlement screen: daily counter totals visible
- WiFi: available to disconnect for offline scene
- Checkout bill: Room 204 consolidated bill pre-built

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO Line | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H | 0–5s | PAIN HOOK | Hotel front desk. Guest at checkout. Staff juggling 3 different tablets. Guest checks watch. Frustrated. | B-roll | Hotel lobby / front desk environment. | BR | None | "One guest. Rooms. Restaurant. Spa. Three different systems. Every checkout is a 20-minute chase." | None | `h01-rp-broll-checkout.mp4` | Hotel B-roll footage needed |
| S1a | 5–14s | Room folio — charges posting live | Room 204 folio open. 4 charges visible: Night stay ₹8,400, Breakfast ₹640, Spa ₹1,800, Mini bar ₹380. Each from different department. | Hotel Billing → Room Folio | Room 204. All 4 charges listed with department tags. Total ₹11,220. | SR | "Hotel Billing. One folio. Every department." | "Every charge — room, restaurant, spa, bar — posts to one folio automatically." | Zoom to department tags (Front Desk / Restaurant / Spa / Housekeeping). | `s1a-rp-room-folio.mp4` | Hotel billing module must be active |
| S1b | 14–22s | Folio detail — no paper, no chasing | Scroll down folio to show all line items. Timestamp on each charge visible. No manual entry fields. | Hotel Billing → Folio detail | Each line item has: dept name, item, amount, timestamp. All auto-posted. | SR | — | "Staff don't carry paper. Guests don't wait." | Zoom to timestamps on folio entries. | `s1b-rp-folio-scroll.mp4` | None |
| S2a | 22–30s | Food court — customer pays once | Customer at food court. Scans QR. Pays ₹480. Auto-split shown: Pizza ₹220, Juice ₹80, Dessert ₹180. | Food Court → Shared wallet | Payment ₹480. Counter breakdown: Pizza ₹220 / Juice ₹80 / Dessert ₹180. | SR | "Food Court Mode. One wallet. Auto-settlement." | "Food courts run multiple counters independently — but customers pay from one shared wallet." | Zoom to payment split breakdown. Highlight "Auto" label. | `s2a-rp-foodcourt-payment.mp4` | Food court / multi-counter module must be active |
| S2b | 30–38s | Food court — daily settlement | Settlement screen: each counter's total for the day auto-reconciled. Pizza ₹18,400. Chinese ₹12,600. Juice ₹6,200. Desserts ₹4,800. | Food Court → Settlement | Counter-wise totals. Auto-reconciled badge. Export button. | SR | — | "Settlement happens automatically." | Zoom to auto-reconciled badge. | `s2b-rp-foodcourt-settle.mp4` | None |
| S3 | 38–52s | Offline mode — billing continues | WiFi drops. Offline badge. 3 bills processed. Reconnect. Sync runs. | POS / Hotel Billing — offline mode | Offline badge. 3 transactions. Sync animation "3 pending → synced". | SR | "Offline-first. Zero data loss." | "In resorts, banquet halls, or low-connectivity areas — offline mode keeps everything running. Auto-syncs the moment you're back online." | Zoom to offline badge. Then sync count. | `s3-rp-offline.mp4` | Need to physically disconnect WiFi |
| S4 | 52–63s | Single checkout bill — 4 sec | Guest at checkout. Tap "Generate Bill — Room 204". A4 bill appears: all departments, all charges, GST split. Guest reviews. Pays. | Hotel Billing → Checkout → Bill generation | Bill: Room ₹8,400 + Restaurant ₹640 + Spa ₹1,800 + Mini bar ₹380 = ₹11,220. GST lines. | SR | "2-minute checkout. Every time." | "At checkout — one clean bill. Every department, every charge, tax-compliant. Generated in seconds." | Zoom to bill generation moment. Then hold on final total ₹11,220 + GST. | `s4-rp-checkout-bill.mp4` | Checkout bill must aggregate all folio items |
| P | 63–70s | Proof + CTA | Stat cards + CTA card | AC + CTA | "18% lower overhead — Luxevista Resort" / "30% faster room service — Palm Forest Resort" | AC + CTA | — | — | Cards slide in | `p-rp-proof-cta.mp4` | Post-production |

### Voiceover Script
```
[0–5s]    "One guest. Rooms. Restaurant. Spa. Three different systems. Every checkout is a 20-minute chase."
[5–22s]   "Every charge — room, restaurant, spa, bar — posts to one folio automatically. Staff don't carry paper. Guests don't wait."
[22–38s]  "Food courts run multiple counters independently — but customers pay from one shared wallet. Settlement happens automatically."
[38–52s]  "In resorts, banquet halls, or low-connectivity areas — offline mode keeps everything running. Auto-syncs the moment you're back online."
[52–63s]  "At checkout — one clean bill. Every department, every charge, tax-compliant. Generated in seconds."
```

### Blockers
- [ ] Hotel B-roll (front desk footage)
- [ ] Hotel billing module must be live on test account
- [ ] Food court / multi-counter module must be active

---

## ASSET 07 — Bring Customers Back
**Export filename:** `product-customers.mp4`
**CMS key:** `product.customers.video`
**Format:** MP4 H.264 1920×1080 | **Duration:** 80 sec | **Audio:** VO + music
**Priority:** 3 | **Source brief:** Section 3, Video 3

### Pre-recording setup
- CRM customer: Ravi Mehta | 9876543210 | 8 visits | ₹24,000 spend | Fav: Chicken Biryani | 310 loyalty points
- Bill: ₹1,450 ready in POS
- Loyalty: 310 points → ₹60 redemption (6 points per ₹)
- WhatsApp automation: configured with follow-up template
- Segments pre-populated: Lapsed 47, Top spenders 12, Birthdays 6
- Wallet: ₹2,000 top-up demo with ₹100 bonus

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO Line | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H | 0–5s | PAIN HOOK | Bill prints. Customer walks out. Owner looks at blank receipt. | B-roll | Real restaurant. Customer leaving. Plain thermal receipt. | BR | None | "You served 80 people today. How many will come back? You have no idea — because you don't know who they are." | None | `h01-cb-broll-anonymous.mp4` | B-roll needed |
| S1 | 5–18s | CRM profile at billing | Staff enters 9876543210. Profile card appears: Ravi Mehta, Visit #8, ₹24,000 spend, Fav: Chicken Biryani. | POS Billing → CRM lookup | Phone: 9876543210. Ravi Mehta. Visit #8. Spend ₹24,000. Fav item: Chicken Biryani. | SR | "CRM. Built into every bill." | "Every time a customer bills, their profile updates automatically. Visit count, favourite items, lifetime spend — no manual entry needed." | Zoom to profile card pop-up. Highlight "Visit #8" and "₹24,000" and "Chicken Biryani". | `s1-cb-crm-profile.mp4` | CRM customer Ravi Mehta must be pre-created |
| S2 | 18–32s | Loyalty auto-applied | Bill ₹1,450. Prompt: "Ravi has 310 points — apply ₹60?" Staff taps YES. Final ₹1,390. | POS Billing → Loyalty redemption | Bill ₹1,450. Deduction −₹60. Final ₹1,390. New balance: 250 pts. | SR | "Auto loyalty. Zero staff effort." | "Loyalty rewards apply automatically at billing. Customers feel valued — without the staff having to remember anything." | Zoom to "−₹60" deduction line. Then hold on final ₹1,390. | `s2-cb-loyalty-applied.mp4` | Loyalty configured for Ravi Mehta |
| S3 | 32–47s | WhatsApp auto-send | WhatsApp open. Message to Ravi: "Hi Ravi, thanks for visiting! Your new balance: 370 points. We miss you — 20% off this weekend only 🎉" Customer opens. Replies "Book for 2 on Saturday." | WhatsApp (phone screen) | Message to Ravi Mehta. Full message visible. Reply from customer visible. | SR | "WhatsApp Automation. Runs itself." | "Automated WhatsApp — thank-yous, comeback offers, birthday greetings. Sent while you sleep. No marketing team." | Zoom to message text. Hold on customer reply. | `s3-cb-whatsapp-reply.mp4` | WhatsApp automation must send real message to test number |
| S4a | 47–55s | Segments — auto-created | CRM segments screen. 3 segment tiles: Lapsed 30+ days: 47. Top spenders: 12. Birthdays this week: 6. | CRM → Segments | Lapsed: 47. Top spenders: 12. Birthdays: 6. All auto-generated. | SR | "Smart Segments. 2× campaign response." | "AI segments your customers automatically. Target the right people — not everyone." | Zoom to each tile in sequence. | `s4a-cb-segments.mp4` | Segment data must be pre-populated |
| S4b | 55–62s | One-tap campaign send + result comparison | Owner taps "Lapsed 47" → send offer. Then animated comparison: Blast 2% vs Targeted 34%. | CRM → Campaign send + animated comparison | Send screen: 47 messages. Then comparison card (post-production). | SR + AC | — | "Every campaign lands." | Zoom to SEND tap. Then cut to comparison card animation. | `s4b-cb-campaign-compare.mp4` | Comparison card = post-production animated graphic |
| S5 | 62–73s | Prepaid wallet — lock in spend | Customer tops up ₹2,000. Bonus ₹100 added = ₹2,100. 3 return visits shown as wallet balance reduces. | CRM → Wallet → Top-up | Top-up: ₹2,000. Bonus: ₹100. Balance: ₹2,100. Each visit: deduction shown. | SR | "Prepaid Wallet. Guaranteed return visits." | "Prepaid wallets lock in spend and smooth cash flow. A customer with a balance always comes back." | Zoom to ₹100 bonus being added. Then show balance reducing over 3 visits. | `s5-cb-wallet-topup.mp4` | Wallet module must be active |
| P | 73–80s | Proof + CTA | Stat cards + CTA | AC + CTA | "15% revenue growth — Kates Kitchen" / "2× repeat visits with loyalty + WhatsApp" | AC + CTA | — | — | Cards animate in | `p-cb-proof-cta.mp4` | Post-production |

### Voiceover Script
```
[0–5s]    "You served 80 people today. How many will come back? You have no idea — because you don't know who they are."
[5–18s]   "Every time a customer bills, their profile updates automatically. Visit count, favourite items, lifetime spend — no manual entry needed."
[18–32s]  "Loyalty rewards apply automatically at billing. Customers feel valued — without the staff having to remember anything."
[32–47s]  "Automated WhatsApp — thank-yous, comeback offers, birthday greetings. Sent while you sleep. No marketing team."
[47–62s]  "AI segments your customers automatically. Target the right people — not everyone. Every campaign lands."
[62–73s]  "Prepaid wallets lock in spend and smooth cash flow. A customer with a balance always comes back."
```

### Blockers
- [ ] B-roll: customer walking away with blank receipt
- [ ] WhatsApp automation must be live (real message delivery)
- [ ] CRM: Ravi Mehta pre-created with full history

---

## ASSET 08 — Protect Your Profit
**Export filename:** `product-protect-profit.mp4`
**CMS key:** `product.protect-profit.video`
**Format:** MP4 H.264 1920×1080 | **Duration:** 75 sec | **Audio:** VO + music
**Priority:** 1 ← RECORD FIRST
**Source brief:** Section 3, Video 4

### Pre-recording setup
- Account: Rhino (Mumbai) — audit logs active
- Audit data: Staff "Ramesh" — 14 post-payment voids, Table 9, ₹840 each, total ₹11,200 this week
- Recipe: Chicken Biryani — 280g chicken per portion. 42 orders today = 11.76 kg expected. Closing stock: 9.2 kg. Variance: 2.56 kg.
- Validation rules: Discount cap 20% — rule active
- Chains account: Nashik outlet — chicken variance 2.7 kg flagged
- P&L screen: Expected ₹1,80,000 profit. Actual ₹1,10,000.

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO Line | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H | 0–6s | FEAR HOOK — profit gap | P&L screen. Expected profit ₹1,80,000. Actual ₹1,10,000. Owner leans back. "Where did ₹70,000 go?" | P&L Report / Owner Dashboard | Expected: ₹1,80,000. Actual: ₹1,10,000. Delta: −₹70,000 in red. | BR + SR | None | "Your sales look fine. Your profit doesn't. Most leakage is invisible — until it's too late." | Zoom in slowly on actual profit ₹1,10,000. Hold on −₹70,000 delta. | `h01-pp-profit-gap.mp4` | P&L data must be pre-set. B-roll of owner reaction. |
| S1a | 6–13s | Audit log — filter post-payment voids | Audit Report. Apply filter: "Post-payment voids". 3 red results appear. | Audit Report → Filter | Filter: Post-payment voids. Results: 3 flagged entries in red. | SR | — | "Every void, cancel and discount is logged — with staff name, time, and the exact amount." | Zoom to filter selection. Zoom to red results appearing. | `s1a-pp-audit-filter.mp4` | Audit log data with Ramesh's voids must be pre-created |
| S1b | 13–22s | Audit log drill-down — the catch | Drill into first result: Table 9. Bill ₹840. Paid. Voided by "Ramesh" 4 min after. Same pattern 14 times = ₹11,200. | Audit Report → Drill-down | Table 9. Bill ₹840. Status: PAID then VOID. Staff: Ramesh. Time: 4 min after payment. Pattern: 14×. Total: ₹11,200. | SR | "Rhino caught ₹1 Lakh in theft in 2 weeks." [RED then GREEN] | — | SLOW ZOOM to "Ramesh" name. Hold 1.5 seconds. Then zoom to "14 times" and "₹11,200". This is the most powerful moment — hold it. | `s1b-pp-audit-ramesh.mp4` | 14 void entries must exist under staff "Ramesh" |
| S2 | 22–38s | Recipe inventory — variance catch | Recipe card: Chicken Biryani (280g chicken). 42 orders = 11.76 kg expected. Actual: 9.2 kg. Variance: 2.56 kg = ₹1,024 flagged. | Inventory → Recipe tracking → Variance report | Recipe: Biryani 280g chicken. Orders: 42. Expected: 11.76 kg. Actual: 9.2 kg. Variance: 2.56 kg 🚩 | SR | "Recipe Inventory. Catch waste at the gram." | "Recipe-level tracking knows exactly how much stock should be consumed. The moment numbers don't match — it flags it." | Zoom to recipe card. Then zoom to variance "2.56 kg" in red. | `s2-pp-recipe-variance.mp4` | Recipe-level inventory with today's consumption data |
| S3a | 38–46s | Smart validation — discount blocked | Cashier tries 40% discount. System shows: "Discount above limit. Manager approval required." | POS → Validation rules | Cashier applies 40% disc. System intercepts. Message: "Discount above limit. Manager approval required." | SR | — | "Discount rules and approval flows — set by you, enforced automatically." | Zoom to system intercept message. | `s3a-pp-discount-blocked.mp4` | Validation rule: max discount 20% must be configured |
| S3b | 46–52s | Manager approval — deny, log | Manager phone notification: "Discount approval — Table 5, ₹960 discount." Manager taps DENY. Attempt logged with name, time, table. | Validation approval → Manager notification | Notification: Table 5, ₹960 discount, Cashier: Priya. Manager: Rohan. DENY tap. Log entry created. | DD | "Smart Validations. Your rules. Always enforced." | "No more cashiers giving away your margin." | Zoom to DENY tap. Then zoom to log entry created. | `s3b-pp-manager-deny.mp4` | Dual device: billing screen + manager notification |
| S4 | 52–65s | Central inventory — chain variance | Multi-outlet variance report. Nashik: 8 kg chicken purchased, 3.1 kg variance flagged. Manager notified. | Central Inventory → Variance → Multi-outlet | Nashik outlet. Chicken: purchased 8 kg, variance 2.7 kg 🚩. Manager notification sent. | SR | "Central Inventory. For franchises & chains." | "For chains — central inventory runs variance detection across every outlet. Shrinkage has nowhere to hide." | Zoom to Nashik row. Zoom to 2.7 kg variance flag. | `s4-pp-chain-variance.mp4` | Multi-outlet account with Central Inventory active |
| P | 65–75s | Proof + CTA | Two stat cards. CTA card. | AC + CTA | "₹1 Lakh — theft caught in 2 weeks. Rhino, Mumbai." / "12% less wastage. 18% higher profitability. Ubuntu Café, Bangalore." | AC + CTA | — | "Your profit is there. Stop losing it." | ₹1 Lakh card first — hold 2.5 seconds (longer than usual). | `p-pp-proof-cta.mp4` | Post-production |

### Voiceover Script
```
[0–6s]    "Your sales look fine. Your profit doesn't. Most leakage is invisible — until it's too late."
[6–22s]   "Every void, cancel and discount is logged — with staff name, time, and the exact amount."
[22–38s]  "Recipe-level tracking knows exactly how much stock should be consumed. The moment numbers don't match — it flags it."
[38–52s]  "Discount rules and approval flows — set by you, enforced automatically. No more cashiers giving away your margin."
[52–65s]  "For chains — central inventory runs variance detection across every outlet. Shrinkage has nowhere to hide."
[65–75s]  "Your profit is there. Stop losing it."
```

### Editor Note
> **S1b is the single most powerful moment across all 17 assets.** Slow down. Hold on "Ramesh". Hold on "14 times". Hold on "₹11,200". The ₹1 Lakh caption must land in RED first, then transition to brand green. Do not rush this scene.

### Blockers
- [ ] Audit log: 14 post-payment void entries under "Ramesh" must be pre-created
- [ ] Recipe-level inventory must be active with today's consumption data
- [ ] Multi-outlet account for S4

---

## ASSET 09 — See Everything
**Export filename:** `product-see-everything.mp4`
**CMS key:** `product.see-everything.video`
**Format:** MP4 H.264 1920×1080 | **Duration:** 65 sec | **Audio:** VO + music
**Priority:** 6 | **Source brief:** Section 3, Video 5

### Pre-recording setup
- Account: Multi-outlet (Bandra ₹24,100 + Andheri ₹18,700 = ₹42,800 today)
- Reports: Chicken Biryani 48 orders, ₹43,200 revenue, ₹28,100 profit. Staff: Amit 82 covers ₹46,200. Payment: UPI 64% Cash 28% Card 8%.
- WhatsApp report: configured to send at 11 PM. Pre-trigger for capture.
- P&L: Paneer Tikka ₹580 revenue / ₹180 cost (69%). Lassi ₹80 / ₹62 cost (22.5%).

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO Line | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H | 0–5s | PAIN HOOK | Owner on phone at 9 PM. Two calls back to back. Then WhatsApp "Screenshot bhejo." | B-roll | Owner with phone. Night setting. Weary expression. | BR | None | "Running a restaurant shouldn't mean chasing numbers at night." | None | `h01-se-broll-phonecall.mp4` | B-roll needed |
| S1 | 5–18s | Live owner dashboard | Phone unlocked. Dashboard opens immediately with live data. Bandra + Andheri tiles. Peak hour chart. | Owner Dashboard | Sales ₹42,800. Orders 214. Avg bill ₹200. Peak: 1–2 PM. Bandra ₹24,100. Andheri ₹18,700. | SR | "Live Dashboard. Anywhere. Anytime." | "The owner dashboard shows your entire business — live, from your phone. Sales, orders, peak hours, every outlet." | Zoom to total ₹42,800. Then show multi-outlet tiles. Zoom to peak hour bar. | `s1-se-dashboard.mp4` | Multi-outlet data must be live |
| S2a | 18–26s | Item-wise report | Reports → Item-wise. Chicken Biryani row highlighted. Revenue, profit, margin visible. | Reports → Item-wise | Chicken Biryani: 48 orders, ₹43,200 revenue, ₹28,100 profit, 65% margin. | SR | "Auto Reports. Every day. No assembly." | "Item-wise, payment-mode, staff performance — reports build themselves daily." | Zoom to Chicken Biryani row. Highlight margin 65%. | `s2a-se-item-report.mp4` | None |
| S2b | 26–32s | Payment mode + staff report | Reports → Payment mode: UPI 64% / Cash 28% / Card 8%. Then Staff: Amit 82 covers ₹46,200. | Reports → Payment mode + Staff | UPI 64%, Cash 28%, Card 8%. Amit: 82 covers, ₹46,200. | SR | — | "Drill down or export in one tap." | Swipe/tab between payment report and staff report. | `s2b-se-payment-staff.mp4` | None |
| S3 | 32–46s | WhatsApp report arriving at 11 PM | Phone notification. WhatsApp message from MyGenie: "Today Summary — Total ₹42,800 | Orders 214 | GST ₹2,140 | Top item: Butter Chicken 62 orders." Owner reads on couch, puts phone down. | WhatsApp (phone screen) | Message text as specified. Sent at 11:01 PM. | BR + SR | "WhatsApp Reports. Arrive while you sleep." | "Your closing report on WhatsApp — every night, automatically. No login. No dashboard. Just the number." | Zoom to notification badge. Zoom to message numbers. | `s3-se-whatsapp-report.mp4` | WhatsApp daily report must be enabled + triggered at 11 PM |
| S4 | 46–58s | Recipe P&L — two items, contrast | P&L by item. Paneer Tikka: ₹580 revenue, ₹180 cost, 69% margin ✓. Lassi: ₹80 revenue, ₹62 cost, 22.5% margin ⚠. | Reports → Recipe P&L | Paneer Tikka: 69% margin. Lassi: 22.5% margin ⚠. | SR | "Recipe P&L. Know your real margin." | "Recipe-level P&L tells you which items actually make money. Optimize your menu by the rupee — not by guesswork." | Zoom to contrast: Paneer Tikka (green ✓) vs Lassi (orange ⚠). | `s4-se-recipe-pl.mp4` | Recipe P&L data must be configured |
| P | 58–65s | Proof + CTA | Stat cards + CTA | AC + CTA | "₹25,000/mo saved — Mill Bakery" / "35% less coordination — Antonios" | AC + CTA | — | — | — | `p-se-proof-cta.mp4` | Post-production |

### Voiceover Script
```
[0–5s]    "Running a restaurant shouldn't mean chasing numbers at night."
[5–18s]   "The owner dashboard shows your entire business — live, from your phone. Sales, orders, peak hours, every outlet."
[18–32s]  "Item-wise, payment-mode, staff performance — reports build themselves daily. Drill down or export in one tap."
[32–46s]  "Your closing report on WhatsApp — every night, automatically. No login. No dashboard. Just the number."
[46–58s]  "Recipe-level P&L tells you which items actually make money. Optimize your menu by the rupee — not by guesswork."
```

### Blockers
- [ ] B-roll: owner making calls at night (indoor, evening setting)
- [ ] WhatsApp daily report must fire at 11 PM — pre-trigger for capture session

---

## ASSET 10 — Central Inventory
**Export filename:** `product-central-inventory.mp4`
**CMS key:** `product.central-inventory.video`
**Format:** MP4 H.264 1920×1080 | **Duration:** 80 sec | **Audio:** VO + music
**Priority:** 8 | **Source brief:** Section 3, Video 6

### Pre-recording setup
- Account: Multi-outlet — 4 outlets (Bandra / Andheri / Pune / Nashik)
- Stock: Andheri chicken 1.2 kg (🔴 critical). Andheri onion 2 kg ⚠. Pune oil 1 L ⚠. Others normal.
- Indent requests: all 4 outlets have raised chicken indents (total 42 kg)
- AI forecast: Andheri needs 8 kg chicken by Friday (based on demand pattern)
- Variance: Pune — chicken purchased 20 kg, recipe-expected 14.2 kg, closing 3.1 kg → 2.7 kg variance flagged
- WhatsApp B-roll: 4 WhatsApp messages lined up to show in sequence

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Text Overlay | VO Line | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| H | 0–6s | PAIN HOOK — 47 messages | Phone screen. WhatsApp messages arriving from 4 outlet managers in quick sequence. 47 unread. Owner stares. | B-roll / Phone screen | 4 messages: "Chicken khatam", "Tomato urgent", "No oil", "Maida finish". Badge: 47 unread. | BR + SR | None | "4 outlets. 4 managers. 47 stock messages. Every single day." | None | `h01-ci-broll-whatsapp.mp4` | B-roll of phone with WhatsApp messages |
| S1 | 6–20s | Multi-outlet stock dashboard | Central Inventory open. 4 outlet columns. Andheri chicken 🔴. Andheri onion ⚠. Pune oil ⚠. | Central Inventory → Dashboard | 4 columns as specified. Critical items in red. Warning items in amber. | SR | "Live Stock. Across Every Outlet." | "One dashboard. Every outlet's stock — live. You see what's low, where, before anyone calls you." | Scroll across 4 outlet columns. Zoom to Andheri red 🔴 badge. | `s1-ci-stock-dashboard.mp4` | Multi-outlet Central Inventory must be active |
| S2a | 20–28s | Low-stock alert — Andheri | Andheri critical stock alert notification on owner's phone. Owner taps. Opens transfer screen. | Central Inventory → Alert → Transfer | Alert: "Andheri — Chicken critically low: 1.2 kg". Transfer screen: FROM Pune (9 kg), TO Andheri, QTY 5 kg. | SR | "Inter-Outlet Transfers. 3 taps. Fully tracked." | "Move stock between outlets in 3 taps — tracked, approved, with a full audit trail." | Count the 3 taps with micro "1" "2" "3" overlays. | `s2a-ci-transfer-initiate.mp4` | Alert must be active for Andheri chicken |
| S2b | 28–35s | Pune manager approves transfer | Second device (Pune manager). Notification received. Taps APPROVE. Both outlet stocks update. | Transfer → Manager approval | Pune manager: "Transfer request — 5 kg chicken to Andheri." APPROVE tap. Andheri updates to 6.2 kg. | DD | — | "No phone calls. No confusion." | Zoom to Pune stock updating after approval. | `s2b-ci-transfer-approve.mp4` | Dual device |
| S3 | 35–50s | Central procurement — consolidated PO | 4 outlet indents merged. Central PO screen: 42 kg chicken. Agarwal Chicken Suppliers. Rate ₹280/kg vs individual ₹310–320/kg. Savings ₹1,260. | Central Inventory → Procurement → PO | PO: 42 kg @ ₹280/kg. Total ₹11,760. vs individual: ₹13,020. Savings: ₹1,260 shown. | SR | "Central Procurement. One PO. Better Rates." | "Outlets raise indents. Central office raises one PO. Buy in bulk, negotiate better rates, distribute precisely." | Zoom to savings ₹1,260. Highlight rate difference ₹280 vs ₹310. | `s3-ci-central-po.mp4` | Procurement module must be active with supplier rates |
| S4 | 50–63s | AI auto-reorder forecast | AI Forecast panel. "Andheri needs 8 kg chicken by Friday." Current stock 1.2 kg. Suggested reorder 8 kg. One tap → PO auto-raised. | Central Inventory → AI Reorder | Forecast: Andheri, chicken, by Friday, 8 kg. One-tap PO button. | SR | "AI Reorder. Never stock out again." | "AI forecasts demand per outlet — based on historical sales. It tells you what to reorder, when, before you run out." | Zoom to forecast recommendation. Zoom to one-tap PO button. | `s4-ci-ai-reorder.mp4` | AI reorder module must be available |
| S5 | 63–73s | Variance detection — Pune | Variance report: Pune outlet. Chicken purchased 20 kg. Recipe-expected 14.2 kg. Closing 3.1 kg. Variance 2.7 kg 🚩. Manager notified. | Central Inventory → Variance report | Pune: purchased 20 kg, expected 14.2 kg, closing 3.1 kg, variance 2.7 kg 🚩 | SR | "Variance Detection. Outlet-wise. Automatic." | "Every outlet's consumption is compared to recipe-expected usage. Any mismatch is flagged — automatically. Shrinkage has nowhere to hide." | Zoom to variance 2.7 kg in red. Zoom to manager notification trigger. | `s5-ci-variance.mp4` | Recipe-level tracking + variance report must be active |
| P | 73–80s | Proof + CTA | Stat cards + CTA | AC + CTA | "40% lower fixed cost — Love Bites" / "₹25,000/mo leaner stock ops — Mill Bakery" | AC + CTA | — | — | — | `p-ci-proof-cta.mp4` | Post-production |

### Voiceover Script
```
[0–6s]    "4 outlets. 4 managers. 47 stock messages. Every single day."
[6–20s]   "One dashboard. Every outlet's stock — live. You see what's low, where, before anyone calls you."
[20–35s]  "Move stock between outlets in 3 taps — tracked, approved, with a full audit trail. No phone calls. No confusion."
[35–50s]  "Outlets raise indents. Central office raises one PO. Buy in bulk, negotiate better rates, distribute precisely."
[50–63s]  "AI forecasts demand per outlet — based on historical sales. It tells you what to reorder, when, before you run out."
[63–73s]  "Every outlet's consumption is compared to recipe-expected usage. Any mismatch is flagged — automatically. Shrinkage has nowhere to hide."
```

### Blockers
- [ ] Multi-outlet account with Central Inventory active
- [ ] AI reorder module must be available on test account
- [ ] Procurement module with supplier rates configured

---
---
# PART 3 — AI FEATURE VIDEOS
---

---
## ASSET 11 — AI Menu Import
**Export filename:** `ai-menu-import.mp4`
**CMS key:** `ai.features` index 0 → `videoSrc`
**Format:** MP4 H.264 1920×1080 | **Duration:** 35 sec | **Audio:** Captions only
**Priority:** 13 | **Source brief:** Section 4, AI Video 1

### Pre-recording setup
- Prepare a realistic PDF menu: "Terraria Café" — 186 items, 12 categories, with modifiers and prices
- Test account: empty menu (no items pre-loaded — starting from scratch)
- AI import: ensure AI menu import module is active and connected

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0–4s | PAIN — manual entry | Someone slowly typing menu items one by one. Counter at bottom: "Item 12 of 200." | POS → Menu setup → Manual item entry | Empty menu. Staff typing "Paneer Tikka, ₹240, Starter..." Slow. | SR | "Setting up a menu by hand takes days." | Slow zoom to item count "12 of 200". Painful pace. | `s1-mi-manual-typing.mp4` | None — show truly slow pace |
| S2 | 4–14s | Upload + AI extraction | Click IMPORT MENU. File browser opens. PDF selected. Upload. Progress bar: "Reading menu... Extracting 186 items..." Category structure builds on screen. | AI Menu Import → Upload flow | Progress: "Extracting 186 items... | 12 categories detected | Modifiers found: 24" | SR | "Upload your existing menu. Any format." | Zoom to progress bar. Zoom to "186 items" count building up. | `s2-mi-upload-extract.mp4` | AI menu import module must be active |
| S3 | 14–24s | Review structured menu | Complete menu appears: Starters 18 items, Mains 42 items, Beverages 24 items, Desserts 12 items. Staff taps one item to edit price. Taps GO LIVE. | AI Menu Import → Review screen | Full menu categories listed. One item edit. GO LIVE button. | SR | "AI reads it. You review it. Go live in 30 minutes." | Zoom to categories appearing. Zoom to GO LIVE button. | `s3-mi-review-golive.mp4` | None |
| S4 | 24–35s | Outcome card + CTA | Animated outcome card: "~30 min. Menu file to live POS." Then CTA. | AC + CTA | "~30 min. Menu file to live POS." / "Used by 500+ outlets on day one." | AC + CTA | "~30 min. Menu file to live POS." / CTA: "Book a demo → mygenie.in" | Large font. Hold 4 seconds. | `s4-mi-outcome-cta.mp4` | Post-production |

### Edit Timeline
```
0–4s   → S1 (SR, slow pace)
4–14s  → S2 (SR, speed up 1.3× for extraction animation)
14–24s → S3 (SR)
24–35s → S4 (AC + CTA)
```

### Blockers
- [ ] AI Menu Import module must be available on test account
- [ ] 186-item PDF menu must be prepared before recording

---

## ASSET 12 — AI Customer Insights
**Export filename:** `ai-customer-insights.mp4`
**CMS key:** `ai.features` index 1 → `videoSrc`
**Format:** MP4 H.264 1920×1080 | **Duration:** 40 sec | **Audio:** Captions only
**Priority:** 12 | **Source brief:** Section 4, AI Video 2

### Pre-recording setup
- CRM must have enough data for AI to generate segments
- Loyal regulars: 34. At-risk: 22. Top spenders: 11. Birthdays this month: 6.
- WhatsApp campaign template: "We miss you! 20% off this weekend — just for you."
- Campaign send: 22 messages queued

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0–4s | PAIN — anonymous data | Total bills for today: 94. Customer names: 0. No follow-up possible. | POS Dashboard / CRM (empty) | Today: 94 orders. CRM entries: 0. | SR | "You served 94 people today. How many will come back?" | Zoom to "0 CRM profiles" count. | `s1-ci2-pain.mp4` | Show CRM with no data / minimal data for pain contrast |
| S2 | 4–18s | AI insights dashboard | AI Insights panel: 4 segments with numbers and icons. All auto-generated. | CRM → AI Insights | Loyal: 34 🟢. At-risk: 22 🔴. Top spenders: 11 ⭐. Birthdays: 6 🎂. | SR | "AI reads every bill. Segments customers automatically. No analyst needed." | Zoom to each segment tile in sequence. Highlight numbers. | `s2-ci2-segments.mp4` | CRM must have 50+ customers with billing history |
| S3 | 18–30s | One-tap campaign to at-risk | Tap "At-risk: 22". Template selected: "We miss you! 20% off this weekend." Tap SEND. Sending animation: 22/22 sent. | CRM → Campaign → Send | At-risk segment: 22 customers. Template applied. Send: 22 messages in 8 seconds. | SR | "One tap → 22 personalised messages sent." | Zoom to SEND tap. Zoom to "22/22 sent" count. | `s3-ci2-send-campaign.mp4` | Campaign / WhatsApp send must be enabled |
| S4 | 30–40s | Outcome + CTA | Outcome card + CTA | AC + CTA | "30% better repeat rate. With targeted win-backs." | AC + CTA | "30% better repeat rate. With targeted win-backs." / CTA | Large. Hold 4 seconds. | `s4-ci2-outcome-cta.mp4` | Post-production |

### Blockers
- [ ] CRM must have 50+ customers with visit history for AI to generate segments
- [ ] Campaign send / WhatsApp must be enabled

---

## ASSET 13 — Smart Cross-sell & Upsell
**Export filename:** `ai-smart-upsell.mp4`
**CMS key:** `ai.features` index 2 → `videoSrc`
**Format:** MP4 H.264 1920×1080 | **Duration:** 35 sec | **Audio:** Captions only
**Priority:** 11 | **Source brief:** Section 4, AI Video 3

### Pre-recording setup
- Billing account with AI upsell enabled
- Order: Chicken Biryani ×2, Raita ×1 = ₹640
- AI should suggest: Gulab Jamun ₹80 (frequently ordered together)
- Second order: Espresso ×2 = ₹240 → AI suggests Croissant ₹120
- Comparison card: ₹640 vs ₹760, +18%, ₹3.6L/month calculation

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0–3s | PAIN | POS billing. Staff adds items. No upsell suggestion. Opportunity missed. | POS Billing (without AI upsell) | Bill: Biryani ×2, Raita ×1 = ₹640. No suggestion visible. | SR | "Staff forget to upsell. Easy revenue stays on every table." | Zoom to total ₹640. Pause as if something is missing. | `s1-su-no-upsell.mp4` | Show billing WITHOUT upsell first |
| S2a | 3–11s | AI upsell prompt appears | Same order. AI prompt appears below: "💡 Frequently ordered together: Gulab Jamun (₹80)". Staff taps ADD. Bill updates to ₹720. | POS Billing → AI upsell prompt | Bill ₹640. Prompt: Gulab Jamun ₹80. After ADD: ₹720. | SR | "Right add-on. Right moment. Based on what sells together." | Zoom to AI prompt appearing. Highlight ₹80 add-on. Zoom to bill update ₹720. | `s2a-su-upsell-prompt1.mp4` | AI upsell must be active |
| S2b | 11–18s | Second upsell — Espresso order | New order: Espresso ×2. AI suggests Croissant ₹120. Staff adds. | POS Billing → AI upsell | Espresso ×2 ₹240. Prompt: Croissant ₹120. Added. | SR | — | Zoom to second prompt. Show pattern: AI always suggests. | `s2b-su-upsell-prompt2.mp4` | None |
| S3 | 18–28s | Math — the compound effect | Animated comparison card: Without AI ₹640 / With AI ₹760 / +18% / 100 covers/day = +₹12,000/day / +₹3.6L/month | AC | "Without AI: ₹640 | With AI: ₹760 | +18%" → "+₹12,000/day | +₹3.6L/month" | AC | "+18% average bill. Compounding daily." | Numbers build up one by one. Final hold on ₹3.6L/month in brand green. | `s3-su-math-card.mp4` | Post-production animated graphic |
| S4 | 28–35s | CTA | CTA card | CTA | — | CTA | "Lift every bill. Without training more staff." / "Book a demo → mygenie.in" | — | `s4-su-cta.mp4` | Post-production |

### Blockers
- [ ] AI upsell module must be active with trained suggestion data (Gulab Jamun + Biryani pattern)
- [ ] Comparison card (S3) is a post-production animated graphic

---

## ASSET 14 — AI Report Audit
**Export filename:** `ai-report-audit.mp4`
**CMS key:** `ai.features` index 3 → `videoSrc`
**Format:** MP4 H.264 1920×1080 | **Duration:** 40 sec | **Audio:** Captions only
**Priority:** 10 | **Source brief:** Section 4, AI Video 4

### Pre-recording setup
- Audit data: Staff Ramesh — 6 post-payment cancellations on Tuesday = ₹4,200
- Stock variance: Pune outlet — chicken 2.7 kg above recipe expectation
- Daily report: pre-generated and ready for AI audit

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0–4s | PAIN — trust gap | Daily report on screen. Numbers but no way to verify. | Reports → Daily summary | P&L report. Sales, voids, discounts. No audit indicators. | SR | "Reports are only useful if you can trust them." | Zoom to void/discount columns — implication of risk. | `s1-ra-report-unaudited.mp4` | None |
| S2 | 4–20s | AI audit runs — flags appear | AI Audit badge activates. 4 checks run with tick/flag animations. 2 flags raised. | AI Audit → Audit running | Check 1: Void/sales ✅. Check 2: Discount/policy ✅. Check 3: Staff pattern ⚠️ ANOMALY. Check 4: Stock variance ⚠️ FLAG. | SR | "AI cross-references every number — against recipes, policies, and history." | Zoom to each check. Slow zoom to ⚠️ flags. | `s2-ra-audit-flags.mp4` | AI Report Audit module must be active |
| S3 | 20–33s | Flag detail — Ramesh pattern | Drill into Flag 1. Pattern: Ramesh, 6 post-payment cancellations, Tuesday, ₹4,200. Timeline chart shows repeating pattern. | AI Audit → Flag detail | Staff: Ramesh. Date: Tuesday. Cancellations: 6. Amount: ₹4,200. Pattern chart visible. | SR | "A second set of eyes on every number. Automatically." | Slow zoom to "Ramesh". Slow zoom to ₹4,200. Hold both. | `s3-ra-flag-ramesh.mp4` | Ramesh's 6 cancellations must be pre-created in test data |
| S4 | 33–40s | CTA | Outcome + CTA card | AC + CTA | "100% of reports audited. Every day." | AC + CTA | "100% of reports audited. Every day." / CTA | Hold 4 sec on "100%". | `s4-ra-cta.mp4` | Post-production |

### Blockers
- [ ] AI Report Audit module must be active
- [ ] Test data: 6 post-payment cancellations under "Ramesh" on Tuesday

---

## ASSET 15 — Operational Recommendations
**Export filename:** `ai-ops-recommendations.mp4`
**CMS key:** `ai.features` index 4 → `videoSrc`
**Format:** MP4 H.264 1920×1080 | **Duration:** 35 sec | **Audio:** Captions only
**Priority:** 14 | **Source brief:** Section 4, AI Video 5

### Pre-recording setup
- AI Recommendations panel: 3 items pre-populated
  - Priority 1: Chicken Biryani food cost up 6%. Savings potential ₹1,800/week.
  - Priority 2: Tuesday lunch 18% fewer covers.
  - Priority 3: Raita 71% margin + 48% attachment rate.
- Supplier contact: pre-saved in contacts ("Agarwal Chicken Suppliers")

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0–4s | PAIN — data without direction | Reports page full of numbers. Owner scrolling. No clear next action. | Reports → Dashboard | P&L, item sales, variance — all data. No recommendation layer. | SR | "Your reports tell you what happened. AI tells you what to DO about it." | Zoom to data overwhelm. | `s1-or-data-no-action.mp4` | None |
| S2 | 4–22s | AI recommendations — 3 items prioritised | AI Recommendations panel opens. 3 items with priority colours (red/yellow/green). Each with rupee impact. | AI Recommendations | P1 🔴: Biryani cost +6%, savings ₹1,800/week. P2 🟡: Tuesday lunch 18% lower. P3 🟢: Raita 71% margin, add to upsell. | SR | "Ranked by impact. Specific. Actionable." | Zoom to each item in sequence. Highlight ₹1,800/week saving in green. | `s2-or-recommendations.mp4` | AI Ops Recommendations module must be active |
| S3 | 22–30s | One-tap action on Priority 1 | Tap Priority 1. Supplier screen opens. Owner sends message "Let's discuss pricing." 8 seconds. | AI Recommendations → Supplier contact | Supplier: Agarwal Chicken. Message sent. Time: 8 seconds. | SR | "Act on the highest-impact item. Every morning." | Zoom to 8-second action. Time counter overlay: "8 sec" in green. | `s3-or-action.mp4` | Supplier contact must be pre-saved |
| S4 | 30–35s | CTA | Outcome + CTA | AC + CTA | "12% less wastage. Acting on what AI flags." | AC + CTA | Caption + CTA | — | `s4-or-cta.mp4` | Post-production |

### Blockers
- [ ] AI Ops Recommendations module must be available and populated

---

## ASSET 16 — Smart Validations
**Export filename:** `ai-smart-validations.mp4`
**CMS key:** `ai.features` index 5 → `videoSrc`
**Format:** MP4 H.264 1920×1080 | **Duration:** 40 sec | **Audio:** Captions only
**Priority:** 5 | **Source brief:** Section 4, AI Video 6

### Pre-recording setup
- Validation rules configured: Post-payment edit → approval. Discount >15% → OTP. Void after 5 min → flagged.
- Test scenario: Cashier (Priya) attempts to void Table 9 bill after payment
- Manager (Rohan) on separate device — receives notification
- Log entry: staff name, time, table, action created after DENY

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0–5s | HOOK — the real story (text only, no app) | Slow text reveal on dark background: "A cashier was cancelling bills AFTER customers paid." PAUSE. "For months. ₹1 Lakh gone." PAUSE. "Until MyGenie caught it in 2 weeks." | AC (text animation only) | Text on dark background. Large font. Slow reveal. | AC | Text IS the caption. 3 lines, 3 beats. | Each line fades in separately. 1 second pause between lines. ₹1 Lakh in RED. | `s1-sv-hook-text.mp4` | Post-production — text animation only |
| S2 | 5–20s | Validation rules — the protection layer | Settings → Validation Rules: 4 rules listed. Each with icon. | Smart Validations → Rules setup | Rule 1: Post-payment edit → approval. Rule 2: Discount >15% → OTP. Rule 3: Void after 5 min → flag. Rule 4: Back-to-back voids same staff → alert. | SR | "Your rules. Enforced at every transaction. No exceptions." | Zoom to each rule in sequence. Highlight trigger → consequence structure. | `s2-sv-rules.mp4` | Validation rules must be configured in test account |
| S3a | 20–27s | Rule fires — cashier blocked | Cashier attempts to void Table 9 (paid bill). System intercepts: "Post-payment edit. Approval required." | POS → Void attempt → System intercept | Table 9. Bill ₹840. Void attempted. System: "Post-payment edit. Approval required." | SR | — | Zoom to system intercept message. Slow. | `s3a-sv-intercept.mp4` | None |
| S3b | 27–33s | Manager denies + log created | Manager device: notification received. Taps DENY. Log entry visible: Staff Priya, Table 9, ₹840, DENIED. | Manager device → Notification → Deny → Log | Notification: Priya, Table 9, ₹840. Manager: Rohan. DENY. Log: full entry. | DD | "It doesn't just block it. It logs it. Forever." | Zoom to DENY tap. Then zoom to log entry. Highlight "Forever" in log. | `s3b-sv-deny-log.mp4` | Dual device |
| S4 | 33–40s | Closing impact + CTA | Large text: "₹1 Lakh. Caught. 2 weeks. Real customer." Then question. Then CTA. | AC + CTA | "₹1 Lakh. Caught. 2 weeks. Real customer." / "What's leaking out of your restaurant today?" | AC + CTA | Impact text large, red first then green. Question below. CTA last. | ₹1 Lakh in large red font first. Then fade to brand green. | `s4-sv-impact-cta.mp4` | Post-production |

### Editor Note
> S1 and S4 are pure text animation. Treat them like a true-crime opener and closer. No music swell — silence or single low note under S1. Impact hit on S4 when ₹1 Lakh appears.

### Blockers
- [ ] Validation rules must be configured in test account
- [ ] Dual device for S3b

---

## ASSET 17 — AI CRM Segmentation
**Export filename:** `ai-crm-segmentation.mp4`
**CMS key:** `ai.features` index 6 → `videoSrc`
**Format:** MP4 H.264 1920×1080 | **Duration:** 40 sec | **Audio:** Captions only
**Priority:** 15 | **Source brief:** Section 4, AI Video 7

### Pre-recording setup
- CRM segments auto-generated: Birthdays 9, VIP 14, Lapsed 31, First visit 22, Tuesday regulars 18
- Campaign results: pre-prepared comparison data for animated card
  - Blast 200 → 4 responses (2%)
  - Birthday 9 → 7 responses (78%)
  - Lapsed 31 → 11 responses (35%)

### Shotboard

| # | Time | Purpose | Frame Required | Module | Demo Data on Screen | Type | Caption | Zoom/Highlight | Raw File Name | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 0–4s | PAIN — blast message failure | Campaign history: 200 sent, 4 opened, 4 responded. 2% rate. | CRM → Campaign history | Campaign: "Weekend Special". Sent: 200. Opened: 18. Responded: 4. Rate: 2%. | SR | "Sent 200 offers. Got 4 responses. That's 2%. And you annoyed the other 196." | Zoom to response count "4 of 200". Then to 2% rate. | `s1-cs-blast-fail.mp4` | Campaign history with 200-person blast data needed |
| S2 | 4–20s | Auto-segments — 5 precise groups | CRM Segments page: 5 tiles, all auto-created. Each with count and suggested action. | CRM → AI Segments | 🎂 Birthdays: 9. 👑 VIP: 14. 😴 Lapsed: 31. 🆕 First visit: 22. 📅 Tuesday regulars: 18. | SR | "AI builds the segments. From your own billing data. Automatically." | Zoom to each tile in sequence. Emphasise "0 setup" or "Auto" label. | `s2-cs-segments.mp4` | CRM must have 80+ customers with history for AI segmentation |
| S3 | 20–32s | Comparison — targeted vs blast | Animated comparison table: 3 rows. Blast vs Birthday vs Lapsed, with sent/responded/rate columns. | AC | Blast: 200/4/2%. Birthday: 9/7/78%. Lapsed: 31/11/35%. | AC | "Right message. Right person. Right time." | Build table row by row. Last row final, hold. Rate column highlights in green for targeted. | `s3-cs-comparison.mp4` | Post-production animated table |
| S4 | 32–40s | Outcome + CTA | Outcome card + CTA | AC + CTA | "2× campaign conversion. vs blast messaging." / CTA | AC + CTA | "2× campaign conversion." large. CTA below. | — | `s4-cs-cta.mp4` | Post-production |

### Blockers
- [ ] CRM must have 80+ customers with billing history for auto-segmentation
- [ ] Comparison card (S3) is post-production

---
---
# MASTER REFERENCE TABLES
---

## Screenshot Master List (all 17 assets)

| SS # | Asset | Scene | What to Capture | Account Needed | Pre-setup Required |
|---|---|---|---|---|---|
| SS-01 | Starter GIF | S1 | POS home screen, clean grid | Terraria Café (single) | None |
| SS-02 | Starter GIF | S4 | Day summary: ₹8,400 / 47 orders | Terraria Café | Set ₹8,400 / 47 in demo |
| SS-03 | Pro GIF | S4 | Owner dashboard: repeat customers 64 (+18%) | Terraria Café | Set repeat customer data |
| SS-04 | Custom GIF | S4 | Central stock: 4 outlets + consolidated P&L | Multi-outlet | Set P&L data |
| SS-05 | Protect Profit | H | P&L: Expected ₹1,80,000 vs Actual ₹1,10,000 | Rhino (Mumbai) | Set P&L data |
| SS-06 | See Everything | S2 | Item report: Chicken Biryani row | Multi-outlet | Set report data |

## Raw Clip Master List (all 17 assets)

| Clip # | Asset | Scene | Type | Duration | Filename |
|---|---|---|---|---|---|
| R-01 | Starter GIF | S2 | SR | ~3s | s02-starter-billing-4taps.mp4 |
| R-02 | Starter GIF | S3 | SR | ~3s | s03-starter-gst-invoice.mp4 |
| R-03 | Growth GIF | S1 | DD | ~3s | s01-growth-split-idle.mp4 |
| R-04 | Growth GIF | S2 | SR | ~3s | s02-growth-captain-order.mp4 |
| R-05 | Growth GIF | S3 | SR | ~3s | s03-growth-kds-receive.mp4 |
| R-06 | Growth GIF | S4 | SR | ~3s | s04-growth-status-confirm.mp4 |
| R-07 | Pro GIF | S1 | SR | ~3s | s01-pro-crm-profile.mp4 |
| R-08 | Pro GIF | S2 | SR | ~3s | s02-pro-loyalty-applied.mp4 |
| R-09 | Pro GIF | S3 | SR | ~4s | s03-pro-whatsapp-sent.mp4 |
| R-10 | Pro GIF | S5 | SR | ~3s | s05-pro-inventory-alert.mp4 |
| R-11 | Custom GIF | S1 | SR | ~3s | s01-custom-dashboard-4outlets.mp4 |
| R-12 | Custom GIF | S2 | SR | ~3s | s02-custom-andheri-problem.mp4 |
| R-13 | Custom GIF | S3 | SR | ~3s | s03-custom-transfer.mp4 |
| R-14 | Custom GIF | S5 | SR | ~2s | s05-custom-whatsapp-report.mp4 |
| R-15 | Sell & Serve | S1a | SR | ~8s | s1a-ss-captain-order.mp4 |
| R-16 | Sell & Serve | S1b | DD | ~8s | s1b-ss-dual-waiter.mp4 |
| R-17 | Sell & Serve | S2 | SR | ~15s | s2-ss-kds-accept.mp4 |
| R-18 | Sell & Serve | S3 | BR+SR | ~15s | s3-ss-scan-order.mp4 |
| R-19 | Sell & Serve | S4a | SR | ~8s | s4a-ss-pos-billing.mp4 |
| R-20 | Sell & Serve | S4b | SR | ~9s | s4b-ss-offline-sync.mp4 |
| R-21 | Run Property | S1a | SR | ~10s | s1a-rp-room-folio.mp4 |
| R-22 | Run Property | S1b | SR | ~9s | s1b-rp-folio-scroll.mp4 |
| R-23 | Run Property | S2a | SR | ~9s | s2a-rp-foodcourt-payment.mp4 |
| R-24 | Run Property | S2b | SR | ~9s | s2b-rp-foodcourt-settle.mp4 |
| R-25 | Run Property | S3 | SR | ~15s | s3-rp-offline.mp4 |
| R-26 | Run Property | S4 | SR | ~12s | s4-rp-checkout-bill.mp4 |
| R-27 | Bring Customers | S1 | SR | ~14s | s1-cb-crm-profile.mp4 |
| R-28 | Bring Customers | S2 | SR | ~15s | s2-cb-loyalty-applied.mp4 |
| R-29 | Bring Customers | S3 | SR | ~16s | s3-cb-whatsapp-reply.mp4 |
| R-30 | Bring Customers | S4a | SR | ~9s | s4a-cb-segments.mp4 |
| R-31 | Bring Customers | S4b | SR+AC | ~8s | s4b-cb-campaign-compare.mp4 |
| R-32 | Bring Customers | S5 | SR | ~12s | s5-cb-wallet-topup.mp4 |
| R-33 | Protect Profit | S1a | SR | ~8s | s1a-pp-audit-filter.mp4 |
| R-34 | Protect Profit | S1b | SR | ~10s | s1b-pp-audit-ramesh.mp4 |
| R-35 | Protect Profit | S2 | SR | ~17s | s2-pp-recipe-variance.mp4 |
| R-36 | Protect Profit | S3a | SR | ~9s | s3a-pp-discount-blocked.mp4 |
| R-37 | Protect Profit | S3b | DD | ~7s | s3b-pp-manager-deny.mp4 |
| R-38 | Protect Profit | S4 | SR | ~14s | s4-pp-chain-variance.mp4 |
| R-39 | See Everything | S1 | SR | ~14s | s1-se-dashboard.mp4 |
| R-40 | See Everything | S2a | SR | ~9s | s2a-se-item-report.mp4 |
| R-41 | See Everything | S2b | SR | ~7s | s2b-se-payment-staff.mp4 |
| R-42 | See Everything | S3 | SR | ~15s | s3-se-whatsapp-report.mp4 |
| R-43 | See Everything | S4 | SR | ~13s | s4-se-recipe-pl.mp4 |
| R-44 | Central Inventory | S1 | SR | ~15s | s1-ci-stock-dashboard.mp4 |
| R-45 | Central Inventory | S2a | SR | ~9s | s2a-ci-transfer-initiate.mp4 |
| R-46 | Central Inventory | S2b | DD | ~8s | s2b-ci-transfer-approve.mp4 |
| R-47 | Central Inventory | S3 | SR | ~16s | s3-ci-central-po.mp4 |
| R-48 | Central Inventory | S4 | SR | ~14s | s4-ci-ai-reorder.mp4 |
| R-49 | Central Inventory | S5 | SR | ~11s | s5-ci-variance.mp4 |
| R-50 | AI Menu Import | S1 | SR | ~4s | s1-mi-manual-typing.mp4 |
| R-51 | AI Menu Import | S2 | SR | ~10s | s2-mi-upload-extract.mp4 |
| R-52 | AI Menu Import | S3 | SR | ~10s | s3-mi-review-golive.mp4 |
| R-53 | AI Customer Insights | S1 | SR | ~4s | s1-ci2-pain.mp4 |
| R-54 | AI Customer Insights | S2 | SR | ~14s | s2-ci2-segments.mp4 |
| R-55 | AI Customer Insights | S3 | SR | ~12s | s3-ci2-send-campaign.mp4 |
| R-56 | Smart Upsell | S1 | SR | ~3s | s1-su-no-upsell.mp4 |
| R-57 | Smart Upsell | S2a | SR | ~8s | s2a-su-upsell-prompt1.mp4 |
| R-58 | Smart Upsell | S2b | SR | ~7s | s2b-su-upsell-prompt2.mp4 |
| R-59 | AI Report Audit | S1 | SR | ~4s | s1-ra-report-unaudited.mp4 |
| R-60 | AI Report Audit | S2 | SR | ~16s | s2-ra-audit-flags.mp4 |
| R-61 | AI Report Audit | S3 | SR | ~13s | s3-ra-flag-ramesh.mp4 |
| R-62 | Ops Recommendations | S1 | SR | ~4s | s1-or-data-no-action.mp4 |
| R-63 | Ops Recommendations | S2 | SR | ~18s | s2-or-recommendations.mp4 |
| R-64 | Ops Recommendations | S3 | SR | ~9s | s3-or-action.mp4 |
| R-65 | Smart Validations | S2 | SR | ~15s | s2-sv-rules.mp4 |
| R-66 | Smart Validations | S3a | SR | ~7s | s3a-sv-intercept.mp4 |
| R-67 | Smart Validations | S3b | DD | ~7s | s3b-sv-deny-log.mp4 |
| R-68 | CRM Segmentation | S1 | SR | ~4s | s1-cs-blast-fail.mp4 |
| R-69 | CRM Segmentation | S2 | SR | ~16s | s2-cs-segments.mp4 |

## B-Roll Master List

| BR # | Shot | Used In | Environment | Notes |
|---|---|---|---|---|
| BR-01 | Busy restaurant rush hour. Waiter writing paper chit. Kitchen shouting. | Sell & Serve — hook | Real restaurant, lunch/dinner rush | Record 30-sec raw clip, editor cuts to 5s |
| BR-02 | Hotel front desk. Guest at checkout. Staff with 3 devices. | Run Property — hook | Hotel lobby or front desk | Guest actor needed |
| BR-03 | Bill printing. Customer takes receipt. Walks out. No name captured. | Bring Customers Back — hook | Any outlet | Close-up of blank thermal receipt |
| BR-04 | Owner at desk. P&L screen. Expected vs Actual. Leans back. | Protect Profit — hook | Office or home desk environment | Owner actor needed |
| BR-05 | Owner at 9 PM on the phone. Makes 2 calls. Gets WhatsApp. | See Everything — hook | Home or office. Night setting. | Owner actor needed |
| BR-06 | Phone screen. 4 WhatsApp messages arriving from 4 managers. | Central Inventory — hook | Phone close-up. Light background. | Pre-load 4 WhatsApp messages to send in sequence |
| BR-07 | Customer at restaurant table scanning QR code with phone | Sell & Serve — S3 | Restaurant table with QR card | Show phone browser opening (no app) |
| BR-08 | Chef reading KDS screen mounted on kitchen wall | Sell & Serve — S2 | Kitchen environment | KDS must be live showing order |

## Consolidated Blocker / Missing Input List

| Priority | Asset | Blocker | Who Must Resolve |
|---|---|---|---|
| 🔴 P0 | All assets | Demo account must be fully set up with all data before recording session begins | MyGenie team |
| 🔴 P0 | Protect Profit | 14 post-payment void entries under "Ramesh" must be pre-created | MyGenie team |
| 🔴 P0 | Growth GIF / Sell & Serve / Protect Profit / Central Inventory | Dual-device recording rig needed | Production team |
| 🔴 P0 | All B-roll items | Real restaurant / hotel / office B-roll must be scheduled and shot separately | Production team |
| 🔴 P0 | Pro GIF / Bring Customers Back | WhatsApp automation must be live on test account (real message delivery) | MyGenie team |
| 🟡 P1 | AI Menu Import | 186-item PDF menu must be prepared before recording | MyGenie team |
| 🟡 P1 | AI Customer Insights / CRM Segmentation | CRM must have 80+ customers with visit history | MyGenie team |
| 🟡 P1 | Smart Upsell | AI upsell trained on Gulab Jamun + Biryani pairing | MyGenie team |
| 🟡 P1 | Central Inventory | AI reorder + Procurement modules must be available on test account | MyGenie team |
| 🟢 P2 | All product videos | Screen mirror setup (phone → laptop clean recording) must be tested before shoot day | Production team |
| 🟢 P2 | All AI videos | Post-production animated cards (comparison tables, outcome cards, text reveals) | Editor |

---

## Final Delivery Checklist

| # | Asset | Export File | CMS Key | Status |
|---|---|---|---|---|
| 1 | Starter GIF | `plan-starter-demo.gif` | `plan.starter.demo_gif` | ⬜ Not started |
| 2 | Growth GIF | `plan-growth-demo.gif` | `plan.growth.demo_gif` | ⬜ Not started |
| 3 | Pro GIF | `plan-pro-demo.gif` | `plan.pro.demo_gif` | ⬜ Not started |
| 4 | Custom GIF | `plan-custom-demo.gif` | `plan.custom.demo_gif` | ⬜ Not started |
| 5 | Sell & Serve | `product-sell-serve.mp4` | `product.sell-serve.video` | ⬜ Not started |
| 6 | Run Property | `product-run-property.mp4` | `product.run-property.video` | ⬜ Not started |
| 7 | Bring Customers Back | `product-customers.mp4` | `product.customers.video` | ⬜ Not started |
| 8 | Protect Profit | `product-protect-profit.mp4` | `product.protect-profit.video` | ⬜ Not started |
| 9 | See Everything | `product-see-everything.mp4` | `product.see-everything.video` | ⬜ Not started |
| 10 | Central Inventory | `product-central-inventory.mp4` | `product.central-inventory.video` | ⬜ Not started |
| 11 | AI Menu Import | `ai-menu-import.mp4` | `ai.features[0].videoSrc` | ⬜ Not started |
| 12 | AI Customer Insights | `ai-customer-insights.mp4` | `ai.features[1].videoSrc` | ⬜ Not started |
| 13 | AI Smart Upsell | `ai-smart-upsell.mp4` | `ai.features[2].videoSrc` | ⬜ Not started |
| 14 | AI Report Audit | `ai-report-audit.mp4` | `ai.features[3].videoSrc` | ⬜ Not started |
| 15 | AI Ops Recommendations | `ai-ops-recommendations.mp4` | `ai.features[4].videoSrc` | ⬜ Not started |
| 16 | AI Smart Validations | `ai-smart-validations.mp4` | `ai.features[5].videoSrc` | ⬜ Not started |
| 17 | AI CRM Segmentation | `ai-crm-segmentation.mp4` | `ai.features[6].videoSrc` | ⬜ Not started |

---

*Source brief: `/app/CREATIVE_BRIEF_VIDEO.md`*
*Pre-scripts: `/app/DEMO_VIDEO_PRESCRIPTS.md`*
*Shotboard version: 1.0 — June 2026*
*Update Status column above as each asset is completed.*
