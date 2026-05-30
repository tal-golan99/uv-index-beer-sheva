"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Step = "phone" | "telegram" | "photo" | "saving";

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-pool-400)]";

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`rounded-full transition-all ${
            i === current
              ? "h-2 w-6 bg-[color:var(--color-pool-500)]"
              : "h-2 w-2 bg-[color:var(--color-pool-200)]"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/register");
        return;
      }
      const meta = user.user_metadata ?? {};
      setDisplayName(meta.full_name ?? meta.name ?? null);
      setGoogleAvatar(meta.avatar_url ?? meta.picture ?? null);
    });
  }, [supabase, router]);

  // Generate Telegram link when entering telegram step
  useEffect(() => {
    if (step !== "telegram") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    fetch("/api/telegram/start-token", { method: "POST" })
      .then((r) => r.json())
      .then(({ token, botUsername }) => {
        if (token && botUsername) {
          setTelegramLink(`https://t.me/${botUsername}?start=${token}`);
        }
      });

    // Poll every 2s for connection
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/telegram/status");
      const { connected } = await res.json();
      if (connected) {
        setTelegramConnected(true);
        clearInterval(pollRef.current!);
        setTimeout(() => setStep("photo"), 1200);
      }
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function advanceFromPhone() {
    if (phone) {
      setStep("telegram");
    } else {
      setStep("photo");
    }
  }

  async function finish(skipPhoto = false) {
    setStep("saving");
    setError("");
    try {
      let avatarUrl: string | null = googleAvatar;

      if (!skipPhoto && avatarFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ext = avatarFile.name.split(".").pop();
          const path = `${user.id}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, avatarFile, { upsert: true });
          if (!uploadError) {
            const { data } = supabase.storage.from("avatars").getPublicUrl(path);
            avatarUrl = data.publicUrl;
          }
        }
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone || null,
          phone_notifications: !!phone,
          avatar_url: avatarUrl,
          onboarding_completed: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "שגיאה בשמירה");
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
      setStep("photo");
    }
  }

  if (step === "saving") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="grid place-items-center gap-3 rounded-3xl bg-white p-10 shadow-2xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--color-pool-200)] border-t-[color:var(--color-pool-500)]" />
          <p className="text-sm font-semibold text-[color:var(--color-ink-2)]">שומר...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

      {/* Step 1 — Phone */}
      {step === "phone" && (
        <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-[color:var(--color-pool-100)]">
          <ProgressDots current={0} />

          <div className="text-center">
            <div className="mx-auto mb-3 text-4xl">📱</div>
            <h2 className="text-xl font-black text-[color:var(--color-ink)]">
              רוצה לקבל התראות לנייד?
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
              כשמדד ה-UV מגיע ל-9 ומעלה נשלח לך התראה — שעה לפני ובשיא
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[color:var(--color-ink-2)]">
              מספר טלפון
            </label>
            <input
              type="tel"
              placeholder="+972501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={advanceFromPhone}
              className="w-full rounded-2xl py-3.5 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              המשך →
            </button>
            <button
              onClick={advanceFromPhone}
              className="text-sm font-semibold text-[color:var(--color-ink-3)] transition-colors hover:text-[color:var(--color-ink-2)]"
            >
              דלג
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Telegram */}
      {step === "telegram" && (
        <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-[color:var(--color-pool-100)]">
          <ProgressDots current={1} />

          {telegramConnected ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-5xl">✅</div>
              <p className="text-center text-lg font-black text-[color:var(--color-ink)]">
                מחובר לטלגרם!
              </p>
              <p className="text-center text-sm text-[color:var(--color-ink-2)]">עובר לשלב הבא...</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="mx-auto mb-3 text-4xl">✈️</div>
                <h2 className="text-xl font-black text-[color:var(--color-ink)]">
                  חבר את טלגרם
                </h2>
                <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
                  לחץ על הכפתור, פתח את הבוט בטלגרם ולחץ Start — זה הכל
                </p>
              </div>

              <a
                href={telegramLink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95 ${!telegramLink ? "opacity-50 pointer-events-none" : ""}`}
                style={{ background: "linear-gradient(90deg, #229ED9, #1A7BBF)" }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                {telegramLink ? "פתח בטלגרם" : "מכין לינק..."}
              </a>

              <p className="text-center text-xs text-[color:var(--color-ink-3)]">
                ממתין לחיבור... האפליקציה תתקדם אוטומטית
              </p>

              <button
                onClick={() => setStep("photo")}
                className="w-full text-sm font-semibold text-[color:var(--color-ink-3)] transition-colors hover:text-[color:var(--color-ink-2)]"
              >
                אגדיר אחר כך
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3 — Photo */}
      {step === "photo" && (
        <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-[color:var(--color-pool-100)]">
          <ProgressDots current={2} />

          <div className="text-center">
            <div className="mx-auto mb-3 text-4xl">📸</div>
            <h2 className="text-xl font-black text-[color:var(--color-ink)]">
              תמונת פרופיל
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
              {displayName ? `היי ${displayName}! ` : ""}תרצה להוסיף תמונה לפרופיל שלך?
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-[color:var(--color-pool-200)] ring-offset-2 transition-transform hover:scale-105 active:scale-95"
            >
              {avatarPreview || googleAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview ?? googleAvatar!}
                  alt="תמונת פרופיל"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[color:var(--color-pool-100)] text-3xl">
                  🏊
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20">
                <span className="text-2xl opacity-0 transition-opacity hover:opacity-100">📷</span>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-bold text-[color:var(--color-pool-600)] underline underline-offset-2"
            >
              {avatarPreview ? "החלף תמונה" : "העלה תמונה"}
            </button>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => finish(false)}
              className="w-full rounded-2xl py-3.5 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              סיום 🎉
            </button>
            <button
              onClick={() => finish(true)}
              className="text-sm font-semibold text-[color:var(--color-ink-3)] transition-colors hover:text-[color:var(--color-ink-2)]"
            >
              המשך בלי תמונה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
