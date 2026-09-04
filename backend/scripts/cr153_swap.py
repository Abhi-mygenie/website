"""CR-153 — swap get_current_admin → get_dashboard_admin on Category A endpoints only.
Updated with correct line numbers after /cms/config endpoint was inserted.
"""

# Category B (CMS editor — KEEP as get_current_admin, do NOT touch):
# 771, 782, 794, 805, 826, 832, 840, 865, 882

# Category A (dashboard — swap to get_dashboard_admin):
CATEGORY_A_LINES = {
    930, 954, 968, 981, 993, 1004,
    1074, 1086, 1098, 1111,
    1129, 1141, 1150, 1169, 1179, 1189, 1198,
    1207, 1212, 1218,
    1229, 1238, 1247, 1256,
    1285, 1362,
    1375, 1380, 1390, 1413,
    1434, 1462,
    1533, 1542,
}

import os
server_path = os.path.join(os.path.dirname(__file__), "..", "server.py")

with open(server_path, "r") as f:
    lines = f.readlines()

changed = 0
for i, line in enumerate(lines, start=1):
    if i in CATEGORY_A_LINES:
        new = line.replace(
            "Depends(cms_auth.get_current_admin)",
            "Depends(cms_auth.get_dashboard_admin)"
        )
        if new != line:
            lines[i - 1] = new
            changed += 1

with open(server_path, "w") as f:
    f.writelines(lines)

print(f"Changed {changed} lines (expected 34, plus 3 already done = 37 total)")

# Verify Category B untouched
CATEGORY_B_LINES = [771, 782, 794, 805, 826, 832, 840, 865, 882]
errors_b = []
for n in CATEGORY_B_LINES:
    text = lines[n-1]
    if "get_dashboard_admin" in text:
        errors_b.append(f"  WRONG L{n}: {text.strip()[:80]}")
if errors_b:
    print("Category B ERRORS:")
    [print(e) for e in errors_b]
else:
    print(f"Category B ({len(CATEGORY_B_LINES)} CMS editor lines) correctly untouched")

# Count total get_current_admin remaining (should be Category B only = 9)
with open(server_path) as f:
    final = f.readlines()
remaining = [(i+1, l.strip()) for i, l in enumerate(final) if "get_current_admin" in l]
print(f"\nRemaining get_current_admin occurrences: {len(remaining)} (expected 9 — Category B only)")
for n, text in remaining:
    print(f"  L{n}: {text[:80]}")
