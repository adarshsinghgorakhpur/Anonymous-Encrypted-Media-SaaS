'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Plus, Copy, Trash2, Lock, UserCheck, Crown, Eye, Settings, Clock, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { generateAccessCode } from '@/lib/access-code';
import { hashPassword } from '@/lib/crypto';
import type { Gallery } from '@/lib/supabase/types';

export default function GalleryPage() {
  const { user, isPremium } = useAuthStore();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState('');
  const [inviteOnly, setInviteOnly] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    if (!user) return;
    (supabase.from('galleries') as any).select('*').eq('user_id', user.id).eq('is_destroyed', false).order('created_at', { ascending: false })
      .then(({ data }: any) => { setGalleries(data || []); setLoading(false); });
  };
  useEffect(load, [user]);

  async function createGallery() {
    if (!title.trim() || !user) return;
    setCreating(true);
    const code = generateAccessCode();
    const pwHash = password ? await hashPassword(password) : null;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 3600000).toISOString() : null;
    await (supabase.from('galleries') as any).insert({
      user_id: user.id,
      access_code: code,
      title: title.trim(),
      description: description.trim() || null,
      password_hash: pwHash,
      is_invite_only: inviteOnly,
      expires_at: expiresAt,
    });
    setTitle(''); setDescription(''); setPassword(''); setHint(''); setInviteOnly(false); setExpiresIn(null);
    setShowCreate(false);
    setCreating(false);
    load();
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/gallery/${code}`);
  }

  async function deleteGallery(id: string) {
    if (!confirm('Delete this gallery?')) return;
    await (supabase.from('galleries') as any).update({ is_destroyed: true }).eq('id', id);
    load();
  }

  const filteredGalleries = galleries.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isPremium) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4"><Crown className="w-7 h-7 text-amber-400" /></div>
        <h2 className="text-xl font-bold text-white font-space mb-2">Premium Feature</h2>
        <p className="text-white/50 text-sm mb-5 max-w-xs">Galleries are available on the Pro plan. Upgrade to create and manage galleries.</p>
        <Link href="/pricing" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition">Upgrade to Pro</Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-space">Galleries</h1>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition">
          <Plus className="w-3.5 h-3.5" />New Gallery
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search galleries..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Create Gallery */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-400" /> Create Gallery</h3>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gallery title" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />

              {/* Password protection */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 flex items-center gap-1"><Lock className="w-3 h-3" /> Password Protection</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (optional)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                {password && (
                  <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Password hint (optional)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                )}
              </div>

              {/* Invite only */}
              <button onClick={() => setInviteOnly(!inviteOnly)}
                className="flex items-center gap-3 text-sm">
                {inviteOnly ? <ToggleRight className="w-6 h-6 text-cyan-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                <span className={inviteOnly ? 'text-white' : 'text-white/50'}>Invite Only</span>
                <span className="text-xs text-white/30 ml-1">Only people with the link can access</span>
              </button>

              {/* Expiry */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" /> Expiry</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Never', value: null },
                    { label: '24h', value: 24 },
                    { label: '7 days', value: 168 },
                    { label: '30 days', value: 720 },
                  ].map((opt) => (
                    <button key={opt.label} onClick={() => setExpiresIn(opt.value as number | null)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${expiresIn === opt.value ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:text-white'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={createGallery} disabled={creating || !title.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition">
                  <Plus className="w-4 h-4" />{creating ? 'Creating...' : 'Create Gallery'}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-white/50 text-sm hover:text-white transition">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <div className="text-center text-white/30 py-8 text-sm">Loading...</div> : filteredGalleries.length === 0 ? (
        <div className="text-center text-white/30 py-8 text-sm">{searchQuery ? 'No galleries match your search' : 'No galleries yet'}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGalleries.map((g) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                    <Image className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{g.title}</p>
                    {g.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{g.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyLink(g.access_code)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Copy link"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteGallery(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30">
                {g.password_hash && <span className="flex items-center gap-0.5 text-amber-400/60"><Lock className="w-3 h-3" />Protected</span>}
                {g.is_invite_only && <span className="flex items-center gap-0.5 text-cyan-400/60"><UserCheck className="w-3 h-3" />Invite</span>}
                {g.expires_at && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(g.expires_at).toLocaleDateString()}</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-xs text-white/30 font-mono">Code: {g.access_code}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
