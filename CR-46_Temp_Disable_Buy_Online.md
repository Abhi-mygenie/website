# CR-46 — Temporarily Hide / Disable "Buy Online" Flow

**Registered:** 2026-07-03  
**Status:** G3 — Implemented  
**Priority:** P0 — Pre-launch safety gate  
**Requested by:** Owner  
**Blocking:** CR-45 SEC-001 full QA + Razorpay live-key testing

---

## Problem

The "Buy Online" button on the Pricing page initiates a live Razorpay payment flow.
CR-45 security hardening (SEC-001 server-side price validation) is implemented but not
yet fully QA'd end-to-end with live keys. Exposing the button before that validation is
confirmed increases risk of incomplete or exploitable payment paths.

---

## Scope

- **Hide:** "Buy Online" button in `CartSummary.jsx`
- **Keep visible:** "Book a Demo with this quote" CTA (demo flow is unaffected)
- **Keep intact:** All `CheckoutModal`, `Pricing`, payment backend code — no deletions
- **Gate:** Single `REACT_APP_BUY_ONLINE_ENABLED` env flag in `frontend/.env`

---

## Implementation

### `frontend/.env`
```
REACT_APP_BUY_ONLINE_ENABLED=false
```

### `CartSummary.jsx`
When `REACT_APP_BUY_ONLINE_ENABLED !== "true"`:
- "Buy Online" button is completely hidden — no placeholder or "coming soon" text
- Demo CTA remains fully functional

---

## Revert / Re-enable

Set in `frontend/.env`:
```
REACT_APP_BUY_ONLINE_ENABLED=true
```
Then restart frontend: `sudo supervisorctl restart frontend`

---

## Definition of Done

- [ ] "Buy Online" button not visible on `/pricing` when flag is `false`
- [ ] "Book a Demo with this quote" CTA still works normally
- [ ] Setting flag to `true` re-shows the button without any code change
- [ ] CR-45 SEC-001 QA passed before flag is set to `true` in production
