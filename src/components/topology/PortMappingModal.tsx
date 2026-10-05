"use client";

import { useState, useEffect } from "react";
import { X, Network, Server, Router, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PortMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: { id: string; name: string; type: string } | null;
}

export default function PortMappingModal({ isOpen, onClose, device }: PortMappingModalProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && device) {
      fetchConnections();
    }
  }, [isOpen, device]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          source_port_name,
          target_port_name,
          type,
          label,
          from_device:from_device_id (id, name, type),
          to_device:to_device_id (id, name, type)
        `)
        .or(`from_device_id.eq.${device?.id},to_device_id.eq.${device?.id}`);

      if (error && error.code !== '42703') throw error; // Ignore column not found error temporarily
      
      const transformed = (data || []).map((conn: any) => {
        const isSource = conn.from_device.id === device?.id;
        return {
          id: conn.id,
          localPort: isSource ? conn.source_port_name : conn.target_port_name,
          remotePort: isSource ? conn.target_port_name : conn.source_port_name,
          remoteDevice: isSource ? conn.to_device : conn.from_device,
          connectionType: conn.type,
          label: conn.label
        };
      });
      
      transformed.sort((a: any, b: any) => {
        if (!a.localPort) return 1;
        if (!b.localPort) return -1;
        return a.localPort.localeCompare(b.localPort, undefined, { numeric: true, sensitivity: 'base' });
      });

      setConnections(transformed);
    } catch (err) {
      console.error("Failed to fetch port mappings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !device) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: "rgba(15, 23, 42, 0.98)",
          borderColor: "rgba(255, 255, 255, 0.1)",
          maxHeight: "80vh"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-400" />
              Port Mapping
            </h3>
            <p className="text-xs text-slate-400 mt-1">อุปกรณ์: <span className="font-semibold text-slate-300">{device.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-0 overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
          ) : connections.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p>ไม่มีการเชื่อมต่อสายสำหรับอุปกรณ์นี้</p>
              <p className="text-xs mt-2">กรุณาลากเส้นเชื่อมต่อในหน้า Topology เพื่อดู Port Mapping</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <th className="px-5 py-3 font-semibold">Local Port</th>
                  <th className="px-5 py-3 font-semibold">Connection Type</th>
                  <th className="px-5 py-3 font-semibold">Remote Device</th>
                  <th className="px-5 py-3 font-semibold">Remote Port</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {connections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20 shadow-inner">
                        {conn.localPort || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${conn.connectionType === "FIBER" ? "bg-amber-400" : "bg-blue-400"}`} />
                        <span className="text-slate-300">{conn.connectionType}</span>
                        {conn.label && <span className="text-xs text-slate-500">({conn.label})</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-slate-200 font-medium">
                        {conn.remoteDevice.type === "SERVER" ? <Server className="w-4 h-4 text-purple-400" /> : 
                         conn.remoteDevice.type === "ROUTER" ? <Router className="w-4 h-4 text-emerald-400" /> :
                         <Activity className="w-4 h-4 text-sky-400" />}
                        {conn.remoteDevice.name}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono bg-white/5 text-slate-300 px-2.5 py-1 rounded-md border border-white/10 shadow-inner">
                        {conn.remotePort || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
