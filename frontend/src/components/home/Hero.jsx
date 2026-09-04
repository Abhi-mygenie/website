// react-router-dom Link removed — Hero uses native <a href="#pricing"> (CR-164)
import { ArrowRight, ShieldCheck, TrendingUp, Phone } from "lucide-react";
import { EditableText, EditableImage } from "@/components/cms/Editable";
import { COMPANY } from "@/data/company";

export default function Hero({ onDemo }) {
  return (
    <section id="top" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden" data-testid="hero">
      {/* soft brand glows */}
      <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-brand-green/10 blur-3xl" />
      <div className="absolute top-40 -left-20 w-[360px] h-[360px] rounded-full bg-brand-yellow/15 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 text-brand-orange px-4 py-1.5 text-sm font-semibold"
            data-testid="hero-badge"
          >
            <span className="w-2 h-2 rounded-full bg-brand-orange" />{" "}
            <EditableText id="home.hero.badge" fallback="India's Restaurant POS System & Billing Software" />
          </span>

          <h1
            className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-brand-ink"
          >
            <EditableText id="home.hero.title_lead" fallback="Restaurant POS & Billing Software — " />
            <span className="text-brand-green">
              <EditableText id="home.hero.title_accent" fallback="Run Your Business From Your Phone" />
            </span>
          </h1>

          <p
            className="mt-6 text-lg text-brand-muted leading-relaxed max-w-xl"
          >
            <EditableText
              id="home.hero.subtitle"
              rich
              fallback={'MyGenie POS boosts profit by up to <span class="font-bold text-brand-orange">25%</span>,* stops revenue leakage, speeds up service, and gives owners total control of billing, kitchen, inventory, and customers — across every food business.'}
            />
          </p>

          <div
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#demo"
              onClick={(e) => { e.preventDefault(); onDemo(); }}
              data-testid="hero-demo-btn"
              className="group bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)] flex items-center gap-2"
            >
              <EditableText id="home.hero.cta_primary" fallback="Book a Free Demo" />
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#pricing"
              data-testid="hero-pricing-btn"
              className="rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all"
            >
              <EditableText id="home.hero.cta_secondary" fallback="See Pricing" />
            </a>
          </div>

          <p className="mt-4 text-xs text-brand-muted">
            <EditableText id="home.hero.disclaimer" fallback="*Based on internal case studies & partner results. Individual results may vary." />
          </p>

          {/* CR-97: phone — mobile only, desktop shows phone in Navbar */}
          <p className="lg:hidden mt-2 flex items-center gap-1.5 text-xs text-brand-muted">
            <Phone className="w-3 h-3 shrink-0" />
            Or call us:{" "}
            <a
              href={`tel:${COMPANY.phoneIntl}`}
              data-testid="hero-phone-link"
              className="font-semibold text-brand-ink hover:text-brand-green transition-colors"
            >
              {COMPANY.phone}
            </a>
          </p>

          {/* CR-96: India integration badges — all viewports */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-brand-muted font-semibold uppercase tracking-wide mr-1">
              Works with
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-brand-line rounded-lg px-2.5 py-1.5 shadow-sm">
              <img src="/brand/integrations/swiggy.svg" alt="Swiggy" width={14} height={14} />
              <span className="text-xs font-bold" style={{ color: "#FC8019" }}>Swiggy</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-brand-line rounded-lg px-2.5 py-1.5 shadow-sm">
              <img src="/brand/integrations/zomato.svg" alt="Zomato" width={14} height={14} />
              <span className="text-xs font-bold" style={{ color: "#E23744" }}>Zomato</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-brand-line rounded-lg px-2.5 py-1.5 shadow-sm">
              <img src="/brand/integrations/razorpay.svg" alt="Razorpay" width={14} height={14} />
              <span className="text-xs font-bold" style={{ color: "#3395FF" }}>Razorpay</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-[#15803d]">GST-ready</span>
            </span>
          </div>
        </div>

        {/* Visual: phone + floating proof cards */}
        <div
          className="relative"
          data-testid="hero-visual"
        >
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-sand to-brand-green/10 p-4">
            <EditableImage
              block
              id="home.hero.banner_image"
              fallback="/brand/banner.webp"
              alt="MyGenie POS hospitality operating system"
              className="w-full h-[420px] object-contain"
              width={776}
              height={637}
              fetchPriority="high"
              loading="eager"
              srcSet="/brand/banner-mobile.webp 400w, /brand/banner.webp 776w"
              sizes="(max-width: 1023px) 400px, 776px"
            />
          </div>

          <div className="animate-float absolute -left-4 sm:-left-8 top-10 bg-white rounded-2xl px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)]" data-testid="hero-card-profit">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green/12 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-brand-green" /></div>
              <div>
                <p className="font-display text-2xl font-bold text-brand-green leading-none">+25%</p>
                <p className="text-xs text-brand-muted mt-1">more profit</p>
              </div>
            </div>
          </div>

          <div className="animate-float absolute -right-3 sm:-right-6 bottom-12 bg-white rounded-2xl px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)]" style={{ animationDelay: "1.5s" }} data-testid="hero-card-leakage">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/12 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-brand-orange" /></div>
              <div>
                <p className="font-display text-2xl font-bold text-brand-orange leading-none">₹1 Lakh</p>
                <p className="text-xs text-brand-muted mt-1">leakage caught</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
