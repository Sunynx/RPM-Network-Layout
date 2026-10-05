"use client";

import { ArrowDownUp, ArrowLeftRight, Save, Loader2 } from "lucide-react";
import { useState } from "react";

interface TopologyToolbarProps {
  onAutoLayout: (direction: "TB" | "LR") => void;
  onSavePositions: () => Promise<void>;
  vlans: any[];
  activeVlanId: string | null;
  onVlanChange: (vlanId: string | null) => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  onAddDeviceClick?: () => void;
}

export default function TopologyToolbar({
  onAutoLayout,
  onSavePositions,
  vlans = [],
  activeVlanId,
  onVlanChange,
  showLabels = true,
  onToggleLabels,
  onAddDeviceClick,
}: TopologyToolbarProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSavePositions();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-2 py-1.5 rounded-xl"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        backdropFilter: "blur(10px)",
      }}
    >
      <button
        onClick={() => onAutoLayout("TB")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border border-blue-400/30"
        title="Auto Layout (Top → Bottom)"
      >
        <ArrowDownUp className="w-4 h-4 drop-shadow" />
        <span className="drop-shadow">Vertical</span>
      </button>

      <button
        onClick={() => onAutoLayout("LR")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 border border-purple-400/30"
        title="Auto Layout (Left → Right)"
      >
        <ArrowLeftRight className="w-4 h-4 drop-shadow" />
        <span className="drop-shadow">Horizontal</span>
      </button>

      {onAddDeviceClick && (
        <button
          onClick={onAddDeviceClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-green-500/10 hover:text-green-400"
          style={{ color: "var(--text-secondary)" }}
          title="Add New Device"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Device</span>
        </button>
      )}

      <div className="w-px h-6 mx-2" style={{ background: "var(--border-color)" }} />

      {onToggleLabels && (
        <button
          onClick={onToggleLabels}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            showLabels
              ? "bg-blue-500/10 text-blue-400"
              : "hover:bg-blue-500/10 hover:text-blue-400"
          }`}
          style={{ color: showLabels ? "" : "var(--text-secondary)" }}
          title={showLabels ? "ซ่อน Label" : "แสดง Label"}
        >
          <span>{showLabels ? "Hide Labels" : "Show Labels"}</span>
        </button>
      )}

      <div className="w-px h-5 mx-1" style={{ background: "var(--border-color)" }} />

      <div className="flex items-center gap-2 px-2">
        <span className="text-xs font-semibold text-slate-400">VLAN Overlay:</span>
        <select
          value={activeVlanId || ""}
          onChange={(e) => onVlanChange(e.target.value || null)}
          className="text-xs bg-transparent border-none outline-none cursor-pointer"
          style={{ color: "var(--text-primary)" }}
        >
          <option value="">ทั้งหมด (All)</option>
          {vlans.map((v) => (
            <option key={v.id} value={v.id}>
              VLAN {v.vlan_number} - {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-px h-5 mx-1" style={{ background: "var(--border-color)" }} />

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-50"
        style={{ color: "var(--text-secondary)" }}
        title="Save Positions"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        <span>{saving ? "Saving..." : "Save"}</span>
      </button>
    </div>
  );
}
