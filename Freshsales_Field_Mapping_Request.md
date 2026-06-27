# Freshsales Field Mapping — Information Needed from CRM Team

> **Purpose:** The MyGenie website has 4 lead-capture forms (Demo, Pricing Quote/Buy, ROI Calculator,
> and the new Contact "Send a message"). Today only **name / email / phone / tags** persist in Freshsales —
> all qualifier data (outlet type, business name, city, plan, ROI numbers, attribution) is **silently
> dropped** because Freshsales requires custom fields to be sent as `custom_field` (singular) with the
> exact **`cf_`-prefixed API names**. We need your team to confirm those API names so we can map every form
> field to the right Freshsales field.
>
> Last updated: 2026-06-07

---

## 1. How to get the authoritative field list (preferred)

Please run this against the CRM and paste the full JSON response:

```
GET https://mygenie-org.myfreshworks.com/crm/sales/api/settings/contacts/fields
Authorization: Token token=<FRESHSALES_API_KEY>
Content-Type: application/json
```

The response lists every contact field with its **`name`** (the `cf_...` API key) and **`label`**.
That single dump answers almost everything below.

---

## 2. Custom field (`cf_`) API names we need confirmed

For each website field below, please give the matching Freshsales `cf_` API name (or tell us "create new"
if it doesn't exist yet).

### A. Business qualifiers (Demo, Quote, ROI, Contact forms)
| Website field | Example value | Freshsales `cf_` API name |
|---|---|---|
| Outlet / business type | "Café", "QSR", "Cloud Kitchen" | `cf_________________` |
| Business name | "Mill Bakery" | `cf_________________` |
| City | "Agra" | `cf_________________` |
| Years in business | "1-3 years" | `cf_________________` |
| Currently using a POS? | "Yes / No" | `cf_________________` |
| Current POS name | "Petpooja" | `cf_________________` |

### B. Plan / Quote (Pricing → Buy/Quote)
| Website field | Example value | Freshsales `cf_` API name |
|---|---|---|
| Plan name | "Growth" | `cf_________________` |
| Billing cycle | "monthly / annual" | `cf_________________` |
| Add-ons | "KDS, Loyalty" | `cf_________________` |
| Total amount | 2499 | `cf_________________` |

### C. ROI Calculator
| Website field | Example value | Freshsales `cf_` API name |
|---|---|---|
| Monthly revenue | 500000 | `cf_________________` |
| Number of outlets | 3 | `cf_________________` |
| Est. annual impact | 180000 | `cf_________________` |

### D. Contact "Send a message"
| Website field | Example value | Freshsales `cf_` API name |
|---|---|---|
| Message / enquiry text | "Do you support GST billing?" | `cf_________________` |
| Preferred contact method | "WhatsApp / Phone / Email" | `cf_________________` |

### E. Attribution / UTM (for the upcoming Attribution CR)
| Website field | Example value | Freshsales `cf_` API name |
|---|---|---|
| utm_source | "google" | `cf_________________` |
| utm_medium | "cpc" | `cf_________________` |
| utm_campaign | "pos-jun" | `cf_________________` |
| utm_term (paid keyword) | "restaurant pos" | `cf_________________` |
| utm_content | "ad-a" | `cf_________________` |
| gclid (Google click id) | "Cj0K..." | `cf_________________` |
| fbclid (Meta click id) | "IwAR..." | `cf_________________` |
| Landing page | "/pricing" | `cf_________________` |
| Referrer | "google.com" | `cf_________________` |

---

## 3. Lifecycle & status — please confirm

We currently set new website leads to **Lifecycle = Lead / Status = New**, and move to **Demo Scheduled**
when a Calendly booking is detected. Please confirm:

- Should **Contact "Send a message"** leads use the **same** Lead/New, or a different status?
  - Lifecycle stage ID: `__________`  Status ID: `__________`
- Any status change expected when a contact-form enquiry comes in (vs a demo request)?

---

## 4. Tag conventions — please confirm

So CRM reports stay consistent, confirm the exact tag string per lead source:

| Source | Proposed tag | Confirm / change |
|---|---|---|
| Demo form | `Website Demo Lead` | |
| Pricing quote | `Website Quote` | |
| Buy online | `Buy Online` | |
| ROI calculator | `Website Demo Lead` (or new `ROI Lead`?) | |
| Contact message | `Website Contact` | |
| Demo booked (Calendly) | `Demo Scheduled (Web)` | |

---

## 5. Quick confirmation — contact number

The website is being switched so that **all Call + WhatsApp CTAs use `9579504871`**
(`wa.me/919579504871`, `tel:+919579504871`) and the old `7505242126` is removed. Please confirm this is
the correct single business number going forward.

---

**Once we receive section 1 (the fields dump) + sections 3, 4, 5 confirmations, we can wire all 4 forms to
persist full lead data into Freshsales.**
