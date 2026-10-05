"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats } from "@/components/dashboard/types";
import type { Device } from "@/types/network";
import { STATUS_COLORS } from "@/lib/constants";

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      const supabase = createClient();
      const [
        devicesRes,
        vlansRes,
        subnetsRes,
        racksRes,
      ] = await Promise.all([
        supabase.from("devices").select("*").order("created_at", { ascending: false }),
        supabase.from("vlans").select("*", { count: "exact", head: true }),
        supabase.from("subnets").select("*", { count: "exact", head: true }),
        supabase.from("racks").select("*", { count: "exact", head: true }),
      ]);

      if (devicesRes.error) throw devicesRes.error;
      if (vlansRes.error) throw vlansRes.error;
      if (subnetsRes.error) throw subnetsRes.error;
      if (racksRes.error) throw racksRes.error;
      if (!mountedRef.current) return;

      const allDevices = (devicesRes.data || []) as Device[];
      const online = allDevices.filter((d) => d.status === "ONLINE").length;
      const offline = allDevices.filter((d) => d.status === "OFFLINE").length;
      const warning = allDevices.filter((d) => d.status === "WARNING").length;
      const maintenance = allDevices.filter((d) => d.status === "MAINTENANCE").length;

      // Count by type
      const typeCount: Record<string, number> = {};
      allDevices.forEach((d) => {
        typeCount[d.type] = (typeCount[d.type] || 0) + 1;
      });
      const byType = Object.entries(typeCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const byStatus = [
        { name: "Online", value: online, color: STATUS_COLORS.ONLINE },
        { name: "Offline", value: offline, color: STATUS_COLORS.OFFLINE },
        { name: "Warning", value: warning, color: STATUS_COLORS.WARNING },
        { name: "Maintenance", value: maintenance, color: STATUS_COLORS.MAINTENANCE },
      ].filter((s) => s.value > 0);

      setStats({
        totalDevices: allDevices.length,
        online,
        offline,
        warning,
        maintenance,
        totalVlans: vlansRes.count || 0,
        totalSubnets: subnetsRes.count || 0,
        totalRacks: racksRes.count || 0,
        byType,
        byStatus,
        recentDevices: allDevices.slice(0, 8),
      });
      setError(null);
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
      if (mountedRef.current) {
        setError("ไม่สามารถเชื่อมต่อ Supabase ได้ — กรุณาตั้งค่า .env.local");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();

    // Realtime Sync
    const supabase = createClient();
    const channelName = `dashboard_${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    ["devices", "vlans", "subnets", "racks"].forEach((t) => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: t },
        () => fetchStats()
      );
    });

    channel.subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, loading, error };
}
