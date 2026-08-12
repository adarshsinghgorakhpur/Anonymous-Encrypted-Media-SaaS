'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface Stats {
  totalUsers: number;
  totalUploads: number;
  totalViews: number;
  totalDecryptions: number;
}

function useAnimatedNumber(target: number, duration: number = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let raf = 0;
    const start = performance.now();
    const startVal = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(startVal + (target - startVal) * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
      else setValue(target);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatCard({ label, value, icon, delay }: { label: string; value: number; icon: any; delay: number }) {
  const animated = useAnimatedNumber(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mx-auto mb-3">
        <icon.component className="w-5 h-5 text-cyan-400" />
      </div>
      <motion.p key={animated} className="font-space text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {animated.toLocaleString()}
      </motion.p>
      <p className="text-white/40 text-xs sm:text-sm mt-1">{label}</p>
    </motion.div>
  );
}

const ICONS = {
  Users: (props: any) => {
    const { Users } = require('lucide-react');
    return <Users {...props} />;
  },
  Upload: (props: any) => {
    const { Upload } = require('lucide-react');
    return <Upload {...props} />;
  },
  Eye: (props: any) => {
    const { Eye } = require('lucide-react');
    return <Eye {...props} />;
  },
  Unlock: (props: any) => {
    const { Unlock } = require('lucide-react');
    return <Unlock {...props} />;
  },
};

export function LiveCounters() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalUploads: 0, totalViews: 0, totalDecryptions: 0 });

  useEffect(() => {
    (async () => {
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: totalUploads } = await supabase.from('media_uploads').select('*', { count: 'exact', head: true }).eq('is_destroyed', false);
      const { data: viewsData } = await supabase.from('media_uploads').select('view_count').eq('is_destroyed', false);
      const totalViews = (viewsData || []).reduce((sum: number, r: any) => sum + (r.view_count || 0), 0);
      const { count: totalDecryptions } = await supabase.from('analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'view');
      setStats({
        totalUsers: totalUsers || 0,
        totalUploads: totalUploads || 0,
        totalViews: totalViews || 0,
        totalDecryptions: totalDecryptions || 0,
      });
    })();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, component: ICONS.Users, delay: 0 },
    { label: 'Total Uploads', value: stats.totalUploads, component: ICONS.Upload, delay: 0.1 },
    { label: 'Total Views', value: stats.totalViews, component: ICONS.Eye, delay: 0.2 },
    { label: 'Total Decryptions', value: stats.totalDecryptions, component: ICONS.Unlock, delay: 0.3 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} label={card.label} value={card.value} icon={card} delay={card.delay} />
      ))}
    </div>
  );
}
