"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, CheckCircle2, Clock, Search, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface Alert {
  id: string;
  device_id: string;
  type: "OFFLINE" | "WARNING" | "RECOVERED";
  message: string;
  resolved: boolean;
  created_at: string;
  device?: {
    name: string;
    type: string;
    ip_address: string;
  };
}

export default function LogsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");

  useEffect(() => {
    let isMounted = true;
    
    async function fetchAlerts() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('alerts')
          .select(`
            *,
            device:devices (name, type, ip_address)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error && error.code !== '42P01') throw error; // Ignore table not found temporarily
        if (isMounted) setAlerts(data || []);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAlerts();

    const supabase = createClient();
    const channel = supabase
      .channel('alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredAlerts = alerts.filter(a => {
    if (filter === "ACTIVE") return !a.resolved;
    if (filter === "RESOLVED") return a.resolved;
    return true;
  });

  return (
    <div className="p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
            Logs & Alarms
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            ประวัติการแจ้งเตือนและสถานะของอุปกรณ์ในระบบ
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "ALL" ? "bg-blue-500 text-white" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
          >
            ทั้งหมด
          </button>
          <button 
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "ACTIVE" ? "bg-red-500 text-white" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
          >
            ยังไม่แก้ไข
          </button>
          <button 
            onClick={() => setFilter("RESOLVED")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "RESOLVED" ? "bg-green-500 text-white" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
          >
            แก้ไขแล้ว
          </button>
        </div>
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">ไม่มีประวัติการแจ้งเตือน</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-5 flex items-start gap-4 transition-colors hover:bg-white/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  alert.type === "OFFLINE" ? "bg-red-500/20 text-red-400" :
                  alert.type === "WARNING" ? "bg-amber-500/20 text-amber-400" :
                  "bg-green-500/20 text-green-400"
                }`}>
                  {alert.type === "RECOVERED" || alert.resolved ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                        {alert.device?.name || "Unknown Device"}
                      </h4>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {alert.message}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        alert.resolved ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {alert.resolved ? "RESOLVED" : "ACTIVE"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: th })}
                    </span>
                    {alert.device?.ip_address && (
                      <span className="font-mono bg-white/5 px-2 py-0.5 rounded">
                        {alert.device.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
