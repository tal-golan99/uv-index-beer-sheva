-- User profiles linked to Supabase auth
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name         TEXT,
  avatar_url           TEXT,
  phone                TEXT,
  email_notifications  BOOLEAN     NOT NULL DEFAULT true,
  phone_notifications  BOOLEAN     NOT NULL DEFAULT false,
  active               BOOLEAN     NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_service_role"
  ON profiles FOR ALL
  TO service_role
  USING (true);

-- Pool presence: one active row per user currently at the pool
CREATE TABLE IF NOT EXISTS pool_presence (
  user_id       UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name  TEXT        NOT NULL,
  avatar_url    TEXT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pool_presence ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read who's at the pool
CREATE POLICY "pool_presence_read_all"
  ON pool_presence FOR SELECT
  USING (true);

-- Authenticated users can only write their own row
CREATE POLICY "pool_presence_write_own"
  ON pool_presence FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pool_presence_service_role"
  ON pool_presence FOR ALL
  TO service_role
  USING (true);

-- Enable Realtime for live "who's in the pool" updates
ALTER PUBLICATION supabase_realtime ADD TABLE pool_presence;
