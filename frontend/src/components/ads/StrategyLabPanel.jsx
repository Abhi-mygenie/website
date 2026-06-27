import { useState, useCallback } from "react";
import { Lightbulb, Loader2, RefreshCw, ChevronRight, Bookmark, X, Check } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

// ── Category styling ──────────────────────────────────────────────────────────
const CAT_STYLE = {
  landing_page: "bg-purple-100 text-purple-700 border-purple-200",
  audience:     "bg-blue-100   text-blue-700   border-blue-200",
  creative:     "bg-yellow-100 text-yellow-700  border-yellow-200",
  budget:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  offer:        "bg-orange-100 text-orange-700  border-orange-200",
};

const CAT_LABEL = {
  landing_page: "Landing Page",
  audience:     "Audience",
  creative:     "Creative",
  budget:       "Budget",
  offer:        "Offer",
};

const CONF_STYLE = {
  high:   "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100   text-amber-700",
  low:    "bg-slate-100   text-slate-500",
};

const EFFORT_STYLE = {
  low:    "bg-emerald-50 text-emerald-600",
  medium: "bg-amber-50   text-amber-600",
  high:   "bg-red-50     text-red-600",
};

// ── Single hypothesis card ─────────────────────────────────────────────────────
function HypothesisCard({ h, index }) {
  const [tag, setTag] = useState(null); // null | "explore" | "saved" | "skipped"

  const catStyle    = CAT_STYLE[h.category]    || "bg-slate-100 text-slate-600 border-slate-200";
  const confStyle   = CONF_STYLE[h.confidence] || "bg-slate-100 text-slate-500";
  const effortStyle = EFFORT_STYLE[h.effort]   || "bg-slate-50 text-slate-500";

  const cardBorder =
    tag === "explore" ? "border-emerald-300 bg-emerald-50/30" :
    tag === "saved"   ? "border-blue-300 bg-blue-50/20" :
    tag === "skipped" ? "opacity-50 border-slate-200" :
    "border-slate-200 hover:border-slate-300";

  return (
    <div
      data-testid={`hypothesis-card-${index}`}
      className={`rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 bg-white ${cardBorder}`}
    >
      {/* Header: category + confidence + effort */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catStyle}`}>
          {CAT_LABEL[h.category] || h.category}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${confStyle}`}>
          {h.confidence?.charAt(0).toUpperCase() + h.confidence?.slice(1)} confidence
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${effortStyle}`}>
          {h.effort?.charAt(0).toUpperCase() + h.effort?.slice(1)} effort
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-slate-800 leading-snug">{h.title}</p>

      {/* Reasoning */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Why this signal</p>
        <p className="text-xs text-slate-600 leading-relaxed">{h.reasoning}</p>
      </div>

      {/* What to test */}
      <div className="bg-slate-50 rounded-lg px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">What to test</p>
        <p className="text-xs text-slate-700 leading-relaxed">{h.what_to_test}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {tag === null && (
          <>
            <button
              data-testid={`explore-btn-${index}`}
              onClick={() => setTag("explore")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              Explore <ChevronRight size={11} />
            </button>
            <button
              data-testid={`save-btn-${index}`}
              onClick={() => setTag("saved")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 text-xs font-semibold transition-colors"
            >
              <Bookmark size={11} /> Save
            </button>
            <button
              data-testid={`skip-btn-${index}`}
              onClick={() => setTag("skipped")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs transition-colors"
            >
              <X size={11} /> Skip
            </button>
          </>
        )}

        {tag === "explore" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <Check size={12} /> Marked to Explore
            <button onClick={() => setTag(null)} className="ml-2 text-slate-400 hover:text-slate-600 underline font-normal">undo</button>
          </span>
        )}
        {tag === "saved" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-700">
            <Bookmark size={12} /> Saved to Backlog
            <button onClick={() => setTag(null)} className="ml-2 text-slate-400 hover:text-slate-600 underline font-normal">undo</button>
          </span>
        )}
        {tag === "skipped" && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <X size={11} /> Skipped
            <button onClick={() => setTag(null)} className="ml-2 text-slate-500 hover:text-slate-700 underline">undo</button>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Strategy Lab Panel ───────────────────────────────────────────────────
export function StrategyLabPanel({ token }) {
  const [state, setState]   = useState("idle"); // idle | loading | generated | error
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  const brainstorm = useCallback(async () => {
    setState("loading");
    setError(null);
    setResult(null);
    try {
      const res = await axios.post(
        `${API}/api/cms/ads/strategy-brainstorm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.error) {
        setError(res.data.error);
        setState("error");
      } else {
        setResult(res.data);
        setState("generated");
      }
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "Failed to generate hypotheses. Check your LLM key balance."
      );
      setState("error");
    }
  }, [token]);

  return (
    <section data-testid="strategy-lab-panel"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100">
            <Lightbulb size={13} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Strategy Lab
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {state === "generated" && result
                ? `${result.hypotheses?.length || 0} hypotheses from ${result.signal_count} signals`
                : "AI-powered strategic brainstorm — no execution"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state === "generated" && (
            <button
              data-testid="regenerate-btn"
              onClick={brainstorm}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw size={11} /> Regenerate
            </button>
          )}
          {(state === "idle" || state === "error") && (
            <button
              data-testid="brainstorm-btn"
              onClick={brainstorm}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Lightbulb size={13} />
              Brainstorm
            </button>
          )}
        </div>
      </div>

      {/* Body */}

      {/* Idle state */}
      {state === "idle" && (
        <div className="px-4 py-8 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 mx-auto mb-3">
            <Lightbulb size={18} className="text-indigo-400" />
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Click <strong className="text-slate-700">Brainstorm</strong> to generate 4–5 testable strategic
            hypotheses based on your live signal data.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Powered by Claude Sonnet · No execution — pure ideation
          </p>
        </div>
      )}

      {/* Loading state */}
      {state === "loading" && (
        <div className="px-4 py-8 flex flex-col items-center gap-3">
          <Loader2 size={20} className="text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-600 font-medium">
            Analysing signals and generating hypotheses…
          </p>
          <p className="text-xs text-slate-400">This may take 10–20 seconds</p>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="px-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-amber-500 text-base">!</span>
            <div>
              <p className="text-xs font-semibold text-amber-800">Strategy Lab unavailable</p>
              <p className="text-xs text-amber-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generated state */}
      {state === "generated" && result && (
        <div className="p-4">
          {/* Context summary banner */}
          {result.context_summary && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-xs text-indigo-700 leading-relaxed">
                <span className="font-semibold">Key pattern: </span>
                {result.context_summary}
              </p>
            </div>
          )}

          {/* Hypothesis cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(result.hypotheses || []).map((h, i) => (
              <HypothesisCard key={i} h={h} index={i} />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Generated by Claude Sonnet ·{" "}
              {result.generated_at
                ? new Date(result.generated_at).toLocaleTimeString()
                : ""}
            </p>
            <p className="text-xs text-slate-400 italic">
              These are hypotheses to test — not instructions to execute
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
