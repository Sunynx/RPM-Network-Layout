"use client";

import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { format } from "date-fns";
import { Activity, Plus, Edit, Trash, Move, RefreshCw } from "lucide-react";

export default function ActivityLogsPage() {
  const { data: logs, loading } = useSupabaseQuery<any>("activity_logs", { orderBy: "created_at" });

  const sortedLogs = logs ? [...logs].reverse() : [];

  if (loading) return null;

  const getIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <Plus className="w-4 h-4 text-emerald-500" />;
      case "UPDATE": return <Edit className="w-4 h-4 text-blue-500" />;
      case "DELETE": return <Trash className="w-4 h-4 text-red-500" />;
      case "MOVE": return <Move className="w-4 h-4 text-purple-500" />;
      case "SYNC": return <RefreshCw className="w-4 h-4 text-cyan-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "CREATE": return "เพิ่มข้อมูล";
      case "UPDATE": return "แก้ไขข้อมูล";
      case "DELETE": return "ลบข้อมูล";
      case "MOVE": return "ย้ายตำแหน่ง";
      case "SYNC": return "ซิงค์ข้อมูล";
      default: return action;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto p-4 lg:p-0">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          ประวัติการทำงาน (Activity Logs)
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          ตรวจสอบประวัติการเปลี่ยนแปลงข้อมูลอุปกรณ์ การเชื่อมต่อ และสถานะต่างๆ
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
                <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)] w-48">เวลา (Time)</th>
                <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)] w-40">การกระทำ (Action)</th>
                <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)] w-64">เป้าหมาย (Entity)</th>
                <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)]">รายละเอียด (Details)</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">
                    ไม่มีประวัติการทำงาน
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="border-b transition-colors hover:bg-[var(--bg-card-hover)]" style={{ borderColor: "var(--border-color)" }}>
                    <td className="py-4 px-5 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {log.created_at ? format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss") : "—"}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                          {getIcon(log.action)}
                        </div>
                        <span className="font-medium text-[var(--text-primary)]">{getActionText(log.action)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-[var(--text-primary)]">{log.entity_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{log.entity_type}</p>
                    </td>
                    <td className="py-4 px-5">
                      <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap max-w-[300px]">
                        {log.details ? JSON.stringify(log.details, null, 2) : "ไม่มีรายละเอียด"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
