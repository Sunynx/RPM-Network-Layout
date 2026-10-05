"use client";

import { X, Router, Network, Shield, HardDrive, Radio, Cable, Zap, Monitor, Edit2, Trash2 } from "lucide-react";
import type { Device } from "@/types/network";
import { getStatusColor, getDeviceColor } from "@/lib/utils";

const DEVICE_ICONS: Record<string, React.ElementType> = {
  ROUTER: Router,
  SWITCH: Network,
  FIREWALL: Shield,
  SERVER: HardDrive,
  AP: Radio,
  PATCH_PANEL: Cable,
  UPS: Zap,
};

interface DeviceDetailPanelProps {
  device: Device;
  onClose: () => void;
  onEdit?: (device: Device) => void;
  onDelete?: (device: Device) => void;
  onViewPorts?: (device: Device) => void;
}

export default function DeviceDetailPanel({ device, onClose, onEdit, onDelete, onViewPorts }: DeviceDetailPanelProps) {
  const Icon = DEVICE_ICONS[device.type] || Monitor;
  const colors = getDeviceColor(device.type);
  const statusClass = getStatusColor(device.status);

  const fields = [
    { label: "Type", value: device.type },
    { label: "Brand", value: device.brand },
    { label: "Model", value: device.model },
    { label: "Serial No", value: device.serial_no },
    { label: "IP Address", value: device.ip_address, mono: true },
    { label: "MAC Address", value: device.mac_address, mono: true },
    { label: "Rack Unit", value: device.rack_unit ? `U${device.rack_unit}` : null },
    { label: "Notes", value: device.notes },
  ];

  return (
    <div className="w-[320px] glass-card p-0 flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className={`p-5 bg-gradient-to-r ${colors.gradient} border-b`} style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {device.name}
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border mt-1 ${statusClass}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {device.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-3">
          {fields.map(
            (field) =>
              field.value && (
                <div key={field.label}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                    {field.label}
                  </p>
                  <p
                    className={`text-sm ${field.mono ? "font-mono" : ""}`}
                    style={{ color: "var(--text-primary)" }}
                  >
                    {field.value}
                  </p>
                </div>
              )
          )}
        </div>
        
        {onViewPorts && (
          <div className="pt-4 mt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
            <button
              onClick={() => onViewPorts(device)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5"
            >
              <Network className="w-4 h-4 text-blue-400" />
              View Port Mapping
            </button>
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="pt-4 mt-4 border-t flex gap-2" style={{ borderColor: "var(--border-color)" }}>
            {onEdit && (
              <button
                onClick={() => onEdit(device)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
              >
                <Edit2 className="w-3.5 h-3.5" />
                แก้ไข
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(device)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
