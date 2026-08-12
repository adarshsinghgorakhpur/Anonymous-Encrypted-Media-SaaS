import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AdSenseScript } from '@/components/ads/adsense-script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

const OG_IMAGE = 'https://raw.githubusercontent.com/adarshsinghgorakhpur/Shared-database/refs/heads/main/XCrypt%20encryption/xcrypt%20meta.png';
const FAVICON = 'https://raw.githubusercontent.com/adarshsinghgorakhpur/Shared-database/refs/heads/main/XCrypt%20encryption/x%20logo.png';

export const metadata: Metadata = {
  title: 'XCrypt — Anonymous Encrypted Media Cloud',
  description: 'Upload. Encrypt. Share. Anonymous encrypted media sharing with AES-256 encryption, self-destructing files, and secure vaults.',
  metadataBase: new URL('https://xcrypt.app'),
  icons: {
    icon: FAVICON,
    shortcut: FAVICON,
    apple: FAVICON,
  },
  openGraph: {
    title: 'XCrypt — Anonymous Encrypted Media Cloud',
    description: 'Upload. Encrypt. Share.',
    siteName: 'XCrypt',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'XCrypt - Anonymous Encrypted Media Cloud' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XCrypt — Anonymous Encrypted Media Cloud',
    description: 'Upload. Encrypt. Share.',
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_ID;

  return (
    <html lang="en" className="dark">
      <head>
        {umamiId && (
          <script
            async
            defer
            src="https://analytics.umami.is/script.js"
            data-website-id={umamiId}
          />
        )}
      </head>
      <body className={`${inter.variable} ${space.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <AdSenseScript />
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
