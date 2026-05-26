-- Ensure authenticated users can insert/select their own uploads.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media_uploads'
      AND policyname = 'Users can insert own uploads'
  ) THEN
    CREATE POLICY "Users can insert own uploads"
      ON media_uploads FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media_uploads'
      AND policyname = 'Anonymous can create anonymous uploads'
  ) THEN
    CREATE POLICY "Anonymous can create anonymous uploads"
      ON media_uploads FOR INSERT
      TO anon
      WITH CHECK (user_id IS NULL AND is_anonymous = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media_uploads'
      AND policyname = 'Public can read shared active uploads by access code'
  ) THEN
    CREATE POLICY "Public can read shared active uploads by access code"
      ON media_uploads FOR SELECT
      TO anon, authenticated
      USING (
        is_destroyed = false
        AND (expires_at IS NULL OR expires_at > now())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'media_uploads'
      AND policyname = 'Users can view own uploads'
  ) THEN
    CREATE POLICY "Users can view own uploads"
      ON media_uploads FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
