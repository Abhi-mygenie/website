import { useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { TrendingUp, ShieldCheck, Trash2, Zap, Loader2, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Seo from "@/components/site/Seo";
import { PAGE_SEO } from "@/lib/seo";
import { useAntiBot, Honeypot } from "@/lib/antiBot";
import { getAttribution } from "@/lib/attribution";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

// Transparent, adjustable assumptions
const RATES = { leakage: 0.04, wastage: 0.03, growth: 0.08 };

export default function RoiCalculator() {
  const [revenue, setRevenue] = useState(500000);
  const [outlets, setOutlets] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { hp, setHp, signals } = useAntiBot();

  const calc = useMemo(() => {
    const leakage = revenue * RATES.leakage;
    const wastage = revenue * RATES.wastage;
    const growth = revenue * RATES.growth;
    const monthly = (leakage + wastage + growth) * outlets;
    return { leakage: leakage * outlets, wastage: wastage * outlets, growth: growth * outlets, monthly, annual: monthly * 12 };
  }, [revenue, outlets]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("Enter your name and phone."); return; }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) { toast.error("Enter a valid 10-digit phone."); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/demo-request`, {
        ...form,
        ...signals(),
        attribution: getAttribution(),
        source_page: `roi: rev=${revenue}/mo, outlets=${outlets}, est_annual_impact=${Math.round(calc.annual)}`,
      });
      setDone(true);
      toast.success("Your savings plan is on the way!");
    } catch { toast.error("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  const rows = [
    { icon: ShieldCheck, label: "Revenue leakage & theft recovered", val: calc.leakage, color: "text-brand-green" },
    { icon: Trash2, label: "Inventory wastage reduced", val: calc.wastage, color: "text-brand-orange" },
    { icon: Zap, label: "Extra revenue (faster service + repeat)", val: calc.growth, color: "text-brand-green" },
  ];

  return (
    <div className="bg-white" data-testid="roi-page">
      <Seo title={PAGE_SEO["/roi"].title} description={PAGE_SEO["/roi"].description} path="/roi" />
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-orange">ROI Calculator</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3 text-brand-ink tracking-tight">See how much MyGenie could add to your bottom line.</h1>
            <p className="mt-4 text-lg text-brand-muted">Move the sliders to match your business. We&apos;ll estimate your potential annual impact from less leakage, less waste, and faster, repeat-driven sales.</p>
          </div>

          <div className="mt-12 grid lg:grid-cols-2 gap-8">
            {/* INPUTS */}
            <div className="rounded-3xl border border-brand-line bg-brand-sand p-8" data-testid="roi-inputs">
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-brand-ink">Monthly revenue (per outlet)</label>
                  <span className="font-display text-xl font-bold text-brand-green" data-testid="roi-revenue-value">{inr(revenue)}</span>
                </div>
                <input type="range" min="50000" max="5000000" step="50000" value={revenue} onChange={(e) => setRevenue(+e.target.value)} data-testid="roi-revenue-slider" className="w-full mt-4 accent-brand-green" />
                <div className="flex justify-between text-xs text-brand-muted mt-1"><span>₹50K</span><span>₹50L</span></div>
              </div>
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-brand-ink">Number of outlets</label>
                  <span className="font-display text-xl font-bold text-brand-orange" data-testid="roi-outlets-value">{outlets}</span>
                </div>
                <input type="range" min="1" max="50" step="1" value={outlets} onChange={(e) => setOutlets(+e.target.value)} data-testid="roi-outlets-slider" className="w-full mt-4 accent-brand-orange" />
                <div className="flex justify-between text-xs text-brand-muted mt-1"><span>1</span><span>50</span></div>
              </div>

              <div className="mt-8 space-y-3">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-brand-line">
                    <span className="flex items-center gap-3 text-sm text-brand-ink"><r.icon className={`w-5 h-5 ${r.color}`} /> {r.label}</span>
                    <span className="font-semibold text-brand-ink">{inr(r.val)}/mo</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RESULT */}
            <div className="rounded-3xl bg-brand-deep text-white p-8 sm:p-10 flex flex-col" data-testid="roi-result">
              <div className="flex items-center gap-2 text-brand-yellow font-semibold"><TrendingUp className="w-5 h-5" /> Your potential annual impact</div>
              <p className="font-display text-5xl sm:text-6xl font-bold text-brand-yellow mt-4 leading-none" data-testid="roi-annual">{inr(calc.annual)}</p>
              <p className="text-[#C7D2CB] mt-3">Estimated additional profit + recovered losses per year across {outlets} outlet{outlets > 1 ? "s" : ""} — about <span className="font-semibold text-white">{inr(calc.monthly)}/month</span>.</p>

              <div className="mt-8 pt-6 border-t border-white/10">
                {done ? (
                  <div className="text-center" data-testid="roi-success">
                    <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto" />
                    <p className="font-display text-xl font-bold mt-3">Your savings plan is on the way!</p>
                    <p className="text-[#C7D2CB] mt-2">Our team will call you with a tailored breakdown for your business.</p>
                  </div>
                ) : (
                  <form onSubmit={submit} data-testid="roi-form">
                    <p className="font-semibold mb-3">Get this savings plan + a free demo:</p>
                    <Honeypot value={hp} onChange={setHp} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-brand-green" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="roi-name" />
                      <input className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-brand-green" placeholder="Phone (10 digits)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="roi-phone" />
                    </div>
                    <button type="submit" disabled={loading} data-testid="roi-submit" className="mt-3 w-full bg-brand-green hover:bg-brand-greenDark text-white rounded-full py-3.5 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                      {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : "Send My Savings Plan"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-brand-muted mt-6 max-w-3xl">Estimates use indicative industry ranges (leakage ~4%, wastage ~3%, growth ~8% of revenue) and are for illustration only. Your actual results depend on your operations — we&apos;ll give you a precise breakdown on your demo.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
