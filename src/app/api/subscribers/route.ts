import { NextRequest, NextResponse } from "next/server";
import { createSubscriber } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, whatsapp, callmebot_apikey } = body;

  if (!email && !whatsapp) {
    return NextResponse.json(
      { error: "נדרש לפחות אימייל או מספר וואטסאפ" },
      { status: 400 }
    );
  }

  if (whatsapp && !callmebot_apikey) {
    return NextResponse.json(
      { error: "נדרש CallMeBot API key עבור התראות וואטסאפ" },
      { status: 400 }
    );
  }

  try {
    const subscriber = await createSubscriber({ email, whatsapp, callmebot_apikey });
    return NextResponse.json({ ok: true, id: subscriber.id }, { status: 201 });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "שגיאה בהרשמה" }, { status: 500 });
  }
}
