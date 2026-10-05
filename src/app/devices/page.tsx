"use client";

import { useState, useMemo } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useToast } from "@/components/ui/Toast";
import type { Device } from "@/types/network";

import DeviceToolbar from "@/components/devices/DeviceToolbar";
import DeviceTable from "@/components/devices/DeviceTable";
import DeviceFormModal, { DeviceFormData } from "@/components/devices/DeviceFormModal";

const emptyForm: DeviceFormData = {
  name: "",
  type: "SWITCH",
  brand: "",
  model: "",
  serial_no: "",
  status: "ONLINE",
  ip_address: "",
  mac_address: "",
  notes: "",
  vlan_id: null,
};

export default function DevicesPage() {
  const { data: devices, loading, refetch } = useSupabaseQuery<Device>("devices", { orderBy: "name" });
  const { data: vlans } = useSupabaseQuery<any>("vlans", { orderBy: "vlan_number" });
  const { data: racks } = useSupabaseQuery<any>("racks", { orderBy: "name" });
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DeviceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [syncingRuijie, setSyncingRuijie] = useState(false);

  // Filters
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.ip_address && d.ip_address.includes(searchQuery)) ||
        (d.mac_address && d.mac_address.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = filterType === "ALL" || d.type === filterType;
      const matchStatus = filterStatus === "ALL" || d.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [devices, searchQuery, filterType, filterStatus]);

  // Handlers
  const handleAdd = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (device: Device) => {
    setEditingId(device.id);
    setFormData({
      name: device.name,
      type: device.type,
      brand: device.brand || "",
      model: device.model || "",
      serial_no: device.serial_no || "",
      status: device.status,
      ip_address: device.ip_address || "",
      mac_address: device.mac_address || "",
      notes: device.notes || "",
      vlan_id: device.vlan_id || null,
      rack_id: device.rack_id || null,
      rack_unit: device.rack_unit || null,
      rack_size: device.rack_size || null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์ ${name}?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) {
      addToast({ type: "error", title: "ลบอุปกรณ์ล้มเหลว", message: error.message });
    } else {
      addToast({ type: "success", title: "ลบอุปกรณ์สำเร็จ", message: `ลบ ${name} เรียบร้อย` });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    try {
      if (editingId) {
        const { error } = await supabase.from("devices").update(formData).eq("id", editingId);
        if (error) throw error;
        addToast({ type: "success", title: "แก้ไขสำเร็จ", message: `บันทึกข้อมูล ${formData.name} เรียบร้อย` });
      } else {
        const { error } = await supabase.from("devices").insert([formData]);
        if (error) throw error;
        addToast({ type: "success", title: "เพิ่มอุปกรณ์สำเร็จ", message: `เพิ่ม ${formData.name} เข้าสู่ระบบเรียบร้อย` });
      }
      setShowForm(false);
    } catch (err) {
      addToast({ type: "error", title: "เกิดข้อผิดพลาด", message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const supabase = createClient();
        const rows = results.data as Record<string, string>[];
        const devicesToInsert = rows
          .filter((row) => row.name && row.type)
          .map((row) => ({
            name: row.name,
            type: row.type?.toUpperCase() || "SWITCH",
            brand: row.brand || null,
            model: row.model || null,
            serial_no: row.serial_no || null,
            status: row.status?.toUpperCase() || "ONLINE",
            ip_address: row.ip_address || null,
            mac_address: row.mac_address || null,
            notes: row.notes || null,
          }));

        if (devicesToInsert.length > 0) {
          const { error } = await supabase.from("devices").insert(devicesToInsert);
          if (error) {
            addToast({ type: "error", title: "นำเข้าล้มเหลว", message: error.message });
          } else {
            addToast({ type: "success", title: "นำเข้าสำเร็จ", message: `นำเข้า ${devicesToInsert.length} อุปกรณ์สำเร็จ` });
          }
        }
      },
    });
    e.target.value = "";
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      devices.map((d) => ({
        name: d.name,
        type: d.type,
        brand: d.brand,
        model: d.model,
        serial_no: d.serial_no,
        status: d.status,
        ip_address: d.ip_address,
        mac_address: d.mac_address,
        notes: d.notes,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rpm-devices.csv";
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: "success", title: "ส่งออกสำเร็จ", message: "ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว" });
  };

  const handleSyncRuijie = async () => {
    setSyncingRuijie(true);
    try {
      const res = await fetch("/api/ruijie/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Unknown error");
      addToast({
        type: "success",
        title: "ซิงค์ข้อมูลสำเร็จ",
        message: `อัปเดต: ${data.updated} | เพิ่มใหม่: ${data.inserted} | รวม: ${data.total}`
      });
      refetch(); // Manual refetch in case realtime doesn't catch it all immediately
    } catch (err: unknown) {
      addToast({ type: "error", title: "ซิงค์ข้อมูลล้มเหลว", message: (err as Error).message });
    } finally {
      setSyncingRuijie(false);
    }
  };

  if (loading) {
    return null; // Handled by layout suspense/loading
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            จัดการอุปกรณ์
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            เพิ่ม ลด แก้ไข และตรวจสอบสถานะอุปกรณ์ทั้งหมดในระบบ
          </p>
        </div>

        <DeviceToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onAdd={handleAdd}
          onImportCSV={handleImportCSV}
          onExportCSV={handleExportCSV}
          onSyncRuijie={handleSyncRuijie}
          syncingRuijie={syncingRuijie}
        />

        <DeviceTable
          devices={filteredDevices}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <DeviceFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        saving={saving}
        isEditing={!!editingId}
        vlans={vlans}
        racks={racks}
      />
    </>
  );
}
