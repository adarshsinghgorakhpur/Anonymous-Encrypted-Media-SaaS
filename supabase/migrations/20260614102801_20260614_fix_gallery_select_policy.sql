-- Add authenticated SELECT policy for shared galleries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'galleries' 
    AND policyname = 'Authenticated can view active galleries'
  ) THEN
    CREATE POLICY "Authenticated can view active galleries" ON galleries
      FOR SELECT TO authenticated
      USING (is_destroyed = false);
  END IF;
END $$;