"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { 
  Factory, 
  Truck, 
  Store, 
  ShieldCheck, 
  QrCode,
  LayoutDashboard
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIdentity() {
      if (!address || !isConnected) {
        setRole(null);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/identity/${address}`);
        if (res.ok) {
          const data = await res.json();
          // data.entityType: "SUPPLIER" | "TRANSPORTER" | "RETAILER" | "AUDITOR"
          if (data && data.isVerified) {
            setRole(data.entityType);
          } else {
            setRole(null); // Not verified yet
          }
        } else {
          setRole(null);
        }
      } catch (e) {
        setRole(null);
      }
    }
    fetchIdentity();
  }, [address, isConnected]);

  // Base links everyone sees (if we want, or we hide them)
  const allLinks = [
    { href: "/scanner", label: "Scanner", icon: QrCode, roles: ["ALL"] },
    { href: "/dashboard", label: "Batches", icon: LayoutDashboard, roles: ["ALL"] },
    { href: "/identity", label: "Identity (KYC)", icon: ShieldCheck, roles: ["ALL"] },
    { href: "/manufacturer/mint", label: "Mint Batch", icon: Factory, roles: ["SUPPLIER"] },
    { href: "/transporter", label: "Transporter Hub", icon: Truck, roles: ["TRANSPORTER"] },
    { href: "/retailer", label: "Retailer Portal", icon: Store, roles: ["RETAILER"] },
    { href: "/customs", label: "Customs Hub", icon: ShieldCheck, roles: ["CUSTOMS_AGENT"] },
  ];

  // Filter logic:
  // If not connected, only show Scanner and KYC.
  // If connected but no role (unverified), show Scanner and KYC.
  // If connected and has role, show ALL (Scanner, Batches, KYC) + their specific role.
  const visibleLinks = allLinks.filter(link => {
    if (link.roles.includes("ALL")) return true;
    if (role && link.roles.includes(role)) return true;
    return false;
  });

  return (
    <div className="w-64 h-[calc(100vh-4rem)] sticky top-16 bg-white border-r border-slate-200 flex flex-col pt-8">
      <div className="px-6 mb-8">
        <h1 className="text-xl font-bold text-slate-900">
          MST Supply Chain
        </h1>
        <p className="text-xs text-slate-500 mt-1">Enterprise Demo</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-blue-50 text-blue-700 font-semibold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-slate-100">
        <div className="text-xs text-slate-500 text-center">
          Powered by MST Testnet
        </div>
      </div>
    </div>
  );
}
