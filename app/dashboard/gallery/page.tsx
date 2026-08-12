'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, Copy, Trash2, Lock, UserCheck, Eye, Settings, Clock, ToggleLeft, ToggleRight, Search, X, Check, Download, Edit2, RotateCcw, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { generateAccessCode } from '@/lib/access-code';
import { hashPassword } from '@/lib/crypto';
import { formatStorage, getSignedUrl } from '@/lib/upload';
import type { Gallery, MediaUpload } from '@/lib/supabase/types';

interface GalleryMediaItem {
  id: string;
  gallery_id: string;
  upload_id: string;
  media_upload: MediaUpload;
  created_at: string;
}

export default function GalleryPage() {
  const { user } = useAuthStore();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [trashedGalleries, setTrashedGalleries] = useState<Gallery[]>([]);
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
  const [showTrash, setShowTrash] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaItem[]>([]);
  const [availableUploads, setAvailableUploads] = useState<MediaUpload[]>([]);
  const [showAddImages, setShowAddImages] = useState(false);
  const [addingImages, setAddingImages] = useState<Set<string>>(new Set());

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameDesc, setRenameDesc] = useState('');

  const load = useCallback(() => {
    if (!user) return;
    (supabase.from('galleries') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_destroyed', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (error) throw error;
        setGalleries(data || []);
      });

    (supabase.from('galleries') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_destroyed', false)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (error) throw error;
        setTrashedGalleries(data || []);
        setLoading(false);
      });
  }, [user]);

  useEffect(load, [load]);

  const loadGalleryMedia = useCallback(async (galleryId: string) => {
    if (!user) return;

    const { data: mediaData, error: mediaError } = await (supabase.from('gallery_media') as any)
      .select('id, gallery_id, upload_id, created_at')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false });

    if (mediaError) { setGalleryMedia([]); return; }
    if (!mediaData || mediaData.length === 0) { setGalleryMedia([]); return; }

    const uploadIds = mediaData.map((m: any) => m.upload_id);
    const { data: uploadsData, error: uploadsError } = await (supabase.from('media_uploads') as any)
      .select('*')
      .in('id', uploadIds);

    if (uploadsError) { setGalleryMedia([]); return; }

    const uploadsMap = new Map((uploadsData || []).map((u: any) => [u.id, u]));
    const combinedData = mediaData.map((m: any) => ({
      ...m,
      media_upload: uploadsMap.get(m.upload_id) || null
    }));
    setGalleryMedia(combinedData);
  }, [user]);

  const loadAvailableUploads = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase.from('media_uploads') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_destroyed', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setAvailableUploads(data);
  }, [user]);

  useEffect(() => {
    if (selectedGallery) {
      loadGalleryMedia(selectedGallery.id);
      loadAvailableUploads();
    }
  }, [selectedGallery, loadGalleryMedia, loadAvailableUploads]);

  async function createGallery() {
    if (!title.trim() || !user) return;
    setCreating(true);
    const code = generateAccessCode();
    const pwHash = password ? await hashPassword(password) : null;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 3600000).toISOString() : null;
    const { error } = await (supabase.from('galleries') as any).insert({
      user_id: user.id,
      access_code: code,
      title: title.trim(),
      description: description.trim() || null,
      password_hash: pwHash,
      is_invite_only: inviteOnly,
      expires_at: expiresAt,
    });
    if (error) throw error;
    setTitle(''); setDescription(''); setPassword(''); setHint(''); setInviteOnly(false); setExpiresIn(null);
    setShowCreate(false);
    setCreating(false);
    load();
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/gallery/${code}`);
  }

  async function softDeleteGallery(id: string) {
    if (!confirm('Move this gallery to trash? It will be permanently deleted after 30 days.')) return;
    await (supabase.from('galleries') as any).update({ deleted_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  async function restoreGallery(id: string) {
    await (supabase.from('galleries') as any).update({ deleted_at: null }).eq('id', id);
    load();
  }

  async function permanentDeleteGallery(id: string) {
    if (!confirm('Permanently delete this gallery? This cannot be undone.')) return;
    await (supabase.from('gallery_media') as any).delete().eq('gallery_id', id);
    await (supabase.from('galleries') as any).update({ is_destroyed: true }).eq('id', id);
    load();
  }

  async function renameGallery(id: string) {
    const { error } = await (supabase.from('galleries') as any)
      .update({ title: renameTitle.trim(), description: renameDesc.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setRenamingId(null);
    load();
  }

  function startRename(g: Gallery) {
    setRenamingId(g.id);
    setRenameTitle(g.title);
    setRenameDesc(g.description || '');
  }

  async function addImageToGallery(uploadId: string) {
    if (!selectedGallery || !user) return;
    setAddingImages(prev => new Set(prev).add(uploadId));
    const { error } = await (supabase.from('gallery_media') as any).insert({
      gallery_id: selectedGallery.id,
      upload_id: uploadId,
    });
    if (error) throw error;
    loadGalleryMedia(selectedGallery.id);
    setAddingImages(prev => { const n = new Set(prev); n.delete(uploadId); return n; });
  }

  async function removeImageFromGallery(itemId: string) {
    if (!confirm('Remove this image from the gallery?')) return;
    await (supabase.from('gallery_media') as any).delete().eq('id', itemId);
    if (selectedGallery) loadGalleryMedia(selectedGallery.id);
  }

  async function downloadImage(item: GalleryMediaItem) {
    try {
      const signedUrl = await getSignedUrl(item.media_upload.storage_path);
      const res = await fetch(signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.media_upload.original_filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  const filteredGalleries = galleries.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const existingUploadIds = new Set(galleryMedia.map(m => m.upload_id));
  const uploadsToAdd = availableUploads.filter(u => !existingUploadIds.has(u.id));

  if (selectedGallery) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSelectedGallery(null)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition shrink-0">
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white font-space truncate">{selectedGallery.title}</h1>
          </div>
          <button onClick={() => setShowAddImages(!showAddImages)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition shrink-0">
            <Plus className="w-3.5 h-3.5" />Add Images
          </button>
        </div>

        {selectedGallery.description && (
          <p className="text-white/50 text-sm">{selectedGallery.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{galleryMedia.length} images</span>
          {selectedGallery.password_hash && <span className="flex items-center gap-1 text-amber-400/60"><Lock className="w-3 h-3" />Protected</span>}
          {selectedGallery.is_invite_only && <span className="flex items-center gap-1 text-cyan-400/60"><UserCheck className="w-3 h-3" />Invite Only</span>}
          <span className="font-mono">Code: {selectedGallery.access_code}</span>
          <button onClick={() => copyLink(selectedGallery.access_code)} className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
            <Copy className="w-3 h-3" />Copy Link
          </button>
        </div>

        <AnimatePresence>
          {showAddImages && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-white">Add Images from Your Uploads</h3>
                {uploadsToAdd.length === 0 ? (
                  <p className="text-white/50 text-sm">No uploads available to add. Upload some files first!</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                    {uploadsToAdd.map(upload => (
                      <div key={upload.id} className="relative group bg-white/[0.04] rounded-xl overflow-hidden aspect-square">
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white/20" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1.5">
                          <p className="text-xs text-white truncate">{upload.original_filename}</p>
                          <p className="text-xs text-white/50">{formatStorage(upload.file_size_bytes)}</p>
                        </div>
                        <button onClick={() => addImageToGallery(upload.id)} disabled={addingImages.has(upload.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100">
                          {addingImages.has(upload.id) ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-8 h-8 text-white" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {galleryMedia.length === 0 ? (
          <div className="text-center text-white/30 py-16">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No images in this gallery yet</p>
            <p className="text-xs text-white/20 mt-1">Click "Add Images" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {galleryMedia.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="relative group bg-white/[0.04] rounded-xl overflow-hidden aspect-square">
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-white/20" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1.5">
                  <p className="text-xs text-white truncate">{item.media_upload.original_filename}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => downloadImage(item)} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeImageFromGallery(item.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white font-space">Galleries</h1>
        <div className="flex items-center gap-2">
          {trashedGalleries.length > 0 && (
            <button onClick={() => setShowTrash(!showTrash)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${showTrash ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/[0.08]'}`}>
              <Trash className="w-3.5 h-3.5" />Trash ({trashedGalleries.length})
            </button>
          )}
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm hover:opacity-90 transition">
            <Plus className="w-3.5 h-3.5" />New Gallery
          </button>
        </div>
      </div>

      {/* Trash Section */}
      <AnimatePresence>
        {showTrash && trashedGalleries.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                  <Trash className="w-4 h-4" />Recycle Bin
                </h3>
                <span className="text-xs text-white/30">Galleries are deleted after 30 days</span>
              </div>
              <div className="space-y-2">
                {trashedGalleries.map((g) => {
                  const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(g.deleted_at!).getTime()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={g.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <ImageIcon className="w-4 h-4 text-white/30 shrink-0" />
                        <span className="text-sm text-white/60 truncate">{g.title}</span>
                        <span className="text-xs text-red-400/60 shrink-0">{daysLeft}d left</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => restoreGallery(g.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/40 hover:text-emerald-400 transition" title="Restore">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => permanentDeleteGallery(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition" title="Delete permanently">
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
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search galleries..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-400" /> Create Gallery</h3>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gallery title" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />

              <div className="space-y-2">
                <label className="text-xs text-white/50 flex items-center gap-1"><Lock className="w-3 h-3" /> Password Protection</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (optional)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                {password && (
                  <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Password hint (optional)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                )}
              </div>

              <button onClick={() => setInviteOnly(!inviteOnly)} className="flex items-center gap-3 text-sm">
                {inviteOnly ? <ToggleRight className="w-6 h-6 text-cyan-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                <span className={inviteOnly ? 'text-white' : 'text-white/50'}>Invite Only</span>
                <span className="text-xs text-white/30 ml-1">Only people with the link can access</span>
              </button>

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
        <div className="text-center text-white/30 py-8 text-sm">{searchQuery ? 'No galleries match your search' : 'No galleries yet. Create one to get started!'}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGalleries.map((g) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedGallery(g)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors group cursor-pointer">
              {renamingId === g.id ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <input value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} placeholder="Title" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                  <input value={renameDesc} onChange={(e) => setRenameDesc(e.target.value)} placeholder="Description" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50" />
                  <div className="flex gap-2">
                    <button onClick={() => renameGallery(g.id)} className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/30 transition flex items-center gap-1"><Check className="w-3 h-3" />Save</button>
                    <button onClick={() => setRenamingId(null)} className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/50 text-xs hover:text-white transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{g.title}</p>
                        {g.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{g.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => startRename(g)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-cyan-400 transition" title="Rename"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => copyLink(g.access_code)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition" title="Copy link"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => softDeleteGallery(g.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition" title="Move to trash"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30 flex-wrap">
                    {g.password_hash && <span className="flex items-center gap-0.5 text-amber-400/60"><Lock className="w-3 h-3" />Protected</span>}
                    {g.is_invite_only && <span className="flex items-center gap-0.5 text-cyan-400/60"><UserCheck className="w-3 h-3" />Invite</span>}
                    {g.expires_at && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(g.expires_at).toLocaleDateString()}</span>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-xs text-white/30 font-mono">Code: {g.access_code}</p>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
