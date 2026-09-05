# CR-151 — Add Negative Keywords to Google Ads Console (No Dev Work)

**Type:** Google Ads Console Action — NO CODE REQUIRED
**Date Raised:** 2026-08-25
**Status:** 🔲 OPEN — Owner/Ads Manager action
**Priority:** **P0 — DO IMMEDIATELY** (₹2.4L+ confirmed wasted spend)
**Owner:** Whoever manages Google Ads account

---

## 1. Problem Statement

Hardware-intent and consumer-intent searches are triggering software ad groups, consuming budget with zero conversion potential. This is confirmed wasted spend from live account data (last 30 days).

---

## 2. Exact Negative Keywords to Add

### POS System ad group (ID: 200309564562) — Alpha Campaign
Add as **exact match negatives**:

| Keyword | Impr | Clicks | Spend | Conv | Why |
|---|---|---|---|---|---|
| [billing machine for restaurant] | 74 | 18 | ₹1.6L | 0 | Hardware intent |
| [restaurant billing machine] | 40 | 7 | ₹0.8L | 0 | Hardware intent |
| [pos machine for restaurant] | 48 | 8 | — | 0 | Hardware intent |

**Combined: 162 impressions, 33 clicks, ₹2.4L+, 0 conversions.**

### Management & Ordering ad group (ID: 202501557247) — Alpha Campaign
Add as **exact match negatives**:

| Keyword | Impr | Conv | Why |
|---|---|---|---|
| [food delivery apps] | 11 | 0 | Consumer intent — someone looking for Swiggy/Zomato, not a POS |

### Billing Software ad group (ID: 199781695618) — Alpha Campaign
Add as **exact match negative** (cross-contamination from POS group):

| Keyword | Why |
|---|---|
| [billing machine for restaurant] | Hardware intent, 0 conv |

---

## 3. How to Add Negatives in Google Ads

1. Go to **Google Ads** → **Campaigns** → Select the relevant campaign
2. Click **Ad Groups** → Select the ad group
3. Go to **Keywords** → **Negative Keywords** tab
4. Click **+** → **Add negative keywords**
5. Enter each term with brackets for exact match: `[billing machine for restaurant]`
6. Save

Alternatively, add at campaign level if hardware intent should be blocked across all ad groups.

---

## 4. Also Consider — Petpooja Ad Group Exclusions

Already excluded (confirmed in brief): petpooja invoice, petpooja download, petpooja attendance.
No action needed there.

---

## 5. Definition of Done

- [ ] [billing machine for restaurant] added as exact negative to POS System ad group
- [ ] [restaurant billing machine] added as exact negative to POS System ad group
- [ ] [pos machine for restaurant] added as exact negative to POS System ad group
- [ ] [food delivery apps] added as exact negative to Management & Ordering ad group
- [ ] Confirmed in Google Ads console — Keywords → Negative Keywords tab shows all 4 terms
- [ ] Monitor for 7 days — wasted spend on these terms should drop to zero

---

*CR-151 registered 2026-08-25. Source: Live Google Ads account data brief. Zero dev work required — pure Ads console action.*
