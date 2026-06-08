import { useState } from "react";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SECTORS } from "@/data/content";
import Reveal from "@/components/site/Reveal";

export default function SectorSelector({ onSectorDemo }) {
  const [active, setActive] = useState(0);
  const s = SECTORS[active];
  const ActiveIcon = Icons[s.icon] || Icons.Store;

  return (
    <section id="sectors" className="bg-brand-sand py-24 sm:py-28" data-testid="sector-selector">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-green">Built for your business</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">
              One operating system. Every kind of outlet.
            </h2>
            <p className="mt-4 text-lg text-brand-muted">From a single café to a multi-city chain — pick your business and see how MyGenie fits.</p>
          </div>
        </Reveal>

        <div className="mt-12 grid lg:grid-cols-12 gap-6">
          {/* sector pills */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3" data-testid="sector-list">
            {SECTORS.map((sec, i) => {
              const Icon = Icons[sec.icon] || Icons.Store;
              const on = i === active;
              return (
                <button
                  key={sec.slug}
                  onClick={() => setActive(i)}
                  data-testid={`sector-tab-${sec.slug}`}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all border ${
                    on ? "bg-brand-green border-brand-green text-white shadow-[0_10px_24px_rgba(24,168,74,0.28)]" : "bg-white border-brand-line text-brand-ink hover:border-brand-green/40"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${on ? "text-white" : "text-brand-green"}`} />
                  <span className="font-semibold text-[14px] leading-tight">{sec.name}</span>
                </button>
              );
            })}
          </div>

          {/* active panel */}
          <div className="lg:col-span-7">
            <div className="h-full bg-brand-deep text-white rounded-3xl p-9 sm:p-11 relative overflow-hidden" data-testid="sector-panel">
              <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-brand-green/20 blur-3xl" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-brand-green/20 flex items-center justify-center">
                  <ActiveIcon className="w-7 h-7 text-brand-green" />
                </div>
                <h3 className="font-display text-3xl font-bold mt-6">{s.name}</h3>
                <p className="mt-4 text-xl text-[#C7D2CB] leading-relaxed max-w-lg">{s.line}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/solutions/${s.slug}`}
                    data-testid={`sector-explore-${s.slug}`}
                    className="group inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-3.5 font-semibold transition-all hover:-translate-y-0.5"
                  >
                    Explore {s.name}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    onClick={() => onSectorDemo(s.name)}
                    data-testid={`sector-demo-${s.slug}`}
                    className="inline-flex items-center gap-2 border-2 border-white/25 text-white hover:bg-white/10 rounded-full px-6 py-3.5 font-semibold transition-all"
                  >
                    Book a Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
