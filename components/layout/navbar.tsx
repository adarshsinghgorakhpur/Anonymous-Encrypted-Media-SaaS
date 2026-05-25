'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, Upload, LogOut, Crown, LayoutDashboard, Vault, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const { user, isPremium, profile } = useAuthStore();
  const isAdmin = !!profile?.is_admin;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    setDropdownOpen(false);
  }

  const navLinks = user
    ? [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/dashboard/vault', label: 'Vault' },
      { href: '/upload', label: 'Upload' },
      ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
    ]
    : [
      { href: '/upload', label: 'Upload' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/login', label: 'Login' },
    ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080B14]/90 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">XCrypt</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href ? 'text-white bg-white/[0.06]' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs text-white font-bold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  {isPremium && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0F1420] border border-white/[0.08] shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-white/[0.06]">
                        <p className="text-sm text-white truncate">{user.email}</p>
                        {isPremium && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-1">
                            <Crown className="w-3 h-3" /> Premium
                          </span>
                        )}
                      </div>
                      <div className="p-1">
                        <Link href="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link href="/dashboard/vault" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                          <Vault className="w-4 h-4" /> Vault
                        </Link>
                        <Link href="/upload" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                          <Upload className="w-4 h-4" /> Upload
                        </Link>
                        {isAdmin && (
                          <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                            <ShieldCheck className="w-4 h-4" /> Admin
                          </Link>
                        )}
                        <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors w-full text-left">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/[0.06]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white/60 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-white/[0.06]"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06]">
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/[0.06]">
                {user ? (
                  <>
                    <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06]">Dashboard</Link>
                    <Link href="/dashboard/vault" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06]">Vault</Link>
                    {isAdmin && <Link href="/admin" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06]">Admin</Link>}
                    <button onClick={signOut} className="block w-full text-left px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06]">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/pricing" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06]">Pricing</Link>
                    <Link href="/login" className="block px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.06]">Login</Link>
                    <Link href="/upload" className="block px-3 py-2 rounded-lg text-sm text-cyan-400 hover:text-cyan-300">Upload</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
