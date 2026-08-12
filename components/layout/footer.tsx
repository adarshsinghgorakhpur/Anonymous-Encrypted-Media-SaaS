import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#060910]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="https://raw.githubusercontent.com/adarshsinghgorakhpur/Shared-database/refs/heads/main/XCrypt%20encryption/xcrypt.png"
                alt="XCrypt"
                width={100}
                height={28}
                className="h-7 w-auto"
              />
            </Link>
            <p className="text-white/30 text-xs leading-relaxed">
              Anonymous encrypted media sharing. Upload, encrypt, and share with confidence.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Product</h4>
            <div className="space-y-2">
              <Link href="/upload" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Upload</Link>
              <Link href="/pricing" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Pricing</Link>
              <Link href="/dashboard" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Dashboard</Link>
              <Link href="/login" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Login</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Security</h4>
            <div className="space-y-2">
              <span className="block text-sm text-white/30">AES-256 Encryption</span>
              <span className="block text-sm text-white/30">Zero-Knowledge</span>
              <span className="block text-sm text-white/30">EXIF Stripping</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Legal</h4>
            <div className="space-y-2">
              <Link href="/privacy" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="block text-sm text-white/30 hover:text-white/60 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/20 text-xs">2026 XCrypt. All rights reserved.</p>
          <p className="text-white/20 text-xs">Upload. Encrypt. Share.</p>
        </div>
      </div>
    </footer>
  );
}
