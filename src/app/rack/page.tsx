"use client";

import { useEffect, useState } from "react";
import {
  Router,
  Network,
  Shield,
  HardDrive,
  Radio,
  Cable,
  Zap,
  Monitor,
  Loader2,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Device, Rack } from "@/types/network";
import { getStatusDot, getDeviceColor } from "@/lib/utils";
import DeviceFormModal, { DeviceFormData } from "@/components/devices/DeviceFormModal";
import { useToast } from "@/components/ui/Toast";

const DEVICE_ICONS: Record<string, React.ElementType> = {
  ROUTER: Router,
  SWITCH: Network,
  FIREWALL: Shield,
  SERVER: HardDrive,
  AP: Radio,
  PATCH_PANEL: Cable,
  UPS: Zap,
};

interface RackWithDevices extends Rack {
  devices: Device[];
}

export default function RackPage() {
  const [racks, setRacks] = useState<RackWithDevices[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", total_units: 42 });

  const [vlans, setVlans] = useState<any[]>([]);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);
  const [deviceFormData, setDeviceFormData] = useState<DeviceFormData>({
    name: "",
    type: "SERVER",
    brand: "",
    model: "",
    serial_no: "",
    status: "ONLINE",
    ip_address: "",
    mac_address: "",
    notes: "",
    vlan_id: null,
    rack_id: null,
    rack_unit: null,
    rack_size: 1,
  });
  
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchRacks() {
      try {
        const [{ data: rackData }, { data: deviceData }, { data: vlanData }] = await Promise.all([
          supabase.from("racks").select("*, rooms(name)").order("name"),
          supabase.from("devices").select("*").not("rack_id", "is", null),
          supabase.from("vlans").select("*").order("vlan_number"),
        ]);

        if (!isMounted) return;

        if (vlanData) setVlans(vlanData);

        const allRacks = (rackData || []) as Rack[];
        const allDevices = (deviceData || []) as Device[];

        const racksWithDevices: RackWithDevices[] = allRacks.map((rack) => ({
          ...rack,
          devices: allDevices.filter((d) => d.rack_id === rack.id),
        }));

        setRacks(racksWithDevices);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRacks();

    const channel = supabase
      .channel('rack_page_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'racks' }, () => fetchRacks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => fetchRacks())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleAddRack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      
      // Get or create room
      let { data: rooms } = await supabase.from("rooms").select("id").limit(1);
      let roomId = rooms?.[0]?.id;
      
      if (!roomId) {
        // Create Site -> Floor -> Room if missing
        let { data: sites } = await supabase.from("sites").select("id").limit(1);
        let siteId = sites?.[0]?.id;
        if (!siteId) {
          const { data } = await supabase.from("sites").insert([{ name: "HQ", address: "Main Building" }]).select();
          siteId = data?.[0]?.id;
        }
        
        let { data: floors } = await supabase.from("floors").select("id").limit(1);
        let floorId = floors?.[0]?.id;
        if (!floorId) {
          const { data } = await supabase.from("floors").insert([{ name: "Ground Floor", site_id: siteId }]).select();
          floorId = data?.[0]?.id;
        }
        
        const { data } = await supabase.from("rooms").insert([{ name: "Main Server Room", type: "SERVER_ROOM", floor_id: floorId }]).select();
        roomId = data?.[0]?.id;
      }

      const { error } = await supabase.from("racks").insert([{
        name: formData.name,
        total_units: formData.total_units,
        room_id: roomId
      }]);
      if (error) throw error;
      setShowForm(false);
      setFormData({ name: "", total_units: 42 });
    } catch (err) {
      console.error(err);
      alert("Error adding rack");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDevice(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.from("devices").insert([deviceFormData]);
      if (error) throw error;
      addToast({ type: "success", title: "เพิ่มอุปกรณ์สำเร็จ", message: `เพิ่ม ${deviceFormData.name} เรียบร้อย` });
      setShowDeviceForm(false);
    } catch (err) {
      addToast({ type: "error", title: "เกิดข้อผิดพลาด", message: (err as Error).message });
    } finally {
      setSavingDevice(false);
    }
  };

  const handleAddDeviceToUnit = (rackId: string, unit: number, size: number = 1) => {
    setDeviceFormData({
      name: "",
      type: "SERVER",
      brand: "",
      model: "",
      serial_no: "",
      status: "ONLINE",
      ip_address: "",
      mac_address: "",
      notes: "",
      vlan_id: null,
      rack_id: rackId,
      rack_unit: unit,
      rack_size: size,
    });
    setShowDeviceForm(true);
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Rack View
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              แผนผัง Server Rack ทั้งหมด {racks.length} ตู้
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่ม Rack ใหม่
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {racks.map((rack) => (
            <RackDiagram
              key={rack.id}
              rack={rack}
              onSelectDevice={setSelectedDevice}
              selectedDeviceId={selectedDevice?.id}
              onAddDeviceToUnit={handleAddDeviceToUnit}
            />
          ))}
        </div>
      </div>

      {/* Device detail popup */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDevice(null)}>
          <div className="glass-card p-6 max-w-sm mx-4 animate-fade-in" style={{ background: "var(--bg-secondary)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const Icon = DEVICE_ICONS[selectedDevice.type] || Monitor;
                const colors = getDeviceColor(selectedDevice.type);
                return (
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                );
              })()}
              <div>
                <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>{selectedDevice.name}</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedDevice.type}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Brand/Model", [selectedDevice.brand, selectedDevice.model].filter(Boolean).join(" ")],
                ["IP", selectedDevice.ip_address],
                ["Rack Unit", selectedDevice.rack_unit ? `U${selectedDevice.rack_unit} (${selectedDevice.rack_size}U)` : null],
                ["Status", selectedDevice.status],
              ].map(([label, value]) => value && (
                <div key={label as string} className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl" style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--border-color)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                เพิ่ม Rack ใหม่
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl transition-colors hover:bg-white/10">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddRack} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  ชื่อ Rack *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น Server Rack A"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  จำนวน Unit (U) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={60}
                  value={formData.total_units}
                  onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) || 42 })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      <DeviceFormModal
        isOpen={showDeviceForm}
        onClose={() => setShowDeviceForm(false)}
        formData={deviceFormData}
        setFormData={setDeviceFormData}
        onSubmit={handleAddDeviceSubmit}
        saving={savingDevice}
        isEditing={false}
        vlans={vlans}
        racks={racks}
      />
    </>
  );
}

function RackDiagram({
  rack,
  onSelectDevice,
  selectedDeviceId,
  onAddDeviceToUnit,
}: {
  rack: RackWithDevices;
  onSelectDevice: (d: Device) => void;
  selectedDeviceId?: string;
  onAddDeviceToUnit: (rackId: string, unit: number, size: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragOverUnit, setDragOverUnit] = useState<number | null>(null);
  
  // Drag to select U size state
  const [selectionStartUnit, setSelectionStartUnit] = useState<number | null>(null);
  const [selectionCurrentUnit, setSelectionCurrentUnit] = useState<number | null>(null);
  
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // Clear selection if mouse is released outside of valid droppable areas
      setTimeout(() => {
        setSelectionStartUnit(null);
        setSelectionCurrentUnit(null);
      }, 0);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const totalUnits = rack.total_units;

  // Build unit map
  const unitMap = new Map<number, Device>();
  const occupiedUnits = new Set<number>();

  rack.devices.forEach((device) => {
    if (device.rack_unit) {
      unitMap.set(device.rack_unit, device);
      for (let i = 0; i < (device.rack_size || 1); i++) {
        occupiedUnits.add(device.rack_unit + i);
      }
    }
  });

  const usedUnits = occupiedUnits.size;
  const utilization = Math.round((usedUnits / totalUnits) * 100);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, device: Device) => {
    e.dataTransfer.setData("deviceId", device.id);
    e.dataTransfer.setData("rackSize", String(device.rack_size || 1));
    e.dataTransfer.setData("rackId", rack.id); // Allows moving between racks in the future
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetUnit: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
    if (dragOverUnit !== targetUnit) {
      setDragOverUnit(targetUnit);
    }
  };

  const handleDragLeave = () => {
    setDragOverUnit(null);
  };

  const handleDrop = async (e: React.DragEvent, targetUnit: number) => {
    e.preventDefault();
    setDragOverUnit(null);

    const deviceId = e.dataTransfer.getData("deviceId");
    const rackSize = parseInt(e.dataTransfer.getData("rackSize") || "1", 10);

    if (!deviceId) return;

    // Check overlaps (ignoring the device being dragged itself)
    const otherDevices = rack.devices.filter(d => d.id !== deviceId);
    const otherOccupied = new Set<number>();
    otherDevices.forEach(d => {
      if (d.rack_unit) {
        for (let i = 0; i < (d.rack_size || 1); i++) {
          otherOccupied.add(d.rack_unit + i);
        }
      }
    });

    // Check bounds: targetUnit is the bottom unit of the device (if we drag it there, wait).
    // The device goes UP from targetUnit. So top unit is targetUnit + rackSize - 1
    // Example: Drop on U42, size 2. It occupies U42 and U43. Max is totalUnits.
    const topUnit = targetUnit + rackSize - 1;
    if (topUnit > totalUnits) {
      alert("ไม่สามารถวางอุปกรณ์ได้ (ขนาดอุปกรณ์เกินขอบเขตด้านบนสุดของตู้)");
      return;
    }

    for (let i = 0; i < rackSize; i++) {
      if (otherOccupied.has(targetUnit + i)) {
        alert("ไม่สามารถวางอุปกรณ์ได้ (มีอุปกรณ์อื่นติดตั้งอยู่แล้วในตำแหน่งนี้)");
        return;
      }
    }

    // Update via Supabase
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("devices")
        .update({ rack_unit: targetUnit, rack_id: rack.id })
        .eq("id", deviceId);
      
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการย้ายอุปกรณ์");
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Rack Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
            <HardDrive className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {rack.name}
            </h3>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {totalUnits}U • {usedUnits}U used • {utilization}%
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {/* Utilization Bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
          <div
            className="h-full rounded-full transition-all bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>

      {/* Rack Units */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <div
            className="rounded-lg overflow-hidden border"
            style={{ borderColor: "var(--border-color)", position: "relative" }}
          >
            {Array.from({ length: totalUnits }, (_, i) => {
              const unit = totalUnits - i;
              const device = unitMap.get(unit);
              const isOccupied = occupiedUnits.has(unit);
              const isStart = device && device.rack_unit === unit;
              const isDragOver = dragOverUnit === unit;
              const isSelected =
                selectionStartUnit !== null &&
                selectionCurrentUnit !== null &&
                unit <= Math.max(selectionStartUnit, selectionCurrentUnit) &&
                unit >= Math.min(selectionStartUnit, selectionCurrentUnit);

              if (isOccupied && !isStart) return null;

              if (isStart && device) {
                const colors = getDeviceColor(device.type);
                const Icon = DEVICE_ICONS[device.type] || Monitor;
                const statusDot = getStatusDot(device.status);
                const height = (device.rack_size || 1) * 28;

                return (
                  <div
                    key={unit}
                    draggable
                    onDragStart={(e) => handleDragStart(e, device)}
                    onDragOver={(e) => handleDragOver(e, unit)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, unit)}
                    className={`flex items-center gap-2 px-2 border-b cursor-grab active:cursor-grabbing transition-all hover:brightness-125 ${
                      selectedDeviceId === device.id ? "ring-1 ring-blue-400" : ""
                    } ${isDragOver ? "ring-2 ring-dashed ring-blue-500 bg-blue-500/20" : colors.bg}`}
                    style={{
                      height: `${height}px`,
                      borderColor: "var(--border-color)",
                    }}
                    onClick={() => onSelectDevice(device)}
                  >
                    <span className="text-[9px] w-5 text-center shrink-0 font-mono" style={{ color: "var(--text-muted)" }}>
                      {unit}
                    </span>
                    <Icon className={`w-3 h-3 shrink-0 ${colors.text}`} />
                    <span className="text-[10px] font-medium truncate flex-1" style={{ color: "var(--text-primary)" }}>
                      {device.name}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot} shrink-0`} />
                  </div>
                );
              }

              return (
                <div
                  key={unit}
                  onDragOver={(e) => handleDragOver(e, unit)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, unit)}
                  onMouseDown={() => {
                    setSelectionStartUnit(unit);
                    setSelectionCurrentUnit(unit);
                  }}
                  onMouseEnter={() => {
                    if (selectionStartUnit !== null) {
                      setSelectionCurrentUnit(unit);
                    }
                  }}
                  onMouseUp={(e) => {
                    if (selectionStartUnit !== null) {
                      e.stopPropagation();
                      const start = Math.min(selectionStartUnit, selectionCurrentUnit || unit);
                      const end = Math.max(selectionStartUnit, selectionCurrentUnit || unit);
                      
                      let hasOccupied = false;
                      for (let i = start; i <= end; i++) {
                        if (occupiedUnits.has(i)) {
                          hasOccupied = true;
                          break;
                        }
                      }
                      
                      if (hasOccupied) {
                        alert("พื้นที่ที่เลือกมีอุปกรณ์อื่นติดตั้งอยู่แล้ว ไม่สามารถเลือกคร่อมได้");
                      } else {
                        const size = end - start + 1;
                        onAddDeviceToUnit(rack.id, start, size);
                      }
                      
                      setSelectionStartUnit(null);
                      setSelectionCurrentUnit(null);
                    }
                  }}
                  className={`flex items-center gap-2 px-2 border-b h-7 transition-colors cursor-pointer select-none ${
                    isDragOver ? "bg-blue-500/20" : ""
                  } ${isSelected ? "bg-blue-500/30 ring-1 ring-blue-500" : "hover:bg-blue-500/10"}`}
                  style={{ borderColor: "var(--border-color)" }}
                  title="คลิกหรือลากครอบเพื่อเพิ่มอุปกรณ์หลาย U"
                >
                  <span className="text-[9px] w-5 text-center font-mono" style={{ color: "var(--text-muted)" }}>
                    {unit}
                  </span>
                  <span className="text-[9px]" style={{ color: "var(--text-muted)", opacity: 0.3 }}>
                    — คลิกเพื่อเพิ่มอุปกรณ์ —
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
