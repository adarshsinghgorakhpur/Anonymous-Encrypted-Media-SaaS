// Centralized plan configuration - source of truth for all subscription limits

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  period: string;
  storageLimit: number;
  maxUploadSize: number;
  allowVideo: boolean;
  allowScheduledUnlock: boolean;
  allowAdvancedAnalytics: boolean;
  allowNoAds: boolean;
  allowPrioritySupport: boolean;
  allowUnlimitedGalleries: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceDisplay: '$0',
    period: '/mo',
    storageLimit: 50 * 1024 * 1024, // 50MB
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    allowVideo: false,
    allowScheduledUnlock: false,
    allowAdvancedAnalytics: false,
    allowNoAds: false,
    allowPrioritySupport: false,
    allowUnlimitedGalleries: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9,
    priceDisplay: '$9',
    period: '/mo',
    storageLimit: 20 * 1024 * 1024 * 1024, // 20GB
    maxUploadSize: 500 * 1024 * 1024, // 500MB
    allowVideo: true,
    allowScheduledUnlock: true,
    allowAdvancedAnalytics: true,
    allowNoAds: true,
    allowPrioritySupport: true,
    allowUnlimitedGalleries: true,
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra',
    price: 29,
    priceDisplay: '$29',
    period: '/mo',
    storageLimit: Infinity, // Unlimited
    maxUploadSize: 500 * 1024 * 1024, // 500MB
    allowVideo: true,
    allowScheduledUnlock: true,
    allowAdvancedAnalytics: true,
    allowNoAds: true,
    allowPrioritySupport: true,
    allowUnlimitedGalleries: true,
  },
} as const;

export function getPlan(planId: string): PlanConfig {
  return PLANS[planId] || PLANS.free;
}

export function getStorageLimit(planId: string): number {
  return getPlan(planId).storageLimit;
}

export function getMaxUploadSize(planId: string): number {
  return getPlan(planId).maxUploadSize;
}

export function canUploadVideo(planId: string): boolean {
  return getPlan(planId).allowVideo;
}

export function canUseScheduledUnlock(planId: string): boolean {
  return getPlan(planId).allowScheduledUnlock;
}

export function isPremium(planId: string): boolean {
  return planId === 'pro' || planId === 'ultra';
}

export function isUltra(planId: string): boolean {
  return planId === 'ultra';
}
