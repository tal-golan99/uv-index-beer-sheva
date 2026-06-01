"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SESSION_KEY = "shake-hanan-seen";

export default function ShakeHananPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    function onScroll() {
      const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled >= 0.3) {
        setVisible(true);
        sessionStorage.setItem(SESSION_KEY, "1");
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={() => setVisible(false)}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden anim-pop"
        style={{ boxShadow: "0 24px 72px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative h-48 w-full">
          <Image
            src="/pool/life4.jpg"
            alt="שיזוף בבריכה"
            fill
            className="object-cover"
            sizes="400px"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }}
          />
          {/* Badge */}
          <div className="absolute top-4 right-4">
            <span
              className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white"
              style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}
            >
              🔥 רק השבוע
            </span>
          </div>
          {/* Close */}
          <button
            onClick={() => setVisible(false)}
            aria-label="סגור"
            className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors text-lg leading-none"
          >
            ×
          </button>
          {/* Headline over image */}
          <div className="absolute bottom-4 right-4 left-4 text-right">
            <p className="text-2xl font-extrabold text-white leading-snug drop-shadow-lg">
              שייק חינם 🥤
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-5 py-5 space-y-4" dir="rtl">
          <p className="text-base font-bold text-[color:var(--color-ink)] leading-snug">
            למלך הבריכה של השבוע — בטעמים קייצים.
          </p>
          <p className="text-sm text-[color:var(--color-ink-2)]">
            הגיע הזמן לצאת מהבית, להשתזף קצת ולזכות בשייק על הבית. הבריכה מחכה.
          </p>
          <button
            onClick={() => setVisible(false)}
            className="w-full rounded-2xl py-3.5 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            יאללה לבריכה 🏊
          </button>
          <button
            onClick={() => setVisible(false)}
            className="w-full text-center text-sm font-semibold text-[color:var(--color-ink-3)] hover:text-[color:var(--color-ink-2)] transition-colors"
          >
            אולי אחר כך
          </button>
        </div>
      </div>
    </div>
  );
}
