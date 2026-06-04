-- Idempotent consolidation of migrations that may not have been applied in production.

-- 007: add visit duration columns if missing
ALTER TABLE pool_visits
  ADD COLUMN IF NOT EXISTS checked_in_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- 013: explicit unique constraint so upsert onConflict("user_id,visit_date") works reliably
ALTER TABLE pool_visits DROP CONSTRAINT IF EXISTS pool_visits_user_id_visit_date_key;
ALTER TABLE pool_visits ADD CONSTRAINT pool_visits_user_id_visit_date_key UNIQUE (user_id, visit_date);

-- 015: table-level grants for groups (service_role for writes, anon/authenticated for reads)
GRANT ALL    ON TABLE pool_groups        TO service_role;
GRANT ALL    ON TABLE pool_group_members TO service_role;
GRANT SELECT ON TABLE pool_groups        TO anon, authenticated;
GRANT SELECT ON TABLE pool_group_members TO anon, authenticated;

-- Re-confirm pool_visits read grant for authenticated users
GRANT SELECT ON TABLE pool_visits TO authenticated;
