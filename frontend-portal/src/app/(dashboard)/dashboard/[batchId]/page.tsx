'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Web3RBAC } from '@/components/Web3RBAC';
import { DemoQRCodes } from '@/components/DemoQRCodes';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, Zap, CloudFog, CheckCircle2, ShieldAlert, Thermometer, Truck, MapPin } from 'lucide-react';

export default function Dashboard() {
  const { batchId } = useParams();
  const [batchData, setBatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchBatch = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/batch/${batchId}`);
        if (!res.ok) throw new Error('Batch not found');
        const text = await res.text();
        if (!text) throw new Error('Empty response');
        const data = JSON.parse(text);
        if (!data) throw new Error('Batch not found');
        if (active) setBatchData(data);
      } catch (e: any) {
        if (e.message !== 'Batch not found') {
          console.error(e);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (batchId) fetchBatch();
    
    // Poll every 3 seconds for live demo updates
    const interval = setInterval(fetchBatch, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!batchData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Batch Not Found</h2>
        <p className="text-slate-500">No data exists for Batch ID: {batchId}</p>
      </div>
    );
  }

  // Build React Flow nodes dynamically based on stage
  const nodes = [
    {
      id: 'factory',
      position: { x: 50, y: 150 },
      data: { label: <div className="p-2 font-bold text-sm text-slate-900">🏭 {batchData.originFacility}</div> },
      className: 'bg-white border-2 border-slate-900 rounded-lg shadow-sm',
    },
    {
      id: 'transit',
      position: { x: 300, y: 150 },
      data: { label: <div className="p-2 font-bold text-sm text-slate-900">🚚 In Transit</div> },
      className: batchData.stage === 'IN_TRANSIT' ? 'bg-blue-200 border-2 border-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-200 border-2 border-slate-400 rounded-lg',
    },
    {
      id: 'delivered',
      position: { x: 550, y: 150 },
      data: { label: <div className="p-2 font-bold text-sm text-slate-900">✅ Delivered</div> },
      className: (batchData.stage === 'DELIVERED' || batchData.stage === 'RETAIL_READY') ? 'bg-green-200 border-2 border-green-500 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-200 border-2 border-slate-400 rounded-lg',
    }
  ];

  const edges = [
    { id: 'e1-2', source: 'factory', target: 'transit', animated: batchData.stage === 'IN_TRANSIT', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e2-3', source: 'transit', target: 'delivered', animated: false, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  ];

  const totalEmissions = batchData.carbonLogs?.reduce((sum: number, log: any) => sum + log.emissionsKg, 0) || 0;

  return (
    <Web3RBAC fallbackMessage="Connect your wallet to view live shipment data.">
      <div className="container mx-auto p-4 sm:p-8 space-y-8 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{batchData.productName}</h1>
            <p className="text-slate-500 mt-1">GTIN: {batchData.gtin} • Qty: {batchData.quantity} {batchData.unit}</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-900/30 px-4 py-2 rounded-full border border-blue-500/30">
            <span className="text-sm font-medium text-blue-300">Blockchain ID:</span>
            <span className="font-mono text-sm font-bold text-blue-100">{batchData.blockchainId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Visualizer & Demo QR */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white  rounded-2xl border border-slate-200 shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Supply Chain Journey</h2>
              <div className="h-[250px] rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                <ReactFlow nodes={nodes} edges={edges} fitView>
                  <Background color="#334155" gap={16} />
                  <Controls />
                </ReactFlow>
              </div>
            </div>

            <div className="flex justify-end">
              <label className="flex items-center cursor-pointer gap-2 text-sm text-slate-500 hover:text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors hover:bg-slate-50">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  checked={showDeveloperMode}
                  onChange={(e) => setShowDeveloperMode(e.target.checked)}
                />
                Developer Mode
              </label>
            </div>

            {showDeveloperMode && <DemoQRCodes batchId={batchId as string} />}
            
            {/* Real-time Logs Timeline */}
            <div className="bg-white  rounded-2xl border border-slate-200 shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-6 text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Immutable Event Timeline
              </h2>
              
              <div className="relative border-l border-white/20 ml-3 space-y-8">
                {/* Mint Event */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1.5" />
                  <h3 className="text-slate-900 font-medium">Batch Minted</h3>
                  <a href={`https://testnetscan.mstblockchain.com/tx/${batchData.mintTxHash}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-400 hover:underline">
                    Tx: {batchData.mintTxHash?.slice(0, 14)}...
                  </a>
                </div>

                {/* Escrow Status */}
                {batchData.escrow && (
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-yellow-500 rounded-full -left-[6.5px] top-1.5" />
                    <h3 className="text-slate-900 font-medium">Escrow {batchData.escrow.status}</h3>
                    {batchData.escrow.status === 'RELEASED' && (
                      <p className="text-xs text-slate-500">Payment released to supplier.</p>
                    )}
                  </div>
                )}

                {/* Checkpoints */}
                {batchData.checkpoints?.map((cp: any, i: number) => (
                  <div key={`cp-${i}`} className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[6.5px] top-1.5" />
                    <h3 className="text-slate-900 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      Handover: {cp.location}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Custodian: <span className="font-mono">{cp.toAddress.slice(0,10)}...</span></p>
                    <a href={`https://testnetscan.mstblockchain.com/tx/${cp.txHash}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-400 hover:underline">
                      Tx: {cp.txHash?.slice(0, 14)}...
                    </a>
                  </div>
                ))}

                {/* Telemetry Logs */}
                {batchData.telemetryLogs?.map((tl: any, i: number) => (
                  <div key={`tl-${i}`} className="relative pl-6">
                    <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 ${tl.isBreached ? 'bg-red-500' : 'bg-purple-500'}`} />
                    <h3 className="text-slate-900 font-medium flex items-center gap-2">
                      <Thermometer className={`w-4 h-4 ${tl.isBreached ? 'text-red-400' : 'text-purple-400'}`} />
                      Sensor Ping: {tl.temperatureC}°C, {tl.humidityPct}% H
                    </h3>
                    {tl.isBreached && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {tl.breachReason}
                      </p>
                    )}
                    <a href={`https://testnetscan.mstblockchain.com/tx/${tl.txHash}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-400 hover:underline">
                      Hash Anchored: {tl.txHash?.slice(0, 14)}...
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Metrics */}
          <div className="space-y-6">
            <div className="bg-white  rounded-2xl border border-slate-200 shadow-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <CloudFog className="w-32 h-32 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-1 text-slate-900">Carbon ESG Score</h2>
              <p className="text-sm text-slate-500 mb-6">DEFRA automated calculations</p>
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-extrabold tracking-tight text-green-400">{totalEmissions.toFixed(1)}</span>
                <span className="text-lg font-semibold text-green-600">kg CO₂</span>
              </div>
              
              <div className="space-y-2 mt-6">
                {batchData.carbonLogs?.map((log: any, i: number) => (
                  <div key={`carb-${i}`} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-700">{log.vehicleType}</span>
                    <span className="text-emerald-700 font-mono font-medium">+{log.emissionsKg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Status Widget */}
            <div className="bg-white  rounded-2xl border border-slate-200 shadow-xl p-6">
               <h2 className="text-lg font-semibold mb-4 text-slate-900">Smart Contract State</h2>
               <div className="space-y-3">
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                   <span className="text-slate-500 text-sm">Stage Enum</span>
                   <span className="text-blue-400 text-sm font-mono">{batchData.stage}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                   <span className="text-slate-500 text-sm">Custody Transfer</span>
                   <span className="text-purple-400 text-sm font-mono">{batchData.checkpoints?.length > 0 ? "Active" : "Origin"}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                   <span className="text-slate-500 text-sm">Escrow Link</span>
                   <span className={`text-sm font-mono ${batchData.escrow ? 'text-green-400' : 'text-gray-500'}`}>
                     {batchData.escrow ? batchData.escrow.status : "NONE"}
                   </span>
                 </div>
               </div>
            </div>

          </div>

        </div>
      </div>
    </Web3RBAC>
  );
}
