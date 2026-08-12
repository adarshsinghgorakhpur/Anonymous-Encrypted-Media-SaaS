'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Trash2, Eye, EyeOff, Crown, Search, Clock, Filter, SortAsc } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { encryptText, decryptText, hashPassword, verifyPassword } from '@/lib/crypto';
import type { VaultNote } from '@/lib/supabase/types';

type SortBy = 'newest' | 'oldest' | 'expiring';

export default function VaultPage() {
  const { user, isPremium } = useAuthStore();
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [unlockPw, setUnlockPw] = useState('');
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const load = () => {
    if (!user) return;
    (supabase.from('vault_notes') as any).select('*').eq('user_id', user.id).eq('is_destroyed', false).order('created_at', { ascending: false })
      .then(({ data }: any) => { setNotes(data || []); setLoading(false); });
  };
  useEffect(load, [user]);

  async function createNote() {
    if (!title.trim() || !content.trim() || !password || !user) return;
    setCreating(true);
    const { encrypted, iv, salt } = await encryptText(content, password);
    const pwHash = await hashPassword(password);
    await (supabase.from('vault_notes') as any).insert({ user_id: user.id, title: title.trim(), encrypted_content: encrypted, encryption_iv: iv, encryption_salt: salt, is_password_protected: true, password_hash: pwHash });
    setTitle(''); setContent(''); setPassword('');
    setShowCreate(false);
    setCreating(false);
    load();
  }

  async function unlockNote(note: VaultNote) {
    setError('');
    if (!note.password_hash) return;
    const ok = await verifyPassword(unlockPw, note.password_hash);
    if (!ok) { setError('Wrong password'); return; }
    const text = await decryptText(note.encrypted_content, unlockPw, note.encryption_iv, note.encryption_salt);
    setDecrypted((d) => ({ ...d, [note.id]: text }));
    setUnlockId(null); setUnlockPw('');
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return;
    await (supabase.from('vault_notes') as any).update({ is_destroyed: true }).eq('id', id);
    setDecrypted((d) => { const n = { ...d }; delete n[id]; return n; });
    load();
  }

  const filteredNotes = notes
    .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'expiring') {
        if (!a.expires_at && !b.expires_at) return 0;
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (!isPremium) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4"><Crown className="w-7 h-7 text-amber-400" /></div>
        <h2 className="text-xl font-bold text-white font-space mb-2">Premium Feature</h2>
        <p className="text-white/50 text-sm mb-5 max-w-xs">Vault notes are available on the Pro plan. Upgrade to store encrypted notes.</p>
        <Link href="/pricing" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition">Upgrade to Pro</Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-space">Vault</h1>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition">
          <Plus className="w-3.5 h-3.5" />New Note
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white'}`}>
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 text-xs">
              <SortAsc className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/40">Sort:</span>
              {[
                { key: 'newest' as SortBy, label: 'Newest' },
                { key: 'oldest' as SortBy, label: 'Oldest' },
                { key: 'expiring' as SortBy, label: 'Expiring First' },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setSortBy(opt.key)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${sortBy === opt.key ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Note */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" /> Create Encrypted Note</h3>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" rows={4} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-none" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Encryption password" className="w-full bg-white/[0.04] border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
              <div className="flex gap-2">
                <button onClick={createNote} disabled={creating || !title.trim() || !content.trim() || !password} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition">
                  <Lock className="w-4 h-4" />{creating ? 'Encrypting...' : 'Encrypt & Save'}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl bg-white/[0.04] text-white/50 text-sm hover:text-white transition">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <div className="text-center text-white/30 py-8 text-sm">Loading...</div> : filteredNotes.length === 0 ? (
        <div className="text-center text-white/30 py-8 text-sm">{searchQuery ? 'No notes match your search' : 'No notes yet'}</div>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((n) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <p className="text-sm text-white truncate">{n.title}</p>
                  {n.expires_at && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-400/60 shrink-0">
                      <Clock className="w-3 h-3" />Exp: {new Date(n.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {decrypted[n.id] ? (
                    <button onClick={() => setDecrypted((d) => { const x = { ...d }; delete x[n.id]; return x; })} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Hide"><EyeOff className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={() => setUnlockId(n.id)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Unlock"><Eye className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => deleteNote(n.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {decrypted[n.id] && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white/80 whitespace-pre-wrap">
                  {decrypted[n.id]}
                </motion.div>
              )}
              <AnimatePresence>
                {unlockId === n.id && !decrypted[n.id] && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex items-center gap-2">
                    <input value={unlockPw} onChange={(e) => { setUnlockPw(e.target.value); setError(''); }} type="password" placeholder="Enter password" className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                    <button onClick={() => unlockNote(n)} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition">Unlock</button>
                    {error && <span className="text-xs text-red-400">{error}</span>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
