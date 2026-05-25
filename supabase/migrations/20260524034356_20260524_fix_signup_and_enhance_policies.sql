
-- Fix signup and enhance RLS policies (skip already-existing ones)

-- Recreate the handle_new_user trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Subscriptions: allow users to update own
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Access attempt logs: upload owners can view
CREATE POLICY "Upload owners can view access logs"
  ON access_attempt_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_uploads
      WHERE media_uploads.id = access_attempt_logs.upload_id
      AND media_uploads.user_id = auth.uid()
    )
  );

-- Analytics: upload owners can view
CREATE POLICY "Upload owners can view analytics"
  ON analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM media_uploads
      WHERE media_uploads.id = analytics.upload_id
      AND media_uploads.user_id = auth.uid()
    )
  );

-- Reports: anyone can submit
CREATE POLICY "Anyone can submit reports"
  ON reports FOR INSERT
  WITH CHECK (true);

-- Galleries: update and delete for owners
CREATE POLICY "Users can update own galleries"
  ON galleries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own galleries"
  ON galleries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Gallery media: owners can manage, users can view accessible
CREATE POLICY "Gallery owners can manage gallery media"
  ON gallery_media FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = gallery_media.gallery_id
      AND galleries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = gallery_media.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view gallery media for accessible galleries"
  ON gallery_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = gallery_media.gallery_id
      AND (galleries.user_id = auth.uid() OR NOT galleries.is_invite_only)
    )
  );

-- Media uploads: delete and update for owners
CREATE POLICY "Users can delete own uploads"
  ON media_uploads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads"
  ON media_uploads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Referral codes: create own
CREATE POLICY "Users can create own referral code"
  ON referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Referrals: referrers can view
CREATE POLICY "Referrers can view their referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM referral_codes
      WHERE referral_codes.id = referrals.referrer_code_id
      AND referral_codes.user_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admins can view all access logs"
  ON access_attempt_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage all reports"
  ON reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view all uploads"
  ON media_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage all uploads"
  ON media_uploads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
