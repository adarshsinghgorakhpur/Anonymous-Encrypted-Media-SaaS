'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Users, HardDrive, Crown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { generateAccessCode } from '@/lib/access-code';
import { formatStorage } from '@/lib/upload';
import type { ReferralCode, Referral } from '@/lib/supabase/types';

export default function ReferralPage() {
  const { user, isPremium } = useAuthStore();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: codeData } = await (supabase.from('referral_codes') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setReferralCode(codeData as any);

    if (codeData) {
      const { data: refsData } = await (supabase.from('referrals') as any)
        .select('*')
        .eq('referrer_code_id', codeData.id)
        .order('created_at', { ascending: false });
      setReferrals(refsData || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  async function createReferralCode() {
    if (!user) return;
    setCreating(true);
    const code = generateAccessCode().slice(0, 8);
    await (supabase.from('referral_codes') as any).insert({
      user_id: user.id,
      code,
      bonus_storage_bytes: 10 * 1024 * 1024, // 10MB per referral
      bonus_premium_days: 7,
    });
    setCreating(false);
    load();
  }

  const referralLink = referralCode ? `${window.location.origin}/login?ref=${referralCode.code}` : '';

  async function copyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
          <Gift className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-space">Referral Program</h1>
          <p className="text-sm text-white/40">Invite friends and earn rewards</p>
        </div>
      </div>

      {/* Rewards info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-sm font-medium text-white">Storage Bonus</p>
          </div>
          <p className="text-2xl font-bold text-white">+10MB</p>
          <p className="text-xs text-white/40 mt-1">Per successful referral</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-white">Premium Days</p>
          </div>
          <p className="text-2xl font-bold text-white">+7 days</p>
          <p className="text-xs text-white/40 mt-1">Free premium per referral</p>
        </motion.div>
      </div>

      {/* Referral code and link */}
      {!referralCode ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center">
          <Gift className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm mb-4">Create your referral code to start inviting friends</p>
          <button onClick={createReferralCode} disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition">
            <Gift className="w-4 h-4" />{creating ? 'Creating...' : 'Generate Referral Code'}
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">Your Referral Link</h3>
          <div className="flex gap-2">
            <input readOnly value={referralLink} className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white font-mono" />
            <button onClick={copyLink}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition flex items-center gap-1.5">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>Code: <span className="font-mono text-white/50">{referralCode.code}</span></span>
            <span>Uses: {referralCode.uses}</span>
            <span>Bonus: {formatStorage(referralCode.bonus_storage_bytes)}</span>
          </div>
        </motion.div>
      )}

      {/* Referrals list */}
      {referralCode && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
            <Users className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-medium text-white">Referrals ({referrals.length})</h3>
          </div>
          {referrals.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">No referrals yet. Share your link to start earning rewards!</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_successful ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {r.is_successful ? 'Successful' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-xs text-white/30">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isPremium && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-white font-medium">Get more referral rewards with Pro</p>
              <p className="text-sm text-white/50">Pro users earn double storage bonuses</p>
            </div>
          </div>
          <Link href="/pricing" className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition">Upgrade</Link>
        </motion.div>
      )}
    </div>
  );
}
