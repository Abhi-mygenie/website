# REGRESSION SUITE — critical flows

Run the items marked in a CR's plan at the QA gate. **R-01 … R-06 are mandatory for every production release** regardless of what changed. Record results in the CR's QA section with the command output or report path.
`$API` = preview `REACT_APP_BACKEND_URL` from `/app/frontend/.env`; `$PROD` = `https://www.mygenie.online`.

## A. Lead capture (revenue-critical)
| R-id | Flow | How to verify | Pass criterion |
|---|---|---|---|
| R-01 | Demo form → Mongo | `curl -s -X POST $API/api/demo-request -H 'Content-Type: application/json' -d '{"name":"QA Test","phone":"9999900001","email":"qa@test.local","outlet_type":"Cafe","business_name":"QA","city":"Pune"}'` then `db.demo_requests.count_documents({"phone":"9999900001"})` | HTTP 200 + doc present. **Delete test doc after** (record the delete in QA notes — this is the only permitted DB write without a CR). |
| R-02 | OTP send/verify path | `POST $API/api/otp/send` with test phone → 200 (SMS may be disabled: `OTP_SMS_ENABLED`) | Endpoint responds, no 500, backend log clean |
| R-03 | Quote form | `POST $API/api/quote` minimal payload | 200 |
| R-04 | Contact form | `POST $API/api/contact` minimal payload | 200 |
| R-05 | Freshsales sync attempt | backend log after R-01 shows CRM attempt (`grep -i freshsales /var/log/supervisor/backend.err.log \| tail`) | Attempt logged; if `FRESHSALES_API_KEY` unset, "skipped/disabled" logged — never a traceback |
| R-06 | Calendly webhook endpoint alive | `curl -s -o /dev/null -w '%{http_code}' -X POST $API/api/calendly/webhook -d '{}'` | 4xx (rejected), not 5xx |

## B. Auth & dashboard
| R-id | Flow | How | Pass |
|---|---|---|---|
| R-10 | CMS login | `POST $API/api/cms/login` with creds from `/app/memory/test_credentials.md` | 200 + token |
| R-11 | `/leads` page loads after login | screenshot flow: open `/leads`, log in, list renders | leads table visible |
| R-12 | Gated endpoints reject anonymous | `curl -s -o /dev/null -w '%{http_code}' $API/api/cms/leads` | 401/403 |
| R-13 | **Public list endpoints** (`/api/demo-requests`, `/api/quotes`, `/api/contact-messages`) | anonymous curl | Expected 401/403 **after CR-266**; until then record actual (currently 200 — known P0) |

## C. Ad landing pages (paid traffic — never ship broken)
| R-id | Flow | How | Pass |
|---|---|---|---|
| R-20 | Each LP returns 200 + prerendered H1 | for each of `/petpooja-alternative /demo /restaurant-billing-software /restaurant-pos-system /restaurant-management-software /qsr-pos-system /cloud-kitchen-pos`: `curl -s $URL \| grep -c '<h1'` | 200 and ≥1 `<h1` in raw HTML (prerender present) |
| R-21 | Demo form present on each LP | `grep -c 'data-testid="demo-form' ` (or form element) in raw HTML | ≥1 |
| R-22 | StickyMobileCta present where required (CR-73/74/84) | screenshot at 390×844 after scroll | CTA bar visible |
| R-23 | No WhatsApp FAB (owner decision CR-249) | `curl -s $URL \| grep -c 'whatsapp-fab'` | 0 |

## D. SEO / prerender / schema
| R-id | Flow | How | Pass |
|---|---|---|---|
| R-30 | Prerender count | `find /app/frontend/build -name index.html \| wc -l` | = 65 (or new expected count stated in the plan) |
| R-31 | Homepage title/meta/canonical | `curl -s $URL/ \| grep -oE '<title>[^<]+\|rel="canonical"[^>]+'` | present, canonical = `https://www.mygenie.online/` |
| R-32 | Sitemap valid | `curl -s $URL/sitemap.xml \| head -3` | XML, 200 |
| R-33 | JSON-LD present on `/pricing`, `/` , LPs | `grep -c 'application/ld+json'` | ≥1 |
| R-34 | 404 route returns 404 (CR-79/140) | `curl -s -o /dev/null -w '%{http_code}' $URL/this-does-not-exist` | 404 |
| R-35 | Client route deep-link works (Nginx SPA fallback) | `curl -s -o /dev/null -w '%{http_code}' $URL/leads` | 200 (**prod currently 404 — known, owner Nginx**) |

## E. Tracking
| R-id | Flow | How | Pass |
|---|---|---|---|
| R-40 | GTM container in HTML | `curl -s $URL/ \| grep -c 'GTM-K5D84Z3L'` | ≥1 |
| R-41 | Consent banner renders, no React #418 in console | screenshot with console capture | no hydration error |
| R-42 | `book_demo` dataLayer push on form submit | browser console / testing_agent | event seen |

## F. Performance guardrails (frontend changes only)
| R-id | Flow | How | Pass |
|---|---|---|---|
| R-50 | Main bundle size | `ls -la /app/frontend/build/static/js/main.*.js` | not > +5% vs previous release (record both) |
| R-51 | Homepage LCP image preload present | `grep -c 'rel="preload" as="image"' build/index.html` | ≥1 |

## G. Backend health
| R-id | Flow | How | Pass |
|---|---|---|---|
| R-60 | Backend up | `curl -s $API/api/` | 200 |
| R-61 | Log clean after restart | `tail -n 100 /var/log/supervisor/backend.err.log` | no Traceback; only the known `Calendly register failed` warning (CR-263) |

## Minimum sets by change type
| Change type | Mandatory R-ids |
|---|---|
| Backend lead/CRM code | R-01…R-06, R-12, R-13, R-60, R-61 |
| Backend other | R-10, R-12, R-60, R-61 + change-specific |
| Frontend LP / forms | R-01, R-20…R-23, R-30, R-40, R-42, R-50 |
| Frontend SEO / head / schema | R-30…R-34, R-40 |
| Env / config | R-60, R-61 + the key's effect (e.g. R-23 for WhatsApp) |
| Nginx / Cloudflare (owner) | R-20, R-31, R-34, R-35 on production |
| **Any production release** | R-01…R-06 + R-20 + R-23 + R-30 + R-31 + R-34 + R-40 on `$PROD` |
