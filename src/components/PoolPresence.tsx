"use client";

import Image from "next/image";
import { Waves } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { POOL_IMAGE } from "@/lib/photos";
import type { PoolPresenceEntry } from "@/types";
import type { User } from "@supabase/supabase-js";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const FRICTION = 0.93;
const WALL_PAD = 7; // % from each edge so avatar stays inside rounded frame

function positionFor(userId: string): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  const h2 = Math.abs(h);
  return { x: 16 + ((h2 * 7) % 68), y: 16 + (h2 % 52) };
}

const AVATAR_COLORS = [
  "#f472b6", "#38bdf8", "#fb923c", "#34d399", "#a78bfa", "#facc15", "#f87171",
];
function colorFor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

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

interface PhysVec { x: number; y: number; vx: number; vy: number }

function SwimmerPin({
  entry,
  delay,
  isMe,
  x,
  y,
  onPointerDown,
  overrideAvatarUrl,
}: {
  entry: PoolPresenceEntry;
  delay: number;
  isMe: boolean;
  x: number;
  y: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  overrideAvatarUrl?: string | null;
}) {
  const ringColor = colorFor(entry.user_id);
  const avatarUrl = isMe && overrideAvatarUrl != null ? overrideAvatarUrl : entry.avatar_url;

  return (
    <div
      className="absolute flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
      style={{ top: `${y}%`, left: `${x}%`, transform: "translate(-50%, -50%)", touchAction: "none" }}
      onPointerDown={onPointerDown}
    >
      <div
        className="anim-pop-spring flex flex-col items-center gap-1"
        style={{ animationDelay: `${0.1 + delay}s` }}
      >
        <div
          className="anim-bob overflow-hidden rounded-full"
          style={{
            width: "clamp(42px, 8vw, 60px)",
            height: "clamp(42px, 8vw, 60px)",
            background: avatarUrl ? undefined : ringColor,
            animationDelay: `${delay}s`,
            boxShadow: `0 0 0 3px rgba(255,255,255,0.95), 0 6px 16px -4px ${ringColor}`,
          }}
          title={entry.display_name}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={entry.display_name} className="h-full w-full object-cover" />
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
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [inPool, setInPool] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Physics state lives in a ref (mutated per frame) + a snapshot state (triggers re-render)
  const physicsRef = useRef<Map<string, PhysVec>>(new Map());
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const rafRef = useRef<number>(0);
  const poolFrameRef = useRef<HTMLDivElement>(null);

  // Load data + auth + profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetch("/api/profile")
          .then((r) => r.json())
          .then((p) => { if (p?.avatar_url) setProfileAvatarUrl(p.avatar_url); })
          .catch(() => {});
      }
    });

    supabase.from("pool_presence").select("*").order("checked_in_at").then(({ data, error }) => {
      if (error) console.error("[pool_presence] initial fetch error", error.code, error.message);
      if (data) setSwimmers(data as PoolPresenceEntry[]);
    });

    const channel = supabase
      .channel("pool_presence_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pool_presence" }, () => {
        supabase.from("pool_presence").select("*").order("checked_in_at").then(({ data, error }) => {
          if (error) console.error("[pool_presence] realtime refetch error", error.code, error.message);
          if (data) setSwimmers(data as PoolPresenceEntry[]);
        });
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const visibleSwimmers = useMemo(
    () => swimmers.filter((s) => Date.now() - new Date(s.checked_in_at).getTime() < FOUR_HOURS_MS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swimmers, tick]
  );

  useEffect(() => {
    if (user) setInPool(visibleSwimmers.some((s) => s.user_id === user.id));
  }, [visibleSwimmers, user]);

  // Sync physics map when visible swimmers change
  useEffect(() => {
    const physics = physicsRef.current;
    const ids = new Set(visibleSwimmers.map((s) => s.user_id));

    // Remove gone swimmers
    for (const id of [...physics.keys()]) {
      if (!ids.has(id)) physics.delete(id);
    }

    // Init positions for new swimmers only
    for (const s of visibleSwimmers) {
      if (!physics.has(s.user_id)) {
        const isMe = user?.id === s.user_id;
        const init = isMe ? { x: 46, y: 46 } : positionFor(s.user_id);
        physics.set(s.user_id, { x: init.x, y: init.y, vx: 0, vy: 0 });
      }
    }

    // Push snapshot
    const snap = new Map<string, { x: number; y: number }>();
    for (const [id, p] of physics) snap.set(id, { x: p.x, y: p.y });
    setPositions(snap);
  }, [visibleSwimmers, user]);

  // Physics animation loop — only runs while there is velocity
  const runPhysics = useCallback(() => {
    const physics = physicsRef.current;
    let anyMoving = false;

    for (const p of physics.values()) {
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < WALL_PAD)        { p.x = WALL_PAD;        p.vx =  Math.abs(p.vx) * 0.65; }
      if (p.x > 100 - WALL_PAD)  { p.x = 100 - WALL_PAD;  p.vx = -Math.abs(p.vx) * 0.65; }
      if (p.y < WALL_PAD)        { p.y = WALL_PAD;         p.vy =  Math.abs(p.vy) * 0.65; }
      if (p.y > 100 - WALL_PAD)  { p.y = 100 - WALL_PAD;  p.vy = -Math.abs(p.vy) * 0.65; }

      if (Math.abs(p.vx) > 0.02 || Math.abs(p.vy) > 0.02) anyMoving = true;
    }

    const snap = new Map<string, { x: number; y: number }>();
    for (const [id, p] of physics) snap.set(id, { x: p.x, y: p.y });
    setPositions(snap);

    if (anyMoving) rafRef.current = requestAnimationFrame(runPhysics);
  }, []);

  const startPhysicsLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(runPhysics);
  }, [runPhysics]);

  // Drag handler — converts pointer delta in px to % of pool frame
  const handlePointerDown = useCallback((userId: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    let lastX = e.clientX;
    let lastY = e.clientY;

    function onMove(ev: PointerEvent) {
      const frame = poolFrameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const scaleX = 100 / rect.width;
      const scaleY = 100 / rect.height;

      const dx = (ev.clientX - lastX) * scaleX;
      const dy = (ev.clientY - lastY) * scaleY;
      lastX = ev.clientX;
      lastY = ev.clientY;

      const p = physicsRef.current.get(userId);
      if (!p) return;
      p.x = Math.max(WALL_PAD, Math.min(100 - WALL_PAD, p.x + dx));
      p.y = Math.max(WALL_PAD, Math.min(100 - WALL_PAD, p.y + dy));
      p.vx = dx * 0.6;
      p.vy = dy * 0.6;

      setPositions((prev) => {
        const next = new Map(prev);
        next.set(userId, { x: p.x, y: p.y });
        return next;
      });
    }

    function onUp() {
      startPhysicsLoop();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [startPhysicsLoop]);

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
      const { data, error: selError } = await supabase.from("pool_presence").select("*").order("checked_in_at");
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
        <h2 className="display-title text-lg text-[color:var(--color-ink)] sm:text-xl">
          מי בבריכה עכשיו
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--color-pool-100)] px-3 py-1 text-xs font-bold text-[color:var(--color-pool-700)] sm:text-sm">
          <Waves size={15} weight="bold" aria-hidden />
          {visibleSwimmers.length} בפנים
        </span>
      </div>

      {/* Pool frame */}
      <div
        ref={poolFrameRef}
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
        <div className="water-caustics" aria-hidden />

        {visibleSwimmers.map((s, i) => {
          const pos = positions.get(s.user_id) ?? (user?.id === s.user_id ? { x: 46, y: 46 } : positionFor(s.user_id));
          return (
            <SwimmerPin
              key={s.user_id}
              entry={s}
              delay={i * 0.4}
              isMe={user?.id === s.user_id}
              x={pos.x}
              y={pos.y}
              overrideAvatarUrl={user?.id === s.user_id ? profileAvatarUrl : undefined}
              onPointerDown={(e) => handlePointerDown(s.user_id, e)}
            />
          );
        })}

        {visibleSwimmers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="radius-nested bg-white/85 px-5 py-3 text-sm font-bold text-[color:var(--color-ink-2)] backdrop-blur-sm">
              הבריכה ריקה כרגע. תהיה אתה הראשון.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      {user ? (
        inPool ? (
          <div className="radius-card shadow-pool-sm flex flex-col items-center gap-3 bg-white px-5 py-5 text-center ring-1 ring-[color:var(--color-pool-200)] sm:flex-row sm:justify-between sm:text-right">
            <p className="text-lg font-extrabold text-[color:var(--color-pool-700)] sm:text-xl">
              אתה בפנים. כל החברים שלך כבר קיבלו התראה.
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
            <p className="display-title text-3xl text-[color:var(--color-ink)] sm:text-4xl md:text-5xl">
              {currentUV < 4 ? (
                <>הבריכה מחכה. בוא כבר.</>
              ) : (
                <>אל תהיה לוזר.<br />לך לבריכה.</>
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
            מתחברים פעם אחת, ומסמנים שאתם במים.
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
