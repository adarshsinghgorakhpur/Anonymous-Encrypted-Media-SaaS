-- Drop the old system policy that only works for public users
DROP POLICY IF EXISTS "System can update view count" ON media_uploads;

-- Create a policy that works for both authenticated and public users
CREATE POLICY "Anyone can update view count" ON media_uploads
  FOR UPDATE TO authenticated, public
  USING (is_destroyed = false)
  WITH CHECK (is_destroyed = false);

-- Also grant permission for expire updates (setting is_destroyed)
CREATE POLICY "Anyone can update expired status" ON media_uploads
  FOR UPDATE TO authenticated, public
  USING (expires_at < now() AND is_destroyed = false)
  WITH CHECK (true);

-- Ensure authenticated users can still view shared uploads (in case policy was removed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'media_uploads' 
    AND policyname = 'Authenticated can view active uploads'
  ) THEN
    CREATE POLICY "Authenticated can view active uploads" ON media_uploads
      FOR SELECT TO authenticated
      USING (is_destroyed = false);
  END IF;
END $$;