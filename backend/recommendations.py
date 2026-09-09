"""CR-24 — Ads Intelligence Recommendations Engine.

Phase 1: Rules-based signals (SCALE / PAUSE / BLOCK / FATIGUED / REVIEW / TOO_EARLY).
Phase 2: LLM summary via Emergent key (Claude).
Phase E (GAP-17/18/19/20): Funnel drop-off signals (LP_FRICTION / WEAK_CREATIVE /
  CALENDLY_FRICTION), campaign age gate using real campaign_created_date, CTR benchmarks.

Rules:
  SCALE          adset: CPL ≤ TARGET_CPL AND total_conversions ≥ 1
  PAUSE          adset: spend > PAUSE_SPEND_THRESHOLD AND total_conversions == 0
  REVIEW         adset: spend > REVIEW_SPEND_THRESHOLD AND total_conversions == 0
  BLOCK          keyword: spend > BLOCK_SPEND_THRESHOLD AND schedule_rate < 20%
  FATIGUED       creative/adset: frequency > FATIGUE_FREQUENCY (Meta API data)
  TOO_EARLY      adset: campaign age < MIN_CAMPAIGN_AGE_DAYS → suppress other signals
  WEAK_CREATIVE  adset: CTR < CTR_WEAK with MIN_IMPRESSIONS_CTR+ impressions
  LP_FRICTION    adset: CTR ≥ CTR_GOOD but click_to_book < CLICK_TO_BOOK_WEAK
  CALENDLY_FRICTION adset: book_demo ≥ 2 but book_to_schedule < BOOK_TO_SCHED_WEAK
"""
import logging
import os
from datetime import datetime, timezone

import funnel as funnel_module

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# BUSINESS CONTEXT CONSTANTS — MyGenie POS, India B2B SaaS  (GAP-19)
# Update when CPL targets or deal values change.
# ─────────────────────────────────────────────────────────────────────────────
TARGET_CPL             = 800    # ₹ — target cost per lead (Book Demo + Schedule)
TARGET_CP_DEMO         = 2500   # ₹ — acceptable cost per demo attended
AVERAGE_DEAL_VALUE     = 50000  # ₹ — average contract value

# Threshold scaling from TARGET_CPL:
REVIEW_SPEND_THRESHOLD = TARGET_CPL * 8    # ₹6,400  — review after 8× CPL with 0 leads
PAUSE_SPEND_THRESHOLD  = TARGET_CPL * 25   # ₹20,000 — pause after 25× CPL with 0 leads
BLOCK_SPEND_THRESHOLD  = int(TARGET_CPL * 1.5)  # ₹1,200 — block keyword after 1.5× CPL

SCALE_MIN_WON          = 2
FATIGUE_FREQUENCY      = 3.5   # flag creative fatigue above 3.5× frequency

# ─────────────────────────────────────────────────────────────────────────────
# INDUSTRY BENCHMARKS — India B2B SaaS, Meta Leads Objective  (GAP-20)
# Source: Industry averages for India B2B lead-gen Meta campaigns, 2025-26
# ─────────────────────────────────────────────────────────────────────────────
CTR_EXCELLENT          = 2.0   # % — top 10% B2B Meta ads → SCALE creative signal
CTR_GOOD               = 1.0   # % — healthy range for B2B lead gen
CTR_WEAK               = 0.7   # % — below this → WEAK_CREATIVE signal
CTR_POOR               = 0.3   # % — below this → immediate review

CLICK_TO_BOOK_GOOD     = 2.0   # % — healthy click-to-demo booking rate
CLICK_TO_BOOK_WEAK     = 0.5   # % — below this → LP_FRICTION signal

BOOK_TO_SCHED_GOOD     = 60.0  # % — healthy booked-demo-to-scheduled rate
BOOK_TO_SCHED_WEAK     = 30.0  # % — below this → CALENDLY_FRICTION signal

MIN_IMPRESSIONS_CTR    = 500   # minimum impressions before CTR signals fire (avoids noise)
MIN_CAMPAIGN_AGE_DAYS  = 7     # campaign age < 7 days → TOO_EARLY gate  (GAP-18)


def _median(values: list) -> float | None:
    if not values:
        return None
    s = sorted(v for v in values if v is not None)
    if not s:
        return None
    mid = len(s) // 2
    return s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2


async def _keyword_signals(db) -> list:
    data = await funnel_module.get_funnel_by_attribution(db, dimension="keyword")
    rows = data.get("rows", [])
    if not rows:
        return []

    signals = []
    cp_wins = [r["cp_win"] for r in rows if r.get("cp_win") is not None]
    median_cp_win = _median(cp_wins)

    for r in rows:
        kw           = r.get("value", "")
        spend        = r.get("spend") or 0
        won          = r.get("won", 0)
        schedule_rate = r.get("schedule_rate", 100)
        cp_win       = r.get("cp_win")

        if spend >= BLOCK_SPEND_THRESHOLD and schedule_rate < 20:
            signals.append({
                "type":     "BLOCK",
                "entity":   "keyword",
                "name":     kw,
                "message":  f"₹{int(spend):,} spent, only {schedule_rate}% demo rate. Add as negative keyword.",
                "data":     {"spend": spend, "schedule_rate": schedule_rate, "won": won},
                "priority": 1,
            })
        elif (cp_win is not None and median_cp_win is not None
              and cp_win < median_cp_win and won >= SCALE_MIN_WON):
            signals.append({
                "type":     "SCALE",
                "entity":   "keyword",
                "name":     kw,
                "message":  f"CP-Win ₹{int(cp_win):,} — {round((1 - cp_win/median_cp_win)*100)}% below median. Scale this keyword.",
                "data":     {"spend": spend, "won": won, "cp_win": cp_win, "median_cp_win": median_cp_win},
                "priority": 2,
            })

    return signals


async def _campaign_signals(db) -> list:
    # Only check campaign-level rows with spend to avoid false positives
    pipeline = [
        {"$match": {"$or": [{"source": {"$in": ["meta_api", "google_mcp"]}}, {"level": "campaign"}]}},
        {"$group": {"_id": "$campaign", "spend": {"$sum": "$spend"}, "source": {"$first": "$source"}}},
        {"$sort": {"spend": -1}},
        {"$limit": 50},
    ]
    campaign_docs = await db.ad_spend.aggregate(pipeline).to_list(50)
    if not campaign_docs:
        return []

    funnel_data = await funnel_module.get_funnel_by_attribution(db, dimension="campaign")
    funnel_map  = {r["value"]: r for r in funnel_data.get("rows", [])}

    signals = []
    for doc in campaign_docs:
        campaign      = doc["_id"]
        spend         = doc["spend"]
        f             = funnel_map.get(campaign, {})
        demos         = f.get("demo_scheduled", 0)
        schedule_rate = f.get("schedule_rate", 0)
        leads         = f.get("lead_in", 0)

        # Only fire PAUSE if campaign HAS attributed leads but zero demos
        # (avoids false positive when UTM tracking isn't set up yet)
        if spend >= PAUSE_SPEND_THRESHOLD and leads > 5 and demos == 0:
            signals.append({
                "type":     "PAUSE",
                "entity":   "campaign",
                "name":     campaign,
                "message":  f"₹{int(spend):,} spent with {leads} attributed leads but 0 demos. Review immediately.",
                "data":     {"spend": spend, "leads": leads, "demos": 0},
                "priority": 1,
            })
        elif spend >= REVIEW_SPEND_THRESHOLD and leads > 3 and schedule_rate < 10:
            signals.append({
                "type":     "REVIEW",
                "entity":   "campaign",
                "name":     campaign,
                "message":  f"₹{int(spend):,} spent. Only {schedule_rate}% demo rate from {leads} leads. Review targeting.",
                "data":     {"spend": spend, "leads": leads, "demos": demos, "schedule_rate": schedule_rate},
                "priority": 2,
            })

    return signals


async def _creative_signals(db) -> list:
    # Fixed: query meta_api adset/ad rows (not the old meta_ad CSV upload format)
    docs = await db.ad_spend.find(
        {
            "source": "meta_api",
            "level": {"$in": ["adset", "ad"]},
            "frequency": {"$gt": FATIGUE_FREQUENCY},
        },
        {"_id": 0, "ad_name": 1, "ad_set": 1, "campaign": 1, "frequency": 1, "reach": 1, "spend": 1}
    ).to_list(50)

    signals = []
    for doc in docs:
        ad_name   = doc.get("ad_name") or doc.get("ad_set") or "Unknown Ad"
        frequency = doc.get("frequency", 0)
        signals.append({
            "type":     "FATIGUED",
            "entity":   "creative",
            "name":     ad_name,
            "message":  f"Frequency {frequency:.1f}× — audience overexposed (threshold: {FATIGUE_FREQUENCY}×). Refresh or rotate creative.",
            "data":     {"frequency": frequency, "reach": doc.get("reach"), "spend": doc.get("spend"), "campaign": doc.get("campaign")},
            "priority": 2,
        })

    return signals


async def _meta_api_signals(db) -> list:
    """Generate SCALE / REVIEW / PAUSE / TOO_EARLY signals directly from Meta API ad_spend rows.

    GAP-16 fix: reads ad_spend collection directly (not UTM-attributed funnel data).
    GAP-18 fix: uses campaign_created_date (stored by ads_mcp Phase E sync) for age gate.
               If campaign_created_date is absent (old rows), age gate is skipped.
    """
    signals = []

    adset_rows = await db.ad_spend.find(
        {"source": "meta_api", "level": "adset"},
        {
            "_id": 0,
            "ad_set": 1, "campaign": 1, "campaign_id": 1, "spend": 1,
            "book_demo_count": 1, "schedule_count": 1, "frequency": 1,
            "campaign_created_date": 1,
        }
    ).to_list(200)

    for row in adset_rows:
        spend      = float(row.get("spend") or 0)
        book_demo  = int(row.get("book_demo_count") or 0)
        schedule   = int(row.get("schedule_count") or 0)
        total_conv = book_demo + schedule
        adset_name = row.get("ad_set") or "Unknown Ad Set"
        campaign   = row.get("campaign") or ""

        if spend < 100:
            continue  # skip very low-spend rows (not enough data yet)

        # GAP-18: Campaign age gate using real campaign_created_date
        # Only fires if campaign_created_date was stored by latest ads_mcp sync.
        campaign_created = row.get("campaign_created_date")
        if campaign_created:
            try:
                created  = datetime.strptime(campaign_created, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                age_days = (datetime.now(timezone.utc) - created).days
                if age_days < MIN_CAMPAIGN_AGE_DAYS:
                    signals.append({
                        "type":     "TOO_EARLY",
                        "entity":   "adset",
                        "name":     adset_name,
                        "message":  f"Campaign only {age_days}d old — needs {MIN_CAMPAIGN_AGE_DAYS}+ days of data for reliable signals.",
                        "data":     {"spend": spend, "age_days": age_days, "campaign": campaign},
                        "priority": 3,
                    })
                    continue
            except (ValueError, TypeError):
                pass

        # PAUSE: high spend, zero conversions
        if spend >= PAUSE_SPEND_THRESHOLD and total_conv == 0:
            signals.append({
                "type":     "PAUSE",
                "entity":   "adset",
                "name":     adset_name,
                "message":  f"₹{int(spend):,} spent with 0 conversions (Book Demo + Schedule). Threshold: ₹{PAUSE_SPEND_THRESHOLD:,}.",
                "data":     {"spend": spend, "book_demo": book_demo, "schedule": schedule, "campaign": campaign},
                "priority": 1,
            })
        # REVIEW: moderate spend, zero conversions
        elif spend >= REVIEW_SPEND_THRESHOLD and total_conv == 0:
            signals.append({
                "type":     "REVIEW",
                "entity":   "adset",
                "name":     adset_name,
                "message":  f"₹{int(spend):,} spent with 0 conversions. Review targeting, creative, and landing page.",
                "data":     {"spend": spend, "book_demo": book_demo, "schedule": schedule, "campaign": campaign},
                "priority": 2,
            })
        # SCALE: CPL at or below target and at least 1 conversion
        elif total_conv >= 1 and spend > 0:
            cpl = round(spend / total_conv)
            if cpl <= TARGET_CPL:
                signals.append({
                    "type":     "SCALE",
                    "entity":   "adset",
                    "name":     adset_name,
                    "message":  f"₹{cpl:,} CPL — below ₹{TARGET_CPL:,} target with {total_conv} conversion(s). Increase budget.",
                    "data":     {"spend": spend, "book_demo": book_demo, "schedule": schedule, "cpl": cpl, "campaign": campaign},
                    "priority": 2,
                })

    return signals


async def _funnel_dropoff_signals(db) -> list:
    """GAP-17: Diagnose WHERE in the funnel conversion fails for each ad set.

    Computes three rates from existing Meta API adset rows:
      CTR              = clicks / impressions × 100
      click_to_book    = book_demo / clicks × 100
      book_to_schedule = schedule / book_demo × 100

    Signals fired:
      WEAK_CREATIVE     — CTR < CTR_WEAK (creative/audience not resonating)
      LP_FRICTION       — CTR ≥ CTR_GOOD but click_to_book < CLICK_TO_BOOK_WEAK
                          (ad works, landing page is the bottleneck)
      CALENDLY_FRICTION — book_demo ≥ 2 but book_to_schedule < BOOK_TO_SCHED_WEAK
                          (demos booked but not converting to scheduled calls)
    """
    signals = []

    adset_rows = await db.ad_spend.find(
        {"source": "meta_api", "level": "adset"},
        {
            "_id": 0, "ad_set": 1, "campaign": 1, "spend": 1,
            "impressions": 1, "clicks": 1,
            "book_demo_count": 1, "schedule_count": 1,
        }
    ).to_list(200)

    for row in adset_rows:
        impressions = int(row.get("impressions") or 0)
        clicks      = int(row.get("clicks") or 0)
        book_demo   = int(row.get("book_demo_count") or 0)
        schedule    = int(row.get("schedule_count") or 0)
        spend       = float(row.get("spend") or 0)
        adset_name  = row.get("ad_set") or "Unknown Ad Set"
        campaign    = row.get("campaign") or ""

        # Need minimum impressions and spend to compute reliable rates
        if impressions < MIN_IMPRESSIONS_CTR or spend < 100:
            continue

        ctr           = round(clicks / impressions * 100, 2)
        click_to_book = round(book_demo / clicks * 100, 2) if clicks > 0 else 0
        book_to_sched = round(schedule / book_demo * 100, 2) if book_demo > 0 else 0

        rate_data = {
            "ctr": ctr,
            "click_to_book_pct": click_to_book,
            "book_to_schedule_pct": book_to_sched,
            "spend": spend,
            "impressions": impressions,
            "clicks": clicks,
            "book_demo": book_demo,
            "schedule": schedule,
            "campaign": campaign,
            # Benchmark references for frontend display
            "ctr_benchmark": f"{CTR_WEAK}–{CTR_EXCELLENT}%",
            "click_to_book_benchmark": f"{CLICK_TO_BOOK_GOOD}%+",
            "book_to_sched_benchmark": f"{BOOK_TO_SCHED_GOOD}%+",
        }

        # LP_FRICTION: Good CTR but very low click-to-book rate
        if ctr >= CTR_GOOD and click_to_book < CLICK_TO_BOOK_WEAK:
            signals.append({
                "type":     "LP_FRICTION",
                "entity":   "adset",
                "name":     adset_name,
                "message":  (
                    f"CTR {ctr}% is healthy but only {click_to_book}% of clicks become demo bookings "
                    f"(benchmark: {CLICK_TO_BOOK_GOOD}%+). The ad is working — the landing page is the bottleneck."
                ),
                "data":     rate_data,
                "priority": 2,
            })
        # WEAK_CREATIVE: CTR below benchmark with enough data
        elif ctr < CTR_WEAK:
            signals.append({
                "type":     "WEAK_CREATIVE",
                "entity":   "adset",
                "name":     adset_name,
                "message":  (
                    f"CTR {ctr}% is below India B2B benchmark ({CTR_WEAK}–{CTR_EXCELLENT}%). "
                    f"Test a new creative, headline, or audience segment."
                ),
                "data":     rate_data,
                "priority": 2,
            })

        # CALENDLY_FRICTION: Demo bookings but low schedule rate (independent of CTR check)
        if book_demo >= 2 and book_to_sched < BOOK_TO_SCHED_WEAK:
            signals.append({
                "type":     "CALENDLY_FRICTION",
                "entity":   "adset",
                "name":     adset_name,
                "message":  (
                    f"Only {book_to_sched}% of {book_demo} demo bookings convert to scheduled calls "
                    f"(benchmark: {BOOK_TO_SCHED_GOOD}%+). Check Calendly availability and reminder emails."
                ),
                "data":     rate_data,
                "priority": 2,
            })

    return signals


async def _strategy_lab_hypotheses(db) -> dict:
    """GAP-21: Generate 4–5 strategic brainstorm hypotheses using Claude Sonnet.

    Gathers context from existing signals + adset data + placement data + business context.
    Returns structured JSON with hypothesis objects. No DB writes — read-only.
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
        import json as _json
        import re as _re

        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not llm_key:
            return {"error": "LLM key not configured. Check EMERGENT_LLM_KEY in backend/.env"}

        # ── Gather context ────────────────────────────────────────────────────

        # 1. Current signals
        all_sigs = (
            await _keyword_signals(db)
            + await _campaign_signals(db)
            + await _creative_signals(db)
            + await _meta_api_signals(db)
            + await _funnel_dropoff_signals(db)
        )
        top_signals = sorted(all_sigs, key=lambda s: s["priority"])[:8]

        signal_lines = "\n".join(
            f"  - [{s['type']}] ({s.get('entity','?')}) \"{s.get('name','?')}\": {s['message']}"
            for s in top_signals
        ) or "  No signals detected yet."

        # 2. Executive summary
        try:
            exec_rows = await db.ad_spend.find(
                {"source": "meta_api", "level": "campaign"},
                {"_id": 0, "spend": 1, "book_demo_count": 1, "schedule_count": 1}
            ).to_list(20)
            total_spend = sum(float(r.get("spend") or 0) for r in exec_rows)
            total_conv  = sum(int(r.get("book_demo_count") or 0) + int(r.get("schedule_count") or 0) for r in exec_rows)
            avg_cpl     = round(total_spend / total_conv) if total_conv else 0
        except Exception:
            total_spend, total_conv, avg_cpl = 0, 0, 0

        exec_line = (
            f"Total Meta spend: ₹{int(total_spend):,} | "
            f"Total conversions (BookDemo+Schedule): {total_conv} | "
            f"Avg CPL: ₹{avg_cpl:,} | Target CPL: ₹{TARGET_CPL:,}"
        )

        # 3. Ad set audience context
        adset_rows = await db.ad_spend.find(
            {"source": "meta_api", "level": "adset"},
            {"_id": 0, "ad_set": 1, "spend": 1, "impressions": 1, "clicks": 1,
             "book_demo_count": 1, "schedule_count": 1, "age_min": 1, "age_max": 1,
             "geo_countries": 1, "optimization_goal": 1}
        ).sort("spend", -1).to_list(6)

        adset_lines = "\n".join(
            f"  - \"{r.get('ad_set','?')}\": spend=₹{int(float(r.get('spend') or 0)):,}, "
            f"age={r.get('age_min','?')}-{r.get('age_max','?')}, "
            f"geo={','.join(r.get('geo_countries') or [])}, "
            f"book_demo={r.get('book_demo_count',0)}, schedule={r.get('schedule_count',0)}, "
            f"ctr={round(int(r.get('clicks') or 0)/int(r.get('impressions') or 1)*100,2) if r.get('impressions') else 'n/a'}%"
            for r in adset_rows
        ) or "  No ad set data."

        # 4. Placement context
        plc_rows = await db.ad_spend.find(
            {"source": "meta_api", "level": "placement"},
            {"_id": 0, "platform": 1, "placement_position": 1, "spend": 1}
        ).sort("spend", -1).to_list(6)
        total_plc_spend = sum(float(r.get("spend") or 0) for r in plc_rows)
        plc_lines = "\n".join(
            f"  - {r.get('platform','?')} / {r.get('placement_position','?')}: "
            f"₹{int(float(r.get('spend') or 0)):,} "
            f"({round(float(r.get('spend') or 0) / total_plc_spend * 100) if total_plc_spend else 0}%)"
            for r in plc_rows[:4]
        ) or "  No placement data."

        # ── Build Claude prompt ──────────────────────────────────────────────

        prompt = f"""You are a senior performance marketing strategist for MyGenie, a restaurant POS software company in India (B2B SaaS). Your job is to generate testable strategic hypotheses — not instructions, but ideas to test.

BUSINESS CONTEXT:
- Product: MyGenie POS — sold to restaurant owners, cafes, hotel chains across India
- Avg deal value: ₹50,000/year
- Target CPL: ₹{TARGET_CPL:,} (cost per demo booking or schedule)
- Sales cycle: 7–14 days post-demo
- Target decision maker: Restaurant owner/manager, age 30–55, metro + Tier 2 cities

CURRENT PERFORMANCE SNAPSHOT:
{exec_line}

ACTIVE SIGNALS (rule-based engine output):
{signal_lines}

AD SET AUDIENCE BREAKDOWN:
{adset_lines}

PLACEMENT SPEND BREAKDOWN:
{plc_lines}

TASK:
Generate exactly 4 strategic hypotheses to test. Each must:
1. Be motivated by a specific signal or pattern from the data above
2. Describe a test that could be run in the next 7–14 days
3. NOT require code changes, new tools, or complex setup
4. Be specific to MyGenie's business context (restaurant owners, India B2B)

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{{
  "hypotheses": [
    {{
      "title": "Short title (max 10 words)",
      "reasoning": "2-3 sentences: which signal motivates this, and why it suggests this test",
      "what_to_test": "1-2 sentences: the specific test to run and what to measure",
      "confidence": "high|medium|low",
      "effort": "low|medium|high",
      "category": "landing_page|audience|creative|budget|offer"
    }}
  ],
  "context_summary": "One sentence summarising the key pattern found in the data"
}}"""

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"strategy_lab_{datetime.now(timezone.utc).strftime('%H%M%S')}",
            system_message=(
                "You are a concise, data-driven Meta Ads strategist. "
                "Respond only with valid JSON. No markdown, no preamble."
            ),
        ).with_model("anthropic", "claude-sonnet-4-6")

        full_text = ""
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                full_text += event.content
            elif isinstance(event, StreamDone):
                break

        # Parse JSON — strip any markdown fences if present
        clean = _re.sub(r"```(?:json)?|```", "", full_text).strip()
        result = _json.loads(clean)

        hypotheses = result.get("hypotheses", [])
        return {
            "hypotheses":       hypotheses,
            "context_summary":  result.get("context_summary", ""),
            "signal_count":     len(top_signals),
            "adset_count":      len(adset_rows),
            "generated_at":     datetime.now(timezone.utc).isoformat(),
            "model":            "claude-sonnet-4-6",
        }

    except Exception as e:
        err = str(e)
        logger.error("_strategy_lab_hypotheses failed: %s", err)
        if "budget" in err.lower() or "exceeded" in err.lower():
            msg = "LLM key budget exceeded. Go to Profile → Universal Key → Add Balance."
        elif "api_key" in err.lower() or "invalid" in err.lower():
            msg = "LLM key not configured or invalid. Check EMERGENT_LLM_KEY in .env."
        elif "json" in err.lower() or "decode" in err.lower():
            msg = "LLM returned unexpected format. Try regenerating."
        else:
            msg = f"Strategy Lab generation failed: {err}"
        return {"error": msg, "generated_at": datetime.now(timezone.utc).isoformat()}


async def _llm_summary(signals: list) -> tuple:
    """Generate a short LLM narrative from rule-based signals. Returns (text, actions).
    Takes only the pre-computed signals list — no DB access needed.
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not llm_key or not signals:
            return None, []

        signal_text = "\n".join(
            f"- [{s['type']}] {s['entity'].upper()} '{s['name']}': {s['message']}"
            for s in signals[:15]
        )
        prompt = (
            "You are an ads performance analyst for MyGenie, a POS software company targeting Indian restaurants.\n\n"
            f"Current signals from our ad accounts:\n{signal_text}\n\n"
            "In 3 short sentences, summarise the key findings and the top 3 specific actions to take today. "
            "Be direct, use Indian Rupee amounts, and prioritise revenue impact."
        )

        chat = LlmChat(
            api_key=llm_key,
            session_id="ads_recommendations",
            system_message="You are a concise, data-driven Google and Meta Ads analyst.",
        ).with_model("anthropic", "claude-sonnet-4-6")

        full_text = ""
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                full_text += event.content
            elif isinstance(event, StreamDone):
                break

        lines   = [ln.strip() for ln in full_text.split("\n") if ln.strip()]
        actions = [ln for ln in lines if ln and (ln[0].isdigit() or ln.startswith("-"))][:3]
        return full_text, actions

    except Exception as e:
        logger.error("LLM recommendation summary failed: %s", e)
        return None, []


async def generate_ai_insights(db) -> dict:
    """Rich LLM narrative using Meta campaign + adset + ad + placement + keyword data."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
        import uuid

        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not llm_key:
            return {"error": "LLM key not configured"}

        # --- Gather context from DB ---
        campaigns = await db.ad_spend.find(
            {"source": "meta_api", "level": "campaign"},
            {"_id": 0, "campaign": 1, "spend": 1, "book_demo_count": 1,
             "schedule_count": 1, "effective_status": 1, "impressions": 1, "clicks": 1}
        ).sort("spend", -1).to_list(10)

        adsets = await db.ad_spend.find(
            {"source": "meta_api", "level": "adset"},
            {"_id": 0, "ad_set": 1, "spend": 1, "book_demo_count": 1,
             "schedule_count": 1, "audience_label": 1, "effective_status": 1}
        ).sort("spend", -1).to_list(10)

        ads = await db.ad_spend.find(
            {"source": "meta_api", "level": "ad"},
            {"_id": 0, "ad_name": 1, "spend": 1, "book_demo_count": 1,
             "schedule_count": 1, "frequency": 1}
        ).sort("spend", -1).to_list(10)

        placements = await db.ad_spend.find(
            {"source": "meta_api", "level": "placement"},
            {"_id": 0, "platform": 1, "placement_position": 1, "spend": 1,
             "impressions": 1, "clicks": 1, "ctr": 1}
        ).sort("spend", -1).to_list(8)

        # Keyword signals (top 5)
        kw_signals = await _keyword_signals(db)
        top_kws = kw_signals[:5]

        # --- Build prompt context ---
        def fmt(n):
            return f"₹{float(n or 0):,.0f}"

        camp_lines = "\n".join(
            f"  - {c.get('campaign','?')}: spend={fmt(c.get('spend'))}, "
            f"book_demo={c.get('book_demo_count',0)}, schedule={c.get('schedule_count',0)}, "
            f"clicks={c.get('clicks',0)}, status={c.get('effective_status','?')}"
            for c in campaigns
        )
        adset_lines = "\n".join(
            f"  - {a.get('ad_set','?')}: spend={fmt(a.get('spend'))}, "
            f"audience={a.get('audience_label','?')}, "
            f"book_demo={a.get('book_demo_count',0)}, schedule={a.get('schedule_count',0)}"
            for a in adsets
        )
        ad_lines = "\n".join(
            f"  - '{r.get('ad_name','?')}': spend={fmt(r.get('spend'))}, "
            f"book_demo={r.get('book_demo_count',0)}, schedule={r.get('schedule_count',0)}, "
            f"frequency={round(float(r.get('frequency') or 0), 2)}"
            for r in ads
        )
        plc_lines = "\n".join(
            f"  - {p.get('platform','?')} / {p.get('placement_position','?')}: "
            f"spend={fmt(p.get('spend'))}, CTR={p.get('ctr','?')}%"
            for p in placements[:6]
        )
        kw_lines = "\n".join(
            f"  - [{s['type']}] keyword '{s['name']}': {s['message']}"
            for s in top_kws
        )

        prompt = f"""You are a senior digital marketing analyst for MyGenie, a restaurant POS software company in India.

Analyze the following Meta Ads data and provide actionable intelligence:

CAMPAIGNS:
{camp_lines or "  No campaign data available"}

AD SETS:
{adset_lines or "  No ad set data available"}

INDIVIDUAL ADS:
{ad_lines or "  No ad data available"}

PLACEMENT PERFORMANCE:
{plc_lines or "  No placement data available"}

GOOGLE KEYWORD SIGNALS:
{kw_lines or "  No keyword data available"}

Respond ONLY with a JSON object in this exact format:
{{
  "executive_summary": "2-3 sentence overall performance summary with key numbers",
  "top_insight": "The single most important finding from this data",
  "actions": [
    "Specific action 1 with ad/campaign name and why",
    "Specific action 2 with ad/campaign name and why",
    "Specific action 3 with ad/campaign name and why"
  ],
  "warnings": [
    "Warning about specific ad or campaign with numbers"
  ],
  "budget_recommendation": "One specific budget reallocation suggestion"
}}

Be direct and specific. Use ₹ amounts. Name specific campaigns, ad sets, and ads."""

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"ai_insights_{uuid.uuid4().hex[:8]}",
            system_message="You are a concise, data-driven Meta and Google Ads analyst. Always respond with valid JSON only.",
        ).with_model("anthropic", "claude-sonnet-4-6")

        full_text = ""
        async for event in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                full_text += event.content
            elif isinstance(event, StreamDone):
                break

        # Parse JSON response
        import json, re
        json_match = re.search(r'\{.*\}', full_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {
                "executive_summary": full_text[:300],
                "top_insight": "",
                "actions": [],
                "warnings": [],
                "budget_recommendation": "",
            }

        result["generated_at"] = datetime.now(timezone.utc).isoformat()
        result["model"] = "claude-sonnet-4-6"
        return result

    except Exception as e:
        err_str = str(e)
        logger.error("generate_ai_insights failed: %s", err_str)
        if "budget" in err_str.lower() or "exceeded" in err_str.lower():
            friendly = "LLM key budget exceeded. Go to Profile → Universal Key → Add Balance to top up."
        elif "api_key" in err_str.lower() or "invalid" in err_str.lower():
            friendly = "LLM key not configured or invalid. Check EMERGENT_LLM_KEY in .env."
        else:
            friendly = f"AI insights generation failed: {err_str}"
        return {"error": friendly, "generated_at": datetime.now(timezone.utc).isoformat()}


async def get_recommendations(db, use_llm: bool = False) -> dict:
    keyword_sigs  = await _keyword_signals(db)
    campaign_sigs = await _campaign_signals(db)
    creative_sigs = await _creative_signals(db)
    meta_api_sigs = await _meta_api_signals(db)
    funnel_sigs   = await _funnel_dropoff_signals(db)   # Phase E — GAP-17

    all_signals = sorted(
        keyword_sigs + campaign_sigs + creative_sigs + meta_api_sigs + funnel_sigs,
        key=lambda s: (s["priority"], -(s["data"].get("spend") or 0))
    )

    llm_summary = None
    top_actions: list = []

    if use_llm and all_signals:
        llm_summary, top_actions = await _llm_summary(all_signals)

    if not top_actions:
        top_actions = [s["message"] for s in all_signals[:3]]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "signal_count": len(all_signals),
        "signals":      all_signals,
        "llm_summary":  llm_summary,
        "top_actions":  top_actions,
        "mcp_live":     False,
    }
