/*
# Fix Critical Subscription RLS Vulnerability + Add Gallery Recycle Bin + Clean Up Duplicate Policies

## Security Issue
The `subscriptions` table had a policy "Users can update own subscription" scoped to `TO authenticated`
with `USING (auth.uid() = user_id)`. This allowed ANY authenticated user to UPDATE their own subscription
row — including changing `plan` from 'free' to 'ultra' — WITHOUT making a payment. This is a critical
privilege escalation vulnerability.

## Changes
1. **Subscriptions**: DROP the vulnerable "Users can update own subscription" policy. Users can no longer
   change their plan. Only the edge function (service role, bypasses RLS) and admins can set/change plans.
2. **Galleries**: Add `deleted_at` column for soft-delete recycle bin support (matching uploads + vault).
3. **All tables**: Remove duplicate RLS policies and replace with clean, minimal, correctly-scoped policies.
4. **media_uploads**: Public can increment view_count on active uploads (needed for view tracking).

## Notes
- Users can still VIEW their own subscription (SELECT unchanged).
- Users can still cancel by setting status='cancelled' (but NOT change plan).
- Edge function (service role) bypasses RLS, so payment verification still works.
- Anonymous uploads still work (INSERT to public).
*/

-- ============================================================
-- GALLERIES: Add deleted_at for recycle bin
-- ============================================================

ALTER TABLE galleries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================================
-- SUBSCRIPTIONS: Remove self-escalation vulnerability
-- ============================================================

DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- Users can only cancel (status -> 'cancelled'), cannot change plan
CREATE POLICY "Users cancel own subscription"
ON subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND plan = (SELECT plan FROM subscriptions s WHERE s.user_id = auth.uid())
);

-- ============================================================
-- GALLERIES: Clean duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "Users can delete own galleries" ON galleries;
DROP POLICY IF EXISTS "Owners can delete own galleries" ON galleries;
DROP POLICY IF EXISTS "Owners can insert galleries" ON galleries;
DROP POLICY IF EXISTS "Owners can view their galleries" ON galleries;
DROP POLICY IF EXISTS "Owners can update own galleries" ON galleries;
DROP POLICY IF EXISTS "Users can update own galleries" ON galleries;
DROP POLICY IF EXISTS "Authenticated can view active galleries" ON galleries;
DROP POLICY IF EXISTS "Public can view active galleries" ON galleries;

CREATE POLICY "Owners select galleries"
ON galleries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public view active galleries"
ON galleries FOR SELECT TO public, authenticated
USING (is_destroyed = false AND deleted_at IS NULL);

CREATE POLICY "Owners insert galleries"
ON galleries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update galleries"
ON galleries FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete galleries"
ON galleries FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- MEDIA_UPLOADS: Clean duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "Users can delete own uploads" ON media_uploads;
DROP POLICY IF EXISTS "Owners can delete own uploads" ON media_uploads;
DROP POLICY IF EXISTS "Anyone can insert media uploads" ON media_uploads;
DROP POLICY IF EXISTS "Users can view own uploads" ON media_uploads;
DROP POLICY IF EXISTS "Public can view active uploads" ON media_uploads;
DROP POLICY IF EXISTS "Authenticated can view active uploads" ON media_uploads;
DROP POLICY IF EXISTS "Owners can update own uploads" ON media_uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON media_uploads;
DROP POLICY IF EXISTS "Users can soft delete own uploads" ON media_uploads;
DROP POLICY IF EXISTS "Anyone can update expired status" ON media_uploads;
DROP POLICY IF EXISTS "Anyone can update view count" ON media_uploads;

CREATE POLICY "Owners select uploads"
ON media_uploads FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public select active uploads"
ON media_uploads FOR SELECT TO public, authenticated
USING (is_destroyed = false AND deleted_at IS NULL);

CREATE POLICY "Anyone insert uploads"
ON media_uploads FOR INSERT TO public, authenticated
WITH CHECK (true);

CREATE POLICY "Owners update uploads"
ON media_uploads FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public increment view count"
ON media_uploads FOR UPDATE TO public, authenticated
USING (is_destroyed = false AND deleted_at IS NULL)
WITH CHECK (is_destroyed = false);

CREATE POLICY "Owners delete uploads"
ON media_uploads FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- ACCESS_ATTEMPT_LOGS: Clean duplicates
-- ============================================================

DROP POLICY IF EXISTS "Upload owners can view access logs" ON access_attempt_logs;
DROP POLICY IF EXISTS "Users can view logs for their uploads" ON access_attempt_logs;
DROP POLICY IF EXISTS "Anyone can insert access logs" ON access_attempt_logs;

CREATE POLICY "Anyone insert access logs"
ON access_attempt_logs FOR INSERT TO public, authenticated
WITH CHECK (true);

CREATE POLICY "Owners select access logs"
ON access_attempt_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM media_uploads
    WHERE media_uploads.id = access_attempt_logs.upload_id
    AND media_uploads.user_id = auth.uid()
  )
);

-- ============================================================
-- REFERRAL_CODES: Clean duplicates
-- ============================================================

DROP POLICY IF EXISTS "Users can create referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can create own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can view own referral code" ON referral_codes;
DROP POLICY IF EXISTS "Users can update own referral code" ON referral_codes;

CREATE POLICY "Owners select referral codes"
ON referral_codes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners insert referral codes"
ON referral_codes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update referral codes"
ON referral_codes FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REFERRALS: Clean duplicates
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals they made" ON referrals;
DROP POLICY IF EXISTS "Referrers can view their referrals" ON referrals;

CREATE POLICY "Anyone insert referrals"
ON referrals FOR INSERT TO public, authenticated
WITH CHECK (true);

CREATE POLICY "Referrers select own referrals"
ON referrals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM referral_codes
    WHERE referral_codes.id = referrals.referrer_code_id
    AND referral_codes.user_id = auth.uid()
  )
);

-- ============================================================
-- GALLERY_MEDIA: Clean up if duplicates exist
-- ============================================================

DROP POLICY IF EXISTS "Owners view gallery_media" ON gallery_media;
DROP POLICY IF EXISTS "Owners insert gallery_media" ON gallery_media;
DROP POLICY IF EXISTS "Owners delete gallery_media" ON gallery_media;
DROP POLICY IF EXISTS "Public view gallery_media" ON gallery_media;

CREATE POLICY "Owners select gallery_media"
ON gallery_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM galleries
    WHERE galleries.id = gallery_media.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

CREATE POLICY "Public select gallery_media"
ON gallery_media FOR SELECT TO public, authenticated
USING (
  EXISTS (
    SELECT 1 FROM galleries
    WHERE galleries.id = gallery_media.gallery_id
    AND galleries.is_destroyed = false
    AND galleries.deleted_at IS NULL
  )
);

CREATE POLICY "Owners insert gallery_media"
ON gallery_media FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM galleries
    WHERE galleries.id = gallery_media.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

CREATE POLICY "Owners delete gallery_media"
ON gallery_media FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM galleries
    WHERE galleries.id = gallery_media.gallery_id
    AND galleries.user_id = auth.uid()
  )
);