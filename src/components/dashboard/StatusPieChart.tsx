import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardStats } from "./types";

export default function StatusPieChart({ stats }: { stats: DashboardStats }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Device Status
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats.byStatus}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
            >
              {stats.byStatus.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        {stats.byStatus.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            <span style={{ color: "var(--text-secondary)" }}>
              {s.name} ({s.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
