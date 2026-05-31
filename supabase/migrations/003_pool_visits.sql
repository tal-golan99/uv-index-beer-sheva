-- Pool visit history: one row per user per day they checked into the pool.
-- pool_presence only holds who is *currently* in the pool (rows deleted on check-out),
-- so this table persists history for the "days since last visit" banner + 7-day squares.
CREATE TABLE IF NOT EXISTS pool_visits (
  user_id    UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  visit_date DATE NOT NULL,            -- date in Asia/Jerusalem time
  PRIMARY KEY (user_id, visit_date)
);

ALTER TABLE pool_visits ENABLE ROW LEVEL SECURITY;

-- Each user can read only their own visit history (read directly from the browser).
CREATE POLICY "pool_visits_read_own"
  ON pool_visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Writes happen server-side via the service role (check-in API).
CREATE POLICY "pool_visits_service_role"
  ON pool_visits FOR ALL
  TO service_role
  USING (true);
