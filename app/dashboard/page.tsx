'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Upload, Eye, HardDrive, CreditCard, Crown, Plus, Shield, Clock, Globe, Monitor, Calendar, Zap, TrendingUp, BarChart3, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { formatStorage } from '@/lib/shared';
import { getStorageLimit, isPremium as checkIsPremium, isUltra } from '@/lib/plans';
import { formatAccessCode } from '@/lib/access-code';
import type { MediaUpload, AccessAttemptLog } from '@/lib/supabase/types';

interface DeviceStats { browser: Record<string, number>; os: Record<string, number>; deviceType: Record<string, number>; }
interface PeriodStats { daily: number; weekly: number; monthly: number; }

export default function DashboardPage() {
  const { user, profile, isPremium, subscription } = useAuthStore();
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [topUploads, setTopUploads] = useState<MediaUpload[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessAttemptLog[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalUploads, setTotalUploads] = useState(0);
  const [totalDecryptions, setTotalDecryptions] = useState(0);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ browser: {}, os: {}, deviceType: {} });
  const [periodStats, setPeriodStats] = useState<PeriodStats>({ daily: 0, weekly: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const allUploadsRes = await (supabase.from('media_uploads') as any)
        .select('id, view_count')
        .eq('user_id', user.id)
        .eq('is_destroyed', false)
        .is('deleted_at', null);

      if (cancelled) return;
      const viewsTotal = (allUploadsRes.data || []).reduce((sum: number, u: any) => sum + (u.view_count || 0), 0);
      setTotalViews(viewsTotal);

      const uploadsRes = await (supabase.from('media_uploads') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_destroyed', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (cancelled) return;

      const uploadCountRes = await (supabase.from('media_uploads') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_destroyed', false)
        .is('deleted_at', null);

      if (cancelled) return;
      setTotalUploads(uploadCountRes.count || 0);
      setUploads(uploadsRes.data || []);

      // Top viewed uploads
      const topRes = await (supabase.from('media_uploads') as any)
        .select('id, original_filename, view_count, access_code, file_size_bytes')
        .eq('user_id', user.id)
        .eq('is_destroyed', false)
        .is('deleted_at', null)
        .order('view_count', { ascending: false })
        .limit(5);

      if (cancelled) return;
      setTopUploads(topRes.data || []);

      const uploadIds = (uploadsRes.data || []).map((u: any) => u.id);
      if (uploadIds.length > 0) {
        const logsRes = await (supabase.from('access_attempt_logs') as any)
          .select('*')
          .in('upload_id', uploadIds)
          .order('created_at', { ascending: false })
          .limit(10);
        if (cancelled) return;
        setAccessLogs(logsRes.data || []);

        // Aggregate device/browser/OS stats from access logs
        const logs = logsRes.data || [];
        const browser: Record<string, number> = {};
        const os: Record<string, number> = {};
        const deviceType: Record<string, number> = {};
        logs.forEach((log: any) => {
          if (log.browser) browser[log.browser] = (browser[log.browser] || 0) + 1;
          if (log.os) os[log.os] = (os[log.os] || 0) + 1;
          if (log.device_type) deviceType[log.device_type] = (deviceType[log.device_type] || 0) + 1;
        });
        setDeviceStats({ browser, os, deviceType });
      }

      // Total decryptions (analytics events with type 'view')
      const decRes = await (supabase.from('analytics') as any)
        .select('id', { count: 'exact', head: true })
        .in('upload_id', (allUploadsRes.data || []).map((u: any) => u.id))
        .eq('event_type', 'view');
      if (cancelled) return;
      setTotalDecryptions(decRes.count || 0);

      // Period stats: uploads in last day/week/month
      const now = Date.now();
      const dayAgo = new Date(now - 86400000).toISOString();
      const weekAgo = new Date(now - 604800000).toISOString();
      const monthAgo = new Date(now - 2592000000).toISOString();

      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        (supabase.from('media_uploads') as any).select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayAgo),
        (supabase.from('media_uploads') as any).select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekAgo),
        (supabase.from('media_uploads') as any).select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthAgo),
      ]);
      if (cancelled) return;
      setPeriodStats({ daily: dailyRes.count || 0, weekly: weeklyRes.count || 0, monthly: monthlyRes.count || 0 });

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  const plan = subscription?.plan || 'free';
  const storageUsed = profile?.storage_used_bytes || 0;
  const storageLimit = getStorageLimit(plan);
  const userIsPremium = checkIsPremium(plan);
  const userIsUltra = isUltra(plan);
  const usagePercent = storageLimit === Infinity ? 0 : Math.min(100, (storageUsed / storageLimit) * 100);
  const expiryDate = subscription?.current_period_end;
  const planStatus = subscription?.status || 'active';

  const stats = [
    { label: 'Total Uploads', value: totalUploads, icon: Upload, color: 'from-cyan-500 to-blue-600' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'from-emerald-500 to-teal-600' },
    { label: 'Storage Used', value: formatStorage(storageUsed), icon: HardDrive, color: 'from-amber-500 to-orange-600' },
    { label: 'Plan', value: plan === 'ultra' ? 'Ultra' : userIsPremium ? 'Pro' : 'Free', icon: CreditCard, color: 'from-rose-500 to-pink-600' },
  ];

  const periodCards = [
    { label: 'Today', value: periodStats.daily, icon: Clock },
    { label: 'This Week', value: periodStats.weekly, icon: Calendar },
    { label: 'This Month', value: periodStats.monthly, icon: TrendingUp },
    { label: 'Decryptions', value: totalDecryptions, icon: Shield },
  ];

  function renderStatBars(data: Record<string, number>, total: number) {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([key, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/60">{key}</span>
              <span className="text-white/30">{count}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      });
  }

  const totalBrowser = Object.values(deviceStats.browser).reduce((a, b) => a + b, 0);
  const totalOs = Object.values(deviceStats.os).reduce((a, b) => a + b, 0);
  const totalDevice = Object.values(deviceStats.deviceType).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white font-space">Welcome, {profile?.display_name || user?.email?.split('@')[0] || 'User'}</h1>

      {/* Core Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs text-white/40">{s.label}</p>
            <p className="text-lg font-semibold text-white mt-0.5">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {periodCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon className="w-3.5 h-3.5 text-white/40" />
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Subscription Panel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white font-space flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Subscription
          </h2>
          {!userIsPremium && (
            <Link href="/pricing" className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-medium hover:opacity-90 transition">
              Upgrade
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-white/40 mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${userIsUltra ? 'text-amber-400' : userIsPremium ? 'text-cyan-400' : 'text-white'}`}>
                {plan === 'ultra' ? 'Ultra' : userIsPremium ? 'Pro' : 'Free'}
              </span>
              {userIsUltra && <Zap className="w-4 h-4 text-amber-400" />}
              {userIsPremium && !userIsUltra && <Crown className="w-4 h-4 text-cyan-400" />}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Storage</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">{formatStorage(storageUsed)}</span>
              <span className="text-xs text-white/30">/</span>
              <span className="text-sm text-white/50">
                {storageLimit === Infinity ? 'Unlimited' : formatStorage(storageLimit)}
              </span>
            </div>
            {storageLimit !== Infinity && (
              <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-500 to-blue-600'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${planStatus === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                {planStatus === 'active' ? 'Active' : 'Inactive'}
              </span>
              {expiryDate && userIsPremium && (
                <span className="text-xs text-white/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {!userIsPremium && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-white font-medium">Upgrade to Pro</p>
              <p className="text-sm text-white/50">Unlock galleries, vault notes, video uploads, and 20GB storage</p>
            </div>
          </div>
          <Link href="/pricing" className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition">Upgrade</Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Uploads */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <h2 className="text-base font-semibold text-white font-space">Recent Uploads</h2>
            <Link href="/upload" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition">
              <Plus className="w-3.5 h-3.5" />New
            </Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-white/30 text-sm">Loading...</div>
          ) : uploads.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">No uploads yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{u.original_filename}</p>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <span>{formatStorage(u.file_size_bytes)}</span>
                      <span>&middot;</span>
                      <span>{formatAccessCode(u.access_code)}</span>
                      {u.is_one_time && <span className="text-amber-400/60">One-time</span>}
                      {u.unlock_at && <span className="text-cyan-400/60">Scheduled</span>}
                    </div>
                  </div>
                  <div className="text-xs text-white/40 flex items-center gap-1.5"><Eye className="w-3 h-3" />{u.view_count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Viewed Uploads */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white font-space">Top Viewed</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-white/30 text-sm">Loading...</div>
          ) : topUploads.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">No data yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {topUploads.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-white/30 w-4 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{u.original_filename}</p>
                      <p className="text-xs text-white/30">{formatStorage(u.file_size_bytes)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-white/40 flex items-center gap-1.5 shrink-0"><Eye className="w-3 h-3" />{u.view_count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analytics: Browser / OS / Device */}
      {totalBrowser > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-medium text-white">Browsers</h3>
            </div>
            <div className="space-y-2">{renderStatBars(deviceStats.browser, totalBrowser)}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-medium text-white">Operating Systems</h3>
            </div>
            <div className="space-y-2">{renderStatBars(deviceStats.os, totalOs)}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-medium text-white">Devices</h3>
            </div>
            <div className="space-y-2">{renderStatBars(deviceStats.deviceType, totalDevice)}</div>
          </motion.div>
        </div>
      )}

      {/* Access Log */}
      {accessLogs.length > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white font-space">Recent Activity</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {accessLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${log.is_successful ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {log.is_successful ? 'Access' : 'Failed'}
                    </span>
                    {log.password_attempt && <span className="text-xs text-amber-400/60">Password attempt</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30 mt-1">
                    {log.browser && <span className="flex items-center gap-0.5"><Globe className="w-3 h-3" />{log.browser}</span>}
                    {log.os && <span className="flex items-center gap-0.5"><Monitor className="w-3 h-3" />{log.os}</span>}
                    {log.device_type && <span>{log.device_type}</span>}
                  </div>
                </div>
                <span className="text-xs text-white/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{new Date(log.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
