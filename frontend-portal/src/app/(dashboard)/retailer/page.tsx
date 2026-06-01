"use client";

import { useState } from "react";
import { Store, QrCode } from "lucide-react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FundEscrowButton } from "@/components/retailer/FundEscrowButton";
import { ReleaseEscrowButton } from "@/components/retailer/ReleaseEscrowButton";

export default function RetailerPortal() {
  const { isConnected } = useAccount();
  const [batchId, setBatchId] = useState("");
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    
    setLoading(true);
    setErrorMsg("");
    setActiveBatch(null);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/batch/${batchId}`);
      if (!res.ok) throw new Error("Batch not found");
      const data = await res.json();
      setActiveBatch(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Store className="w-10 h-10 text-blue-400" />
          Retailer Portal
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Fund escrows and confirm receipt of goods to auto-release payments.
        </p>
      </div>

      {!isConnected ? (
        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
          Please connect your retailer wallet.
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle>Lookup Batch</CardTitle>
              <CardDescription>Scan the QR code or enter the batch ID to manage its escrow.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <QrCode className="h-5 w-5 text-gray-500" />
                  </div>
                  <Input 
                    placeholder="Enter Batch UUID..." 
                    className="pl-10"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Lookup"}
                </Button>
              </form>
              {errorMsg && <p className="text-red-400 text-sm mt-3">{errorMsg}</p>}
            </CardContent>
          </Card>

          {activeBatch && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Batch Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Product</span>
                    <span className="font-medium text-slate-900">{activeBatch.productName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Quantity</span>
                    <span className="font-medium text-slate-900">{activeBatch.quantity} {activeBatch.unit}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Stage</span>
                    <span className="font-medium text-blue-400">{activeBatch.stage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Escrow Status</span>
                    <span className="font-bold text-green-400">
                      {activeBatch.escrow?.status || "UNFUNDED"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Escrow Actions</CardTitle>
                  <CardDescription>Manage smart contract payments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(!activeBatch.escrow || activeBatch.escrow.status === 'UNFUNDED') ? (
                    <FundEscrowButton 
                      batchId={activeBatch.id} 
                      blockchainBatchId={activeBatch.blockchainId}
                      sellerAddress={activeBatch.manufacturer.walletAddress} 
                    />
                  ) : activeBatch.escrow.status === 'FUNDED' ? (
                    <ReleaseEscrowButton batchId={activeBatch.id} stage={activeBatch.stage} />
                  ) : (
                    <div className="p-4 bg-green-900/20 text-green-400 rounded-lg text-center border border-green-500/30">
                      Funds have been released to the supplier.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
