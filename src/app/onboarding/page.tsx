"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Step = "phone" | "whatsapp" | "photo" | "saving";

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-pool-400)]";

const CALLMEBOT_LINK =
  "https://wa.me/34644520722?text=I%20allow%20callmebot%20to%20send%20me%20messages";

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
  const [callmebotKey, setCallmebotKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
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

  function advanceFromPhone() {
    if (phone) {
      setStep("whatsapp");
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
          callmebot_apikey: callmebotKey || null,
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
            <p className="text-xs text-[color:var(--color-ink-3)]">
              גם בלי מספר תקבל התראות למייל Google שלך
            </p>
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

      {step === "whatsapp" && (
        <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-7 shadow-2xl ring-1 ring-[color:var(--color-pool-100)]">
          <ProgressDots current={1} />

          <div className="text-center">
            <div className="mx-auto mb-3 text-4xl">💬</div>
            <h2 className="text-xl font-black text-[color:var(--color-ink)]">
              הפעל התראות WhatsApp
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
              שלח הודעה אחת ותקבל קוד — תהליך של 30 שניות
            </p>
          </div>

          {/* Step 1: send activation message */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-[color:var(--color-pool-50)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-pool-500)] text-xs font-black text-white">1</span>
              <p className="text-sm text-[color:var(--color-ink-2)]">
                לחץ כדי לשלוח הודעת הפעלה ל-CallMeBot ב-WhatsApp
              </p>
            </div>

            <a
              href={CALLMEBOT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(() => setShowKeyInput(true), 1500)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, #25D366, #128C7E)" }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              פתח WhatsApp ושלח הודעה
            </a>
          </div>

          {/* Step 2: paste code — revealed after tapping the button */}
          <div
            className="space-y-3 overflow-hidden transition-all duration-500"
            style={{ maxHeight: showKeyInput ? "200px" : "0px", opacity: showKeyInput ? 1 : 0 }}
          >
            <div className="flex items-start gap-3 rounded-2xl bg-[color:var(--color-pool-50)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-pool-500)] text-xs font-black text-white">2</span>
              <p className="text-sm text-[color:var(--color-ink-2)]">
                קיבלת קוד ב-WhatsApp? הדבק אותו כאן
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="הדבק את הקוד שקיבלת"
              value={callmebotKey}
              onChange={(e) => setCallmebotKey(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </div>

          {!showKeyInput && (
            <button
              onClick={() => setShowKeyInput(true)}
              className="w-full text-center text-sm font-semibold text-[color:var(--color-pool-600)] underline underline-offset-2"
            >
              כבר קיבלתי קוד →
            </button>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStep("photo")}
              className="w-full rounded-2xl py-3.5 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
            >
              {callmebotKey ? "המשך →" : "המשך →"}
            </button>
            <button
              onClick={() => { setCallmebotKey(""); setStep("photo"); }}
              className="text-sm font-semibold text-[color:var(--color-ink-3)] transition-colors hover:text-[color:var(--color-ink-2)]"
            >
              אגדיר את זה אחר כך
            </button>
          </div>
        </div>
      )}

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
