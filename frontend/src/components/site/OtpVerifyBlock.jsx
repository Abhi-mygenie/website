import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Loader2, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OtpVerifyBlock({ phone, leadId, formType, onVerified, onBack }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendIn, setResendIn] = useState(30);
  const [shake, setShake] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const masked = phone
    ? `+91 ••••• ${String(phone).replace(/\D/g, "").slice(-4)}`
    : "";

  // Auto-send OTP on mount
  useEffect(() => { sendOtp(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Focus first box on mount
  useEffect(() => {
    setTimeout(() => refs[0].current?.focus(), 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendOtp = async () => {
    try {
      await axios.post(`${API}/otp/send`, { phone });
      setResendIn(30);
    } catch (err) {
      const msg = err?.response?.data?.detail || "";
      if (!msg.toLowerCase().includes("wait")) {
        setError("Having trouble sending SMS — you can still try entering a code.");
      }
    }
  };

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setDigits(["", "", "", ""]);
      setTimeout(() => refs[0].current?.focus(), 30);
    }, 550);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyOtp = useCallback(async (code) => {
    if (loading || code.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API}/otp/verify`, { phone, code });
      const token = res.data?.otp_token;
      await axios.post(`${API}/lead/otp-confirm`, {
        lead_id: leadId,
        phone,
        otp_token: token,
        form_type: formType,
      });
      onVerified(token);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Incorrect code, please try again.";
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  }, [loading, phone, leadId, formType, onVerified, triggerShake]);

  const handleChange = (idx, val) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError(null);
    if (d && idx < 3) refs[idx + 1].current?.focus();
    if (d && idx === 3) {
      const code = next.join("");
      if (code.length === 4) verifyOtp(code);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const next = pasted.split("");
      setDigits(next);
      refs[3].current?.focus();
      verifyOtp(pasted);
    }
  };

  const boxBase = `w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl border-2
    focus:outline-none transition-all duration-150 disabled:opacity-50`;
  const boxColor = shake
    ? "border-red-400 bg-red-50"
    : error
    ? "border-red-300 bg-red-50/30"
    : "border-brand-line bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20";

  return (
    <div className="space-y-5" data-testid="otp-verify-block">

      <div>
        <p className="text-sm text-brand-muted">We sent a 4-digit code to</p>
        <p className="font-semibold text-brand-ink mt-0.5" data-testid="otp-masked-phone">{masked}</p>
      </div>

      <div
        className={`flex gap-2.5 justify-center ${shake ? "animate-shake" : ""}`}
        onPaste={handlePaste}
        data-testid="otp-digit-group"
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            data-testid={`otp-digit-${i}`}
            className={`${boxBase} ${boxColor}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center" data-testid="otp-error">{error}</p>
      )}

      {loading && (
        <div className="flex justify-center py-1">
          <Loader2 className="w-5 h-5 animate-spin text-brand-green" />
        </div>
      )}

      <div className="text-center">
        {resendIn > 0 ? (
          <p className="text-xs text-brand-muted" data-testid="otp-countdown">
            Resend code in {resendIn}s
          </p>
        ) : (
          <button
            type="button"
            onClick={sendOtp}
            className="text-xs font-medium text-brand-green hover:underline"
            data-testid="otp-resend-btn"
          >
            Resend code
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-ink transition-colors"
        data-testid="otp-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Edit details
      </button>
    </div>
  );
}
