"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "form" | "whatsapp-guide" | "success";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({
    email: "",
    whatsapp: "",
    callmebot_apikey: "",
  });
  const [wantsWA, setWantsWA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      email: form.email || null,
      whatsapp: wantsWA ? form.whatsapp : null,
      callmebot_apikey: wantsWA ? form.callmebot_apikey : null,
    };

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h1 className="text-2xl font-bold">נרשמת בהצלחה!</h1>
          <p className="text-gray-400">תקבל התראה כשה-UV יגיע ל-9 ומעלה בבאר שבע.</p>
          <Link href="/" className="inline-block mt-4 text-orange-400 hover:text-orange-300">
            ← חזרה לדף הראשי
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">
            ← חזרה
          </Link>
          <h1 className="text-2xl font-bold mt-3">הרשמה להתראות UV</h1>
          <p className="text-gray-400 mt-1 text-sm">
            קבל התראה כשה-UV בבאר שבע צפוי לחצות 9
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              אימייל
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsWA}
                onChange={(e) => setWantsWA(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-300">
                גם התראה בוואטסאפ
              </span>
            </label>
          </div>

          {wantsWA && (
            <div className="space-y-4 border border-gray-700 rounded-xl p-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  מספר וואטסאפ (עם קידומת +972)
                </label>
                <input
                  type="tel"
                  placeholder="+972501234567"
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  CallMeBot API Key
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={form.callmebot_apikey}
                  onChange={(e) => setForm((f) => ({ ...f, callmebot_apikey: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setStep("whatsapp-guide")}
                className="text-xs text-orange-400 hover:text-orange-300 underline"
              >
                איך מקבלים API Key?
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-900 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || (!form.email && !wantsWA)}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "נרשם..." : "הרשם להתראות"}
          </button>
        </form>
      </div>

      {step === "whatsapp-guide" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">קבלת CallMeBot API Key</h2>
            <ol className="space-y-3 text-sm text-gray-300 list-decimal list-inside">
              <li>שמור את הנייד <strong className="text-white">+34 644 23 03 41</strong> באנשי קשר</li>
              <li>שלח אליו בוואטסאפ: <code className="bg-gray-800 px-2 py-0.5 rounded">I allow callmebot to send me messages</code></li>
              <li>תקבל תשובה עם ה-API key שלך</li>
              <li>הדבק את ה-key בשדה למעלה</li>
            </ol>
            <button
              onClick={() => setStep("form")}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
