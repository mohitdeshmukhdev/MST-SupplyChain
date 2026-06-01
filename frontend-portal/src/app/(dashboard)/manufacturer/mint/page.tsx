"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Factory, PackagePlus, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MintBatch() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    gtin: "01234567890128",
    productName: "Premium Organic Coffee Beans",
    originFacility: "Bogota Highland Farms, Colombia",
    quantity: "500",
    unit: "kg",
    weightTonnes: "0.5"
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`}/api/batch/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          weightTonnes: parseFloat(formData.weightTonnes),
          manufacturerWallet: address
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to mint batch");
      
      // Redirect to the new batch dashboard
      if (data.batch && data.batch.id) {
        router.push(`/dashboard/${data.batch.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Factory className="w-10 h-10 text-blue-400" />
          Mint Production Batch
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Create a permanent, cryptographic identity for a new physical product batch on the blockchain.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product & Production Details</CardTitle>
          <CardDescription>
            This data will be anchored immutably to the MST Blockchain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
              Please connect your manufacturer wallet to mint a batch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-purple-400"/> GS1 GTIN (Barcode)
                  </label>
                  <Input 
                    name="gtin"
                    value={formData.gtin}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Product Name</label>
                  <Input 
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Origin Facility</label>
                  <Input 
                    name="originFacility"
                    value={formData.originFacility}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Quantity</label>
                  <Input 
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Unit (e.g., kg, pallets)</label>
                  <Input 
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Total Weight (Tonnes) - For Carbon ESG Tracking</label>
                  <Input 
                    type="number"
                    step="0.01"
                    name="weightTonnes"
                    value={formData.weightTonnes}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
                {loading ? "Minting to Blockchain..." : (
                  <>
                    <PackagePlus className="w-5 h-5 mr-2" />
                    Mint Batch Identity
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
