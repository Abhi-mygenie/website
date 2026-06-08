import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import { EditableText, EditableImage } from "@/components/cms/Editable";

export default function Hero({ onDemo }) {
  return (
    <section id="top" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden" data-testid="hero">
      {/* soft brand glows */}
      <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-brand-green/10 blur-3xl" />
      <div className="absolute top-40 -left-20 w-[360px] h-[360px] rounded-full bg-brand-yellow/15 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 text-brand-orange px-4 py-1.5 text-sm font-semibold"
            data-testid="hero-badge"
          >
            <span className="w-2 h-2 rounded-full bg-brand-orange" />{" "}
            <EditableText id="home.hero.badge" fallback="The Hospitality Operating System" />
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-brand-ink"
          >
            <EditableText id="home.hero.title_lead" fallback="Run a more profitable hospitality business — " />
            <span className="text-brand-green">
              <EditableText id="home.hero.title_accent" fallback="from your phone." />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 text-lg text-brand-muted leading-relaxed max-w-xl"
          >
            <EditableText
              id="home.hero.subtitle"
              rich
              fallback={'MyGenie POS boosts profit by up to <span class="font-bold text-brand-orange">25%</span>,* stops revenue leakage, speeds up service, and gives owners total control of billing, kitchen, inventory, and customers — across every outlet.'}
            />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => onDemo()}
              data-testid="hero-demo-btn"
              className="group bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-4 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_10px_26px_rgba(24,168,74,0.32)] flex items-center gap-2"
            >
              <EditableText id="home.hero.cta_primary" fallback="Book a Free Demo" />
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              to="/pricing"
              data-testid="hero-pricing-btn"
              className="rounded-full px-7 py-4 font-semibold border-2 border-brand-orange/40 text-brand-orange hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all"
            >
              <EditableText id="home.hero.cta_secondary" fallback="See Pricing" />
            </Link>
          </motion.div>

          <p className="mt-4 text-xs text-brand-muted">
            <EditableText id="home.hero.disclaimer" fallback="*Based on internal case studies & partner results. Individual results may vary." />
          </p>
        </div>

        {/* Visual: phone + floating proof cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
          data-testid="hero-visual"
        >
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-sand to-brand-green/10 p-4">
            <EditableImage
              block
              id="home.hero.banner_image"
              fallback="/brand/banner.png"
              alt="MyGenie POS hospitality operating system"
              className="w-full h-[420px] object-contain"
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
        </motion.div>
      </div>
    </section>
  );
}
