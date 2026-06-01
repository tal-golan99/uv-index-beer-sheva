import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const admin = getAdmin();
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/register?redirect=/groups/${code}`);

  const { data: group } = await admin
    .from("pool_groups")
    .select("id, name")
    .eq("invite_code", code)
    .maybeSingle();

  if (!group) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-2xl">😔</p>
          <h1 className="text-xl font-extrabold text-[color:var(--color-ink)]">הקבוצה לא נמצאה</h1>
          <p className="text-sm text-[color:var(--color-ink-2)]">הלינק לא תקף או שהקבוצה נמחקה.</p>
          <Link href="/" className="text-sm font-bold text-[color:var(--color-pool-600)] underline">חזרה לאפליקציה</Link>
        </div>
      </main>
    );
  }

  // Check if already a member
  const { data: existing } = await admin
    .from("pool_group_members")
    .select("group_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("pool_group_members").insert({ group_id: group.id, user_id: user.id });
  }

  redirect(`/account?group=${group.id}`);
}
