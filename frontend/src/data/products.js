// Product / module bucket pages — every feature framed as a business outcome.
// videoUrl is null for now — drop in your feature product video URL to auto-embed.

export const PRODUCT_PAGES = {
  "sell-serve": {
    title: "Sell & Serve Faster", icon: "ShoppingBag", image: "/brand/feature1.png", videoUrl: null,
    eyebrow: "Sell & Serve",
    h1: "Bill in seconds. Serve more covers. Lose zero orders.",
    sub: "From the counter to the captain's tab to the kitchen screen, MyGenie keeps service fast and flawless at every rush.",
    modules: [
      { icon: "ReceiptText", name: "POS / Billing", outcome: "Bill in seconds, even at peak rush.", caps: ["Lightning-fast billing on any device", "Split, merge & hold bills", "GST / VAT-ready invoices"] },
      { icon: "Smartphone", name: "Captain / Waiter App", outcome: "Take orders tableside — multiple waiters, one table, no clashes.", caps: ["Real-time order sync", "Works on any phone", "Modifiers & special instructions"] },
      { icon: "Flame", name: "KOT / KDS", outcome: "Orders hit the kitchen screen instantly — no lost chits.", caps: ["Live kitchen display", "Station-wise routing", "Prep-time tracking"] },
      { icon: "QrCode", name: "Scan & Order", outcome: "Guests scan, order and pay from their phone.", caps: ["No app needed", "Contactless payments", "Fewer staff at peak"] },
      { icon: "Zap", name: "QSR Prepaid Ordering", outcome: "Clear queues with fast prepaid token flow.", caps: ["Token & coupon flow", "Fast counter checkout", "Peak-hour throughput"] },
      { icon: "Bike", name: "Takeaway & Delivery", outcome: "Direct delivery & takeaway — zero aggregator commission.", caps: ["Your own ordering link", "Aggregator sync", "Dispatch tracking"] },
    ],
    metric: { value: "22%", label: "more revenue per shift at peak" },
    proof: [
      { metric: "22%", headline: "more revenue per shift", quote: "KDS and scan-based ordering cut prep time 30%, food waste 15%, and grew revenue 22% per shift.", client: "Terraria Café" },
      { metric: "40%", headline: "fewer order delays", quote: "Multiple waiters manage one table in real time. Order delays dropped 40%.", client: "La Fetta Pizzeria" },
    ],
    faqs: [
      { q: "Does billing work offline?", a: "Yes — billing runs local-first and auto-syncs when the connection returns, so service never stops.", media: { type: "video", src: null, caption: "Offline billing then auto-sync" }, links: [{ label: "View Pricing", to: "/pricing" }] },
      { q: "Can guests order without an app?", a: "Yes — Scan & Order works in the mobile browser; guests just scan a QR code." },
      { q: "Does it support takeaway & delivery?", a: "Yes — take direct commission-free orders via your own link, plus Swiggy/Zomato sync." },
    ],
  },

  "run-property": {
    title: "Run the Whole Property", icon: "Building", image: "/brand/feature2.png", videoUrl: null,
    eyebrow: "Run the Property",
    h1: "One app for rooms, restaurant, food court, and beyond.",
    sub: "Hospitality is more than a till. MyGenie runs whole properties — rooms, F&B, multiple counters — even where the internet drops.",
    modules: [
      { icon: "BedDouble", name: "Hotel / Room Billing", outcome: "Rooms + F&B + spa on one consolidated checkout bill.", caps: ["Folio & room posting", "One checkout bill", "Department-wise tracking"] },
      { icon: "Store", name: "Food Court / Multi-counter", outcome: "Many counters, one shared wallet, auto-reconciled.", caps: ["Per-counter billing", "Central wallet", "Consolidated settlement"] },
      { icon: "WifiOff", name: "Offline Mode", outcome: "Keep operating with no data loss, even offline.", caps: ["Local-first billing", "Auto-sync on reconnect", "Low-internet ready"] },
      { icon: "ReceiptText", name: "Single Checkout Bill", outcome: "Everything a guest used, on one clean bill.", caps: ["Cross-department merge", "Tax compliant", "Faster checkout"] },
    ],
    metric: { value: "18%", label: "lower overhead running a whole property on one app" },
    proof: [
      { metric: "18%", headline: "lower overhead, fully offline", quote: "One app powers rooms, café, coworking and parking in a low-internet area — no data loss, overhead down 18%.", client: "Luxevista Resort" },
      { metric: "30%", headline: "faster room service", quote: "Real-time sync between waitstaff and kitchen fulfils orders 30% faster.", client: "Palm Forest Resort" },
    ],
    faqs: [
      { q: "Can rooms and restaurant share one bill?", a: "Yes — a single consolidated checkout bill spans rooms, F&B, spa and bar.", media: { type: "video", src: null, caption: "Rooms + restaurant on a single folio" }, links: [{ label: "For Hotels & Resorts", to: "/solutions/hotels-resorts" }] },
      { q: "Does it work without stable internet?", a: "Yes — offline mode keeps billing running and syncs automatically when back online." },
      { q: "Can each food-court counter bill separately?", a: "Yes — counters bill independently while a central wallet auto-reconciles settlement." },
    ],
  },

  "customers": {
    title: "Bring Customers Back", icon: "HeartHandshake", image: "/brand/feature3.png", videoUrl: null,
    eyebrow: "Bring Customers Back",
    h1: "Turn every bill into a customer who comes back.",
    sub: "It costs far less to bring a guest back than to find a new one. MyGenie turns transactions into relationships.",
    modules: [
      { icon: "Users", name: "CRM", outcome: "Every bill becomes customer data you can use.", caps: ["Auto customer profiles", "Visit & spend history", "Smart segmentation"] },
      { icon: "Gift", name: "Loyalty", outcome: "Reward regulars automatically and lift repeat visits.", caps: ["Points & tiers", "Automatic rewards", "Visit-based triggers"] },
      { icon: "Ticket", name: "Coupons", outcome: "Run offers that drive sales without margin leakage.", caps: ["Targeted coupons", "Usage limits", "Misuse controls"] },
      { icon: "Wallet", name: "Wallet", outcome: "Prepaid wallets that lock in spend and smooth cash flow.", caps: ["Top-up & deduct", "Balance tracking", "Cross-outlet use"] },
      { icon: "MessageCircle", name: "WhatsApp Automation", outcome: "Bring guests back with automatic WhatsApp follow-ups.", caps: ["Auto campaigns", "Offers & reminders", "Feedback requests"] },
      { icon: "Sparkles", name: "Upsell Intelligence", outcome: "Nudge the right add-on at the right moment.", caps: ["Smart suggestions", "Higher average bill", "Context-aware prompts"] },
    ],
    metric: { value: "2×", label: "repeat visits with loyalty + WhatsApp" },
    proof: [
      { metric: "15%", headline: "revenue growth", quote: "MyGenie's CRM and loyalty turned one-time guests into regulars. Revenue grew 15% in a few months.", client: "Kates Kitchen" },
      { metric: "28%", headline: "faster, more consistent service", quote: "Faster ticket times plus follow-ups keep customers coming back.", client: "Bean Me Up" },
    ],
    faqs: [
      { q: "Do loyalty and coupons work automatically?", a: "Yes — rewards and offers trigger automatically based on visits and spend.", media: { type: "video", src: null, caption: "Loyalty & coupons auto-applied at billing" }, links: [{ label: "View Pricing", to: "/pricing" }] },
      { q: "Can I message customers on WhatsApp?", a: "Yes — automated WhatsApp campaigns send offers, reminders and feedback requests." },
      { q: "Does the wallet work across outlets?", a: "Yes — prepaid wallet balances work across all your outlets." },
    ],
  },

  "protect-profit": {
    title: "Protect Your Profit", icon: "ShieldCheck", image: "/brand/feature4.png", videoUrl: null,
    eyebrow: "Protect Your Profit",
    h1: "Catch leakage, theft, and waste — before they eat your margin.",
    sub: "Most profit isn't lost on sales — it leaks out the back. MyGenie puts every void, cancel, and gram of stock on the record.",
    modules: [
      { icon: "Boxes", name: "Inventory", outcome: "Reduce wastage and control stock before it becomes loss.", caps: ["Recipe-level tracking", "Low-stock alerts", "Wastage reports"] },
      { icon: "Warehouse", name: "Central Inventory", outcome: "One stock source of truth across every outlet.", caps: ["Multi-outlet stock", "Inter-outlet transfers", "Purchase control"] },
      { icon: "ShieldCheck", name: "Audit Reports", outcome: "Every void, cancel and discount on the record.", caps: ["Full action logs", "Discount tracking", "Theft detection"] },
      { icon: "CheckCheck", name: "Smart Validations", outcome: "Stop billing mistakes and discount misuse at the source.", caps: ["Rule-based checks", "Approval flows", "Error prevention"] },
    ],
    metric: { value: "₹1 Lakh", label: "theft caught in 2 weeks via audit logs" },
    proof: [
      { metric: "₹1 Lakh", headline: "theft caught in 2 weeks", quote: "A cashier was cancelling items after payment. MyGenie's audit logs exposed ₹1 lakh in theft in two weeks.", client: "Rhino" },
      { metric: "12%", headline: "less wastage, +18% profitability", quote: "Recipe-level control gave us full P&L visibility. Wastage down 12%, order profitability up 18%.", client: "Ubuntu Café" },
    ],
    faqs: [
      { q: "Can MyGenie detect theft?", a: "Yes — audit logs record every void, cancel and discount. Rhino caught ₹1 lakh in theft in two weeks.", media: { type: "video", src: null, caption: "Audit log catching a post-payment void" }, links: [{ label: "For Chains & Franchises", to: "/solutions/chains" }] },
      { q: "Does it track stock across outlets?", a: "Yes — central inventory gives one stock source of truth with transfers and purchase control." },
      { q: "Can it prevent discount misuse?", a: "Yes — smart validations and approval flows stop misuse and billing errors at the source." },
    ],
  },

  "see-everything": {
    title: "See Everything", icon: "LayoutDashboard", image: "/brand/feature5.png", videoUrl: null,
    eyebrow: "See Everything",
    h1: "Total visibility — every outlet, live, from your phone.",
    sub: "Stop guessing how the business is doing. MyGenie gives owners real-time control and reports that build themselves.",
    modules: [
      { icon: "LayoutDashboard", name: "Owner Dashboard", outcome: "Know how every outlet is doing — live, from anywhere.", caps: ["Real-time sales", "Multi-outlet view", "KPIs at a glance"] },
      { icon: "BarChart3", name: "Reports", outcome: "Daily, item-wise, payment-mode, staff — automatic.", caps: ["Scheduled reports", "Drill-downs", "One-tap export"] },
      { icon: "TrendingUp", name: "Recipe-level P&L", outcome: "Optimize by the rupee, not by guesswork.", caps: ["Item profitability", "Cost tracking", "Margin analysis"] },
      { icon: "FileText", name: "GST / VAT", outcome: "Tax-ready reports, generated not assembled.", caps: ["Auto tax computation", "Filing-ready", "Compliance built-in"] },
      { icon: "MessageCircle", name: "WhatsApp Reports", outcome: "Your closing report on WhatsApp, automatically.", caps: ["Daily summaries", "Custom schedules", "No login needed"] },
    ],
    metric: { value: "24/7", label: "real-time visibility from your phone" },
    proof: [
      { metric: "₹25,000/mo", headline: "saved with one-person ops", quote: "One person now runs the operation with real-time WhatsApp reports. Staff costs down ₹25,000/month.", client: "Mill Bakery" },
      { metric: "35%", headline: "less coordination time", quote: "Role-based access and live reporting keep every station accountable. Coordination time dropped 35%.", client: "Antonios" },
    ],
    faqs: [
      { q: "Can I see all my outlets in one place?", a: "Yes — the owner dashboard shows real-time sales and KPIs across every outlet from your phone.", media: { type: "video", src: null, caption: "Multi-outlet owner dashboard, live" }, links: [{ label: "Explore Central Inventory", to: "/product/central-inventory" }] },
      { q: "Do reports generate automatically?", a: "Yes — daily, item-wise, payment-mode and staff reports build themselves and can arrive on WhatsApp." },
      { q: "Are GST/VAT reports included?", a: "Yes — tax-ready reports are computed automatically and filing-ready." },
    ],
  },

  "central-inventory": {
    title: "Central Inventory", icon: "Warehouse", image: "", videoUrl: null, poster: null,
    eyebrow: "Central Inventory",
    h1: "One stock brain for every outlet — built for franchises & chains.",
    sub: "Stop managing each outlet's stock in silos. MyGenie gives multi-outlet businesses one central source of truth — central procurement, inter-outlet transfers, recipe costing, and AI-driven reordering across every location.",
    modules: [
      { icon: "Network", name: "Multi-Outlet Stock Visibility", outcome: "See live stock across every outlet from one dashboard.", caps: ["Real-time stock per outlet", "Consolidated stock view", "Low-stock alerts by location"] },
      { icon: "ArrowLeftRight", name: "Inter-Outlet Transfers", outcome: "Move stock between outlets in a tap — fully tracked.", caps: ["Outlet-to-outlet transfers", "Transfer approvals", "Complete audit trail"] },
      { icon: "ShoppingCart", name: "Central Procurement", outcome: "Buy centrally, distribute smartly, negotiate better rates.", caps: ["Central purchase orders", "Vendor management", "Outlet indents & requisitions"] },
      { icon: "Sparkles", name: "AI Auto-Reorder & Forecast", outcome: "AI predicts demand and suggests what to reorder, per outlet.", caps: ["Demand forecasting", "Par-level suggestions", "Fewer stock-outs & less overstock"] },
      { icon: "ChefHat", name: "Central Recipe & BOM Costing", outcome: "Standardise recipes and costs across every franchise outlet.", caps: ["Central recipe library", "BOM-level costing", "Consistent margins"] },
      { icon: "ShieldCheck", name: "Variance & Theft Detection", outcome: "Catch where consumption doesn't match sales — by outlet.", caps: ["Consumption vs sales variance", "Outlet-wise flags", "Shrinkage control"] },
    ],
    metric: { value: "20%", label: "less stock wastage across outlets" },
    proof: [
      { metric: "40%", headline: "lower fixed cost while scaling outlets", quote: "Central control let us add outlets without adding overhead — lean ops on mobile devices, fixed cost down 40%.", client: "Love Bites" },
      { metric: "₹25,000/mo", headline: "leaner multi-site stock ops", quote: "One person now manages stock across sites with real-time WhatsApp reports. Staff costs down ₹25,000/month.", client: "Mill Bakery" },
    ],
    faqs: [
      { q: "Is Central Inventory built for franchises and chains?", a: "Yes — it's designed for multi-outlet, franchise and chain operations, with one central source of truth across every location.", media: { type: "video", src: null, caption: "Central stock across every outlet" }, links: [{ label: "For Chains & Franchises", to: "/solutions/chains" }] },
      { q: "Can I transfer stock between outlets?", a: "Yes — raise tracked inter-outlet transfers with approvals and a full audit trail." },
      { q: "Does AI help with reordering?", a: "Yes — AI forecasts demand and suggests par-levels and reorder quantities per outlet to cut stock-outs and overstock." },
    ],
  },
};

export const PRODUCT_ORDER = ["sell-serve", "run-property", "customers", "protect-profit", "see-everything", "central-inventory"];
