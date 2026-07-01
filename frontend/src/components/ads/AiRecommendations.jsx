import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const BADGE_STYLE = {
  SCALE:             "bg-emerald-100 text-emerald-700 border border-emerald-200",
  BLOCK:             "bg-red-100 text-red-700 border border-red-200",
  PAUSE:             "bg-red-100 text-red-700 border border-red-200",
  REVIEW:            "bg-amber-100 text-amber-700 border border-amber-200",
  FATIGUED:          "bg-orange-100 text-orange-700 border border-orange-200",
  LP_FRICTION:       "bg-purple-100 text-purple-700 border border-purple-200",
  WEAK_CREATIVE:     "bg-yellow-100 text-yellow-700 border border-yellow-200",
  CALENDLY_FRICTION: "bg-blue-100 text-blue-700 border border-blue-200",
  TOO_EARLY:         "bg-slate-100 text-slate-500 border border-slate-200",
};

const SIGNAL_ICON = {
  SCALE:             "↑",
  PAUSE:             "⏸",
  REVIEW:            "⚠",
  BLOCK:             "✕",
  FATIGUED:          "~",
  LP_FRICTION:       "↓",
  WEAK_CREATIVE:     "?",
  CALENDLY_FRICTION: "↻",
  TOO_EARLY:         "…",
};

function FunnelRatePills({ data }) {
  if (!data || data.ctr === undefined) return null;
  const pill = (label, val, benchmark, isGood) => (
    <span
      key={label}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border
        ${isGood ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
    >
      {label}: {val}%
      <span className="text-slate-400 font-normal">/ {benchmark}</span>
    </span>
  );
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {data.ctr !== undefined && pill("CTR", data.ctr, data.ctr_benchmark || "0.7–2%", data.ctr >= 0.7)}
      {data.click_to_book_pct !== undefined && data.clicks > 0 &&
        pill("Click→Book", data.click_to_book_pct, data.click_to_book_benchmark || "2%+", data.click_to_book_pct >= 2)}
      {data.book_to_schedule_pct !== undefined && data.book_demo >= 2 &&
        pill("Book→Call", data.book_to_schedule_pct, data.book_to_sched_benchmark || "60%+", data.book_to_schedule_pct >= 60)}
    </div>
  );
}

function AiInsightsPanel({ token }) {
  const [insights, setInsights]   = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState(null);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/api/cms/ads/ai-insights`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to generate insights. Check your LLM key balance.");
    } finally {
      setGenerating(false);
    }
  };

  if (!insights && !generating) {
    return (
      <div className="px-4 py-4 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-700">AI-Powered Narrative Analysis</p>
            <p className="text-xs text-slate-500 mt-0.5">Claude Sonnet analyses your campaigns and generates actionable insights</p>
          </div>
          <button
            data-testid="generate-ai-insights-btn"
            onClick={generate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Sparkles size={13} />
            Generate AI Insights
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  if (generating) {
    return (
      <div className="px-4 py-4 bg-violet-50 border-b border-slate-100 flex items-center gap-3">
        <Loader2 size={16} className="text-violet-600 animate-spin" />
        <span className="text-xs text-violet-700 font-medium">Claude Sonnet is analysing your campaigns…</span>
      </div>
    );
  }

  if (insights?.error) {
    return (
      <div className="px-4 py-3 bg-red-50 border-b border-slate-100">
        <p className="text-xs text-red-600">{insights.error}</p>
        <button onClick={() => setInsights(null)} className="text-xs text-slate-500 underline mt-1">Try again</button>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50" data-testid="ai-insights-panel">
      <div className="px-4 py-3 flex items-center justify-between border-b border-violet-100">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-violet-600" />
          <span className="text-xs font-semibold text-violet-700">AI Analysis — Claude Sonnet</span>
        </div>
        <button onClick={() => setInsights(null)} className="text-xs text-slate-400 hover:text-slate-600 underline">Regenerate</button>
      </div>

      {insights.executive_summary && (
        <div className="px-4 py-3 border-b border-violet-100">
          <p className="text-xs font-semibold text-slate-600 mb-1">Summary</p>
          <p className="text-sm text-slate-700 leading-relaxed">{insights.executive_summary}</p>
        </div>
      )}

      {insights.top_insight && (
        <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/50">
          <p className="text-xs font-semibold text-violet-700 mb-1">Top Insight</p>
          <p className="text-sm text-slate-700">{insights.top_insight}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-violet-100">
        {insights.actions?.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-emerald-700 mb-2">Actions to Take</p>
            <ul className="space-y-1.5">
              {insights.actions.map((a, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-700">
                  <span className="text-emerald-500 font-bold shrink-0">{i + 1}.</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(insights.warnings?.length > 0 || insights.budget_recommendation) && (
          <div className="px-4 py-3">
            {insights.warnings?.length > 0 && (
              <>
                <p className="text-xs font-semibold text-amber-700 mb-2">Warnings</p>
                <ul className="space-y-1.5 mb-3">
                  {insights.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-700">
                      <span className="text-amber-500 shrink-0">!</span>{w}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {insights.budget_recommendation && (
              <>
                <p className="text-xs font-semibold text-blue-700 mb-1">Budget Recommendation</p>
                <p className="text-xs text-slate-700">{insights.budget_recommendation}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-violet-100">
        <p className="text-xs text-slate-400">
          Generated by Claude Sonnet · {insights.generated_at ? new Date(insights.generated_at).toLocaleTimeString() : ""}
        </p>
      </div>
    </div>
  );
}

export default function AiRecommendations({ token }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/cms/ads/recommendations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div data-testid="ai-recs-loading"
        className="h-16 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
    );
  }
  if (!data || data.signal_count === 0) {
    return (
      <section data-testid="ai-recommendations"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <AiInsightsPanel token={token} />
        <div className="px-4 py-3 text-sm text-slate-400">
          No rule-based signals yet — sync Meta data to generate recommendations.
        </div>
      </section>
    );
  }

  const visible = expanded ? data.signals : data.signals.slice(0, 4);

  return (
    <section data-testid="ai-recommendations" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            AI Recommendations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{data.signal_count} signals detected</p>
        </div>
        {data.signal_count > 4 && (
          <button
            data-testid="recs-expand-btn"
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            {expanded ? "Show less" : `Show all ${data.signal_count}`}
          </button>
        )}
      </div>

      <AiInsightsPanel token={token} />

      {data.top_actions?.length > 0 && (
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-1">Rule-based top actions:</p>
          <ul className="space-y-0.5">
            {data.top_actions.map((a, i) => (
              <li key={i} className="text-xs text-slate-700 flex gap-2">
                <span className="text-slate-400 shrink-0">{i + 1}.</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {visible.map((s, i) => (
          <div key={i} data-testid={`rec-signal-${i}`}
            className="px-4 py-3 flex items-start gap-3">
            <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${BADGE_STYLE[s.type] || "bg-slate-100 text-slate-600"}`}>
              <span>{SIGNAL_ICON[s.type] || "·"}</span>
              {s.type.replace(/_/g, " ")}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 font-mono truncate">{s.name}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.message}</p>
              <FunnelRatePills data={s.data} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

