'use client';

import { motion } from 'framer-motion';
import { Check, X, Shield, Crown, Zap } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Get started with basic encrypted sharing',
    icon: Shield,
    highlight: false,
    badge: null,
    features: [
      { label: '50MB storage', included: true },
      { label: '10MB max uploads', included: true },
      { label: 'Image uploads', included: true },
      { label: 'AES-256 encryption', included: true },
      { label: 'Self-destruct files', included: true },
      { label: '7-day expiry', included: true },
      { label: 'Video uploads', included: false },
      { label: 'Galleries', included: false },
      { label: 'Vault notes', included: false },
      { label: 'Analytics', included: false },
      { label: 'Scheduled unlock', included: false },
      { label: 'No ads', included: false },
    ],
    cta: 'Get Started',
    ctaHref: '/upload',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    description: 'For power users who need more storage and features',
    icon: Crown,
    highlight: true,
    badge: 'Most Popular',
    features: [
      { label: '20GB storage', included: true },
      { label: '500MB max uploads', included: true },
      { label: 'Image + video uploads', included: true },
      { label: 'AES-256 encryption', included: true },
      { label: 'Self-destruct files', included: true },
      { label: 'No expiry', included: true },
      { label: 'Full analytics', included: true },
      { label: 'Galleries', included: true },
      { label: 'Vault notes', included: true },
      { label: 'Scheduled unlock', included: true },
      { label: 'No ads', included: true },
      { label: 'Priority support', included: true },
    ],
    cta: 'Start Pro',
    ctaHref: '/dashboard',
  },
  {
    name: 'Ultra',
    price: '$29',
    period: '/mo',
    description: 'Unlimited everything for professionals',
    icon: Zap,
    highlight: false,
    badge: 'Best Value',
    features: [
      { label: 'Unlimited storage', included: true },
      { label: '500MB max uploads', included: true },
      { label: 'Image + video uploads', included: true },
      { label: 'AES-256 encryption', included: true },
      { label: 'Self-destruct files', included: true },
      { label: 'No expiry', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Unlimited galleries', included: true },
      { label: 'Vault notes', included: true },
      { label: 'Scheduled unlock', included: true },
      { label: 'No ads', included: true },
      { label: 'Priority delivery', included: true },
    ],
    cta: 'Go Ultra',
    ctaHref: '/dashboard',
  },
];

const comparisonRows = [
  { feature: 'Storage', free: '50MB', pro: '20GB', ultra: 'Unlimited' },
  { feature: 'Max upload size', free: '10MB', pro: '500MB', ultra: '500MB' },
  { feature: 'File types', free: 'Images', pro: 'Images + Video', ultra: 'Images + Video' },
  { feature: 'Encryption', free: 'AES-256', pro: 'AES-256', ultra: 'AES-256' },
  { feature: 'Self-destruct', free: 'Yes', pro: 'Yes', ultra: 'Yes' },
  { feature: 'File retention', free: '7 days', pro: 'Unlimited', ultra: 'Unlimited' },
  { feature: 'Analytics', free: 'No', pro: 'Full', ultra: 'Advanced' },
  { feature: 'Galleries', free: 'No', pro: 'Yes', ultra: 'Unlimited' },
  { feature: 'Vault notes', free: 'No', pro: 'Yes', ultra: 'Yes' },
  { feature: 'Scheduled unlock', free: 'No', pro: 'Yes', ultra: 'Yes' },
  { feature: 'Ads', free: 'Yes', pro: 'No', ultra: 'No' },
  { feature: 'Priority support', free: 'No', pro: 'Yes', ultra: 'Yes' },
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
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-cyan-500/10 to-blue-600/5 border-2 border-cyan-500/30 ring-1 ring-cyan-500/20'
                  : 'bg-white/[0.03] border border-white/[0.08]'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-2 mb-4">
                <plan.icon className={`w-5 h-5 ${plan.highlight ? 'text-cyan-400' : 'text-white/50'}`} />
                <h3 className="font-space text-lg font-semibold text-white">{plan.name}</h3>
              </div>

              <div className="mb-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-white/40 text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-white/40 mb-6">{plan.description}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-white/20 shrink-0" />
                    )}
                    <span className={f.included ? 'text-white/70' : 'text-white/25'}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref} className="block">
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 hover:opacity-90'
                      : 'bg-white/[0.06] text-white border-white/10 hover:bg-white/[0.1]'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="pb-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="font-space text-2xl font-bold text-white text-center mb-8">Feature Comparison</h2>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-sm font-medium text-white/50">Feature</th>
                  <th className="text-center px-5 py-3 text-sm font-medium text-white/50">Free</th>
                  <th className="text-center px-5 py-3 text-sm font-medium text-cyan-400">Pro</th>
                  <th className="text-center px-5 py-3 text-sm font-medium text-amber-400">Ultra</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-3 text-sm text-white/70">{row.feature}</td>
                    <td className="px-5 py-3 text-sm text-white/40 text-center">{row.free}</td>
                    <td className="px-5 py-3 text-sm text-cyan-300 text-center">{row.pro}</td>
                    <td className="px-5 py-3 text-sm text-amber-300 text-center font-medium">{row.ultra}</td>
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
