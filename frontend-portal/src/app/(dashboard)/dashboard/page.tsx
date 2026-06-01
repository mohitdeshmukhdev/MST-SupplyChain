"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export default function DashboardIndex() {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Redirect to home or scanner if they land on generic /dashboard
    router.push("/");
  }, [router]);

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <p className="text-slate-500 animate-pulse">Redirecting...</p>
    </div>
  );
}
