import { DEVICE_ICONS, FALLBACK_DEVICE_ICON } from "@/lib/constants";
import type { DashboardStats } from "./types";

export default function RecentDevicesTable({ stats }: { stats: DashboardStats }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Device Overview
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
              <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-muted)" }}>Device</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-muted)" }}>Type</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-muted)" }}>IP Address</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-muted)" }}>Brand / Model</th>
              <th className="text-left py-3 px-4 font-medium" style={{ color: "var(--text-muted)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentDevices.map((device) => {
              const Icon = DEVICE_ICONS[device.type] || FALLBACK_DEVICE_ICON;
              return (
                <tr
                  key={device.id}
                  className="border-b transition-colors hover:bg-[var(--bg-card-hover)]"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {device.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                    >
                      {device.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                    {device.ip_address || "—"}
                  </td>
                  <td className="py-3 px-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {[device.brand, device.model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: device.status === "ONLINE" ? "#34d399" : "#f87171" }}
                      />
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {device.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
