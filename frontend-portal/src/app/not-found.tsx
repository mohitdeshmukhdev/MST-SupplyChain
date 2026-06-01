"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404 - Page Not Found</h1>
      <p className="text-slate-500 mb-6 text-center max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
