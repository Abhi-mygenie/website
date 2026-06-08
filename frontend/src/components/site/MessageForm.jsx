import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { COMPANY } from "@/data/company";
import { useAntiBot, Honeypot } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";
import { pushEvent, buildLeadPayload } from "@/lib/gtm";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", phone: "", email: "", message: "", preferred_contact: "whatsapp" };

const PREFERENCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone call" },
  { value: "email", label: "Email" },
];

export default function MessageForm() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { hp, setHp, signals } = useAntiBot();

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openWhatsApp = () => {
    const text = `Hi MyGenie, I'm ${form.name}.${form.message ? ` ${form.message}` : ""}`;
    const url = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please enter your name and phone number.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!form.message.trim()) {
      toast.error("Please type your message.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/contact`, { ...form, source_page: "contact", ...signals(), attribution: getAttribution() });
      setDone(true);
      pushEvent("form_submitted", buildLeadPayload(form, null));
      toast.success("Message sent! Opening WhatsApp so we can chat faster.");
      openWhatsApp();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cardCls = "bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.1)]";
  const field =
    "w-full rounded-xl border border-brand-line bg-brand-sand/60 px-4 py-3 text-[15px] text-brand-ink placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all";

  if (done) {
    return (
      <div className={`${cardCls} text-center`} data-testid="message-success">
        <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9 text-brand-green" />
        </div>
        <h3 className="font-display text-2xl font-bold mt-5 text-brand-ink">
          Thanks, {form.name.split(" ")[0]}!
        </h3>
        <p className="mt-3 text-brand-muted leading-relaxed">
          We&apos;ve got your message and will get back to you via{" "}
          <span className="font-semibold text-brand-ink">
            {PREFERENCES.find((p) => p.value === form.preferred_contact)?.label}
          </span>
          . If WhatsApp didn&apos;t open, tap below.
        </p>
        <button
          onClick={openWhatsApp}
          data-testid="message-whatsapp-btn"
          className="mt-6 inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-6 py-3 font-semibold transition-all hover:-translate-y-0.5"
        >
          <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cardCls} data-testid="message-form">
      <h3 className="font-display text-2xl font-bold text-brand-ink">Send us a message</h3>
      <p className="text-sm text-brand-muted mt-1.5 mb-5">
        Have a question about features, pricing or your business? We&apos;ll reply fast.
      </p>
      <Honeypot value={hp} onChange={setHp} />

      <div className="space-y-3.5">
        <input className={field} placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} data-testid="message-input-name" />
        <input className={field} placeholder="Phone number (10 digits)" value={form.phone} onChange={(e) => update("phone", e.target.value)} data-testid="message-input-phone" />
        <input className={field} placeholder="Email (optional)" value={form.email} onChange={(e) => update("email", e.target.value)} data-testid="message-input-email" />
        <textarea className={`${field} min-h-[110px] resize-y`} placeholder="How can we help?" value={form.message} onChange={(e) => update("message", e.target.value)} data-testid="message-input-text" />

        <div>
          <p className="text-sm text-brand-muted mb-2">How would you like us to reach you?</p>
          <div className="grid grid-cols-3 gap-2" data-testid="message-preference-group">
            {PREFERENCES.map((p) => {
              const active = form.preferred_contact === p.value;
              return (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => update("preferred_contact", p.value)}
                  data-testid={`message-preference-${p.value}`}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "border-brand-green bg-brand-green/10 text-brand-green"
                      : "border-brand-line bg-brand-sand/60 text-brand-muted hover:border-brand-green/40"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        data-testid="message-submit-btn"
        className="mt-6 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all hover:-translate-y-0.5 shadow-[0_8px_22px_rgba(24,168,74,0.32)] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : "Send Message"}
      </button>
      <p className="text-xs text-brand-muted text-center mt-3">We&apos;ll connect you on WhatsApp instantly to chat faster.</p>
    </form>
  );
}
