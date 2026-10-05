import { Network } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-[60vh] animate-fade-in">
      <div className="glass-card p-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
          <Network className="w-10 h-10 text-blue-400" />
        </div>
        <h2
          className="text-5xl font-extrabold mb-2 gradient-text"
        >
          404
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          ไม่พบหน้าที่คุณกำลังมองหา
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
