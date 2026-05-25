'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield, Upload, Users, AlertTriangle, Trash2, Ban, CheckCircle, XCircle, Loader2, Eye, Flag, Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';

type Tab = 'overview' | 'uploads' | 'users' | 'reports';

interface Stat { label: string; value: number; icon: React.ElementType; color: string }

export default function AdminPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stat[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading && (!profile || !profile.is_admin)) {
      router.replace('/');
    }
  }, [profile, isLoading, router]);

  const loadOverview = useCallback(async () => {
    const [up, us, sub, rep] = await Promise.all([
      (supabase.from('media_uploads') as any).select('id', { count: 'exact', head: true }),
      (supabase.from('profiles') as any).select('id', { count: 'exact', head: true }),
      (supabase.from('subscriptions') as any).select('id', { count: 'exact', head: true }).eq('status', 'active'),
      (supabase.from('reports') as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setStats([
      { label: 'Total Uploads', value: up.count ?? 0, icon: Upload, color: 'from-cyan-500 to-blue-600' },
      { label: 'Total Users', value: us.count ?? 0, icon: Users, color: 'from-emerald-500 to-teal-600' },
      { label: 'Active Subscriptions', value: sub.count ?? 0, icon: Shield, color: 'from-amber-500 to-orange-600' },
      { label: 'Pending Reports', value: rep.count ?? 0, icon: AlertTriangle, color: 'from-red-500 to-pink-600' },
    ]);
  }, []);

  const loadUploads = useCallback(async () => {
    const { data } = await (supabase.from('media_uploads') as any)
      .select('id, original_filename, file_type, file_size_bytes, is_encrypted, is_destroyed, created_at, view_count')
      .order('created_at', { ascending: false }).limit(30);
    setUploads(data ?? []);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await (supabase.from('profiles') as any)
      .select('id, email, is_banned, is_admin, storage_used_bytes, created_at')
      .order('created_at', { ascending: false }).limit(30);
    setUsers(data ?? []);
  }, []);

  const loadReports = useCallback(async () => {
    const { data } = await (supabase.from('reports') as any)
      .select('id, reason, details, status, created_at, upload_id')
      .order('created_at', { ascending: false }).limit(30);
    setReports(data ?? []);
  }, []);

  useEffect(() => {
    if (!profile?.is_admin) return;
    setLoading(true);
    const loaders: Record<Tab, () => Promise<void>> = {
      overview: loadOverview,
      uploads: loadUploads,
      users: loadUsers,
      reports: loadReports,
    };
    loaders[tab]().finally(() => setLoading(false));
  }, [tab, profile?.is_admin, loadOverview, loadUploads, loadUsers, loadReports]);

  async function deleteUpload(id: string) {
    if (!confirm('Delete this upload permanently?')) return;
    await (supabase.from('media_uploads') as any).update({ is_destroyed: true, destroyed_at: new Date().toISOString() }).eq('id', id);
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }

  async function toggleBan(user: any) {
    const newVal = !user.is_banned;
    await (supabase.from('profiles') as any).update({ is_banned: newVal }).eq('id', user.id);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_banned: newVal } : u)));
  }

  async function updateReportStatus(id: string, status: string) {
    await (supabase.from('reports') as any).update({ status, reviewed_by: profile?.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (isLoading || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: Shield },
    { key: 'uploads', label: 'Uploads', icon: Upload },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'reports', label: 'Reports', icon: AlertTriangle },
  ];

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <div className="min-h-screen bg-[#080B14]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-space">Admin Dashboard</h1>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {tab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-white/40">{s.label}</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{s.value}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {tab === 'uploads' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search uploads..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40">File</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Size</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Views</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-white/40">Action</th>
                      </tr></thead>
                      <tbody>
                        {uploads.filter(u => u.original_filename.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
                          <tr key={u.id} className="border-b border-white/[0.04] last:border-0">
                            <td className="px-4 py-3 text-sm text-white/70 max-w-[200px] truncate">{u.original_filename}</td>
                            <td className="px-4 py-3 text-sm text-white/40">{u.file_type}</td>
                            <td className="px-4 py-3 text-sm text-white/40">{formatSize(u.file_size_bytes)}</td>
                            <td className="px-4 py-3 text-sm text-white/40 flex items-center gap-1"><Eye className="w-3 h-3" />{u.view_count}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_destroyed ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {u.is_destroyed ? 'Destroyed' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button size="sm" variant="ghost" onClick={() => deleteUpload(u.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Storage</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-white/40">Joined</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-white/40">Action</th>
                    </tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-4 py-3 text-sm text-white/70">{u.email ?? u.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm text-white/40">{u.is_admin ? 'Admin' : 'User'}</td>
                          <td className="px-4 py-3 text-sm text-white/40">{formatSize(u.storage_used_bytes || 0)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_banned ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {u.is_banned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="ghost" onClick={() => toggleBan(u)} className={u.is_banned ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-500/10'}>
                              {u.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-white/30">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'reports' && (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Flag className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-sm text-white/70">{r.reason}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          r.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-white/[0.06] text-white/40'
                        }`}>{r.status}</span>
                      </div>
                      {r.details && <p className="text-xs text-white/30 ml-6">{r.details}</p>}
                      <p className="text-xs text-white/30 ml-6 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => updateReportStatus(r.id, 'approved')} className="text-emerald-400 hover:bg-emerald-500/10">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateReportStatus(r.id, 'dismissed')} className="text-white/40 hover:text-white/60 hover:bg-white/[0.06]">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-12 text-sm text-white/30">No reports found</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
