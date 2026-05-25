'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Upload, Eye, HardDrive, CreditCard, Crown, Plus, Shield, Clock, Globe, Monitor } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { formatFileSize } from '@/lib/compression';
import { formatStorage, getStorageLimit } from '@/lib/upload';
import { formatAccessCode } from '@/lib/access-code';
import type { MediaUpload, AccessAttemptLog } from '@/lib/supabase/types';

export default function DashboardPage() {
  const { user, profile, isPremium, subscription } = useAuthStore();
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessAttemptLog[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      const uploadsRes = await (supabase.from('media_uploads') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_destroyed', false)
        .order('created_at', { ascending: false })
        .limit(5);

      setUploads(uploadsRes.data || []);

      const uploadIds = (uploadsRes.data || []).map((u: any) => u.id);

      if (uploadIds.length > 0) {
        const viewsRes = await (supabase.from('analytics') as any)
          .select('id', { count: 'exact', head: true })
          .in('upload_id', uploadIds);

        setTotalViews(viewsRes.count || 0);

        const logsRes = await (supabase.from('access_attempt_logs') as any)
          .select('*')
          .in('upload_id', uploadIds)
          .order('created_at', { ascending: false })
          .limit(10);

        setAccessLogs(logsRes.data || []);
      }

      setLoading(false);
    })();
  }, [user]);

  const plan = subscription?.plan || (isPremium ? 'pro' : 'free');
  const storageUsed = profile?.storage_used_bytes || 0;
  const storageLimit = getStorageLimit(plan);

  const stats = [
    { label: 'Total Uploads', value: uploads.length, icon: Upload, color: 'from-cyan-500 to-blue-600' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'from-emerald-500 to-teal-600' },
    { label: 'Storage Used', value: formatStorage(storageUsed), icon: HardDrive, color: 'from-amber-500 to-orange-600' },
    { label: 'Plan', value: plan === 'ultra' ? 'Ultra' : isPremium ? 'Pro' : 'Free', icon: CreditCard, color: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white font-space">Welcome, {profile?.display_name || user?.email?.split('@')[0] || 'User'}</h1>

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

      {!isPremium && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between">
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

      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white font-space">Recent Uploads</h2>
          <Link href="/upload" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition">
            <Plus className="w-3.5 h-3.5" />New Upload
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
                    <span>{formatFileSize(u.file_size_bytes)}</span>
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

      {accessLogs.length > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white font-space">Access Log</h2>
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
