import type { DailyUV, HourlyUV, UVForecast } from "@/types";

const BEER_SHEVA = { latitude: 31.25, longitude: 34.8 };
const TIMEZONE = "Asia/Jerusalem";

// ── Open-Meteo: hourly UV + daily max for 7 days ──────────────────────────

interface OpenMeteoResponse {
  hourly: { time: string[]; uv_index: number[] };
  daily:  { time: string[]; uv_index_max: number[] };
}

async function fetchOpenMeteoRaw(): Promise<{ week: DailyUV[]; current: number }> {
  const params = new URLSearchParams({
    latitude:     BEER_SHEVA.latitude.toString(),
    longitude:    BEER_SHEVA.longitude.toString(),
    hourly:       "uv_index",
    daily:        "uv_index_max",
    forecast_days:"7",
    timezone:     TIMEZONE,
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data: OpenMeteoResponse = await res.json();

  const pairs: HourlyUV[] = data.hourly.time.map((time, i) => ({
    time,
    uv_index: Math.round(data.hourly.uv_index[i] * 10) / 10,
  }));

  const byDay = new Map<string, HourlyUV[]>();
  for (const p of pairs) {
    const date = p.time.slice(0, 10);
    if (!byDay.has(date)) byDay.set(date, []);
    byDay.get(date)!.push(p);
  }

  const week: DailyUV[] = data.daily.time.map((date, i) => ({
    date,
    max_uv: Math.round(data.daily.uv_index_max[i] * 10) / 10,
    hours:  byDay.get(date) ?? [],
  }));

  const now = new Date();
  const currentHour = pairs.findLast(
    (p) => new Date(p.time).getTime() <= now.getTime()
  );

  return { week, current: currentHour?.uv_index ?? 0 };
}

// ── wttr.in: daily UV max (3 days) — matches Apple / WHO scale ────────────

interface WttrDay { date: string; uvIndex: string }
interface WttrResponse { weather: WttrDay[] }

async function fetchWttrMaxValues(): Promise<Map<string, number>> {
  const res = await fetch(
    `https://wttr.in/${BEER_SHEVA.latitude},${BEER_SHEVA.longitude}?format=j1`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) throw new Error(`wttr.in error: ${res.status}`);
  const data: WttrResponse = await res.json();
  const map = new Map<string, number>();
  for (const day of data.weather) {
    const v = parseInt(day.uvIndex);
    if (v > 0) map.set(day.date, v);
  }
  return map;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function fetchUVForecast(): Promise<UVForecast> {
  const [omData, wttrMap] = await Promise.all([
    fetchOpenMeteoRaw(),
    fetchWttrMaxValues().catch(() => new Map<string, number>()),
  ]);

  // Calibration ratio: wttr.in today / Open-Meteo today
  // Clamp to [0.9, 1.8] so a single bad reading can't explode the scale.
  const todayDate  = omData.week[0]?.date;
  const wttrToday  = wttrMap.get(todayDate ?? "") ?? 0;
  const omToday    = omData.week[0]?.max_uv ?? 0;
  const rawRatio   = wttrToday > 0 && omToday > 0 ? wttrToday / omToday : 1;
  const ratio      = Math.min(1.8, Math.max(0.9, rawRatio));

  const scale = (v: number) => Math.round(v * ratio * 10) / 10;

  const week: DailyUV[] = omData.week.map((day) => {
    // Use exact wttr.in value for days it covers; otherwise scale Open-Meteo.
    const exactMax = wttrMap.get(day.date);
    return {
      date:   day.date,
      max_uv: exactMax ?? scale(day.max_uv),
      hours:  day.hours.map((h) => ({ ...h, uv_index: scale(h.uv_index) })),
    };
  });

  return {
    current:   scale(omData.current),
    today:     week[0],
    week,
    fetchedAt: new Date().toISOString(),
  };
}

export function findThresholdHour(day: DailyUV, threshold: number): HourlyUV | null {
  return day.hours.find((h) => h.uv_index >= threshold) ?? null;
}
