"use client";

import { useEffect, useRef, useState } from "react";
import { getUVLevel } from "@/lib/uv";

interface Props {
  value: number;
}

const CX = 100;
const CY = 100;
const R = 80;
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

const TICKS = [
  { uv: 0,  label: "0"  },
  { uv: 3,  label: "3"  },
  { uv: 6,  label: "6"  },
  { uv: 9,  label: "9"  },
  { uv: 11, label: "11" },
];

// Round to 3 decimals so the SVG coords serialize identically on the server (Node)
// and client (browser) — Math.sin/cos can differ by a ULP across JS engines, which
// otherwise triggers a React hydration mismatch on the static tick marks.
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function uvToPoint(uv: number, radius: number) {
  const angle = Math.PI - (uv / 11) * Math.PI;
  return {
    x: r3(CX + radius * Math.cos(angle)),
    y: r3(CY - radius * Math.sin(angle)),
  };
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
// Slight overshoot so the indicator "springs" past, then settles — like a needle.
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** #rrggbb → rgba() string with the given alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function UVGauge({ value }: Props) {
  // Animated fill value (for arc + number) and dot value (springy). Start empty
  // and only ever fill up, so the reveal reads as a single rising motion.
  const [fill, setFill] = useState(0);
  const [dotUV, setDotUV] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setFill(value);
      setDotUV(value);
      return;
    }

    const duration = 950;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setFill(value * easeOutExpo(t));
      // Clamp the springy overshoot to the gauge range.
      setDotUV(Math.max(0, Math.min(value * easeOutBack(t), 11)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  const level = getUVLevel(value);
  const pct = Math.min(Math.max(fill / 11, 0), 1);
  const dot = uvToPoint(dotUV, R);

  return (
    <div className="relative flex flex-col items-center gap-2 select-none">
      {/* Severity aura — colour encodes danger level (state, not decoration) */}
      <div
        className="uv-aura"
        aria-hidden
        style={{ ["--aura" as string]: hexToRgba(level.color, 0.5) }}
      />

      <svg
        viewBox="0 0 200 110"
        className="relative w-full max-w-xs"
        role="img"
        aria-label={`UV index ${value}`}
      >
        <defs>
          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="27%"  stopColor="#eab308" stopOpacity="0.25" />
            <stop offset="54%"  stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="81%"  stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
          </linearGradient>

          <linearGradient id="fillGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#22c55e" />
            <stop offset="27%"  stopColor="#eab308" />
            <stop offset="54%"  stopColor="#f97316" />
            <stop offset="81%"  stopColor="#ef4444" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          <clipPath id="progressClip">
            <rect x="0" y="0" width={CX - R + pct * (2 * R)} height="110" />
          </clipPath>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={ARC} fill="none" stroke="url(#trackGrad)" strokeWidth="10" strokeLinecap="round" />

        <path
          d={ARC}
          fill="none"
          stroke="url(#fillGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          clipPath="url(#progressClip)"
          filter="url(#glow)"
        />

        {TICKS.map((t) => {
          const inner = uvToPoint(t.uv, R - 14);
          const outer = uvToPoint(t.uv, R + 2);
          const lbl   = uvToPoint(t.uv, R - 26);
          return (
            <g key={t.uv}>
              <line
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="rgba(12,27,41,0.22)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <text
                x={lbl.x} y={lbl.y + 3}
                textAnchor="middle"
                fill="#475569"
                fontSize="7"
              >
                {t.label}
              </text>
            </g>
          );
        })}

        <circle cx={dot.x} cy={dot.y} r="6" fill={level.color} filter="url(#glow)" />
        <circle cx={dot.x} cy={dot.y} r="3" fill="white" />

        <text x={CX} y={CY - 18} textAnchor="middle" fill="#0c1b29" fontSize="38" fontWeight="800" fontFamily="system-ui">
          {fill.toFixed(1)}
        </text>
        <text x={CX} y={CY - 2} textAnchor="middle" fill="#475569" fontSize="11">
          מדד UV
        </text>
      </svg>

      {/* level badge */}
      <div
        className="relative px-5 py-1.5 rounded-full text-sm font-bold tracking-wide text-white"
        style={{ backgroundColor: level.colorText, boxShadow: `0 8px 20px -10px ${level.colorText}` }}
      >
        שמש {level.label}
      </div>
    </div>
  );
}
