"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, FileText, Loader2, Link as LinkIcon } from "lucide-react";

interface DocumentUploadProps {
  batchId: string;
  onSuccess?: (cid: string) => void;
}

export function DocumentUpload({ batchId, onSuccess }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);
  const [docType, setDocType] = useState("BILL_OF_LADING");

  const handleMockUpload = async () => {
    setIsUploading(true);
    setUploadComplete(false);
    
    // Simulate IPFS upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a random mock IPFS CID
    const randomHash = Array.from({length: 44}, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      [Math.floor(Math.random() * 62)]
    ).join('');
    const mockCid = `Qm${randomHash}`;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/document/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          docType,
          ipfsCid: mockCid
        })
      });

      if (!res.ok) throw new Error("Failed to anchor document");
      
      setIpfsCid(mockCid);
      setUploadComplete(true);
      if (onSuccess) onSuccess(mockCid);
    } catch (error) {
      console.error(error);
      alert("Error uploading document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
          <UploadCloud className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">IPFS Document Upload</h3>
      </div>
      
      <p className="text-sm text-slate-500 mb-6">
        Upload compliance documents (e.g. Bill of Lading, Customs Clearance). The file will be pinned to IPFS, and its Keccak256 hash will be anchored to the DocumentRegistry smart contract.
      </p>

      {!uploadComplete ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
            <select 
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border-slate-200 rounded-lg p-2 text-sm"
              disabled={isUploading}
            >
              <option value="BILL_OF_LADING">Bill of Lading</option>
              <option value="CERTIFICATE_OF_ORIGIN">Certificate of Origin</option>
              <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
              <option value="INSPECTION_REPORT">Inspection Report</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Drag and drop file here</p>
            <p className="text-xs text-slate-500 mb-4">PDF, JPG, PNG up to 10MB</p>
            
            <button
              type="button"
              onClick={handleMockUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors inline-flex items-center"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading to IPFS...</>
              ) : (
                'Simulate Upload'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col items-center text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
          <h4 className="font-semibold text-emerald-900 mb-1">Document Anchored</h4>
          <p className="text-sm text-emerald-700 mb-4">The document was successfully pinned to IPFS and anchored on-chain.</p>
          
          <div className="w-full bg-white p-3 rounded border border-emerald-200 flex items-center justify-between">
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-xs text-slate-500 font-medium">IPFS CID</span>
              <span className="text-sm font-mono text-slate-900 truncate w-full">{ipfsCid}</span>
            </div>
            <LinkIcon className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
          </div>
          
          <button
            type="button"
            onClick={() => { setUploadComplete(false); setIpfsCid(null); }}
            className="mt-4 text-sm text-slate-600 hover:text-slate-900 underline"
          >
            Upload another document
          </button>
        </div>
      )}
    </div>
  );
}
