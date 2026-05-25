'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setSubscription, setIsPremium, setIsLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        (async () => {
          const [profileRes, subRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
            supabase.from('subscriptions').select('*').eq('user_id', session.user.id).eq('status', 'active').maybeSingle(),
          ]);
          setProfile(profileRes.data as any);
          setSubscription(subRes.data as any);
          setIsPremium(
            subRes.data?.plan !== 'free' && subRes.data?.plan != null
          );
        })();
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        (async () => {
          const [profileRes, subRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
            supabase.from('subscriptions').select('*').eq('user_id', session.user.id).eq('status', 'active').maybeSingle(),
          ]);
          setProfile(profileRes.data as any);
          setSubscription(subRes.data as any);
          setIsPremium(
            subRes.data?.plan !== 'free' && subRes.data?.plan != null
          );
        })();
      } else {
        setProfile(null);
        setSubscription(null);
        setIsPremium(false);
      }

      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
