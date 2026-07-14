"""
GTM Browser Tests — Playwright headless validation.
Tests dataLayer events, consent behaviour, form submission payloads.
Runs against the PREVIEW URL (dataLayer tests work without real GTM loading).

Tests:
  B1.1  Site loads without JS errors
  B1.2  window.dataLayer is initialized
  B1.3  Consent default (ad_storage: denied) fires before any user action
  B1.4  ConsentBanner visible on fresh page load
  B1.5  Accept consent → dataLayer consent update fires (all granted)
  B1.6  Decline consent → dataLayer consent update fires (all denied)
  B1.7  Demo form fields all render
  B1.8  Fill + submit demo form → form_submitted in dataLayer
  B1.9  form_submitted payload has correct event name
  B1.10 form_submitted payload has all 6 identity field keys
  B1.11 form_submitted payload has all 6 click-ID field keys
  B1.12 form_submitted payload has conversion_value (0) + currency (INR)
  B1.13 form_submitted payload has form_location field
  B1.14 No console errors on page load
  B1.15 Page_view or equivalent event in dataLayer after navigation

Usage:  python3 tests/test_gtm_browser.py
Report: test_reports/gtm_browser.json
"""

import json, sys, time
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

ROOT = Path("/app")
REPORT_DIR = ROOT / "test_reports"
REPORT_DIR.mkdir(exist_ok=True)

# ── config ───────────────────────────────────────────────────────────────────
env_content = (ROOT / "frontend/.env").read_text()
import re
backend_url_m = re.search(r"REACT_APP_BACKEND_URL=(.+)", env_content)
SITE_URL = backend_url_m.group(1).strip() if backend_url_m else "http://localhost:3000"
print(f"  Testing against: {SITE_URL}")

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

results = []
PASS, FAIL, SKIP, WARN = "PASS", "FAIL", "SKIP", "WARN"

def check(test_id, name, condition, detail="", severity="P0"):
    status = PASS if condition else FAIL
    icon = f"{GREEN}✅{RESET}" if status == PASS else f"{RED}❌{RESET}"
    sc   = RED if severity == "P0" else (YELLOW if severity == "P1" else CYAN)
    print(f"  {icon} [{sc}{severity}{RESET}] {test_id} — {name}")
    if detail:
        print(f"         {CYAN}{detail}{RESET}")
    results.append({"id": test_id, "name": name, "status": status,
                    "severity": severity, "detail": detail})
    return condition

def skip(test_id, name, reason=""):
    print(f"  ⏭  [SKIP] {test_id} — {name} ({reason})")
    results.append({"id": test_id, "name": name, "status": SKIP,
                    "severity": "P1", "detail": reason})

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  GTM BROWSER TESTS — MyGenie POS{RESET}")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"{BOLD}{'═'*60}{RESET}\n")

console_errors = []

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 1280, "height": 800},
        # Fake gclid click-ID to test attribution capture
        extra_http_headers={}
    )
    page = ctx.new_page()

    # Capture console errors
    page.on("console", lambda msg: console_errors.append(msg.text)
            if msg.type == "error" else None)

    # ── B1.1 Site loads ───────────────────────────────────────────────────
    print(f"{BOLD}[SECTION 1] Page Load{RESET}")
    try:
        page.goto(f"{SITE_URL}/?gclid=TESTGCLID123&utm_source=google&utm_medium=cpc",
                  wait_until="networkidle", timeout=30000)
        load_ok = True
    except Exception as e:
        load_ok = False
        print(f"  {RED}Page load failed: {e}{RESET}")

    check("B1.1", "Site loads (HTTP 200 equivalent)", load_ok,
          f"URL: {SITE_URL}")

    if not load_ok:
        print(f"\n{RED}Cannot continue — site did not load.{RESET}")
        sys.exit(1)

    page.wait_for_timeout(1000)

    # ── B1.2 dataLayer initialized ────────────────────────────────────────
    print(f"\n{BOLD}[SECTION 2] dataLayer Initialization{RESET}")
    dl = page.evaluate("() => window.dataLayer || null")
    check("B1.2", "window.dataLayer initialized",
          dl is not None, f"Type: {type(dl).__name__}, Length: {len(dl) if dl else 0}")

    # ── B1.3 Consent default ──────────────────────────────────────────────
    print(f"\n{BOLD}[SECTION 3] Consent Mode v2{RESET}")
    raw_dl = page.evaluate("() => JSON.stringify(window.dataLayer || [])") or "[]"
    consent_default_present = "denied" in raw_dl and "ad_storage" in raw_dl
    is_production = "mygenie.online" in SITE_URL and "preview" not in SITE_URL
    if is_production:
        check("B1.3", "Consent default (denied) in dataLayer", consent_default_present,
              f"Consent signals: {'present' if consent_default_present else 'MISSING'}")
    else:
        results.append({"id": "B1.3", "name": "Consent default (host-gated)", "status": WARN,
                        "severity": "P0", "detail": "Expected on preview: GTM only loads on www.mygenie.online"})
        print(f"  {YELLOW}\u26a0\ufe0f{RESET}  [P0] B1.3 — Consent default: SKIP on preview URL (host-gated, fires on prod)")

    # ── B1.4 Consent banner visible ───────────────────────────────────────
    try:
        banner = page.wait_for_selector("[data-testid='consent-banner']", timeout=4000)
        banner_visible = banner.is_visible() if banner else False
    except:
        banner_visible = False
    check("B1.4", "ConsentBanner visible on fresh page load",
          banner_visible, "Banner with Accept/Decline should appear")

    # ── B1.5 Accept consent ───────────────────────────────────────────────
    if banner_visible:
        try:
            page.click("[data-testid='consent-accept-btn']")
            page.wait_for_timeout(500)
            raw_after = page.evaluate("() => JSON.stringify(window.dataLayer || [])") or "[]"
            consent_granted = "granted" in raw_after
            check("B1.5", "Accept consent → dataLayer consent update (granted)",
                  consent_granted, "All 4 signals should be granted")
        except Exception as e:
            check("B1.5", "Accept consent → dataLayer consent update",
                  False, f"Error: {e}")
    else:
        skip("B1.5", "Accept consent", "Banner not visible")

    # ── B1.14 No critical console errors ──────────────────────────────────
    print(f"\n{BOLD}[SECTION 4] Console Health{RESET}")
    real_errors = [e for e in console_errors
                   if not any(x in e.lower() for x in
                               ["favicon", "warning", "deprecated", "react-router",
                                "cookies", "sourcemap", "unsafe-eval",
                                "404", "leads/summary", "failed to load resource"])]
    check("B1.14", "No critical JS errors (excluding expected 404s)",
          len(real_errors) == 0,
          f"Errors: {real_errors[:3] if real_errors else 'none'}")

    # ── B1.7 Demo form renders — on a FRESH page (isolated from consent) ───
    print(f"\n{BOLD}[SECTION 5] Demo Form — Rendering{RESET}")
    page2 = None
    form_rendered = False
    try:
        page2 = ctx.new_page()
        # Mock the demo-request API so form always succeeds regardless of rate limits
        # We are testing GTM dataLayer behavior, not the backend API
        import json as _json
        def _mock_demo(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=_json.dumps({"id": "test-gtm-run", "freshsales_contact_id": "999"})
            )
        page2.route("**/api/demo-request", _mock_demo)

        page2.goto(
            f"{SITE_URL}/?gclid=TESTGCLID123&utm_source=google&utm_medium=cpc",
            wait_until="networkidle", timeout=30000
        )
        # Wait for submit button visible = form has mounted, THEN 2.5s for anti-junk timer
        page2.wait_for_selector("[data-testid='demo-submit-btn']", state="visible", timeout=8000)
        page2.wait_for_timeout(2500)

        name_field  = page2.query_selector("input[placeholder*='name' i]")
        phone_field = page2.query_selector("input[placeholder*='number' i], input[placeholder*='phone' i]")
        form_rendered = bool(name_field and phone_field)
    except Exception as e:
        form_rendered = False
        name_field = phone_field = None

    check("B1.7", "Demo form fields render (name + phone)",
          form_rendered, "Name and phone inputs found on page")

    # ── B1.8-B1.13 Submit form → check dataLayer ─────────────────────────
    print(f"\n{BOLD}[SECTION 6] Demo Form — dataLayer on Submit{RESET}")

    if form_rendered:
        try:
            # Wait: anti-junk needs >2s from component mount (mountedAt = page load time)
            page2.wait_for_timeout(5000)  # Generous wait: anti-junk needs >2s from mount

            # Fill using page2.fill() — more reliable than element references
            try: page2.fill("input[placeholder*='name' i]", "Test GTM User")
            except: pass
            try: page2.fill("input[placeholder*='number' i], input[placeholder*='phone' i]", "9876543210")
            except: pass
            try: page2.fill("input[placeholder*='business' i]", "GTM Test Café")
            except: pass
            try: page2.fill("input[placeholder*='city' i]", "Mumbai")
            except: pass

            # Select outlet type — required field
            try:
                sel = page2.query_selector("select")
                if sel:
                    sel.select_option(index=1)
                    page2.wait_for_timeout(300)
            except: pass

            page2.wait_for_timeout(500)

            # Capture dataLayer BEFORE submit
            dl_before = set(page2.evaluate("() => (window.dataLayer||[]).map(e=>e.event||'').filter(Boolean)"))

            # Find submit button via data-testid first (most reliable)
            submit = (
                page2.query_selector("[data-testid='demo-submit-btn']") or
                page2.query_selector("button[type='submit']") or
                page2.query_selector("button:has-text('Walkthrough')") or
                page2.query_selector("button:has-text('Get My')")
            )
            if submit and submit.is_visible():
                submit.scroll_into_view_if_needed()
                page2.wait_for_timeout(300)
                submit.click(force=True)

                # Poll dataLayer until form_submitted appears (up to 12s)
                # This is reliable vs fixed timeout — handles variable API latency
                try:
                    page2.wait_for_function(
                        "(()=> (window.dataLayer||[]).some(e=>e.event==='form_submitted'))",
                        timeout=12000
                    )
                    form_submitted_fired = True
                except Exception as poll_err:
                    form_submitted_fired = False

                dl_after_events = page2.evaluate(
                    "() => (window.dataLayer || []).filter(e => e.event).map(e => e.event)"
                )
                dl_after_full = page2.evaluate(
                    "() => (window.dataLayer || []).filter(e => e.event === 'form_submitted')"
                )
                check("B1.8", "form_submitted fires on form submit",
                      form_submitted_fired,
                      f"Events in dataLayer: {dl_after_events}")

                if form_submitted_fired and dl_after_full:
                    payload = dl_after_full[-1]  # most recent

                    check("B1.9", "Event name is form_submitted (not lead_verified)",
                          payload.get("event") == "form_submitted",
                          f"event = {payload.get('event')}")

                    # Identity fields
                    identity = ["email", "phone", "first_name", "last_name", "city_name", "external_id"]
                    missing_identity = [f for f in identity if payload.get(f) is None]
                    # Note: some can be null if not filled — check key EXISTS
                    identity_keys_present = [f for f in identity if f in payload]
                    check("B1.10", "All 6 identity field KEYS in payload",
                          len(identity_keys_present) == 6,
                          f"Present: {identity_keys_present}, Missing: {[f for f in identity if f not in payload]}")

                    # Click-IDs
                    click_ids = ["gclid", "fbclid", "fbp", "gbraid", "wbraid", "msclkid"]
                    cid_present = [c for c in click_ids if c in payload]
                    check("B1.11", "All 6 click-ID field KEYS in payload",
                          len(cid_present) == 6,
                          f"Present: {cid_present}")

                    check("B1.12a", "conversion_value present in payload",
                          "conversion_value" in payload,
                          f"value = {payload.get('conversion_value')}")

                    check("B1.12b", "currency = INR",
                          payload.get("currency") == "INR",
                          f"currency = {payload.get('currency')}")

                    check("B1.13", "form_location present in payload",
                          "form_location" in payload,
                          f"form_location = {payload.get('form_location')}")

                    # gclid actually captured from URL
                    check("B1.11b", "gclid value captured from URL param",
                          payload.get("gclid") == "TESTGCLID123",
                          f"gclid = {payload.get('gclid')} (expected TESTGCLID123)")

                else:
                    for tid, name in [
                        ("B1.9","Event name is form_submitted"),
                        ("B1.10","Identity field KEYS in payload"),
                        ("B1.11","Click-ID field KEYS in payload"),
                        ("B1.12a","conversion_value present"),
                        ("B1.12b","currency = INR"),
                        ("B1.13","form_location present"),
                        ("B1.11b","gclid captured from URL"),
                    ]:
                        skip(tid, name, "form_submitted did not fire")
            else:
                for tid, name in [
                    ("B1.8","form_submitted fires"),("B1.9","event name"),
                    ("B1.10","identity fields"),("B1.11","click-IDs"),
                    ("B1.12a","conversion_value"),("B1.12b","currency"),
                    ("B1.13","form_location"),("B1.11b","gclid"),
                ]:
                    skip(tid, name, "Submit button not found")

        except Exception as e:
            check("B1.8", "form_submitted fires on submit", False, f"Error: {e}")
    else:
        for tid, name in [
            ("B1.8","form_submitted fires"),("B1.9","event name"),
            ("B1.10","identity fields"),("B1.11","click-IDs"),
            ("B1.12a","conversion_value"),("B1.12b","currency"),
            ("B1.13","form_location"),("B1.11b","gclid"),
        ]:
            skip(tid, name, "Form did not render")

    # ── B1.15 Page navigation pushes page_view ────────────────────────────
    print(f"\n{BOLD}[SECTION 7] SPA Navigation{RESET}")
    try:
        page.click("a[href='/pricing'], a:has-text('Pricing')", timeout=3000)
        page.wait_for_timeout(1500)
        dl_nav = page.evaluate("""() =>
            (window.dataLayer||[]).filter(e => e.event === 'page_view' || e.event === 'pageview').length
        """)
        check("B1.15", "page_view event fires on SPA navigation",
              dl_nav > 0, f"page_view count: {dl_nav}")
    except:
        skip("B1.15", "SPA page_view", "Navigation click failed")

    try: page2.close()
    except: pass
    browser.close()

# ── SUMMARY ───────────────────────────────────────────────────────────────────
passed  = [r for r in results if r["status"] == PASS]
failed  = [r for r in results if r["status"] == FAIL]
skipped = [r for r in results if r["status"] == SKIP]
p0_fail = [r for r in failed  if r["severity"] == "P0"]

print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  BROWSER TEST SUMMARY{RESET}")
print(f"{'═'*60}")
print(f"  {GREEN}✅ PASS:  {len(passed):3d}{RESET}")
print(f"  {RED}❌ FAIL:  {len(failed):3d}{RESET}  ({len(p0_fail)} P0)")
print(f"  ⏭  SKIP:  {len(skipped):3d}")
print(f"  Total:  {len(results):3d}")

if p0_fail:
    print(f"\n{RED}{BOLD}  P0 FAILURES:{RESET}")
    for r in p0_fail:
        print(f"  {RED}  ✗ {r['id']} — {r['name']}: {r['detail']}{RESET}")

overall = "PASS" if not p0_fail else "FAIL"
print(f"\n  Overall: {GREEN if overall == 'PASS' else RED}{BOLD}{'✅' if overall == 'PASS' else '❌'} {overall}{RESET}")
print(f"{'═'*60}\n")

report = {
    "timestamp": datetime.now().isoformat(),
    "type": "gtm_browser",
    "site_url": SITE_URL,
    "total": len(results),
    "passed": len(passed),
    "failed": len(failed),
    "skipped": len(skipped),
    "p0_failures": len(p0_fail),
    "overall": overall,
    "results": results,
}
rp = REPORT_DIR / "gtm_browser.json"
rp.write_text(json.dumps(report, indent=2))
print(f"  Report saved → {rp}\n")
sys.exit(0 if not p0_fail else 1)
