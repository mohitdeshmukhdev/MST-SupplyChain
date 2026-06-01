"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ShieldCheck, FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { DocumentUpload } from "../../../components/DocumentUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CustomsDashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const [batchId, setBatchId] = useState("");
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
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

  const handleClearance = async () => {
    if (!activeBatch) return;
    setClearing(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`}/api/batch/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: activeBatch.id,
          stage: "CUSTOMS_CLEARED"
        })
      });

      if (!res.ok) throw new Error("Failed to clear customs");
      
      // Refresh batch data
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/batch/${batchId}`);
      const refreshedData = await refreshRes.json();
      setActiveBatch(refreshedData);
      
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setClearing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
          Please connect your Customs Agent wallet.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-emerald-600" />
          Customs & Border Clearance
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Review batch documents, upload compliance certificates to IPFS, and authorize border clearance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Batch</CardTitle>
              <CardDescription>Enter a Batch ID to review its compliance status.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                  placeholder="Enter Batch ID..." 
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </Button>
              </form>
              {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
            </CardContent>
          </Card>

          {activeBatch && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Product</p>
                    <p className="font-semibold text-slate-900">{activeBatch.productName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Stage</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {activeBatch.stage.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-500">Quantity</p>
                    <p className="font-medium">{activeBatch.quantity} {activeBatch.unit}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Origin</p>
                    <p className="font-medium truncate" title={activeBatch.originFacility}>{activeBatch.originFacility}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-slate-400" />
                    Attached Documents ({activeBatch.documents?.length || 0})
                  </h4>
                  {activeBatch.documents && activeBatch.documents.length > 0 ? (
                    <ul className="space-y-2">
                      {activeBatch.documents.map((doc: any) => (
                        <li key={doc.id} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                          <span className="font-medium">{doc.docType.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-slate-500 font-mono truncate max-w-[120px]">{doc.ipfsCid}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No documents attached yet.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  {activeBatch.stage === 'CUSTOMS_CLEARED' ? (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Border Clearance Approved
                    </div>
                  ) : (
                    <Button 
                      onClick={handleClearance} 
                      disabled={clearing || activeBatch.stage === 'RETAIL_READY'}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {clearing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authorizing...</>
                      ) : (
                        <><ShieldCheck className="w-4 h-4 mr-2" /> Approve Border Clearance</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {activeBatch ? (
            <DocumentUpload batchId={activeBatch.id} onSuccess={() => handleSearch({ preventDefault: () => {} } as any)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">Select a Batch</h3>
              <p className="text-sm text-slate-500">Search for a batch ID to view its details and upload compliance documents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
