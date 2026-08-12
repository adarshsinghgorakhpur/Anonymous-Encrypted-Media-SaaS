'use client'

import { motion } from 'framer-motion'
import { Shield, Timer, UserX, LockKeyhole, ImageOff, KeyRound, Upload, Eye, LayoutDashboard, Image, Lock, BarChart3, Crown, Check, X, Zap, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
}

const features = [
  { icon: Shield, title: 'AES-256 Encryption', desc: 'Military-grade encryption protects every file at rest and in transit.' },
  { icon: Timer, title: 'Self-Destruct', desc: 'Files auto-delete after a set time — no trace left behind.' },
  { icon: UserX, title: 'Anonymous Uploads', desc: 'No account required. Upload and share without revealing your identity.' },
  { icon: LockKeyhole, title: 'Password Protection', desc: 'Add an extra layer of security with custom passwords.' },
  { icon: ImageOff, title: 'EXIF Removal', desc: 'Metadata is stripped automatically to protect your privacy.' },
  { icon: KeyRound, title: 'Access Codes', desc: 'Generate unique codes to control who can view your files.' },
]

const steps = [
  { n: '1', title: 'Upload', desc: 'Drag and drop your file — images or videos.' },
  { n: '2', title: 'Encrypt', desc: 'Your file is encrypted client-side before it leaves your device.' },
  { n: '3', title: 'Share', desc: 'Send the secure link and access code to your recipient.' },
]

const dashboardPreviews = [
  { icon: BarChart3, title: 'Analytics', desc: 'Track views, downloads, and access patterns in real-time.', color: 'from-cyan-500 to-blue-600' },
  { icon: Image, title: 'Galleries', desc: 'Organize uploads into password-protected galleries.', color: 'from-emerald-500 to-teal-600' },
  { icon: Lock, title: 'Vault', desc: 'Encrypted notes and files only you can access.', color: 'from-amber-500 to-orange-600' },
  { icon: Clock, title: 'Scheduled Unlock', desc: 'Set countdown timers for timed media reveals.', color: 'from-rose-500 to-pink-600' },
]

const plans = [
  {
    name: 'Free', price: '$0', period: '/mo', desc: 'Get started with basic encrypted sharing',
    features: [
      { text: '50MB storage', included: true }, { text: 'Image uploads', included: true },
      { text: 'AES-256 encryption', included: true }, { text: 'Self-destruct files', included: true },
      { text: '7-day expiry', included: true }, { text: 'Video uploads', included: false },
      { text: 'Galleries', included: false }, { text: 'Vault notes', included: false },
      { text: 'Analytics', included: false }, { text: 'No ads', included: false },
    ],
    cta: 'Get Started', href: '/upload', highlight: false,
  },
  {
    name: 'Pro', price: '$9', period: '/mo', desc: 'For power users who need more storage',
    features: [
      { text: '20GB storage', included: true }, { text: 'Image + video uploads', included: true },
      { text: 'AES-256 encryption', included: true }, { text: 'Self-destruct files', included: true },
      { text: 'No expiry', included: true }, { text: 'Full analytics', included: true },
      { text: 'Galleries', included: true }, { text: 'Vault notes', included: true },
      { text: 'Scheduled unlock', included: true }, { text: 'No ads', included: true },
    ],
    cta: 'Start Pro', href: '/pricing', highlight: true,
  },
  {
    name: 'Ultra', price: '$29', period: '/mo', desc: 'Unlimited everything for professionals',
    features: [
      { text: 'Unlimited storage', included: true }, { text: 'Image + video uploads', included: true },
      { text: 'AES-256 encryption', included: true }, { text: 'Self-destruct files', included: true },
      { text: 'No expiry', included: true }, { text: 'Advanced analytics', included: true },
      { text: 'Unlimited galleries', included: true }, { text: 'Vault notes', included: true },
      { text: 'Priority delivery', included: true }, { text: 'No ads', included: true },
    ],
    cta: 'Go Ultra', href: '/pricing', highlight: false,
  },
]

function AccessCodeCard() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault()
    if (accessCode.trim()) router.push(`/view/${accessCode}`)
  }

  return (
    <motion.form custom={1} variants={fadeUp} initial="hidden" animate="visible" onSubmit={handleAccess}
      className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Eye className="w-4 h-4 text-blue-400" />
        </div>
        <h3 className="font-semibold text-sm">View Encrypted File</h3>
      </div>
      <p className="text-white/40 text-xs mb-4">Enter an access code to view shared media</p>
      <div className="flex gap-2">
        <Input placeholder="Enter access code" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 flex-1 h-10" />
        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-10">Access</Button>
      </div>
    </motion.form>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#080B14] text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-28 pb-12 text-center">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-white/50">
            <Shield className="w-3 h-3 text-cyan-400" /> End-to-end encrypted
          </div>
        </motion.div>
        <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="font-space text-5xl md:text-7xl font-bold leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-500 bg-clip-text text-transparent">
            Upload. Encrypt. Share.
          </span>
        </motion.h1>
        <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="mt-6 max-w-xl text-lg text-white/40">
          Anonymous, end-to-end encrypted media sharing. Your files, your privacy, no compromises.
        </motion.p>
      </section>

      {/* Action Cards - Upload + Decrypt visible immediately */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <Upload className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-sm">Upload & Encrypt</h3>
            </div>
            <p className="text-white/40 text-xs mb-4">Encrypt and share files instantly with no account required</p>
            <Button asChild className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90">
              <Link href="/upload">Upload File</Link>
            </Button>
          </motion.div>
          <AccessCodeCard />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <motion.p custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center text-xs uppercase tracking-widest text-white/50 mb-10">Features</motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center mb-4">
                <f.icon className="h-4 w-4 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <motion.p custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center text-xs uppercase tracking-widest text-white/50 mb-10">How It Works</motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div key={s.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 font-space font-bold text-lg mb-4">{s.n}</div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-white/40">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Login To See The Magic */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="font-space text-3xl md:text-4xl font-bold mb-3">Login To See The Magic</h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">Unlock powerful analytics, galleries, vaults, and more with a free account</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardPreviews.map((item, i) => (
            <motion.div key={item.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] transition-colors group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div custom={4} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-8">
          <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <Link href="/login">Create Free Account</Link>
          </Button>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="font-space text-3xl md:text-4xl font-bold mb-3">Simple Pricing</h2>
          <p className="text-white/40 text-sm">Start free, upgrade when you need more</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className={`rounded-2xl p-6 flex flex-col ${plan.highlight
                ? 'bg-gradient-to-b from-cyan-500/10 to-blue-600/5 border-2 border-cyan-500/30 ring-1 ring-cyan-500/20'
                : 'bg-white/[0.02] border border-white/[0.06]'}`}>
              {plan.highlight && <div className="flex items-center gap-1 text-xs text-cyan-400 mb-3"><Crown className="w-3 h-3" /> Most Popular</div>}
              <h3 className="font-space font-bold text-lg">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-white/40 text-sm">{plan.period}</span>
              </div>
              <p className="text-white/40 text-xs mb-6">{plan.desc}</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-white/20 shrink-0" />}
                    <span className={f.included ? 'text-white/70' : 'text-white/30'}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className={`w-full ${plan.highlight
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90'
                : 'bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]'}`}>
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center">
        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="font-space text-3xl md:text-4xl font-bold mb-4">Start sharing securely</h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto text-sm">No sign-up needed. Encrypt and share your files in seconds.</p>
          <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold">
            <Link href="/upload">Upload Now</Link>
          </Button>
        </motion.div>
      </section>
    </main>
  )
}
