"use client";

interface Props {
  value: number;
}

interface Level {
  label: string;
  color: string;
  bg: string;
  ring: string;
  max: number;
}

const LEVELS: Level[] = [
  { label: "נמוכה",   color: "#22c55e", bg: "bg-green-500/10",  ring: "ring-green-500",  max: 2  },
  { label: "בינונית", color: "#eab308", bg: "bg-yellow-500/10", ring: "ring-yellow-500", max: 5  },
  { label: "גבוהה",   color: "#f97316", bg: "bg-orange-500/10", ring: "ring-orange-500", max: 7  },
  { label: "גבוהה מאוד", color: "#ef4444", bg: "bg-red-500/10", ring: "ring-red-500",   max: 10 },
  { label: "קיצונית", color: "#a855f7", bg: "bg-purple-500/10", ring: "ring-purple-500", max: Infinity },
];

function getLevel(uv: number): Level {
  return LEVELS.find((l) => uv <= l.max) ?? LEVELS[LEVELS.length - 1];
}

export default function UVGauge({ value }: Props) {
  const level = getLevel(value);
  const capped = Math.min(value, 11);
  const pct = (capped / 11) * 100;

  return (
    <div className={`flex flex-col items-center gap-4 p-8 rounded-3xl ${level.bg} ring-2 ${level.ring}`}>
      <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
        UV נוכחי — באר שבע
      </p>

      <div
        className="relative flex items-center justify-center w-48 h-48 rounded-full ring-8 transition-all duration-700"
        style={{ boxShadow: `0 0 60px ${level.color}40, 0 0 0 8px ${level.color}` }}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={level.color}
            strokeWidth="12"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span
          className="text-6xl font-black tabular-nums"
          style={{ color: level.color }}
        >
          {value.toFixed(1)}
        </span>
      </div>

      <span
        className="text-xl font-bold"
        style={{ color: level.color }}
      >
        קרינה {level.label}
      </span>

      <div className="flex gap-1 mt-2">
        {LEVELS.map((l) => (
          <div
            key={l.label}
            className="h-2 flex-1 rounded-full transition-opacity"
            style={{
              backgroundColor: l.color,
              opacity: l.label === level.label ? 1 : 0.25,
            }}
          />
        ))}
      </div>
    </div>
  );
}
