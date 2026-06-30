#!/usr/bin/env python3
"""
GTM Regression Master Runner
Runs all GTM validation tests and produces a combined report.

Usage:
  python3 tests/run_gtm_tests.py          # run all
  python3 tests/run_gtm_tests.py --audit  # code audit only (fast)
  python3 tests/run_gtm_tests.py --browser # browser tests only
"""

import sys, json, subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path("/app")
REPORT_DIR = ROOT / "test_reports"
REPORT_DIR.mkdir(exist_ok=True)

GREEN = "\033[92m"; RED = "\033[91m"; YELLOW = "\033[93m"
BOLD  = "\033[1m";  RESET = "\033[0m"; CYAN = "\033[96m"

mode = sys.argv[1] if len(sys.argv) > 1 else "--all"

print(f"\n{BOLD}{'═'*65}{RESET}")
print(f"{BOLD}  MyGenie POS — GTM REGRESSION SUITE{RESET}")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"  Mode: {mode}")
print(f"{BOLD}{'═'*65}{RESET}\n")

summary = {"timestamp": datetime.now().isoformat(), "suites": []}

def run_suite(label, script):
    print(f"{BOLD}▶ Running: {label}{RESET}")
    print(f"{'─'*50}")
    result = subprocess.run(
        ["python3", str(script)],
        cwd=str(ROOT),
        capture_output=False,
    )
    status = "PASS" if result.returncode == 0 else "FAIL"
    color  = GREEN if status == "PASS" else RED
    print(f"\n{color}{BOLD}  Suite result: {status}{RESET}\n")

    # Load report if it exists
    report_map = {
        "tests/test_gtm_code_audit.py":          "test_reports/gtm_code_audit.json",
        "tests/test_gtm_browser.py":             "test_reports/gtm_browser.json",
        "tests/test_freshsales_integration.py":  "test_reports/freshsales_integration.json",
    }
    rp = ROOT / report_map.get(str(script.relative_to(ROOT)), "")
    data = {}
    if rp.exists():
        try: data = json.loads(rp.read_text())
        except: pass

    summary["suites"].append({
        "label": label,
        "status": status,
        "passed": data.get("passed", "?"),
        "failed": data.get("failed", "?"),
        "skipped": data.get("skipped", 0),
        "total":  data.get("total",  "?"),
        "p0_failures": data.get("p0_failures", "?"),
    })
    return status == "PASS"

all_pass = True

if mode in ("--all", "--audit"):
    ok = run_suite("Code Audit (static)", ROOT / "tests/test_gtm_code_audit.py")
    all_pass = all_pass and ok

if mode in ("--all", "--browser"):
    ok = run_suite("Browser Tests (Playwright)", ROOT / "tests/test_gtm_browser.py")
    all_pass = all_pass and ok

if mode in ("--all", "--freshsales"):
    ok = run_suite("Freshsales + OTP Integration", ROOT / "tests/test_freshsales_integration.py")
    all_pass = all_pass and ok

# ── COMBINED SUMMARY ──────────────────────────────────────────────────────────
print(f"{BOLD}{'═'*65}{RESET}")
print(f"{BOLD}  COMBINED RESULTS{RESET}")
print(f"{'═'*65}")
total_passed = total_failed = total_p0 = 0
for s in summary["suites"]:
    c = GREEN if s["status"] == "PASS" else RED
    def _int(v): return int(v) if str(v).isdigit() else 0
    tp  = _int(s.get("passed",     0))
    tf  = _int(s.get("failed",      0))
    tp0 = _int(s.get("p0_failures", 0))
    total_passed += tp; total_failed += tf; total_p0 += tp0
    print(f"  {c}{s['status']}{RESET}  {s['label']:<40} "
          f"{GREEN}{tp} pass{RESET} / {RED}{tf} fail{RESET} / {RED if tp0 else GREEN}{tp0} P0 fail{RESET}")

print(f"{'─'*65}")
print(f"  Totals: {GREEN}{total_passed} passed{RESET}  {RED}{total_failed} failed{RESET}  "
      f"({RED if total_p0 else GREEN}{total_p0} P0{RESET})")
print(f"\n  Overall: {GREEN if all_pass else RED}{BOLD}{'✅ ALL PASS' if all_pass else '❌ FAILURES DETECTED'}{RESET}")
print(f"{'═'*65}\n")

# ── HOW TO USE CONSOLE SNIPPET ────────────────────────────────────────────────
snippet_path = ROOT / "tests/gtm_console_snippet.js"
print(f"{BOLD}📋 Browser Console Snippet:{RESET}")
print(f"  1. Open {CYAN}www.mygenie.online{RESET} (or preview URL) in Chrome")
print(f"  2. Submit the demo form + verify OTP")
print(f"  3. Open DevTools → Console")
print(f"  4. Paste contents of: {CYAN}{snippet_path}{RESET}")
print(f"  5. Press Enter → see PASS/FAIL dashboard\n")

summary["overall"] = "PASS" if all_pass else "FAIL"
summary["total_passed"] = total_passed
summary["total_failed"] = total_failed
summary["total_p0_failures"] = total_p0

rp = REPORT_DIR / "gtm_regression_summary.json"
rp.write_text(json.dumps(summary, indent=2))
print(f"  Combined report → {rp}\n")

sys.exit(0 if all_pass else 1)
