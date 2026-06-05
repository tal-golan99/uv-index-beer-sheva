-- Add per-group notification preference for each member.
-- Default true so existing members continue receiving notifications.
ALTER TABLE pool_group_members
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true;
