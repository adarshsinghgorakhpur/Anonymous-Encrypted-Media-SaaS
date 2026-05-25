'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Copy, ExternalLink, Trash2, Upload, Eye, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { formatFileSize } from '@/lib/compression';
import { formatAccessCode } from '@/lib/access-code';
import type { MediaUpload } from '@/lib/supabase/types';

export default function UploadsPage() {
  const { user } = useAuthStore();
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) {
      console.debug('[XCrypt Dashboard Uploads] No authenticated user; skipping uploads fetch.');
      setUploads([]);
      setLoading(false);
      return;
    }
    (supabase.from('media_uploads') as any).select('*').eq('user_id', user.id).eq('is_destroyed', false).order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        console.debug('[XCrypt Dashboard Uploads] Fetch response:', { userId: user.id, rows: data?.length ?? 0, error: error ?? null });
        if (error) console.error('[XCrypt Dashboard Uploads] Fetch error:', error);
        setUploads(data || []);
        setLoading(false);
      });
  };
  useEffect(load, [user]);

  const filtered = uploads.filter((u) => u.original_filename.toLowerCase().includes(search.toLowerCase()));

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/view/${code}`);
  }

  async function deleteUpload(u: MediaUpload) {
    if (!confirm('Delete this upload?')) return;
    await (supabase.from('media_uploads') as any).update({ is_destroyed: true, destroyed_at: new Date().toISOString() }).eq('id', u.id);
    if (u.storage_path) {
      const parts = u.storage_path.split('/');
      await supabase.storage.from(parts[0]).remove([parts.slice(1).join('/')]);
    }
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white font-space">Uploads</h1>

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
                  <span>{formatFileSize(u.file_size_bytes)}</span>
                  <span>{u.file_type}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{u.view_count}</span>
                  {u.expires_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(u.expires_at).toLocaleDateString()}</span>}
                  <span className="font-mono">{formatAccessCode(u.access_code)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => copyLink(u.access_code)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Copy link"><Copy className="w-4 h-4" /></button>
                <a href={`/view/${u.access_code}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="View"><ExternalLink className="w-4 h-4" /></a>
                <button onClick={() => deleteUpload(u)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
