import { Link } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Smartphone, TrendingUp, Headset } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";

const VALUES = [
  { icon: "TrendingUp", title: "Profit-first", desc: "We exist to grow your bottom line — every feature ties back to your money." },
  { icon: "ShieldCheck", title: "Protection", desc: "We guard against leakage, theft, waste and errors that quietly eat margin." },
  { icon: "Smartphone", title: "Total control", desc: "Run and watch every outlet live, from your phone — from anywhere." },
  { icon: "Headset", title: "Real support", desc: "A dedicated account manager who knows your business, not a ticket queue." },
];
const ICONS = { TrendingUp, ShieldCheck, Smartphone, Headset };

export default function About() {
  const seo = PAGE_SEO["/about"];
  return (
    <div className="bg-white" data-testid="about-page">
      <Seo title={seo.title} description={seo.description} path="/about" />
      <Navbar />
      <main>
        <section className="pt-32 pb-16 lg:pt-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">About MyGenie</span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight leading-[1.1]">
                The only app you need to run your hospitality business — smoothly and profitably.
              </h1>
              <p className="mt-5 text-lg text-brand-muted leading-relaxed">
                MyGenie is a hospitality operating system that streamlines your whole operation — from order collection to processing to bill collection — all managed from your phone or screens.
              </p>
              <p className="mt-4 text-lg text-brand-muted leading-relaxed">
                It creates an ecosystem for quick, real-time communication between the kitchen, bar and waiters, and surfaces valuable insights into fast and slow-moving products, customer experience and revenue — so you manage every outlet hyper-efficiently.
              </p>
              <Link to="/customers" className="mt-8 inline-flex items-center gap-2 font-semibold text-brand-green hover:underline" data-testid="about-stories-link">
                See real customer results <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <Reveal>
              <div className="relative rounded-[2rem] overflow-hidden bg-brand-deep p-10 min-h-[380px] flex flex-col justify-between">
                <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-brand-green/25 blur-3xl" />
                <p className="relative font-display text-2xl font-bold text-white max-w-xs leading-snug">More profit. Less chaos. Total control.</p>
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl px-5 py-4"><p className="font-display text-3xl font-bold text-brand-green leading-none">25%</p><p className="text-xs text-brand-muted mt-1">more profit*</p></div>
                  <div className="bg-white rounded-2xl px-5 py-4"><p className="font-display text-3xl font-bold text-brand-orange leading-none">₹1L</p><p className="text-xs text-brand-muted mt-1">theft caught in 2 weeks</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-20 bg-brand-sand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">What we stand for.</h2>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {VALUES.map((v, i) => {
                const Icon = ICONS[v.icon];
                const orange = i % 2 === 1;
                return (
                  <Reveal key={v.title} delay={i * 0.05}>
                    <div className="h-full bg-white rounded-2xl border border-brand-line p-6" data-testid={`about-value-${i}`}>
                      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${orange ? "bg-brand-orange/10" : "bg-brand-green/10"}`}>
                        <Icon className={`w-6 h-6 ${orange ? "text-brand-orange" : "text-brand-green"}`} />
                      </span>
                      <h3 className="font-display text-lg font-semibold mt-4 text-brand-ink">{v.title}</h3>
                      <p className="text-sm text-brand-muted mt-1.5 leading-relaxed">{v.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink tracking-tight">See MyGenie built for your business.</h2>
                <p className="mt-4 text-lg text-brand-muted leading-relaxed">Tell us your outlet type and we&apos;ll show you a tailored walkthrough — not a generic demo.</p>
                <ul className="mt-6 space-y-3">
                  {["Mobile-first — go live in under 48 hours", "Works offline, syncs automatically", "One OS for billing, kitchen, rooms and customers"].map((b) => (
                    <li key={b} className="flex gap-2 text-brand-ink"><Check className="w-5 h-5 text-brand-green shrink-0" strokeWidth={3} /> {b}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}><DemoForm /></Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
