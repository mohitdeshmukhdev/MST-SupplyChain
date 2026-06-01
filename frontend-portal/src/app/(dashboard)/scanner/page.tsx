'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, ArrowRight } from 'lucide-react';
import { Web3RBAC } from '@/components/Web3RBAC';

/** 
 * Extracted into its own component so useEffect only runs 
 * AFTER Web3RBAC renders children (wallet connected) and
 * the #reader div is guaranteed to be in the DOM.
 */
function QrScannerCard() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const router = useRouter();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Small delay to guarantee the DOM element is painted
    const timer = setTimeout(() => {
      const el = document.getElementById('reader');
      if (!el) return;

      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          scanner.clear();

          let batchId = decodedText;
          try {
            const data = JSON.parse(decodedText);
            if (data.batchId) batchId = data.batchId;
          } catch {
            batchId = decodedText.split('/').pop() || decodedText;
          }

          router.push(`/dashboard/${batchId}`);
        },
        () => {
          // Ignore per-frame scan errors
        }
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      scannerRef.current?.clear().catch(() => {});
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-center mb-6">
        <div className="p-3 bg-slate-100 rounded-full">
          <QrCode className="w-8 h-8 text-slate-700" />
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-2">Scan Shipment QR</h2>
      <p className="text-slate-500 mb-8 text-sm">
        Point your laptop camera at the physical QR code on the pallet or bill of lading.
      </p>

      {/* html5-qrcode mounts here */}
      <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50"></div>

      {scanResult && (
        <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center justify-between">
          <span className="font-mono text-sm">Decoded: {scanResult}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}

      {/* Fallback for testing without a camera */}
      <div className="mt-6 text-sm text-slate-400">
        Testing mode:{' '}
        <button onClick={() => router.push('/dashboard/1')} className="underline hover:text-slate-600">
          Skip to Demo Batch #1
        </button>
      </div>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-12 text-center">

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900">
            Enterprise Supply Chain <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900">
              Secured by MST Blockchain
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 sm:text-xl">
            Real-time telemetry, zero-trust RBAC, and automated carbon accounting.
            Connect your MetaMask wallet to authenticate and scan a shipment.
          </p>
        </div>

        <Web3RBAC fallbackMessage="Please connect your MetaMask wallet to activate the enterprise QR scanner.">
          <QrScannerCard />
        </Web3RBAC>
      </div>
    </div>
  );
}
