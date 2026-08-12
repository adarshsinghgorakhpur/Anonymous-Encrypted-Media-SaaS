-- Add deleted_at column to vault_notes for soft delete
ALTER TABLE vault_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update the SELECT policy to exclude soft-deleted notes by default
DROP POLICY IF EXISTS "Users can view own vault notes" ON vault_notes;
CREATE POLICY "Users can view own vault notes" ON vault_notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add policy to view trashed notes
CREATE POLICY "Users can view own trashed vault notes" ON vault_notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NOT NULL);