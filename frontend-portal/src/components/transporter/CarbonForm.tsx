"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, QrCode, Factory } from "lucide-react";

export function CarbonForm() {
  const [formData, setFormData] = useState({
    batchId: "",
    vehicleType: "DIESEL_TRUCK_HGV",
    distanceKm: "540"
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`}/api/carbon/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: formData.batchId,
          vehicleType: formData.vehicleType,
          distanceKm: parseFloat(formData.distanceKm)
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to log carbon");
      
      setSuccessMsg(`Carbon emissions queued. Job ID: ${data.jobId}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400">Carbon Emission Logging (ESG)</CardTitle>
        <CardDescription>
          Record transit leg for automated DEFRA GHG Protocol carbon calculation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMsg && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm font-mono">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-green-400"/> Batch ID
            </label>
            <Input 
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              placeholder="UUID"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Vehicle Type</label>
            <select 
              name="vehicleType"
              className="w-full flex h-10 rounded-md border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.vehicleType}
              onChange={handleChange}
            >
              <option value="DIESEL_TRUCK_HGV">Diesel Truck (HGV)</option>
              <option value="REFRIGERATED_TRUCK">Refrigerated Truck (Cold Chain)</option>
              <option value="VAN_DIESEL">Diesel Van</option>
              <option value="ELECTRIC_TRUCK">Electric Truck (EV)</option>
              <option value="CARGO_SHIP">Ocean Freight (Cargo Ship)</option>
              <option value="AIR_FREIGHT">Air Freight</option>
              <option value="RAIL">Rail Freight</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Transit Distance (km)</label>
            <Input 
              name="distanceKm" 
              type="number" 
              step="0.1" 
              value={formData.distanceKm} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          {errorMsg && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
            {loading ? "Calculating & Queuing..." : (
              <>
                <Leaf className="w-4 h-4 mr-2" /> Log Carbon Emissions
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
