/*
  # Add galleries owner select policy

  Ensures authenticated users can explicitly select their own galleries
  even if is_destroyed is true (for viewing history).
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'galleries'
      AND policyname = 'Owners can view their galleries'
  ) THEN
    CREATE POLICY "Owners can view their galleries"
      ON galleries FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
