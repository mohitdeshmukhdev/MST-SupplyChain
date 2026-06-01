import Link from 'next/link';
import { ArrowRight, ShieldCheck, Box, Coins, Globe, Target, Fingerprint, Anchor, Factory, Truck, Store, Scale } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center pt-24 pb-32 px-6 text-center overflow-hidden">
        {/* Decorative background grid */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/80 backdrop-blur-sm px-4 py-1.5 text-sm text-blue-700 mb-8 font-semibold shadow-sm">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          MST Testnet Live — Enterprise Beta
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-5xl leading-tight">
          Next-Gen Supply Chain, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
            Secured by Blockchain.
          </span>
        </h1>
        
        <p className="max-w-3xl text-xl text-slate-600 mb-12 leading-relaxed">
          MST SaralChain eliminates counterfeit goods, automates DeFi Escrow settlements, and verifies ESG compliance through immutable cryptographic proofs and zero-trust IoT telemetry anchoring.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-md mx-auto sm:max-w-none">
          <Link 
            href="/identity" 
            className="group flex items-center px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 w-full sm:w-auto justify-center"
          >
            Launch Web3 Portal 
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/scanner" 
            className="flex items-center px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all w-full sm:w-auto justify-center"
          >
            <Fingerprint className="mr-2 w-5 h-5" />
            Scan Shipment QR
          </Link>
        </div>
      </section>

      {/* Stats/Logos Strip */}
      <section className="border-y border-slate-100 bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-around items-center text-slate-400 font-semibold gap-8 text-sm sm:text-base">
          <div className="flex items-center gap-2"><Anchor className="w-5 h-5" /> 7 Smart Contracts</div>
          <div className="flex items-center gap-2"><Target className="w-5 h-5" /> 15ms Query Speed</div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Zero-Trust Anchoring</div>
          <div className="flex items-center gap-2"><Globe className="w-5 h-5" /> DEFRA Carbon ESG</div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Unified Logistics Ecosystem</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">One immutable ledger connecting all supply chain stakeholders with role-based, zero-knowledge access.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Factory, role: 'Manufacturer', desc: 'Mints product batches and attaches GS1 GTINs on-chain.' },
            { icon: Truck, role: 'Transporter', desc: 'Logs GPS checkpoints and IoT temperature/humidity data.' },
            { icon: Scale, role: 'Customs Agent', desc: 'Verifies IPFS compliance docs and authorizes border clearance.' },
            { icon: Store, role: 'Retailer', desc: 'Funds escrow contracts and verifies goods upon delivery.' },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all bg-white group cursor-pointer">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{s.role}</h3>
              <p className="text-slate-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / Architecture */}
      <section className="bg-slate-900 text-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">The Hybrid Architecture</h2>
              <p className="text-slate-300 mb-8 text-lg">
                We solved the "Blockchain Trilemma" for enterprise logistics. Our hybrid stack uses BullMQ and Redis to queue asynchronous IoT data, preventing EVM Nonce collisions, while mirroring data to Supabase Postgres for sub-15ms dashboard querying.
              </p>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-lg">Identity & Access</h4>
                    <p className="text-slate-400 text-sm mt-1">MetaMask wallets are mapped to verified corporate identities via `IdentityRegistry.sol`.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-lg">Gasless Execution</h4>
                    <p className="text-slate-400 text-sm mt-1">A NestJS backend Relayer signs and pays for transactions, abstracting crypto complexity from users.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-lg">Automated Settlement</h4>
                    <p className="text-slate-400 text-sm mt-1">Escrow funds automatically release to suppliers only if IoT sensors prove no temperature breaches occurred.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-slate-800 border border-slate-700 rounded-3xl p-8 overflow-hidden">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="text-xs font-mono text-slate-400">transaction_log.json</div>
                </div>
                <pre className="text-sm font-mono text-emerald-400 overflow-x-auto">
                  <code>
                    {`[
  {
    "event": "BatchMinted",
    "batchId": 1204,
    "gtin": "01234567890128",
    "txHash": "0x7a2...f19"
  },
  {
    "event": "EscrowFunded",
    "amountLocked": "0.5 tMST",
    "status": "SECURED"
  },
  {
    "event": "TelemetryAnchored",
    "dataHash": "0x3f8...e22",
    "breach": false
  }
]`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Built for the Enterprise</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col">
              <div className="p-4 bg-blue-50 rounded-2xl w-fit mb-6 text-blue-600 border border-blue-100">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Immutable Provenance</h3>
              <p className="text-slate-600 leading-relaxed">Every batch minted is permanently anchored to the MST Blockchain, proving origin and combating international counterfeits.</p>
            </div>
            <div className="flex flex-col">
              <div className="p-4 bg-emerald-50 rounded-2xl w-fit mb-6 text-emerald-600 border border-emerald-100">
                <Coins className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Trustless Escrow</h3>
              <p className="text-slate-600 leading-relaxed">Funds are mathematically locked in smart contracts and only released when telemetry and GPS data prove safe, compliant delivery.</p>
            </div>
            <div className="flex flex-col">
              <div className="p-4 bg-purple-50 rounded-2xl w-fit mb-6 text-purple-600 border border-purple-100">
                <Box className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-Time Telemetry</h3>
              <p className="text-slate-600 leading-relaxed">Integrate IoT devices tracking temperature and humidity. Compliance breaches automatically trigger dispute resolution protocols.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 text-center text-slate-500 text-sm">
        <p>Built for the MST Blockchain Grant Program © 2026</p>
      </footer>
    </div>
  );
}
