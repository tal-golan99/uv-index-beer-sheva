import type { Metadata } from "next";
import { Assistant, Suez_One } from "next/font/google";
import "./globals.css";
import { fetchUVForecast } from "@/lib/openmeteo";
import BodyTheme from "@/components/BodyTheme";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-assistant",
  display: "swap",
});

const suez = Suez_One({
  subsets: ["hebrew", "latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UV Pool · באר שבע",
  description: "מדד UV בזמן אמת ומי נמצא בבריכה עכשיו, בבאר שבע",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const forecast = await fetchUVForecast();
  const poolTime = forecast.current >= 9;
  const nowMs = Date.now();
  const sunriseMs = forecast.sunrise ? new Date(forecast.sunrise).getTime() : null;
  const sunsetMs  = forecast.sunset  ? new Date(forecast.sunset).getTime()  : null;
  const nightMode = sunriseMs !== null && sunsetMs !== null
    ? nowMs < sunriseMs || nowMs > sunsetMs
    : false;

  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${suez.variable}`}>
      <body className="min-h-screen text-[color:var(--color-ink)] antialiased">
        <BodyTheme poolTime={poolTime} nightMode={nightMode} />
        {children}
      </body>
    </html>
  );
}
