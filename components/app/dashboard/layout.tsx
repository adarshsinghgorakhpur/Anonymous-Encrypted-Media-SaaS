'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Upload, Image, Lock, Home, Shield, Menu, X, Crown, HardDrive, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { Navbar } from '@/components/layout/navbar';
import { formatStorage, getStorageLimit } from '@/lib/upload';

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/uploads', label: 'Uploads', icon: Upload },
  { href: '/dashboard/gallery', label: 'Gallery', icon: Image },
  { href: '/dashboard/vault', label: 'Vault', icon: Lock },
  { href: '/dashboard/referral', label: 'Referrals', icon: Gift },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isPremium, setUser, setProfile, setSubscription, setIsPremium, setIsLoading, isLoading, subscription } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.replace('/login'); return; }
      setUser(u);

      (async () => {
        const [profileRes, subRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', u.id).maybeSingle(),
          supabase.from('subscriptions').select('*').eq('user_id', u.id).eq('status', 'active').maybeSingle(),
        ]);
        setProfile(profileRes.data as any);
        setSubscription(subRes.data as any);
        setIsPremium(subRes.data?.plan !== 'free' && subRes.data?.plan != null);
        setIsLoading(false);
      })();
    });
  }, [router, setUser, setProfile, setSubscription, setIsPremium, setIsLoading]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  const plan = subscription?.plan || (isPremium ? 'pro' : 'free');
  const storageUsed = profile?.storage_used_bytes || 0;
  const storageLimit = getStorageLimit(plan);
  const isUnlimited = storageLimit === Infinity;
  const storagePercent = isUnlimited ? 0 : Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  return (
    <div className="min-h-screen bg-[#080B14]">
      <Navbar />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:flex lg:flex-col lg:w-60 lg:top-16 lg:bottom-0 lg:left-0 bg-white/[0.02] border-r border-white/[0.06] p-4 gap-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${pathname === l.href ? 'bg-white/[0.06] text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`}>
            <l.icon className="w-4 h-4" />{l.label}
          </Link>
        ))}
        {profile?.is_admin && (
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-400 hover:bg-white/[0.04]">
            <Shield className="w-4 h-4" />Admin
          </Link>
        )}

        {/* Storage indicator */}
        <div className="mt-4 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage</span>
            {isPremium && <Crown className="w-3 h-3 text-amber-400" />}
          </div>
          {isUnlimited ? (
            <p className="text-xs text-white/40">Unlimited</p>
          ) : (
            <>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-1">
                {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
              </p>
              {storagePercent > 80 && (
                <Link href="/pricing" className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 block">
                  Upgrade for more
                </Link>
              )}
            </>
          )}
        </div>

        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04] mt-auto">
          <Home className="w-4 h-4" />Home
        </Link>
        {isPremium && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-amber-400"><Crown className="w-3.5 h-3.5" />{plan === 'ultra' ? 'Ultra' : 'Pro'}</div>
        )}
      </aside>

      {/* Mobile menu button */}
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/70">
        <Menu className="w-5 h-5" />
      </button>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }} className="fixed top-0 left-0 bottom-0 w-60 bg-[#0F1420] border-r border-white/[0.08] z-50 p-4 pt-6">
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/50"><X className="w-5 h-5" /></button>
              <div className="flex flex-col gap-1 mt-6">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${pathname === l.href ? 'bg-white/[0.06] text-white' : 'text-white/50 hover:text-white'}`}>
                    <l.icon className="w-4 h-4" />{l.label}
                  </Link>
                ))}
                {profile?.is_admin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-400"><Shield className="w-4 h-4" />Admin</Link>}
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white mt-auto"><Home className="w-4 h-4" />Home</Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="lg:ml-60 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
