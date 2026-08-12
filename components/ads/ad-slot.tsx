'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';

interface AdSlotProps {
  slot?: string;
  format?: string;
  className?: string;
  label?: string;
}

export function AdSlot({ slot = 'auto', format = 'auto', className = '', label = 'Advertisement' }: AdSlotProps) {
  const { isPremium } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
    setMounted(true);

    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';
    if (!isEnabled) return;

    function checkLoaded() {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        setScriptLoaded(true);
      }
    }

    checkLoaded();

    if (!scriptLoaded) {
      const interval = setInterval(() => {
        checkLoaded();
      }, 500);
      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [scriptLoaded]);

  useEffect(() => {
    if (!mounted || !scriptLoaded || pushedRef.current) return;
    if (typeof window === 'undefined' || !(window as any).adsbygoogle) return;

    try {
      (window as any).adsbygoogle.push({});
      pushedRef.current = true;
    } catch {}
  }, [mounted, scriptLoaded]);

  if (!mounted || isPremium) return null;
  if (!scriptLoaded) return null;

  const pubId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!pubId) return null;

  return (
    <div className={`ad-container ${className}`}>
      <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1 text-center">{label}</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={pubId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
