import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Link } from "react-router-dom";
import DemoForm from "@/components/site/DemoForm";
import Reveal from "@/components/site/Reveal";
import Seo from "@/components/site/Seo";
import Logo from "@/components/site/Logo";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc, useCms } from "@/lib/cms/CmsProvider";
import { pushEvent } from "@/lib/gtm";
import {
  VSP_HERO, VSP_STATS, VSP_QUOTES, VSP_AI,
  VSP_COMP_LEAN, VSP_COMP_FULL, VSP_TRUST_LOGOS,
  VSP_SWITCH_BADGES,
} from "@/data/vsp";

// ─── Minimal landing Navbar (logo only — no exit links) ──────────────────────
function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="landing-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center">
        <Logo />
      </div>
    </header>
  );
}

// ─── Minimal landing Footer (logo + copyright — no outbound links) ────────────
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Logo light />
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd. All rights reserved.</span>
      </div>
    </footer>
  );
}

// ─── PP cell renderer ─────────────────────────────────────────────────────────
function PpCell({ ppType, pp }) {
  if (ppType === "cross")
    return <span className="text-red-500 font-semibold text-sm">{pp}</span>;
  if (ppType === "addon")
    return (
      <span className="inline-block bg-orange-50 border border-orange-200 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">
        Add-on
      </span>
    );
  return <span className="text-amber-500 font-semibold text-sm">{pp}</span>;
}

// ─── S1 — HERO ────────────────────────────────────────────────────────────────
function VspHero({ doc }) {
  const headline = doc.hero?.variant_a ?? VSP_HERO.variant_a;
  const subCopy  = doc.hero?.variant_a_sub ?? VSP_HERO.variant_a_sub;

  return (
    <section
      className="bg-brand-sand pt-32 pb-20 lg:pt-40 relative overflow-hidden"
      data-testid="vsp-hero"
    >
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <h1
              className="font-display text-4xl sm:text-5xl lg:text-[52px] font-bold text-brand-ink leading-[1.1] tracking-tight mb-5"
              data-testid="vsp-hero-headline"
            >
              <EditableText
                id="vsp.hero.variant_a"
                fallback={headline}
                block
              />
            </h1>

            <p className="text-lg text-brand-muted leading-relaxed max-w-[500px] mb-8" data-testid="vsp-hero-sub">
              <EditableText
                id="vsp.hero.variant_a_sub"
                fallback={subCopy}
                multiline
              />
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <a
                href="#vsp-demo"
                className="inline-flex items-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-7 py-3.5 transition-all hover:-translate-y-0.5"
                data-testid="vsp-hero-cta-primary"
              >
                <EditableText id="vsp.hero.cta_primary" fallback={VSP_HERO.cta_primary} />
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#vsp-comparison"
                className="inline-flex items-center gap-2 bg-white border border-brand-line text-brand-ink font-semibold rounded-full px-7 py-3.5 hover:border-brand-green transition-all"
                data-testid="vsp-hero-cta-secondary"
              >
                <EditableText id="vsp.hero.cta_secondary" fallback={VSP_HERO.cta_secondary} />
              </a>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center gap-2" data-testid="vsp-trust-strip">
              <span className="text-xs text-brand-muted font-medium">Trusted by</span>
              {["Hyatt Centric", "Palm Forest Resort", "Love Bites", "The Mill Bakery"].map((name) => (
                <span key={name} className="bg-white border border-brand-line rounded-lg px-3 py-1 text-xs font-semibold text-brand-ink">
                  {name}
                </span>
              ))}
              <span className="text-xs text-brand-muted font-medium">across 75 cities in India</span>
            </div>
          </div>

          {/* Right — stat cards */}
          <div className="grid grid-cols-2 gap-4" data-testid="vsp-stat-cards">
            {[
              { val: "₹1L",   label: "leakage caught in 2 weeks",  color: "text-brand-green" },
              { val: "40%",   label: "lower fixed costs",          color: "text-brand-orange" },
              { val: "24hrs", label: "from sign-up to first bill",  color: "text-brand-green" },
              { val: "+18%",  label: "avg bill value via AI upsell",color: "text-brand-orange" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="bg-white border border-brand-line rounded-3xl p-6">
                  <div className={`font-display text-4xl font-bold leading-none ${s.color}`}>{s.val}</div>
                  <div className="text-sm text-brand-muted mt-2 leading-snug">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── S2 — PHILOSOPHY + COMPARISON TABLE ──────────────────────────────────────
function VspPhilosophy({ doc }) {
  const [expanded, setExpanded] = useState(false);

  function handleExpand() {
    if (!expanded) {
      pushEvent("comparison_expanded", { page: "petpooja-alternative" });
    }
    setExpanded((v) => !v);
  }

  return (
    <section
      className="bg-brand-deep py-20 sm:py-28 relative overflow-hidden"
      id="vsp-comparison"
      data-testid="vsp-philosophy"
    >
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Eyebrow + headline */}
        <Reveal>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-4">
            <EditableText id="vsp.s2.eyebrow" fallback="Why we exist differently" />
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight max-w-3xl mb-5">
            <EditableText
              id="vsp.s2.h2"
              fallback="Billing software records what happened. An OS prevents what shouldn't."
              block
            />
          </h2>
          <p className="text-lg text-[#a3b8ac] max-w-2xl mb-14 leading-relaxed">
            <EditableText
              id="vsp.s2.lead"
              fallback='Most POS tools ask: "how fast can you bill?" We asked: "where is your profit going?" Everything follows from that.'
              multiline
            />
          </p>
        </Reveal>

        {/* Two-col philosophy */}
        <Reveal>
          <div className="grid lg:grid-cols-2 gap-px bg-brand-deepSurface rounded-3xl overflow-hidden mb-10">
            {/* Petpooja col */}
            <div className="bg-[#1a2332] p-8 sm:p-10">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] mb-4">
                Billing Software — Petpooja's starting point
              </div>
              <h3 className="font-display text-xl font-bold text-[#7a9485] mb-6">
                "What did we sell today?"
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: "→", text: "Captures the bill. Manages the counter.", ok: true },
                  { icon: "→", text: "Shows end-of-day sales", ok: true },
                  { icon: "✗", text: "Doesn't say why profit is down", ok: false },
                  { icon: "✗", text: "No real-time waiter ↔ kitchen sync", ok: false },
                  { icon: "✗", text: "Customer leaves — you don't know who", ok: false },
                  { icon: "✗", text: "Inventory, expenses, CRM are separate tools", ok: false },
                ].map((item, i) => (
                  <li key={i} className={`flex gap-3 text-sm leading-relaxed ${item.ok ? "text-[#5B7A68]" : "text-[#5B7A68]"}`}>
                    <span className="flex-shrink-0 w-5 mt-0.5">{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* MyGenie col */}
            <div className="bg-[#0d2818] p-8 sm:p-10">
              <div className="text-[11px] font-bold uppercase tracking-widest text-brand-yellow mb-4">
                MyGenie — Hospitality Operating System
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-6">
                "Where is every rupee going — and why?"
              </h3>
              <ul className="space-y-3">
                {[
                  "Billing — any device, no hardware needed",
                  "Inventory — recipe-level cost per dish",
                  "Expenses — P&L per table, shift, outlet",
                  "Customers — CRM, loyalty, WhatsApp, included",
                  "Operations — prep time tracked, kitchen synced live",
                  "AI layer — auditing every number, flagging every leak",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#c8e6d5] leading-relaxed">
                    <span className="flex-shrink-0 text-brand-green font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Comparison table */}
        <Reveal delay={0.1}>
          <p className="text-sm font-semibold text-[#5B7A68] mb-4">
            Six features. One table. The clearest way to see the difference.
          </p>
          <div className="bg-[#0c2a1a] border border-[#1e4a2e] rounded-3xl overflow-hidden">
            <table className="w-full border-collapse" data-testid="vsp-comparison-table">
              <thead>
                <tr className="border-b border-[#1e4a2e]">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] bg-[#0c2a1a] w-[45%]">Feature</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-brand-green text-center bg-[#0d3318] w-[27.5%]">MyGenie</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] text-center bg-[#111f17] w-[27.5%]">Petpooja</th>
                </tr>
              </thead>
              <tbody>
                {VSP_COMP_LEAN.map((row, i) => (
                  <tr key={row.id} className={i < VSP_COMP_LEAN.length - 1 ? "border-b border-[#0e2518]" : ""}>
                    <td className="px-5 py-3.5 bg-[#0c2a1a]">
                      <span className="text-sm font-semibold text-[#d4e8dc]">{row.feature}</span>
                      {row.sub && <span className="block text-xs text-[#5B7A68] mt-0.5">{row.sub}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center bg-[#0a2210] text-sm font-semibold text-[#86efac]">{row.mg}</td>
                    <td className="px-5 py-3.5 text-center bg-[#0e1e14]"><PpCell ppType={row.ppType} pp={row.pp} /></td>
                  </tr>
                ))}

                {/* Expanded rows */}
                {expanded && VSP_COMP_FULL.map((row, i) => (
                  <>
                    {row.cat && (
                      <tr key={`cat-${row.id}`} className="border-t border-[#1e4a2e]">
                        <td colSpan={3} className="px-5 py-2 bg-[#0e1e14] text-[10px] font-bold uppercase tracking-widest text-[#3d5e4a]">
                          {row.cat}
                        </td>
                      </tr>
                    )}
                    <tr key={row.id} className={i < VSP_COMP_FULL.length - 1 ? "border-b border-[#0e2518]" : ""}>
                      <td className="px-5 py-3.5 bg-[#0c2a1a]">
                        <span className="text-sm font-semibold text-[#d4e8dc]">{row.feature}</span>
                        {row.sub && <span className="block text-xs text-[#5B7A68] mt-0.5">{row.sub}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center bg-[#0a2210] text-sm font-semibold text-[#86efac]">{row.mg}</td>
                      <td className="px-5 py-3.5 text-center bg-[#0e1e14]"><PpCell ppType={row.ppType} pp={row.pp} /></td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>

            {/* Expand / collapse */}
            <div className="border-t border-[#1e4a2e] px-5 py-3.5 flex justify-center">
              <button
                onClick={handleExpand}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-green bg-brand-green/10 border border-brand-green/25 hover:bg-brand-green/20 px-5 py-2 rounded-lg transition-all"
                data-testid="vsp-expand-table"
              >
                {expanded ? (
                  <><ChevronUp className="w-4 h-4" /> Hide full comparison</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> See full comparison (10 features)</>
                )}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── S3 — PROOF WALL ──────────────────────────────────────────────────────────
function VspProof({ doc }) {
  const { isAdmin } = useCms();
  const videoUrl = doc.s3?.video_url || null;
  const showVideo = !!videoUrl;

  return (
    <section className="bg-white py-20 sm:py-28" data-testid="vsp-proof">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Verified results</span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight mb-3">
            <EditableText id="vsp.s3.h2" fallback="Real numbers. Named restaurants." block />
          </h2>
          <p className="text-lg text-brand-muted mb-12">
            <EditableText id="vsp.s3.sub" fallback="No industry benchmarks. No projections. Owner-reported outcomes only." multiline />
          </p>
        </Reveal>

        {/* 3 stat cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {VSP_STATS.map((s, i) => (
            <Reveal key={s.key} delay={i * 0.08}>
              <div className="bg-brand-sand border border-brand-line rounded-3xl p-7" data-testid={`vsp-stat-${s.key}`}>
                <div className={`font-display text-5xl font-bold leading-none mb-3 ${s.color === "orange" ? "text-brand-orange" : "text-brand-green"}`}>
                  <EditableText id={`vsp.s3.${s.key}.val`} fallback={s.val} />
                </div>
                <div className="text-base font-bold text-brand-ink mb-2">
                  <EditableText id={`vsp.s3.${s.key}.title`} fallback={s.title} />
                </div>
                <p className="text-sm text-brand-muted leading-relaxed mb-4">
                  <EditableText id={`vsp.s3.${s.key}.desc`} fallback={s.desc} multiline />
                </p>
                <div className={`flex items-center gap-2 text-xs font-semibold ${s.color === "orange" ? "text-brand-orange" : "text-brand-green"}`}>
                  <span className="block w-4 h-0.5 bg-current" />
                  <EditableText id={`vsp.s3.${s.key}.source`} fallback={s.source} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* 16:9 video block — hidden until S3 URL is set (visible in admin mode) */}
        {showVideo && (
        <Reveal>
          <div className="rounded-3xl overflow-hidden mb-12 bg-brand-deep" data-testid="vsp-video-block">
            <div className="relative" style={{ aspectRatio: "16/9" }}>
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  poster="/brand/vidban.jpg"
                  className="w-full h-full object-cover"
                  data-testid="vsp-video-player"
                />
              ) : (
                /* Admin-only placeholder until video is filmed & uploaded to S3 */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-deep">
                  <div className="w-16 h-16 rounded-full bg-brand-green/20 flex items-center justify-center mb-4">
                    <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-l-[20px] border-t-transparent border-b-transparent border-l-white/50 ml-1" />
                  </div>
                  <p className="text-sm text-[#5B7A68] text-center px-6">Video not yet uploaded</p>
                </div>
              )}
            </div>
            {/* CMS-editable video caption / URL field */}
            <div className="px-6 py-4 bg-brand-deep/80 flex items-center gap-3 border-t border-brand-green/20">
              <span className="text-brand-yellow text-sm">
                {videoUrl ? (
                  <EditableText id="vsp.s3.video_caption" fallback="5 restaurant owners on switching from Petpooja to MyGenie." multiline />
                ) : (
                  <EditableText
                    id="vsp.s3.video_url"
                    fallback="[Admin: Paste S3 video URL here to publish the video section]"
                    multiline
                  />
                )}
              </span>
            </div>
          </div>
        </Reveal>
        )}

        {/* 3 quote cards */}
        <div className="grid sm:grid-cols-3 gap-5">
          {VSP_QUOTES.map((q, i) => (
            <Reveal key={q.key} delay={i * 0.08}>
              <div
                className="border border-brand-line rounded-3xl p-7 border-l-4 border-l-brand-green"
                data-testid={`vsp-quote-${q.key}`}
              >
                <span className="inline-block bg-brand-green/8 border border-brand-green/20 text-brand-greenDark text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4">
                  Switched from Petpooja
                </span>
                <blockquote className="text-sm text-brand-muted leading-relaxed italic mb-5">
                  <EditableText id={`vsp.s3.${q.key}.text`} fallback={`"${q.text}"`} multiline />
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-sand border border-brand-line flex items-center justify-center text-sm font-bold text-brand-greenDark">
                    {q.initial}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-brand-ink">
                      <EditableText id={`vsp.s3.${q.key}.name`} fallback={q.name} />
                    </div>
                    <div className="text-xs text-brand-muted">
                      <EditableText id={`vsp.s3.${q.key}.outlet`} fallback={q.outlet} />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── S4 — AI ──────────────────────────────────────────────────────────────────
function VspAi({ doc }) {
  return (
    <section className="bg-brand-sand py-20 sm:py-28" data-testid="vsp-ai">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-14">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-orange mb-4">
                The section Petpooja doesn't have
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight">
                <EditableText
                  id="vsp.s4.h2"
                  fallback={"Petpooja gives you reports.\nMyGenie gives you answers."}
                  block
                />
              </h2>
            </div>
            <p className="text-brand-muted text-base max-w-xs lg:text-right">
              <EditableText
                id="vsp.s4.punch"
                fallback="All 7 AI features in the Pro plan. No separate AI license."
                multiline
              />
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-6">
          {VSP_AI.map((ai, i) => (
            <Reveal key={ai.key} delay={i * 0.1}>
              <div
                className={`bg-white border border-brand-line rounded-3xl p-7 relative overflow-hidden ${ai.color === "orange" ? "before:bg-brand-orange" : "before:bg-brand-green"}`}
                data-testid={`vsp-ai-${ai.key}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${ai.color === "orange" ? "bg-brand-orange" : "bg-brand-green"}`} />
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4 ${
                  ai.color === "orange"
                    ? "bg-orange-50 border border-orange-200 text-brand-orange"
                    : "bg-brand-green/8 border border-brand-green/20 text-brand-greenDark"
                }`}>
                  AI in Pro
                </span>
                <div className={`font-display text-6xl font-bold leading-none mb-3 ${ai.color === "orange" ? "text-brand-orange" : "text-brand-green"}`}>
                  <EditableText id={`vsp.s4.${ai.key}.metric`} fallback={ai.metric} />
                </div>
                <div className="text-base font-bold text-brand-ink mb-2">
                  <EditableText id={`vsp.s4.${ai.key}.title`} fallback={ai.title} />
                </div>
                <p className="text-sm text-red-500 font-medium mb-2">
                  <EditableText id={`vsp.s4.${ai.key}.before`} fallback={ai.before} multiline />
                </p>
                <p className="text-sm text-brand-muted leading-relaxed">
                  <EditableText id={`vsp.s4.${ai.key}.after`} fallback={ai.after} multiline />
                </p>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── S5 — PRICING ─────────────────────────────────────────────────────────────
function VspPricing({ doc }) {
  const plans = [
    {
      name: "Starter",
      price: "₹799",
      billing: "Billed annually · ₹9,588/yr per outlet",
      feats: ["POS & Billing", "KOT", "Owner Dashboard", "Daily reports"],
      pop: false,
    },
    {
      name: "Growth",
      price: "₹1,299",
      billing: "Billed annually · ₹15,588/yr per outlet",
      feats: ["Everything in Starter", "Captain App + KDS", "Online Ordering", "CRM + Aggregator Sync"],
      pop: true,
    },
    {
      name: "Pro",
      price: "₹2,499",
      billing: "Billed annually · ₹29,988/yr per outlet",
      feats: ["Everything in Growth", "Loyalty + Wallet (included)", "WhatsApp Automation (included)", "All 7 AI features (included)", "Dedicated account manager"],
      pop: false,
    },
  ];

  return (
    <section className="bg-white py-20 sm:py-28" data-testid="vsp-pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-green mb-4">Nothing to hide</span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-ink leading-[1.1] tracking-tight">
                <EditableText id="vsp.s5.h2" fallback="Our prices. Right here." block />
              </h2>
            </div>

          </div>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div
                className={`border rounded-3xl p-8 relative ${plan.pop ? "border-brand-green shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" : "border-brand-line"}`}
                data-testid={`vsp-plan-${plan.name.toLowerCase()}`}
              >
                {plan.pop && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[9px] font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <div className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-2">{plan.name}</div>
                <div className="font-display text-5xl font-bold text-brand-ink leading-none mb-1">
                  {plan.price}<span className="text-sm font-normal text-brand-muted font-sans">/outlet/mo</span>
                </div>
                <div className="text-xs text-brand-muted mb-6">{plan.billing}</div>
                <ul className="space-y-2.5 mb-7">
                  {plan.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-brand-ink">
                      <Check className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#vsp-demo"
                  className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all ${
                    plan.pop
                      ? "bg-brand-green hover:bg-brand-greenDark text-white"
                      : "border border-brand-green text-brand-green hover:bg-brand-green/8"
                  }`}
                  data-testid={`vsp-plan-cta-${plan.name.toLowerCase()}`}
                >
                  Get Started
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── S6 — SWITCH BADGES + DEMO FORM ──────────────────────────────────────────
function VspCta({ doc }) {
  return (
    <section
      id="vsp-demo"
      className="bg-brand-deep py-20 sm:py-28 relative overflow-hidden"
      data-testid="vsp-cta"
    >
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <Reveal>
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-5">
                The switch is easier than you think
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-4">
                <EditableText
                  id="vsp.s6.h2"
                  fallback="See if MyGenie is the right switch for your restaurant."
                  block
                />
              </h2>
              <p className="text-lg text-[#a3b8ac] mb-10">
                <EditableText
                  id="vsp.s6.sub"
                  fallback="A specialist walks you through your outlet type — live, not a slide deck."
                  multiline
                />
              </p>

              {/* Switch badges */}
              <div className="space-y-3 mb-10">
                {VSP_SWITCH_BADGES.map((badge, i) => (
                  <div key={i} className="flex items-center gap-4 bg-brand-deepSurface border border-[#2a5e3a] rounded-2xl px-5 py-4" data-testid={`vsp-switch-badge-${i}`}>
                    <div className="w-10 h-10 bg-brand-green/15 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {badge.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{badge.title}</div>
                      <div className="text-xs text-[#a3b8ac] mt-0.5">{badge.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Logo strip */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#5B7A68] mb-3">
                  Running on MyGenie
                </div>
                <div className="flex flex-wrap gap-2">
                  {VSP_TRUST_LOGOS.map((name) => (
                    <span key={name} className="bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#a3b8ac]">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right — demo form */}
          <Reveal delay={0.1}>
            <div className="bg-white rounded-3xl p-8 sm:p-10" data-testid="vsp-demo-form-wrap">
              <DemoForm sector="petpooja-alternative" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────
export default function PetpoojaAlternative() {
  // CMS content doc
  const doc = useContentDoc("vsp", {
    hero: VSP_HERO,
    s2: { eyebrow: "Why we exist differently" },
    s3: { video_url: null },
  });

  return (
    <div className="bg-white" data-testid="petpooja-alternative-page">
      <Seo
        title="MyGenie vs Petpooja — The honest POS comparison | MyGenie"
        description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
        path="/petpooja-alternative"
      />
      <LandingNavbar />
      <main>
        <VspHero                    doc={doc} />
        <VspPhilosophy              doc={doc} />
        <VspProof                   doc={doc} />
        <VspAi                      doc={doc} />
        <VspPricing                 doc={doc} />
        <VspCta                     doc={doc} />
      </main>
      <LandingFooter />
    </div>
  );
}
