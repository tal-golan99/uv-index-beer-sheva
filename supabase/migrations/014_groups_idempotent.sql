-- Idempotent re-application of groups schema.
-- Run this in the Supabase SQL editor if pool_groups / pool_group_members
-- tables are missing from production (they were defined in 011_groups.sql
-- but may never have been applied to the live instance).

CREATE TABLE IF NOT EXISTS pool_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pool_group_members (
  group_id   UUID REFERENCES pool_groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE pool_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_group_members ENABLE ROW LEVEL SECURITY;

-- Drop policies first so this script is safe to re-run
DROP POLICY IF EXISTS "public_select_groups"      ON pool_groups;
DROP POLICY IF EXISTS "service_role_all_groups"   ON pool_groups;
DROP POLICY IF EXISTS "member_select"             ON pool_group_members;
DROP POLICY IF EXISTS "service_role_all_members"  ON pool_group_members;

-- Groups: anyone can read (needed by the /groups/[code] join page); service_role writes
CREATE POLICY "public_select_groups"    ON pool_groups        FOR SELECT USING (true);
CREATE POLICY "service_role_all_groups" ON pool_groups        FOR ALL    USING (auth.role() = 'service_role');

-- Members: service_role handles all writes; members can read their own rows
CREATE POLICY "member_select"           ON pool_group_members FOR SELECT USING (true);
CREATE POLICY "service_role_all_members" ON pool_group_members FOR ALL  USING (auth.role() = 'service_role');
