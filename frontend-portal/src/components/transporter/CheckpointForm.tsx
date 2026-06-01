"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, QrCode, CheckCircle } from "lucide-react";

export function CheckpointForm() {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    batchId: "",
    toAddress: "",
    location: "Logistics Hub B, Singapore",
    gpsLat: "1.3521",
    gpsLng: "103.8198"
  });
  const [loading, setLoading] = useState(false);
  const [successTx, setSuccessTx] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    
    setLoading(true);
    setErrorMsg("");
    setSuccessTx("");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`}/api/checkpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: formData.batchId,
          fromAddress: address, // Currently connected transporter
          toAddress: formData.toAddress || address, // Handover or self
          location: formData.location,
          gpsLat: parseFloat(formData.gpsLat),
          gpsLng: parseFloat(formData.gpsLng)
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to log checkpoint");
      
      setSuccessTx(data.txHash);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-blue-400">Log Custody Handover</CardTitle>
        <CardDescription>
          Record physical movement of a batch. Creates an immutable checkpoint.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successTx ? (
          <div className="p-6 bg-green-900/20 border border-green-500/30 rounded-xl flex flex-col items-center text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <h2 className="text-xl font-bold text-white">Checkpoint Anchored!</h2>
            <div className="text-sm text-green-300 font-mono break-all bg-black/50 p-3 rounded w-full">
              Tx: {successTx}
            </div>
            <Button variant="outline" onClick={() => setSuccessTx("")}>Log Another</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-400"/> Scanned Batch ID (UUID)
              </label>
              <Input 
                name="batchId"
                value={formData.batchId}
                onChange={handleChange}
                placeholder="Scan QR or paste ID"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400"/> Current Location
              </label>
              <Input 
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">GPS Latitude</label>
                <Input name="gpsLat" value={formData.gpsLat} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">GPS Longitude</label>
                <Input name="gpsLng" value={formData.gpsLng} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Handover To (Next Custodian Wallet) - Optional</label>
              <Input 
                name="toAddress"
                value={formData.toAddress}
                onChange={handleChange}
                placeholder="Leave blank to retain custody"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Anchoring..." : "Anchor Checkpoint"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
