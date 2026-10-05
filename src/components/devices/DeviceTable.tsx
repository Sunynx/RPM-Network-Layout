"use client";

import { Edit3, Trash2, Search } from "lucide-react";
import type { Device } from "@/types/network";
import { DEVICE_ICONS, FALLBACK_DEVICE_ICON } from "@/lib/constants";
import { getStatusColor, getStatusDot, formatMacAddress } from "@/lib/utils";

interface DeviceTableProps {
  devices: Device[];
  onEdit: (device: Device) => void;
  onDelete: (id: string, name: string) => void;
}

export default function DeviceTable({ devices, onEdit, onDelete }: DeviceTableProps) {
  if (devices.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">ไม่พบอุปกรณ์</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          ลองปรับเปลี่ยนเงื่อนไขการค้นหา หรือเพิ่มอุปกรณ์ใหม่
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
              <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)]">อุปกรณ์ (Device)</th>
              <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)]">ประเภท (Type)</th>
              <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)]">IP / MAC Address</th>
              <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)]">ยี่ห้อ / รุ่น</th>
              <th className="text-left py-4 px-5 font-semibold text-[var(--text-secondary)]">สถานะ (Status)</th>
              <th className="text-right py-4 px-5 font-semibold text-[var(--text-secondary)]">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const Icon = DEVICE_ICONS[device.type] || FALLBACK_DEVICE_ICON;
              return (
                <tr key={device.id} className="border-b transition-colors hover:bg-[var(--bg-card-hover)]" style={{ borderColor: "var(--border-color)" }}>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{device.name}</p>
                        {device.notes && <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-[200px] truncate">{device.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] shadow-sm">
                      {device.type}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] w-6">IP</span>
                        <span className="font-mono text-xs text-[var(--text-primary)]">{device.ip_address || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] w-6">MAC</span>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)]">{formatMacAddress(device.mac_address) || "—"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-[var(--text-primary)] font-medium">{device.brand || "—"}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{device.model || "—"}</p>
                    {device.serial_no && <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">SN: {device.serial_no}</p>}
                  </td>
                  <td className="py-4 px-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(device.status)}`}>
                      <div className={`w-2 h-2 rounded-full ${getStatusDot(device.status)}`} />
                      {device.status}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onEdit(device)} className="p-2 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors" title="แก้ไข">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(device.id, device.name)} className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors" title="ลบ">
                        <Trash2 className="w-4 h-4" />
                      </button>
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


