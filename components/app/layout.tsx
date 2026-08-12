import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'XCrypt — Anonymous Encrypted Media Cloud',
  description: 'Upload. Encrypt. Share. Anonymous encrypted media sharing with AES-256 encryption, self-destructing files, and secure vaults.',
  metadataBase: new URL('https://xcrypt.app'),
  openGraph: {
    title: 'XCrypt — Anonymous Encrypted Media Cloud',
    description: 'Upload. Encrypt. Share.',
    siteName: 'XCrypt',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XCrypt — Anonymous Encrypted Media Cloud',
    description: 'Upload. Encrypt. Share.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${space.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
