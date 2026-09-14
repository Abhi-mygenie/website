# CR-167 — Line-by-Line Implementation Plan
## Homepage H1: Add Primary Keywords

**File count:** 1
**Total lines changed:** 2
**Rebuild required:** Yes (static server serves build/)
**Risk:** LOW — confirmed no CMS DB overrides for these keys

---

## Pre-flight checks

```bash
# 1. Confirm no CMS override in DB (already verified — NONE)
# 2. Confirm current fallback text matches expectation
grep -n "title_lead\|title_accent" /app/frontend/src/components/home/Hero.jsx
# Expected output:
# 26:  <EditableText id="home.hero.title_lead" fallback="Run a more profitable hospitality business — " />
# 28:  <EditableText id="home.hero.title_accent" fallback="from your phone." />
```

---

## File 1 of 1 — `frontend/src/components/home/Hero.jsx`

### Change 1 — Line 26: Update `title_lead` fallback

```
BEFORE (L26):
  <EditableText id="home.hero.title_lead" fallback="Run a more profitable hospitality business — " />

AFTER (L26):
  <EditableText id="home.hero.title_lead" fallback="Restaurant POS & Billing Software — " />
```

**Why this exact text:**
- Hits keywords: Restaurant ✅  POS ✅  Billing ✅  Software ✅
- Does NOT start with "India's #1" — avoids repetition with badge above (badge = "India's Restaurant POS & Billing Software")
- The em dash " — " is kept so it flows naturally into the green accent span
- 37 chars — shorter than current (46 chars), wraps better on mobile

---

### Change 2 — Line 28: Update `title_accent` fallback

```
BEFORE (L28):
  <EditableText id="home.hero.title_accent" fallback="from your phone." />

AFTER (L28):
  <EditableText id="home.hero.title_accent" fallback="Run Your Business From Your Phone" />
```

**Why this exact text:**
- Retains the benefit hook ("run your business... from your phone") that original copy had
- Title-cased for visual weight in the green accent colour
- 33 chars vs 16 chars — slightly longer but the green accent span already wraps independently
- No period at end — cleaner with the dash separator in `title_lead`

---

## Full H1 rendered result

```
Restaurant POS & Billing Software — Run Your Business From Your Phone
                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                    ← this part renders in brand-green
```

**Keyword check:**
| Keyword | Present |
|---|---|
| restaurant | ✅ |
| pos | ✅ |
| billing | ✅ |
| software | ✅ |
| management | ❌ (not in H1 — present in meta description) |

**Char count:** 71 chars total H1 (was 61 — +10 chars, acceptable line wrap increase)

---

## Verification steps (post-rebuild)

```bash
# 1. Check prerendered H1 text
grep -o '<h1[^>]*>.*</h1>' /app/frontend/build/index.html | head -3
# Expected: h1 contains "Restaurant POS & Billing Software"

# 2. Simpler grep
grep "Restaurant POS" /app/frontend/build/index.html | head -2
# Must appear in build output

# 3. Confirm old text gone
grep "Run a more profitable" /app/frontend/build/index.html
# Must return nothing

# 4. Structural gate (opacity leak check — unchanged, just confirming)
python3 -c "
import re
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore')
h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
print('H1 content:', h1_match.group(1)[:120] if h1_match else 'NOT FOUND')
"
```

---

## Rollback

If visual layout breaks unexpectedly:
```
Revert L26 fallback to: "Run a more profitable hospitality business — "
Revert L28 fallback to: "from your phone."
Rebuild.
```

*Plan written 2026-08-30. No code edits made — plan only.*
