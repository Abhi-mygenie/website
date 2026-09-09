# CR-211 — Preconnect Hints for FB Pixel & Cloudflare Insights

**Registered:** 2026-09-05
**Source:** Performance audit — connection latency for third-party scripts loaded via GTM
**Status:** 🔲 Open — Ready to implement
**Priority:** P1
**Owner:** Agent (code + rebuild)
**File:** `public/index.html` — 2 lines added

---

## 1. Context

CR-209 (implemented 2026-09-05) added `preconnect` + `dns-prefetch` for `www.googletagmanager.com`.
GTM now fires on first user interaction (deferred).

Two domains loaded via GTM tags still have no preconnect hints:
- **Facebook Pixel** (`connect.facebook.net` — `fbevents.js`)
- **Cloudflare Web Analytics** (`static.cloudflareinsights.com` — RUM beacon)

Neither domain appears in `index.html` or React source directly — both are injected
purely by GTM container tags. Therefore preconnect cannot be added via React code;
it must go in `public/index.html`.

---

## 2. What Preconnect Does Here

When a user scrolls (triggering GTM via CR-209), GTM fires and immediately tries to
download two external scripts:

**Without preconnect:**
```
GTM fires (t=0ms from interaction)
  → DNS lookup: connect.facebook.net         (+50ms)
  → TCP handshake                            (+100ms)
  → TLS negotiation                          (+100ms)
  → fbevents.js download starts              (+250ms total)

  → DNS lookup: static.cloudflareinsights.com (+50ms)
  → TCP handshake                            (+100ms)
  → TLS negotiation                          (+100ms)
  → beacon.min.js download starts            (+250ms total)
```

**With preconnect (CR-211):**
```
Page load (t=0ms) — browser sees preconnect hints during idle
  → Browser warms connections to both domains in background (parallel, idle)

GTM fires (t=Xs from interaction)
  → fbevents.js download starts IMMEDIATELY (connection pre-warmed)
  → beacon.min.js download starts IMMEDIATELY
```

**Saving per domain:** ~250ms (DNS + TCP + TLS)
**Total saving:** ~500ms off the time GTM tags complete execution after firing.

---

## 3. Why crossorigin on Both

Both `fbevents.js` and Cloudflare's beacon script are fetched with CORS headers
(`Access-Control-Allow-Origin` present). Without `crossorigin` on the preconnect hint,
the browser opens an **anonymous** TCP+TLS connection. When the actual CORS fetch arrives,
the browser opens a **second** connection (CORS requires a credentialled connection context).
The pre-opened anonymous connection is wasted.

`crossorigin` on the preconnect ensures the connection opened during idle matches the
connection the CORS fetch will use — making it reusable.

---

## 4. Why No dns-prefetch Fallback for These

CR-209 added `dns-prefetch` as fallback for GTM because GTM is the highest-priority
third-party (fires first, blocks tag queue). For FB Pixel and CF Insights:
- Both load sequentially **after** GTM container loads
- By the time they fire, the browser has typically already resolved their DNS
  as a side-effect of the GTM container parsing its tags
- `dns-prefetch` for them provides marginal additional benefit vs. the added noise
- Decision: `preconnect` only (2 clean lines)

If desired, `dns-prefetch` fallbacks can be added later at zero risk:
```html
<link rel="dns-prefetch" href="https://connect.facebook.net">
<link rel="dns-prefetch" href="https://static.cloudflareinsights.com">
```

---

## 5. Note on Cloudflare RUM

If CR-186 (owner action: disable Cloudflare Web Analytics in dashboard) is completed,
the `static.cloudflareinsights.com` preconnect becomes unnecessary. However:
- It is **harmless if present** — browser pre-warms the connection, no request fires, connection is silently discarded
- It causes **zero performance cost** whether or not CF RUM is enabled
- Recommendation: add it regardless; it becomes a no-op if CR-186 is done

---

## 6. Current State of index.html (after CR-209)

```html
<!-- CR-209 block (already present): -->
<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
```

No preconnect for `connect.facebook.net` or `static.cloudflareinsights.com`.

---

## 7. The Fix — 2 Lines

**File:** `public/index.html`
**Tool:** `search_replace`
**Placement:** Immediately after the existing GTM preconnect block (after line 35)

### old_str:
```
        <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com">
```

### new_str:
```
        <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com">
        <!-- CR-211: preconnect for FB Pixel (connect.facebook.net/fbevents.js)
             and Cloudflare Web Analytics (static.cloudflareinsights.com/beacon.min.js).
             Both are injected by GTM tags — not in source. crossorigin required on both
             because CORS fetch would open a second connection without it. Saves ~250ms
             per domain (~500ms total) off GTM tag execution time after GTM fires.
             CF preconnect is harmless no-op if Cloudflare RUM is disabled (CR-186). -->
        <link rel="preconnect" href="https://connect.facebook.net" crossorigin>
        <link rel="preconnect" href="https://static.cloudflareinsights.com" crossorigin>
```

**Net lines added:** +6 (2 meaningful + 4 comment lines)

---

## 8. Pre-flight Check

```bash
# Confirm GTM preconnect is already present (CR-209 baseline)
grep -c "preconnect" /app/frontend/public/index.html
# Expected: 2 (GTM preconnect + GTM dns-prefetch contains "prefetch" not "preconnect")
# Actually: grep "preconnect" catches the <link rel="preconnect"> tags only
# Re-run:
grep "preconnect\|dns-prefetch" /app/frontend/public/index.html
# Expected: GTM preconnect + GTM dns-prefetch

# Confirm FB and CF preconnects not yet present
grep -c "connect.facebook\|cloudflareinsights" /app/frontend/public/index.html
# Expected: 0
```

---

## 9. Post-edit Verification

```bash
# Confirm 2 new preconnects present
grep "connect.facebook\|cloudflareinsights" /app/frontend/public/index.html
# Expected:
#   <link rel="preconnect" href="https://connect.facebook.net" crossorigin>
#   <link rel="preconnect" href="https://static.cloudflareinsights.com" crossorigin>

# Confirm GTM preconnect still intact
grep -c "googletagmanager" /app/frontend/public/index.html
# Expected: ≥2 (preconnect + dns-prefetch + script comment references)

# Confirm total preconnect link tags
grep -c '<link rel="preconnect"' /app/frontend/public/index.html
# Expected: 3 (GTM + FB + CF)
```

---

## 10. Post-build Validation

```bash
# CR-211 hints survive the build (public/index.html is copied into build/)
grep -c "connect.facebook.net" /app/frontend/build/index.html
# Expected: 1

grep -c "cloudflareinsights" /app/frontend/build/index.html
# Expected: 1
```

---

## 11. Can This CR Be Combined With CR-210?

Yes — both are single-file edits, neither conflicts. If implementing together:
1. Edit `sectors.js:299` (CR-210)
2. Edit `public/index.html` (CR-211)
3. One rebuild covers both

---

## 12. Summary

| Item | Detail |
|---|---|
| File | `public/index.html` |
| Lines added | 2 `<link>` tags + 4 comment lines |
| New files | None |
| React changes | None |
| Rebuild required | Yes (public/index.html copied into build) |
| Estimated saving | ~500ms off GTM tag execution time after GTM fires |
| Risk | Zero — preconnect hints are advisory; browser ignores if not needed |
| Dependency | CR-209 must be applied first (already done) |

*Registered 2026-09-05. E1 Agent.*
*Preconnect strategy established in CR-209 — this CR extends the same pattern to FB and CF.*
