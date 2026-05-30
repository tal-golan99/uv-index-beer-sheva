"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Step = "phone" | "photo" | "saving";

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-pool-400)]";

export default function OnboardingPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
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
      {step === "phone" && (
        <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-[color:var(--color-pool-100)]">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            <span className="h-2 w-6 rounded-full bg-[color:var(--color-pool-500)]" />
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-pool-200)]" />
          </div>

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
            <p className="text-xs text-[color:var(--color-ink-3)]">
              גם בלי מספר תקבל התראות למייל Google שלך
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStep("photo")}
              className="w-full rounded-2xl py-3.5 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              {phone ? "המשך →" : "המשך →"}
            </button>
            <button
              onClick={() => setStep("photo")}
              className="text-sm font-semibold text-[color:var(--color-ink-3)] transition-colors hover:text-[color:var(--color-ink-2)]"
            >
              דלג
            </button>
          </div>
        </div>
      )}

      {step === "photo" && (
        <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-[color:var(--color-pool-100)]">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-pool-200)]" />
            <span className="h-2 w-6 rounded-full bg-[color:var(--color-pool-500)]" />
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 text-4xl">📸</div>
            <h2 className="text-xl font-black text-[color:var(--color-ink)]">
              תמונת פרופיל
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
              {displayName ? `היי ${displayName}! ` : ""}תרצה להוסיף תמונה לפרופיל שלך?
            </p>
          </div>

          {/* Avatar preview */}
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
