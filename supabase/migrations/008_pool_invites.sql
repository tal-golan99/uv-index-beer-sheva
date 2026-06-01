CREATE TABLE IF NOT EXISTS pool_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pool_date    DATE NOT NULL,
  pool_time    SMALLINT NOT NULL, -- hour 0-23
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Only service_role writes; reads are open so invited users can see their invitation.
ALTER TABLE pool_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON pool_invites FOR ALL USING (auth.role() = 'service_role');
