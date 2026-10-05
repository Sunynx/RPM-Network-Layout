"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  ChevronDown,
  Router,
  Network,
  Shield,
  HardDrive,
  Radio,
  Cable,
  Zap,
  Monitor,
  Wifi,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Device, Floor, Room, Site, Connection } from "@/types/network";
import { getStatusDot, getDeviceColor } from "@/lib/utils";

const DEVICE_ICONS: Record<string, React.ElementType> = {
  ROUTER: Router,
  SWITCH: Network,
  FIREWALL: Shield,
  SERVER: HardDrive,
  AP: Radio,
  PATCH_PANEL: Cable,
  UPS: Zap,
};

const ROOM_COLORS: Record<string, string> = {
  SERVER_ROOM: "border-violet-500/40 bg-violet-500/5",
  MDF: "border-blue-500/40 bg-blue-500/5",
  IDF: "border-cyan-500/40 bg-cyan-500/5",
  OFFICE: "border-slate-500/30 bg-slate-500/5",
};

export default function FloorPlanPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<Device | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'ROOM' | 'DEVICE'; offsetX: number; offsetY: number } | null>(null);

  function handleDragStart(e: React.DragEvent, id: string, type: 'ROOM' | 'DEVICE') {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem({ id, type, offsetX, offsetY });
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - draggedItem.offsetX);
    const y = Math.max(0, e.clientY - rect.top - draggedItem.offsetY);

    const supabase = createClient();
    try {
      if (draggedItem.type === 'ROOM') {
        setRooms(r => r.map(rm => rm.id === draggedItem.id ? { ...rm, pos_x: Math.round(x), pos_y: Math.round(y) } : rm));
        await supabase.from("rooms").update({ pos_x: Math.round(x), pos_y: Math.round(y) }).eq("id", draggedItem.id);
      } else {
        setDevices(d => d.map(dev => dev.id === draggedItem.id ? { ...dev, pos_x: Math.round(x), pos_y: Math.round(y) } : dev));
        await supabase.from("devices").update({ pos_x: Math.round(x), pos_y: Math.round(y) }).eq("id", draggedItem.id);
      }
    } catch (err) {
      console.error("Drop save error:", err);
    }
    setDraggedItem(null);
  }

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchData() {
      try {
        const [{ data: siteData }, { data: floorData }, { data: roomData }, { data: deviceData }, { data: connData }] =
          await Promise.all([
            supabase.from("sites").select("*"),
            supabase.from("floors").select("*").order("name"),
            supabase.from("rooms").select("*"),
            supabase.from("devices").select("*"),
            supabase.from("connections").select("*"),
          ]);

        if (!isMounted) return;

        setSites((siteData || []) as Site[]);
        setConnections((connData || []) as Connection[]);
        
        const f = (floorData || []) as Floor[];
        setFloors(f);
        if (f.length > 0 && !selectedFloor) {
          setSelectedFloor(f[0].id);
        }

        setRooms((roomData || []) as Room[]);
        setDevices((deviceData || []) as Device[]);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    const channel = supabase
      .channel('floor_plan_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => fetchData())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [selectedFloor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentFloor = floors.find((f) => f.id === selectedFloor);
  const floorRooms = rooms.filter((r) => r.floor_id === selectedFloor);
  const floorDevices = devices.filter((d) => d.floor_id === selectedFloor);
  const apDevices = floorDevices.filter((d) => d.type === "AP");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Floor Plan
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {sites[0]?.name || "แผนผังชั้น"} — ดูจุดติดตั้ง AP และอุปกรณ์ตามชั้น
          </p>
        </div>

        {/* Floor selector */}
        <div className="relative">
          <select
            value={selectedFloor || ""}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="px-4 py-2.5 pr-8 rounded-xl text-sm font-medium outline-none appearance-none"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
            }}
          >
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>

      {/* Floor Plan Canvas */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {currentFloor?.name || "Floor Plan"}
          </h3>
          <div className="flex items-center gap-4 text-xs">
            {Object.entries(ROOM_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded border ${colors}`} />
                <span style={{ color: "var(--text-muted)" }}>{type.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative rounded-xl border min-h-[600px] overflow-hidden"
          style={{
            backgroundColor: "#0a0f1c", // Dark blueprint base
            backgroundImage: "linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            borderColor: "var(--border-color)",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Physical Cables Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {connections.map(conn => {
              const fromDev = devices.find(d => d.id === conn.from_device_id);
              const toDev = devices.find(d => d.id === conn.to_device_id);
              
              if (!fromDev || !toDev) return null;
              
              // Calculate center points of devices
              // Assuming APs are 120x120 centered at pos_x, pos_y. Room devices are approx 20x20 relative to room.
              // To make lines accurate across the whole floor plan, we calculate absolute coordinates.
              const getAbsPos = (d: Device) => {
                let x = d.pos_x || 0;
                let y = d.pos_y || 0;
                if (d.room_id) {
                  const room = floorRooms.find(r => r.id === d.room_id);
                  if (room) {
                    x += room.pos_x || 0;
                    y += room.pos_y || 0;
                  }
                }
                return { x, y };
              };

              const p1 = getAbsPos(fromDev);
              const p2 = getAbsPos(toDev);

              const isFiber = conn.type === "FIBER";
              const strokeColor = isFiber ? "#f59e0b" : "#3b82f6";

              return (
                <line 
                  key={conn.id} 
                  x1={p1.x} 
                  y1={p1.y} 
                  x2={p2.x} 
                  y2={p2.y} 
                  stroke={strokeColor}
                  strokeWidth="2"
                  strokeDasharray={isFiber ? "none" : "4 2"}
                  opacity="0.6"
                />
              );
            })}
          </svg>

          {/* Rooms */}
          {floorRooms.map((room) => {
            const roomColor = ROOM_COLORS[room.type] || ROOM_COLORS.OFFICE;
            const roomDevices = devices.filter((d) => d.room_id === room.id);

            return (
              <div
                key={room.id}
                draggable
                onDragStart={(e) => handleDragStart(e, room.id, 'ROOM')}
                className={`absolute rounded-xl border-2 border-dashed ${roomColor} p-3 transition-all hover:brightness-110 cursor-move`}
                style={{
                  left: `${room.pos_x}px`,
                  top: `${room.pos_y}px`,
                  width: `${room.width}px`,
                  height: `${room.height}px`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    {room.name}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
                  >
                    {room.type.replace("_", " ")}
                  </span>
                </div>

                {/* Devices in room */}
                <div className="flex flex-wrap gap-1">
                  {roomDevices.map((device) => {
                    const Icon = DEVICE_ICONS[device.type] || Monitor;
                    const colors = getDeviceColor(device.type);
                    const statusDot = getStatusDot(device.status);

                    return (
                      <div
                        key={device.id}
                        className={`flex items-center gap-1 px-1.5 py-1 rounded-md border cursor-pointer transition-all hover:scale-105 ${colors.bg} ${colors.border}`}
                        onMouseEnter={() => setHoveredDevice(device)}
                        onMouseLeave={() => setHoveredDevice(null)}
                      >
                        <Icon className={`w-3 h-3 ${colors.text}`} />
                        <span className="text-[9px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {device.name}
                        </span>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${statusDot} ${
                            device.status === "ONLINE" ? "status-pulse" : ""
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* APs with coverage circles (not in rooms) */}
          {apDevices
            .filter((d) => !d.room_id)
            .map((ap) => {
              const statusDot = getStatusDot(ap.status);
              return (
                <div
                  key={ap.id}
                  className="absolute cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, ap.id, 'DEVICE')}
                  style={{
                    left: `${ap.pos_x}px`,
                    top: `${ap.pos_y}px`,
                  }}
                >
                  {/* Coverage circle */}
                  <div
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed ${
                      ap.status === "ONLINE"
                        ? "border-green-400/20 bg-green-400/5"
                        : "border-red-400/20 bg-red-400/5"
                    }`}
                    style={{ width: "120px", height: "120px" }}
                  />
                  {/* AP icon */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer"
                    onMouseEnter={() => setHoveredDevice(ap)}
                    onMouseLeave={() => setHoveredDevice(null)}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                      <Wifi className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                      <span className="text-[9px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {ap.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Hover tooltip - Richer details */}
          {hoveredDevice && (
            <div
              className="fixed z-50 glass-card p-4 text-xs pointer-events-none animate-fade-in shadow-2xl border border-blue-500/30"
              style={{
                left: "50%",
                bottom: "30px",
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.95)",
                backdropFilter: "blur(12px)",
                minWidth: "250px"
              }}
            >
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/10">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getDeviceColor(hoveredDevice.type).bg}`}>
                  {(() => {
                    const Icon = DEVICE_ICONS[hoveredDevice.type] || Monitor;
                    return <Icon className={`w-4 h-4 ${getDeviceColor(hoveredDevice.type).text}`} />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {hoveredDevice.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getStatusDot(hoveredDevice.status)} text-white`}>
                      {hoveredDevice.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{hoveredDevice.brand} {hoveredDevice.model}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] mt-3">
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase text-[9px] tracking-wider mb-0.5">IP Address</span>
                  <span className="text-blue-400 font-mono">{hoveredDevice.ip_address || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 uppercase text-[9px] tracking-wider mb-0.5">MAC Address</span>
                  <span className="text-slate-300 font-mono">{hoveredDevice.mac_address || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
