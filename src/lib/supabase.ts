import { createClient } from "@supabase/supabase-js";
import type { Subscriber, DailyAlert } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const client = supabaseAdmin ?? supabase;
  const { data, error } = await client
    .from("subscribers")
    .select("*")
    .eq("active", true);
  if (error) throw error;
  return data ?? [];
}

export async function createSubscriber(
  payload: Pick<Subscriber, "email" | "whatsapp" | "callmebot_apikey">
): Promise<Subscriber> {
  const client = supabaseAdmin ?? supabase;
  const { data, error } = await client
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
  const client = supabaseAdmin ?? supabase;
  const { error } = await client
    .from("daily_alerts")
    .upsert(alert, { onConflict: "date" });
  if (error) throw error;
}

export async function getPendingAlerts(now: Date): Promise<DailyAlert[]> {
  const client = supabaseAdmin ?? supabase;
  const window = new Date(now.getTime() + 35 * 60 * 1000).toISOString();
  const { data, error } = await client
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
  const client = supabaseAdmin ?? supabase;
  const { error } = await client
    .from("daily_alerts")
    .update({ [field]: true })
    .eq("id", id);
  if (error) throw error;
}
