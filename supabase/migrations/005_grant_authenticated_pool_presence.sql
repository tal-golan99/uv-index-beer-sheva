-- Logged-in users read pool_presence as the `authenticated` role (browser client
-- with a user JWT). 004 granted only `anon`; without this, authenticated reads are
-- denied (permission denied for table), so the live pool view is empty for members
-- and a successful check-in never appears.
GRANT SELECT ON TABLE pool_presence TO authenticated;
