/**
 * GTM Console Snippet — MyGenie POS
 * ============================================================
 * Paste this entire snippet into browser DevTools console on
 * www.mygenie.online (or preview URL) to get an instant
 * PASS/FAIL dashboard of all GTM tracking.
 *
 * Run AFTER you have:
 *  1. Submitted the demo form (to populate form_submitted)
 *  2. Verified OTP (to populate lead_verifided)
 *  3. Booked Calendly (to populate demo_booked) — optional
 *
 * Usage: Copy → paste into Console → press Enter
 * ============================================================
 */

(function GTMValidator() {
  const dl = window.dataLayer || [];
  const results = [];

  const PASS = '✅ PASS';
  const FAIL = '❌ FAIL';
  const WARN = '⚠️  WARN';
  const SKIP = '⏭  SKIP';

  function check(id, name, condition, detail, severity = 'P0') {
    const status = condition ? PASS : FAIL;
    results.push({ id, name, status, detail, severity });
    return condition;
  }

  function findEvents(eventName) {
    return dl.filter(e => e && e.event === eventName);
  }

  function latest(eventName) {
    const evts = findEvents(eventName);
    return evts.length ? evts[evts.length - 1] : null;
  }

  const REQUIRED_IDENTITY = ['email','phone','first_name','last_name','city_name','external_id'];
  const REQUIRED_CLICKIDS  = ['gclid','fbclid','fbp','gbraid','wbraid','msclkid'];

  // ── 1. dataLayer health ────────────────────────────────────────────────────
  check('DL-1', 'window.dataLayer exists', !!window.dataLayer,
    `Type: ${typeof window.dataLayer}, Length: ${dl.length}`);

  const consentStr = JSON.stringify(dl);
  check('DL-2', 'Consent default (denied) fired before GTM',
    consentStr.includes('denied') && consentStr.includes('ad_storage'),
    'Consent Mode v2 default should be set');

  check('DL-3', 'GTM container loaded',
    document.querySelector('script[src*="googletagmanager.com/gtm.js"]') !== null,
    'GTM script tag present in DOM (only loads on www.mygenie.online)');

  // ── 2. form_submitted ─────────────────────────────────────────────────────
  const fs = latest('form_submitted');
  check('EV-1', 'form_submitted event fired',
    !!fs, fs ? 'Present ✓' : 'NOT FOUND — submit the demo form first');

  if (fs) {
    check('EV-1a', 'form_submitted: conversion_value = "0" or 0',
      String(fs.conversion_value) === '0',
      `conversion_value = ${fs.conversion_value}`);

    check('EV-1b', 'form_submitted: currency = INR',
      fs.currency === 'INR', `currency = ${fs.currency}`);

    const missingId = REQUIRED_IDENTITY.filter(f => !(f in fs));
    check('EV-1c', 'form_submitted: all 6 identity fields present',
      missingId.length === 0,
      missingId.length ? `Missing: ${missingId.join(', ')}` : 'All present ✓');

    const missingCid = REQUIRED_CLICKIDS.filter(f => !(f in fs));
    check('EV-1d', 'form_submitted: all 6 click-ID fields present',
      missingCid.length === 0,
      missingCid.length ? `Missing: ${missingCid.join(', ')}` : 'All present ✓');

    check('EV-1e', 'form_submitted: form_location present',
      'form_location' in fs, `form_location = ${fs.form_location}`);

    check('EV-1f', 'form_submitted: lead_quality present',
      'lead_quality' in fs, `lead_quality = ${fs.lead_quality}`);

    check('EV-1g', 'form_submitted: event_id present',
      'event_id' in fs, `event_id = ${fs.event_id}`);
  } else {
    ['EV-1a','EV-1b','EV-1c','EV-1d','EV-1e','EV-1f','EV-1g'].forEach(id =>
      results.push({ id, name: id, status: SKIP, detail: 'No form_submitted event', severity: 'P0' }));
  }

  // ── 3. lead_verifided (typo matches GTM trigger) ───────────────────────────
  const lv = latest('lead_verifided');
  check('EV-2', 'lead_verifided event fired (OTP verified)',
    !!lv, lv ? 'Present ✓' : 'NOT FOUND — verify OTP on demo form first');

  if (lv) {
    check('EV-2a', 'lead_verifided: conversion_value = 500',
      String(lv.conversion_value) === '500',
      `conversion_value = ${lv.conversion_value}`);

    check('EV-2b', 'lead_verifided: otp_verified = true',
      lv.otp_verified === true, `otp_verified = ${lv.otp_verified}`);

    const missingId2 = REQUIRED_IDENTITY.filter(f => !(f in lv));
    check('EV-2c', 'lead_verifided: all 6 identity fields present',
      missingId2.length === 0,
      missingId2.length ? `Missing: ${missingId2.join(', ')}` : 'All present ✓');
  }

  // ── 4. thankyou_conversion (book_demo) ────────────────────────────────────
  const tc = latest('thankyou_conversion');
  check('EV-3', 'thankyou_conversion event fired (demo form success)',
    !!tc, tc ? 'Present ✓' : 'NOT FOUND — complete demo form submission');

  if (tc) {
    check('EV-3a', 'thankyou_conversion: conversion_value = 500',
      String(tc.conversion_value) === '500', `conversion_value = ${tc.conversion_value}`);
  }

  // ── 5. demo_booked (Calendly) ─────────────────────────────────────────────
  const db = latest('demo_booked');
  check('EV-4', 'demo_booked event fired (Calendly booked)',
    !!db, db ? 'Present ✓' : 'NOT FOUND — book via Calendly widget first');

  if (db) {
    check('EV-4a', 'demo_booked: conversion_value = 2000',
      String(db.conversion_value) === '2000', `conversion_value = ${db.conversion_value}`);
  }

  // ── 6. page_view ──────────────────────────────────────────────────────────
  check('EV-5', 'page_view event fired',
    findEvents('page_view').length > 0,
    `page_view count: ${findEvents('page_view').length}`);

  // ── 7. purchase (payment) ─────────────────────────────────────────────────
  const pu = latest('purchase');
  if (pu) {
    check('EV-6', 'purchase event fired (payment success)',
      true, `transaction_id: ${pu.transaction_id}, value: ${pu.value}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER RESULTS
  // ─────────────────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.status === PASS).length;
  const failed  = results.filter(r => r.status === FAIL).length;
  const skipped = results.filter(r => r.status === SKIP).length;
  const p0fail  = results.filter(r => r.status === FAIL && r.severity === 'P0');

  console.group('%c🔍 MyGenie GTM Validation Report', 'font-size:14px;font-weight:bold;color:#f26b33');
  console.log(`%cTimestamp: ${new Date().toLocaleString()}`, 'color:#6b7280');
  console.log(`%cTested against: ${window.location.href}`, 'color:#6b7280');
  console.log('');

  results.forEach(r => {
    const col =
      r.status === PASS ? 'color:#16a34a' :
      r.status === FAIL ? 'color:#dc2626' :
      r.status === WARN ? 'color:#d97706' : 'color:#9ca3af';
    console.log(`%c${r.status} [${r.severity}] ${r.id} — ${r.name}`, col);
    if (r.detail) console.log(`%c  → ${r.detail}`, 'color:#9ca3af;font-size:11px');
  });

  console.log('');
  console.log(`%c━━━ SUMMARY ━━━`, 'font-weight:bold;color:#111827');
  console.log(`%c✅ PASS:  ${passed}  ❌ FAIL: ${failed}  ⏭ SKIP: ${skipped}`, 'font-size:13px');
  console.log(`%cOverall: ${p0fail.length === 0 ? '✅ PASS' : '❌ FAIL — ' + p0fail.length + ' P0 items outstanding'}`,
    `font-weight:bold;color:${p0fail.length === 0 ? '#16a34a' : '#dc2626'}`);

  if (p0fail.length) {
    console.group('%c❌ P0 Failures (must fix before go-live):', 'color:#dc2626;font-weight:bold');
    p0fail.forEach(r => console.log(`%c  ✗ ${r.id} — ${r.name}: ${r.detail}`, 'color:#dc2626'));
    console.groupEnd();
  }

  console.groupEnd();

  return { passed, failed, skipped, p0Failures: p0fail.length, results };
})();
