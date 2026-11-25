/**
 * CR-98 — Singleton Calendly script loader.
 *
 * Problem: DemoForm.jsx, CalendlyInline.jsx, and PetpoojaAlternative.jsx each
 * had independent loadCalendly* functions. If two components race to load
 * widget.js simultaneously (before window.Calendly is set), both could inject
 * duplicate <script> tags.
 *
 * Fix: one module-level promise (_loadPromise). All callers share it. First
 * call loads the script; subsequent calls return the same resolved promise.
 * No duplicate network request, no race condition.
 *
 * CR-50 safety: ensureCalendlyCss() is called inside the singleton so the
 * overlay CSS is injected exactly once, regardless of which component calls first.
 */
import { ensureCalendlyCss } from "./calendlyCss";

const CALENDLY_SRC = "https://assets.calendly.com/assets/external/widget.js";
let _loadPromise = null;

export function loadCalendly() {
  if (_loadPromise) return _loadPromise;
  ensureCalendlyCss();
  _loadPromise = new Promise((resolve) => {
    if (window.Calendly) return resolve();
    const existing = document.querySelector(`script[src="${CALENDLY_SRC}"]`);
    if (existing) { existing.addEventListener("load", () => resolve()); return; }
    const s = document.createElement("script");
    s.src = CALENDLY_SRC; s.async = true; s.onload = () => resolve();
    document.body.appendChild(s);
  });
  return _loadPromise;
}
