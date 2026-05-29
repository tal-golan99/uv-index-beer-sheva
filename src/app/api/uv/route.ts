import { NextResponse } from "next/server";
import { fetchUVForecast } from "@/lib/openmeteo";

export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const forecast = await fetchUVForecast();
    return NextResponse.json(forecast);
  } catch (err) {
    console.error("UV fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch UV data" }, { status: 502 });
  }
}
