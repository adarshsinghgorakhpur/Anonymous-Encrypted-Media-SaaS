-- Add soft delete support to media_uploads
ALTER TABLE media_uploads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add policy for authenticated users to soft delete their own uploads
CREATE POLICY "Users can soft delete own uploads" ON media_uploads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);