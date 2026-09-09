import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pushEvent } from "@/lib/gtm";

/**
 * Fires scroll_depth GTM events at 25%, 50%, 75% thresholds.
 * Resets on route change. Passive scroll listener — no performance impact.
 * Use as a component inside BrowserRouter so useLocation works.
 */
export default function ScrollDepthTracker() {
  const { pathname } = useLocation();
  const fired = useRef(new Set());

  useEffect(() => {
    fired.current = new Set();

    const THRESHOLDS = [25, 50, 75];

    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;

      const pct = Math.round((scrolled / total) * 100);

      THRESHOLDS.forEach((t) => {
        if (pct >= t && !fired.current.has(t)) {
          fired.current.add(t);
          pushEvent("scroll_depth", {
            percent: t,
            page_path: pathname,
            device: window.innerWidth < 1024 ? "mobile" : "desktop",
          });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}
