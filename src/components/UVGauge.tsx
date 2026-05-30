"use client";

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

function uvToPoint(uv: number, radius: number) {
  const angle = Math.PI - (uv / 11) * Math.PI;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle),
  };
}

export default function UVGauge({ value }: Props) {
  const level = getUVLevel(value);
  const pct = Math.min(Math.max(value / 11, 0), 1);
  const dot = uvToPoint(value, R);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <svg
        viewBox="0 0 200 110"
        className="w-full max-w-xs"
        aria-label={`UV index ${value}`}
      >
        <defs>
          {/* gradient track (full scale, dimmed) */}
          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="27%"  stopColor="#eab308" stopOpacity="0.25" />
            <stop offset="54%"  stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="81%"  stopColor="#ef4444" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
          </linearGradient>

          {/* gradient track (full scale, bright) */}
          <linearGradient id="fillGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#22c55e" />
            <stop offset="27%"  stopColor="#eab308" />
            <stop offset="54%"  stopColor="#f97316" />
            <stop offset="81%"  stopColor="#ef4444" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* clip to current UV progress */}
          <clipPath id="progressClip">
            <rect x="0" y="0" width={CX - R + pct * (2 * R)} height="110" />
          </clipPath>

          {/* glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* dimmed full-range track */}
        <path d={ARC} fill="none" stroke="url(#trackGrad)" strokeWidth="10" strokeLinecap="round" />

        {/* bright progress arc */}
        <path
          d={ARC}
          fill="none"
          stroke="url(#fillGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          clipPath="url(#progressClip)"
          filter="url(#glow)"
        />

        {/* tick marks */}
        {TICKS.map((t) => {
          const inner = uvToPoint(t.uv, R - 14);
          const outer = uvToPoint(t.uv, R + 2);
          const lbl   = uvToPoint(t.uv, R - 26);
          return (
            <g key={t.uv}>
              <line
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="rgba(15,23,42,0.2)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <text
                x={lbl.x} y={lbl.y + 3}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="7"
              >
                {t.label}
              </text>
            </g>
          );
        })}

        {/* current position dot */}
        <circle
          cx={dot.x}
          cy={dot.y}
          r="6"
          fill={level.color}
          filter="url(#glow)"
        />
        <circle cx={dot.x} cy={dot.y} r="3" fill="white" />

        {/* UV value */}
        <text x={CX} y={CY - 18} textAnchor="middle" fill="#0f172a" fontSize="38" fontWeight="800" fontFamily="system-ui">
          {value.toFixed(1)}
        </text>
        <text x={CX} y={CY - 2} textAnchor="middle" fill="#94a3b8" fontSize="11">
          מדד UV
        </text>
      </svg>

      {/* level badge */}
      <div
        className="px-5 py-1.5 rounded-full text-sm font-bold tracking-wide text-white"
        style={{ backgroundColor: level.color, boxShadow: `0 8px 20px -8px ${level.color}` }}
      >
        שמש {level.label}
      </div>
    </div>
  );
}
