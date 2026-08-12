import { supabase } from './supabase/client';

export function formatStorage(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes === Infinity) return 'Unlimited';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface ProfileData {
  profile: any | null;
  subscription: any | null;
  isPremium: boolean;
}

export async function loadProfileAndSubscription(userId: string): Promise<ProfileData> {
  const [profileRes, subRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle(),
  ]);
  return {
    profile: profileRes.data,
    subscription: subRes.data,
    isPremium: subRes.data?.plan !== 'free' && subRes.data?.plan != null,
  };
}

export function parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } {
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Other';

  const os = /Windows/.test(ua) ? 'Windows'
    : /Mac OS|Macintosh/.test(ua) ? 'macOS'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iOS/.test(ua) ? 'iOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'Other';

  const deviceType = /Mobile|Android|iPhone/.test(ua) ? 'Mobile'
    : /iPad|Tablet/.test(ua) ? 'Tablet'
    : 'Desktop';

  return { browser, os, deviceType };
}

export async function trackEvent(eventType: string, uploadId?: string, extra?: Record<string, any>): Promise<void> {
  try {
    const ua = navigator.userAgent;
    const parsed = parseUserAgent(ua);
    await (supabase.from('analytics') as any).insert({
      upload_id: uploadId,
      event_type: eventType,
      user_agent: ua,
      browser: parsed.browser,
      os: parsed.os,
      device_type: parsed.deviceType,
      ...extra,
    });
  } catch {}
}

const SHARE_PLATFORMS = {
  whatsapp: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
  telegram: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  email: (url: string, text: string) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
  twitter: (url: string, text: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
};

export function getShareLink(platform: keyof typeof SHARE_PLATFORMS, url: string, text: string = 'Check out this encrypted file on XCrypt'): string {
  return SHARE_PLATFORMS[platform](url, text);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
