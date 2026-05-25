export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  is_banned: boolean;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface MediaUpload {
  id: string;
  access_code: string;
  user_id?: string;
  is_anonymous: boolean;
  title?: string;
  description?: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  storage_path: string;
  thumbnail_path?: string;
  is_encrypted: boolean;
  encryption_iv?: string;
  encryption_salt?: string;
  encryption_password?: string;
  password_hash?: string;
  password_hint?: string;
  burn_after_views?: number;
  view_count: number;
  expires_at?: string;
  is_destroyed: boolean;
  destroyed_at?: string;
  unlock_at?: string;
  is_one_time: boolean;
  width?: number;
  height?: number;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface VaultNote {
  id: string;
  user_id: string;
  title: string;
  encrypted_content: string;
  encryption_iv: string;
  encryption_salt: string;
  is_password_protected: boolean;
  password_hash?: string;
  password_hint?: string;
  expires_at?: string;
  is_destroyed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: string;
  user_id: string;
  access_code: string;
  title: string;
  description?: string;
  password_hash?: string;
  is_invite_only: boolean;
  expires_at?: string;
  is_destroyed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  provider?: string;
  provider_subscription_id?: string;
  provider_customer_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  id: string;
  upload_id?: string;
  event_type: string;
  ip_hash?: string;
  user_agent?: string;
  referrer?: string;
  country?: string;
  created_at: string;
}

export interface Report {
  id: string;
  upload_id?: string;
  reporter_user_id?: string;
  reporter_ip_hash?: string;
  reason: string;
  details?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface AccessAttemptLog {
  id: string;
  upload_id?: string;
  viewer_user_id?: string;
  is_successful: boolean;
  password_attempt: boolean;
  ip_hash?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses: number;
  bonus_storage_bytes: number;
  bonus_premium_days: number;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_code_id?: string;
  referred_user_id?: string;
  is_successful: boolean;
  created_at: string;
}
