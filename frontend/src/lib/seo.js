// Central SEO config. SITE_URL drives canonical + OG URLs.
// Production canonical kept as www per migration decision (validate on live DNS).
export const SITE_URL = (process.env.REACT_APP_SITE_URL || "https://www.mygenie.online").replace(/\/$/, "");
export const SITE_NAME = "MyGenie POS";
export const DEFAULT_DESCRIPTION =
  "MyGenie POS is the hospitality operating system that boosts profit up to 25%, stops revenue leakage, and gives owners total control of billing, kitchen, inventory and customers across every outlet.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/banner.png`;

// Organization structured data (site-wide).
export const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo.svg`,
  sameAs: [
    "https://www.youtube.com/channel/UCLY6mrxYUCJu5Qhcz_TDCLw",
    "https://www.facebook.com/people/MyGenie8/61564310132220/",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-9104743156",
    contactType: "customer support",
    email: process.env.REACT_APP_SUPPORT_EMAIL || "support@mygenie.online",
    areaServed: "IN",
  },
};

// SoftwareApplication entity — added to /pricing (Offer schema) and / (entity declaration).
// AggregateRating deferred — no verified review source. Add when Google My Business reviews established.
export const SOFTWARE_APP_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MyGenie POS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Point of Sale Software",
  operatingSystem: "Web, Android, iOS",
  description: "MyGenie POS is a hospitality operating system for restaurants, cafes, cloud kitchens and hotels. Billing, inventory, CRM, loyalty, and AI — all in one platform.",
  url: `${SITE_URL}/pricing`,
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "799",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "799",
        priceCurrency: "INR",
        unitText: "per outlet per month",
      },
      description: "POS & Billing, KOT, Owner Dashboard, Daily Reports",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "1299",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "1299",
        priceCurrency: "INR",
        unitText: "per outlet per month",
      },
      description: "Everything in Starter + Captain App, KDS, Online Ordering, CRM",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "2499",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "2499",
        priceCurrency: "INR",
        unitText: "per outlet per month",
      },
      description: "Everything in Growth + Loyalty, WhatsApp Automation, AI features, dedicated account manager",
    },
  ],
};

// QAPage schema for homepage — 7 approved Q&As (CR-171, 2026-09-02)
// Uses QAPage (not FAQPage) per CR-106 May 2026 precedent.
export const HOMEPAGE_QA_JSONLD = {
  "@context": "https://schema.org",
  "@type": "QAPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does the POS support dynamic UPI QR codes per bill?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie generates a dynamic UPI QR code for each bill natively — no payment gateway needed. The customer scans it with any UPI app and payment is confirmed at the POS instantly.",
      },
    },
    {
      "@type": "Question",
      name: "Can it track inventory down to ingredient level?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie tracks stock at recipe and ingredient level using Bill of Materials (BOM) costing. Every dish sold automatically deducts the right quantities from raw ingredient stock — so you always know what's left, what was wasted, and what the per-dish cost is.",
      },
    },
    {
      "@type": "Question",
      name: "Does it support multi-outlet management?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. The owner dashboard shows live sales, inventory and KPIs across every outlet from one screen on your phone. You can manage stock transfers between outlets, set outlet-specific menus, and control staff access by location — all from a single login.",
      },
    },
    {
      "@type": "Question",
      name: "What kind of reports can be generated?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "MyGenie generates daily sales, item-wise, payment-mode, staff performance, wastage, audit and GST/VAT reports — automatically. Reports arrive on WhatsApp at close of day without logging in. Owners also get recipe-level P&L showing the exact margin on every dish sold.",
      },
    },
    {
      "@type": "Question",
      name: "What are the differences between a legacy and a cloud-based POS system?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "A legacy POS stores data on a local machine — if it crashes, data is lost, and you can only access reports on-site. A cloud POS like MyGenie stores everything securely online: you get live reports from your phone anywhere, automatic updates with no IT cost, and the system keeps working even if the internet drops (local-first billing). Cloud POS also integrates directly with Swiggy, Zomato and payment gateways — legacy systems typically cannot.",
      },
    },
    {
      "@type": "Question",
      name: "Can the POS integrate with delivery platforms?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie integrates directly with Swiggy and Zomato — orders from both platforms flow straight into the POS and kitchen screen without manual entry. You can also take direct commission-free delivery orders through your own ordering link.",
      },
    },
    {
      "@type": "Question",
      name: "Can the POS measure end-to-end P&L?",
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        upvoteCount: 0,
        text: "Yes. MyGenie tracks P&L at item level — every dish sold shows its revenue, ingredient cost and margin in real time. Combined with purchase costs, wastage data and inter-outlet transfers, owners get a complete picture of profitability across every outlet without assembling spreadsheets.",
      },
    },
  ],
};

// Static per-route SEO. Keyword-rich titles modelled on the proven live-site titles.
export const PAGE_SEO = {
  "/": {
    title: "Restaurant POS & Billing Software | MyGenie",
    description:
      "MyGenie POS — powerful billing & restaurant management software for cafes, hotels & cloud kitchens. Boost profit 25%. Book a free demo.",
  },
  "/solutions": {
    title: "POS Solutions by Business Type | Restaurants, Cafés, Hotels & More - MyGenie",
    description:
      "MyGenie POS is built for every hospitality format — restaurants, cafés, QSRs, cloud kitchens, hotels, food courts, bars, bakeries and chains. Find the solution made for your business.",
  },
  "/product": {
    title: "MyGenie POS Features | Billing, Kitchen, Inventory, CRM & Dashboard",
    description:
      "Explore everything MyGenie POS does — billing & captain app, KOT/KDS, scan & order, inventory, loyalty, WhatsApp automation, owner dashboard and reports. All in one operating system.",
  },
  "/pricing": {
    title: "MyGenie POS Pricing | Transparent Restaurant POS Plans & Add-ons",
    description:
      "Build your MyGenie POS plan. Transparent pricing with core tools included — no feature-based upsells. Pick a plan, add modules, see your price live, and book a demo.",
  },
  "/customers": {
    title: "MyGenie POS Customer Stories | Real Restaurant & Hotel Results",
    description:
      "See real results from restaurants, cafes, QSRs, resorts and chains using MyGenie POS — from ₹1 lakh theft caught to 40% lower fixed costs and 30% faster service.",
  },
  "/roi": {
    title: "Restaurant POS ROI Calculator | Estimate Your Savings - MyGenie",
    description:
      "Use the MyGenie ROI calculator to estimate how much profit you could add by reducing leakage, cutting wastage and speeding up service across your outlets.",
  },
  "/resources": {
    title: "MyGenie POS Help & FAQ | Restaurant Billing Software Answers",
    description:
      "Answers to common questions about MyGenie POS — features, hardware, offline mode, multi-outlet control, Swiggy/Zomato integration, pricing, AI and support.",
  },
  "/blog": {
    title: "MyGenie Blog | Restaurant POS Tips, Guides & Industry Insights",
    description:
      "Practical guides on restaurant management, POS systems, inventory, customer experience and profitability — from the MyGenie hospitality team.",
  },
  "/ai": {
    title: "Practical AI for Restaurants & Hospitality | MyGenie POS",
    description:
      "MyGenie's practical AI — menu import, customer insights, smart upsell, AI report audit, operational recommendations, smart validations and CRM segmentation. Real use-cases, no hype. All live in production.",
  },
  "/about": {
    title: "About MyGenie | A Smart POS System for Restaurants & Cafes",
    description:
      "Learn about MyGenie — a hospitality operating system that simplifies billing, inventory and restaurant management with an all-in-one, cloud-based, mobile-first POS.",
  },
  "/contact": {
    title: "Contact MyGenie | Get in Touch for the Best Restaurant POS",
    description:
      "Have questions about MyGenie POS? Contact us for expert support, pricing and personalised solutions for your restaurant, cafe or food business. We're here to help!",
  },
  "/terms": {
    title: "Terms and Conditions | MyGenie POS",
    description: "Review the terms and conditions for using MyGenie POS services, ensuring transparency and compliance.",
  },
  "/privacy": {
    title: "Privacy Policy | MyGenie POS",
    description: "Understand how MyGenie handles your personal information with our detailed privacy policy.",
  },
  "/refund": {
    title: "Refund Policy | MyGenie POS",
    description: "Learn about MyGenie's refund policy for our POS software subscriptions, ensuring transparency and customer satisfaction.",
  },
  "/petpooja-alternative": {
    title: "MyGenie vs Petpooja — The honest POS comparison | MyGenie",
    description:
      "Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo.",
  },
  "/demo": {
    title: "Book a Free MyGenie Demo | See It Live for Your Restaurant",
    description:
      "Book a free 45-minute MyGenie POS walkthrough — a specialist shows you exactly how it works for your outlet. No commitment, no slides.",
    noindex: true,
  },
  "/restaurant-billing-software": {
    title: "Restaurant Billing Software — GST-Ready | MyGenie POS",
    description: "Fast, accurate billing for restaurants & cafes. GST-compliant, cloud-based, runs on any device. Bill in seconds — book a free demo.",
  },
  "/restaurant-pos-system": {
    title: "Restaurant POS System — India's Best | MyGenie",
    description: "Complete restaurant POS system — billing, inventory, KOT, and real-time reports in one app. No hardware lock-in. Works on any device. Book a free demo.",
  },
  "/restaurant-management-software": {
    title: "Restaurant Management Software India | MyGenie POS",
    description: "One platform to manage restaurant orders, staff, inventory and reporting. Used across 100+ Indian cities. Book a free demo — see it live for your outlet.",
  },
  "/qsr-pos-system": {
    title: "QSR POS System — Fast Billing for Quick Service Restaurants",
    description: "Cloud POS built for QSR speed — counter billing, kitchen display, inventory, and reports on any device. GST-ready. Book a free demo.",
  },
  "/cloud-kitchen-pos": {
    title: "Cloud Kitchen POS & Billing Software India | MyGenie",
    description: "POS built for cloud kitchens — manage every brand, every aggregator, and all inventory from one screen. GST-ready. Book a free demo.",
  },
  "/thank-you": {
    title: "Demo Booked | MyGenie POS",
    description: "Your MyGenie POS demo is confirmed. A specialist will walk you through the platform at your booked time.",
    noindex: true,
  },
};
