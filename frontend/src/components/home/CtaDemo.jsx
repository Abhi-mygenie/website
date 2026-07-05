import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";

const INCLUDED = [
  "Captain App, KOT & KDS — included",
  "Owner Dashboard & WhatsApp reports",
  "CRM, Loyalty, Coupons & Wallet",
  "Inventory & audit reports",
  "Scan & Order + Delivery link",
  "Dedicated account manager",
];

export default function CtaDemo({ sector }) {
  return (
    <section id="pricing" className="bg-brand-sand py-24 sm:py-28" data-testid="cta-demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <Reveal>
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-green">Simple, complete pricing</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              One complete package. No feature-based upsells.
            </h2>
            <p className="mt-4 text-lg text-brand-muted leading-relaxed">
              Every core tool is included by default — so you get everything you need to run a profitable outlet
              without paying extra for essentials. Get a customized quote and walkthrough for your business.
            </p>
            <ul className="mt-7 grid sm:grid-cols-2 gap-3">
              {INCLUDED.map((it) => (
                <li key={it} className="flex gap-2.5 text-brand-ink" data-testid="pricing-included-item">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-brand-green flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                  </span>
                  <span className="text-[15px]">{it}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 text-sm text-brand-muted">
              Want to see prices and build your own package right now?
            </p>
            <Link
              to="/pricing"
              data-testid="cta-build-plan-btn"
              className="group mt-3 inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full px-6 py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(242,104,34,0.3)]"
            >
              Build Your Plan & See Pricing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div id="demo" data-testid="demo-anchor">
            <DemoForm sector={sector} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
