"use client";

import { useState } from "react";
import { X, Cable, Wifi, Zap } from "lucide-react";
import { CONNECTION_TYPES, type ConnectionMediaType } from "@/lib/constants";

interface ConnectionModalProps {
  isOpen: boolean;
  onConfirm: (type: ConnectionMediaType, label?: string, vlanId?: string | null, sourcePort?: string, targetPort?: string) => void;
  onDelete?: () => void;
  mode: "create" | "edit";
  defaultType?: ConnectionMediaType;
  defaultLabel?: string;
  defaultVlanId?: string;
  defaultSourcePort?: string;
  defaultTargetPort?: string;
  vlans?: any[]; // Array of Vlan objects
}

const TYPE_OPTIONS: { value: ConnectionMediaType; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { value: "ETHERNET", label: "Ethernet (LAN)", icon: Cable, color: "blue", description: "สายแลน Cat5e/Cat6 — สีฟ้า" },
  { value: "FIBER", label: "Fiber Optic", icon: Zap, color: "amber", description: "ไฟเบอร์ออปติก — สีส้ม (มีอนิเมชัน)" },
  { value: "WIRELESS", label: "Wireless", icon: Wifi, color: "violet", description: "ไร้สาย — สีม่วง (เส้นประ)" },
];

export default function ConnectionModal({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  mode,
  defaultType = "ETHERNET",
  defaultLabel = "",
  defaultVlanId = "",
  defaultSourcePort = "",
  defaultTargetPort = "",
  vlans = [],
}: ConnectionModalProps) {
  const [selectedType, setSelectedType] = useState<ConnectionMediaType>(defaultType);
  const [label, setLabel] = useState(defaultLabel);
  const [vlanId, setVlanId] = useState(defaultVlanId);
  const [sourcePort, setSourcePort] = useState(defaultSourcePort);
  const [targetPort, setTargetPort] = useState(defaultTargetPort);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center cmd-overlay"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden cmd-modal shadow-2xl"
        style={{
          background: "rgba(15, 23, 42, 0.98)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <h3 className="text-sm font-bold text-white">
            {mode === "create" ? "สร้างการเชื่อมต่อใหม่" : "แก้ไขการเชื่อมต่อ"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Connection Type */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
              ประเภทสายเชื่อมต่อ
            </label>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedType(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? `border-${opt.color}-500/50 bg-${opt.color}-500/10`
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                    style={isSelected ? {
                      borderColor: opt.color === "blue" ? "rgba(59,130,246,0.5)" : opt.color === "amber" ? "rgba(245,158,11,0.5)" : "rgba(139,92,246,0.5)",
                      background: opt.color === "blue" ? "rgba(59,130,246,0.1)" : opt.color === "amber" ? "rgba(245,158,11,0.1)" : "rgba(139,92,246,0.1)",
                    } : {}}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? `bg-${opt.color}-500/20` : "bg-white/5"
                    }`}
                    style={isSelected ? {
                      background: opt.color === "blue" ? "rgba(59,130,246,0.2)" : opt.color === "amber" ? "rgba(245,158,11,0.2)" : "rgba(139,92,246,0.2)",
                    } : {}}
                    >
                      <Icon className={`w-5 h-5 ${
                        isSelected 
                          ? opt.color === "blue" ? "text-blue-400" : opt.color === "amber" ? "text-amber-400" : "text-violet-400"
                          : "text-slate-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-500">{opt.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label (optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Label (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="เช่น Uplink Core, Port 24..."
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Port Mapping (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                พอร์ตต้นทาง
              </label>
              <input
                type="text"
                value={sourcePort}
                onChange={(e) => setSourcePort(e.target.value)}
                placeholder="เช่น Gi1/0/1"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                พอร์ตปลายทาง
              </label>
              <input
                type="text"
                value={targetPort}
                onChange={(e) => setTargetPort(e.target.value)}
                placeholder="เช่น Gi1/0/24"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* VLAN (optional) */}
          {vlans.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                VLAN (Access / Native)
              </label>
              <select
                value={vlanId}
                onChange={(e) => setVlanId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
              >
                <option value="">ไม่ได้ระบุ (Trunk หรือ Default)</option>
                {vlans.map((v) => (
                  <option key={v.id} value={v.id}>
                    VLAN {v.vlan_number} - {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {mode === "edit" && onDelete ? (
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              ลบเส้นเชื่อมต่อ
            </button>
          ) : (
            <div></div> // Spacer
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                onConfirm(selectedType, label, vlanId, sourcePort, targetPort);
                onClose();
              }}
              className="px-6 py-2 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              {mode === "create" ? "เชื่อมต่อ" : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
