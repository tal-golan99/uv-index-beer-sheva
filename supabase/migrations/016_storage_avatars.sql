-- Create the avatars storage bucket and RLS policies for profile picture uploads.

-- Public bucket: avatar URLs are publicly readable
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload/replace their own avatar (file must start with their user id)
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name ~ ('^' || auth.uid()::text || '\.')
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );

-- Anyone can read avatar URLs (needed for public img src)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
