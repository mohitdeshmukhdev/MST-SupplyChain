"use client";

import { useState } from "react";
import { CheckpointForm } from "@/components/transporter/CheckpointForm";
import { TelemetryForm } from "@/components/transporter/TelemetryForm";
import { CarbonForm } from "@/components/transporter/CarbonForm";
import { Truck } from "lucide-react";
import { useAccount } from "wagmi";

export default function TransporterHub() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"checkpoint" | "telemetry" | "carbon">("checkpoint");

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Truck className="w-10 h-10 text-blue-400" />
          Transporter Action Hub
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Log custody handovers, environmental telemetry, and carbon ESG data.
        </p>
      </div>

      {!isConnected ? (
        <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
          Please connect your logistics wallet.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 border-b border-slate-200 pb-4">
            <button
              onClick={() => setActiveTab("checkpoint")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "checkpoint"
                  ? "bg-blue-600 text-slate-900 shadow-lg shadow-blue-500/30"
                  : "bg-white/5 text-slate-500 hover:text-slate-900"
              }`}
            >
              Custody Handover (Checkpoint)
            </button>
            <button
              onClick={() => setActiveTab("telemetry")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "telemetry"
                  ? "bg-purple-600 text-slate-900 shadow-lg shadow-purple-500/30"
                  : "bg-white/5 text-slate-500 hover:text-slate-900"
              }`}
            >
              IoT Telemetry Anchor
            </button>
            <button
              onClick={() => setActiveTab("carbon")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "carbon"
                  ? "bg-green-600 text-slate-900 shadow-lg shadow-green-500/30"
                  : "bg-white/5 text-slate-500 hover:text-slate-900"
              }`}
            >
              Carbon Emissions Log
            </button>
          </div>

          <div className="mt-8">
            {activeTab === "checkpoint" && <CheckpointForm />}
            {activeTab === "telemetry" && <TelemetryForm />}
            {activeTab === "carbon" && <CarbonForm />}
          </div>
        </div>
      )}
    </div>
  );
}
