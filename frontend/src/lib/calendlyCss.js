/**
 * CR-50 — Calendly overlay/popup wrapper CSS.
 *
 * Background: Calendly's widget.js historically self-injected the CSS that
 * positions its .calendly-overlay + .calendly-popup wrapper (position:fixed,
 * z-index:9999, centered modal). In the version served from
 *   https://assets.calendly.com/assets/external/widget.js
 * (fetched 2026-07-05) those styles are no longer being applied to the parent
 * document — the overlay renders as position:static at the bottom of the DOM,
 * invisible to users. Result: 100% of demo bookings site-wide were failing.
 *
 * Fix: we ship the styles ourselves. Class names are Calendly-owned and used
 * nowhere else in this codebase. If Calendly ever restores self-injection,
 * the two style sets are identical → no regression.
 *
 * Injection is idempotent: guarded by an element id and safe to call from any
 * component that opens a Calendly widget.
 */

const STYLE_ID = "cr50-calendly-css";

const CALENDLY_CSS = `
.calendly-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(31, 31, 31, 0.4);
}
.calendly-overlay .calendly-close-overlay {
  position: absolute;
  inset: 0;
}
.calendly-overlay .calendly-popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1000px;
  max-width: 100%;
  height: 90%;
  max-height: 680px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.calendly-overlay .calendly-popup-content {
  width: 100%;
  height: 100%;
}
.calendly-overlay .calendly-popup-close {
  position: absolute;
  top: -30px;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fff'><path d='M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.42 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.42L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z'/></svg>");
  background-repeat: no-repeat;
}
@media (max-width: 767px) {
  .calendly-overlay .calendly-popup {
    position: fixed;
    inset: 50px 0 0 0;
    width: 100%;
    height: auto;
    max-height: none;
    transform: none;
    border-radius: 0;
  }
  .calendly-overlay .calendly-popup-close {
    top: 15px;
    right: 15px;
    background-color: #000;
    padding: 8px;
    border-radius: 4px;
  }
}
`;

export function ensureCalendlyCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.setAttribute("data-cr", "CR-50");
  el.textContent = CALENDLY_CSS;
  document.head.appendChild(el);
}
