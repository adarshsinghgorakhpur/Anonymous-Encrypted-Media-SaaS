'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, ExternalLink, Trash2, Upload, Eye, Clock, RotateCcw, X, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { formatStorage } from '@/lib/shared';
import { formatAccessCode } from '@/lib/access-code';
import { recalculateUserStorage } from '@/lib/upload';
import type { MediaUpload } from '@/lib/supabase/types';

export default function UploadsPage() {
  const { user } = useAuthStore();
  const [activeUploads, setActiveUploads] = useState<MediaUpload[]>([]);
  const [trashedUploads, setTrashedUploads] = useState<MediaUpload[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);

  const load = useCallback(() => {
    if (!user) {
      setActiveUploads([]);
      setTrashedUploads([]);
      setLoading(false);
      return;
    }

    // Load active uploads (not deleted)
    (supabase.from('media_uploads') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_destroyed', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (error) throw error;
        setActiveUploads(data || []);
      });

    // Load trashed uploads
    (supabase.from('media_uploads') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_destroyed', false)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (error) throw error;
        setTrashedUploads(data || []);
        setLoading(false);
      });
  }, [user]);

  useEffect(load, [load]);

  const filtered = activeUploads.filter((u) => u.original_filename.toLowerCase().includes(search.toLowerCase()));

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/view/${code}`);
  }

  async function softDeleteUpload(u: MediaUpload) {
    if (!confirm('Move this upload to trash? It will be permanently deleted after 30 days.')) return;
    const { error } = await (supabase.from('media_uploads') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', u.id);
    if (error) throw error;
    load();
  }

  async function restoreUpload(id: string) {
    const { error } = await (supabase.from('media_uploads') as any)
      .update({ deleted_at: null })
      .eq('id', id);
    if (error) throw error;
    if (user) await recalculateUserStorage(user.id);
    load();
  }

  async function permanentDeleteUpload(u: MediaUpload) {
    if (!confirm('Permanently delete this upload? This cannot be undone.')) return;
    // Delete from storage first
    if (u.storage_path) {
      const parts = u.storage_path.split('/');
      await supabase.storage.from(parts[0]).remove([parts.slice(1).join('/')]);
    }
    // Then mark as destroyed
    const { error } = await (supabase.from('media_uploads') as any)
      .update({ is_destroyed: true, destroyed_at: new Date().toISOString() })
      .eq('id', u.id);
    if (error) throw error;
    if (user) await recalculateUserStorage(user.id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-space">Uploads</h1>
        {trashedUploads.length > 0 && (
          <button onClick={() => setShowTrash(!showTrash)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${showTrash ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.08]'}`}>
            <Trash className="w-3.5 h-3.5" />Trash ({trashedUploads.length})
          </button>
        )}
      </div>

      {/* Trash Section */}
      <AnimatePresence>
        {showTrash && trashedUploads.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                  <Trash className="w-4 h-4" />Recycle Bin
                </h3>
                <span className="text-xs text-white/30">Uploads are deleted after 30 days</span>
              </div>
              <div className="space-y-2">
                {trashedUploads.map((u) => {
                  const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(u.deleted_at!).getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={u.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Upload className="w-4 h-4 text-white/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white/60 truncate">{u.original_filename}</p>
                          <div className="flex items-center gap-2 text-xs text-white/30">
                            <span>{formatStorage(u.file_size_bytes)}</span>
                            <span className="text-red-400/60">{daysLeft} days left</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => restoreUpload(u.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 transition" title="Restore">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => permanentDeleteUpload(u)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition" title="Delete permanently">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search uploads..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
      </div>

      {loading ? <div className="text-center text-white/30 py-12 text-sm">Loading...</div> : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 text-center">
          <Upload className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 mb-4">No uploads yet</p>
          <Link href="/upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition">
            <Upload className="w-4 h-4" />Upload Now
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{u.original_filename}</p>
                <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                  <span>{formatStorage(u.file_size_bytes)}</span>
                  <span>{u.file_type}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{u.view_count}</span>
                  {u.expires_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(u.expires_at).toLocaleDateString()}</span>}
                  <span className="font-mono">{formatAccessCode(u.access_code)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => copyLink(u.access_code)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Copy link"><Copy className="w-4 h-4" /></button>
                <a href={`/view/${u.access_code}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="View"><ExternalLink className="w-4 h-4" /></a>
                <button onClick={() => softDeleteUpload(u)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition" title="Move to trash"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
