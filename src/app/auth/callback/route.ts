import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: profile } = await admin
        .from("profiles")
        .select("id, onboarding_completed, avatar_url, telegram_chat_id")
        .eq("id", data.user.id)
        .maybeSingle();

      const meta = data.user.user_metadata ?? {};

      if (!profile) {
        await admin.from("profiles").insert({
          id: data.user.id,
          display_name: meta.full_name ?? meta.name ?? null,
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
        });
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Sync Google avatar for existing users who don't have one
      if (!profile.avatar_url) {
        const googleAvatar = meta.avatar_url ?? meta.picture ?? null;
        if (googleAvatar) {
          await admin.from("profiles").update({ avatar_url: googleAvatar }).eq("id", data.user.id);
        }
      }

      if (!profile.onboarding_completed || !profile.telegram_chat_id) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/register?error=auth`);
}
