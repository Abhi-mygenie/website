import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CalendarCheck, Loader2, ArrowRight } from "lucide-react";
import { OUTLET_TYPES, CALENDLY_URL } from "@/data/content";
import CalendlyInline from "@/components/site/CalendlyInline";
import OtpVerifyBlock from "@/components/site/OtpVerifyBlock";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";
import { pushLead, newEventId } from "@/lib/gtm";
import { ensureCalendlyCss } from "@/lib/calendlyCss";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", phone: "", email: "", outlet_type: "", business_name: "", city: "", years_in_business: "" };
const REQUIRED = ["name", "phone", "email", "business_name", "years_in_business"];

const BRAND_PARAMS = {
  background_color: "ffffff", primary_color: "18A84A",
  text_color: "14201A", hide_gdpr_banner: "1",
  hide_landing_page_details: "1", hide_event_type_details: "1",
};

function loadCalendlyScript() {
  // CR-50: ensure our overlay/popup CSS is present in the parent document.
  // Calendly's widget.js no longer self-injects it (as of 2026-07-05), which
  // was making the popup invisible (position:static at page bottom).
  ensureCalendlyCss();
  const SRC = "https://assets.calendly.com/assets/external/widget.js";
  return new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const ex = document.querySelector(`script[src="${SRC}"]`);
    if (ex) { ex.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = SRC; s.async = true; s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

function brandedUrl(url) {
  try {
    const u = new URL(url);
    Object.entries(BRAND_PARAMS).forEach(([k, v]) => u.searchParams.set(k, v));
    return u.toString();
  } catch { return url; }
}

function validate(field, value) {
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

function StageProgress({ stage }) {
  const idx = ["form", "otp", "calendly"].indexOf(stage);
  return (
    <div className="flex gap-1.5 mb-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= idx ? "w-5 bg-brand-green" : "w-1.5 bg-brand-line"}`} />
      ))}
    </div>
  );
}

export default function DemoForm({ sector, shortForm = false }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState("form");
  const [lead, setLead] = useState(null);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { hp, setHp, signals } = useAntiBot();
  const [eventId] = useState(() => newEventId());
  const [popupLoading, setPopupLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const scheduledRef = useRef(false);
  const otpCardRef = useRef(null);

  const outletValue = sector || form.outlet_type;
  const fieldCls = (name) => `w-full rounded-xl border px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus:outline-none transition-all ${
    errors[name] ? "border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : "border-brand-line bg-brand-sand/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
  }`;

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: validate(k, v) }));
  };

  const blur = (k) => setErrors((e) => ({ ...e, [k]: validate(k, form[k]) }));

  // Reactive isMobile — updates on orientation change
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Scroll OTP card into view when stage changes to otp
  useEffect(() => {
    if (stage === "otp" && otpCardRef.current) {
      setTimeout(() => {
        otpCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [stage]);

  // Calendly event listener — mobile popup path only (Fix #4 / G1)
  // On desktop, CalendlyInline mounts and owns its own postMessage listener,
  // so this handler would double-fire demo_booked. Restrict to mobile only.
  useEffect(() => {
    if (stage !== "calendly") return;
    if (!isMobile) return;
    const handler = (e) => {
      if (typeof e.data !== "object" || !e.data) return;
      if (String(e.data.event || "").indexOf("calendly") !== 0) return;
      if (e.data.event === "calendly.event_scheduled" && !scheduledRef.current) {
        scheduledRef.current = true;
        pushLead("demo_booked", form, outletValue, eventId, {
          form_location: "calendly_popup",
          otp_verified: true,
        });
        markBooked();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [stage, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const required = shortForm ? ["name", "phone", "email"] : REQUIRED;
    required.forEach((f) => { newErrors[f] = validate(f, form[f]); });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/demo-request`, {
        ...form,
        ...signals(),
        event_id: eventId,
        otp_token: null,
        attribution: getAttribution(),
        outlet_type: outletValue,
        source_page: sector ? `sector:${sector}` : "homepage",
      });
      if (res.data?.saved === false) { toast.error("Something went wrong. Please try again."); return; }
      setLead({ id: res.data?.id, contactId: res.data?.freshsales_contact_id });
      pushLead("form_submitted", form, outletValue, eventId, {
        otp_verified: false,
        form_location: sector ? `sector:${sector}` : "homepage",
        lead_quality: leadQuality(signals()),
      });
      setStage("otp");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markBooked = async () => {
    setBooked(true);
    toast.success("Demo booked! Check your email for the invite.");
    try {
      await axios.post(`${API}/demo-booked`, {
        freshsales_contact_id: lead?.contactId ?? null,
        email: form.email || null,
        lead_id: lead?.id ?? null,
      });
    } catch { /* best-effort */ }
  };

  const openPopup = async () => {
    setPopupLoading(true);
    try {
      await loadCalendlyScript();
      const url = brandedUrl(CALENDLY_URL);
      if (!window.Calendly) {
        toast.error("Could not load booking widget. Please try again.");
        return;
      }
      // CR-50 follow-up: `showPopupWidget(url, opts)` crashes with
      // `this.embedType.toLowerCase is not a function` in the currently-served
      // widget.js — the second arg is walked for an `embedType` property that
      // doesn't exist on our shape. `initPopupWidget({url, ...})` is Calendly's
      // documented API for popup-with-options and accepts the same
      // prefill/utm shape byte-for-byte.
      window.Calendly.initPopupWidget({
        url,
        prefill: {
          name: form.name,
          email: form.email,
          customAnswers: {
            a1: [outletValue && `Outlet: ${outletValue}`, form.business_name && `Biz: ${form.business_name}`].filter(Boolean).join(" | ") || undefined,
            a2: form.phone ? `+91${form.phone.replace(/\D/g,"").slice(-10)}` : undefined,
          },
        },
        utm: {
          utmContent: lead?.contactId ? String(lead.contactId) : undefined,
          utmTerm:    lead?.id        ? String(lead.id)        : undefined,
          utmSource:  "website",
          utmMedium:  "demo_form_mobile",
        },
      });
    } finally {
      setPopupLoading(false);
    }
  };

  const cardCls = "bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.1)]";

  // ─── Booked confirmation ─────────────────────────────────────────────
  if (booked) {
    return (
      <div className={`${cardCls} text-center`} data-testid="demo-booked">
        <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
          <CalendarCheck className="w-9 h-9 text-brand-green" />
        </div>
        <h3 className="font-display text-2xl font-bold mt-5 text-brand-ink">
          You&apos;re booked, {form.name.split(" ")[0]}!
        </h3>
        <p className="mt-3 text-brand-muted leading-relaxed">
          Your Google Meet invite is on its way to your inbox, and we've sent the details on WhatsApp too.
        </p>
        <p className="mt-2 text-brand-muted leading-relaxed">
          See you soon — our specialist will walk you through MyGenie for your
          {outletValue ? <span className="font-semibold text-brand-ink"> {outletValue} </span> : " "}business.
        </p>
      </div>
    );
  }

  // ─── Calendly stage ──────────────────────────────────────────────────
  if (stage === "calendly") {
    return (
      <div className={cardCls} data-testid="demo-success">
        <StageProgress stage="calendly" />
        <div className="text-center mb-5">
          <h3 className="font-display text-2xl font-bold text-brand-ink">
            Almost there, {form.name.split(" ")[0]} — pick your slot
          </h3>
          <p className="mt-2 text-sm text-brand-muted leading-relaxed">
            Choose a time for your free <span className="font-semibold text-brand-ink">45-minute walkthrough</span>.
          </p>
        </div>
        {isMobile ? (
          <button
            onClick={openPopup}
            disabled={popupLoading}
            data-testid="demo-book-slot-btn"
            className="w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.32)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {popupLoading
              ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading...</>
              : "Book My Slot"}
          </button>
        ) : (
          // CR-50: bleed the widget past the card padding at md/lg so Calendly
          // gets ≥ 640 px inner width and renders wide "Select a Date & Time"
          // layout (narrow < 550 px triggers a 150 px iframe stub — the bug).
          <div className="-mx-3 sm:-mx-6 md:-mx-8 lg:-mx-9">
            <CalendlyInline
              url={CALENDLY_URL}
              eventId={eventId}
              leadContext={{ ...form, outlet_type: outletValue, sector: outletValue, otp_verified: true }}
              prefill={{
                name: form.name,
                email: form.email,
                customAnswers: {
                  a1: [outletValue && `Outlet: ${outletValue}`, form.business_name && `Business: ${form.business_name}`, form.city && `City: ${form.city}`].filter(Boolean).join(" | ") || undefined,
                  a2: form.phone ? `+91${form.phone.replace(/\D/g, "").slice(-10)}` : undefined,
                },
              }}
              utm={{ utmContent: lead?.contactId ? String(lead.contactId) : undefined, utmTerm: lead?.id ? String(lead.id) : undefined, utmSource: "website", utmMedium: "demo_form" }}
              onScheduled={markBooked}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── OTP stage ───────────────────────────────────────────────────────
  if (stage === "otp") {
    return (
      <div ref={otpCardRef} className={cardCls} data-testid="demo-otp">
        <StageProgress stage="otp" />
        <p className="text-xs text-brand-green font-medium mb-1">Details saved!</p>
        <h3 className="font-display text-xl font-bold text-brand-ink mb-5">Verify your phone</h3>
        <OtpVerifyBlock
          phone={form.phone}
          leadId={lead?.id}
          formType="demo"
          onVerified={() => {
            // Fix #3 (G3): removed duplicate lead_verified push (fired Meta Lead 2x when combined with book_demo).
            // book_demo → GTM "thankyou_conversion" already fires Meta Lead + GA4 + Google Ads with one clean event.
            pushLead("book_demo", form, outletValue, eventId, { otp_verified: true, form_location: sector ? `sector:${sector}` : "homepage" });
            setStage("calendly");
          }}
          onBack={() => setStage("form")}
        />
      </div>
    );
  }

  // ─── Form stage ──────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className={cardCls} data-testid="demo-form">
      <StageProgress stage="form" />
      <h3 className="font-display text-2xl font-bold text-brand-ink">Book a Free Demo</h3>
      <p className="text-sm text-brand-muted mt-1.5 mb-5">A specialist will show you exactly how MyGenie works for your outlet.</p>
      <Honeypot value={hp} onChange={setHp} />

      <div className="space-y-3.5">
        {[
          { key: "name", placeholder: "Your name *", type: "text" },
          { key: "phone", placeholder: "Phone number *", type: "tel" },
          { key: "email", placeholder: "Email address *", type: "email" },
          { key: "business_name", placeholder: shortForm ? "Business name (optional)" : "Business name *", type: "text" },
        ].map(({ key, placeholder, type }) => (
          <div key={key}>
            <input
              type={type}
              className={fieldCls(key)}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              onBlur={() => blur(key)}
              data-testid={`demo-input-${key}`}
            />
            {errors[key] && <p className="text-xs text-red-500 mt-1" data-testid={`demo-error-${key}`}>{errors[key]}</p>}
          </div>
        ))}

        {!shortForm && (
        <div>
          <select
            className={fieldCls("years_in_business")}
            value={form.years_in_business}
            onChange={(e) => update("years_in_business", e.target.value)}
            onBlur={() => blur("years_in_business")}
            data-testid="demo-select-years"
          >
            <option value="">Years in business *</option>
            <option value="yet-to-open">Yet to open</option>
            <option value="0-2">0 – 2 years</option>
            <option value="2+">2+ years</option>
          </select>
          {errors.years_in_business && <p className="text-xs text-red-500 mt-1" data-testid="demo-error-years">{errors.years_in_business}</p>}
        </div>
        )}

        {!sector && (
          <select className={fieldCls("outlet_type")} value={form.outlet_type} onChange={(e) => update("outlet_type", e.target.value)} data-testid="demo-select-outlet">
            <option value="">Outlet type (optional)</option>
            {OUTLET_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}

        {!shortForm && sector !== "meta-demo" && (
          <input className={fieldCls("city")} placeholder="City (optional)" value={form.city} onChange={(e) => update("city", e.target.value)} data-testid="demo-input-city" />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        data-testid="demo-submit-btn"
        className="mt-6 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.32)] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : sector === "meta-demo" ? <><span>Book My Free Demo</span><ArrowRight className="w-4 h-4" /></> : "Get My Customized Walkthrough"}
      </button>
      {sector === "meta-demo" ? (
        <p className="text-xs text-brand-muted text-center mt-3">100s of outlets across 75 cities already on MyGenie</p>
      ) : (
        <p className="text-xs text-brand-muted text-center mt-3">No spam. We&apos;ll only use this to schedule your demo.</p>
      )}
    </form>
  );
}
