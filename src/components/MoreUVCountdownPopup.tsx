"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const COUPON = "MOR10";

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MoreUVCountdownPopup() {
  const [visible, setVisible] = useState(false);
  const [remaining, setRemaining] = useState(SIX_HOURS_MS);
  const [copied, setCopied] = useState(false);
  const startRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Show after 2s delay, countdown resets every page load
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Tick the countdown
  useEffect(() => {
    if (!visible) return;
    startRef.current = Date.now();
    setRemaining(SIX_HOURS_MS);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = SIX_HOURS_MS - elapsed;
      if (left <= 0) {
        setRemaining(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setRemaining(left);
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [visible]);

  function copyCode() {
    navigator.clipboard.writeText(COUPON).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={() => setVisible(false)}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white overflow-hidden anim-pop"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Gradient header */}
        <div
          className="relative px-5 pt-7 pb-5 text-center text-white"
          style={{ background: "linear-gradient(135deg, var(--color-pool-700) 0%, var(--color-pool-500) 60%, #f7bd24 100%)" }}
        >
          <button
            onClick={() => setVisible(false)}
            aria-label="סגור"
            className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors text-lg leading-none"
          >
            ×
          </button>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
            🔥 מבצע חד פעמי
          </div>
          <h2 className="text-2xl font-extrabold leading-snug">
            10% הנחה<br />על Premium
          </h2>
          <p className="mt-1 text-sm text-white/80">המחיר עולה בעוד:</p>
        </div>

        {/* Countdown */}
        <div
          className="px-5 py-4 text-center"
          style={{ background: "linear-gradient(180deg, var(--color-pool-50) 0%, white 100%)" }}
        >
          <div
            className="inline-flex items-center gap-1 rounded-2xl px-5 py-3 font-mono text-3xl font-extrabold tracking-widest"
            style={{
              background: "linear-gradient(135deg, var(--color-pool-700), var(--color-pool-500))",
              color: "white",
              boxShadow: "0 4px 20px -4px rgba(14,147,212,0.5)",
            }}
          >
            {formatCountdown(remaining)}
          </div>
          <p className="mt-2 text-xs font-semibold text-[color:var(--color-ink-3)]">שעות : דקות : שניות</p>
        </div>

        {/* Coupon + CTA */}
        <div className="px-5 pb-6 space-y-3">
          <div className="rounded-2xl bg-[color:var(--color-pool-50)] p-4 text-center ring-1 ring-[color:var(--color-pool-200)]">
            <p className="text-xs font-semibold text-[color:var(--color-ink-3)] mb-1">קוד קופון</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-extrabold tracking-widest text-[color:var(--color-pool-700)]">
                {COUPON}
              </span>
              <button
                onClick={copyCode}
                className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-[color:var(--color-pool-600)] ring-1 ring-[color:var(--color-pool-200)] hover:ring-[color:var(--color-pool-400)] transition-all"
              >
                {copied ? "✓ הועתק!" : "העתק"}
              </button>
            </div>
          </div>

          <Link
            href="/more"
            onClick={() => setVisible(false)}
            className="block w-full rounded-2xl py-3.5 text-center text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), #f7bd24)" }}
          >
            לצפות בתוכניות ✨
          </Link>

          <button
            onClick={() => setVisible(false)}
            className="w-full text-center text-sm font-semibold text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-2)] transition-colors"
          >
            אולי בפעם אחרת
          </button>
        </div>
      </div>
    </div>
  );
}
