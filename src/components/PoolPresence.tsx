"use client";

import Image from "next/image";
import { Waves } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { POOL_IMAGE } from "@/lib/photos";
import type { PoolPresenceEntry } from "@/types";
import type { User } from "@supabase/supabase-js";

// A swimmer is auto-removed 4 hours after check-in. The DB cleanup (pg_cron +
// the check-in API) enforces this server-side; this is the client-side mirror so
// the UI never shows a stale swimmer for more than the 60s tick interval below.
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

// Deterministic position from user_id so each swimmer always lands in the same spot.
// Ranges are kept inset (top 16-68%, left 16-84%) so the avatar + name label below
// it always stay inside the rounded, overflow-hidden frame (no clipped pins).
function positionFor(userId: string): { top: number; left: number } {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  const h2 = Math.abs(h);
  return { top: 16 + (h2 % 52), left: 16 + ((h2 * 7) % 68) };
}

const AVATAR_COLORS = [
  "#f472b6", "#38bdf8", "#fb923c", "#34d399", "#a78bfa", "#facc15", "#f87171",
];
function colorFor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/** Water-splash ripple from the tap point. Skipped under reduced motion. */
function addRipple(e: React.PointerEvent<HTMLButtonElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.setProperty("--rx", `${e.clientX - rect.left}px`);
  span.style.setProperty("--ry", `${e.clientY - rect.top}px`);
  btn.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
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
  const ringColor = colorFor(entry.user_id);
  return (
    // Outer holds the centering transform; inner runs the spring entrance so the
    // two transforms never fight (anim-pop would otherwise clobber the centering).
    <div
      className="absolute flex flex-col items-center"
      style={{ top: `${top}%`, left: `${left}%`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className="anim-pop flex flex-col items-center gap-1"
        style={{ animationDelay: `${0.1 + delay}s` }}
      >
        <div
          className="anim-bob overflow-hidden rounded-full"
          style={{
            width: "clamp(42px, 8vw, 60px)",
            height: "clamp(42px, 8vw, 60px)",
            background: entry.avatar_url ? undefined : ringColor,
            animationDelay: `${delay}s`,
            // white ring + a soft halo in the swimmer's own colour (not neon)
            boxShadow: `0 0 0 3px rgba(255,255,255,0.95), 0 6px 16px -4px ${ringColor}`,
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
    </div>
  );
}

export default function PoolPresence({ currentUV = 0 }: { currentUV?: number }) {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [swimmers, setSwimmers] = useState<PoolPresenceEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [inPool, setInPool] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  // Bumped every 60s so stale swimmers (>4h) drop out of the UI even without a
  // DB change to trigger a realtime refetch.
  const [tick, setTick] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial data and subscribe to realtime
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Initial fetch
    supabase
      .from("pool_presence")
      .select("*")
      .order("checked_in_at")
      .then(({ data, error }) => {
        if (error) console.error("[pool_presence] initial fetch error", error.code, error.message);
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
            .then(({ data, error }) => {
              if (error) console.error("[pool_presence] realtime refetch error", error.code, error.message);
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

  // Re-evaluate the 4h staleness filter once a minute.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Only show swimmers checked in within the last 4 hours. The DB cleanup removes
  // them server-side; this guards the window between cleanups.
  const visibleSwimmers = useMemo(
    () =>
      swimmers.filter(
        (s) => Date.now() - new Date(s.checked_in_at).getTime() < FOUR_HOURS_MS
      ),
    // `tick` (every 60s) re-evaluates the time-based filter as swimmers age out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swimmers, tick]
  );

  // Sync inPool state with the visible swimmers list
  useEffect(() => {
    if (user) {
      setInPool(visibleSwimmers.some((s) => s.user_id === user.id));
    }
  }, [visibleSwimmers, user]);

  async function toggleCheckin() {
    if (!user) return;
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: inPool ? "out" : "in" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[checkin] request failed", res.status, body);
        setError("לא הצלחנו לעדכן. נסה שוב.");
        return;
      }
      const { data, error: selError } = await supabase
        .from("pool_presence")
        .select("*")
        .order("checked_in_at");
      if (selError) {
        console.error("[checkin] refetch error", selError.code, selError.message);
        setError("העדכון נשמר אך לא הצלחנו לרענן את הבריכה.");
        return;
      }
      if (data) setSwimmers(data as PoolPresenceEntry[]);
    } catch (err) {
      console.error("[checkin] network error", err);
      setError("שגיאת רשת. נסה שוב.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="display-title text-lg font-extrabold text-[color:var(--color-ink)] sm:text-xl">
          מי בבריכה עכשיו
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-pool-100)] px-3 py-1 text-xs font-bold text-[color:var(--color-pool-700)] sm:text-sm">
          <Waves size={15} weight="bold" aria-hidden />
          {visibleSwimmers.length} בפנים
        </span>
      </div>

      {/* Pool */}
      <div
        className="radius-card shadow-pool-lg relative w-full overflow-hidden ring-1 ring-[color:var(--color-pool-200)]"
        style={{ aspectRatio: "16 / 10" }}
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
        {/* Animated water caustics — light dancing on the surface (decor, GPU-only) */}
        <div className="water-caustics" aria-hidden />

        {visibleSwimmers.map((s, i) => (
          <SwimmerPin
            key={s.user_id}
            entry={s}
            delay={i * 0.4}
            isMe={user?.id === s.user_id}
          />
        ))}

        {visibleSwimmers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="radius-nested bg-white/85 px-5 py-3 text-sm font-bold text-[color:var(--color-ink-2)] backdrop-blur-sm">
              אף אחד בבריכה עדיין 😴
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      {user ? (
        inPool ? (
          <div className="radius-card shadow-pool-sm flex flex-col items-center gap-3 bg-white px-5 py-5 text-center ring-1 ring-[color:var(--color-pool-200)] sm:flex-row sm:justify-between sm:text-right">
            <p className="text-lg font-extrabold text-[color:var(--color-pool-700)] sm:text-xl">
              🎉 אתה בבריכה! החברים שלך מקבלים הודעה עכשיו
            </p>
            <button
              onClick={toggleCheckin}
              disabled={checking}
              className="pressable radius-nested shrink-0 bg-[color:var(--color-pool-100)] px-5 py-2.5 text-base font-bold text-[color:var(--color-pool-700)] disabled:opacity-50"
            >
              {checking ? "..." : "יצאתי"}
            </button>
          </div>
        ) : (
          <div
            className="radius-card shadow-pool-sm flex flex-col items-center gap-4 px-5 py-7 text-center ring-1"
            style={{
              background: currentUV >= 7
                ? "linear-gradient(135deg, var(--color-sun-300) 0%, var(--color-pool-100) 100%)"
                : "white",
              borderColor: "var(--color-pool-200)",
            }}
          >
            <p className="display-title text-3xl font-black text-[color:var(--color-ink)] sm:text-4xl md:text-5xl">
              {currentUV < 4 ? (
                <>הבריכה מחכה לך 🏊</>
              ) : (
                <>אל תהיה לוזר,<br />לך לבריכה 🥲</>
              )}
            </p>
            <button
              onClick={toggleCheckin}
              onPointerDown={addRipple}
              disabled={checking}
              className={`pressable relative overflow-hidden radius-nested px-8 py-4 text-lg font-extrabold text-white disabled:opacity-50${currentUV >= 7 ? " anim-sun" : ""}`}
              style={{
                background: "linear-gradient(90deg, var(--color-pool-500), var(--color-pool-400))",
                boxShadow: "0 12px 28px -8px rgba(14,147,212,0.7)",
              }}
            >
              {checking ? "..." : "אני בבריכה! 🏊"}
            </button>
          </div>
        )
      ) : (
        <div className="radius-card shadow-pool-sm flex flex-col items-center gap-3 bg-white px-5 py-6 text-center ring-1 ring-[color:var(--color-pool-200)]">
          <p className="text-lg font-extrabold text-[color:var(--color-ink)]">
            התחבר כדי לסמן שאתה בבריכה 🏊
          </p>
          <a
            href="/register"
            className="pressable radius-nested px-6 py-3 text-sm font-extrabold text-white"
            style={{ background: "linear-gradient(90deg, var(--color-pool-600), var(--color-pool-400))" }}
          >
            התחבר עם Google
          </a>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="radius-nested bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600 ring-1 ring-red-200"
        >
          {error}
        </p>
      )}
    </section>
  );
}
