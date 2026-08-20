// CR-20 — /petpooja-alternative
// All static fallback content for the VSP page.
// Every string is CMS-editable under the vsp.* namespace.
// Do NOT invent numbers — every claim verified against mygenie.online.

export const VSP_HERO = {
  variant_a: "The honest Petpooja alternative — see why 500+ restaurants switched to MyGenie.",
  variant_b: "Most Indian restaurants run on Petpooja. Some of them switch to us.",
  variant_a_sub:
    "Petpooja runs 1.5 lakh restaurants. It's earned that. But a holistic OS — billing, inventory, expenses, customers and AI, all connected — is a different thing entirely.",
  variant_b_sub:
    "We don't say Petpooja is bad. We say there's a version of your restaurant that runs leaner, profits more, and gives you real-time visibility from your phone. That's what they switched for.",
  cta_primary: "Book a Free Demo →",
  cta_secondary: "See the comparison ↓",
};

export const VSP_STATS = [
  {
    key: "stat1",
    val: "₹1L",
    title: "Fraud caught in 2 weeks",
    desc: "Cashier was cancelling items post-payment. Audit logs exposed it. Process fixed, losses recovered.",
    source: "Rhino — Restaurant",
    color: "green",
  },
  {
    key: "stat2",
    val: "40%",
    title: "Lower fixed costs, 3 devices",
    desc: "Full operation on 3 mobile phones — no front desk, no printers. Table turnaround improved 25%.",
    source: "Love Bites — Café",
    color: "orange",
  },
  {
    key: "stat3",
    val: "₹25k/mo",
    title: "Manpower saved",
    desc: "One person runs the operation end-to-end with WhatsApp reports. ₹25,000 less in staff cost every month.",
    source: "The Mill Bakery",
    color: "green",
  },
];

export const VSP_QUOTES = [
  {
    key: "q1",
    text: "On Petpooja, the whole system would stall if the LAN dropped — staff waiting, kitchen confused. On MyGenie, the owner, waiters and kitchen are all connected from anywhere. It just works.",
    name: "Bismeet Kaur",
    outlet: "Oliwood Cafe",
    initial: "B",
  },
  {
    key: "q2",
    text: "We needed inventory that worked and a Captain App without a LAN cable. Switched to MyGenie, got both at a price published upfront — no calls, no surprises. Renewed after a year without thinking twice.",
    name: "Bhanu Pratap Thakur",
    outlet: "Cafe Amigos",
    initial: "B",
  },
  {
    key: "q3",
    text: "Petpooja felt complicated for no reason. MyGenie was up and running within a day. We've already referred three other businesses — that's how confident we are.",
    name: "Himal Chauhan",
    outlet: "The Tribe Cafe",
    initial: "H",
  },
  {
    key: "q4",
    text: "Five years on Petpooja and the LAN dependency was a daily headache — Captain App limited, KDS limited, inventory limited. One month on MyGenie and I can't imagine going back.",
    name: "Pranav Dogra",
    outlet: "Cafe 103",
    initial: "P",
  },
  {
    key: "q5",
    text: "I needed real-time sales visibility, not a report the next morning. MyGenie gave me that from day one. We've already opened a second outlet on it — a third is coming.",
    name: "Arun Guleria",
    outlet: "Bake N Bite",
    initial: "A",
  },
  {
    key: "q6",
    text: "Petpooja had too many features I didn't need and not enough of the ones I did. MyGenie was comprehensive without being overwhelming — and when I call support, someone actually picks up.",
    name: "Jobhanpreet Singh",
    outlet: "The Frost & Froth Cafe",
    initial: "J",
  },
];

export const VSP_AI = [
  {
    key: "ai1",
    metric: "+18%",
    title: "Smart Upsell",
    before: "Staff forget to suggest add-ons.",
    after: "AI suggests the right add-on at billing. Average bill value up 18% at La Fetta Pizzeria.",
    color: "green",
  },
  {
    key: "ai2",
    metric: "₹1L",
    title: "AI Audit & Theft Detection",
    before: "Manipulation hides in reports.",
    after: "AI audits every void, discount and stock variance. Caught ₹1 lakh in 2 weeks before year-end would have found it.",
    color: "orange",
  },
  {
    key: "ai3",
    metric: "30%",
    title: "Customer Insights & Win-back",
    before: "You can't tell who's about to stop coming.",
    after: "AI surfaces at-risk regulars and lapsed customers automatically. 30% better repeat rate with targeted offers.",
    color: "green",
  },
];

export const VSP_COMP_LEAN = [
  { id: "c1", feature: "Transparent INR pricing",   sub: "Can you see the price before calling?",      mg: "✓  ₹799–₹2,499 / mo",   pp: "✗  Contact us",         ppType: "cross" },
  { id: "c2", feature: "AI features built-in",       sub: "Upsell, audit, insights, segmentation",      mg: "✓  7 features in Pro",   pp: "✗  Not available",      ppType: "cross" },
  { id: "c3", feature: "Runs on any device",         sub: "No terminal purchase needed",                mg: "✓  Any device",          pp: "⚠  Terminal ₹15–30k",   ppType: "warn"  },
  { id: "c4", feature: "WhatsApp + Loyalty",         sub: "Included — not a marketplace add-on",        mg: "✓  Included in Pro",     pp: "3rd-Party",             ppType: "warn"  },
  { id: "c5", feature: "Audit logs / theft detection",sub: "Every void & cancel flagged automatically", mg: "✓  AI-reviewed, live",   pp: "✗  Not available",      ppType: "cross" },
  { id: "c6", feature: "Go-live time",               sub: "",                                           mg: "✓  24 hours",            pp: "⚠  Multi-day setup",    ppType: "warn"  },
];

export const VSP_COMP_FULL = [
  { id: "f1", feature: "KDS + Captain App",          sub: "Kitchen display & waiter app",               mg: "✓  Growth+",             pp: "Add-on",                ppType: "addon", cat: "OPERATIONS" },
  { id: "f2", feature: "CRM + Loyalty Wallet",       sub: "",                                           mg: "✓  Pro",                 pp: "Add-on",                ppType: "addon" },
  { id: "f3", feature: "Recipe-level P&L",           sub: "Profit per dish, per table",                 mg: "✓  Pro",                 pp: "✗  Not available",      ppType: "cross" },
  { id: "f4", feature: "Dedicated account manager",  sub: "",                                           mg: "✓  All plans",           pp: "⚠  Scale plan only",    ppType: "warn",  cat: "SETUP" },
];

export const VSP_TRUST_LOGOS = [
  { name: "Hyatt Centric",      img: "/brand/hyatt-centric.png" },
  { name: "Palm Forest Resort", img: "/brand/palm-forest.png"   },
  { name: "Love Bites",         img: "/brand/love-bites.png"    },
  { name: "The Mill Bakery",    img: "/brand/mill-bakery.png"   },
  { name: "Bamboo Yoga",        img: "/brand/bamboo-yoga.png"   },
  { name: "Ubuntu Café",        img: "/brand/ubuntu.png"        },
  { name: "Terraria Café",      img: "/brand/terra.png"         },
  { name: "La Fetta Pizzeria",  img: "/brand/lafetta.png"       },
];

export const VSP_SWITCH_BADGES = [
  { icon: "⚡", title: "24-hour go-live", sub: "From sign-up to first bill taken" },
  { icon: "📦", title: "Free data migration", sub: "Your menu and CRM come across — no manual re-entry" },
  { icon: "🎯", title: "Dedicated account manager from day 1", sub: "Stays with you through the first month" },
];

export const VSP_VIDEO_OWNERS = [
  { name: "Rohit A.",  outlet: "Restaurant, Jaipur" },
  { name: "Sonal M.",  outlet: "QSR Chain, Ahmedabad" },
  { name: "Arjun P.",  outlet: "3-outlet Chain, Kochi" },
  { name: "Vikram S.", outlet: "Café Owner, Pune" },
  { name: "Priya N.",  outlet: "Hotel F&B, Goa" },
];
