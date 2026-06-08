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
    telephone: "+91-9579504871",
    contactType: "customer support",
    email: "support@mygenie.online",
    areaServed: "IN",
  },
};

// Static per-route SEO. Keyword-rich titles modelled on the proven live-site titles.
export const PAGE_SEO = {
  "/": {
    title: "POS System for Restaurants & Cafes | Best Billing Software - MyGenie",
    description:
      "Boost your restaurant's efficiency with MyGenie POS — a powerful billing and management software for restaurants, cafes, hotels and food businesses. Boost profit up to 25%. Book a demo today!",
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
};
