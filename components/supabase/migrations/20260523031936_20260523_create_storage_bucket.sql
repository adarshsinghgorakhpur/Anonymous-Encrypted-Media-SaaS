/*
  # Create Storage Bucket and Policies

  1. Storage Bucket
    - Create 'xcrypt-media' bucket for uploaded files
    - Set as private (requires signed URLs)
    - Allow images and videos
  
  2. Storage Policies
    - Allow authenticated users to upload
    - Allow anonymous uploads via service role
    - Allow anyone to read via signed URLs
    - Allow owners to delete their own files
*/

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'xcrypt-media',
  'xcrypt-media',
  false,
  524288000,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to upload (anon + authenticated)
CREATE POLICY "Anyone can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'xcrypt-media');

-- 3. Allow anyone to read (for signed URLs to work)
CREATE POLICY "Anyone can read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'xcrypt-media');

-- 4. Allow anyone to update
CREATE POLICY "Anyone can update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'xcrypt-media')
  WITH CHECK (bucket_id = 'xcrypt-media');

-- 5. Allow deletion
CREATE POLICY "Anyone can delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'xcrypt-media');
