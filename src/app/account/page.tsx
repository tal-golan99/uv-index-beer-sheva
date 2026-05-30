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
