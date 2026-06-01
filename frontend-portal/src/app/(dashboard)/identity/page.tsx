"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UploadCloud, CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IdentityRegistration() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [entityType, setEntityType] = useState("SUPPLIER");
  const [kycDoc, setKycDoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`}/api/identity/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          legalName,
          entityType,
          kycDocCid: kycDoc || "QmDemoIPFSHashHere1234567890", // fallback for demo
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-blue-400" />
          Entity Registration
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Onboard your organization to the MST Blockchain Supply Chain.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KYC & Role Assignment</CardTitle>
          <CardDescription>
            Submit your corporate details to be registered on-chain by the network admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
              Please connect your wallet to register an identity.
            </div>
          ) : success ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col items-center text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500" />
              <h2 className="text-2xl font-bold text-slate-900">Registration Submitted!</h2>
              <p className="text-emerald-700">
                Your entity <strong>{legalName}</strong> has been submitted. 
                Pending admin approval on the GovernanceRegistry smart contract.
              </p>
              <Badge variant="success" className="text-sm px-4 py-1">Under Review</Badge>
              <Button 
                className="mt-6 w-full max-w-xs" 
                onClick={() => {
                  const routes: Record<string, string> = {
                    'SUPPLIER': '/manufacturer/mint',
                    'TRANSPORTER': '/transporter',
                    'CUSTOMS_AGENT': '/customs',
                    'RETAILER': '/retailer'
                  };
                  router.push(routes[entityType] || '/');
                }}
              >
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Connected Wallet</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-sm">
                  {address}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Legal Corporate Name</label>
                <Input 
                  placeholder="e.g. Acme Logistics Corp" 
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Supply Chain Role</label>
                <select 
                  className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                >
                  <option value="SUPPLIER">Manufacturer / Supplier</option>
                  <option value="TRANSPORTER">Transporter / Logistics</option>
                  <option value="RETAILER">Retailer</option>
                  <option value="CUSTOMS_AGENT">Customs Agent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">KYC Document (IPFS CID)</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Qm..." 
                    value={kycDoc}
                    onChange={(e) => setKycDoc(e.target.value)}
                  />
                  <Button type="button" variant="outline" className="px-3" onClick={() => setKycDoc("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco")}>
                    <UploadCloud className="w-4 h-4 mr-2" /> Mock Upload
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  For testing, you can click the <strong>Mock Upload</strong> button or enter any dummy 46-character IPFS hash starting with "Qm" (e.g. <code>QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco</code>).
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
