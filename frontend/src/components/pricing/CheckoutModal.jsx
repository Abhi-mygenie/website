import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { X, CheckCircle2, Loader2, Lock } from "lucide-react";
import { useAntiBot, Honeypot, leadQuality } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";
import { pushLead } from "@/lib/gtm";
import { useNavigate } from "react-router-dom";
import OtpVerifyBlock from "@/components/site/OtpVerifyBlock";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY = { name: "", phone: "", email: "", business_name: "", years_in_business: "", city: "", gstin: "" };
const REQUIRED = ["name", "phone", "email", "business_name", "years_in_business"];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

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

export default function CheckoutModal({ open, intent, config, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState("form");
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const { hp, setHp, signals } = useAntiBot();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) { setStage("form"); setForm(EMPTY); setErrors({}); setLead(null); setLoading(false); }
  }, [open]);

  if (!open) return null;
  const isBuy = intent === "buy";

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: validate(k, v) }));
  };
  const blur = (k) => setErrors((e) => ({ ...e, [k]: validate(k, form[k]) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    REQUIRED.forEach((f) => { newErrors[f] = validate(f, form[f]); });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/quote`, {
        ...form,
        ...signals(),
        attribution: getAttribution(),
        intent,
        outlet_type: config.outletType || null,
        plan_id: config.plan.id,
        plan_name: config.plan.name,
        billing_cycle: config.billing,
        addon_ids: config.addons.map((a) => a.id),
        addon_names: config.addons.map((a) => a.name),
        total_amount: config.total,
        gst_amount: config.gst,
        total_with_gst: config.totalWithGst,
        was_recommended: config.wasRecommended,
      });
      setLead({ id: res.data?.id, contactId: res.data?.freshsales_contact_id });
      pushLead("form_submitted", form, config.outletType || null, undefined, {
        form_location: isBuy ? "pricing-buy" : "pricing-quote",
        plan_interest: config.plan?.name || null,
        lead_quality: leadQuality(signals()),
      });
      setStage("otp");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = async () => {
    const ok = await loadRazorpayScript();
    if (!ok) { toast.error("Could not load payment gateway. Please try again."); return; }
    try {
      const { data: order } = await axios.post(`${API}/payments/razorpay/order`, {
        plan_id: config.plan.id, plan_name: config.plan.name, plan_price: config.plan.price,
        addon_ids: config.addons.map((a) => a.id), addon_names: config.addons.map((a) => a.name),
        addon_prices: config.addons.map((a) => a.price),
        name: form.name, phone: form.phone, email: form.email,
        business_name: form.business_name, city: form.city, gstin: form.gstin || null,
        attribution: getAttribution(), outlet_type: config.outletType || null,
        was_recommended: config.wasRecommended,
      });
      const rzp = new window.Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency,
        order_id: order.razorpay_order_id, name: "MyGenie POS",
        description: `${config.plan.name} Plan — Annual`, image: "/brand/logo.svg",
        prefill: { name: order.customer.name, email: order.customer.email, contact: order.customer.phone },
        theme: { color: "#10B981" },
        handler: async (response) => {
          try {
            await axios.post(`${API}/payments/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.order_id,
            });
            onClose();
            navigate(`/payment-success?order_id=${order.order_id}`);
          } catch { toast.error("Payment verification failed. Please contact support."); }
        },
        modal: { ondismiss: () => {} },
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not initiate payment. Please try again.");
    }
  };

  const fieldCls = (name) => `w-full rounded-xl border px-4 py-3 text-[15px] focus:outline-none transition-all ${
    errors[name] ? "border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-400/20" : "border-brand-line bg-brand-sand/60 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
  }`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" data-testid="checkout-modal">
      <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-brand-muted hover:text-brand-ink" data-testid="checkout-close"><X /></button>

        {/* Done */}
        {stage === "done" && (
          <div className="text-center py-4" data-testid="checkout-success">
            <StageProgress stage="done" />
            <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9 text-brand-green" /></div>
            <h3 className="font-display text-2xl font-bold mt-5 text-brand-ink">Quote sent!</h3>
            <p className="mt-3 text-brand-muted leading-relaxed">
              Thanks {form.name.split(" ")[0]}! We&apos;ll call you with a walkthrough built around your {config.plan.name} configuration.
            </p>
            <button onClick={onClose} className="mt-6 w-full bg-brand-green text-white rounded-full py-3 font-semibold" data-testid="checkout-done-btn">Done</button>
          </div>
        )}

        {/* OTP */}
        {stage === "otp" && (
          <div data-testid="checkout-otp">
            <StageProgress stage="otp" />
            <p className="text-xs text-brand-green font-medium mb-1">Details saved!</p>
            <h3 className="font-display text-xl font-bold text-brand-ink mb-5">Verify your phone</h3>
            <OtpVerifyBlock
              phone={form.phone}
              leadId={lead?.id}
              formType="quote"
              onVerified={async () => {
                pushLead("book_demo", form, config.outletType || null, undefined, {
                  otp_verified: true,
                  form_location: isBuy ? "pricing-buy" : "pricing-quote",
                  plan_interest: config.plan?.name || null,
                });
                if (isBuy) {
                  await openRazorpay();
                } else {
                  setStage("done");
                }
              }}
              onBack={() => setStage("form")}
            />
          </div>
        )}

        {/* Form */}
        {stage === "form" && (
          <form onSubmit={handleSubmit}>
            <StageProgress stage="form" />
            <h3 className="font-display text-2xl font-bold text-brand-ink">
              {isBuy ? "Complete your purchase" : "Get your custom quote"}
            </h3>
            <Honeypot value={hp} onChange={setHp} />

            <div className="mt-3 rounded-xl bg-brand-sand p-3 text-sm" data-testid="checkout-config">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-brand-ink">{config.plan.name}</span>
                {!config.plan.contactOnly && (
                  <span className="font-bold text-brand-green">₹{config.totalWithGst?.toLocaleString("en-IN")}/yr</span>
                )}
              </div>
              {!config.plan.contactOnly && config.addons.length > 0 && (
                <p className="text-brand-muted text-xs mt-0.5">{config.addons.length} add-on{config.addons.length !== 1 ? "s" : ""} · annual · incl. 18% GST</p>
              )}
            </div>

            <div className="space-y-3 mt-4">
              {[
                { key: "name", placeholder: "Your name *", type: "text" },
                { key: "phone", placeholder: "Phone number *", type: "tel" },
                { key: "email", placeholder: "Email address *", type: "email" },
                { key: "business_name", placeholder: "Business name *", type: "text" },
              ].map(({ key, placeholder, type }) => (
                <div key={key}>
                  <input type={type} className={fieldCls(key)} placeholder={placeholder} value={form[key]}
                    onChange={(e) => update(key, e.target.value)} onBlur={() => blur(key)} data-testid={`checkout-${key}`} />
                  {errors[key] && <p className="text-xs text-red-500 mt-1" data-testid={`checkout-error-${key}`}>{errors[key]}</p>}
                </div>
              ))}

              <div>
                <select className={fieldCls("years_in_business")} value={form.years_in_business}
                  onChange={(e) => update("years_in_business", e.target.value)} onBlur={() => blur("years_in_business")} data-testid="checkout-years">
                  <option value="">Years in business *</option>
                  <option value="yet-to-open">Yet to open</option>
                  <option value="0-2">0 – 2 years</option>
                  <option value="2+">2+ years</option>
                </select>
                {errors.years_in_business && <p className="text-xs text-red-500 mt-1" data-testid="checkout-error-years">{errors.years_in_business}</p>}
              </div>

              <input className={fieldCls("city")} placeholder="City (optional)" value={form.city}
                onChange={(e) => update("city", e.target.value)} data-testid="checkout-city" />

              {isBuy && (
                <div>
                  <input className={fieldCls("gstin")} placeholder="GSTIN (optional)" value={form.gstin}
                    onChange={(e) => update("gstin", e.target.value)} data-testid="checkout-gstin" />
                  <p className="text-xs text-brand-muted mt-1">Your GSTIN will appear on the tax invoice</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} data-testid="checkout-submit"
              className="mt-5 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                : isBuy
                  ? <><Lock className="w-4 h-4" /> Continue to payment</>
                  : "Get My Quote"}
            </button>

            {isBuy && <p className="text-center text-xs text-brand-muted mt-3">Secured by Razorpay · UPI / Card / Net Banking / Wallet</p>}
          </form>
        )}
      </div>
    </div>
  );
}
