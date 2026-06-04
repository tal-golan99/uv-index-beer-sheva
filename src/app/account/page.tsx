"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Wordmark from "@/components/Wordmark";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl bg-white px-4 py-3 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-200)] outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-pool-400)]";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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

function MoreUVWaitlistToggle({ supabase }: { supabase: SupabaseClient }) {
  const [interest, setInterest] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("more_uv_interest").eq("id", user.id).maybeSingle();
      setInterest(data?.more_uv_interest ?? false);
    });
  }, [supabase]);

  async function toggle() {
    if (!userId || interest === null) return;
    const newVal = !interest;
    setInterest(newVal);
    await supabase.from("profiles").update({ more_uv_interest: newVal }).eq("id", userId);
  }

  if (interest === null) return null;

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[color:var(--color-ink)]">More UV ✨</h2>
          <p className="mt-0.5 text-xs text-[color:var(--color-ink-3)]">
            {interest ? "נרשמת לרשימת ההמתנה" : "עניין אותי — אעדכן אותך כשיצא"}
          </p>
        </div>
        <Toggle checked={interest} onChange={toggle} />
      </div>
    </div>
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
  const [phoneNotif, setPhoneNotif] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Telegram state
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [showTelegramSetup, setShowTelegramSetup] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/register"); return; }
      const meta = user.user_metadata ?? {};
      setGoogleAvatar(meta.avatar_url ?? meta.picture ?? null);
    });

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setDisplayName(data.display_name ?? "");
        setPhoneNotif(data.phone_notifications);
        setTelegramConnected(!!data.telegram_chat_id);
        setLoading(false);
      })
      .catch(() => setLoading(false));

  }, [supabase, router]);

  // Start Telegram setup when user clicks Connect
  async function startTelegramSetup() {
    setShowTelegramSetup(true);
    const res = await fetch("/api/telegram/start-token", { method: "POST" });
    const { token, botUsername } = await res.json();
    if (token && botUsername) {
      setTelegramLink(`https://t.me/${botUsername}?start=${token}`);
    }

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const r = await fetch("/api/telegram/status");
      const { connected } = await r.json();
      if (connected) {
        setTelegramConnected(true);
        setShowTelegramSetup(false);
        clearInterval(pollRef.current!);
      }
    }, 2000);
  }

  async function disconnectTelegram() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_chat_id: null, phone_notifications: false }),
    });
    setTelegramConnected(false);
    setPhoneNotif(false);
    setTelegramLink(null);
    setShowTelegramSetup(false);
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

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
          if (uploadError) {
            throw new Error(`שגיאה בהעלאת התמונה: ${uploadError.message}`);
          }
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = data.publicUrl;
        }
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName || null,
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

      // If avatar changed, re-upsert pool_presence so the new photo shows in the pool immediately.
      if (avatarFile) {
        fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "in" }),
        }).catch(() => {});
      }
    } catch {
      setError("שגיאה בשמירה. נסה שוב מאוחר יותר.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    // Remove the user from the pool first — after signOut the request would be
    // unauthorized. Best-effort: never block logout on this.
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "out" }),
    }).catch(() => {});
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

  const currentAvatar = avatarPreview ?? profile?.avatar_url ?? googleAvatar;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-sm space-y-6">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[color:var(--color-ink-2)] transition-colors hover:text-[color:var(--color-pool-600)]"
        >
          חזרה <ArrowRight size={18} aria-hidden />
        </Link>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[color:var(--color-ink)]">החשבון שלי</h1>
          <Wordmark size="sm" />
        </div>

        <form onSubmit={save} method="post" className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm">
            <button
              type="button"
              aria-label="שנה תמונת פרופיל"
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
            <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-bold text-[color:var(--color-pool-600)] underline underline-offset-2"
            >
              {avatarPreview ? "החלף תמונה" : "שנה תמונה"}
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm">
            <div className="space-y-1.5">
              <label htmlFor="displayName" className="block text-sm font-semibold text-[color:var(--color-ink-2)]">שם תצוגה</label>
              <input
                id="displayName"
                type="text"
                placeholder="איך לקרוא לך?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className={inputClass}
              />
            </div>
          </div>

          {/* Telegram */}
          <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[color:var(--color-ink)]">טלגרם</h2>
              {telegramConnected && (
                <button
                  type="button"
                  onClick={disconnectTelegram}
                  className="text-xs font-semibold text-red-500 underline underline-offset-2"
                >
                  נתק
                </button>
              )}
            </div>

            {telegramConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-green-200">
                  <CheckCircle weight="fill" size={20} className="text-green-600" aria-hidden />
                  <p className="text-sm font-semibold text-green-800">מחובר לטלגרם</p>
                </div>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[color:var(--color-ink-2)]">התראות UV בטלגרם</span>
                  <Toggle checked={phoneNotif} onChange={setPhoneNotif} />
                </label>
              </div>
            ) : showTelegramSetup ? (
              <div className="space-y-3">
                <p className="text-sm text-[color:var(--color-ink-2)]">לחץ על הכפתור ואז Start בטלגרם</p>
                {telegramLink ? (
                  <a
                    href={telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
                    style={{ background: "linear-gradient(90deg, #229ED9, #1A7BBF)" }}
                  >
                    <TelegramIcon />
                    פתח בטלגרם
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold text-white opacity-50"
                    style={{ background: "linear-gradient(90deg, #229ED9, #1A7BBF)" }}
                  >
                    <TelegramIcon />
                    מכין לינק...
                  </button>
                )}
                <p aria-live="polite" className="text-center text-xs text-[color:var(--color-ink-3)]">ממתין לחיבור...</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={startTelegramSetup}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-95"
                style={{ background: "linear-gradient(90deg, #229ED9, #1A7BBF)" }}
              >
                <TelegramIcon />
                חבר טלגרם
              </button>
            )}
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

        {/* Groups section — now a dedicated page */}
        <Link
          href="/groups"
          className="flex items-center justify-between rounded-3xl bg-white px-6 py-4 ring-1 ring-[color:var(--color-pool-100)] shadow-pool-sm hover:bg-[color:var(--color-pool-50)] transition-colors"
        >
          <h2 className="text-base font-extrabold text-[color:var(--color-ink)]">🏊 הקבוצות שלי</h2>
          <span className="text-[color:var(--color-ink-3)] text-sm">←</span>
        </Link>

        <button
          type="button"
          onClick={signOut}
          className="w-full rounded-2xl py-3 text-sm font-bold text-[color:var(--color-ink-3)] ring-1 ring-[color:var(--color-pool-100)] transition-colors hover:bg-red-50 hover:text-red-600 hover:ring-red-200"
        >
          התנתק
        </button>
      </div>
    </main>
  );
}
