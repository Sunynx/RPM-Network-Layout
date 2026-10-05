"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Network,
  Monitor,
  Server,
  Map,
  Globe,
  ArrowRight,
  Command,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEVICE_ICONS, FALLBACK_DEVICE_ICON } from "@/lib/constants";
import type { Device } from "@/types/network";

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

const NAV_ITEMS: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", sublabel: "หน้าหลัก", icon: LayoutDashboard, action: () => {}, category: "Navigation" },
  { id: "nav-topology", label: "Network Topology", sublabel: "แผนผังเครือข่าย", icon: Network, action: () => {}, category: "Navigation" },
  { id: "nav-devices", label: "Devices", sublabel: "จัดการอุปกรณ์", icon: Monitor, action: () => {}, category: "Navigation" },
  { id: "nav-rack", label: "Rack View", sublabel: "มุมมองตู้ Rack", icon: Server, action: () => {}, category: "Navigation" },
  { id: "nav-floor-plan", label: "Floor Plan", sublabel: "แผนผังชั้น", icon: Map, action: () => {}, category: "Navigation" },
  { id: "nav-ipam", label: "IPAM", sublabel: "จัดการ IP / VLAN", icon: Globe, action: () => {}, category: "Navigation" },
];

const NAV_PATHS: Record<string, string> = {
  "nav-dashboard": "/",
  "nav-topology": "/topology",
  "nav-devices": "/devices",
  "nav-rack": "/rack",
  "nav-floor-plan": "/floor-plan",
  "nav-ipam": "/ipam",
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [devices, setDevices] = useState<Device[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchDevices() {
      const supabase = createClient();
      const { data, error } = await supabase.from("devices").select("id, name, type, ip_address, mac_address, status");
      if (!error && data) {
        setDevices(data as Device[]);
      }
    }
    fetchDevices();
  }, [isOpen]);

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navigate = useCallback((path: string) => {
    setIsOpen(false);
    router.push(path);
  }, [router]);

  const allItems = useMemo(() => {
    const navItems: CommandItem[] = NAV_ITEMS.map((item) => ({
      ...item,
      action: () => navigate(NAV_PATHS[item.id]),
    }));

    const deviceItems: CommandItem[] = devices.map((d) => ({
      id: `device-${d.id}`,
      label: d.name,
      sublabel: `${d.ip_address || "No IP"} · ${d.type}`,
      icon: DEVICE_ICONS[d.type] || FALLBACK_DEVICE_ICON,
      action: () => navigate("/devices"),
      category: "Devices",
    }));

    return [...navItems, ...deviceItems];
  }, [devices, navigate]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12);
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel?.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [query, allItems]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      }
    },
    [filtered, selectedIndex]
  );

  if (!isOpen) return null;

  // Group by category
  const grouped: Record<string, CommandItem[]> = {};
  filtered.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] cmd-overlay"
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl border overflow-hidden cmd-modal shadow-2xl"
        style={{
          background: "rgba(15, 23, 42, 0.98)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ค้นหาอุปกรณ์, IP, หน้า..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
          />
          <kbd className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 border border-slate-700 bg-slate-800">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {category}
              </p>
              {items.map((item) => {
                flatIndex++;
                const isSelected = flatIndex === selectedIndex;
                const Icon = item.icon;
                const currentIndex = flatIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-blue-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-blue-500/20" : "bg-white/5"
                    }`}>
                      <Icon className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {item.label}
                      </p>
                      {item.sublabel && (
                        <p className="text-[11px] text-slate-500 truncate">{item.sublabel}</p>
                      )}
                    </div>
                    {isSelected && <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t text-[11px] text-slate-600" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[10px]">↑↓</kbd> เลือก</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[10px]">↵</kbd> เปิด</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-[10px]">Esc</kbd> ปิด</span>
        </div>
      </div>
    </div>
  );
}
