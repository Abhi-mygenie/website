import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import FaqItem from "@/components/site/FaqItem";
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";

const FAQS = [
  {
    q: "What exactly is MyGenie POS?",
    a: "MyGenie POS is a complete hospitality operating system — not just billing. It runs your POS, captain app, kitchen (KOT/KDS), scan-&-order, inventory, CRM, loyalty, wallet, WhatsApp, reporting and owner dashboard for restaurants, cafés, QSRs, cloud kitchens, hotels, resorts, food courts, canteens and chains.",
    details: ["In short: one app replaces the 4–5 disconnected tools most outlets juggle, so your floor, kitchen, stock and customers all run from a single source of truth."],
    media: { type: "image", src: null, caption: "The MyGenie owner dashboard — billing, kitchen, inventory and customers in one place." },
    links: [{ label: "See Practical AI", to: "/ai" }, { label: "View Pricing", to: "/pricing" }],
  },
  {
    q: "Which businesses is it built for?",
    a: "From a single café to a multi-city chain — restaurants, cafés, QSR/fast food, cloud kitchens, hotels & resorts, food courts, canteens/mess, bars & pubs, bakeries, ice-cream parlours and franchises. Each gets a tailored setup.",
    links: [{ label: "Find your business type", to: "/solutions/restaurants" }],
  },
  {
    q: "Do I need special hardware?",
    a: "No. MyGenie is mobile-first and runs on regular phones and tablets. Many outlets go live in under 48 hours, and one café cut fixed costs 40% running on just 3 devices.",
    media: { type: "video", src: null, caption: "MyGenie running live on a phone" },
  },
  {
    q: "Does it work without stable internet?",
    a: "Yes. Offline mode keeps billing and service running with no data loss, then auto-syncs the moment the connection returns — ideal for resorts and low-connectivity areas.",
    details: ["You never stop taking orders because the Wi-Fi dropped — one café reported serving 20% more customers after removing their internet dependency."],
    media: { type: "video", src: null, caption: "Offline billing → auto-sync when back online" },
  },
  {
    q: "Can I manage multiple outlets centrally?",
    a: "Yes. Central menu/price control, central inventory, inter-outlet transfers, outlet-wise audit and a multi-outlet owner dashboard let you control every location from one place.",
    media: { type: "image", src: null, caption: "Multi-outlet control from one dashboard." },
    links: [{ label: "Explore Central Inventory", to: "/product/central-inventory" }, { label: "For Chains & Franchises", to: "/solutions/chains" }],
  },
  {
    q: "Does it integrate with Swiggy and Zomato?",
    a: "Yes. Swiggy, Zomato and Magicpin orders sync into one screen, with delivery logistics partners onboarding. You can also take commission-free direct orders.",
  },
  {
    q: "How does pricing work?",
    a: "One complete package with core tools included — no feature-based upsells. Use our build-your-own pricing page to pick a plan and add-ons, see your price live, and buy online or book a demo.",
    links: [{ label: "Build your plan", to: "/pricing" }, { label: "Calculate your savings", to: "/roi" }],
  },
  {
    q: "How is the AI practical, not hype?",
    a: "AI handles real tasks: menu import in minutes, customer insights, smart upsell suggestions, an automatic audit on every report, and validations that catch billing errors — all tied to saving time and money.",
    media: { type: "video", src: null, caption: "AI Report Audit flagging anomalies" },
    links: [{ label: "See all 7 AI features", to: "/ai" }],
  },
  {
    q: "Is my data secure and do I get support?",
    a: "Yes — your data is securely managed in the cloud and you get a dedicated account manager plus onboarding and training so your team is productive fast.",
    links: [{ label: "Talk to us", to: "/contact" }],
  },
];

export default function Resources() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <div className="bg-white" data-testid="resources-page">
      <Seo title={PAGE_SEO["/resources"].title} description={PAGE_SEO["/resources"].description} path="/resources" jsonLd={faqJsonLd} />
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">Help & FAQ</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">Everything you need to know.</h1>
            <p className="mt-4 text-lg text-brand-muted">Common questions about MyGenie POS. Can&apos;t find your answer? Book a demo and ask us directly.</p>
          </div>

          <div className="mt-10">
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} details={f.details} media={f.media} links={f.links} testid={`resource-faq-${i}`} />)}
          </div>

          <div className="mt-12 rounded-3xl bg-brand-sand p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-brand-ink">Still have questions?</h2>
            <p className="text-brand-muted mt-2">Our team will walk you through MyGenie for your exact business.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="/#demo" className="bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5" data-testid="resources-demo-btn">Book a Free Demo</a>
              <Link to="/roi" className="inline-flex items-center gap-2 border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white rounded-full px-7 py-3.5 font-semibold transition-all" data-testid="resources-roi-btn">
                Calculate Your Savings <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
