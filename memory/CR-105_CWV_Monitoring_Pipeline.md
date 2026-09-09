# CR-105 — Set Up CWV Monitoring Pipeline (PSI + CrUX + Lighthouse CI)

**Type:** Monitoring / Performance  
**Date Raised:** 2026-08-20  
**Raised By:** SEO & Ads Audit  
**Status:** OPEN  
**Priority:** LOW  
**Plan ID:** L5  
**Effort:** 1 day  
**Improves:** Monitoring · Perf regression prevention  
**Scope:** CI/CD pipeline, Google Search Console, PSI API  
**Related:** All performance CRs (CR-70 to CR-84)

---

## 1. Problem Statement

No Core Web Vitals monitoring exists. Performance regressions from future code changes cannot be detected. The audit found “No CWV monitoring pipeline (PSI/CrUX inaccessible during audit)” — field data was unavailable meaning real-user performance cannot be measured.

---

## 2. Setup Required

### Step 1 — Google Search Console configuration
- Verify www.mygenie.online property in GSC
- Enable Core Web Vitals report (requires real-user traffic — CrUX data available after 28 days of field data)
- Set up URL inspection monitoring for the 5 key LP URLs

### Step 2 — PageSpeed Insights API baseline
Create a weekly PSI API script for the 5 key URLs:
```bash
# Save as scripts/cwv-check.sh
URLs=(
  "https://www.mygenie.online/"
  "https://www.mygenie.online/petpooja-alternative"
  "https://www.mygenie.online/pricing"
  "https://www.mygenie.online/product/sell-serve"
  "https://www.mygenie.online/solutions/cloud-kitchens"
)
for url in "${URLs[@]}"; do
  echo "Checking: $url"
  curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=mobile&key=YOUR_PSI_KEY" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); cats=d['lighthouseResult']['categories']; print(cats['performance']['score']*100)"
done
```

### Step 3 — Lighthouse CI (deploy-time regression check)
Add `@lhci/cli` to dev dependencies:
```json
// .lighthouserc.json
{
  "ci": {
    "collect": { "url": ["https://www.mygenie.online/", "https://www.mygenie.online/petpooja-alternative"] },
    "assert": { "assertions": { "categories:performance": ["warn", {"minScore": 0.6}] } }
  }
}
```

---

## 3. Definition of Done

- [ ] GSC Core Web Vitals report showing field data (requires 28+ days of traffic)
- [ ] Weekly PSI script running and logging scores for 5 key URLs
- [ ] Lighthouse CI running on deploy with performance score ≥60 threshold
- [ ] Alert set up for score drops > 10 points

---

*CR-105 registered 2026-08-20. Source: SEO & QS Audit · Plan ID L5.*
