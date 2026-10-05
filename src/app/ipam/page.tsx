"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Network,
  Plus,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Vlan, Subnet, Device } from "@/types/network";

export default function IpamPage() {
  const [vlans, setVlans] = useState<Vlan[]>([]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vlans" | "subnets" | "ips">("vlans");
  const [searchQuery, setSearchQuery] = useState("");
  const [showVlanForm, setShowVlanForm] = useState(false);
  const [showSubnetForm, setShowSubnetForm] = useState(false);
  const [vlanForm, setVlanForm] = useState({ vlan_number: "", name: "", description: "" });
  const [subnetForm, setSubnetForm] = useState({ cidr: "", gateway: "", description: "", vlan_id: "" });

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchData() {
      try {
        const [{ data: vData }, { data: sData }, { data: dData }] = await Promise.all([
          supabase.from("vlans").select("*").order("vlan_number"),
          supabase.from("subnets").select("*, vlans(name, vlan_number)").order("cidr"),
          supabase.from("devices").select("*, vlans(name, vlan_number), subnets(cidr)").order("ip_address"),
        ]);
        if (!isMounted) return;
        setVlans((vData || []) as Vlan[]);
        setSubnets((sData || []) as Subnet[]);
        setDevices((dData || []) as Device[]);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    const channel = supabase
      .channel('ipam_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vlans' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subnets' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => fetchData())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleAddVlan() {
    const supabase = createClient();
    const { error } = await supabase.from("vlans").insert({
      vlan_number: parseInt(vlanForm.vlan_number),
      name: vlanForm.name,
      description: vlanForm.description || null,
    });
    if (error) {
      alert("Error: " + error.message);
    } else {
      setShowVlanForm(false);
      setVlanForm({ vlan_number: "", name: "", description: "" });
    }
  }

  async function handleAddSubnet() {
    const supabase = createClient();
    const { error } = await supabase.from("subnets").insert({
      cidr: subnetForm.cidr,
      gateway: subnetForm.gateway || null,
      description: subnetForm.description || null,
      vlan_id: subnetForm.vlan_id || null,
    });
    if (error) {
      alert("Error: " + error.message);
    } else {
      setShowSubnetForm(false);
      setSubnetForm({ cidr: "", gateway: "", description: "", vlan_id: "" });
    }
  }

  const filteredDevicesWithIp = devices.filter(
    (d) =>
      d.ip_address &&
      (!searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.mac_address?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const tabs = [
    { id: "vlans" as const, label: "VLANs", count: vlans.length, icon: Network },
    { id: "subnets" as const, label: "Subnets", count: subnets.length, icon: Globe },
    { id: "ips" as const, label: "IP Allocation", count: filteredDevicesWithIp.length, icon: Globe },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          IPAM
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          IP Address Management — จัดการ VLAN, Subnet, และ IP ทั้งหมด
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                : ""
            }`}
            style={activeTab !== tab.id ? { color: "var(--text-secondary)" } : undefined}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === tab.id ? "bg-white/20" : ""
              }`}
              style={activeTab !== tab.id ? { background: "var(--bg-primary)" } : undefined}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* VLAN Tab */}
      {activeTab === "vlans" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowVlanForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add VLAN
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  {["VLAN ID", "Name", "Description", "Subnets", "Devices"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vlans.map((vlan) => {
                  const vlanSubnets = subnets.filter((s) => s.vlan_id === vlan.id);
                  const vlanDevices = devices.filter((d) => d.vlan_id === vlan.id);
                  return (
                    <tr
                      key={vlan.id}
                      className="transition-colors hover:bg-[var(--bg-card-hover)]"
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                    >
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {vlan.vlan_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium" style={{ color: "var(--text-primary)" }}>
                        {vlan.name}
                      </td>
                      <td className="py-3 px-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        {vlan.description || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {vlanSubnets.map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded text-[10px] font-mono"
                              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                            >
                              {s.cidr}
                            </span>
                          ))}
                          {vlanSubnets.length === 0 && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                        >
                          {vlanDevices.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subnet Tab */}
      {activeTab === "subnets" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowSubnetForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subnet
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {subnets.map((subnet) => {
              const subnetDevices = devices.filter((d) => d.subnet_id === subnet.id);
              const cidrParts = subnet.cidr.split("/");
              const prefix = parseInt(cidrParts[1] || "24");
              const totalIps = Math.pow(2, 32 - prefix) - 2;
              const usedIps = subnetDevices.length;
              const utilization = totalIps > 0 ? Math.round((usedIps / totalIps) * 100) : 0;

              return (
                <div key={subnet.id} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                        {subnet.cidr}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {subnet.description || "—"}
                      </p>
                    </div>
                    {(subnet as unknown as { vlans?: { name: string; vlan_number: number } }).vlans && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        VLAN {(subnet as unknown as { vlans: { vlan_number: number } }).vlans.vlan_number}
                      </span>
                    )}
                  </div>

                  {/* Utilization bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span style={{ color: "var(--text-muted)" }}>
                        {usedIps} / {totalIps} IPs used
                      </span>
                      <span className="font-medium" style={{ color: utilization > 80 ? "#f87171" : "var(--text-secondary)" }}>
                        {utilization}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilization > 80
                            ? "bg-gradient-to-r from-red-500 to-rose-500"
                            : utilization > 50
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                            : "bg-gradient-to-r from-emerald-500 to-green-500"
                        }`}
                        style={{ width: `${Math.max(utilization, 2)}%` }}
                      />
                    </div>
                  </div>

                  {subnet.gateway && (
                    <p className="text-[10px] mt-2 font-mono" style={{ color: "var(--text-muted)" }}>
                      Gateway: {subnet.gateway}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* IP Allocation Tab */}
      {activeTab === "ips" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search IP, name, MAC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            />
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  {["IP Address", "Device", "Type", "MAC Address", "VLAN", "Subnet"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDevicesWithIp.map((device) => (
                  <tr
                    key={device.id}
                    className="transition-colors hover:bg-[var(--bg-card-hover)]"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td className="py-3 px-4 font-mono text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {device.ip_address}
                    </td>
                    <td className="py-3 px-4 font-medium text-xs" style={{ color: "var(--text-primary)" }}>
                      {device.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                      >
                        {device.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {device.mac_address || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {(device as unknown as { vlans?: { name: string; vlan_number: number } }).vlans ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400">
                          {(device as unknown as { vlans: { vlan_number: number; name: string } }).vlans.vlan_number} — {(device as unknown as { vlans: { name: string } }).vlans.name}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {(device as unknown as { subnets?: { cidr: string } }).subnets?.cidr || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VLAN Form Modal */}
      {showVlanForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-16 pb-32">
          <div className="glass-card w-full max-w-sm p-6 mx-4 relative" style={{ background: "var(--bg-secondary)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Add VLAN</h3>
              <button onClick={() => setShowVlanForm(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>VLAN ID</label>
                <input
                  type="number"
                  value={vlanForm.vlan_number}
                  onChange={(e) => setVlanForm({ ...vlanForm, vlan_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                  placeholder="e.g. 10"
                  min={1}
                  max={4094}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Name</label>
                <input
                  type="text"
                  value={vlanForm.name}
                  onChange={(e) => setVlanForm({ ...vlanForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                  placeholder="e.g. Management"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
                <input
                  type="text"
                  value={vlanForm.description}
                  onChange={(e) => setVlanForm({ ...vlanForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div className="flex gap-2 pt-4 mt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                <button onClick={() => setShowVlanForm(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleAddVlan} disabled={!vlanForm.vlan_number || !vlanForm.name} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white disabled:opacity-50">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subnet Form Modal */}
      {showSubnetForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-16 pb-32">
          <div className="glass-card w-full max-w-sm p-6 mx-4 relative" style={{ background: "var(--bg-secondary)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>Add Subnet</h3>
              <button onClick={() => setShowSubnetForm(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>CIDR</label>
                <input
                  type="text"
                  value={subnetForm.cidr}
                  onChange={(e) => setSubnetForm({ ...subnetForm, cidr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                  placeholder="e.g. 192.168.1.0/24"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Gateway</label>
                <input
                  type="text"
                  value={subnetForm.gateway}
                  onChange={(e) => setSubnetForm({ ...subnetForm, gateway: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                  placeholder="e.g. 192.168.1.1"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
                <input
                  type="text"
                  value={subnetForm.description}
                  onChange={(e) => setSubnetForm({ ...subnetForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>VLAN</label>
                <select
                  value={subnetForm.vlan_id}
                  onChange={(e) => setSubnetForm({ ...subnetForm, vlan_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                >
                  <option value="">— No VLAN —</option>
                  {vlans.map((v) => (
                    <option key={v.id} value={v.id}>
                      VLAN {v.vlan_number} — {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4 mt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                <button onClick={() => setShowSubnetForm(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleAddSubnet} disabled={!subnetForm.cidr} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white disabled:opacity-50">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
