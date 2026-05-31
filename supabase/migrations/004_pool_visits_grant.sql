-- Without this explicit grant the authenticated role gets 403 even when the
-- RLS policy (pool_visits_read_own) is correct — PostgreSQL object-level
-- permissions are checked before RLS policies are evaluated.
GRANT SELECT ON TABLE pool_visits TO authenticated;
