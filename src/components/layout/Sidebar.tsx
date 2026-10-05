"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Network,
  Server,
  Map,
  Globe,
  Monitor,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topology", label: "Network Topology", icon: Network },
  { href: "/devices", label: "Devices", icon: Monitor },
  { href: "/rack", label: "Rack View", icon: Server },
  { href: "/floor-plan", label: "Floor Plan", icon: Map },
  { href: "/ipam", label: "IPAM", icon: Globe },
  { href: "/logs", label: "Logs & Alarms", icon: AlertTriangle },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !collapsed || isHovered;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => collapsed && setIsHovered(true)}
        onMouseLeave={() => collapsed && setIsHovered(false)}
        className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded ? "w-[260px]" : "w-[72px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-white" />
            </div>
            {isExpanded && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
                  RPM Network
                </h1>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Layout Dashboard
                </p>
              </div>
            )}
          </div>
          
          {/* Mobile close button */}
          <button 
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                title={!isExpanded ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {isExpanded && <span className="whitespace-nowrap overflow-hidden transition-all duration-300">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden lg:block px-3 py-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-link w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
