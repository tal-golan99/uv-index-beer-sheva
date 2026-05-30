"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Step = "form" | "whatsapp-guide" | "success";

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-pool-400)]";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.8 36.2 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function RegisterPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ email: "", whatsapp: "", callmebot_apikey: "" });
  const [wantsWA, setWantsWA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setError("");
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("ההתחברות ל-Google נכשלה. נסה שוב.");
      setGoogleLoading(false);
    }
    // On success the browser redirects to Google, so no further handling needed.
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email || null,
          whatsapp: wantsWA ? form.whatsapp : null,
          callmebot_apikey: wantsWA ? form.callmebot_apikey : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "שגיאה");
      }
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהרשמה");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-[color:var(--color-pool-100)]">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-extrabold text-[color:var(--color-ink)]">נרשמת בהצלחה!</h1>
          <p className="text-sm text-[color:var(--color-ink-2)]">
            תקבל התראה כשה-UV יגיע ל-9 ומעלה בבאר שבע — שעה לפני ובזמן השיא.
          </p>
          <Link
            href="/"
            className="mt-2 inline-block rounded-xl px-6 py-3 text-sm font-extrabold text-white transition-transform hover:scale-105"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            חזרה לדף הראשי
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Back */}
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-pool-600)]"
        >
          <span>←</span> חזרה
        </Link>

        {/* Card */}
        <div className="space-y-6 rounded-3xl bg-white p-7 shadow-xl ring-1 ring-[color:var(--color-pool-100)]">
          <div className="text-center">
            <div className="mx-auto mb-2 text-4xl">🏊</div>
            <h1 className="text-2xl font-black text-[color:var(--color-ink)]">התחברות / הרשמה</h1>
            <p className="mt-1 text-sm text-[color:var(--color-ink-2)]">
              התחבר עם Google כדי לראות מי בבריכה ולהצטרף ל-Pool Buddies
            </p>
          </div>

          {/* Google sign-in — primary */}
          <button
            onClick={signInWithGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-extrabold text-[color:var(--color-ink)] ring-1 ring-[color:var(--color-pool-200)] shadow-sm transition-all hover:bg-[color:var(--color-pool-50)] hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <GoogleIcon />
            {googleLoading ? "מעביר ל-Google..." : "התחבר עם Google"}
          </button>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
              {error}
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[color:var(--color-pool-100)]" />
            <span className="text-xs font-semibold text-[color:var(--color-ink-3)]">
              או קבל התראות בלבד
            </span>
            <span className="h-px flex-1 bg-[color:var(--color-pool-100)]" />
          </div>

          {/* Alert-only form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[color:var(--color-ink-2)]">אימייל</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* WhatsApp toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <button
                type="button"
                onClick={() => setWantsWA((v) => !v)}
                className="relative h-6 w-11 rounded-full transition-all"
                style={{ background: wantsWA ? "var(--color-pool-500)" : "#cbd5e1" }}
                aria-pressed={wantsWA}
              >
                <span
                  className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
                  style={{ insetInlineStart: wantsWA ? "24px" : "4px" }}
                />
              </button>
              <span className="text-sm font-semibold text-[color:var(--color-ink-2)]">גם ב-WhatsApp</span>
            </label>

            {wantsWA && (
              <div className="space-y-3 rounded-2xl bg-[color:var(--color-pool-50)] p-4 ring-1 ring-[color:var(--color-pool-100)]">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[color:var(--color-ink-2)]">מספר WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+972501234567"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[color:var(--color-ink-2)]">CallMeBot API Key</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={form.callmebot_apikey}
                    onChange={(e) => setForm((f) => ({ ...f, callmebot_apikey: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep("whatsapp-guide")}
                  className="text-xs font-bold text-[color:var(--color-pool-600)] underline"
                >
                  איך מקבלים API Key? ←
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!form.email && !wantsWA)}
              className="w-full rounded-2xl py-4 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              {loading ? "נרשם..." : "הרשם להתראות ⚡"}
            </button>
          </form>
        </div>
      </div>

      {/* WhatsApp guide modal */}
      {step === "whatsapp-guide" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-[color:var(--color-pool-100)]">
            <h2 className="text-lg font-black text-[color:var(--color-ink)]">קבלת CallMeBot API Key</h2>
            <ol className="space-y-3 text-sm text-[color:var(--color-ink-2)]">
              {[
                <>שמור <strong className="text-[color:var(--color-ink)]">+34 644 23 03 41</strong> באנשי קשר</>,
                <>שלח ב-WhatsApp: <code className="rounded-lg bg-[color:var(--color-pool-50)] px-2 py-0.5 text-xs ring-1 ring-[color:var(--color-pool-100)]">I allow callmebot to send me messages</code></>,
                <>תקבל תשובה עם ה-API key האישי שלך</>,
                <>הדבק את ה-key בשדה למעלה</>,
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-[color:var(--color-pool-100)] text-xs font-bold text-[color:var(--color-pool-600)]">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setStep("form")}
              className="w-full rounded-xl bg-[color:var(--color-pool-50)] py-3 text-sm font-bold text-[color:var(--color-ink-2)] ring-1 ring-[color:var(--color-pool-100)] transition-colors hover:bg-[color:var(--color-pool-100)]"
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
