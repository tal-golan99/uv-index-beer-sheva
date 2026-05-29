import type { DailyUV, HourlyUV, UVForecast } from "@/types";

const BEER_SHEVA = { latitude: 31.25, longitude: 34.8 };
const TIMEZONE = "Asia/Jerusalem";

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    uv_index: number[];
  };
}

export async function fetchUVForecast(): Promise<UVForecast> {
  const params = new URLSearchParams({
    latitude: BEER_SHEVA.latitude.toString(),
    longitude: BEER_SHEVA.longitude.toString(),
    hourly: "uv_index",
    forecast_days: "7",
    timezone: TIMEZONE,
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { next: { revalidate: 1800 } } // 30-min cache
  );

  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data: OpenMeteoResponse = await res.json();
  return parseResponse(data);
}

function parseResponse(data: OpenMeteoResponse): UVForecast {
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

  const week: DailyUV[] = Array.from(byDay.entries()).map(([date, hours]) => ({
    date,
    max_uv: Math.max(...hours.map((h) => h.uv_index)),
    hours,
  }));

  const now = new Date();
  const currentHour = pairs.findLast(
    (p) => new Date(p.time).getTime() <= now.getTime()
  );

  return {
    current: currentHour?.uv_index ?? 0,
    today: week[0],
    week,
    fetchedAt: now.toISOString(),
  };
}

export function findThresholdHour(
  day: DailyUV,
  threshold: number
): HourlyUV | null {
  return day.hours.find((h) => h.uv_index >= threshold) ?? null;
}
