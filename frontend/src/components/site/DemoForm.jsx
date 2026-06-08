import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle2, Loader2, CalendarCheck, ShieldCheck } from "lucide-react";
import { OUTLET_TYPES, CALENDLY_URL } from "@/data/content";
import CalendlyInline from "@/components/site/CalendlyInline";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";
import { pushLead, newEventId } from "@/lib/gtm";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", phone: "", email: "", outlet_type: "", business_name: "", city: "", using_pos: "" };

export default function DemoForm({ sector }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [booked, setBooked] = useState(false);
  const [lead, setLead] = useState(null);
  const { hp, setHp, signals } = useAntiBot();
  const [eventId] = useState(() => newEventId());

  // --- OTP (CR-4B): verify phone before booking. Graceful — never hard-blocks. ---
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const outletValue = sector || form.outlet_type;
  const phoneValid = /^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10));

  const sendOtp = async () => {
    if (!phoneValid) {
      toast.error("Please enter a valid 10-digit phone number first.");
      return;
    }
    setOtpLoading(true);
    try {
      await axios.post(`${API}/otp/send`, { phone: form.phone });
      setOtpSent(true);
      setResendIn(30);
      toast.success("OTP sent to your phone.");
    } catch (err) {
      // Graceful fallback — panel may be down; allow booking without OTP.
      setOtpSent(true);
      toast("Couldn't send OTP right now — you can still continue.", { icon: "⚠️" });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{4}$/.test(otpCode)) {
      toast.error("Enter the 4-digit code.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await axios.post(`${API}/otp/verify`, { phone: form.phone, code: otpCode });
      setOtpToken(res.data?.otp_token || null);
      setOtpVerified(true);
      pushLead("lead_verified", form, outletValue, eventId, {
        otp_verified: true,
        form_location: sector ? `sector:${sector}` : "homepage",
      });
      toast.success("Phone verified!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Incorrect OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please enter your name and phone number.");
      return;
    }
    if (!phoneValid) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/demo-request`, {
        ...form,
        ...signals(),
        otp_token: otpToken,
        attribution: getAttribution(),
        outlet_type: outletValue,
        source_page: sector ? `sector:${sector}` : "homepage",
      });
      setLead({ id: res.data?.id, contactId: res.data?.freshsales_contact_id });
      setDone(true);
      pushLead("form_submitted", form, outletValue, eventId, {
        otp_verified: otpVerified,
        form_location: sector ? `sector:${sector}` : "homepage",
        lead_quality: leadQuality(signals()),
      });
      toast.success("Great! Now pick a time that works for you.");
    } catch (err) {
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
    } catch (err) {
      /* booking already confirmed in Calendly; CRM sync is best-effort */
    }
  };

  const cardCls = "bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.1)]";

  if (done && booked) {
    return (
      <div className={`${cardCls} text-center`} data-testid="demo-booked">
        <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
          <CalendarCheck className="w-9 h-9 text-brand-green" />
        </div>
        <h3 className="font-display text-2xl font-bold mt-5 text-brand-ink">
          You&apos;re booked, {form.name.split(" ")[0]}!
        </h3>
        <p className="mt-3 text-brand-muted leading-relaxed">
          Check your inbox for the calendar invite. Our specialist will walk you through MyGenie built for your
          {outletValue ? <span className="font-semibold text-brand-ink"> {outletValue} </span> : " "}business.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className={cardCls} data-testid="demo-success">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-brand-green" />
          </div>
          <h3 className="font-display text-2xl font-bold mt-4 text-brand-ink">
            Almost there, {form.name.split(" ")[0]} — pick your slot
          </h3>
          <p className="mt-2 text-sm text-brand-muted leading-relaxed">
            Choose a time for your free <span className="font-semibold text-brand-ink">45-minute walkthrough</span> — we&apos;ll show you exactly how MyGenie works for your
            {outletValue ? <span className="font-semibold text-brand-ink"> {outletValue} </span> : " "}business.
          </p>
        </div>
        <div className="mt-5 -mx-3 sm:mx-0">
          <CalendlyInline
            url={CALENDLY_URL}
            eventId={eventId}
            leadContext={{ ...form, outlet_type: outletValue, sector: outletValue, otp_verified: otpVerified }}
            prefill={{
              name: form.name,
              email: form.email,
              customAnswers: {
                a1: [
                  outletValue && `Outlet: ${outletValue}`,
                  form.business_name && `Business: ${form.business_name}`,
                  form.city && `City: ${form.city}`,
                ].filter(Boolean).join(" | ") || undefined,
                a2: form.phone ? `+91${form.phone.replace(/\D/g, "").slice(-10)}` : undefined,
              },
            }}
            utm={{
              utmContent: lead?.contactId ? String(lead.contactId) : undefined,
              utmTerm: lead?.id ? String(lead.id) : undefined,
              utmSource: "website",
              utmMedium: "demo_form",
            }}
            onScheduled={markBooked}
          />
        </div>
      </div>
    );
  }

  const field = "w-full rounded-xl border border-brand-line bg-brand-sand/60 px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all";

  return (
    <form onSubmit={submit} className={cardCls} data-testid="demo-form">
      <h3 className="font-display text-2xl font-bold text-brand-ink">Book a Free Demo</h3>
      <p className="text-sm text-brand-muted mt-1.5 mb-5">A specialist will show you exactly how MyGenie works for your outlet.</p>
      <Honeypot value={hp} onChange={setHp} />

      <div className="space-y-3.5">
        <input className={field} placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} data-testid="demo-input-name" />
        <input className={field} placeholder="Phone number (10 digits)" value={form.phone} onChange={(e) => { update("phone", e.target.value); setOtpSent(false); setOtpVerified(false); setOtpToken(null); }} data-testid="demo-input-phone" />

        {!otpVerified ? (
          <div className="rounded-xl border border-brand-line bg-brand-sand/40 px-4 py-3" data-testid="otp-block">
            {!otpSent ? (
              <button
                type="button"
                onClick={sendOtp}
                disabled={otpLoading || !phoneValid}
                data-testid="otp-send-btn"
                className="flex items-center gap-2 text-sm font-semibold text-brand-green disabled:opacity-50"
              >
                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Verify phone with OTP
              </button>
            ) : (
              <div className="flex flex-col gap-2.5" data-testid="otp-status">
                <p className="text-xs text-brand-muted">Enter the 4-digit code sent to your phone.</p>
                <div className="flex items-center gap-2.5">
                  <input
                    className={`${field} tracking-[0.4em] text-center font-semibold`}
                    placeholder="••••"
                    inputMode="numeric"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    data-testid="otp-input"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otpLoading || otpCode.length !== 4}
                    data-testid="otp-verify-btn"
                    className="shrink-0 rounded-xl bg-brand-green text-white px-5 py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={resendIn > 0 || otpLoading}
                  data-testid="otp-resend-btn"
                  className="self-start text-xs font-medium text-brand-muted hover:text-brand-green disabled:opacity-50"
                >
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-brand-green/8 border border-brand-green/25 px-4 py-3" data-testid="otp-verified">
            <ShieldCheck className="w-4 h-4 text-brand-green" />
            <span className="text-sm font-semibold text-brand-green">Phone verified</span>
          </div>
        )}

        <input className={field} placeholder="Email (optional)" value={form.email} onChange={(e) => update("email", e.target.value)} data-testid="demo-input-email" />

        {sector ? (
          <div className="flex items-center gap-2 rounded-xl bg-brand-green/8 border border-brand-green/25 px-4 py-3" data-testid="demo-sector-locked">
            <span className="text-sm text-brand-muted">Demo for:</span>
            <span className="text-sm font-semibold text-brand-green">{sector}</span>
          </div>
        ) : (
          <select className={field} value={form.outlet_type} onChange={(e) => update("outlet_type", e.target.value)} data-testid="demo-select-outlet">
            <option value="">Select your outlet type</option>
            {OUTLET_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          <input className={field} placeholder="Business name" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} data-testid="demo-input-business" />
          <input className={field} placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} data-testid="demo-input-city" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        data-testid="demo-submit-btn"
        className="mt-6 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.32)] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : "Get My Customized Walkthrough"}
      </button>
      <p className="text-xs text-brand-muted text-center mt-3">No spam. We&apos;ll only use this to schedule your demo.</p>
    </form>
  );
}
