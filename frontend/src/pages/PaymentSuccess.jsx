import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Download, Phone, MessageSquare, Loader2, RefreshCw, Upload, FileText, X, CheckCheck } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { pushEvent } from "@/lib/gtm";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function DownloadInvoiceButton({ order }) {
  const [url, setUrl] = useState(order.invoice_url || null);
  const [retrying, setRetrying] = useState(false);
  const [retried, setRetried] = useState(false);

  const regenerate = async () => {
    setRetrying(true);
    try {
      const { data } = await axios.post(`${API}/payments/order/${order.id}/regenerate-invoice`);
      if (data.invoice_url) setUrl(data.invoice_url);
    } catch (_) {}
    setRetrying(false);
    setRetried(true);
  };

  if (url) {
    return (
      <a
        href={`${API}/payments/order/${order.id}/invoice-download`}
        target="_blank"
        rel="noreferrer"
        data-testid="download-invoice-btn"
        className="flex items-center justify-center gap-2 w-full bg-brand-orange text-white rounded-full py-3.5 font-semibold hover:opacity-90 transition-all"
      >
        <Download className="w-5 h-5" /> Download GST Invoice (PDF)
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-brand-line p-5 text-center space-y-3" data-testid="download-invoice-pending">
      <p className="text-sm text-brand-muted">
        Your GST invoice is being generated. It will also arrive via SMS shortly.
      </p>
      <button
        onClick={regenerate}
        disabled={retrying}
        data-testid="download-invoice-retry-btn"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:underline disabled:opacity-50"
      >
        {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {retried ? "Still generating — check SMS" : "Try downloading now"}
      </button>
    </div>
  );
}

function MenuUpload({ orderId }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...picked].slice(0, 10));
  };

  const remove = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach((f, i) => fd.append(`file_${i}`, f));
    try {
      await axios.post(`${API}/payments/order/${orderId}/menu-upload`, fd);
      setDone(true);
    } catch (_) {}
    setUploading(false);
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-brand-green/[0.06] border border-brand-green/25 p-5 flex items-start gap-4" data-testid="menu-upload-done">
        <CheckCheck className="w-6 h-6 text-brand-green shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-brand-ink">Menu received — thank you!</p>
          <p className="text-sm text-brand-muted mt-0.5">Our team will start building your menu in the POS before the setup call.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-line p-5 space-y-4" data-testid="menu-upload-section">
      <div>
        <p className="font-semibold text-brand-ink">Upload your menu <span className="text-brand-muted font-normal text-sm">(optional, but saves time)</span></p>
        <p className="text-sm text-brand-muted mt-1">
          Share photos, a scanned PDF, or any file of your current menu — our team will build it into the POS for you before the setup call.
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-brand-line rounded-xl p-6 text-center cursor-pointer hover:border-brand-orange hover:bg-brand-orange/[0.03] transition-all"
        data-testid="menu-upload-dropzone"
      >
        <Upload className="w-8 h-8 text-brand-muted mx-auto mb-2" />
        <p className="text-sm text-brand-muted">Click to upload · JPG, PNG, PDF · up to 10 files</p>
        <input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.webp" className="hidden" onChange={handleFiles} />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2" data-testid="menu-file-list">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm bg-brand-sand/60 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-brand-muted shrink-0" />
              <span className="flex-1 truncate text-brand-ink">{f.name}</span>
              <span className="text-brand-muted text-xs">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => remove(i)} className="text-brand-muted hover:text-red-500"><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <button
          onClick={submit}
          disabled={uploading}
          data-testid="menu-upload-submit-btn"
          className="flex items-center justify-center gap-2 w-full bg-brand-ink text-white rounded-full py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading…" : `Send ${files.length} file${files.length > 1 ? "s" : ""} to MyGenie`}
        </button>
      )}
    </div>
  );
}

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) { setLoading(false); setError("Order not found."); return; }
    axios.get(`${API}/payments/order/${orderId}`)
      .then(({ data }) => {
        setOrder(data);
        // Fire GTM purchase event
        pushEvent("purchase", {
          transaction_id: data.razorpay_payment_id || data.id,
          value: data.amount_total,
          currency: "INR",
          items: [{ item_name: data.plan_name, price: data.plan_price * 12 }],
        });
      })
      .catch(() => setError("Could not load order details."))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="bg-white min-h-screen" data-testid="payment-success-page">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="max-w-2xl mx-auto px-4">

          {loading && (
            <div className="flex flex-col items-center py-20 gap-4 text-brand-muted">
              <Loader2 className="w-10 h-10 animate-spin text-brand-green" />
              <p>Loading your order…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-brand-muted">{error}</p>
              <Link to="/pricing" className="mt-4 inline-block text-brand-green font-semibold hover:underline">← Back to Pricing</Link>
            </div>
          )}

          {order && (
            <div className="space-y-6">
              {/* Success header */}
              <div className="text-center" data-testid="success-header">
                <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-11 h-11 text-brand-green" strokeWidth={2} />
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-ink">Payment successful!</h1>
                <p className="mt-3 text-lg text-brand-muted">
                  Your <span className="font-semibold text-brand-ink">{order.plan_name}</span> plan is confirmed.
                </p>
              </div>

              {/* Order summary card */}
              <div className="rounded-2xl border border-brand-line bg-brand-sand/40 p-6" data-testid="order-summary">
                <h2 className="font-semibold text-brand-ink mb-4">Order summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-brand-muted">Order ID</span><span className="font-mono text-xs font-semibold">{order.invoice_no}</span></div>
                  <div className="flex justify-between"><span className="text-brand-muted">Payment ID</span><span className="font-mono text-xs">{(order.razorpay_payment_id || "—").slice(0, 24)}…</span></div>
                  <div className="flex justify-between"><span className="text-brand-muted">Plan</span><span className="font-semibold">{order.plan_name}</span></div>
                  {order.addon_names?.length > 0 && (
                    <div className="flex justify-between"><span className="text-brand-muted">Add-ons</span><span>{order.addon_names.join(", ")}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-brand-muted">Billing</span><span>Annual · 1 outlet</span></div>
                  <div className="border-t border-brand-line pt-2 mt-2 flex justify-between font-bold text-base">
                    <span>Total paid (incl. GST)</span>
                    <span className="text-brand-green">{inr(order.amount_total)}/yr</span>
                  </div>
                </div>
              </div>

              {/* Invoice SMS notice */}
              <div className="rounded-2xl bg-brand-green/[0.06] border border-brand-green/25 p-5 flex items-start gap-4" data-testid="invoice-notice">
                <MessageSquare className="w-6 h-6 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-brand-ink">GST invoice sent to your phone via SMS</p>
                  <p className="text-sm text-brand-muted mt-0.5">
                    Tap the link in the SMS to download your tax invoice (Invoice no. {order.invoice_no}).
                  </p>
                </div>
              </div>

              {/* Contact promise */}
              <div className="rounded-2xl bg-brand-orange/[0.06] border border-brand-orange/25 p-5 flex items-start gap-4" data-testid="contact-promise">
                <Phone className="w-6 h-6 text-brand-orange shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-brand-ink">We'll contact you within 1 business day</p>
                  <p className="text-sm text-brand-muted mt-0.5">
                    Our setup team will call to complete your onboarding and get your POS activated.
                  </p>
                </div>
              </div>

              {/* Menu upload */}
              <MenuUpload orderId={order.id} />

              {/* Download invoice */}
              <DownloadInvoiceButton order={order} />

              <Link to="/" className="block text-center text-sm text-brand-muted hover:text-brand-green transition-colors">
                ← Back to home
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
