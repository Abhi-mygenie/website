import * as Icons from "lucide-react";
import { Sparkles, ArrowRight } from "lucide-react";
import { AI_USECASES } from "@/data/content";
import { Link } from "react-router-dom";
import Reveal from "@/components/site/Reveal";

export default function AIBand() {
  return (
    <section id="ai" className="bg-brand-deep text-brand-sand py-24 sm:py-28" data-testid="ai-band">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-yellow">
              <Sparkles className="w-4 h-4" /> Practical AI
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mt-3 tracking-tight">
              AI that works on the floor — not in a pitch deck.
            </h2>
            <p className="mt-4 text-lg text-[#C7D2CB] leading-relaxed">
              MyGenie uses practical AI to save you time, cut errors, understand your customers, and help you make
              smarter money decisions. No hype. No buzzwords. Just results you can see in your reports.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AI_USECASES.map((u, i) => {
            const Icon = Icons[u.icon] || Icons.Sparkles;
            const orange = i % 2 === 1;
            return (
              <Reveal key={u.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-7 hover:bg-white/[0.07] hover:border-brand-green/40 transition-all" data-testid={`ai-usecase-${i}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${orange ? "bg-brand-orange/25" : "bg-brand-green/20"}`}>
                    <Icon className={`w-5 h-5 ${orange ? "text-brand-orange" : "text-brand-green"}`} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mt-4 text-white">{u.title}</h3>
                  <p className="mt-2 text-[#C7D2CB] leading-relaxed text-[15px]">{u.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <Link to="/ai" data-testid="ai-band-explore" className="group mt-10 inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3.5 font-semibold transition-all hover:-translate-y-0.5">
            Explore Practical AI <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
