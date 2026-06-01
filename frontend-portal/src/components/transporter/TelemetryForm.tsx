"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Thermometer, Activity, QrCode, ShieldAlert } from "lucide-react";

export function TelemetryForm() {
  const [formData, setFormData] = useState({
    batchId: "",
    temperatureC: "5.2",
    humidityPct: "76",
    gpsLat: "1.3521",
    gpsLng: "103.8198"
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    // Auto-detect breach for demo (e.g., > 8Â°C for cold chain)
    const temp = parseFloat(formData.temperatureC);
    const isBreached = temp > 8.0;
    const breachReason = isBreached ? "Temperature exceeded 8Â°C threshold" : "";

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`}/api/telemetry/anchor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          temperatureC: temp,
          humidityPct: parseFloat(formData.humidityPct),
          gpsLat: parseFloat(formData.gpsLat),
          gpsLng: parseFloat(formData.gpsLng),
          isBreached,
          breachReason
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to anchor telemetry");
      
      setSuccessMsg(`Telemetry hashed and anchored. Tx: ${data.txHash}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-purple-400">IoT Telemetry Anchoring</CardTitle>
        <CardDescription>
          Record environmental data. A keccak256 hash will be generated and stored on-chain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMsg && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm font-mono break-all">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-400"/> Batch ID
            </label>
            <Input 
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              placeholder="UUID"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400"/> Temp (Â°C)
              </label>
              <Input name="temperatureC" type="number" step="0.1" value={formData.temperatureC} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Humidity (%)</label>
              <Input name="humidityPct" type="number" value={formData.humidityPct} onChange={handleChange} required />
            </div>
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
          
          {parseFloat(formData.temperatureC) > 8 && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-semibold text-sm">Compliance Breach Warning</h4>
                <p className="text-red-300 text-xs mt-1">
                  Temperature is above safe threshold (8Â°C). Submitting this will trigger a smart contract compliance breach event.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
            {loading ? "Hashing & Anchoring..." : (
              <>
                <Activity className="w-4 h-4 mr-2" /> Submit Telemetry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
