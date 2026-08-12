'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Trash2, Eye, EyeOff, Search, Clock, Filter, SortAsc, RotateCcw, X, Trash, Save, Edit3, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { encryptText, decryptText, hashPassword, verifyPassword } from '@/lib/crypto';
import type { VaultNote } from '@/lib/supabase/types';

type SortBy = 'newest' | 'oldest' | 'expiring';

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-white mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-400 underline hover:text-cyan-300" target="_blank" rel="noopener">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-cyan-500/40 pl-3 text-white/50 italic my-2">$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 text-white/70">• $1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function VaultPage() {
  const { user } = useAuthStore();
  const [activeNotes, setActiveNotes] = useState<VaultNote[]>([]);
  const [trashedNotes, setTrashedNotes] = useState<VaultNote[]>([]);
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
  const [showTrash, setShowTrash] = useState(false);

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPw, setEditPw] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    if (!user) return;

    (supabase.from('vault_notes') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_destroyed', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (error) throw error;
        setActiveNotes(data || []);
      });

    (supabase.from('vault_notes') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_destroyed', false)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (error) throw error;
        setTrashedNotes(data || []);
        setLoading(false);
      });
  }, [user]);

  useEffect(load, [load]);

  async function createNote() {
    if (!title.trim() || !content.trim() || !password || !user) return;
    setCreating(true);
    const { encrypted, iv, salt } = await encryptText(content, password);
    const pwHash = await hashPassword(password);
    const { error } = await (supabase.from('vault_notes') as any).insert({
      user_id: user.id,
      title: title.trim(),
      encrypted_content: encrypted,
      encryption_iv: iv,
      encryption_salt: salt,
      is_password_protected: true,
      password_hash: pwHash
    });
    if (error) throw error;
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

  function startEdit(note: VaultNote) {
    if (!decrypted[note.id]) return;
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(decrypted[note.id]);
    setEditPw('');
    setSaveStatus('idle');
  }

  async function saveEdit(note: VaultNote) {
    if (!editPw) { setError('Enter password to save'); return; }
    const ok = await verifyPassword(editPw, note.password_hash!);
    if (!ok) { setError('Wrong password'); return; }
    setSaveStatus('saving');
    const { encrypted, iv, salt } = await encryptText(editContent, editPw);
    const { error } = await (supabase.from('vault_notes') as any)
      .update({
        title: editTitle.trim(),
        encrypted_content: encrypted,
        encryption_iv: iv,
        encryption_salt: salt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', note.id);
    if (error) { setError('Save failed'); setSaveStatus('idle'); return; }
    setDecrypted((d) => ({ ...d, [note.id]: editContent }));
    setEditingId(null);
    setEditPw('');
    setSaveStatus('saved');
    load();
    setTimeout(() => setSaveStatus('idle'), 2000);
  }

  // Autosave: when editing, debounce content changes
  useEffect(() => {
    if (editingId && editContent && saveStatus === 'idle') {
      setSaveStatus('saved');
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => setSaveStatus('idle'), 1500);
    }
  }, [editContent, editingId]);

  async function softDeleteNote(id: string) {
    if (!confirm('Move this note to trash? It will be permanently deleted after 30 days.')) return;
    await (supabase.from('vault_notes') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    setDecrypted((d) => { const n = { ...d }; delete n[id]; return n; });
    load();
  }

  async function restoreNote(id: string) {
    await (supabase.from('vault_notes') as any)
      .update({ deleted_at: null })
      .eq('id', id);
    load();
  }

  async function permanentDeleteNote(id: string) {
    if (!confirm('Permanently delete this note? This cannot be undone.')) return;
    await (supabase.from('vault_notes') as any)
      .update({ is_destroyed: true, destroyed_at: new Date().toISOString() })
      .eq('id', id);
    load();
  }

  const filteredNotes = activeNotes
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white font-space">Vault</h1>
        <div className="flex items-center gap-2">
          {trashedNotes.length > 0 && (
            <button onClick={() => setShowTrash(!showTrash)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${showTrash ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.08]'}`}>
              <Trash className="w-3.5 h-3.5" />Trash ({trashedNotes.length})
            </button>
          )}
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition">
            <Plus className="w-3.5 h-3.5" />New Note
          </button>
        </div>
      </div>

      {/* Trash Section */}
      <AnimatePresence>
        {showTrash && trashedNotes.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                  <Trash className="w-4 h-4" />Recycle Bin
                </h3>
                <span className="text-xs text-white/30">Notes are deleted after 30 days</span>
              </div>
              <div className="space-y-2">
                {trashedNotes.map((n) => {
                  const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(n.deleted_at!).getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={n.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Lock className="w-4 h-4 text-white/30 shrink-0" />
                        <span className="text-sm text-white/60 truncate">{n.title}</span>
                        <span className="text-xs text-red-400/60 shrink-0">{daysLeft}d left</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => restoreNote(n.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 transition" title="Restore">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => permanentDeleteNote(n.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition" title="Delete permanently">
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
            <div className="flex items-center gap-2 text-xs flex-wrap">
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
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write in Markdown... (supports # headers, **bold**, *italic*, `code`, > quotes, - lists)" rows={5} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-y font-mono" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Encryption password" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
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
        <div className="text-center text-white/30 py-12">
          <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm">{searchQuery ? 'No notes match your search' : 'No notes yet. Create one to get started!'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((n) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <p className="text-sm text-white truncate">{editingId === n.id ? editTitle : n.title}</p>
                  {n.expires_at && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-400/60 shrink-0">
                      <Clock className="w-3 h-3" />Exp: {new Date(n.expires_at).toLocaleDateString()}
                    </span>
                  )}
                  {saveStatus === 'saving' && editingId === n.id && <span className="text-xs text-amber-400/60">Saving...</span>}
                  {saveStatus === 'saved' && editingId === n.id && <span className="text-xs text-emerald-400/60 flex items-center gap-1"><Save className="w-3 h-3" />Saved</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {decrypted[n.id] && editingId !== n.id && (
                    <button onClick={() => startEdit(n)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-cyan-400 transition" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {decrypted[n.id] && editingId !== n.id && (
                    <button onClick={() => setDecrypted((d) => { const x = { ...d }; delete x[n.id]; return x; })} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Hide"><EyeOff className="w-4 h-4" /></button>
                  )}
                  {!decrypted[n.id] && (
                    <button onClick={() => setUnlockId(n.id)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Unlock"><Eye className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => softDeleteNote(n.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition" title="Move to trash"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Display decrypted content */}
              {decrypted[n.id] && editingId !== n.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white/80"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(decrypted[n.id]) }} />
              )}

              {/* Edit mode */}
              {editingId === n.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-y font-mono" />
                  <div className="flex items-center gap-2">
                    <input value={editPw} onChange={(e) => { setEditPw(e.target.value); setError(''); }} type="password" placeholder="Enter password to save" className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                    <button onClick={() => saveEdit(n)} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition flex items-center gap-1">
                      <Save className="w-3.5 h-3.5" />Save
                    </button>
                    <button onClick={() => { setEditingId(null); setError(''); }} className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/50 text-sm hover:text-white transition">Cancel</button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                </motion.div>
              )}

              {/* Unlock prompt */}
              <AnimatePresence>
                {unlockId === n.id && !decrypted[n.id] && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex items-center gap-2 flex-wrap">
                    <input value={unlockPw} onChange={(e) => { setUnlockPw(e.target.value); setError(''); }} type="password" placeholder="Enter password" className="flex-1 min-w-[150px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                    <button onClick={() => unlockNote(n)} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition">Unlock</button>
                    {error && <span className="text-xs text-red-400 w-full">{error}</span>}
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
