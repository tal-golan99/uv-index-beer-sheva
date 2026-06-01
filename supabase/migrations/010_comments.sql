CREATE TABLE IF NOT EXISTS pool_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pool_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select" ON pool_comments FOR SELECT USING (true);
CREATE POLICY "auth_insert"   ON pool_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete"   ON pool_comments FOR DELETE USING (auth.uid() = user_id);
