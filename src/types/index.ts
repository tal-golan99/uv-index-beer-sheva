export interface HourlyUV {
  time: string; // ISO string
  uv_index: number;
}

export interface DailyUV {
  date: string; // YYYY-MM-DD
  max_uv: number;
  hours: HourlyUV[];
}

export interface UVForecast {
  current: number;
  today: DailyUV;
  week: DailyUV[];
  fetchedAt: string; // ISO string
  sunrise: string | null; // ISO datetime for today's sunrise in Asia/Jerusalem
  sunset: string | null;  // ISO datetime for today's sunset in Asia/Jerusalem
  /** Raw Open-Meteo hourly data for today (24 pts, 1h resolution). Use for pool window detection
   *  instead of today.hours which is wttr.in 3h-sampled data. */
  omHoursToday: HourlyUV[];
}

export interface Subscriber {
  id: string;
  email: string | null;
  whatsapp: string | null;
  callmebot_apikey: string | null;
  telegram_chat_id: string | null;
  threshold: number;
  active: boolean;
  created_at: string;
}

export type NotificationChannel = "email" | "whatsapp" | "both";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  telegram_chat_id: string | null;
  email_notifications: boolean;
  phone_notifications: boolean;
  active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PoolPresenceEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  checked_in_at: string;
}

export interface DailyAlert {
  id: string;
  date: string;
  warn_at: string; // ISO — 1h before threshold
  threshold_at: string; // ISO — when UV hits threshold
  max_uv: number;
  warn_sent: boolean;
  threshold_sent: boolean;
}
