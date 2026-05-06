-- Add image_url column to community_messages
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Create community-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-images',
  'community-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Community images publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-images');

CREATE POLICY "Authenticated users can upload community images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'community-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own community images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'community-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
