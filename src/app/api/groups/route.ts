import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { randomBytes } from "crypto";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list all groups the current user belongs to.
export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getAdmin()
    .from("pool_group_members")
    .select("group_id, pool_groups(id, name, invite_code, created_by, created_at)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const groups = (data ?? []).map((r) => r.pool_groups).filter(Boolean);
  return NextResponse.json(groups);
}

// POST — create a new group.
export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const admin = getAdmin();
  const inviteCode = randomBytes(4).toString("hex");
  const { data: group, error: groupErr } = await admin
    .from("pool_groups")
    .insert({ name: name.trim(), created_by: user.id, invite_code: inviteCode })
    .select()
    .single();

  if (groupErr) {
    console.error("[groups] insert error:", groupErr.code, groupErr.message);
    return NextResponse.json({ error: groupErr.message }, { status: 500 });
  }

  const { error: memberErr } = await admin
    .from("pool_group_members")
    .insert({ group_id: group.id, user_id: user.id });

  if (memberErr) {
    console.error("[groups] member insert error:", memberErr.code, memberErr.message);
    // Roll back — delete the orphaned group so there's no inconsistency
    await admin.from("pool_groups").delete().eq("id", group.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json(group, { status: 201 });
}
