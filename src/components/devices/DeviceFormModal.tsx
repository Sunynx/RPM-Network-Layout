"use client";

import { X, Loader2 } from "lucide-react";
import type { DeviceType, DeviceStatus } from "@/types/network";
import { DEVICE_TYPES, STATUS_LIST } from "@/lib/constants";

export interface DeviceFormData {
  name: string;
  type: DeviceType;
  brand: string;
  model: string;
  serial_no: string;
  status: DeviceStatus;
  ip_address: string;
  mac_address: string;
  notes?: string;
  vlan_id?: string | null;
  rack_id?: string | null;
  rack_unit?: number | null;
  rack_size?: number | null;
}

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: DeviceFormData;
  setFormData: (data: DeviceFormData) => void;
  saving: boolean;
  isEditing: boolean;
  vlans?: { id: string; name: string; vlan_number: number }[];
  racks?: { id: string; name: string; total_units: number }[];
}

export default function DeviceFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  saving,
  isEditing,
  vlans = [],
  racks = [],
}: DeviceFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {!isEditing ? "เพิ่มอุปกรณ์ใหม่" : "แก้ไขอุปกรณ์"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/10"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name & Type */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  ชื่ออุปกรณ์ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น Core-SW-01"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  ประเภทอุปกรณ์ *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as DeviceType })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none appearance-none"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                >
                  {DEVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand & Model */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  แบรนด์
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="เช่น Ruijie, Cisco"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  รุ่น (Model)
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="เช่น RG-NBS3100"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Network Info */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  IP Address
                </label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  placeholder="เช่น 192.168.1.10"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-mono transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  MAC Address
                </label>
                <input
                  type="text"
                  value={formData.mac_address}
                  onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                  placeholder="เช่น 00:1A:2B:3C:4D:5E"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-mono transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Status & Serial */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  สถานะ *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DeviceStatus })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none appearance-none"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serial_no}
                  onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
                  placeholder="S/N"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* VLAN Assignment */}
              {vlans.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                    VLAN ของอุปกรณ์
                  </label>
                  <select
                    value={formData.vlan_id || ""}
                    onChange={(e) => setFormData({ ...formData, vlan_id: e.target.value || null })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none appearance-none"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">ไม่ได้ระบุ VLAN</option>
                    {vlans.map((v) => (
                      <option key={v.id} value={v.id}>
                        VLAN {v.vlan_number} - {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Rack Assignment */}
              {racks.length > 0 && (
                <div className="md:col-span-2 space-y-4 pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                      ตู้ Rack ที่ติดตั้ง
                    </label>
                    <select
                      value={formData.rack_id || ""}
                      onChange={(e) => setFormData({ ...formData, rack_id: e.target.value || null })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none appearance-none"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="">ไม่ได้ติดตั้งในตู้ Rack</option>
                      {racks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.total_units}U)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.rack_id && (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                          ตำแหน่ง U (เริ่มต้น)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={formData.rack_unit || ""}
                          onChange={(e) => setFormData({ ...formData, rack_unit: parseInt(e.target.value) || null })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                          style={{
                            background: "var(--bg-secondary)",
                            borderColor: "var(--border-color)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                          ขนาด (U)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={formData.rack_size || 1}
                          onChange={(e) => setFormData({ ...formData, rack_size: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                          style={{
                            background: "var(--bg-secondary)",
                            borderColor: "var(--border-color)",
                            color: "var(--text-primary)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
              หมายเหตุ / รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="ข้อมูลเพิ่มเติม..."
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 resize-none"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Footer actions */}
          <div
            className="flex items-center justify-end gap-3 pt-4 border-t mt-8"
            style={{ borderColor: "var(--border-color)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : !isEditing ? (
                "เพิ่มอุปกรณ์"
              ) : (
                "บันทึกการเปลี่ยนแปลง"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
