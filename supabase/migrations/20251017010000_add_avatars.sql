-- Add avatar_url to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);

-- Storage policy for avatars (private by default, owners can read)
CREATE POLICY "Allow owner read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid() = (metadata->>'owner')::uuid);

CREATE POLICY "Allow owner insert avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (metadata->>'owner')::uuid);
