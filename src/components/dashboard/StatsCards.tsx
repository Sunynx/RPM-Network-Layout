import { Monitor, Wifi, WifiOff, AlertTriangle, Globe, Server, Activity } from "lucide-react";
import type { DashboardStats } from "./types";

export default function StatsCards({ stats }: { stats: DashboardStats }) {
  const summaryCards = [
    { label: "Total Devices", value: stats.totalDevices, icon: Monitor, color: "from-blue-500 to-cyan-500", textColor: "text-blue-400" },
    { label: "Online", value: stats.online, icon: Wifi, color: "from-emerald-500 to-green-500", textColor: "text-emerald-400" },
    { label: "Offline", value: stats.offline, icon: WifiOff, color: "from-red-500 to-rose-500", textColor: "text-red-400" },
    { label: "Warning", value: stats.warning, icon: AlertTriangle, color: "from-amber-500 to-yellow-500", textColor: "text-amber-400" },
    { label: "VLANs", value: stats.totalVlans, icon: Globe, color: "from-violet-500 to-purple-500", textColor: "text-violet-400" },
    { label: "Racks", value: stats.totalRacks, icon: Server, color: "from-pink-500 to-rose-500", textColor: "text-pink-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
      {summaryCards.map((card) => (
        <div key={card.label} className="glass-card p-5 group cursor-default">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            {card.label === "Online" && stats.online > 0 && (
              <Activity className="w-4 h-4 text-emerald-400 status-pulse" />
            )}
          </div>
          <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}
