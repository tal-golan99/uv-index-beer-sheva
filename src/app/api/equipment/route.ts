import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function todayJerusalem() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
}

export async function GET() {
  const today = todayJerusalem();
  const { data: queries, error } = await getAdmin()
    .from("pool_equipment_queries")
    .select("id, user_id, message, created_at, pool_equipment_responses(id, user_id, item, profiles(display_name))")
    .eq("query_date", today)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(queries ?? []);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await request.json();
  const today = todayJerusalem();

  const { data, error } = await getAdmin()
    .from("pool_equipment_queries")
    .insert({ user_id: user.id, query_date: today, message: message ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
