import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const since = sevenDaysAgo.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

  const { data, error } = await getAdmin()
    .from("pool_visits")
    .select("duration_minutes")
    .eq("user_id", user.id)
    .gte("visit_date", since)
    .not("duration_minutes", "is", null);

  if (error) return NextResponse.json({ avg_minutes: null });

  const rows = (data ?? []) as { duration_minutes: number }[];
  if (rows.length === 0) return NextResponse.json({ avg_minutes: null });

  const avg = Math.round(rows.reduce((s, r) => s + r.duration_minutes, 0) / rows.length);
  return NextResponse.json({ avg_minutes: avg });
}
