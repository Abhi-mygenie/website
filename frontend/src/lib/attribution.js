/**
 * CR-2 — Attribution & Data Capture (no-cost, client-side).
 *
 * Captures marketing attribution + device context and exposes it as a flat
 * object to attach to every lead form. Persistence model:
 *   - FIRST touch  -> localStorage  (set once, survives across visits)
 *   - LAST  touch  -> sessionStorage (refreshed whenever campaign params appear)
 *   - engagement   -> sessionStorage (pages viewed + session start time)
 *
 * Everything is best-effort: storage may be blocked (private mode) — we never throw.
 */
const FIRST_KEY = "mg_attr_first";
const LAST_KEY = "mg_attr_last";
const SESSION_START = "mg_session_start";
const PAGES_VIEWED = "mg_pages_viewed";

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
const CLICK_PARAMS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid"];

function readParams() {
  const p = new URLSearchParams(window.location.search);
  const out = {};
  [...UTM_PARAMS, ...CLICK_PARAMS].forEach((k) => {
    const v = p.get(k);
    if (v) out[k] = v;
  });
  return out;
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? m[2] : null;
}

function deviceInfo() {
  const ua = navigator.userAgent || "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  return { device_type: isMobile ? "mobile" : "desktop", os, browser };
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Call on every route change: seeds first-touch, refreshes last-touch, counts pages. */
export function initAttribution() {
  try {
    const params = readParams();
    const now = new Date().toISOString();

    if (!localStorage.getItem(FIRST_KEY)) {
      localStorage.setItem(
        FIRST_KEY,
        JSON.stringify({
          ...params,
          landing_page: window.location.pathname + window.location.search,
          referrer: document.referrer || null,
          first_seen: now,
        })
      );
    }

    // Refresh last-touch only when a fresh campaign/click param is present.
    if (Object.keys(params).length) {
      sessionStorage.setItem(LAST_KEY, JSON.stringify({ ...params, last_seen: now }));
    }

    if (!sessionStorage.getItem(SESSION_START)) sessionStorage.setItem(SESSION_START, now);
    const pv = parseInt(sessionStorage.getItem(PAGES_VIEWED) || "0", 10) + 1;
    sessionStorage.setItem(PAGES_VIEWED, String(pv));
  } catch {
    /* storage blocked — ignore */
  }
}

/** Flat attribution payload to attach to a lead form submission. */
export function getAttribution() {
  let first = {};
  let last = {};
  try {
    first = safeParse(localStorage.getItem(FIRST_KEY));
    last = safeParse(sessionStorage.getItem(LAST_KEY));
  } catch {
    /* ignore */
  }

  let timeOnSite = 0;
  try {
    const start = sessionStorage.getItem(SESSION_START);
    if (start) timeOnSite = Math.max(0, Math.round((Date.now() - new Date(start).getTime()) / 1000));
  } catch {
    /* ignore */
  }

  const dev = deviceInfo();
  let pagesViewed = 1;
  try {
    pagesViewed = parseInt(sessionStorage.getItem(PAGES_VIEWED) || "1", 10);
  } catch {
    /* ignore */
  }

  return {
    // first touch
    first_utm_source: first.utm_source || null,
    first_utm_medium: first.utm_medium || null,
    first_utm_campaign: first.utm_campaign || null,
    // last touch
    last_utm_source: last.utm_source || null,
    last_utm_medium: last.utm_medium || null,
    last_utm_campaign: last.utm_campaign || null,
    // shared campaign detail (prefer last touch)
    utm_term: last.utm_term || first.utm_term || null,
    utm_content: last.utm_content || first.utm_content || null,
    // click ids
    gclid: last.gclid || first.gclid || null,
    fbclid: last.fbclid || first.fbclid || null,
    gbraid: last.gbraid || first.gbraid || null,
    wbraid: last.wbraid || first.wbraid || null,
    msclkid: last.msclkid || first.msclkid || null,
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
    // page context
    landing_page: first.landing_page || null,
    conversion_page: window.location.pathname || null,
    referrer: first.referrer || null,
    // device / locale
    device_type: dev.device_type,
    os: dev.os,
    browser: dev.browser,
    language: navigator.language || null,
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      } catch {
        return null;
      }
    })(),
    // engagement
    pages_viewed: pagesViewed,
    time_on_site: timeOnSite,
  };
}
