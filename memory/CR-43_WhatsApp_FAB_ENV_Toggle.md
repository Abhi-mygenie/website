# CR-43: WhatsApp FAB — ENV-Controlled Toggle + Number

## Date: 2026-06-30
## Status: IMPLEMENTED ✅
## Priority: P1 (business flexibility)

---

## Problem Statement

The WhatsApp floating action button (FAB) and WhatsApp links across the website use a
hardcoded phone number (`919104743156` in `data/company.js`). There is no way to:
- Disable/enable the WhatsApp FAB without a code deploy
- Change the WhatsApp number without a code deploy

---

## Current State

**Source of truth:** `frontend/src/data/company.js:10`
```js
whatsapp: "919104743156",
```

**3 consumers — all read from `COMPANY.whatsapp`:**

| # | File | Line | Usage |
|---|---|---|---|
| 1 | `components/site/WhatsAppFab.jsx` | 13 | FAB on every page (mobile only) → `wa.me/{number}` |
| 2 | `pages/Contact.jsx` | 52 | "Chat with us" link → `wa.me/{number}` |
| 3 | `components/site/MessageForm.jsx` | 29 | Post-submit WhatsApp redirect → `wa.me/{number}` |

**Rendered in:** `App.js:99` — `<WhatsAppFab />` unconditionally rendered globally.

---

## Proposed Solution

### New ENV vars (`frontend/.env`)

```
REACT_APP_WHATSAPP_ENABLED=true
REACT_APP_WHATSAPP_NUMBER=919104743156
```

### Implementation Plan

#### Step 1: Add env vars to `frontend/.env`
```
REACT_APP_WHATSAPP_ENABLED=true
REACT_APP_WHATSAPP_NUMBER=919104743156
```

#### Step 2: Update `data/company.js` (1 line)
```js
// Line 10 — change from:
whatsapp: "919104743156",
// To:
whatsapp: process.env.REACT_APP_WHATSAPP_NUMBER || "919104743156",
```
This automatically updates all 3 consumers (FAB, Contact, MessageForm) since they all read `COMPANY.whatsapp`.

#### Step 3: Update `App.js` (1 line)
```jsx
// Line 99 — change from:
<WhatsAppFab />
// To:
{process.env.REACT_APP_WHATSAPP_ENABLED !== "false" && <WhatsAppFab />}
```

**Total: 3 files, 3 lines changed.**

---

## Usage

| Action | How |
|---|---|
| Disable WhatsApp FAB | Set `REACT_APP_WHATSAPP_ENABLED=false` in `frontend/.env`, restart frontend |
| Enable WhatsApp FAB | Set `REACT_APP_WHATSAPP_ENABLED=true` (or remove the var — default is enabled) |
| Change number | Set `REACT_APP_WHATSAPP_NUMBER=91XXXXXXXXXX` in `frontend/.env`, restart frontend |

---

## Scope Boundary

- **In scope:** FAB toggle + number from env
- **Out of scope:** Contact page and MessageForm WhatsApp links are NOT individually toggleable — they follow the number change but remain visible. If individual toggle is needed for those, that's a separate CR.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Missing env var | ZERO | Defaults match current behavior (enabled, same number) |
| FAB hidden accidentally | LOW | Default is enabled — must explicitly set `false` to hide |
| Number format wrong | LOW | No validation — owner responsibility to provide correct intl format |

---

## Files Modified

| File | Change |
|---|---|
| `frontend/.env` | +2 new vars |
| `frontend/src/data/company.js` | Line 10: read from env with fallback |
| `frontend/src/App.js` | Line 99: conditional render based on env |

---

*CR-43 registered: 2026-06-30. Agent: E1, Emergent Labs.*
