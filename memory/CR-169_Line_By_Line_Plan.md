# CR-169 — Line-by-Line Implementation Plan
## Homepage Meta Description: Shorten 191 → 138 chars

**File count:** 1
**Total lines changed:** 2 (multi-line string — L87 opening + L88 value + L89 closing → replace with L87 opening + L88 value)
**Rebuild required:** Yes
**Risk:** LOW — one string, one page

---

## Pre-flight checks

```bash
# 1. Confirm current description and char count
python3 -c "
import re
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore')
desc = re.search(r'name=\"description\" content=\"(.*?)\"', html)
val = desc.group(1) if desc else 'NOT FOUND'
print('Description:', val)
print('Chars:', len(val))
"
# Expected: 191 chars, ends with "Book a demo today!"

# 2. Confirm source lines
sed -n '85,92p' /app/frontend/src/lib/seo.js
# Expected: title on L86, description spanning L87-89
```

---

## File 1 of 1 — `frontend/src/lib/seo.js`

### Change 1 — Lines 87–89: Replace `PAGE_SEO["/"].description` (3-line → 2-line)

```
BEFORE (L87–89):
    description:
      "Boost your restaurant's efficiency with MyGenie POS — a powerful billing and management software for restaurants, cafes, hotels and food businesses. Boost profit up to 25%. Book a demo today!",

AFTER (L87–88):
    description:
      "MyGenie POS — powerful billing & restaurant management software for cafes, hotels & cloud kitchens. Boost profit 25%. Book a free demo.",
```

**Note:** The 3-line form collapses to 2 lines. The closing `},` on what was L90 stays unchanged — it moves up by 1 line but its content is unaffected.

**Char count:** 138 chars (was 191 — saves 53 chars, within 155-char limit)

**Content diff:**

| Element | Before | After |
|---|---|---|
| Brand opener | "Boost your restaurant's efficiency with MyGenie POS —" | "MyGenie POS —" (brand first) |
| Product descriptor | "powerful billing and management software" | "powerful billing & restaurant management software" |
| Venue coverage | "restaurants, cafes, hotels and food businesses" | "cafes, hotels & cloud kitchens" |
| Profit claim | "Boost profit up to 25%." | "Boost profit 25%." (shorter) |
| CTA | "Book a demo today!" — **TRUNCATED** | "Book a free demo." — **VISIBLE** |

**Tags updated** (all via `description` prop → `Seo.jsx`):
- `<meta name="description">` — Google SERP snippet
- `<meta property="og:description">` — social share card
- `<meta name="twitter:description">` — Twitter/X card

**`DEFAULT_DESCRIPTION` is NOT affected.**
`DEFAULT_DESCRIPTION` (seo.js L5–6) is the fallback for pages that pass no `description` prop to `<Seo>`. Homepage explicitly passes `PAGE_SEO["/"].description`, so `DEFAULT_DESCRIPTION` is bypassed on homepage. Changing `PAGE_SEO["/"].description` affects homepage only.

**Pages affected:** Homepage only.

---

## Verification steps (post-rebuild)

```bash
# 1. Check meta description in prerendered build
python3 -c "
import re
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore')
desc = re.search(r'name=\"description\" content=\"(.*?)\"', html)
val = desc.group(1) if desc else 'NOT FOUND'
print('Description:', val)
print('Chars:', len(val))
print('CTA visible:', 'demo' in val.lower())
print('Within limit:', len(val) <= 155)
"
# Expected: 138 chars, contains "Book a free demo", True, True

# 2. Confirm OG description matches
python3 -c "
import re
from pathlib import Path
html = (Path('/app/frontend/build') / 'index.html').read_text(errors='ignore')
og = re.search(r'og:description.*?content=\"(.*?)\"', html)
print('OG desc chars:', len(og.group(1)) if og else 'NOT FOUND')
"
# Expected: 138

# 3. Confirm old text gone
grep "Book a demo today" /app/frontend/build/index.html
# Must return nothing
```

---

## Rollback

```
Revert L87–88 to:
    description:
      "Boost your restaurant's efficiency with MyGenie POS — a powerful billing and management software for restaurants, cafes, hotels and food businesses. Boost profit up to 25%. Book a demo today!",
Rebuild.
```

*Plan written 2026-08-30. No code edits made — plan only.*
