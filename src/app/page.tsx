"use client";

import { AlertTriangle } from "lucide-react";
import { useDashboardStats } from "@/components/dashboard/useDashboardStats";
import StatsCards from "@/components/dashboard/StatsCards";
import StatusPieChart from "@/components/dashboard/StatusPieChart";
import DeviceTypeBarChart from "@/components/dashboard/DeviceTypeBarChart";
import RecentDevicesTable from "@/components/dashboard/RecentDevicesTable";

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    // Show nothing, layout handles suspense/loading if necessary, but we can show skeleton
    return null;
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            ยังไม่ได้เชื่อมต่อ Supabase
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {error || "กรุณาตั้งค่า Supabase credentials ในไฟล์ .env.local"}
          </p>
          <div className="text-left p-4 rounded-lg text-xs font-mono" style={{ background: "var(--bg-secondary)" }}>
            <p style={{ color: "var(--text-muted)" }}># .env.local</p>
            <p className="text-blue-400">NEXT_PUBLIC_SUPABASE_URL=</p>
            <p className="text-blue-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          ภาพรวม Network Infrastructure ขององค์กร
        </p>
      </div>

      {/* Summary Cards */}
      <StatsCards stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusPieChart stats={stats} />
        <DeviceTypeBarChart stats={stats} />
      </div>

      {/* Recent Devices */}
      <RecentDevicesTable stats={stats} />
    </div>
  );
}
