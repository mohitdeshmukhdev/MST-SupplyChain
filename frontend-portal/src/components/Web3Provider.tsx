'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { defineChain } from 'viem';

// Define the custom MST Testnet
export const mstTestnet = defineChain({
  id: 91562037, // Updated Chain ID for MST Testnet
  name: 'MST Testnet',
  nativeCurrency: { name: 'tMSTC', symbol: 'tMSTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnetrpc.mstblockchain.com'] },
  },
  blockExplorers: {
    default: { name: 'MSTScan', url: 'https://testnet.mstscan.com/' },
  },
});

const config = getDefaultConfig({
  appName: 'MST Supply Chain',
  projectId: 'YOUR_PROJECT_ID', // Replaced with valid string for demo
  chains: [mstTestnet],
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={lightTheme({
            accentColor: '#0f172a', // Slate 900
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
