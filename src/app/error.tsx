"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-[60vh] animate-fade-in">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          เกิดข้อผิดพลาด
        </h2>
        <p
          className="text-sm mb-5 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {error.message || "มีข้อผิดพลาดเกิดขึ้น กรุณาลองใหม่อีกครั้ง"}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          ลองใหม่
        </button>
      </div>
    </div>
  );
}
