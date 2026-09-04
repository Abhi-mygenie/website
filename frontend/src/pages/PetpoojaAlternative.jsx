import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, ChevronUp, Check, CalendarCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import DemoForm from "@/components/site/DemoForm";
import OtpVerifyBlock from "@/components/site/OtpVerifyBlock";
import Reveal from "@/components/site/Reveal";
import StickyMobileCta from "@/components/home/StickyMobileCta";
import Seo from "@/components/site/Seo";
import FaqItem from "@/components/site/FaqItem";
import { SOFTWARE_APP_JSONLD } from "@/lib/seo";
import Logo from "@/components/site/Logo";
import { EditableText } from "@/components/cms/Editable";
import { useContentDoc, useCms } from "@/lib/cms/CmsProvider";
import { pushLead, newEventId, pushEvent } from "@/lib/gtm";
import { getAttribution } from "@/lib/attribution";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { loadCalendly } from "@/lib/calendly";
import { CALENDLY_URL } from "@/data/content";
import {
  VSP_HERO, VSP_STATS, VSP_QUOTES, VSP_AI,
  VSP_COMP_LEAN, VSP_COMP_FULL, VSP_TRUST_LOGOS,
  VSP_SWITCH_BADGES,
} from "@/data/vsp";
import { COMPANY } from "@/data/company";

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question",
      name: "Is MyGenie a better alternative to Petpooja?",
      acceptedAnswer: { "@type": "Answer", text: "MyGenie includes AI insights, CRM, loyalty, and WhatsApp automation in one plan — features that are separate tools or add-ons on Petpooja. Starting at ₹799/outlet/month, MyGenie gives you billing, inventory, kitchen, and customers in a single app." } },
    { "@type": "Question",
      name: "Can I migrate from Petpooja to MyGenie without downtime?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie's onboarding team migrates your menu, inventory, and customer data in under 48 hours. Your Petpooja system keeps running until go-live. No manual re-entry, no downtime." } },
    { "@type": "Question",
      name: "Does MyGenie integrate with Swiggy and Zomato like Petpooja?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. MyGenie syncs with Swiggy, Zomato, and Magicpin — orders flow directly into the POS. Same integrations, same GST compliance, same aggregator sync." } },
    { "@type": "Question",
      name: "What's the main difference between Petpooja and MyGenie?",
      acceptedAnswer: { "@type": "Answer", text: "Petpooja is billing-first. MyGenie is a hospitality OS — billing + inventory + AI + CRM + loyalty in one app, not separate modules. The comparison table above covers 10 features side by side." } },
  ],
};

// ─── QuickDemoSheet constants ─────────────────────────────────────────────────
const QDS_API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const QDS_EMPTY = { name: "", phone: "", email: "", business_name: "" };
const QDS_REQUIRED = ["name", "phone", "email"];

function qdsValidate(field, value) {
  if (field === "phone") {
    return /^\d{10}$/.test((value || "").replace(/\D/g, ""))
      ? null : "Enter a valid 10-digit number";
  }
  if (field === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim())
      ? null : "Enter a valid email address";
  }
  return (value || "").trim() ? null : "This field is required";
}

function qdsBrandedUrl(url) {
  try {
    const u = new URL(url);
    [["background_color","ffffff"],["primary_color","18A84A"],["text_color","14201A"],
     ["hide_gdpr_banner","1"],["hide_landing_page_details","1"],["hide_event_type_details","1"]]
      .forEach(([k, v]) => u.searchParams.set(k, v));
    return u.toString();
  } catch { return url; }
}

// ─── QuickDemoSheet — bottom sheet quick-book form (CR-113) ──────────────────
function QuickDemoSheet({ open, onClose }) {
  const [form, setForm]             = useState(QDS_EMPTY);
  const [errors, setErrors]         = useState({});
  const [stage, setStage]           = useState("form");
  const [lead, setLead]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);
  const { hp, setHp, signals }      = useAntiBot();
  const [eventId]                   = useState(() => newEventId());
  const scheduledRef                = useRef(false);

  // Reset when sheet closes (after close animation completes)
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setForm(QDS_EMPTY); setErrors({}); setStage("form");
        setLead(null); setLoading(false); scheduledRef.current = false;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Calendly postMessage — always popup (sheet is narrow, no CalendlyInline)
  // Mirrors DemoForm mobile path exactly. scheduledRef prevents double-fire.
  useEffect(() => {
    if (stage !== "calendly") return;
    const handler = (e) => {
      if (typeof e.data !== "object" || !e.data) return;
      if (String(e.data.event || "").indexOf("calendly") !== 0) return;
      if (e.data.event === "calendly.event_scheduled" && !scheduledRef.current) {
        scheduledRef.current = true;
        pushLead("demo_booked", form, "petpooja-alternative", eventId, {
          form_location: "quick_book_sheet_calendly",
          otp_verified: true,
        });
        markBooked();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fieldCls = (name) =>
    `w-full rounded-xl border px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus:outline-none transition-all ${
      errors[name]
        ? "border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
        : "border-brand-line bg-brand-sand/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
    }`;

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: qdsValidate(k, v) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    QDS_REQUIRED.forEach((f) => { newErrors[f] = qdsValidate(f, form[f]); });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${QDS_API}/demo-request`, {
        ...form,
        ...signals(),
        event_id: eventId,
        otp_token: null,
        attribution: getAttribution(),
        outlet_type: "petpooja-alternative",
        source_page: "petpooja-quick-book",
      });
      if (res.data?.saved === false) { toast.error("Something went wrong. Please try again."); return; }
      setLead({ id: res.data?.id, contactId: res.data?.freshsales_contact_id });
      // EVENT 1: form_submitted (₹0) — matches DemoForm exactly
      pushLead("form_submitted", form, "petpooja-alternative", eventId, {
        otp_verified: false,
        form_location: "quick_book_sheet",
        lead_quality: leadQuality(signals()),
      });
      setStage("otp");
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const markBooked = async () => {
    setStage("booked");
    toast.success("Demo booked! Check your email for the invite.");
    try {
      await axios.post(`${QDS_API}/demo-booked`, {
        freshsales_contact_id: lead?.contactId ?? null,
        email: form.email || null,
        lead_id: lead?.id ?? null,
      });
    } catch { /* best-effort */ }
  };

  const openCalendly = async () => {
    setPopupLoading(true);
    try {
      await loadCalendly();
      if (!window.Calendly) { toast.error("Could not load booking widget. Please try again."); return; }
      window.Calendly.initPopupWidget({
        url: qdsBrandedUrl(CALENDLY_URL),
        prefill: {
          name: form.name,
          email: form.email,
          customAnswers: {
            a1: form.business_name ? `Biz: ${form.business_name}` : undefined,
            a2: form.phone ? `+91${form.phone.replace(/\D/g, "").slice(-10)}` : undefined,
          },
        },
        utm: {
          utmContent: lead?.contactId ? String(lead.contactId) : undefined,
          utmTerm:    lead?.id        ? String(lead.id)        : undefined,
          utmSource:  "website",
          utmMedium:  "quick_book_sheet",
        },
      });
    } finally { setPopupLoading(false); }
  };

  const stageIdx = ["form", "otp", "calendly"].indexOf(stage);

  return (
    <>
      {/* Backdrop — tap to close only on form stage */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => { if (stage === "form") onClose(); }}
        data-testid="quick-demo-backdrop"
      />
      {/* Sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[70] bg-white rounded-t-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto ${open ? "translate-y-0" : "translate-y-full"}`}
        data-testid="quick-demo-sheet"
      >
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10">
          <div className="w-10 h-1 bg-brand-line rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= Math.min(stageIdx, 2) ? "w-5 bg-brand-green" : "w-1.5 bg-brand-line"}`} />
            ))}
          </div>

          {/* ── BOOKED ── */}
          {stage === "booked" && (
            <div className="text-center py-6" data-testid="quick-demo-booked">
              <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="w-8 h-8 text-brand-green" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-ink">
                You&apos;re booked, {form.name.split(" ")[0]}!
              </h3>
              <p className="text-sm text-brand-muted mt-2 leading-relaxed">
                Google Meet invite is on its way. We&apos;ve sent details on WhatsApp too.
              </p>
            </div>
          )}

          {/* ── CALENDLY ── */}
          {stage === "calendly" && (
            <div data-testid="quick-demo-calendly">
              <h3 className="font-display text-xl font-bold text-brand-ink mb-1">
                Almost there, {form.name.split(" ")[0]} —
              </h3>
              <p className="text-sm text-brand-muted mb-5">
                Pick a time for your free <strong className="text-brand-ink">45-min walkthrough</strong>.
              </p>
              <button
                type="button"
                onClick={openCalendly}
                disabled={popupLoading}
                data-testid="quick-demo-book-slot-btn"
                className="w-full bg-brand-green hover:bg-brand-greenDark text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_8px_22px_rgba(24,168,74,0.32)]"
              >
                {popupLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                  : "Book My Slot →"}
              </button>
            </div>
          )}

          {/* ── OTP ── */}
          {stage === "otp" && (
            <div data-testid="quick-demo-otp">
              <p className="text-xs text-brand-green font-semibold mb-1">Details saved!</p>
              <h3 className="font-display text-xl font-bold text-brand-ink mb-4">Verify your phone</h3>
              <OtpVerifyBlock
                phone={form.phone}
                leadId={lead?.id}
                formType="demo"
                onVerified={() => {
                  // EVENT 2: book_demo → GTM "thankyou_conversion" (₹200)
                  // NO lead_verified push — matches DemoForm exactly (prevents double Meta fire)
                  pushLead("book_demo", form, "petpooja-alternative", eventId, {
                    otp_verified: true,
                    form_location: "quick_book_sheet",
                  });
                  setStage("calendly");
                }}
                onBack={() => setStage("form")}
              />
            </div>
          )}

          {/* ── FORM ── */}
          {stage === "form" && (
            <form onSubmit={submit} data-testid="quick-demo-form">
              <Honeypot value={hp} onChange={setHp} />
              <h3 className="font-display text-xl font-bold text-brand-ink mb-1">Book a Free Demo</h3>
              <p className="text-sm text-brand-muted mb-4">
                45-min walkthrough for your outlet — live, not a slide deck.
              </p>
              <div className="space-y-3">
                {[
                  { key: "name",  placeholder: "Your name *",     type: "text"  },
                  { key: "phone", placeholder: "Phone number *",  type: "tel"   },
                  { key: "email", placeholder: "Email address *", type: "email" },
                ].map(({ key, placeholder, type }) => (
                  <div key={key}>
                    <input
                      type={type}
                      className={fieldCls(key)}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      onBlur={() => setErrors((er) => ({ ...er, [key]: qdsValidate(key, form[key]) }))}
                      data-testid={`quick-demo-input-${key}`}
                    />
                    {errors[key] && (
                      <p className="text-xs text-red-500 mt-1" data-testid={`quick-demo-error-${key}`}>
                        {errors[key]}
                      </p>
                    )}
                  </div>
                ))}
                <input
                  type="text"
                  className={`${fieldCls("business_name")} border-dashed`}
                  placeholder="Business name (optional)"
                  value={form.business_name}
                  onChange={(e) => update("business_name", e.target.value)}
                  data-testid="quick-demo-input-business"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                data-testid="quick-demo-submit-btn"
                className="mt-5 w-full bg-brand-green hover:bg-brand-greenDark text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_8px_22px_rgba(24,168,74,0.32)]"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <>Get My Free Walkthrough <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-brand-muted text-center mt-2">
                No spam. Only used to schedule your demo.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
// ─── Minimal landing Navbar (logo + CTA — CR-113) ─────────────────────────────
function LandingNavbar({ onQuickBook }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.05)]" data-testid="landing-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        <Logo />
        <button
          type="button"
          onClick={onQuickBook}
          data-testid="landing-navbar-book-btn"
          className="bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-full px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(16,184,129,0.3)]"
        >
          Book Free Demo
        </button>
      </div>
    </header>
  );
}

// ─── Minimal landing Footer (logo + contact + privacy — Option A, CR-73) ──────
function LandingFooter() {
  return (
    <footer className="bg-brand-deep border-t border-[#1e4a2e]" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo light />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#5B7A68]">
          <a href={`tel:${COMPANY.phoneIntl}`} className="hover:text-brand-yellow transition-colors" data-testid="landing-footer-phone">{COMPANY.phone}</a>
          <a href={`mailto:${COMPANY.supportEmail}`} className="hover:text-brand-yellow transition-colors" data-testid="landing-footer-email">{COMPANY.supportEmail}</a>
          <Link to="/privacy" className="hover:text-brand-yellow transition-colors" data-testid="landing-footer-privacy">Privacy Policy</Link>
        </div>
        <span className="text-xs text-[#5B7A68]">© {new Date().getFullYear()} MyGenie Technologies Pvt. Ltd.</span>
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
      <span className="inline-block bg-orange-50 border border-orange-200 text-brand-orange text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase">
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
            {/* Mobile stat chips — proof above fold, hidden on desktop (lg+) */}
            <div className="flex gap-3 mb-5 lg:hidden" data-testid="vsp-hero-stat-chips">
              <div className="bg-white border border-brand-line rounded-2xl px-4 py-3 flex-1">
                <div className="font-display text-2xl font-bold text-brand-green leading-none">₹1L</div>
                <div className="text-xs text-brand-muted mt-1 leading-tight">leakage caught in 2 weeks</div>
              </div>
              <div className="bg-white border border-brand-line rounded-2xl px-4 py-3 flex-1">
                <div className="font-display text-2xl font-bold text-brand-orange leading-none">40%</div>
                <div className="text-xs text-brand-muted mt-1 leading-tight">lower fixed costs</div>
              </div>
            </div>
            <h1
              className="font-display text-3xl sm:text-5xl lg:text-[52px] font-bold text-brand-ink leading-[1.1] tracking-tight mb-5"
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
              {VSP_TRUST_LOGOS.slice(0, 4).map((logo) => (
                <img
                  key={logo.name}
                  src={logo.img}
                  alt={logo.name}
                  title={logo.name}
                  className="h-8 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
                  loading="eager"
                  width={120}
                  height={32}
                />
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
              <div className="text-xs font-bold uppercase tracking-widest text-[#5B7A68] mb-4">
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
              <div className="text-xs font-bold uppercase tracking-widest text-brand-yellow mb-4">
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
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[#5B7A68] bg-[#0c2a1a] w-[45%]">Feature</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-green text-center bg-[#0d3318] w-[27.5%]">MyGenie</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[#5B7A68] text-center bg-[#111f17] w-[27.5%]">Petpooja</th>
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
                        <td colSpan={3} className="px-5 py-2 bg-[#0e1e14] text-xs font-bold uppercase tracking-widest text-[#3d5e4a]">
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
                type="button"
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
                <span className="inline-block bg-brand-green/8 border border-brand-green/20 text-brand-greenDark text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4">
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
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md tracking-wide uppercase mb-4 ${
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
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-4 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">
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
                <div className="text-xs font-bold uppercase tracking-widest text-[#5B7A68] mb-3">
                  Running on MyGenie
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  {VSP_TRUST_LOGOS.map((logo) => (
                    <img
                      key={logo.name}
                      src={logo.img}
                      alt={logo.name}
                      title={logo.name}
                      className="h-7 w-auto object-contain opacity-50 hover:opacity-90 transition-opacity"
                      loading="lazy"
                      width={100}
                      height={28}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right — demo form */}
          <Reveal delay={0.1}>
            <div id="vsp-demo" className="bg-white rounded-3xl p-8 sm:p-10 scroll-mt-20" data-testid="vsp-demo-form-wrap">
              <DemoForm sector="petpooja-alternative" shortForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────
export default function PetpoojaAlternative() {
  const [sheetOpen, setSheetOpen] = useState(false);
  // CMS content doc
  const doc = useContentDoc("vsp", {
    hero: VSP_HERO,
    s2: { eyebrow: "Why we exist differently" },
    s3: { video_url: null },
  });

  return (
    <div className="bg-white" data-testid="petpooja-alternative-page">
      <Seo
        title="Best Petpooja Alternative for Restaurants — MyGenie POS"
        description="Comparing Petpooja with MyGenie? See the full feature breakdown, transparent pricing, and real results from restaurant owners who switched. Book a free demo."
        path="/petpooja-alternative"
        jsonLd={[SOFTWARE_APP_JSONLD, FAQ_SCHEMA]}
      />
      <LandingNavbar onQuickBook={() => setSheetOpen(true)} />
      <main>
        <VspHero                    doc={doc} />
        <VspPhilosophy              doc={doc} />
        <VspProof                   doc={doc} />
        <VspAi                      doc={doc} />
        <VspPricing                 doc={doc} />

        {/* CR-137 — FAQPage schema requires matching visible FAQ content */}
        <section className="bg-white py-16 sm:py-24" data-testid="vsp-faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-brand-ink mb-10 text-center">Common questions about switching from Petpooja.</h2>
            </Reveal>
            <div>
              <FaqItem q="Is MyGenie a better alternative to Petpooja?" a="MyGenie includes AI insights, CRM, loyalty, and WhatsApp automation in one plan — features that are separate tools or add-ons on Petpooja. Starting at ₹799/outlet/month, MyGenie gives you billing, inventory, kitchen, and customers in a single app." testid="vsp-faq-0" />
              <FaqItem q="Can I migrate from Petpooja to MyGenie without downtime?" a="Yes. MyGenie's onboarding team migrates your menu, inventory, and customer data in under 48 hours. Your Petpooja system keeps running until go-live. No manual re-entry, no downtime." testid="vsp-faq-1" />
              <FaqItem q="Does MyGenie integrate with Swiggy and Zomato like Petpooja?" a="Yes. MyGenie syncs with Swiggy, Zomato, and Magicpin — orders flow directly into the POS. Same integrations, same GST compliance, same aggregator sync." testid="vsp-faq-2" />
              <FaqItem q="What's the main difference between Petpooja and MyGenie?" a="Petpooja is billing-first. MyGenie is a hospitality OS — billing + inventory + AI + CRM + loyalty in one app, not separate modules. The comparison table above covers 10 features side by side." testid="vsp-faq-3" />
            </div>
          </div>
        </section>

        <VspCta                     doc={doc} />
      </main>
      <LandingFooter />
      <StickyMobileCta onDemo={() => document.getElementById("vsp-demo")?.scrollIntoView({ behavior: "smooth", block: "center" })} />
      <QuickDemoSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
