import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '../components/Web3Provider';
import { Navbar } from '../components/Navbar';
import { cn } from '../lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MST SaralChain',
  description: 'Enterprise Web3 Supply Chain Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-slate-50 font-sans text-slate-900 antialiased', inter.variable)}>
        <Web3Provider>
          <Navbar />
          <main className="flex flex-col flex-1">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
