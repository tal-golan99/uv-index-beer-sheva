CREATE TABLE IF NOT EXISTS pool_equipment_queries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pool_equipment_responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id   UUID REFERENCES pool_equipment_queries(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pool_equipment_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_equipment_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read today's queries and responses.
CREATE POLICY "public_select_queries"   ON pool_equipment_queries   FOR SELECT USING (true);
CREATE POLICY "public_select_responses" ON pool_equipment_responses FOR SELECT USING (true);

-- Authenticated users can insert/delete their own rows.
CREATE POLICY "auth_insert_queries"   ON pool_equipment_queries   FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete_queries"   ON pool_equipment_queries   FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "auth_insert_responses" ON pool_equipment_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_delete_responses" ON pool_equipment_responses FOR DELETE USING (auth.uid() = user_id);
