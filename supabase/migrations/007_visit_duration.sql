-- Track check-in time and total minutes per visit so we can show weekly averages
-- and rank users by time spent in the pool (Pool King feature).

ALTER TABLE pool_visits
  ADD COLUMN IF NOT EXISTS checked_in_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Grant the service role (used by the API) write access to the new columns.
-- No new RLS policies needed — existing policies cover the whole table.
