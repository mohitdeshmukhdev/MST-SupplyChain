import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { PackageSearch } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-slate-900 transition-opacity hover:opacity-80">
          <PackageSearch className="h-6 w-6 text-slate-900" />
          <span className="text-xl font-bold tracking-tight">MST SaralChain</span>
        </Link>
        <div className="flex items-center gap-4">
          <ConnectButton 
            chainStatus="icon" 
            showBalance={false}
          />
        </div>
      </div>
    </nav>
  );
}
