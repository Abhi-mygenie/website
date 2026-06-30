// All MyGenie POS homepage content — copy-ready, problem-led, outcome-focused.

export const METRICS = [
  { value: "Up to 25%", label: "More profit*", testid: "metric-profit" },
  { value: "₹1 Lakh", label: "Leakage caught in 2 weeks", testid: "metric-leakage" },
  { value: "40%", label: "Lower fixed costs", testid: "metric-cost" },
  { value: "30%", label: "Faster service", testid: "metric-speed" },
];

export const TRUST_LOGOS = [
  { name: "Hyatt Centric", img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest", img: "/brand/palm-forest.png" },
  { name: "Bamboo Yoga", img: "/brand/bamboo-yoga.png" },
  { name: "Baba's Italy", img: "/brand/baba-italy.png" },
  { name: "Love Bites", img: "/brand/love-bites.png" },
  { name: "The Mill Bakery", img: "/brand/mill-bakery.png" },
  { name: "Wild Berry", img: "/brand/wild-berry.png" },
  { name: "Drishti Yoga", img: "/brand/drishti-yoga.png" },
];

export const PAINS = [
  { icon: "ReceiptText", title: "Billing mistakes", desc: "Wrong bills, manual errors, and lost money at the counter." },
  { icon: "Timer", title: "Slow order taking", desc: "Queues build, guests wait, and tables turn too slowly." },
  { icon: "Flame", title: "Kitchen confusion", desc: "Lost chits, KOT delays, and orders cooked twice — or not at all." },
  { icon: "EyeOff", title: "No owner control", desc: "You can't see what's really happening when you're not on-site." },
  { icon: "Users", title: "Staff dependency", desc: "If one person is absent, the whole shift falls apart." },
  { icon: "TrendingDown", title: "Revenue leakage", desc: "Voids, cancels, and discount misuse quietly eat your margin." },
  { icon: "Trash2", title: "Inventory wastage", desc: "Stock disappears and spoils before it becomes profit." },
  { icon: "UserX", title: "Poor repeat customers", desc: "Guests come once and you have no way to bring them back." },
];

export const BEFORE_AFTER = {
  before: [
    "Chasing numbers across registers, WhatsApp, and memory",
    "No idea which outlet, item, or shift is actually profitable",
    "Leakage and theft you only discover months later",
    "Service slows down the moment you step away",
  ],
  after: [
    "Every outlet, live, on one dashboard in your pocket",
    "Profit by the rupee — per item, per table, per shift",
    "Every void, cancel, and discount on the record",
    "Faster service and full control, even when you're away",
  ],
};

export const PILLARS = [
  { icon: "TrendingUp", title: "Boost Profit", desc: "Up to 25% more profit with recipe-level P&L, smarter pricing, and upsell intelligence.", stat: "+25%" },
  { icon: "ShieldCheck", title: "Stop Leakage & Theft", desc: "Audit logs catch every void, cancel, and discount misuse before it eats your margin.", stat: "₹1L" },
  { icon: "Zap", title: "Serve Faster", desc: "Captain app, KOT/KDS, and scan-&-order clear queues and turn tables faster.", stat: "30%" },
  { icon: "Repeat", title: "Bring Customers Back", desc: "CRM, loyalty, coupons, wallet, and WhatsApp follow-ups turn one-time guests into regulars.", stat: "2x" },
  { icon: "Smartphone", title: "See Everything", desc: "Owner dashboard and automatic WhatsApp reports — total visibility from anywhere.", stat: "24/7" },
];

export const SECTORS = [
  { slug: "restaurants", name: "Restaurants", icon: "UtensilsCrossed", line: "Turn tables faster, kill order errors, and see profit per table." },
  { slug: "cafes", name: "Cafés", icon: "Coffee", line: "Protect every margin and turn first-timers into regulars." },
  { slug: "qsr", name: "QSR / Fast Food", icon: "Sandwich", line: "More covers per hour with prepaid & scan-order. Every drawer locked down." },
  { slug: "cloud-kitchens", name: "Cloud Kitchens", icon: "ChefHat", line: "Every brand and every aggregator from one screen, one inventory." },
  { slug: "hotels-resorts", name: "Hotels & Resorts", icon: "BedDouble", line: "Run rooms, restaurant, spa, and bar on one app — even offline." },
  { slug: "food-courts", name: "Food Courts", icon: "Store", line: "One wallet, many counters, zero reconciliation headaches." },
  { slug: "canteens", name: "Canteens & Mess", icon: "Utensils", line: "Prepaid, subsidized, and fully accountable — zero leakage." },
  { slug: "chains", name: "Chains & Franchises", icon: "Building2", line: "Control every outlet from one dashboard — full audit, zero blind spots." },
  { slug: "bars-pubs", name: "Bars & Pubs", icon: "Wine", line: "Manage every tab and pour, track liquor stock, and lock down the drawer." },
  { slug: "bakeries", name: "Bakeries", icon: "Croissant", line: "Advance orders, production planning, and fresh-stock control in one app." },
  { slug: "ice-cream-desserts", name: "Ice Cream & Desserts", icon: "IceCreamCone", line: "Fast counters, seasonal menus, and loyalty that brings dessert lovers back." },
];

export const MODULE_BUCKETS = [
  { slug: "sell-serve", icon: "ShoppingBag", title: "Sell & Serve Faster", span: "lg:col-span-3",
    items: ["POS / Billing", "Captain / Waiter App", "KOT / KDS", "Scan & Order", "QSR Prepaid Ordering", "Takeaway & Delivery"],
    line: "Bill in seconds, send orders straight to the kitchen, and serve more covers per hour." },
  { slug: "run-property", icon: "Building", title: "Run the Whole Property", span: "lg:col-span-2",
    items: ["Hotel / Room Billing", "Single Checkout Bill", "Food Court / Multi-counter", "Offline Mode"],
    line: "Rooms, restaurant, spa, and bar on one app — one clean bill at checkout." },
  { slug: "customers", icon: "HeartHandshake", title: "Bring Customers Back", span: "lg:col-span-2",
    items: ["CRM", "Loyalty", "Coupons", "Wallet", "WhatsApp Automation", "Upsell Intelligence"],
    line: "Turn every bill into a customer who comes back." },
  { slug: "protect-profit", icon: "ShieldCheck", title: "Protect Your Profit", span: "lg:col-span-3",
    items: ["Inventory", "Central Inventory", "Audit Reports", "Smart Validations"],
    line: "Reduce wastage and catch leakage before it becomes profit loss." },
  { slug: "see-everything", icon: "LayoutDashboard", title: "See Everything", span: "lg:col-span-5",
    items: ["Owner Dashboard", "Reports", "Recipe-level P&L", "GST / VAT", "WhatsApp Reports"],
    line: "Know how every outlet is doing — live, from your phone." },
];

export const AI_USECASES = [
  { icon: "FileUp", title: "AI Menu Import", desc: "Upload your menu — AI builds it in minutes, not days. Go live faster." },
  { icon: "Users", title: "AI Customer Insights", desc: "Spot who's coming back, who's slipping away, and what they love." },
  { icon: "Sparkles", title: "Smart Upsell", desc: "AI suggests the right add-on at the right moment to lift every bill." },
  { icon: "ScanSearch", title: "AI Report Audit", desc: "AI audits every report — flagging anomalies, voids and variance automatically." },
  { icon: "Lightbulb", title: "Operational Recommendations", desc: "AI flags what's hurting profit and what to fix first." },
  { icon: "CheckCheck", title: "Smart Validations", desc: "Catch billing errors and discount misuse before they cost you." },
  { icon: "Layers", title: "AI CRM Segmentation", desc: "Auto-group customers so your offers actually land." },
];

export const TESTIMONIALS = [
  { metric: "₹1 Lakh", headline: "fraud caught in 2 weeks", quote: "A cashier was cancelling items after payment. MyGenie's audit logs exposed ₹1 lakh in theft in two weeks. We fixed it and recovered losses.", client: "Rhino", sector: "Restaurant" },
  { metric: "30%", headline: "faster room service, 2x tips", quote: "MyGenie synced waitstaff and kitchen in real time. Orders are fulfilled 30% faster, upsell improved, and guest tips nearly doubled.", client: "Palm Forest Resort", sector: "Hotel / Resort", img: "/brand/palmforest.png" },
  { metric: "40%", headline: "lower fixed cost on 3 devices", quote: "We run the entire shack on just 3 mobile devices. No front desk, no printers. Table turnaround improved 25% and monthly cost dropped 40%.", client: "Love Bites", sector: "Café", img: "/brand/lovebites.png" },
];

export const OUTLET_TYPES = [
  "Fine Dine", "Café", "QSR / Fast Food", "Cloud Kitchen", "Hotel / Resort",
  "Food Court", "Canteen / Mess", "Bar & Brewery", "Bakery", "Chain / Franchise", "Other",
];

// Calendly scheduling link shown after the demo form is submitted.
// Configurable via frontend/.env (REACT_APP_CALENDLY_URL); falls back to the default link.
export const CALENDLY_URL =
  process.env.REACT_APP_CALENDLY_URL || "https://calendly.com/mygenie-abhishek/mygenie-demo";
