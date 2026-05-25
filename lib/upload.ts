import { supabase } from './supabase/client';
import { encryptFile, hashPassword, ENCRYPTION_SIZE_LIMIT } from './crypto';
import { generateAccessCode } from './access-code';
import { compressImage, getFileDimensions, getVideoDuration } from './compression';

export interface UploadOptions {
  password?: string;
  passwordHint?: string;
  expiresIn?: number | null;
  burnAfterViews?: number | null;
  isOneTime?: boolean;
  unlockAt?: string | null;
  title?: string;
  userId?: string | null;
  onProgress?: (progress: number) => void;
  onStage?: (stage: string) => void;
}

export interface UploadResult {
  accessCode: string;
  shareUrl: string;
  isEncrypted: boolean;
  encryptionPassword?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm'];
const FREE_MAX_FILE_SIZE = 10 * 1024 * 1024;
const PRO_MAX_FILE_SIZE = 500 * 1024 * 1024;
const FREE_STORAGE_LIMIT = 50 * 1024 * 1024;
const PRO_STORAGE_LIMIT = 20 * 1024 * 1024 * 1024;

export function getStorageLimit(plan: string): number {
  if (plan === 'ultra') return Infinity;
  if (plan === 'pro') return PRO_STORAGE_LIMIT;
  return FREE_STORAGE_LIMIT;
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function validateFile(file: File, plan: string): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) return `Unsupported file type: ${file.type}`;

  const isPremium = plan !== 'free';
  if (isVideo && !isPremium) return 'Video uploads require a Pro or Ultra plan';

  const maxSize = isPremium ? PRO_MAX_FILE_SIZE : FREE_MAX_FILE_SIZE;
  if (file.size > maxSize) return `File too large. Max: ${isPremium ? '500MB' : '10MB'}`;

  return null;
}

export async function checkStorageLimit(userId: string | null | undefined, fileSize: number): Promise<{ allowed: boolean; message?: string }> {
  if (!userId) return { allowed: true };

  const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', userId).maybeSingle();
  const plan = sub?.plan || 'free';
  if (plan === 'ultra') return { allowed: true };

  const limit = getStorageLimit(plan);
  const { data: profile } = await supabase.from('profiles').select('storage_used_bytes').eq('id', userId).maybeSingle();
  const used = profile?.storage_used_bytes || 0;

  if (used + fileSize > limit) {
    const remaining = Math.max(0, limit - used);
    return { allowed: false, message: `Storage limit exceeded. You have ${formatStorage(remaining)} remaining. Upgrade for more storage.` };
  }

  return { allowed: true };
}

export async function uploadMedia(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { password, passwordHint, expiresIn, burnAfterViews, isOneTime, unlockAt, title, userId, onProgress, onStage } = options;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = authData.user;
  const resolvedUserId = authUser?.id ?? userId ?? null;
  console.debug('[XCrypt Upload] Authenticated user:', {
    hasSession: !!sessionData.session,
    sessionUserId: sessionData.session?.user?.id ?? null,
    authUserId: authUser?.id ?? null,
    providedUserId: userId ?? null,
    resolvedUserId,
  });
  if (authUser?.id && userId && authUser.id !== userId) {
    console.warn('[XCrypt Upload] userId mismatch between store and auth session. Using auth user id.', { authUserId: authUser.id, providedUserId: userId });
  }
  if (authError) {
    console.error('[XCrypt Upload] Failed to resolve auth user:', authError);
  }

  onStage?.('Checking storage...');
  onProgress?.(2);

  if (resolvedUserId) {
    const limit = await checkStorageLimit(resolvedUserId, file.size);
    if (!limit.allowed) {
      throw new Error(limit.message || 'Storage limit exceeded');
    }
  }

  onStage?.('Compressing...');
  onProgress?.(5);

  let processedFile = file;
  const fileType = file.type.startsWith('video/') ? 'video' : 'image';

  if (fileType === 'image') {
    processedFile = await compressImage(file, { maxSizeMB: 8, maxWidthOrHeight: 4096 });
  }

  onProgress?.(15);

  const dims = fileType === 'image' ? await getFileDimensions(processedFile) : null;
  const duration = fileType === 'video' ? await getVideoDuration(processedFile) : null;

  const shouldEncrypt = processedFile.size <= ENCRYPTION_SIZE_LIMIT;
  let uploadBlob: Blob = processedFile;
  let encryptionIv: string | null = null;
  let encryptionSalt: string | null = null;
  let encryptionPassword: string | undefined;

  if (shouldEncrypt) {
    onStage?.('Encrypting...');
    onProgress?.(25);
    const result = await encryptFile(processedFile, password);
    uploadBlob = result.encryptedBlob;
    encryptionIv = result.iv;
    encryptionSalt = result.salt;
    encryptionPassword = result.password;
  }

  onStage?.('Uploading...');
  onProgress?.(35);

  const accessCode = generateAccessCode();
  const randomSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const extension = processedFile.name.split('.').pop() || 'bin';
  const storagePath = `${fileType === 'video' ? 'videos' : shouldEncrypt ? 'encrypted-media' : 'images'}/${accessCode}_${randomSuffix}.${shouldEncrypt ? 'enc' : extension}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from('xcrypt-media')
    .upload(storagePath, uploadBlob, { cacheControl: '3600', upsert: false });

  console.debug('[XCrypt Upload] Storage upload response:', {
    storagePath,
    mimeType: processedFile.type,
    encryptedSize: uploadBlob.size,
    encrypted: shouldEncrypt,
    ivLength: encryptionIv ? atob(encryptionIv).length : 0,
    saltLength: encryptionSalt ? atob(encryptionSalt).length : 0,
    storageResponsePath: storageData?.path ?? null,
  });

  if (storageError) {
    throw new Error(`Storage upload failed: ${storageError.message}`);
  }

  onProgress?.(80);
  onStage?.('Saving...');

  const passwordHash = password ? await hashPassword(password) : null;

  const expiresAt = expiresIn != null
    ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
    : resolvedUserId == null
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const record = {
    access_code: accessCode,
    user_id: resolvedUserId,
    is_anonymous: !resolvedUserId,
    original_filename: file.name,
    file_type: fileType,
    mime_type: processedFile.type,
    file_size_bytes: processedFile.size,
    storage_path: storagePath,
    is_encrypted: shouldEncrypt,
    encryption_iv: encryptionIv,
    encryption_salt: encryptionSalt,
    encryption_password: shouldEncrypt && !password ? encryptionPassword : null,
    password_hash: passwordHash,
    password_hint: passwordHint || null,
    burn_after_views: burnAfterViews || null,
    is_one_time: isOneTime || false,
    unlock_at: unlockAt || null,
    expires_at: expiresAt,
    title: title || file.name,
    width: dims?.width || null,
    height: dims?.height || null,
    duration_seconds: duration || null,
  };

  console.debug('[XCrypt Upload] Insert payload:', {
    access_code: record.access_code,
    user_id: record.user_id,
    storage_path: record.storage_path,
    mime_type: record.mime_type,
    is_encrypted: record.is_encrypted,
  });

  const { data: insertedRows, error: dbError } = await (supabase.from('media_uploads') as any)
    .insert(record)
    .select('id')
    .limit(1);

  console.debug('[XCrypt Upload] Insert response:', insertedRows);
  if (dbError) console.error('[XCrypt Upload] Insert error:', dbError);

  if (dbError) {
    await supabase.storage.from('xcrypt-media').remove([storagePath]);
    throw new Error(`Database save failed: ${dbError.message}`);
  }

  if (resolvedUserId) {
    const { data: profile } = await supabase.from('profiles').select('storage_used_bytes').eq('id', resolvedUserId).maybeSingle();
    const currentUsage = profile?.storage_used_bytes || 0;
    await (supabase.from('profiles') as any)
      .update({ storage_used_bytes: currentUsage + processedFile.size })
      .eq('id', resolvedUserId);
  }

  onProgress?.(100);
  onStage?.('Complete');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    accessCode,
    shareUrl: `${baseUrl}/view/${accessCode}`,
    isEncrypted: shouldEncrypt,
    encryptionPassword,
  };
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('xcrypt-media')
    .createSignedUrl(storagePath, 3600);

  if (error || !data) {
    throw new Error('Failed to get signed URL');
  }

  return data.signedUrl;
}

export async function destroyUpload(uploadId: string, storagePath: string) {
  await supabase.storage.from('xcrypt-media').remove([storagePath]);
  await (supabase.from('media_uploads') as any)
    .update({ is_destroyed: true, destroyed_at: new Date().toISOString() })
    .eq('id', uploadId);
}

export function parseUserAgent(ua: string) {
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'Desktop';

  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  if (/Mobi|Android.*Mobile|iPhone/.test(ua)) deviceType = 'Mobile';
  else if (/iPad|Tablet/.test(ua)) deviceType = 'Tablet';

  return { browser, os, deviceType };
}
