// Detailed Practical AI features for the /ai hub page. ALL LIVE in production.
// Each: pain -> what the AI does -> outcome (seed metrics are PLACEHOLDER until owner confirms).
// videoSrc/poster are null until walkthrough clips are recorded; FeatureVideo shows a branded placeholder.
export const AI_FEATURES = [
  {
    id: "menu-import",
    icon: "FileUp",
    title: "AI Menu Import",
    pain: "Building a full menu by hand takes days — and every typo delays going live.",
    solution:
      "Upload your existing menu and MyGenie's AI reads it, then auto-builds your items, categories, modifiers and prices — ready to edit and go live.",
    outcome: { value: "~30 min", label: "from menu file to a live POS", seed: true },
    videoSrc: null,
    poster: null,
  },
  {
    id: "customer-insights",
    icon: "Users",
    title: "AI Customer Insights",
    pain: "You serve hundreds of guests but can't tell who's loyal, who's leaving, or what they love.",
    solution:
      "AI reads every bill to surface your regulars, at-risk customers, top spenders and favourite items — automatically, no analyst required.",
    outcome: { value: "30%", label: "better repeat rate with targeted win-backs", seed: true },
    videoSrc: null,
    poster: null,
  },
  {
    id: "smart-upsell",
    icon: "Sparkles",
    title: "Smart Cross-sell & Upsell",
    pain: "Staff forget to suggest add-ons, leaving easy revenue on every table.",
    solution:
      "At billing, AI suggests the right add-on at the right moment — based on the current order and what sells together.",
    outcome: { value: "+18%", label: "average bill value", seed: true },
    videoSrc: null,
    poster: null,
  },
  {
    id: "report-audit",
    icon: "ScanSearch",
    title: "AI Report Audit",
    pain: "Reports are only useful if you can trust them — manual auditing is slow and misses manipulation.",
    solution:
      "MyGenie's AI runs an automatic audit against every report — flagging anomalies, mismatches, suspicious voids, discounts and stock variance. A second set of eyes on every number.",
    outcome: { value: "100%", label: "of reports auto-audited for anomalies", seed: false },
    videoSrc: null,
    poster: null,
  },
  {
    id: "ops-recommendations",
    icon: "Lightbulb",
    title: "Operational Recommendations",
    pain: "Data tells you what happened — not what to do about it.",
    solution:
      "AI analyses your operations and returns prioritised recommendations: what's hurting profit, and what to fix first.",
    outcome: { value: "12%", label: "less wastage acting on AI flags", seed: true },
    videoSrc: null,
    poster: null,
  },
  {
    id: "smart-validations",
    icon: "CheckCheck",
    title: "Smart Validations",
    pain: "Billing errors, over-discounting and post-payment edits quietly drain margin.",
    solution:
      "AI validates transactions in real time — catching errors, discount misuse and suspicious edits before they cost you.",
    outcome: { value: "₹1 Lakh", label: "leakage caught in 2 weeks (real customer)", seed: false },
    videoSrc: null,
    poster: null,
  },
  {
    id: "crm-segmentation",
    icon: "Layers",
    title: "AI CRM Segmentation",
    pain: "Blasting the same offer to everyone wastes money and annoys customers.",
    solution:
      "AI automatically groups customers — regulars, lapsed, big spenders, birthdays this month — so every campaign actually lands.",
    outcome: { value: "2×", label: "campaign conversion vs blast messaging", seed: true },
    videoSrc: null,
    poster: null,
  },
];

export const AI_FAQS = [
  {
    q: "Are these AI features available now?",
    a: "Yes — every AI capability on this page is live in MyGenie production today, not a roadmap promise.",
    links: [{ label: "Book a demo", href: "#ai-demo" }, { label: "View Pricing", to: "/pricing" }],
  },
  {
    q: "Will AI replace my decisions?",
    a: "No. MyGenie's AI is a practical assistant for the owner — it surfaces insights, flags issues and suggests actions, but you stay in control.",
  },
  {
    q: "Is my business data safe?",
    a: "Yes. Your data is encrypted in transit and at rest, and access is role-based. AI works on your own data to help you — it is never sold.",
  },
  {
    q: "Does AI Report Audit work across multiple outlets?",
    a: "Yes — the AI audit runs per report and across outlets, flagging anomalies and variance wherever they occur.",
    links: [{ label: "See multi-outlet tools", to: "/product/see-everything" }, { label: "Central Inventory", to: "/product/central-inventory" }],
  },
  {
    q: "Does AI Menu Import support my menu format?",
    a: "Yes — upload a common menu file or image and the AI builds your catalogue automatically; you can review and edit before going live.",
  },
];
