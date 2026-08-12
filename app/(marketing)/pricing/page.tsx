'use client';

import { motion } from 'framer-motion';
import { Check, X, Shield, Crown, Zap } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PLANS } from '@/lib/plans';

const planIcons: Record<string, any> = { free: Shield, pro: Crown, ultra: Zap };
const planBadges: Record<string, string | null> = { free: null, pro: 'Most Popular', ultra: 'Best Value' };

function buildFeatures(planId: string) {
  const p = PLANS[planId];
  const features = [
    { label: `${planId === 'ultra' ? 'Unlimited' : p.storageLimit >= 1024*1024*1024 ? Math.round(p.storageLimit/1024/1024/1024)+'GB' : Math.round(p.storageLimit/1024/1024)+'MB'} storage`, included: true },
    { label: `${p.maxUploadSize >= 1024*1024*1024 ? Math.round(p.maxUploadSize/1024/1024/1024)+'GB' : Math.round(p.maxUploadSize/1024/1024)+'MB'} max uploads`, included: true },
    { label: p.allowVideo ? 'Image + video uploads' : 'Image uploads', included: true },
    { label: 'AES-256 encryption', included: true },
    { label: 'Self-destruct files', included: true },
    { label: planId === 'free' ? '7-day expiry' : 'No expiry', included: true },
    { label: 'Galleries', included: true },
    { label: 'Vault notes', included: true },
    { label: 'Video uploads', included: p.allowVideo },
    { label: p.allowAdvancedAnalytics ? 'Full analytics' : 'Basic analytics', included: true },
    { label: 'Scheduled unlock', included: p.allowScheduledUnlock },
    { label: 'No ads', included: p.allowNoAds },
    { label: 'Priority support', included: p.allowPrioritySupport },
  ];
  return features;
}

const planOrder = ['free', 'pro', 'ultra'];

const comparisonRows = [
  { feature: 'Storage', getKey: (p: any) => p.id === 'ultra' ? 'Unlimited' : p.storageLimit >= 1024*1024*1024 ? Math.round(p.storageLimit/1024/1024/1024)+'GB' : Math.round(p.storageLimit/1024/1024)+'MB' },
  { feature: 'Max upload size', getKey: (p: any) => Math.round(p.maxUploadSize/1024/1024)+'MB' },
  { feature: 'File types', getKey: (p: any) => p.allowVideo ? 'Images + Video' : 'Images' },
  { feature: 'Encryption', getKey: () => 'AES-256' },
  { feature: 'Self-destruct', getKey: () => 'Yes' },
  { feature: 'File retention', getKey: (p: any) => p.id === 'free' ? '7 days' : 'Unlimited' },
  { feature: 'Galleries', getKey: (p: any) => p.allowUnlimitedGalleries ? 'Unlimited' : 'Yes' },
  { feature: 'Vault notes', getKey: () => 'Yes' },
  { feature: 'Analytics', getKey: (p: any) => p.allowAdvancedAnalytics ? 'Full' : 'Basic' },
  { feature: 'Scheduled unlock', getKey: (p: any) => p.allowScheduledUnlock ? 'Yes' : 'No' },
  { feature: 'Ads', getKey: (p: any) => p.allowNoAds ? 'No' : 'Yes' },
  { feature: 'Priority support', getKey: (p: any) => p.allowPrioritySupport ? 'Yes' : 'No' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#080B14]">
      <Navbar />

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-space text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Simple Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/50 text-lg max-w-2xl mx-auto"
          >
            Start free, upgrade when you need more. Every plan includes end-to-end encryption.
          </motion.p>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {planOrder.map((planId, i) => {
            const plan = PLANS[planId];
            const Icon = planIcons[planId];
            const isHighlight = planId === 'pro';
            const features = buildFeatures(planId);
            const cta = planId === 'free' ? 'Get Started' : `Start ${plan.name}`;
            const ctaHref = planId === 'free' ? '/upload' : '/dashboard';
            return (
              <motion.div
                key={planId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  isHighlight
                    ? 'bg-gradient-to-b from-cyan-500/10 to-blue-600/5 border-2 border-cyan-500/30 ring-1 ring-cyan-500/20'
                    : 'bg-white/[0.03] border border-white/[0.08]'
                }`}
              >
                {planBadges[planId] && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white">
                    {planBadges[planId]}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${isHighlight ? 'text-cyan-400' : 'text-white/50'}`} />
                  <h3 className="font-space text-lg font-semibold text-white">{plan.name}</h3>
                </div>
                <div className="mb-1">
                  <span className="text-3xl font-bold text-white">{plan.priceDisplay}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-white/40 mb-6">
                  {planId === 'free' ? 'Get started with basic encrypted sharing' : planId === 'pro' ? 'For power users who need more storage and features' : 'Unlimited everything for professionals'}
                </p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2 text-sm">
                      {f.included ? <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-white/20 shrink-0" />}
                      <span className={f.included ? 'text-white/70' : 'text-white/25'}>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <Link href={ctaHref} className="block">
                  <Button className={`w-full ${isHighlight ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 hover:opacity-90' : 'bg-white/[0.06] text-white border-white/10 hover:bg-white/[0.1]'}`}>
                    {cta}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="pb-24 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-4xl mx-auto">
          <h2 className="font-space text-2xl font-bold text-white text-center mb-8">Feature Comparison</h2>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="text-left px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium text-white/50">Feature</th>
                  {planOrder.map(id => (
                    <th key={id} className={`text-center px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium ${id === 'pro' ? 'text-cyan-400' : id === 'ultra' ? 'text-amber-400' : 'text-white/50'}`}>
                      {PLANS[id].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, ri) => (
                  <tr key={row.feature} className={`border-b border-white/[0.04] last:border-0 ${ri % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-3 sm:px-5 py-3 text-xs sm:text-sm text-white/70">{row.feature}</td>
                    {planOrder.map(id => {
                      const val = row.getKey(PLANS[id]);
                      const isProCol = id === 'pro';
                      const isUltraCol = id === 'ultra';
                      return (
                        <td key={id} className={`px-3 sm:px-5 py-3 text-xs sm:text-sm text-center ${isProCol ? 'text-cyan-300' : isUltraCol ? 'text-amber-300 font-medium' : 'text-white/40'}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
