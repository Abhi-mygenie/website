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
