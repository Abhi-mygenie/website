import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Sticky bottom CTA bar — mobile only (hidden on lg+).
 * Slides up once the hero section scrolls out of view.
 * Tapping the button scrolls to #demo and fires onDemo if provided.
 */
export default function StickyMobileCta({ onDemo }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    // Observe the hero sentinel — when it leaves viewport, show the bar
    heroRef.current = document.querySelector('[data-testid="hero"]');
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!dismissed) setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [dismissed]);

  const handleClick = () => {
    if (onDemo) {
      onDemo();
    } else {
      document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (dismissed) return null;

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      data-testid="sticky-mobile-cta"
    >
      {/* Safe-area padding for iPhone home bar */}
      <div className="bg-brand-deep border-t border-brand-green/30 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center gap-3 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
        <button
          onClick={handleClick}
          data-testid="sticky-mobile-cta-btn"
          className="flex-1 bg-brand-green hover:bg-brand-greenDark active:scale-[0.98] text-white font-bold rounded-full py-3.5 flex items-center justify-center gap-2 text-[15px] transition-all shadow-[0_6px_18px_rgba(24,168,74,0.35)]"
        >
          Book a Free Demo
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setVisible(false); setDismissed(true); }}
          data-testid="sticky-mobile-cta-dismiss"
          aria-label="Dismiss"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#5B7A68] hover:text-white transition-colors shrink-0 text-lg font-light"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
