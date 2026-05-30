"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { POOL_IMAGE } from "@/lib/photos";
import type { PoolPresenceEntry } from "@/types";
import type { User } from "@supabase/supabase-js";

// Deterministic position from user_id so each swimmer always lands in the same spot
function positionFor(userId: string): { top: number; left: number } {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  const h2 = Math.abs(h);
  return { top: 15 + (h2 % 60), left: 10 + ((h2 * 7) % 76) };
}

const AVATAR_COLORS = [
  "#f472b6", "#38bdf8", "#fb923c", "#34d399", "#a78bfa", "#facc15", "#f87171",
];
function colorFor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function SwimmerPin({
  entry,
  delay,
  isMe,
}: {
  entry: PoolPresenceEntry;
  delay: number;
  isMe: boolean;
}) {
  const { top, left } = isMe ? { top: 46, left: 46 } : positionFor(entry.user_id);
  return (
    <div
      className="absolute flex flex-col items-center gap-1"
      style={{ top: `${top}%`, left: `${left}%`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className="anim-bob overflow-hidden rounded-full shadow-lg ring-2 ring-white/90"
        style={{
          width: "clamp(42px, 8vw, 60px)",
          height: "clamp(42px, 8vw, 60px)",
          background: entry.avatar_url ? undefined : colorFor(entry.user_id),
          animationDelay: `${delay}s`,
        }}
        title={entry.display_name}
      >
        {entry.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.avatar_url}
            alt={entry.display_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-white text-lg font-black">
            {entry.display_name[0]}
          </div>
        )}
      </div>
      <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] sm:text-sm">
        {isMe ? "אתה 😎" : entry.display_name}
      </span>
    </div>
  );
}

export default function PoolPresence() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [swimmers, setSwimmers] = useState<PoolPresenceEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [inPool, setInPool] = useState(false);
  const [checking, setChecking] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial data and subscribe to realtime
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Initial fetch
    supabase
      .from("pool_presence")
      .select("*")
      .order("checked_in_at")
      .then(({ data }) => {
        if (data) setSwimmers(data as PoolPresenceEntry[]);
      });

    // Realtime subscription
    const channel = supabase
      .channel("pool_presence_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pool_presence" },
        () => {
          // Re-fetch on any change
          supabase
            .from("pool_presence")
            .select("*")
            .order("checked_in_at")
            .then(({ data }) => {
              if (data) setSwimmers(data as PoolPresenceEntry[]);
            });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  // Sync inPool state with swimmers list
  useEffect(() => {
    if (user) {
      setInPool(swimmers.some((s) => s.user_id === user.id));
    }
  }, [swimmers, user]);

  async function toggleCheckin() {
    if (!user) return;
    setChecking(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: inPool ? "out" : "in" }),
      });
      if (res.ok) {
        const { data } = await supabase
          .from("pool_presence")
          .select("*")
          .order("checked_in_at");
        if (data) setSwimmers(data as PoolPresenceEntry[]);
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-extrabold text-[color:var(--color-ink)] sm:text-xl">
          מי בבריכה עכשיו
        </h2>
        <span className="rounded-full bg-[color:var(--color-pool-100)] px-3 py-1 text-xs font-bold text-[color:var(--color-pool-600)] sm:text-sm">
          {swimmers.length} בפנים 🌊
        </span>
      </div>

      {/* Pool */}
      <div
        className="relative w-full overflow-hidden rounded-3xl ring-1 ring-[color:var(--color-pool-200)]"
        style={{ aspectRatio: "16 / 10", boxShadow: "0 24px 60px -24px rgba(14,165,233,0.7)" }}
      >
        <Image
          src={POOL_IMAGE}
          alt="בריכת אוניברסיטת בן-גוריון"
          fill
          priority
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0ea5e9]/25 via-[#0ea5e9]/10 to-[#0369a1]/35" />

        {swimmers.map((s, i) => (
          <SwimmerPin
            key={s.user_id}
            entry={s}
            delay={i * 0.4}
            isMe={user?.id === s.user_id}
          />
        ))}

        {swimmers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-bold text-[color:var(--color-ink-2)] backdrop-blur-sm">
              אף אחד בבריכה עדיין 😴
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      {user ? (
        inPool ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-5 py-5 text-center ring-1 ring-[color:var(--color-pool-200)] shadow-sm sm:flex-row sm:justify-between sm:text-right">
            <p className="text-lg font-extrabold text-[color:var(--color-pool-700)] sm:text-xl">
              🎉 אתה בבריכה! החברים שלך מקבלים הודעה עכשיו
            </p>
            <button
              onClick={toggleCheckin}
              disabled={checking}
              className="shrink-0 rounded-xl bg-[color:var(--color-pool-100)] px-5 py-2.5 text-base font-bold text-[color:var(--color-ink-2)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {checking ? "..." : "יצאתי"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-5 py-7 text-center ring-1 ring-[color:var(--color-pool-200)] shadow-sm">
            <p className="text-3xl font-black leading-tight text-[color:var(--color-ink)] sm:text-4xl md:text-5xl">
              אל תהיה לוזר,
              <br />
              לך לבריכה 🥲
            </p>
            <button
              onClick={toggleCheckin}
              disabled={checking}
              className="rounded-2xl px-8 py-4 text-lg font-extrabold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(90deg, var(--color-pool-500), var(--color-pool-400))",
                boxShadow: "0 12px 28px -8px rgba(14,165,233,0.75)",
              }}
            >
              {checking ? "..." : "אני בבריכה! 🏊"}
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-5 py-6 text-center ring-1 ring-[color:var(--color-pool-200)] shadow-sm">
          <p className="text-lg font-extrabold text-[color:var(--color-ink)]">
            התחבר כדי לסמן שאתה בבריכה 🏊
          </p>
          <a
            href="/register"
            className="rounded-xl px-6 py-3 text-sm font-extrabold text-white"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            התחבר עם Google
          </a>
        </div>
      )}
    </section>
  );
}
