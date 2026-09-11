# CR-206 — Line-by-Line Implementation Plan: browserslist Modern Targets

**CR:** CR-206
**Date:** 2026-09-04
**Status:** Ready to implement
**Effort:** 1 edit · 1 rebuild · 3 validation checks
**Risk:** Low

---

## Pre-flight Checks

```bash
# Confirm current browserslist resolves to 48 browsers
cd /app/frontend && npx browserslist ">0.2%, not dead, not op_mini all" | wc -l
# Expected: 48

# Confirm services running
sudo supervisorctl status frontend backend
# Expected: both RUNNING

# Confirm current build hash (before change)
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Note down — will change after rebuild
```

---

## The Change

**File:** `/app/frontend/package.json`
**Lines:** 75–79
**Type:** Config value change — no logic, no imports, no components

### Current state (lines 74–85)

```json
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
```

### After change (lines 74–88)

```json
  "browserslist": {
    "production": [
      "last 2 Chrome versions",
      "last 2 Firefox versions",
      "last 2 Safari versions",
      "last 2 Edge versions",
      "last 2 Samsung versions"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
```

### What changed

| Line | Before | After |
|---|---|---|
| 76 | `">0.2%",` | `"last 2 Chrome versions",` |
| 77 | `"not dead",` | `"last 2 Firefox versions",` |
| 78 | `"not op_mini all"` | `"last 2 Safari versions",` |
| — | *(end of array)* | `"last 2 Edge versions",` |
| — | *(end of array)* | `"last 2 Samsung versions"` |

Development section: **unchanged**.

---

## Step 1 — Edit `package.json`

Use `search_replace` on `/app/frontend/package.json`:

**old_str:**
```
      ">0.2%",
      "not dead",
      "not op_mini all"
```

**new_str:**
```
      "last 2 Chrome versions",
      "last 2 Firefox versions",
      "last 2 Safari versions",
      "last 2 Edge versions",
      "last 2 Samsung versions"
```

**Note:** Do NOT touch the `"development"` block or any other line.

---

## Step 2 — Verify browserslist resolves correctly (before rebuild)

```bash
cd /app/frontend && npx browserslist 2>/dev/null | wc -l
# Expected: 10

cd /app/frontend && npx browserslist 2>/dev/null
# Expected output exactly:
# chrome 149
# chrome 148
# edge 149
# edge 148
# firefox 151
# firefox 150
# safari 26.4
# safari 26.3
# samsung 30
# samsung 29
```

If output is wrong, stop — do not rebuild.

---

## Step 3 — Rebuild

```bash
cd /app/frontend
REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build > /app/memory/build-cr206.log 2>&1 &
echo "Build started — PID=$!"
```

Monitor:
```bash
tail -f /app/memory/build-cr206.log
# Wait for "Done in Xs." line
# Then check prerender completed:
grep "prerendered /404" /app/memory/build-cr206.log
# Expected: "prerendered /404 -> ..."
```

---

## Step 4 — Restart frontend

```bash
sudo supervisorctl restart frontend
sleep 3
sudo supervisorctl status frontend
# Expected: frontend RUNNING
```

---

## Step 5 — Validation Checks

### Check A: New build hash is different

```bash
ls /app/frontend/build/static/js/main.*.js | grep -o 'main\.[a-f0-9]*\.js'
# Expected: different hash from pre-change hash noted in pre-flight
```

### Check B: Lighthouse "legacy JS" advisory — reduced or gone

```bash
# Compare main bundle size before/after
ls -lh /app/frontend/build/static/js/main.*.js | awk '{print $5, $9}'
# Expected: main bundle slightly smaller than 958 KB (even 940 KB counts as success)
```

### Check C: 63 routes still prerendered

```bash
find /app/frontend/build -name "index.html" | wc -l
# Expected: 63
```

### Check D: No transpilation regressions — optional chaining still native

```bash
grep -c "_optionalChain\|asyncGeneratorStep" /app/frontend/build/static/js/main.*.js
# Expected: 0 (same as before — confirming no new transpilation was added)
```

### Check E: Browserslist resolves in build context

```bash
cd /app/frontend && npx browserslist --production 2>/dev/null | wc -l
# Expected: 10
```

---

## Step 6 — Regression Gate (T1 only — minimal scope)

Since this is a build config change only (no source code change), only T1 needs to be verified:

```bash
# T1: New hash not in known-bad list
NEW_HASH=$(ls /app/frontend/build/static/js/main.*.js | grep -o '[a-f0-9]\{8\}')
echo "New build hash: $NEW_HASH"

KNOWN_BAD="107ff3e9 04593470 8fe91636 ea6df739 b8f96c28 a65c8c10 f330ce78 af722274 a5f22153"
if echo "$KNOWN_BAD" | grep -q "$NEW_HASH"; then
  echo "FAIL — hash in known-bad list"
else
  echo "PASS — hash is clean"
fi
```

Full T1–T8 regression is **not required** for this change — browserslist only affects Babel output, not HTML structure, routes, h1 tags, canonical tags, or title uniqueness.

---

## Step 7 — Update CR Status

After validation passes:

1. Update `/app/memory/CR_INTAKE_REGISTER.md`:
   - CR-206 status: `🔲 Open` → `✅ Done YYYY-MM-DD`
   - Add build hash to validation note

2. Update `/app/memory/PRD.md` with session entry

---

## Rollback Plan

If any validation check fails:

```bash
# Revert package.json browserslist
# Use search_replace:
# old_str: the new 5-line production array
# new_str: the original 3-line array (">0.2%", "not dead", "not op_mini all")

# Rebuild
cd /app/frontend && REACT_APP_BACKEND_URL=https://beta.mygenie.online yarn build
sudo supervisorctl restart frontend
```

---

## Summary

| Step | Action | Time |
|---|---|---|
| 1 | Edit 3 lines in `package.json` | <1 min |
| 2 | Verify browserslist resolves to 10 | <1 min |
| 3 | Rebuild | ~3 min |
| 4 | Restart frontend | <1 min |
| 5 | Run 5 validation checks | <2 min |
| 6 | T1 regression check | <1 min |
| **Total** | | **~8 min** |

---

## Important Implementation Note

**Implement CR-206 in the same build as CR-207 and CR-208**, not standalone. The individual score improvement is +0 to +1 point — not worth a solo deployment. Batch all three AD changes into one build + one production zip.

*Line-by-line plan complete — 2026-09-04.*
*Ready to implement on agent instruction — no code edit in this session.*
