/**
 * CR-3 A — Client-side GTM + dataLayer (ONLINE conversions only).
 *
 * Loads the existing GTM container and pushes the same events the live site uses, so the
 * owner's existing GA4 / Meta Pixel / Google Ads tags fire unchanged. No backend, no Meta CAPI,
 * no Google Ads API, no Zapier. See /app/CR-3A_Build_Spec.md.
 *
 * Production-gated: the container is injected ONLY when an env id is present AND we're on an
 * allowed production host — so the preview/QA environment never pollutes GA4/Ads. `pushEvent`
 * still queues to window.dataLayer regardless (harmless if GTM is not loaded).
 */
import { getAttribution } from "@/lib/attribution";

const GTM_ID = process.env.REACT_APP_GTM_ID;
const ALLOWED_HOSTS = ["www.mygenie.online", "mygenie.online"];

function gtmAllowed() {
  if (!GTM_ID) return false;
  try {
    return ALLOWED_HOSTS.includes(window.location.hostname);
  } catch {
    return false;
  }
}

let inited = false;

/** Inject the GTM container once. No-op unless env id is set AND host is allowed. */
export function initGtm() {
  if (inited || !gtmAllowed()) return;
  inited = true;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    const first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(s, first);

    const ns = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.googletagmanager.com/ns.html?id=" + GTM_ID;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  } catch {
    /* ignore — never break the app for analytics */
  }
}

/** Push a custom event to dataLayer. Safe even if GTM isn't loaded (queues harmlessly). */
export function pushEvent(event, payload = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...payload });
  } catch {
    /* ignore */
  }
}

/** Unique event id — dedup key + funnel stitch across form_submitted -> lead_verified -> demo_booked. */
export function newEventId() {
  try {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Normalize email for hashing/match (lowercase + trim). */
function normEmail(v) {
  const s = (v == null ? "" : String(v)).trim().toLowerCase();
  return s || null;
}

/** Normalize phone to E.164 (India default +91, last 10 digits). */
function normPhone(v) {
  const digits = (v == null ? "" : String(v)).replace(/\D/g, "");
  if (digits.length < 10) return null;
  return "+91" + digits.slice(-10);
}

/** Split a full name into first/last for Meta Advanced Matching (fn/ln). */
function splitName(v) {
  const parts = (v == null ? "" : String(v)).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first_name: null, last_name: null };
  return { first_name: parts[0], last_name: parts.length > 1 ? parts.slice(1).join(" ") : null };
}

/**
 * Single source of truth for the lead conversion payload (mirrors the live-site contract).
 * Best-effort form fields; missing keys -> null (never omitted). Pulls click ids from CR-2.
 * Includes Enhanced Conversions / Advanced Matching fields (email/phone normalized, name split,
 * external_id) so GTM can hash + map them. Hashing happens in GTM — raw values never leave hashed.
 */
export function buildLeadPayload(form = {}, sector, eventId) {
  const attr = getAttribution();
  const email = normEmail(form.email);
  const phone = normPhone(form.phone);
  const { first_name, last_name } = splitName(form.name);
  return {
    // identity (Enhanced Conversions / Advanced Matching)
    name: form.name || null,
    first_name,
    last_name,
    email,
    phone,
    external_id: phone || email || null,
    // lead context
    outlet_type: sector || form.outlet_type || null,
    outlet_name: form.business_name || null,
    city_name: form.city || null,
    message: form.message || "",
    // event meta
    page_url: window.location.href,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId || newEventId(),
    currency: "INR",
    conversion_value: "0",
    // attribution / click ids (CR-2)
    gclid: attr.gclid || null,
    fbclid: attr.fbclid || null,
    fbp: attr.fbp || null,
    source: attr.last_utm_source || attr.first_utm_source || null,
  };
}
