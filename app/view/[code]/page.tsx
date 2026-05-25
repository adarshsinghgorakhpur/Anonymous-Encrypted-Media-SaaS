'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Eye, Download, Copy, Check, AlertCircle, Loader2, Clock, Trash2, Shield, Flag, Key, Timer,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { decryptFile, verifyPassword } from '@/lib/crypto';
import { getSignedUrl, destroyUpload, parseUserAgent } from '@/lib/upload';
import { formatAccessCode } from '@/lib/access-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/navbar';
import type { MediaUpload } from '@/lib/supabase/types';

type State = 'loading' | 'password-required' | 'decrypting' | 'ready' | 'error' | 'expired' | 'not-found' | 'locked';

function CountdownTimer({ targetDate, onUnlock }: { targetDate: string; onUnlock: () => void }) {
  const [remaining, setRemaining] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Unlocked!');
        setDone(true);
        onUnlock();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onUnlock]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-cyan-400">
        <Timer className="w-5 h-5" />
        <span className="font-mono text-lg font-semibold">{remaining}</span>
      </div>
      <p className="text-white/40 text-xs">This file unlocks automatically when the timer reaches zero</p>
      {done && <p className="text-emerald-400 text-sm font-medium mt-1">File is now unlocked!</p>}
    </div>
  );
}

export default function ViewPage() {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();
  const [state, setState] = useState<State>('loading');
  const [upload, setUpload] = useState<MediaUpload | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logAccess = useCallback(async (rec: MediaUpload, successful: boolean, passwordAttempt: boolean) => {
    const ua = navigator.userAgent;
    const parsed = parseUserAgent(ua);
    try {
      await (supabase.from('access_attempt_logs') as any).insert({
        upload_id: rec.id,
        is_successful: successful,
        password_attempt: passwordAttempt,
        user_agent: ua,
        browser: parsed.browser,
        os: parsed.os,
        device_type: parsed.deviceType,
      });
    } catch {}
  }, []);

  const loadUpload = useCallback(async () => {
    setState('loading');
    const { data, error } = await (supabase.from('media_uploads') as any)
      .select('*')
      .eq('access_code', code)
      .single();

    if (error || !data) return setState('not-found');

    const record = data as MediaUpload;
    if (record.is_destroyed) return setState('expired');
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      await (supabase.from('media_uploads') as any).update({ is_destroyed: true, destroyed_at: new Date().toISOString() }).eq('id', record.id);
      return setState('expired');
    }

    setUpload(record);

    if (record.unlock_at && new Date(record.unlock_at) > new Date()) {
      return setState('locked');
    }

    if (record.password_hash) return setState('password-required');

    await prepareMedia(record);
  }, [code]);

  const prepareMedia = useCallback(async (rec: MediaUpload, pw?: string) => {
    try {
      setState(rec.is_encrypted ? 'decrypting' : 'loading');
      const signedUrl = await getSignedUrl(rec.storage_path);

      if (!rec.is_encrypted) {
        setMediaUrl(signedUrl);
      } else {
        const decryptPassword = pw || rec.encryption_password || '';
        const res = await fetch(signedUrl);
        const encBuf = await res.arrayBuffer();
        console.debug('[XCrypt] Encrypted buffer size:', encBuf.byteLength);
        console.debug('[XCrypt] Password available:', !!decryptPassword, 'length:', decryptPassword.length);
        console.debug('[XCrypt] IV available:', !!rec.encryption_iv, 'Salt available:', !!rec.encryption_salt);
        console.debug('[XCrypt] MIME type:', rec.mime_type);
        const decBuf = await decryptFile(encBuf, decryptPassword, rec.encryption_iv!, rec.encryption_salt!);
        console.debug('[XCrypt] Decrypted buffer size:', decBuf.byteLength);
        const blob = new Blob([decBuf], { type: rec.mime_type });
        console.debug('[XCrypt] Blob created:', blob.size, blob.type);
        setMediaUrl(URL.createObjectURL(blob));
      }

      setState('ready');
      trackAnalytics(rec);
      logAccess(rec, true, !!pw);
    } catch (error) {
      console.error('[XCrypt] Decryption error:', error);
      setState('error');
      logAccess(rec, false, !!pw);
    }
  }, [logAccess]);

  const trackAnalytics = async (rec: MediaUpload) => {
    await (supabase.from('analytics') as any).insert({ upload_id: rec.id, event_type: 'view' });
    const newCount = rec.view_count + 1;
    await (supabase.from('media_uploads') as any).update({ view_count: newCount }).eq('id', rec.id);

    if (rec.is_one_time) {
      setTimeout(async () => {
        await destroyUpload(rec.id, rec.storage_path);
      }, 5000);
    } else if (rec.burn_after_views && newCount >= rec.burn_after_views) {
      setTimeout(async () => {
        await destroyUpload(rec.id, rec.storage_path);
      }, 5000);
    }
  };

  useEffect(() => { loadUpload(); }, [loadUpload]);

  const handleUnlockTimer = useCallback(() => {
    if (upload && !upload.password_hash) {
      prepareMedia(upload);
    } else if (upload && upload.password_hash) {
      setState('password-required');
    }
  }, [upload, prepareMedia]);

  const handlePassword = async () => {
    if (!upload) return;
    setPasswordError('');
    const valid = await verifyPassword(password, upload.password_hash!);
    if (!valid) {
      setPasswordError('Incorrect password');
      logAccess(upload, false, true);
      return;
    }
    await prepareMedia(upload, password);
  };

  const handleDownload = () => {
    if (!mediaUrl || !upload) return;
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = upload.original_filename;
    a.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = async () => {
    if (!upload) return;
    await (supabase.from('reports') as any).insert({ upload_id: upload.id, reason: 'user_report', details: 'Reported by viewer' });
    toast({ title: 'Report submitted', description: 'Thank you for helping keep XCrypt safe.' });
  };

  const centeredCard = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#060910] text-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {children}
        </motion.div>
      </div>
    </div>
  );

  if (state === 'loading' || state === 'decrypting')
    return centeredCard(
      <div className="flex flex-col items-center gap-3 py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-white/50 text-sm">{state === 'decrypting' ? 'Decrypting file...' : 'Loading...'}</p>
      </div>
    );

  if (state === 'not-found')
    return centeredCard(
      <div className="text-center space-y-4 py-8">
        <AlertCircle className="w-12 h-12 text-white/20 mx-auto" />
        <h2 className="text-xl font-semibold">File not found</h2>
        <p className="text-white/40 text-sm">This link may be invalid or has been removed.</p>
        <Button onClick={() => (window.location.href = '/')} variant="outline" className="border-white/10 text-white/60">Go Home</Button>
      </div>
    );

  if (state === 'expired')
    return centeredCard(
      <div className="text-center space-y-4 py-8">
        <Trash2 className="w-12 h-12 text-red-400/60 mx-auto" />
        <h2 className="text-xl font-semibold">File expired</h2>
        <p className="text-white/40 text-sm">This file has been destroyed or has expired.</p>
        <Button onClick={() => (window.location.href = '/')} variant="outline" className="border-white/10 text-white/60">Go Home</Button>
      </div>
    );

  if (state === 'locked')
    return centeredCard(
      <div className="bg-[#0F1420] border border-white/[0.06] rounded-2xl p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
            <Timer className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Scheduled Unlock</h2>
          <p className="text-white/40 text-sm">This file is locked until a scheduled time</p>
        </div>
        {upload?.unlock_at && (
          <CountdownTimer targetDate={upload.unlock_at} onUnlock={handleUnlockTimer} />
        )}
      </div>
    );

  if (state === 'error')
    return centeredCard(
      <div className="text-center space-y-4 py-8">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-white/40 text-sm">Failed to load or decrypt the file.</p>
        <Button onClick={loadUpload} variant="outline" className="border-white/10 text-white/60">Retry</Button>
      </div>
    );

  if (state === 'password-required')
    return centeredCard(
      <div className="bg-[#0F1420] border border-white/[0.06] rounded-2xl p-8 space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold">Password required</h2>
          <p className="text-white/40 text-sm">This file is protected with a password</p>
          {upload?.password_hint && (
            <p className="text-cyan-400/70 text-xs mt-1">Hint: {upload.password_hint}</p>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handlePassword(); }} className="space-y-3">
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              {showPassword ? <Eye className="w-4 h-4" /> : <Key className="w-4 h-4" />}
            </button>
          </div>
          {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
          <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">Unlock</Button>
        </form>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#060910] text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12">
        <AnimatePresence mode="wait">
          <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold">{upload?.title || upload?.original_filename}</h1>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{formatAccessCode(code!)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{upload?.view_count ?? 0} views</span>
                  {upload?.expires_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Expires {new Date(upload.expires_at).toLocaleDateString()}</span>}
                  {upload?.is_encrypted && <span className="flex items-center gap-1 text-cyan-400"><Lock className="w-3 h-3" />Encrypted</span>}
                  {upload?.is_one_time && <span className="flex items-center gap-1 text-amber-400"><Timer className="w-3 h-3" />One-time</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="border-white/10 text-white/60 hover:text-white">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload} className="border-white/10 text-white/60 hover:text-white">
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleReport} className="border-white/10 text-red-400/60 hover:text-red-400">
                  <Flag className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-[#0F1420] border border-white/[0.06] flex items-center justify-center">
              {upload?.file_type === 'video' ? (
                <video src={mediaUrl!} controls className="max-h-[70vh] w-full" />
              ) : (
                <img src={mediaUrl!} alt={upload?.title || 'Encrypted file'} className="max-h-[70vh] w-auto object-contain" />
              )}
            </div>

            {upload?.is_one_time && (
              <p className="text-center text-xs text-amber-400/70 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3" />This is a one-time link. The file will be destroyed after viewing.
              </p>
            )}
            {upload?.burn_after_views && !upload?.is_one_time && (
              <p className="text-center text-xs text-amber-400/70 flex items-center justify-center gap-1">
                <Trash2 className="w-3 h-3" />This file will be destroyed after {upload.burn_after_views} views
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
