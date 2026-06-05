export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const TOTAL_FRAMES = 555; // 18.5s

export const COLORS = {
  poolBlue: "#0e93d4",
  poolBlueDark: "#0a5784",
  sunGold: "#f7bd24",
  darkInk: "#0c1b29",
  inkSecondary: "#3c5161",
  inkTertiary: "#6a8295",
  bgDay1: "#d7eefb",
  bgDay2: "#f6fafc",
  bgPoolTime1: "#fdeec0",
  bgPoolTime2: "#d7eefb",
  uvGreen: "#22c55e",
  uvYellow: "#eab308",
  uvOrange: "#f97316",
  uvRed: "#ef4444",
  uvPurple: "#a855f7",
  telegram: "#2AABEE",
};

export const SCENES = {
  s1: { from: 0,   duration: 90  },  // 0–3s    Hero
  s2: { from: 90,  duration: 90  },  // 3–6s    Gauge (trimmed from 4s)
  s3: { from: 180, duration: 75  },  // 6–8.5s  Chart
  s4: { from: 255, duration: 90  },  // 8.5–11.5s Pool presence
  s5: { from: 345, duration: 75  },  // 11.5–14s  Button tap + notification
  s6: { from: 420, duration: 75  },  // 14–16.5s  Telegram bot + calendar
  s7: { from: 495, duration: 60  },  // 16.5–18.5s CTA
};

export const HOURLY_UV: { hour: string; uv: number }[] = [
  { hour: "07:00", uv: 1.2 },
  { hour: "08:00", uv: 2.8 },
  { hour: "09:00", uv: 4.5 },
  { hour: "10:00", uv: 6.3 },
  { hour: "11:00", uv: 8.1 },
  { hour: "12:00", uv: 9.7 },
  { hour: "13:00", uv: 10.2 },
  { hour: "14:00", uv: 9.4 },
  { hour: "15:00", uv: 7.8 },
  { hour: "16:00", uv: 5.9 },
  { hour: "17:00", uv: 3.6 },
  { hour: "18:00", uv: 1.8 },
  { hour: "19:00", uv: 0.5 },
];

export function uvColor(uv: number): string {
  if (uv <= 2) return COLORS.uvGreen;
  if (uv <= 5) return COLORS.uvYellow;
  if (uv <= 7) return COLORS.uvOrange;
  if (uv <= 10) return COLORS.uvRed;
  return COLORS.uvPurple;
}

// Gauge SVG geometry (shared between UVArcGauge and Scene2Gauge)
export const GAUGE = {
  viewW: 1080,
  viewH: 580,
  cx: 540,
  cy: 480,
  r: 360,
  arcLen: Math.PI * 360, // semicircle circumference ≈ 1131
};
