"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Loader2 } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

const ESCROW_REGISTRY_ADDRESS = "0x209D646a885e582b67f4e624aDfE1886308df7Af";
const ESCROW_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "batchId", "type": "uint256" },
      { "internalType": "address payable", "name": "beneficiary", "type": "address" }
    ],
    "name": "depositEscrow",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

export function FundEscrowButton({ batchId, blockchainBatchId, sellerAddress }: { batchId: string, blockchainBatchId: number, sellerAddress: string }) {
  const [amount, setAmount] = useState("0.5");
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleFund = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    writeContract({
      address: ESCROW_REGISTRY_ADDRESS as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'depositEscrow',
      args: [BigInt(blockchainBatchId), sellerAddress as `0x${string}`],
      value: parseEther(amount),
    });
  };

  if (isSuccess) {
    return (
      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
        <p className="text-green-400 font-bold mb-2">Escrow Funded Successfully!</p>
        <p className="text-sm text-green-300">Tx: {hash?.slice(0, 10)}...{hash?.slice(-8)}</p>
        <p className="text-xs text-gray-400 mt-2">The backend Relayer will sync this shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Amount (tMST)</label>
        <div className="flex gap-2">
          <Input 
            type="number" 
            step="0.01" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleFund}
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4 mr-2" />
            )}
            {isConfirming ? 'Confirming...' : 'Fund Contract'}
          </Button>
        </div>
      </div>
      {writeError && (
        <p className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-500/30">
          {(writeError as any).shortMessage || writeError.message}
        </p>
      )}
    </div>
  );
}
