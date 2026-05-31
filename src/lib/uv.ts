export interface UVLevel {
  label: string;
  description: string;
  spf: string;
  safeMinutes: number | null;
  protection: string;
  color: string;
  /** Darkened variant that clears WCAG AA (>=4.5:1) on white — use when the level
   *  color is rendered as TEXT. The vivid `color` stays for arcs/bars/dots/borders. */
  colorText: string;
  colorMuted: string;
  bg: string;
  border: string;
  max: number;
}

export const UV_LEVELS: UVLevel[] = [
  {
    label: "נמוכה",
    description: "קרינה חלשה, פעילות חופשית",
    spf: "ללא",
    safeMinutes: null,
    protection: "פעילות חופשית ללא הגבלה",
    color: "#22c55e",
    colorText: "#15803d",
    colorMuted: "rgba(34,197,94,0.15)",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.25)",
    max: 2,
  },
  {
    label: "בינונית",
    description: "מומלץ הגנה בסיסית על העור",
    spf: "SPF 30",
    safeMinutes: 60,
    protection: "קרם הגנה SPF 30 + כובע",
    color: "#eab308",
    colorText: "#a16207",
    colorMuted: "rgba(234,179,8,0.15)",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.25)",
    max: 5,
  },
  {
    label: "גבוהה",
    description: "הגנה חיונית, הימנע מחשיפה בשעות השיא",
    spf: "SPF 50",
    safeMinutes: 30,
    protection: "כובע + SPF 50 + הצל בצהריים",
    color: "#f97316",
    colorText: "#c2410c",
    colorMuted: "rgba(249,115,22,0.15)",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    max: 7,
  },
  {
    label: "גבוהה מאוד",
    description: "צמצם חשיפה, הגנה מרבית נחוצה",
    spf: "SPF 50+",
    safeMinutes: 20,
    protection: "SPF 50+ + משקפיים + שהייה בצל",
    color: "#ef4444",
    colorText: "#b91c1c",
    colorMuted: "rgba(239,68,68,0.15)",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    max: 10,
  },
  {
    label: "קיצונית",
    description: "קרינה מסוכנת — הימנע מחשיפה ישירה",
    spf: "SPF 50+",
    safeMinutes: 10,
    protection: "הישאר בצל — קרינה קיצונית",
    color: "#a855f7",
    colorText: "#7e22ce",
    colorMuted: "rgba(168,85,247,0.15)",
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.25)",
    max: Infinity,
  },
];

export function getUVLevel(uv: number): UVLevel {
  return UV_LEVELS.find((l) => uv <= l.max) ?? UV_LEVELS[UV_LEVELS.length - 1];
}

export function safeExposureLabel(minutes: number | null): string {
  if (minutes === null) return "ללא הגבלה";
  if (minutes >= 60) return `${minutes} דקות`;
  return `${minutes} דק'`;
}

export function formatHourHe(iso: string): string {
  return new Date(iso).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
}

export function dayNameHe(dateStr: string): string {
  const names = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  return names[new Date(dateStr + "T12:00:00").getDay()];
}
