"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { Profile } from "@/types";

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-pool-400)]";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full transition-all"
      style={{ background: checked ? "var(--color-pool-500)" : "#cbd5e1" }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all"
        style={{ insetInlineStart: checked ? "24px" : "4px" }}
      />
    </button>
  );
}

export default function AccountPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [callmebotKey, setCallmebotKey] = useState("");
  const [showCallmebotSetup, setShowCallmebotSetup] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [phoneNotif, setPhoneNotif] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/register");
        return;
      }
    });

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setDisplayName(data.display_name ?? "");
        setPhone(data.phone ?? "");
        setCallmebotKey(data.callmebot_apikey ?? "");
        setEmailNotif(data.email_notifications);
        setPhoneNotif(data.phone_notifications);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [supabase, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      let avatarUrl = profile?.avatar_url ?? null;

      if (avatarFile) {
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
          display_name: displayName || null,
          phone: phone || null,
          callmebot_apikey: callmebotKey || null,
          email_notifications: emailNotif,
          phone_notifications: phoneNotif,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "שגיאה בשמירה");
      }

      const updated: Profile = await res.json();
      setProfile(updated);
      setAvatarFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--color-pool-200)] border-t-[color:var(--color-pool-500)]" />
      </main>
    );
  }

  const currentAvatar = avatarPreview ?? profile?.avatar_url;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-sm space-y-6">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-pool-600)]"
        >
          <span>←</span> חזרה
        </Link>

        <h1 className="text-2xl font-black text-[color:var(--color-ink)]">החשבון שלי</h1>

        <form onSubmit={save} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-[color:var(--color-pool-200)] ring-offset-2 transition-transform hover:scale-105 active:scale-95"
            >
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatar} alt="פרופיל" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[color:var(--color-pool-100)] text-3xl">🏊</div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-bold text-[color:var(--color-pool-600)] underline underline-offset-2"
            >
              {avatarPreview ? "החלף תמונה" : "שנה תמונה"}
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[color:var(--color-ink-2)]">שם תצוגה</label>
              <input
                type="text"
                placeholder="איך לקרוא לך?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[color:var(--color-ink-2)]">מספר טלפון</label>
              <input
                type="tel"
                placeholder="+972501234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                dir="ltr"
              />
            </div>
          </div>

          {/* WhatsApp / CallMeBot */}
          <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[color:var(--color-ink)]">התראות WhatsApp</h2>
              {callmebotKey && !showCallmebotSetup && (
                <button
                  type="button"
                  onClick={() => setShowCallmebotSetup(true)}
                  className="text-xs font-semibold text-[color:var(--color-pool-600)] underline underline-offset-2"
                >
                  שנה
                </button>
              )}
            </div>

            {callmebotKey && !showCallmebotSetup ? (
              <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-green-200">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-sm font-semibold text-green-800">מחובר</p>
                  <p className="text-xs text-green-600 font-mono">{"•".repeat(6)}{callmebotKey.slice(-2)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[color:var(--color-ink-2)]">
                  שלח הודעה אחת לקבלת קוד — תהליך של 30 שניות
                </p>
                <a
                  href="https://wa.me/34644520722?text=I%20allow%20callmebot%20to%20send%20me%20messages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
                  style={{ background: "linear-gradient(90deg, #25D366, #128C7E)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  שלח הודעת הפעלה
                </a>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="הדבק את הקוד שקיבלת מ-CallMeBot"
                  value={callmebotKey}
                  onChange={(e) => setCallmebotKey(e.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-sm">
            <h2 className="text-sm font-extrabold text-[color:var(--color-ink)]">התראות</h2>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-[color:var(--color-ink-2)]">התראות מייל</span>
              <Toggle checked={emailNotif} onChange={setEmailNotif} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-[color:var(--color-ink-2)]">התראות טלפון</span>
              <Toggle checked={phoneNotif} onChange={setPhoneNotif} />
            </label>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{error}</p>
          )}
          {success && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
              נשמר בהצלחה ✓
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl py-4 text-base font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            {saving ? "שומר..." : "שמור שינויים"}
          </button>
        </form>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full rounded-2xl py-3 text-sm font-bold text-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-100)] transition-colors hover:bg-red-50 hover:text-red-600 hover:ring-red-200"
        >
          התנתק
        </button>
      </div>
    </main>
  );
}
