# CR-168 — Line-by-Line Implementation Plan
## Homepage `<title>`: Shorten 68 → 44 chars

**File count:** 1
**Total lines changed:** 1
**Rebuild required:** Yes
**Risk:** LOW — one string, one page, no downstream effects beyond homepage OG/Twitter

---

## Pre-flight checks

```bash
# 1. Confirm current title
python3 -c "
import re
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore')
title = re.search(r'<title>(.*?)</title>', html)
print('Current title:', title.group(1) if title else 'NOT FOUND')
print('Chars:', len(title.group(1)) if title else 0)
"
# Expected: "POS System for Restaurants & Cafes | Best Billing Software - MyGenie" — 68 chars

# 2. Confirm line in source
grep -n "POS System for Restaurants" /app/frontend/src/lib/seo.js
# Expected: line 86
```

---

## File 1 of 1 — `frontend/src/lib/seo.js`

### Change 1 — Line 86: Replace `PAGE_SEO["/"].title`

```
BEFORE (L86):
    title: "POS System for Restaurants & Cafes | Best Billing Software - MyGenie",

AFTER (L86):
    title: "Restaurant POS & Billing Software | MyGenie",
```

**Char count:** 44 chars (was 68 — saves 24 chars, well within 60-char limit)

**Keyword inventory:**

| Keyword | Before | After |
|---|---|---|
| Restaurant | ✅ ("Restaurants & Cafes") | ✅ ("Restaurant POS") |
| POS | ✅ ("POS System") | ✅ ("Restaurant POS") |
| Billing | ✅ ("Billing Software") | ✅ ("Billing Software") |
| Software | ✅ | ✅ |
| Cafes | ✅ | ❌ (dropped — low signal, covered by description) |
| Best | ✅ | ❌ (dropped — superlative modifier, low ranking value) |
| MyGenie | ✅ (truncated in SERPs) | ✅ (always visible) |

**Tags updated by this single change** (all via `fullTitle` in `Seo.jsx`):
- `<title>` — browser tab + Google SERP headline
- `<meta property="og:title">` — Facebook/LinkedIn share card
- `<meta name="twitter:title">` — Twitter/X card

**Pages affected:** Homepage only (`Home.jsx` L33 is the only caller of `PAGE_SEO["/"].title`)

---

## Verification steps (post-rebuild)

```bash
# 1. Check <title> in prerendered build
python3 -c "
import re
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore')
title = re.search(r'<title>(.*?)</title>', html)
val = title.group(1) if title else 'NOT FOUND'
print('Title:', val)
print('Chars:', len(val))
print('Within limit:', len(val) <= 60)
"
# Expected: "Restaurant POS & Billing Software | MyGenie" — 44 chars — True

# 2. Confirm OG title matches
python3 -c "
import re
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore')
og = re.search(r'og:title.*?content=\"(.*?)\"', html)
print('OG title:', og.group(1) if og else 'NOT FOUND')
"
# Expected: "Restaurant POS & Billing Software | MyGenie"

# 3. Confirm old title gone
grep "POS System for Restaurants" /app/frontend/build/index.html
# Must return nothing
```

---

## Rollback

```
Revert L86 to: title: "POS System for Restaurants & Cafes | Best Billing Software - MyGenie",
Rebuild.
```

*Plan written 2026-08-30. No code edits made — plan only.*
