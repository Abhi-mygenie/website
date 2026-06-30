import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { setConsentChoice, hasConsentChoice } from "@/lib/gtm";

/**
 * CR-3B #2 — Consent Mode v2 banner.
 * Lightweight, brand-styled consent prompt. EEA-safe defaults are set in gtm.js BEFORE the
 * container loads; choosing here pushes a Consent Mode `update` and persists the choice so the
 * banner never re-appears. Best-effort, never blocks the page.
 */
export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasConsentChoice()) setShow(true);
  }, []);

  const choose = (granted) => {
    setConsentChoice(granted);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      data-testid="consent-banner"
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[70] bg-white rounded-2xl border border-brand-line shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-5"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-brand-green" />
        </div>
        <div className="min-w-0">
          <h4 className="font-display text-base font-bold text-brand-ink">We value your privacy</h4>
          <p className="mt-1 text-sm text-brand-muted leading-relaxed">
            We use cookies to measure traffic and improve your experience. You can accept or decline
            analytics &amp; ad cookies.{" "}
            <a href="/privacy" className="text-brand-green font-medium hover:underline" data-testid="consent-privacy-link">
              Learn more
            </a>
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => choose(false)}
          data-testid="consent-decline-btn"
          className="flex-1 rounded-full border border-brand-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-muted hover:text-brand-ink hover:border-brand-green/40 transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          data-testid="consent-accept-btn"
          className="flex-1 rounded-full bg-brand-green hover:bg-brand-greenDark px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-[0_8px_22px_rgba(24,168,74,0.32)]"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
