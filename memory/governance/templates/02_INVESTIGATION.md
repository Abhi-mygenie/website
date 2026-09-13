## Investigation — CR-<n>
**Gate:** INVESTIGATION · **Date:** <YYYY-MM-DD> · **Mode:** READ-ONLY (no edits, no DB writes, no env changes)

### Reproduction
| Step | Command / action | Result |
|---|---|---|
| 1 | `curl -s -o /dev/null -w '%{http_code}' <url>` | `<status>` |
| 2 | | |

Reproduced: yes | no | intermittent — <notes>

### Root cause
- Statement: <one sentence>
- Evidence: `<file>:<line>` — `<code excerpt>`
- Confidence: confirmed | probable | hypothesis (ranked list if hypothesis)

### Affected surfaces (tick all that apply and name them)
- [ ] Routes / pages:
- [ ] API endpoints:
- [ ] Mongo collections:
- [ ] Freshsales / Calendly / Razorpay / SMS:
- [ ] GTM / consent / dataLayer:
- [ ] Build / prerender:
- [ ] Nginx / Cloudflare / DNS:
- [ ] Env keys:

### Data checked
| Query | Result |
|---|---|
| `db.<coll>.count_documents({...})` | <n> |

### Since when / who is affected
- First seen: <date or commit>
- Scope: <all users / preview only / specific pages>

### Out of scope discoveries → new CRs raised
- CR-<m>: <one line>

### Exit check
- [ ] Nothing was written or changed during investigation
- [ ] All commands above are re-runnable by someone else
- [ ] Ready for IMPACT (root cause known) — or — needs owner input: <question>
