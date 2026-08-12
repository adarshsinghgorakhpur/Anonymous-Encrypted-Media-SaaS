'use client';

import { useEffect } from 'react';

export function AdSenseScript() {
  useEffect(() => {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';
    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    if (!isEnabled || !clientId) return;

    const existing = document.querySelector(
      `script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}"]`
    );
    if (existing) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, []);

  return null;
}
