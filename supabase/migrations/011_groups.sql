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

-- Groups: anyone can read (for join page); only service_role writes.
CREATE POLICY "public_select_groups"    ON pool_groups        FOR SELECT USING (true);
CREATE POLICY "service_role_all_groups" ON pool_groups        FOR ALL    USING (auth.role() = 'service_role');

-- Members: users can read groups they belong to; service_role handles writes.
CREATE POLICY "member_select"          ON pool_group_members FOR SELECT USING (true);
CREATE POLICY "service_role_all_members" ON pool_group_members FOR ALL USING (auth.role() = 'service_role');
