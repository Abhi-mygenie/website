// Sector landing page content — problem-led, outcome-focused, with real proof.
// Sector heroes now use a brand-graphic treatment (no stock photos).
const IMG = () => "";

export const SECTOR_PAGES = {
  "restaurants": {
    name: "Restaurants", icon: "UtensilsCrossed", image: IMG(941861),
    eyebrow: "For Restaurants & Fine Dine",
    h1: "Turn tables faster, kill order errors, and see profit per table.",
    sub: "From the captain's tab to the kitchen screen to your owner dashboard, MyGenie runs your whole dining room — so you serve more covers, with fewer mistakes, and know exactly where your profit comes from.",
    pains: [
      { title: "Slow table service", desc: "Guests wait, orders pile up, and tables turn too slowly at peak hours." },
      { title: "Order errors & lost chits", desc: "Handwritten KOTs get lost or misread — wrong dishes and wasted food." },
      { title: "Staff dependency", desc: "One waiter's day off throws the entire floor into chaos." },
      { title: "No profit visibility", desc: "You see total sales — never profit per item or per table." },
    ],
    solutions: [
      { icon: "Smartphone", title: "Captain App", desc: "Multiple waiters take orders at the same table, in real time — no clashes, no delays." },
      { icon: "Flame", title: "KOT / KDS", desc: "Orders hit the kitchen screen instantly. No lost chits, no shouting." },
      { icon: "TrendingUp", title: "Recipe-level P&L", desc: "See profit by item and by table — optimize your menu by the rupee." },
      { icon: "HeartHandshake", title: "CRM & Loyalty", desc: "Turn diners into regulars with automatic rewards and follow-ups." },
    ],
    metric: { value: "40%", label: "fewer order delays with multi-waiter table service" },
    proof: [
      { metric: "40%", headline: "drop in order delays", quote: "MyGenie lets multiple waiters manage one table in real time. Order delays dropped 40% and dine-in is seamless.", client: "La Fetta Pizzeria" },
      { metric: "28%", headline: "faster ticket times", quote: "We track time between order and service. Prep time dropped 28% and consistency improved — guests keep coming back.", client: "Bean Me Up" },
    ],
    faqs: [
      { q: "Can multiple waiters serve the same table?", a: "Yes — multiple captains can add and manage orders on one table in real time, which cut order delays 40% at La Fetta.", media: { type: "video", src: null, caption: "Multiple captains serving one table, live" }, links: [{ label: "Build your plan", to: "/pricing" }] },
      { q: "Does it work on mobile?", a: "Yes — captains take orders on any phone or tablet, and orders sync to the kitchen instantly." },
      { q: "Can I see profit per dish?", a: "Yes — recipe-level P&L shows cost and profit for every item on your menu." },
    ],
  },

  "cafes": {
    name: "Cafés", icon: "Coffee", image: IMG(302899),
    eyebrow: "For Cafés & Coffee Shops",
    h1: "Protect every margin — and turn first-timers into regulars.",
    sub: "Thin margins leave no room for waste or guesswork. MyGenie gives cafés fast mobile billing, ingredient-level control, and a built-in repeat-customer engine.",
    pains: [
      { title: "Thin margins, hidden waste", desc: "Ingredients spoil or over-portion before they ever become profit." },
      { title: "Hard to train casual staff", desc: "High turnover means you're constantly retraining new hires." },
      { title: "One-time customers", desc: "Guests visit once and you have no way to bring them back." },
      { title: "High setup cost", desc: "Traditional POS hardware eats into your launch budget." },
    ],
    solutions: [
      { icon: "Smartphone", title: "Mobile-first billing", desc: "Run on a few phones — no expensive hardware. Go live in under 48 hours." },
      { icon: "Boxes", title: "Recipe & inventory control", desc: "Track every gram and cut wastage before it hits your P&L." },
      { icon: "Gift", title: "Loyalty + WhatsApp", desc: "Reward regulars and bring guests back automatically." },
      { icon: "Users", title: "Fast staff onboarding", desc: "Train new staff in hours, not days." },
    ],
    metric: { value: "₹50,000+", label: "upfront hardware saved with mobile-first setup" },
    proof: [
      { metric: "₹50,000+", headline: "saved on setup, live in 48 hours", quote: "MyGenie's mobile-first solution saved us over ₹50,000 upfront and let us go live in under 48 hours.", client: "Matryyoshka Café" },
      { metric: "18%", headline: "higher order profitability", quote: "With integrated expense and recipe-level control we see full P&L. Wastage is down 12% and profitability up 18%.", client: "Ubuntu Café" },
    ],
    faqs: [
      { q: "Do I need special hardware?", a: "No — MyGenie runs on regular phones and tablets. Many cafés go live in under 48 hours.", media: { type: "video", src: null, caption: "MyGenie running on a normal phone" }, links: [{ label: "Build your plan", to: "/pricing" }] },
      { q: "Can it reduce wastage?", a: "Yes — recipe-level inventory tracks consumption. Ubuntu cut ingredient wastage by 12%." },
      { q: "Can I bring customers back?", a: "Yes — built-in loyalty and WhatsApp follow-ups drive repeat visits automatically." },
    ],
  },

  "qsr": {
    name: "QSR / Fast Food", icon: "Sandwich", image: IMG(1639557),
    eyebrow: "For QSR & Fast Food",
    h1: "More covers per hour — and every cash drawer locked down.",
    sub: "Queues kill QSR profit. MyGenie speeds up ordering with prepaid tokens and scan-&-order, syncs the kitchen with KDS, and puts every void on the record.",
    pains: [
      { title: "Peak-hour queues", desc: "Lines build, customers walk — and revenue walks with them." },
      { title: "Prepaid / token chaos", desc: "Manual token flow slows the counter when you can least afford it." },
      { title: "Kitchen bottlenecks", desc: "Orders pile up without a clear prep queue." },
      { title: "Counter theft", desc: "Post-payment cancels and voids quietly leak cash." },
    ],
    solutions: [
      { icon: "Zap", title: "QSR prepaid ordering", desc: "Take prepaid orders fast and clear queues at peak rush." },
      { icon: "QrCode", title: "Scan & Order", desc: "Guests order from their phone — fewer staff, faster flow." },
      { icon: "Flame", title: "KDS", desc: "A clear kitchen queue cuts prep time and errors." },
      { icon: "ShieldCheck", title: "Audit logs", desc: "Every void and cancel on the record — stop drawer leakage." },
    ],
    metric: { value: "22%", label: "more revenue per shift with KDS + scan ordering" },
    proof: [
      { metric: "22%", headline: "more revenue per shift", quote: "Our QSR model improved drastically with KDS and scan-based ordering. Prep time cut 30%, food waste down 15%, revenue up 22% per shift.", client: "Terraria Café" },
      { metric: "₹1 Lakh", headline: "theft caught in 2 weeks", quote: "A cashier was cancelling items after payment. MyGenie's audit logs exposed ₹1 lakh in theft in two weeks.", client: "Rhino" },
    ],
    faqs: [
      { q: "Does scan & order need an app?", a: "No — guests scan a QR code and order from their mobile browser. No app or special device required.", media: { type: "video", src: null, caption: "Scan & order from the table — no app" }, links: [{ label: "See Sell & Serve", to: "/product/sell-serve" }] },
      { q: "Can it speed up peak hours?", a: "Yes — Terraria cut prep time 30% and grew revenue 22% per shift with KDS and scan ordering." },
      { q: "Can I catch counter theft?", a: "Yes — audit logs exposed ₹1 lakh in theft at Rhino within two weeks." },
    ],
  },

  "cloud-kitchens": {
    name: "Cloud Kitchens", icon: "ChefHat", image: IMG(12821628),
    eyebrow: "For Cloud Kitchens",
    h1: "Every brand and every aggregator — one screen, one inventory.",
    sub: "Juggling Swiggy, Zomato and multiple brands shouldn't mean five tablets and a spreadsheet. MyGenie unifies it all into one backend.",
    pains: [
      { title: "Aggregator juggling", desc: "Swiggy and Zomato orders across multiple tablets and brands." },
      { title: "Multi-brand chaos", desc: "Separate menus, prices and stock for every brand." },
      { title: "Inventory blind spots", desc: "Shared ingredients across brands are impossible to track manually." },
      { title: "Missed orders", desc: "Orders slip through at peak and cost you ratings." },
    ],
    solutions: [
      { icon: "RefreshCw", title: "Aggregator sync", desc: "Swiggy, Zomato and Magicpin orders flow into one screen." },
      { icon: "Building", title: "Multi-brand billing", desc: "Run every brand from one backend with separate menus." },
      { icon: "Boxes", title: "Central inventory", desc: "One shared stock source of truth across all brands." },
      { icon: "Bike", title: "Direct delivery link", desc: "Take commission-free delivery and takeaway orders directly." },
    ],
    metric: { value: "1", label: "screen for every brand and every aggregator" },
    proof: [
      { metric: "40%", headline: "lower fixed cost, lean ops", quote: "We run lean on just a few mobile devices — no front desk, no printers. Monthly fixed cost dropped 40%.", client: "Love Bites" },
      { metric: "2×", headline: "outlets on one backend", quote: "MyGenie let us launch a second kitchen on the same backend with real-time sync. Revenue doubled, infra cost stayed flat.", client: "Pavan Pages" },
    ],
    faqs: [
      { q: "Which aggregators integrate?", a: "Swiggy, Zomato and Magicpin sync directly, with logistics partners like Rapido and Dunzo onboarding.", media: { type: "video", src: null, caption: "All aggregator orders in one screen" }, links: [{ label: "See Sell & Serve", to: "/product/sell-serve" }] },
      { q: "Can I run multiple brands?", a: "Yes — multi-brand billing runs every brand with separate menus on one backend." },
      { q: "Is inventory shared across brands?", a: "Yes — central inventory tracks shared ingredients across every brand." },
    ],
  },

  "hotels-resorts": {
    name: "Hotels & Resorts", icon: "BedDouble", image: IMG(258154),
    eyebrow: "For Hotels & Resorts",
    h1: "Run your entire property on one app — rooms, restaurant, spa, and bar. Even offline.",
    sub: "Stop running between counters. MyGenie unifies room billing and F&B into one consolidated checkout bill, works in low-internet properties, and lets staff serve guests right from their phones.",
    pains: [
      { title: "Complex room + F&B billing", desc: "Rooms, restaurant, spa and bar all live in separate systems." },
      { title: "Low-internet properties", desc: "Connectivity drops — and so does your service." },
      { title: "Front-desk dependency", desc: "Staff run to a counter instead of serving guests." },
      { title: "Slow room service", desc: "Orders crawl between waitstaff and the kitchen." },
    ],
    solutions: [
      { icon: "BedDouble", title: "Hotel / room billing", desc: "One consolidated bill at checkout across every department." },
      { icon: "WifiOff", title: "Offline mobile ops", desc: "Keep operating with no data loss, even in low-connectivity areas." },
      { icon: "BellRing", title: "Real-time service alerts", desc: "Sync waitstaff and kitchen — fulfil room service 30% faster." },
      { icon: "LayoutDashboard", title: "Owner dashboard", desc: "See rooms, F&B and services live, from anywhere." },
    ],
    metric: { value: "30%", label: "faster room-service fulfilment, with 2× tips" },
    proof: [
      { metric: "30%", headline: "faster room service, 2× tips", quote: "MyGenie synced waitstaff and kitchen in real time. Orders fulfilled 30% faster, upsell improved, and guest tips nearly doubled.", client: "Palm Forest Resort" },
      { metric: "18%", headline: "lower overhead, fully offline", quote: "One app powers rooms, café, coworking and parking in a low-internet area — no data loss, overhead down 18%.", client: "Luxevista Resort" },
    ],
    faqs: [
      { q: "Can it handle rooms and restaurant together?", a: "Yes — one consolidated checkout bill spans rooms, F&B, spa and bar.", media: { type: "video", src: null, caption: "Rooms + restaurant on one folio" }, links: [{ label: "See Run the Property", to: "/product/run-property" }] },
      { q: "Does it work without stable internet?", a: "Yes — Luxevista runs rooms, café, coworking and parking offline with no data loss." },
      { q: "Will it speed up room service?", a: "Yes — Palm Forest fulfils room-service orders 30% faster with real-time alerts." },
    ],
  },

  "food-courts": {
    name: "Food Courts", icon: "Store", image: IMG(1267320),
    eyebrow: "For Food Courts",
    h1: "One wallet, many counters, zero reconciliation headaches.",
    sub: "Multiple vendors, shared seating, one messy settlement at day's end. MyGenie runs every counter on a shared wallet and reconciles automatically.",
    pains: [
      { title: "Multi-vendor settlement", desc: "Reconciling many counters by hand is slow and error-prone." },
      { title: "No shared payment", desc: "Guests juggle cash and cards across counters." },
      { title: "Central reporting gaps", desc: "No single view of food-court performance." },
      { title: "Queue build-up", desc: "Each counter slows down during the rush." },
    ],
    solutions: [
      { icon: "Wallet", title: "Central wallet / prepaid", desc: "One prepaid wallet works across every counter." },
      { icon: "Store", title: "Multi-counter billing", desc: "Each vendor bills independently while you see it all." },
      { icon: "BarChart3", title: "Consolidated reporting", desc: "Food-court-wide sales and settlement in one place." },
      { icon: "QrCode", title: "Scan & order", desc: "Cut queues with mobile ordering at every counter." },
    ],
    metric: { value: "1", label: "wallet across every counter — auto-reconciled" },
    proof: [
      { metric: "35%", headline: "less coordination time", quote: "Role-based access keeps every station accountable and prevents task overlap. Coordination time dropped 35%.", client: "Antonios" },
      { metric: "1", headline: "wallet across every counter", quote: "Guests load one prepaid wallet and spend it at any counter. Settlement that used to take an hour now reconciles itself at close.", client: "Phoenix Food Plaza" },
    ],
    faqs: [
      { q: "Can guests pay across counters with one wallet?", a: "Yes — a central prepaid wallet works at every counter in the food court.", media: { type: "video", src: null, caption: "One wallet across every counter" }, links: [{ label: "See Bring Customers Back", to: "/product/customers" }] },
      { q: "Do vendors bill separately?", a: "Yes — each counter bills independently while you get consolidated reports." },
      { q: "Is settlement automated?", a: "Yes — counter-wise reconciliation happens automatically at day end." },
    ],
  },

  "canteens": {
    name: "Canteens & Mess", icon: "Utensils", image: IMG(696218),
    eyebrow: "For Canteens & Mess",
    h1: "Prepaid, subsidized, and fully accountable — zero leakage.",
    sub: "Corporate and institutional canteens run on prepaid balances, subsidies and headcounts. MyGenie tracks every meal and stops leakage cold.",
    pains: [
      { title: "Subsidy management", desc: "Employee and student subsidies are hard to apply and track." },
      { title: "Prepaid balances", desc: "Manual balance tracking invites errors and disputes." },
      { title: "Consumption tracking", desc: "No clear view of meals served versus billed." },
      { title: "Leakage", desc: "Untracked meals quietly drain the budget." },
    ],
    solutions: [
      { icon: "Wallet", title: "Wallet & prepaid", desc: "Load balances and deduct per meal automatically." },
      { icon: "Ticket", title: "Coupons & subsidies", desc: "Apply meal subsidies and coupons cleanly at billing." },
      { icon: "BarChart3", title: "Consumption reports", desc: "Track meals by headcount, shift and menu." },
      { icon: "ShieldCheck", title: "Audit reports", desc: "Every transaction accountable — zero leakage." },
    ],
    metric: { value: "100%", label: "of meals tracked and accountable" },
    proof: [
      { metric: "₹25,000/mo", headline: "manpower saved on lean ops", quote: "The operation is now managed by one person using MyGenie, with real-time WhatsApp reports. Staff costs down ₹25,000/month.", client: "Mill Bakery" },
      { metric: "100%", headline: "of meals tracked & accountable", quote: "Every subsidized meal is now logged against a headcount. Leakage we couldn't even see before is gone, and audits take minutes.", client: "TechPark Central Canteen" },
    ],
    faqs: [
      { q: "Can it handle prepaid meal balances?", a: "Yes — wallets deduct per meal automatically and stay accurate.", media: { type: "video", src: null, caption: "Prepaid meal balances in action" }, links: [{ label: "Build your plan", to: "/pricing" }] },
      { q: "Can we apply subsidies?", a: "Yes — coupons and subsidy rules apply cleanly at billing." },
      { q: "Can we track consumption?", a: "Yes — reports show meals by headcount, shift and menu." },
    ],
  },

  "chains": {
    name: "Chains & Franchises", icon: "Building2", image: IMG(1581384),
    eyebrow: "For Chains & Franchises",
    h1: "Control every outlet from one dashboard — without flying to each one.",
    sub: "As you scale, control slips. MyGenie centralizes menus, prices, inventory and audits so every outlet runs the same — with zero blind spots.",
    pains: [
      { title: "No central control", desc: "Each outlet ends up doing its own thing." },
      { title: "Inconsistent menus & prices", desc: "Prices and items drift across locations." },
      { title: "Outlet-level theft", desc: "Leakage hides inside individual outlets." },
      { title: "Fragmented reporting", desc: "No single source of truth across the chain." },
    ],
    solutions: [
      { icon: "SlidersHorizontal", title: "Central menu & price control", desc: "Push the same menu and prices to every outlet instantly." },
      { icon: "Boxes", title: "Central inventory", desc: "One stock source of truth across all locations." },
      { icon: "ShieldCheck", title: "Outlet-wise audit", desc: "Catch leakage and theft per outlet." },
      { icon: "LayoutDashboard", title: "Multi-outlet dashboard", desc: "Every outlet's performance, live, in one view." },
    ],
    metric: { value: "2×", label: "revenue on a 2nd outlet — with flat infra cost" },
    proof: [
      { metric: "2×", headline: "revenue, flat cost on a 2nd outlet", quote: "MyGenie let us launch a second outlet on the same backend with real-time sync. Revenue doubled while infra cost stayed flat.", client: "Pavan Pages" },
      { metric: "₹1 Lakh", headline: "outlet theft caught in 2 weeks", quote: "MyGenie's audit logs exposed ₹1 lakh in theft in two weeks. We fixed the process and recovered losses.", client: "Rhino" },
    ],
    faqs: [
      { q: "Can I control menus across outlets?", a: "Yes — push the same menu and prices to every outlet instantly from one dashboard.", media: { type: "video", src: null, caption: "Central menu control across outlets" }, links: [{ label: "Explore Central Inventory", to: "/product/central-inventory" }] },
      { q: "Can I open new outlets easily?", a: "Yes — Pavan Pages launched a second outlet on the same backend, doubling revenue with flat cost." },
      { q: "Can I catch outlet-level theft?", a: "Yes — outlet-wise audit logs expose leakage; Rhino caught ₹1 lakh in two weeks." },
    ],
  },

  "bars-pubs": {
    name: "Bars & Pubs", icon: "Wine", image: "",
    eyebrow: "For Bars & Pubs",
    h1: "Pour perfect profits — every tab, every pour, every last call.",
    sub: "From happy-hour rush to last call, MyGenie keeps your bar running smoothly. Open and manage tabs, track pour costs, control liquor inventory, and lock down every drawer.",
    pains: [
      { title: "Tab chaos & walkouts", desc: "Open tabs get lost, split wrong, or walk out the door unpaid." },
      { title: "Untracked pour costs", desc: "Over-pouring and unmonitored premium liquor quietly bleed margin." },
      { title: "Liquor inventory blind spots", desc: "You never quite know what's running low until it's gone." },
      { title: "Counter theft", desc: "Post-payment cancels and voids drain cash at the bar." },
    ],
    solutions: [
      { icon: "ReceiptText", title: "Bar Tab Management", desc: "Open, split, merge and transfer tabs instantly — and prevent walkouts with running-tab tracking." },
      { icon: "Wine", title: "Drink Service & Pour Tracking", desc: "Track pour costs and quantities, run happy-hour pricing, and monitor premium liquor consumption." },
      { icon: "Boxes", title: "Inventory Control", desc: "Track bottles and pour levels so you're never low on popular items." },
      { icon: "ShieldCheck", title: "Audit Logs", desc: "Every void and cancel on the record — stop drawer leakage cold." },
    ],
    metric: { value: "₹1 Lakh", label: "theft caught in 2 weeks via audit logs" },
    proof: [
      { metric: "₹1 Lakh", headline: "theft caught in 2 weeks", quote: "A cashier was cancelling items after payment. MyGenie's audit logs exposed ₹1 lakh in theft in two weeks.", client: "Rhino" },
      { metric: "40%", headline: "lower fixed cost, lean ops", quote: "We run lean on just a few mobile devices — no clunky terminals. Monthly fixed cost dropped 40%.", client: "Love Bites" },
    ],
    faqs: [
      { q: "Can I manage multiple open tabs?", a: "Yes — open, split, merge and transfer tabs instantly, and track running tabs to prevent walkouts.", media: { type: "video", src: null, caption: "Open, split & merge bar tabs" }, links: [{ label: "Build your plan", to: "/pricing" }] },
      { q: "Can I track pour costs and happy-hour pricing?", a: "Yes — track pour quantities and costs, run happy-hour pricing, and monitor premium liquor consumption." },
      { q: "Can it stop counter theft?", a: "Yes — audit logs record every void and cancel; Rhino caught ₹1 lakh in theft in two weeks." },
    ],
  },

  "bakeries": {
    name: "Bakeries", icon: "Croissant", image: "",
    eyebrow: "For Bakeries",
    h1: "From morning bread to custom cakes — run your bakery with precision.",
    sub: "Handle advance orders, plan daily production, track fresh-ingredient shelf life, and delight customers on their special days — all from one app.",
    pains: [
      { title: "Advance & bulk orders", desc: "Custom cakes, pickups and wholesale orders are hard to track manually." },
      { title: "Production guesswork", desc: "Over- or under-baking wastes ingredients and misses sales." },
      { title: "Perishable inventory", desc: "Fresh ingredients spoil and shelf-life slips through the cracks." },
      { title: "Custom order mix-ups", desc: "Special cake orders and delivery dates get missed." },
    ],
    solutions: [
      { icon: "ClipboardList", title: "Order Management", desc: "Handle advance orders, customizations, pickup times and bulk/wholesale orders with ease." },
      { icon: "CalendarClock", title: "Production Planning", desc: "Schedule daily production quantities and track ingredient usage, costs and recipe scaling." },
      { icon: "Boxes", title: "Inventory Control", desc: "Track fresh ingredients, shelf-life, packaging and seasonal availability." },
      { icon: "Cake", title: "Custom Orders", desc: "Manage special cake orders and deliveries so you never miss a celebration." },
    ],
    metric: { value: "₹25,000/mo", label: "manpower saved running lean on mobile" },
    proof: [
      { metric: "₹25,000/mo", headline: "saved on lean ops", quote: "The bakery is now managed by one person using MyGenie, with real-time WhatsApp reports. Staff costs down ₹25,000/month.", client: "Mill Bakery" },
      { metric: "18%", headline: "higher order profitability", quote: "Recipe-level control gave us full P&L visibility. Wastage down 12%, profitability up 18%.", client: "Ubuntu Café" },
    ],
    faqs: [
      { q: "Can I manage advance and custom cake orders?", a: "Yes — track advance orders, customizations, pickup times and delivery schedules in one place.", media: { type: "video", src: null, caption: "Advance & custom cake orders" }, links: [{ label: "Build your plan", to: "/pricing" }] },
      { q: "Can it help plan production?", a: "Yes — schedule daily production quantities and track ingredient usage, costs and recipe scaling." },
      { q: "Can I track perishable stock?", a: "Yes — monitor fresh-ingredient shelf-life, packaging materials and seasonal availability." },
    ],
  },

  "ice-cream-desserts": {
    name: "Ice Cream & Desserts", icon: "IceCreamCone", image: "",
    eyebrow: "For Ice Cream & Dessert Parlours",
    h1: "Serve sweet moments fast — and keep every scoop profitable.",
    sub: "Quick counters, seasonal menus and tight margins. MyGenie keeps billing fast, controls ingredient costs, and brings dessert lovers back for more.",
    pains: [
      { title: "Peak-hour queues", desc: "Evening and weekend rushes build lines and lose walk-ins." },
      { title: "Seasonal menu churn", desc: "Flavours and prices change often and are hard to keep updated." },
      { title: "Topping & cone wastage", desc: "Hard-to-track add-ons and perishables quietly eat margin." },
      { title: "One-time footfall", desc: "Customers visit once and you have no way to bring them back." },
    ],
    solutions: [
      { icon: "Zap", title: "Fast Counter Billing", desc: "Bill in seconds and clear queues at peak rush with quick, mobile-first checkout." },
      { icon: "QrCode", title: "Scan & Order", desc: "Let guests order from their phone — fewer staff, faster flow." },
      { icon: "Boxes", title: "Ingredient & Topping Control", desc: "Track scoops, toppings and perishables to cut wastage." },
      { icon: "Gift", title: "Loyalty & WhatsApp", desc: "Reward regulars and bring dessert lovers back automatically." },
    ],
    metric: { value: "20%", label: "more customers served daily, even offline" },
    proof: [
      { metric: "20%", headline: "more customers served daily", quote: "We couldn't take outdoor orders due to Wi-Fi dependency. MyGenie removed that barrier — we serve 20% more customers daily.", client: "Sushi Café" },
      { metric: "₹50,000+", headline: "saved on setup, live in 48 hours", quote: "MyGenie's mobile-first solution saved us over ₹50,000 upfront and let us go live in under 48 hours.", client: "Matryyoshka Café" },
    ],
    faqs: [
      { q: "Can it handle fast counter service?", a: "Yes — mobile-first billing and scan-&-order clear queues quickly at peak rush.", media: { type: "video", src: null, caption: "Fast counter billing at peak rush" }, links: [{ label: "Build your plan", to: "/pricing" }] },
      { q: "Can I update seasonal menus easily?", a: "Yes — manage flavours, prices and availability anytime from one dashboard." },
      { q: "Can I bring customers back?", a: "Yes — built-in loyalty and WhatsApp follow-ups drive repeat visits automatically." },
    ],
  },
};

export const SECTOR_ORDER = ["hotels-resorts", "chains", "restaurants", "cafes", "qsr", "cloud-kitchens", "food-courts", "canteens", "bars-pubs", "bakeries", "ice-cream-desserts"];
