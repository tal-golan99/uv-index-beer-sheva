-- Grant anon role SELECT on pool_presence so the public "who's at the pool"
-- view works without authentication. RLS policy pool_presence_read_all
-- already allows it logically, but PostgreSQL also requires the role
-- to have the privilege at the table level.
GRANT SELECT ON TABLE pool_presence TO anon;

-- Belt-and-suspenders: ensure service_role has full access on all app tables.
-- (Service_role bypasses RLS by default in Supabase, but explicit grants
-- prevent surprises if project settings change.)
GRANT ALL ON TABLE pool_presence TO service_role;
GRANT ALL ON TABLE profiles TO service_role;
GRANT ALL ON TABLE pending_telegram_tokens TO service_role;
