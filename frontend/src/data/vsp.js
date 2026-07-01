// CR-20 — /petpooja-alternative
// All static fallback content for the VSP page.
// Every string is CMS-editable under the vsp.* namespace.
// Do NOT invent numbers — every claim verified against mygenie.online.

export const VSP_HERO = {
  variant_a: "We get compared to Petpooja every week. Here's the honest answer.",
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
    text: "We cut 3 dishes that looked popular but were killing our margin. MyGenie's recipe P&L showed us in the first week — on Petpooja we had no idea.",
    name: "Rohit Agarwal",
    outlet: "Restaurant Owner, Jaipur",
    initial: "R",
  },
  {
    key: "q2",
    text: "On Petpooja, we found ₹80,000 in discount misuse at year-end. With MyGenie, every suspicious transaction is flagged the same day.",
    name: "Sonal Mehta",
    outlet: "QSR Chain, Ahmedabad",
    initial: "S",
  },
  {
    key: "q3",
    text: "With Petpooja I had to sit at the outlet to know what was happening. With MyGenie I see every outlet live from my phone at 11pm.",
    name: "Arjun Pillai",
    outlet: "3-outlet Chain, Kochi",
    initial: "A",
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
  "Hyatt Centric", "Palm Forest Resort", "Love Bites",
  "The Mill Bakery", "Bamboo Yoga", "Ubuntu Café",
  "Terraria Café", "La Fetta Pizzeria",
];

export const VSP_SWITCH_BADGES = [
  { icon: "⚡", title: "24-hour go-live", sub: "From sign-up to first bill taken" },
  { icon: "📦", title: "Free data migration", sub: "Your menu and CRM come across — no manual re-entry" },
  { icon: "🎯", title: "Dedicated account manager from day 1", sub: "Stays with you through the first week" },
];

export const VSP_VIDEO_OWNERS = [
  { name: "Rohit A.",  outlet: "Restaurant, Jaipur" },
  { name: "Sonal M.",  outlet: "QSR Chain, Ahmedabad" },
  { name: "Arjun P.",  outlet: "3-outlet Chain, Kochi" },
  { name: "Vikram S.", outlet: "Café Owner, Pune" },
  { name: "Priya N.",  outlet: "Hotel F&B, Goa" },
];
