'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Timer, UserX, LockKeyhole, ImageOff, KeyRound, Upload, Eye, LayoutDashboard, Image, Lock, BarChart3, Crown, Check, X, Zap, Clock, ChevronDown, Quote, Star } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LiveCounters } from '@/components/home/live-counters'

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

const faqs = [
  { q: 'Is my data really encrypted?', a: 'Yes. Every file is encrypted with AES-256-GCM on your device before it is uploaded. The encryption key never touches our servers in a form we can read — only you and whoever you share the access code with can decrypt it.' },
  { q: 'Do I need an account to use XCrypt?', a: 'No. You can upload and share files anonymously without signing up. Creating a free account unlocks galleries, vault notes, analytics, and upload history.' },
  { q: 'What happens to expired files?', a: 'When a file expires or reaches its view limit, it is permanently destroyed — the encrypted blob is deleted from storage and the metadata is marked as destroyed. It cannot be recovered.' },
  { q: 'Can I share files on social media?', a: 'Yes. After uploading, you get a shareable link plus QR code. You can share directly to WhatsApp, Telegram, email, X (Twitter), and Facebook.' },
  { q: 'What is the difference between Pro and Ultra?', a: 'Pro gives you 20GB of storage, video uploads, full analytics, and scheduled unlock. Ultra removes all limits — unlimited storage, uploads, galleries, and vault notes.' },
  { q: 'Is there a referral program?', a: 'Yes. Every user gets a referral link. When someone signs up through your link, you earn 10MB of bonus storage and 7 days of free premium per successful referral.' },
]

const testimonials = [
  { name: 'Aarav S.', role: 'Security Researcher', text: 'XCrypt is the cleanest encrypted sharing tool I have used. The self-destruct feature and access codes give me complete control over who sees my files and for how long.', rating: 5 },
  { name: 'Meera K.', role: 'Freelance Photographer', text: 'I send client proofs through XCrypt every week. The galleries feature and password protection mean my work never leaks before the client signs off.', rating: 5 },
  { name: 'Daniel R.', role: 'Startup Founder', text: 'We use XCrypt Vault for sharing sensitive internal docs. Knowing everything is encrypted client-side gives us peace of mind without the overhead of enterprise tools.', rating: 5 },
]

function FaqItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-white/90">{faq.q}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-white/50 leading-relaxed">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

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

      {/* Live Counters */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <LiveCounters />
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

      {/* Testimonials */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Testimonials</p>
          <h2 className="font-space text-3xl md:text-4xl font-bold">Trusted by Professionals</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <Quote className="w-6 h-6 text-cyan-400/40 mb-3" />
              <p className="text-sm text-white/60 leading-relaxed mb-4">{t.text}</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs text-white font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-3">FAQ</p>
          <h2 className="font-space text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={faq.q} faq={faq} index={i} />
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
