'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Web3RBACProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  requireWallet?: string;
}

export function Web3RBAC({ children, fallbackMessage, requireWallet }: Web3RBACProps) {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-slate-200 bg-white shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-slate-900">Wallet Connection Required</h3>
        <p className="mb-6 text-sm text-slate-500 max-w-md">
          {fallbackMessage || "You must connect your Web3 wallet (e.g. MetaMask) to interact with the Supply Chain network and verify your identity."}
        </p>
        <ConnectButton />
      </div>
    );
  }

  // If a specific wallet is required for this action (e.g., verifying ownership)
  if (requireWallet && address?.toLowerCase() !== requireWallet.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-rose-200 bg-rose-50">
        <h3 className="mb-2 text-md font-semibold text-rose-800">Access Denied</h3>
        <p className="text-sm text-rose-600">
          Your connected wallet ({address?.slice(0, 6)}...{address?.slice(-4)}) does not have permission to perform this action.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
