'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Web3RBAC } from '../../../components/Web3RBAC';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, Zap, CloudFog, CheckCircle2 } from 'lucide-react';
import { useAccount } from 'wagmi';

export default function Dashboard() {
  const { batchId } = useParams();
  const [batchData, setBatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    let active = true;
    const fetchBatch = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/batch/${batchId}`);
        if (!res.ok) throw new Error('Batch not found');
        const data = await res.json();
        if (active) setBatchData(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (batchId) fetchBatch();
    
    // Poll every 5 seconds for live demo updates
    const interval = setInterval(fetchBatch, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [batchId]);

  const simulateTransit = async () => {
    setSimulating(true);
    try {
      await fetch('http://localhost:5000/api/carbon/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          vehicleType: 'REFRIGERATED_TRUCK',
          distanceKm: 340
        })
      });
      // The interval will catch the new data in a few seconds!
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSimulating(false), 2000); // UI delay for effect
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
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
      data: { label: <div className="p-2 font-bold text-sm">🏭 {batchData.originFacility}</div> },
      className: 'bg-white border-2 border-slate-900 rounded-lg shadow-sm',
    },
    {
      id: 'transit',
      position: { x: 300, y: 150 },
      data: { label: <div className="p-2 font-bold text-sm">🚚 In Transit</div> },
      className: batchData.stage === 'IN_TRANSIT' ? 'bg-blue-50 border-2 border-blue-500 rounded-lg shadow-md' : 'bg-white border-2 border-slate-200 rounded-lg',
    },
    {
      id: 'delivered',
      position: { x: 550, y: 150 },
      data: { label: <div className="p-2 font-bold text-sm">✅ Delivered</div> },
      className: batchData.stage === 'DELIVERED' ? 'bg-green-50 border-2 border-green-500 rounded-lg shadow-md' : 'bg-white border-2 border-slate-200 rounded-lg',
    }
  ];

  const edges = [
    { id: 'e1-2', source: 'factory', target: 'transit', animated: batchData.stage === 'IN_TRANSIT', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2-3', source: 'transit', target: 'delivered', animated: false, markerEnd: { type: MarkerType.ArrowClosed } },
  ];

  const totalEmissions = batchData.carbonLogs?.reduce((sum: number, log: any) => sum + log.emissionsKg, 0) || 0;

  return (
    <Web3RBAC fallbackMessage="Connect your wallet to view live shipment data.">
      <div className="container mx-auto p-4 sm:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{batchData.productName}</h1>
            <p className="text-slate-500 mt-1">GTIN: {batchData.gtin} • Qty: {batchData.quantity} {batchData.unit}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Blockchain ID:</span>
            <span className="font-mono text-sm font-bold text-slate-900">{batchData.blockchainId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Visualizer */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Supply Chain Journey</h2>
              <div className="h-[300px] border border-slate-100 rounded-xl bg-slate-50/50">
                <ReactFlow nodes={nodes} edges={edges} fitView>
                  <Background color="#cbd5e1" gap={16} />
                  <Controls />
                </ReactFlow>
              </div>
            </div>
            
            {/* Real-time Logs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Immutable Event Log
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium">Minted on MST Testnet</span>
                  <a href={`https://testnetscan.mstblockchain.com/tx/${batchData.mintTxHash}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-600 hover:underline">
                    {batchData.mintTxHash?.slice(0, 14)}...
                  </a>
                </div>
                {batchData.carbonLogs?.map((log: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-sm font-medium">Carbon Logged ({log.vehicleType})</span>
                    <a href={`https://testnetscan.mstblockchain.com/tx/${log.txHash}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-600 hover:underline">
                      {log.txHash?.slice(0, 14)}...
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Live Demo Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CloudFog className="w-24 h-24" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Carbon Footprint</h2>
              <p className="text-sm text-slate-500 mb-6">DEFRA automated calculations</p>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold tracking-tight text-slate-900">{totalEmissions}</span>
                <span className="text-lg font-semibold text-slate-500">kg CO₂</span>
              </div>

              {/* LIVE DEMO BUTTON */}
              <button 
                onClick={simulateTransit}
                disabled={simulating}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {simulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-yellow-400" />}
                {simulating ? 'Simulating Transit...' : 'Simulate Transit Leg'}
              </button>
              <p className="text-xs text-center text-slate-400 mt-3">
                Writes directly to CarbonRegistry via BullMQ. Watch the footprint update in real-time!
              </p>
            </div>
          </div>

        </div>
      </div>
    </Web3RBAC>
  );
}
