import { useState } from "react";

/**
 * Cheap, no-cost anti-bot signals for lead forms.
 * - hp: honeypot value (must stay empty for humans)
 * - elapsed_ms: time since the form mounted (instant submits = bots)
 */
export function useAntiBot() {
  const [hp, setHp] = useState("");
  const [mountedAt] = useState(() => Date.now());
  const signals = () => ({ hp, elapsed_ms: Date.now() - mountedAt });
  return { hp, setHp, signals };
}

/** Derive a junk/ok lead-quality signal from the anti-bot signals (CR-3B #5).
 *  Mirrors the backend `looks_like_bot` heuristic: honeypot filled OR sub-2s fill = junk. */
export function leadQuality(signals = {}) {
  const { hp, elapsed_ms } = signals;
  if (hp) return "junk";
  if (typeof elapsed_ms === "number" && elapsed_ms < 2000) return "junk";
  return "ok";
}

/** Off-screen honeypot input. Real users never see or fill it; bots do. */
export function Honeypot({ value, onChange }) {
  return (
    <input
      type="text"
      name="company_website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ position: "absolute", left: "-9999px", top: 0, width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
      data-testid="honeypot-field"
    />
  );
}
