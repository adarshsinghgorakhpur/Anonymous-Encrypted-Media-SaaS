'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { loadProfileAndSubscription } from '@/lib/shared';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setSubscription, setIsPremium, setIsLoading, user } = useAuthStore();
  const loadedUserId = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSubscription(null);
        setIsPremium(false);
        loadedUserId.current = null;
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setSubscription(null);
      setIsPremium(false);
      return;
    }
    if (loadedUserId.current === user.id) return;
    loadedUserId.current = user.id;

    (async () => {
      const data = await loadProfileAndSubscription(user.id);
      setProfile(data.profile);
      setSubscription(data.subscription);
      setIsPremium(data.isPremium);
      setIsLoading(false);
    })();
  }, [user]);

  return <>{children}</>;
}
