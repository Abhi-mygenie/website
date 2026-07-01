import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { COMPANY } from "@/data/company";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";
import { pushLead } from "@/lib/gtm";
import OtpVerifyBlock from "@/components/site/OtpVerifyBlock";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", phone: "", email: "", business_name: "", years_in_business: "", message: "", preferred_contact: "whatsapp" };
const REQUIRED = ["name", "phone", "email", "business_name", "years_in_business", "message"];

const PREFERENCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone",    label: "Phone call" },
  { value: "email",    label: "Email" },
];

function validate(field, value) {
  if (field === "phone") return /^\d{10}$/.test((value || "").replace(/\D/g, "").slice(-10)) ? null : "Enter a valid 10-digit number";
  if (field === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim()) ? null : "Enter a valid email address";
  return (value || "").trim() ? null : "This field is required";
}

function StageProgress({ stage }) {
  const idx = ["form", "otp", "done"].indexOf(stage);
  return (
    <div className="flex gap-1.5 mb-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= idx ? "w-5 bg-brand-green" : "w-1.5 bg-brand-line"}`} />
      ))}
    </div>
  );
}

export default function MessageForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState("form");
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const { hp, setHp, signals } = useAntiBot();

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: validate(k, v) }));
  };
  const blur = (k) => setErrors((e) => ({ ...e, [k]: validate(k, form[k]) }));

  const openWhatsApp = () => {
    const text = `Hi MyGenie, I'm ${form.name}.${form.message ? ` ${form.message}` : ""}`;
    window.open(`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    REQUIRED.forEach((f) => { newErrors[f] = validate(f, form[f]); });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/contact`, {
        ...form, source_page: "contact", ...signals(), attribution: getAttribution(),
      });
      setLead({ id: res.data?.id, contactId: res.data?.freshsales_contact_id });
      pushLead("form_submitted", form, null, undefined, {
        form_location: "contact", lead_quality: leadQuality(signals()),
      });
      setStage("otp");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cardCls = "bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.1)]";
  const fieldCls = (name) => `w-full rounded-xl border px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus:outline-none transition-all ${
    errors[name] ? "border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : "border-brand-line bg-brand-sand/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
  }`;

  // ─── Done ────────────────────────────────────────────────────────────
  if (stage === "done") {
    return (
      <div className={`${cardCls} text-center`} data-testid="message-success">
        <StageProgress stage="done" />
        <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9 text-brand-green" />
        </div>
        <h3 className="font-display text-2xl font-bold mt-5 text-brand-ink">Thanks, {form.name.split(" ")[0]}!</h3>
        <p className="mt-3 text-brand-muted leading-relaxed">
          We&apos;ve got your message. If WhatsApp didn&apos;t open automatically, tap below.
        </p>
        <button onClick={openWhatsApp} data-testid="message-whatsapp-btn"
          className="mt-6 inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-3 font-semibold transition-all hover:-translate-y-0.5">
          <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
        </button>
      </div>
    );
  }

  // ─── OTP ─────────────────────────────────────────────────────────────
  if (stage === "otp") {
    return (
      <div className={cardCls} data-testid="message-otp">
        <StageProgress stage="otp" />
        <p className="text-xs text-brand-green font-medium mb-1">Message saved!</p>
        <h3 className="font-display text-xl font-bold text-brand-ink mb-5">Verify your phone</h3>
        <OtpVerifyBlock
          phone={form.phone}
          leadId={lead?.id}
          formType="contact"
          onVerified={() => {
            pushLead("book_demo", form, null, undefined, { otp_verified: true, form_location: "contact" });
            openWhatsApp();
            setStage("done");
          }}
          onBack={() => setStage("form")}
        />
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className={cardCls} data-testid="message-form">
      <StageProgress stage="form" />
      <h3 className="font-display text-2xl font-bold text-brand-ink">Send us a message</h3>
      <p className="text-sm text-brand-muted mt-1.5 mb-5">Have a question about features, pricing or your business? We&apos;ll reply fast.</p>
      <Honeypot value={hp} onChange={setHp} />

      <div className="space-y-3.5">
        {[
          { key: "name",          placeholder: "Your name *",       type: "text" },
          { key: "phone",         placeholder: "Phone number *",    type: "tel" },
          { key: "email",         placeholder: "Email address *",   type: "email" },
          { key: "business_name", placeholder: "Business name *",   type: "text" },
        ].map(({ key, placeholder, type }) => (
          <div key={key}>
            <input type={type} className={fieldCls(key)} placeholder={placeholder} value={form[key]}
              onChange={(e) => update(key, e.target.value)} onBlur={() => blur(key)} data-testid={`message-input-${key}`} />
            {errors[key] && <p className="text-xs text-red-500 mt-1" data-testid={`message-error-${key}`}>{errors[key]}</p>}
          </div>
        ))}

        <div>
          <select className={fieldCls("years_in_business")} value={form.years_in_business}
            onChange={(e) => update("years_in_business", e.target.value)} onBlur={() => blur("years_in_business")} data-testid="message-select-years">
            <option value="">Years in business *</option>
            <option value="yet-to-open">Yet to open</option>
            <option value="0-2">0 – 2 years</option>
            <option value="2+">2+ years</option>
          </select>
          {errors.years_in_business && <p className="text-xs text-red-500 mt-1" data-testid="message-error-years">{errors.years_in_business}</p>}
        </div>

        <div>
          <textarea className={`${fieldCls("message")} min-h-[110px] resize-y`} placeholder="How can we help? *"
            value={form.message} onChange={(e) => update("message", e.target.value)} onBlur={() => blur("message")} data-testid="message-input-text" />
          {errors.message && <p className="text-xs text-red-500 mt-1" data-testid="message-error-message">{errors.message}</p>}
        </div>

        <div>
          <p className="text-sm text-brand-muted mb-2">How would you like us to reach you?</p>
          <div className="grid grid-cols-3 gap-2" data-testid="message-preference-group">
            {PREFERENCES.map((p) => {
              const active = form.preferred_contact === p.value;
              return (
                <button type="button" key={p.value} onClick={() => update("preferred_contact", p.value)}
                  data-testid={`message-preference-${p.value}`}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${active ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-brand-line bg-brand-sand/60 text-brand-muted hover:border-brand-green/40"}`}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} data-testid="message-submit-btn"
        className="mt-6 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.32)] disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : "Send Message"}
      </button>
      <p className="text-xs text-brand-muted text-center mt-3">We&apos;ll connect you on WhatsApp instantly to chat faster.</p>
    </form>
  );
}
