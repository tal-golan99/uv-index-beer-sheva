-- Add More UV waitlist interest flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS more_uv_interest BOOLEAN NOT NULL DEFAULT false;
