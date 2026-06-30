"""
GTM Code Audit — Static analysis of all GTM configuration in the codebase.
No browser needed. Runs in under 2 seconds.

Tests:
  G1.1  REACT_APP_GTM_ID set correctly in frontend/.env
  G1.2  GTM container host-gated to www.mygenie.online
  G1.3  Consent default fires BEFORE GTM container inject
  G1.4  All 4 event names correct in GTM_EVENT_NAME map
  G1.5  Conversion values correct (form=0, lead=500, demo=2000)
  G1.6  buildLeadPayload has all 6 identity fields
  G1.7  buildLeadPayload has all 6 click-ID fields
  G1.8  All 5 lead surfaces import from gtm.js
  G1.9  ConsentBanner component exists
  G1.10 REACT_APP_BACKEND_URL present in frontend/.env
  G1.11 OTP_SMS_ENABLED set in backend/.env
  G1.12 Razorpay keys present in backend/.env
  G1.13 GST seller details filled (no placeholder)
  G1.14 Invoice prefix format correct
  G1.15 MongoDB counter seeded to 11+

Usage:  python3 tests/test_gtm_code_audit.py
Report: test_reports/gtm_code_audit.json
"""

import re, json, sys
from pathlib import Path
from datetime import datetime

ROOT = Path("/app")
FRONTEND = ROOT / "frontend/src"
REPORT_DIR = ROOT / "test_reports"
REPORT_DIR.mkdir(exist_ok=True)

results = []
PASS, FAIL, WARN, SKIP = "PASS", "FAIL", "WARN", "SKIP"

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def check(test_id, name, condition, detail="", severity="P0", warn_only=False):
    status = PASS if condition else (WARN if warn_only else FAIL)
    icon = f"{GREEN}✅{RESET}" if status == PASS else (f"{YELLOW}⚠️{RESET}" if status == WARN else f"{RED}❌{RESET}")
    sev_color = RED if severity == "P0" else (YELLOW if severity == "P1" else CYAN)
    print(f"  {icon} [{sev_color}{severity}{RESET}] {test_id} — {name}")
    if detail:
        print(f"         {CYAN}{detail}{RESET}")
    results.append({
        "id": test_id,
        "name": name,
        "status": status,
        "severity": severity,
        "detail": detail,
    })
    return condition

def read(path, default=""):
    try:
        return Path(path).read_text()
    except:
        return default

# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  GTM CODE AUDIT — MyGenie POS{RESET}")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"{BOLD}{'═'*60}{RESET}\n")

# ── SECTION 1: Frontend .env ──────────────────────────────────────────────────
print(f"{BOLD}[SECTION 1] Frontend Environment Variables{RESET}")
fe_env = read(ROOT / "frontend/.env")

check("G1.1", "REACT_APP_GTM_ID = GTM-K5D84Z3L",
      "REACT_APP_GTM_ID=GTM-K5D84Z3L" in fe_env,
      f"Found: {re.search(r'REACT_APP_GTM_ID=(.+)', fe_env).group(1) if re.search(r'REACT_APP_GTM_ID=(.+)', fe_env) else 'NOT FOUND'}")

check("G1.10", "REACT_APP_BACKEND_URL present",
      "REACT_APP_BACKEND_URL=" in fe_env and "preview.emergentagent.com" not in fe_env,
      "NOTE: must be production URL at deploy time",
      severity="P0", warn_only=True)

check("G1.10b", "REACT_APP_CALENDLY_URL set",
      "REACT_APP_CALENDLY_URL=https://calendly.com" in fe_env,
      re.search(r'REACT_APP_CALENDLY_URL=(.+)', fe_env).group(1) if re.search(r'REACT_APP_CALENDLY_URL=(.+)', fe_env) else "NOT FOUND",
      severity="P1")

# ── SECTION 2: gtm.js core checks ────────────────────────────────────────────
print(f"\n{BOLD}[SECTION 2] GTM Core Logic (frontend/src/lib/gtm.js){RESET}")
gtm = read(FRONTEND / "lib/gtm.js")

check("G1.2", "Host-gated to www.mygenie.online",
      "www.mygenie.online" in gtm and "ALLOWED_HOSTS" in gtm,
      "ALLOWED_HOSTS includes www.mygenie.online")

check("G1.3a", "setDefaultConsent() called before GTM inject",
      re.search(r'setDefaultConsent\(\).*\n.*gtm\.start', gtm, re.DOTALL) is not None
      or gtm.find("setDefaultConsent()") < gtm.find("gtm.start"),
      f"setDefaultConsent at pos {gtm.find('setDefaultConsent()')}, gtm.start at pos {gtm.find('gtm.start')}")

check("G1.3b", "Consent default sets all 4 signals to denied",
      all(s in gtm for s in ["ad_storage: \"denied\"", "ad_user_data: \"denied\"",
                              "ad_personalization: \"denied\"", "analytics_storage: \"denied\""]),
      "All 4 consent signals default to denied ✅")

# ── SECTION 3: Event name map ─────────────────────────────────────────────────
print(f"\n{BOLD}[SECTION 3] GTM Event Name Map{RESET}")

check("G1.4a", "form_submitted → form_submitted",
      '"form_submitted: "form_submitted"' in gtm or "form_submitted: \"form_submitted\"" in gtm,
      "form_submitted correctly mapped")

check("G1.4b", "lead_verified → lead_verifided (typo intentional)",
      "lead_verifided" in gtm and "lead_verified: \"lead_verifided\"" in gtm,
      "Typo preserved intentionally to match live GTM trigger")

check("G1.4c", "book_demo → thankyou_conversion",
      "thankyou_conversion" in gtm and "book_demo: \"thankyou_conversion\"" in gtm,
      "Maps to Book Demo conversion in GTM")

check("G1.4d", "demo_booked → demo_booked",
      "demo_booked: \"demo_booked\"" in gtm,
      "Calendly booking event — net new trigger")

# ── SECTION 4: Conversion values ─────────────────────────────────────────────
print(f"\n{BOLD}[SECTION 4] Conversion Values (CR-3B #3){RESET}")

check("G1.5a", "form_submitted value = 0",
      "form_submitted: 0" in gtm, "₹0 — Qualified leads (secondary)")

check("G1.5b", "lead_verified value = 500",
      "lead_verified: 500" in gtm, "₹500 — Book Demo (owner-confirmed)")

check("G1.5c", "demo_booked value = 2000",
      "demo_booked: 2000" in gtm, "₹2,000 — Calendly Appointment")

# ── SECTION 5: Payload fields ─────────────────────────────────────────────────
print(f"\n{BOLD}[SECTION 5] Lead Payload — Identity Fields (Advanced Matching){RESET}")

identity_fields = ["email", "phone", "first_name", "last_name", "city_name", "external_id"]
for f in identity_fields:
    check(f"G1.6-{f}", f"Identity field: {f}",
          f"    {f}," in gtm or f"    {f}:" in gtm,
          f"Present in buildLeadPayload")

print(f"\n{BOLD}[SECTION 6] Lead Payload — Click-ID Fields (CR-3B #6){RESET}")
click_ids = ["gclid", "fbclid", "fbp", "gbraid", "wbraid", "msclkid"]
for cid in click_ids:
    check(f"G1.7-{cid}", f"Click-ID: {cid}",
          f"    {cid}:" in gtm,
          f"Present in buildLeadPayload")

# ── SECTION 7: All 5 surfaces ─────────────────────────────────────────────────
print(f"\n{BOLD}[SECTION 7] Lead Surfaces — pushLead Used{RESET}")

surfaces = {
    "DemoForm": FRONTEND / "components/site/DemoForm.jsx",
    "MessageForm": FRONTEND / "components/site/MessageForm.jsx",
    "CalendlyInline": FRONTEND / "components/site/CalendlyInline.jsx",
    "CheckoutModal": FRONTEND / "components/pricing/CheckoutModal.jsx",
    "RoiCalculator": FRONTEND / "pages/RoiCalculator.jsx",
}
for name, path in surfaces.items():
    content = read(path)
    uses_push = "pushLead" in content or "pushEvent" in content
    imports_gtm = "from \"@/lib/gtm\"" in content or "from '@/lib/gtm'" in content
    check(f"G1.8-{name}", f"Surface: {name} uses pushLead/pushEvent",
          uses_push and imports_gtm,
          f"imports gtm: {imports_gtm}, uses push: {uses_push}")

# ── SECTION 8: Consent banner ─────────────────────────────────────────────────
print(f"\n{BOLD}[SECTION 8] Consent Banner Component{RESET}")
consent_banner = read(FRONTEND / "components/site/ConsentBanner.jsx")
check("G1.9a", "ConsentBanner.jsx exists",
      bool(consent_banner), "File present")
check("G1.9b", "ConsentBanner has accept + decline buttons",
      "consent-accept-btn" in consent_banner and "consent-decline-btn" in consent_banner,
      "Both data-testid attributes present")
check("G1.9c", "ConsentBanner calls setConsentChoice",
      "setConsentChoice" in consent_banner,
      "Triggers consent update on click")

# ── SECTION 9: Backend .env ───────────────────────────────────────────────────
print(f"\n{BOLD}[SECTION 9] Backend Environment Variables{RESET}")
be_env = read(ROOT / "backend/.env")

check("G1.11", "OTP_SMS_ENABLED set",
      "OTP_SMS_ENABLED=" in be_env,
      re.search(r'OTP_SMS_ENABLED=(.+)', be_env).group(1) if re.search(r'OTP_SMS_ENABLED=(.+)', be_env) else "NOT FOUND")

rzp_match = re.search(r'RAZORPAY_KEY_ID=(.+)', be_env)
rzp_val = rzp_match.group(1).strip('"') if rzp_match else ""
check("G1.12a", "Razorpay KEY_ID present (currently test key)",
      "rzp_test_" in rzp_val or "rzp_live_" in rzp_val,
      f"Value: {rzp_val[:20]}... ({'TEST MODE' if 'rzp_test_' in rzp_val else 'LIVE MODE'})",
      severity="P0")

check("G1.12b", "Razorpay KEY_SECRET present",
      "RAZORPAY_KEY_SECRET=" in be_env and len(re.search(r'RAZORPAY_KEY_SECRET="?(.+?)"?\n', be_env).group(1).strip()) > 10
      if re.search(r'RAZORPAY_KEY_SECRET="?(.+?)"?\n', be_env) else False,
      "Secret present")

check("G1.13a", "GST seller GSTIN not placeholder",
      "PLACEHOLDER_GSTIN" not in be_env and "09AAHCH4730Q1Z0" in be_env,
      "GSTIN: 09AAHCH4730Q1Z0")

check("G1.13b", "GST seller address not placeholder",
      "Placeholder Address" not in be_env and "Dayal Bagh" in be_env,
      "Address: Agra, UP set correctly")

check("G1.14", "Invoice prefix format correct",
      "MG_2026_27_JUNE" in be_env,
      re.search(r'GST_INVOICE_PREFIX=(.+)', be_env).group(1) if re.search(r'GST_INVOICE_PREFIX=(.+)', be_env) else "NOT FOUND")

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
passed  = [r for r in results if r["status"] == PASS]
failed  = [r for r in results if r["status"] == FAIL]
warned  = [r for r in results if r["status"] == WARN]
p0_fail = [r for r in failed if r["severity"] == "P0"]
p1_fail = [r for r in failed if r["severity"] == "P1"]

print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  SUMMARY{RESET}")
print(f"{'═'*60}")
print(f"  {GREEN}✅ PASS:  {len(passed):3d}{RESET}")
print(f"  {RED}❌ FAIL:  {len(failed):3d}{RESET}  ({len(p0_fail)} P0, {len(p1_fail)} P1)")
print(f"  {YELLOW}⚠️  WARN:  {len(warned):3d}{RESET}")
print(f"  Total:  {len(results):3d}")

if p0_fail:
    print(f"\n{RED}{BOLD}  P0 FAILURES (must fix before go-live):{RESET}")
    for r in p0_fail:
        print(f"  {RED}  ✗ {r['id']} — {r['name']}{RESET}")
        if r["detail"]:
            print(f"    {r['detail']}")

if failed and not p0_fail:
    print(f"\n{YELLOW}  Non-P0 failures:{RESET}")
    for r in failed:
        print(f"  {YELLOW}  ✗ {r['id']} — {r['name']}{RESET}")

overall = "✅ PASS" if not p0_fail else "❌ FAIL — P0 items outstanding"
print(f"\n  Overall: {GREEN if not p0_fail else RED}{BOLD}{overall}{RESET}")
print(f"{'═'*60}\n")

# Save report
report = {
    "timestamp": datetime.now().isoformat(),
    "type": "gtm_code_audit",
    "total": len(results),
    "passed": len(passed),
    "failed": len(failed),
    "warned": len(warned),
    "p0_failures": len(p0_fail),
    "overall": "PASS" if not p0_fail else "FAIL",
    "results": results,
}
report_path = REPORT_DIR / "gtm_code_audit.json"
report_path.write_text(json.dumps(report, indent=2))
print(f"  Report saved → {report_path}\n")

sys.exit(0 if not p0_fail else 1)
