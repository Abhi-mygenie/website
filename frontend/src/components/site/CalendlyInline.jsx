import { useEffect, useRef } from "react";
import { pushLead, newEventId } from "@/lib/gtm";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

function loadCalendly() {
  return new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

/**
 * Inline Calendly scheduler. Works on every Calendly plan (uses the in-browser
 * `event_scheduled` message — no webhook/paid plan required).
 */
const BRAND_PAGE_SETTINGS = {
  backgroundColor: "ffffff",
  primaryColor: "18A84A", // MyGenie brand green
  textColor: "14201A", // brand ink
  hideGdprBanner: true,
  hideLandingPageDetails: true,
  hideEventTypeDetails: true,
};

function withBrandParams(rawUrl, s) {
  try {
    const u = new URL(rawUrl);
    const p = u.searchParams;
    if (s.backgroundColor) p.set("background_color", s.backgroundColor);
    if (s.primaryColor) p.set("primary_color", s.primaryColor);
    if (s.textColor) p.set("text_color", s.textColor);
    if (s.hideGdprBanner) p.set("hide_gdpr_banner", "1");
    if (s.hideLandingPageDetails) p.set("hide_landing_page_details", "1");
    if (s.hideEventTypeDetails) p.set("hide_event_type_details", "1");
    return u.toString();
  } catch {
    return rawUrl;
  }
}

export default function CalendlyInline({ url, prefill, utm, pageSettings, onScheduled, eventId, leadContext }) {
  const ref = useRef(null);
  const inited = useRef(false);
  const scheduled = useRef(false);
  const prefillRef = useRef(prefill);
  const utmRef = useRef(utm);
  const leadContextRef = useRef(leadContext);
  const eventIdRef = useRef(eventId);
  const settings = { ...BRAND_PAGE_SETTINGS, ...(pageSettings || {}) };
  const brandedUrl = withBrandParams(url, settings);

  useEffect(() => {
    prefillRef.current = prefill;
    utmRef.current = utm;
    leadContextRef.current = leadContext;
    eventIdRef.current = eventId;
  }, [prefill, utm, leadContext, eventId]);

  useEffect(() => {
    let active = true;
    loadCalendly().then(() => {
      if (!active || inited.current || !ref.current || !window.Calendly) return;
      inited.current = true;
      ref.current.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: brandedUrl,
        parentElement: ref.current,
        prefill: prefillRef.current || {},
        utm: utmRef.current || {},
      });
    });
    return () => {
      active = false;
    };
  }, [brandedUrl]);

  useEffect(() => {
    const handler = (e) => {
      if (typeof e.data !== "object" || !e.data) return;
      if (String(e.data.event || "").indexOf("calendly") !== 0) return;
      if (e.data.event === "calendly.event_scheduled" && !scheduled.current) {
        scheduled.current = true;
        const ctx = leadContextRef.current || {};
        pushLead("demo_booked", ctx, ctx.sector, eventIdRef.current || newEventId(), {
          form_location: "calendly",
          otp_verified: ctx.otp_verified ?? null,
        });
        if (onScheduled) onScheduled();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onScheduled]);

  return (
    <div
      ref={ref}
      data-testid="calendly-inline"
      style={{ minWidth: "280px", height: "660px" }}
    />
  );
}
