import { useState } from "react";
import { Sparkles, ChevronDown, Check } from "lucide-react";
import { QUIZ, recommend } from "@/data/pricing";

const fieldCls = "w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-[15px] text-brand-ink focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 appearance-none";

function QuizSelect({ name, label, opts, value, onChange }) {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-brand-muted mb-1.5">{label}</label>
      <select className={fieldCls} value={value} onChange={(e) => onChange(name, e.target.value)} data-testid={`quiz-${name}`}>
        <option value="">Select…</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 text-brand-muted absolute right-3 bottom-3.5 pointer-events-none" />
    </div>
  );
}

export default function RecommendQuiz({ onRecommend, reason }) {
  const [a, setA] = useState({ outletType: "", outlets: "", volume: "", priorities: [] });
  const ready = a.outletType && a.outlets && a.volume && a.priorities.length > 0;
  const set = (k, v) => setA((p) => ({ ...p, [k]: v }));

  const togglePriority = (p) => setA((prev) => {
    const curr = prev.priorities;
    if (curr.includes(p)) return { ...prev, priorities: curr.filter((x) => x !== p) };
    if (curr.length >= 3) return prev;
    return { ...prev, priorities: [...curr, p] };
  });

  const run = () => onRecommend(recommend(a), a.outletType);

  return (
    <div className="rounded-3xl border-2 border-brand-green/25 bg-brand-green/[0.04] p-7 sm:p-8" data-testid="recommend-quiz">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl bg-brand-green/15 flex items-center justify-center"><Sparkles className="w-5 h-5 text-brand-green" /></span>
        <h3 className="font-display text-xl font-bold text-brand-ink">Not sure what you need? Let us suggest.</h3>
      </div>
      <p className="text-sm text-brand-muted mt-2">Answer 4 quick questions and our engine recommends the right plan + add-ons for your business.</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <QuizSelect name="outletType" label="What kind of business?" opts={QUIZ.outletType} value={a.outletType} onChange={set} />
        <QuizSelect name="outlets" label="How many outlets?" opts={QUIZ.outlets} value={a.outlets} onChange={set} />
        <QuizSelect name="volume" label="Monthly orders?" opts={QUIZ.volume} value={a.volume} onChange={set} />

        {/* Priority — multi-select chips (max 3) */}
        <div data-testid="quiz-priority-group">
          <label className="block text-xs font-semibold text-brand-muted mb-1.5">
            Your priorities? <span className="font-normal">(pick up to 3)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {QUIZ.priority.map((p) => {
              const selected = a.priorities.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  data-testid={`quiz-priority-${p.replace(/[\s&/]+/g, "-").toLowerCase()}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all ${
                    selected
                      ? "bg-brand-green text-white border-brand-green"
                      : "bg-white text-brand-ink border-brand-line hover:border-brand-green"
                  }`}
                >
                  {selected && <Check className="w-3 h-3 shrink-0" />}
                  {p}
                </button>
              );
            })}
          </div>
          {a.priorities.length === 3 && (
            <p className="text-[11px] text-brand-muted mt-1.5">Max 3 selected</p>
          )}
        </div>
      </div>

      <button
        onClick={run}
        disabled={!ready}
        data-testid="quiz-recommend-btn"
        className="mt-5 bg-brand-green hover:bg-brand-greenDark text-white rounded-full px-7 py-3 font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        Recommend my plan
      </button>

      {reason && (
        <div className="mt-5 rounded-2xl bg-white border border-brand-green/30 p-4 flex gap-3" data-testid="quiz-reason">
          <Sparkles className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
          <p className="text-[15px] text-brand-ink leading-relaxed">{reason}</p>
        </div>
      )}
    </div>
  );
}
