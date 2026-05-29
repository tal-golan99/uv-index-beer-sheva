-- Subscribers: users who want UV alerts
CREATE TABLE IF NOT EXISTS subscribers (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT,
  whatsapp          TEXT,
  callmebot_apikey  TEXT,
  threshold         INTEGER     NOT NULL DEFAULT 9,
  active            BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT at_least_one_channel CHECK (email IS NOT NULL OR whatsapp IS NOT NULL)
);

-- Daily alerts: one row per day when UV is expected to hit threshold
CREATE TABLE IF NOT EXISTS daily_alerts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE        NOT NULL UNIQUE,
  warn_at         TIMESTAMPTZ NOT NULL,       -- 1h before threshold
  threshold_at    TIMESTAMPTZ NOT NULL,       -- when UV hits threshold
  max_uv          NUMERIC     NOT NULL,
  warn_sent       BOOLEAN     NOT NULL DEFAULT false,
  threshold_sent  BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_alerts_date ON daily_alerts (date);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers (active);

-- Row Level Security
ALTER TABLE subscribers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_alerts ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write subscribers
CREATE POLICY "service_role_only_subscribers"
  ON subscribers FOR ALL
  TO service_role
  USING (true);

-- Only service role can read/write daily_alerts
CREATE POLICY "service_role_only_alerts"
  ON daily_alerts FOR ALL
  TO service_role
  USING (true);
