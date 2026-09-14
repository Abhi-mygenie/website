import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, CalendarCheck, Loader2 } from "lucide-react";
import OtpVerifyBlock from "@/components/site/OtpVerifyBlock";
import { pushLead, newEventId } from "@/lib/gtm";
import { getAttribution } from "@/lib/attribution";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { loadCalendly } from "@/lib/calendly";
import { CALENDLY_URL } from "@/data/content";

// ─── DemoBottomSheet constants ────────────────────────────────────────────────
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

// ─── DemoBottomSheet — shared bottom-sheet quick-book form (CR-259) ───────────
export default function DemoBottomSheet({ sector, open, onClose }) {
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
        pushLead("demo_booked", form, sector, eventId, {
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
        outlet_type: sector,
        source_page: `${sector}-quick-book`,
      });
      if (res.data?.saved === false) { toast.error("Something went wrong. Please try again."); return; }
      setLead({ id: res.data?.id, contactId: res.data?.freshsales_contact_id });
      // EVENT 1: form_submitted (₹0) — matches DemoForm exactly
      pushLead("form_submitted", form, sector, eventId, {
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
                  pushLead("book_demo", form, sector, eventId, {
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
