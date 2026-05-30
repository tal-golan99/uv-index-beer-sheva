import { createClient } from "@supabase/supabase-js";
import type { Subscriber, DailyAlert } from "@/types";


function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, serviceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await getAdminClient()
    .from("subscribers")
    .select("*")
    .eq("active", true);
  if (error) throw error;
  return data ?? [];
}

export async function getActiveProfileSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await getAdminClient()
    .from("profiles")
    .select("id, telegram_chat_id, active")
    .eq("active", true)
    .eq("phone_notifications", true)
    .not("telegram_chat_id", "is", null);
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    email: null,
    whatsapp: null,
    callmebot_apikey: null,
    telegram_chat_id: p.telegram_chat_id as string,
    threshold: 9,
    active: p.active as boolean,
    created_at: "",
  }));
}

export async function createSubscriber(
  payload: Pick<Subscriber, "email" | "whatsapp" | "callmebot_apikey">
): Promise<Subscriber> {
  const { data, error } = await getAdminClient()
    .from("subscribers")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertDailyAlert(
  alert: Omit<DailyAlert, "id">
): Promise<void> {
  const { error } = await getAdminClient()
    .from("daily_alerts")
    .upsert(alert, { onConflict: "date" });
  if (error) throw error;
}

export async function getPendingAlerts(now: Date): Promise<DailyAlert[]> {
  const window = new Date(now.getTime() + 35 * 60 * 1000).toISOString();
  const { data, error } = await getAdminClient()
    .from("daily_alerts")
    .select("*")
    .or(`warn_sent.eq.false,threshold_sent.eq.false`)
    .lte("warn_at", window);
  if (error) throw error;
  return data ?? [];
}

export async function markAlertSent(
  id: string,
  field: "warn_sent" | "threshold_sent"
): Promise<void> {
  const { error } = await getAdminClient()
    .from("daily_alerts")
    .update({ [field]: true })
    .eq("id", id);
  if (error) throw error;
}
