import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '../components/Web3Provider';
import { Navbar } from '../components/Navbar';
import { cn } from '../lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MST Supply Chain',
  description: 'Enterprise Web3 Supply Chain Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden', inter.variable)}>
        <Web3Provider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            {children}
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
