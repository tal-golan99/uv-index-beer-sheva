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
      if (scrolled >= 0.8) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={() => setVisible(false)}
    >
      <div
        className="relative w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-pool-lg anim-pop"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          aria-label="סגור"
          className="absolute top-3 left-3 text-xl leading-none text-slate-400 hover:text-slate-600 transition-colors"
        >
          ×
        </button>

        {/* Promo badge */}
        <div
          className="mx-auto mb-3 inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white"
          style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}
        >
          רק השבוע
        </div>

        {/* Pool lifestyle image */}
        <div className="my-4 overflow-hidden rounded-2xl relative aspect-[4/3]">
          <Image
            src="/pool/life4.jpg"
            alt="שיזוף בבריכה"
            fill
            className="object-cover"
            sizes="320px"
          />
          {/* Shake overlay badge */}
          <div className="absolute bottom-2 right-2 text-4xl select-none">🥤</div>
        </div>

        {/* Body */}
        <p className="text-sm font-extrabold leading-snug text-[color:var(--color-ink)]">
          שייק חינם בטעמים קייצים
        </p>
        <p className="mt-1.5 text-sm font-extrabold text-[color:var(--color-ink-2)]">
          למלך הבריכה של השבוע.
          <br />
          אז יאללה ללכת להשתזף
        </p>

        <button
          onClick={() => setVisible(false)}
          className="mt-5 w-full rounded-2xl py-3 text-sm font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
          style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
        >
          יאללה לבריכה
        </button>
      </div>
    </div>
  );
}
