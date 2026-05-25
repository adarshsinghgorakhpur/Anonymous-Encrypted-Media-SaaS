import { create } from 'zustand';
import type { Profile, Subscription } from './supabase/types';

interface AuthState {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isPremium: boolean;
  isLoading: boolean;
  setUser: (user: any) => void;
  setSession: (session: any) => void;
  setProfile: (profile: Profile | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setIsPremium: (isPremium: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  subscription: null,
  isPremium: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setSubscription: (subscription) => set({ subscription }),
  setIsPremium: (isPremium) => set({ isPremium }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      user: null,
      session: null,
      profile: null,
      subscription: null,
      isPremium: false,
      isLoading: false,
    }),
}));

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'compressing' | 'encrypting' | 'uploading' | 'complete' | 'error';
  progress: number;
  result?: { accessCode: string; shareUrl: string; isEncrypted: boolean; encryptionPassword?: string };
  error?: string;
}

interface UploadState {
  queue: UploadItem[];
  addUpload: (item: UploadItem) => void;
  updateUpload: (id: string, updates: Partial<UploadItem>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  queue: [],
  addUpload: (item) =>
    set((state) => ({ queue: [...state.queue, item] })),
  updateUpload: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeUpload: (id) =>
    set((state) => ({ queue: state.queue.filter((item) => item.id !== id) })),
  clearCompleted: () =>
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== 'complete' && item.status !== 'error'),
    })),
}));
