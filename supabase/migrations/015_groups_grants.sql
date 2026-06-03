-- Grant table-level access for pool_groups and pool_group_members.
-- RLS policies alone are not enough — PostgreSQL also requires the role
-- to hold the privilege at the table level (same fix as 004/005 for pool_presence).

-- service_role (used by the API admin client) needs full access
GRANT ALL ON TABLE pool_groups        TO service_role;
GRANT ALL ON TABLE pool_group_members TO service_role;

-- anon/authenticated need SELECT so the /groups/[code] join page can look up groups
GRANT SELECT ON TABLE pool_groups        TO anon, authenticated;
GRANT SELECT ON TABLE pool_group_members TO anon, authenticated;
