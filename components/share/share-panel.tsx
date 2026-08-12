'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, QrCode, MessageCircle, Send, Mail, Twitter, Facebook, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getShareLink, copyToClipboard } from '@/lib/shared';

interface SharePanelProps {
  url: string;
  title?: string;
  className?: string;
}

export function SharePanel({ url, title = 'Check out this encrypted file on XCrypt', className = '' }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function openShare(platform: 'whatsapp' | 'telegram' | 'email' | 'twitter' | 'facebook') {
    window.open(getShareLink(platform, url, title), '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  const buttons = [
    { platform: 'whatsapp' as const, icon: MessageCircle, label: 'WhatsApp', color: 'hover:bg-emerald-500/20 hover:text-emerald-400' },
    { platform: 'telegram' as const, icon: Send, label: 'Telegram', color: 'hover:bg-cyan-500/20 hover:text-cyan-400' },
    { platform: 'email' as const, icon: Mail, label: 'Email', color: 'hover:bg-blue-500/20 hover:text-blue-400' },
    { platform: 'twitter' as const, icon: Twitter, label: 'X (Twitter)', color: 'hover:bg-sky-500/20 hover:text-sky-400' },
    { platform: 'facebook' as const, icon: Facebook, label: 'Facebook', color: 'hover:bg-indigo-500/20 hover:text-indigo-400' },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2">
        <button onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button onClick={() => setShowQR(!showQR)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition">
          <QrCode className="w-3.5 h-3.5" />QR
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {buttons.map((btn) => (
          <button key={btn.platform} onClick={() => openShare(btn.platform)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 transition ${btn.color}`}
            title={btn.label}>
            <btn.icon className="w-4 h-4" />
            <span className="text-[10px] hidden sm:block">{btn.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden flex justify-center">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={url} size={160} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
