import Link from "next/link";
import { fetchUVForecast } from "@/lib/openmeteo";
import UVGauge from "@/components/UVGauge";
import DailyChart from "@/components/DailyChart";
import WeeklyChart from "@/components/WeeklyChart";

export const revalidate = 1800;

export default async function HomePage() {
  const forecast = await fetchUVForecast();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">מדד UV</h1>
          <p className="text-sm text-gray-500">באר שבע</p>
        </div>
        <Link
          href="/register"
          className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          התראות UV ⚡
        </Link>
      </header>

      <div className="flex justify-center">
        <UVGauge value={forecast.current} />
      </div>

      <DailyChart hours={forecast.today.hours} />

      <WeeklyChart week={forecast.week} />

      <footer className="text-center text-xs text-gray-600">
        עודכן לאחרונה:{" "}
        {new Date(forecast.fetchedAt).toLocaleTimeString("he-IL", {
          timeZone: "Asia/Jerusalem",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {" · "}מקור: Open-Meteo
      </footer>
    </main>
  );
}
