"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DemoQRCodes({ batchId }: { batchId: string }) {
  const qrData = {
    batchCreate: {
      type: "batchCreate",
      batchId: batchId,
      gtin: "0123456789012",
      manufacturer: "MST Supplier",
      metadataUrl: "ipfs://QmBatch001"
    },
    checkpoint: {
      type: "checkpoint",
      batchId: batchId,
      checkpointId: "CP-01",
      location: "Pune Warehouse",
      timestamp: 1711111111
    },
    telemetry: {
      type: "telemetry",
      batchId: batchId,
      sensorId: "TMP-01",
      temperature: 5.2,
      humidity: 76
    },
    escrow: {
      type: "escrowFund",
      batchId: batchId,
      escrowId: "ESC-01",
      amountEth: 0.5
    },
    carbon: {
      type: "carbonTrack",
      batchId: batchId,
      distance: "540km",
      emission: "18.4kgCO2"
    }
  };

  return (
    <Card className="border-indigo-500/20 bg-indigo-950/10">
      <CardHeader>
        <CardTitle className="text-indigo-400">Demo Scanner QR Codes</CardTitle>
        <CardDescription>
          Scan these with the mobile app or main scanner page to simulate physical interactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="checkpoint" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-black/40 border border-white/10 rounded-lg h-auto p-1">
            <TabsTrigger value="batchCreate" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Batch</TabsTrigger>
            <TabsTrigger value="checkpoint" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Handover</TabsTrigger>
            <TabsTrigger value="telemetry" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">IoT Sensor</TabsTrigger>
            <TabsTrigger value="escrow" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Escrow</TabsTrigger>
            <TabsTrigger value="carbon" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Carbon</TabsTrigger>
          </TabsList>
          
          {Object.entries(qrData).map(([key, data]) => (
            <TabsContent key={key} value={key} className="mt-6 flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg">
              <QRCodeSVG 
                value={JSON.stringify(data)} 
                size={256}
                level="H"
                includeMargin={true}
              />
              <p className="mt-4 text-sm font-mono text-gray-500 break-all w-full max-w-sm text-center">
                {JSON.stringify(data)}
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
