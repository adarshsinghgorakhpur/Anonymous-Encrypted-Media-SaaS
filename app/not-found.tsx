import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080B14] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white font-space">404</h1>
          <p className="text-lg text-white/40">Page not found</p>
          <p className="text-sm text-white/30 mt-2">The page you are looking for doesn't exist or has been moved.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
