"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PackageCheck } from "lucide-react";

export function ReleaseEscrowButton({ batchId, stage }: { batchId: string, stage: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRelease = async () => {
    setLoading(true);
    setErrorMsg("");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/escrow/${batchId}/release`, {
        method: "POST",
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to release escrow");
      
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center flex flex-col items-center gap-2">
        <CheckCircle2 className="w-8 h-8 text-green-400" />
        <p className="text-green-400 font-bold">Payment Released!</p>
        <p className="text-xs text-green-300">Supplier has been paid via smart contract.</p>
      </div>
    );
  }

  // To prevent releasing before it reaches the store, though we can allow it for demo flexibility
  const isReady = stage === "RETAIL_READY" || stage === "CUSTOMS_CLEARED";

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-gray-300 mb-4">
          Confirm that you have received the goods in satisfactory condition. 
          This will automatically release the locked funds to the supplier.
        </p>
        <Button 
          className="w-full bg-green-600 hover:bg-green-700" 
          onClick={handleRelease}
          disabled={loading || !isReady}
        >
          <PackageCheck className="w-4 h-4 mr-2" />
          {loading ? "Releasing..." : "Confirm Receipt & Release Funds"}
        </Button>
        {!isReady && (
          <p className="text-xs text-orange-400 mt-2 text-center">
            Warning: Batch should be CUSTOMS_CLEARED or RETAIL_READY.
          </p>
        )}
      </div>
      
      {errorMsg && (
        <p className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-500/30">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
