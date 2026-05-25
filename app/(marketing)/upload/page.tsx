'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Lock, Clock, Flame, Copy, Check, QrCode, Timer,
  ShieldCheck, FileUp, Loader2, AlertCircle, Eye, Key, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore, useUploadStore } from '@/lib/store';
import { uploadMedia, validateFile, type UploadResult } from '@/lib/upload';
import { formatAccessCode } from '@/lib/access-code';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const EXPIRY_OPTIONS = [
  { label: '1 Hour', value: 1 },
  { label: '24 Hours', value: 24 },
  { label: '7 Days', value: 168 },
  { label: 'Never', value: null },
] as const;

type Step = 'select' | 'configure' | 'uploading' | 'result';

export default function UploadPage() {
  const { user, isPremium } = useAuthStore();
  const { addUpload, updateUpload } = useUploadStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

  // Configuration options
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState('');
  const [expiry, setExpiry] = useState<number | null>(isPremium ? null : 168);
  const [burnAfterView, setBurnAfterView] = useState(false);
  const [oneTimeAccess, setOneTimeAccess] = useState(false);
  const [scheduledUnlock, setScheduledUnlock] = useState('');
  const [completedResult, setCompletedResult] = useState<UploadResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const selectFile = useCallback((files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    const error = validateFile(file, isPremium ? 'pro' : 'free');
    if (error) {
      toast({ title: 'Invalid file', description: error, variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    setStep('configure');
  }, [isPremium, toast]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setStep('uploading');
    setUploadProgress(5);
    setUploadStage('Preparing...');

    const id = crypto.randomUUID();
    addUpload({ id, file: selectedFile, status: 'pending', progress: 0 });

    try {
      updateUpload(id, { status: 'compressing', progress: 5 });
      const result = await uploadMedia(selectedFile, {
        password: usePassword ? password || undefined : undefined,
        passwordHint: usePassword ? hint || undefined : undefined,
        expiresIn: expiry,
        burnAfterViews: burnAfterView ? 1 : null,
        isOneTime: oneTimeAccess,
        unlockAt: scheduledUnlock ? new Date(scheduledUnlock).toISOString() : null,
        userId: user?.id ?? null,
        onProgress: (p) => {
          setUploadProgress(p);
          updateUpload(id, { progress: p });
        },
        onStage: (stage) => {
          setUploadStage(stage);
          const statusMap: Record<string, 'compressing' | 'encrypting' | 'uploading' | 'complete'> = {
            'Compressing...': 'compressing',
            'Encrypting...': 'encrypting',
            'Uploading...': 'uploading',
            'Saving...': 'uploading',
            'Complete': 'complete',
          };
          const s = statusMap[stage];
          if (s) updateUpload(id, { status: s });
        },
      });
      updateUpload(id, { status: 'complete', progress: 100, result });
      setCompletedResult(result);
      setStep('result');
    } catch (err: any) {
      updateUpload(id, { status: 'error', error: err.message });
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      setStep('configure');
    }
  }, [selectedFile, usePassword, password, hint, expiry, burnAfterView, oneTimeAccess, scheduledUnlock, user, addUpload, updateUpload, toast]);

  const onDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); selectFile(e.dataTransfer.files); },
    [selectFile]
  );

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const resetUpload = () => {
    setStep('select');
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStage('');
    setCompletedResult(null);
    setUsePassword(false);
    setPassword('');
    setHint('');
    setExpiry(isPremium ? null : 168);
    setBurnAfterView(false);
    setOneTimeAccess(false);
    setScheduledUnlock('');
    setShowQR(false);
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-white">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-space">Secure Upload</h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            End-to-end encrypted file sharing. Your files are encrypted before they leave your device.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {['Select', 'Configure', 'Upload', 'Done'].map((label, i) => {
            const stepOrder = ['select', 'configure', 'uploading', 'result'];
            const isActive = stepOrder.indexOf(step) === i;
            const isDone = stepOrder.indexOf(step) > i;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive ? 'bg-cyan-500 text-white' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-white/30'
                }`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-xs ${isActive ? 'text-white' : 'text-white/30'}`}>{label}</span>
                {i < 3 && <div className={`w-6 h-px ${isDone ? 'bg-emerald-500/40' : 'bg-white/[0.08]'}`} />}
              </div>
            );
          })}
        </div>

        {/* STEP 1: Select File */}
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                  dragOver ? 'border-cyan-500 bg-cyan-500/[0.06]' : 'border-white/[0.12] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-cyan-400' : 'text-white/30'}`} />
                <p className="text-sm text-white/60">Drag & drop your file here, or <span className="text-cyan-400">browse</span></p>
                <p className="text-xs text-white/30 mt-2">Images up to {isPremium ? '500' : '10'}MB{isPremium ? ', videos up to 500MB' : ''}</p>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && selectFile(e.target.files)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 2: Configure */}
        <AnimatePresence mode="wait">
          {step === 'configure' && (
            <motion.div key="configure" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Selected file */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center gap-3">
                <FileUp className="w-5 h-5 text-cyan-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-white/30">{selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(1) + 'MB' : ''}</p>
                </div>
                <button onClick={resetUpload} className="text-xs text-white/40 hover:text-white">Change</button>
              </div>

              {/* Privacy Options */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 space-y-5">
                <h2 className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" /> Privacy Options</h2>

                {/* Password toggle */}
                <div className="space-y-3">
                  <button onClick={() => setUsePassword(!usePassword)}
                    className="flex items-center gap-3 text-sm">
                    {usePassword ? <ToggleRight className="w-6 h-6 text-cyan-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                    <span className={usePassword ? 'text-white' : 'text-white/50'}>Password Protection</span>
                  </button>
                  <AnimatePresence>
                    {usePassword && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid sm:grid-cols-2 gap-3 overflow-hidden">
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 flex items-center gap-1"><Key className="w-3 h-3" /> Password</label>
                          <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50">Hint</label>
                          <Input placeholder="Optional hint" value={hint} onChange={(e) => setHint(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-sm" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Expiry */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" /> Expiry</label>
                  <div className="flex gap-2 flex-wrap">
                    {EXPIRY_OPTIONS.map((opt) => (
                      <button key={opt.label} onClick={() => setExpiry(opt.value as number | null)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${expiry === opt.value ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:text-white'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Burn after view */}
                <button onClick={() => setBurnAfterView(!burnAfterView)}
                  className="flex items-center gap-3 text-sm">
                  {burnAfterView ? <ToggleRight className="w-6 h-6 text-orange-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                  <span className={burnAfterView ? 'text-white' : 'text-white/50'}>Burn After View</span>
                  <span className="text-xs text-white/30 ml-1">Auto-destroy after 1 view</span>
                </button>

                {/* One-time access */}
                <button onClick={() => setOneTimeAccess(!oneTimeAccess)}
                  className="flex items-center gap-3 text-sm">
                  {oneTimeAccess ? <ToggleRight className="w-6 h-6 text-amber-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                  <span className={oneTimeAccess ? 'text-white' : 'text-white/50'}>One-Time Access</span>
                  <span className="text-xs text-white/30 ml-1">Link invalid after first open</span>
                </button>

                {/* Scheduled unlock (premium) */}
                <div className="space-y-2">
                  <button onClick={() => setScheduledUnlock(scheduledUnlock ? '' : 'scheduled')}
                    className="flex items-center gap-3 text-sm">
                    {scheduledUnlock ? <ToggleRight className="w-6 h-6 text-violet-400" /> : <ToggleLeft className="w-6 h-6 text-white/30" />}
                    <span className={scheduledUnlock ? 'text-white' : 'text-white/50'}>Scheduled Unlock</span>
                    {!isPremium && <span className="text-xs text-amber-400/70 ml-1">Pro</span>}
                  </button>
                  <AnimatePresence>
                    {scheduledUnlock && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 flex items-center gap-1"><Timer className="w-3 h-3" /> Unlock At</label>
                          <Input
                            type="datetime-local"
                            value={scheduledUnlock === 'scheduled' ? '' : scheduledUnlock}
                            onChange={(e) => setScheduledUnlock(e.target.value)}
                            disabled={!isPremium}
                            className="bg-white/[0.04] border-white/[0.08] text-sm"
                          />
                          {!isPremium && <p className="text-xs text-amber-400/70">Upgrade to Pro for scheduled unlock</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!user && (
                  <p className="text-xs text-amber-400/70 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> 7-day auto-expiry for anonymous uploads
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button onClick={handleUpload} className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base hover:opacity-90">
                <Lock className="w-4 h-4 mr-2" />Encrypt & Upload
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3: Uploading */}
        <AnimatePresence mode="wait">
          {step === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-8 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
                <p className="text-sm text-white/70">{uploadStage || 'Processing...'}</p>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden max-w-md mx-auto">
                  <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-xs text-white/30">{uploadProgress}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 4: Result */}
        <AnimatePresence mode="wait">
          {step === 'result' && completedResult && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2"><Check className="w-4 h-4" /> Upload Complete</h2>
              <div className="space-y-2">
                <label className="text-xs text-white/50">Share URL</label>
                <div className="flex gap-2">
                  <Input readOnly value={completedResult.shareUrl} className="bg-white/[0.04] border-white/[0.08] text-sm flex-1" />
                  <Button size="sm" variant="outline" className="border-white/[0.08] shrink-0"
                    onClick={() => copyToClipboard(completedResult.shareUrl, setCopiedLink)}>
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              {completedResult.encryptionPassword && (
                <div className="space-y-2">
                  <label className="text-xs text-white/50 flex items-center gap-1"><Key className="w-3 h-3" /> Encryption Key</label>
                  <div className="flex gap-2">
                    <Input readOnly value={completedResult.encryptionPassword} className="bg-white/[0.04] border-white/[0.08] text-sm flex-1 font-mono" />
                    <Button size="sm" variant="outline" className="border-white/[0.08] shrink-0"
                      onClick={() => copyToClipboard(completedResult.encryptionPassword!, setCopiedKey)}>
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-400/70 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Save this key - it cannot be recovered</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs text-white/50">Access Code</label>
                <p className="text-lg font-mono tracking-widest text-cyan-400">{formatAccessCode(completedResult.accessCode)}</p>
              </div>
              <button onClick={() => setShowQR(!showQR)} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                <QrCode className="w-3.5 h-3.5" /> {showQR ? 'Hide' : 'Show'} QR Code
              </button>
              <AnimatePresence>
                {showQR && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-center p-4 bg-white rounded-xl">
                    <QRCodeSVG value={completedResult.shareUrl} size={180} />
                  </motion.div>
                )}
              </AnimatePresence>
              <Button onClick={resetUpload} variant="outline" className="w-full border-white/[0.08] text-white/60 hover:text-white">
                Upload Another File
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {!user && step === 'select' && (
          <p className="text-center text-xs text-white/30">
            <Link href="/login" className="text-cyan-400 hover:underline">Sign in</Link> for larger uploads, custom expiry, and file management
          </p>
        )}
      </div>
    </div>
  );
}
