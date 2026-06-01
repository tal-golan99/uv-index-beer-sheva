-- Ensure pool_visits has a UNIQUE constraint on (user_id, visit_date)
-- so the upsert in /api/checkin works correctly.
-- Safe to run multiple times: drops the constraint first if it already exists.

ALTER TABLE pool_visits DROP CONSTRAINT IF EXISTS pool_visits_user_id_visit_date_key;
ALTER TABLE pool_visits ADD CONSTRAINT pool_visits_user_id_visit_date_key UNIQUE (user_id, visit_date);
