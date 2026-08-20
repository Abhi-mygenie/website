import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { setConsentChoice, hasConsentChoice } from "@/lib/gtm";

/**
 * CR-43 — Consent Mode v2 banner, compressed to a thin strip.
 * Logic unchanged — setConsentChoice / hasConsentChoice from gtm.js.
 * Layout: single 48px strip at bottom, full-width, dark background.
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
      className="fixed bottom-0 left-0 right-0 z-[70] bg-brand-deep/97 backdrop-blur-sm border-t border-white/10 h-12 flex items-center px-4 sm:px-6 gap-3"
    >
      <Lock className="w-3.5 h-3.5 text-brand-green shrink-0" />

      <p className="text-xs text-[#9DB1A4] flex-1 min-w-0 truncate">
        We use cookies to improve your experience.{" "}
        <a
          href="/privacy"
          className="text-brand-green hover:underline font-medium"
          data-testid="consent-privacy-link"
        >
          Learn more
        </a>
      </p>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => choose(false)}
          data-testid="consent-decline-btn"
          className="px-3 py-1 rounded-full border border-white/20 text-xs font-medium text-[#9DB1A4] hover:text-white hover:border-white/40 transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          data-testid="consent-accept-btn"
          className="px-3 py-1 rounded-full bg-brand-green hover:bg-brand-greenDark text-xs font-semibold text-white transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
