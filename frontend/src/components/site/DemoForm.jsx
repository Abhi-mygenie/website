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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", phone: "", email: "", outlet_type: "", business_name: "", city: "", years_in_business: "" };
const REQUIRED = ["name", "phone", "email", "business_name", "years_in_business"];

const BRAND_PARAMS = {
  background_color: "ffffff", primary_color: "18A84A",
  text_color: "14201A", hide_gdpr_banner: "1",
  hide_landing_page_details: "1", hide_event_type_details: "1",
};

function loadCalendlyScript() {
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

export default function DemoForm({ sector }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState("form");
  const [lead, setLead] = useState(null);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { hp, setHp, signals } = useAntiBot();
  const [eventId] = useState(() => newEventId());
  const scheduledRef = useRef(false);

  const outletValue = sector || form.outlet_type;
  const fieldCls = (name) => `w-full rounded-xl border px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus:outline-none transition-all ${
    errors[name] ? "border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : "border-brand-line bg-brand-sand/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
  }`;

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: validate(k, v) }));
  };

  const blur = (k) => setErrors((e) => ({ ...e, [k]: validate(k, form[k]) }));

  // Calendly event listener for mobile popup
  useEffect(() => {
    if (stage !== "calendly") return;
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
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    REQUIRED.forEach((f) => { newErrors[f] = validate(f, form[f]); });
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
    await loadCalendlyScript();
    const url = brandedUrl(CALENDLY_URL);
    if (!window.Calendly) return;
    window.Calendly.showPopupWidget(url, {
      prefill: {
        name: form.name,
        email: form.email,
        customAnswers: {
          a1: [outletValue && `Outlet: ${outletValue}`, form.business_name && `Biz: ${form.business_name}`].filter(Boolean).join(" | ") || undefined,
          a2: form.phone ? `+91${form.phone.replace(/\D/g,"").slice(-10)}` : undefined,
        },
      },
    });
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
    const isMobile = window.innerWidth < 768;
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
            data-testid="demo-book-slot-btn"
            className="w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.32)]"
          >
            Book My Slot
          </button>
        ) : (
          <div className="-mx-3 sm:mx-0">
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
      <div className={cardCls} data-testid="demo-otp">
        <StageProgress stage="otp" />
        <p className="text-xs text-brand-green font-medium mb-1">Details saved!</p>
        <h3 className="font-display text-xl font-bold text-brand-ink mb-5">Verify your phone</h3>
        <OtpVerifyBlock
          phone={form.phone}
          leadId={lead?.id}
          formType="demo"
          onVerified={() => {
            pushLead("lead_verified", form, outletValue, eventId, { otp_verified: true, form_location: sector ? `sector:${sector}` : "homepage" });
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
          { key: "business_name", placeholder: "Business name *", type: "text" },
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

        {!sector && (
          <select className={fieldCls("outlet_type")} value={form.outlet_type} onChange={(e) => update("outlet_type", e.target.value)} data-testid="demo-select-outlet">
            <option value="">Outlet type (optional)</option>
            {OUTLET_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}

        {sector !== "meta-demo" && (
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
