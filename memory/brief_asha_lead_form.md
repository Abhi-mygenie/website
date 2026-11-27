# Brief to the website agent: lead-form fields Asha needs in Freshsales (27 Nov 2026, rev 2)

Owner: Abhishek Jain. Status: brief for the next website release (month end). Nothing has been changed on the form or in Freshsales yet.

**Rev 2 (Abhishek, 27 Nov 13:24):** the form must not get long. **The website agent suggests the form design and decides which fields are most important.** The list below is what Asha would like and in what order. It is input, not a spec.

## Why

Asha, our AI voice agent, calls every new lead within a minute of the form. Today the form doesn't capture what she needs, so she has to ask on the call. With more of it on the form, the first call stays short: thank the lead, confirm the demo slot, done. The solution expert also gets the lead's background before the demo.

## What we need from you (the website agent)

1. **Propose the shortest form that still gets the most important fields.** Keeping form conversion up comes first. Don't add a field that would cost leads.
2. **Rank the fields by importance**, using what you know about form drop-off. Tell us which ones to:
   - put on the main form,
   - ask on an optional second step or the thank-you page, after the lead has already been created,
   - capture automatically or from hidden fields (no question needed),
   - leave out (Asha asks on the call instead).
3. **Suggest a quicker format for each field where you can**, such as one-tap chips instead of dropdowns, or merging two questions into one.
4. **Send your proposal to Abhishek for approval before building.**

## Asha's wish list, ranked from her side

| Rank | Field | Suggested values | Why Asha needs it | Freshsales note |
|---|---|---|---|---|
| 1 | **Demo slot saves to Freshsales** (fix, not a new question) | real date + time + weekday, e.g. "Saturday 28 November 2026, 3:00 pm" | Her whole first call is "confirm your slot". Today the slot doesn't reach Freshsales | `cf_channel_manager_name` is text and has been empty on new leads since 24 Aug. A proper date-time field is needed |
| 2 | **Business / outlet name** | text | Used in her greeting and the expert's brief | today `job_title` is optional (43% blank) and `cf_est_name` gets ad-set IDs. A clean field is needed |
| 3 | **Business status** | Running / Opening soon | She skips her first question. Tells us how urgent the lead is | new |
| 4 | **How they bill today** (could merge with 5) | Manual / Software (which one?) / Not started | She skips the billing questions. Petpooja users get the comparison line | new |
| 5 | Current software name | Petpooja / Posist / Rista / DotPe / Other | as above | new, only shown if "Software" |
| 6 | Business type (segment) | Restaurant / Café / QSR / Cloud kitchen / Bar / Bakery / Hotel / Other | Lead profile for the expert | own field. Today `cf_outlet_type` mostly holds the landing-page slug |
| 7 | Number of outlets | 1 / 2–3 / 4–10 / 10+ | Lead profile | new |
| 8 | Years in business / opening month | <1 / 1–2 / 2–5 / 5+, or opening month | Nice to have | new |
| 9 | Preferred language | Hindi / English / Other | Nice to have. Can be worked out from the state instead | new, optional |
| — | Landing page | hidden, auto-filled | No question needed | own field (frees `cf_outlet_type`) |

Our view, to check against yours: **1–4 matter most**, 5–7 are next, 8–9 can be left off or asked on the call.

## Rules (whatever form you propose)

1. **Fields on the main form must be in Freshsales when the contact is created.** The workflow that triggers Asha's call fires on contact creation. Second-step answers can update the contact afterwards, but Asha may already be dialling.
2. **Ad-tracking values go only into the tracking fields.** Never into the name, segment or business fields.
3. **Use fixed values exactly as agreed**, so Asha and the reports can read them.
4. **Send back the Freshsales API name of every new or reused field.**
5. **Test on 5 test leads before going live.** Check that every value lands in Freshsales, and send the 5 contact IDs back.

## Open for Abhishek

- Approve the website agent's proposed form and field ranking.
- Release date (planned: month-end release).
