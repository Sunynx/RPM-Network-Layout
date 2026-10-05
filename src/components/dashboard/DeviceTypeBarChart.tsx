import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import type { DashboardStats } from "./types";

export default function DeviceTypeBarChart({ stats }: { stats: DashboardStats }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Devices by Type
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.byType} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="count" fill="#60a5fa" radius={[0, 6, 6, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
