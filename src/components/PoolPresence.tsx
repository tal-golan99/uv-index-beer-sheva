"use client";

import Image from "next/image";
import { useState } from "react";
import { POOL_IMAGE } from "@/lib/photos";

/**
 * "Who's at the pool now" — the social centerpiece.
 *
 * Phase 1: demo data + local check-in toggle so the full UX is visible.
 * Phase 3 will swap `DEMO_SWIMMERS`/`inPool` for live Supabase Realtime data
 * and a real /api/checkin call.
 */

interface Swimmer {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** position over the pool, in % */
  top: number;
  left: number;
}

const DEMO_SWIMMERS: Swimmer[] = [
  { id: "1", name: "דנה",  emoji: "🏊‍♀️", color: "#f472b6", top: 24, left: 16 },
  { id: "2", name: "יוסי", emoji: "🤽‍♂️", color: "#38bdf8", top: 58, left: 28 },
  { id: "3", name: "מאיה", emoji: "🏄‍♀️", color: "#fb923c", top: 32, left: 56 },
  { id: "4", name: "עמית", emoji: "🐬",   color: "#34d399", top: 64, left: 72 },
  { id: "5", name: "נועה", emoji: "🦩",   color: "#a78bfa", top: 20, left: 82 },
];

function Avatar({ swimmer, delay }: { swimmer: Swimmer; delay: number }) {
  return (
    <div
      className="absolute flex flex-col items-center gap-1"
      style={{
        top: `${swimmer.top}%`,
        left: `${swimmer.left}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="anim-bob grid place-items-center rounded-full text-xl shadow-lg ring-2 ring-white/90 sm:text-2xl"
        style={{
          width: "clamp(46px, 9vw, 64px)",
          height: "clamp(46px, 9vw, 64px)",
          background: swimmer.color,
          animationDelay: `${delay}s`,
        }}
        title={swimmer.name}
      >
        {swimmer.emoji}
      </div>
      <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] sm:text-sm">
        {swimmer.name}
      </span>
    </div>
  );
}

export default function PoolPresence() {
  const [inPool, setInPool] = useState(false);

  const swimmers: Swimmer[] = inPool
    ? [
        ...DEMO_SWIMMERS,
        { id: "me", name: "אתה", emoji: "😎", color: "#facc15", top: 46, left: 46 },
      ]
    : DEMO_SWIMMERS;

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

      {/* Pool — real BGU pool photo as the backdrop */}
      <div
        className="relative w-full overflow-hidden rounded-3xl ring-1 ring-[color:var(--color-pool-200)]"
        style={{
          aspectRatio: "16 / 10",
          boxShadow: "0 24px 60px -24px rgba(14,165,233,0.7)",
        }}
      >
        <Image
          src={POOL_IMAGE}
          alt="בריכת אוניברסיטת בן-גוריון"
          fill
          priority
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover"
        />
        {/* blue tint so avatars pop and the low-res photo reads as a clean surface */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0ea5e9]/25 via-[#0ea5e9]/10 to-[#0369a1]/35" />

        {swimmers.map((s, i) => (
          <Avatar key={s.id} swimmer={s} delay={i * 0.4} />
        ))}
      </div>

      {/* Current-user state */}
      {inPool ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-5 py-5 text-center ring-1 ring-[color:var(--color-pool-200)] shadow-sm sm:flex-row sm:justify-between sm:text-right">
          <p className="text-lg font-extrabold text-[color:var(--color-pool-700)] sm:text-xl">
            🎉 אתה בבריכה! החברים שלך מקבלים הודעה עכשיו
          </p>
          <button
            onClick={() => setInPool(false)}
            className="shrink-0 rounded-xl bg-[color:var(--color-pool-100)] px-5 py-2.5 text-base font-bold text-[color:var(--color-ink-2)] transition-transform hover:scale-105 active:scale-95"
          >
            יצאתי
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
            onClick={() => setInPool(true)}
            className="rounded-2xl px-8 py-4 text-lg font-extrabold text-white transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(90deg, var(--color-pool-500), var(--color-pool-400))",
              boxShadow: "0 12px 28px -8px rgba(14,165,233,0.75)",
            }}
          >
            אני בבריכה! 🏊
          </button>
        </div>
      )}
    </section>
  );
}
