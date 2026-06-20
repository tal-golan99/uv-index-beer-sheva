import type { DailyUV, HourlyUV, UVForecast } from "@/types";

const BEER_SHEVA = { latitude: 31.25, longitude: 34.8 };
const TIMEZONE = "Asia/Jerusalem";

// ── Open-Meteo: hourly UV + daily max for 7 days ──────────────────────────

interface OpenMeteoResponse {
  hourly: { time: string[]; uv_index: number[] };
  daily:  { time: string[]; uv_index_max: number[]; sunrise: string[]; sunset: string[] };
}

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 3000 * i));
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      console.warn(`[openmeteo] attempt ${i + 1} failed:`, err);
    }
  }
  throw lastErr;
}

async function fetchOpenMeteoRaw(): Promise<{ week: DailyUV[]; current: number; sunrise: string | null; sunset: string | null }> {
  const params = new URLSearchParams({
    latitude:      BEER_SHEVA.latitude.toString(),
    longitude:     BEER_SHEVA.longitude.toString(),
    hourly:        "uv_index",
    daily:         "uv_index_max,sunrise,sunset",
    forecast_days: "7",
    timezone:      TIMEZONE,
  });

  const res = await fetchWithRetry(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { next: { revalidate: 1800 } } as RequestInit,
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

  const nowStr = new Date()
    .toLocaleString("sv-SE", { timeZone: TIMEZONE })
    .slice(0, 16)
    .replace(" ", "T");
  const currentHour = pairs.findLast((p) => p.time <= nowStr);

  return {
    week,
    current: currentHour?.uv_index ?? 0,
    sunrise: data.daily.sunrise?.[0] ?? null,
    sunset:  data.daily.sunset?.[0] ?? null,
  };
}

// ── wttr.in: daily max + 8 hourly points per day (matches Apple / WHO) ────

interface WttrHourly { time: string; uvIndex: string }
interface WttrDay    { date: string; uvIndex: string; hourly: WttrHourly[] }
interface WttrResponse { weather: WttrDay[] }

interface WttrDayData { max: number; hours: HourlyUV[] }

async function fetchWttrData(): Promise<Map<string, WttrDayData>> {
  const res = await fetch(
    `https://wttr.in/${BEER_SHEVA.latitude},${BEER_SHEVA.longitude}?format=j1`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) throw new Error(`wttr.in error: ${res.status}`);
  const data: WttrResponse = await res.json();

  const map = new Map<string, WttrDayData>();
  for (const day of data.weather) {
    const max = parseInt(day.uvIndex);
    if (max <= 0) continue;
    // time field is "HHMM" without leading zero: "0"=0:00, "300"=3:00, "1200"=12:00
    const hours: HourlyUV[] = day.hourly.map((h) => {
      const hour = Math.floor(parseInt(h.time) / 100);
      return {
        time:     `${day.date}T${hour.toString().padStart(2, "0")}:00`,
        uv_index: parseInt(h.uvIndex),
      };
    });
    map.set(day.date, { max, hours });
  }
  return map;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function fetchUVForecast(): Promise<UVForecast> {
  const [omData, wttrMap] = await Promise.all([
    fetchOpenMeteoRaw(),
    fetchWttrData().catch(() => new Map<string, WttrDayData>()),
  ]);

  // Calibration ratio for days not covered by wttr.in (days 4-7).
  // Clamp to [0.9, 1.8] so a bad reading can't explode the scale.
  const todayDate = omData.week[0]?.date;
  const wttrToday = wttrMap.get(todayDate ?? "");
  const omToday   = omData.week[0]?.max_uv ?? 0;
  const rawRatio  = wttrToday && omToday ? wttrToday.max / omToday : 1;
  const ratio     = Math.min(1.8, Math.max(0.9, rawRatio));

  const scale = (v: number) => Math.round(v * ratio * 10) / 10;

  const week: DailyUV[] = omData.week.map((day) => {
    const wttrDay = wttrMap.get(day.date);
    if (wttrDay) {
      // Days 1-3: use wttr.in exact values for both max_uv and hourly chart.
      return { date: day.date, max_uv: wttrDay.max, hours: wttrDay.hours };
    }
    // Days 4-7: scale Open-Meteo to match.
    return {
      date:   day.date,
      max_uv: scale(day.max_uv),
      hours:  day.hours.map((h) => ({ ...h, uv_index: scale(h.uv_index) })),
    };
  });

  // current gauge: scaled Open-Meteo (1-hour precision, better than wttr.in's 3h buckets)
  return {
    current:      scale(omData.current),
    today:        week[0],
    week,
    fetchedAt:    new Date().toISOString(),
    sunrise:      omData.sunrise,
    sunset:       omData.sunset,
    omHoursToday: omData.week[0]?.hours ?? [],
  };
}

export function findThresholdHour(day: DailyUV, threshold: number): HourlyUV | null {
  return day.hours.find((h) => h.uv_index >= threshold) ?? null;
}
