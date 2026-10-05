"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Router,
  Network,
  Shield,
  HardDrive,
  Radio,
  Cable,
  Zap,
  Monitor,
} from "lucide-react";
import type { Device } from "@/types/network";
import { DEVICE_ICONS, FALLBACK_DEVICE_ICON } from "@/lib/constants";
import { getDeviceColor, getStatusDot } from "@/lib/utils";

function DeviceNodeComponent({ data, selected }: NodeProps) {
  const device = data.device as Device;
  const activeVlanId = data.activeVlanId as string | null;
  const Icon = DEVICE_ICONS[device.type] || FALLBACK_DEVICE_ICON;
  const colors = getDeviceColor(device.type);
  const statusDot = getStatusDot(device.status);
  const isOnline = device.status === "ONLINE";
  
  const isDimmed = activeVlanId && device.vlan_id && device.vlan_id !== activeVlanId;

  return (
    <>
      <Handle id="top-target" type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-400 !border-0" />
      <Handle id="top-source" type="source" position={Position.Top} className="!w-2 !h-2 !bg-transparent !border-0" />
      
      <Handle id="right-target" type="target" position={Position.Right} className="!w-2 !h-2 !bg-blue-400 !border-0" />
      <Handle id="right-source" type="source" position={Position.Right} className="!w-2 !h-2 !bg-transparent !border-0" />
      
      <Handle id="left-target" type="target" position={Position.Left} className="!w-2 !h-2 !bg-blue-400 !border-0" />
      <Handle id="left-source" type="source" position={Position.Left} className="!w-2 !h-2 !bg-transparent !border-0" />
      
      <div
        className={`px-4 py-3 rounded-xl border backdrop-blur-xl transition-all cursor-pointer min-w-[200px] overflow-hidden relative group ${
          selected ? "ring-2 ring-blue-500/80 scale-105" : "hover:border-slate-500/50"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
          borderColor: "rgba(255, 255, 255, 0.1)",
          boxShadow: selected
            ? "0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 0 1px rgba(255,255,255,0.1)"
            : "0 4px 15px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.05)",
          opacity: isDimmed ? 0.3 : 1,
        }}
      >
        {/* Glow effect based on status */}
        <div 
          className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${isOnline ? '#10b981' : '#ef4444'} 0%, transparent 50%)`
          }}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg shadow-black/20 shrink-0 relative`}
          >
            <Icon className={`w-5 h-5 ${colors.text}`} />
            {device.vlan_id && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow shadow-black/50 border border-white/20">
                VLAN
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                {isOnline && <div className={`absolute inset-0 rounded-full ${statusDot} animate-ping opacity-75`} />}
              </div>
              <p
                className="text-sm font-semibold truncate tracking-tight text-white"
              >
                {device.name}
              </p>
            </div>
            
            <div className="flex flex-col mt-1 gap-0.5">
              <p className="text-[11px] font-mono text-slate-400 truncate flex items-center justify-between">
                <span>{device.ip_address || "No IP"}</span>
                <span className="text-[9px] opacity-70 ml-2">{device.brand || "Unknown"}</span>
              </p>
              {device.mac_address && (
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  {device.mac_address}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Handle id="bottom-target" type="target" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-400 !border-0" />
      <Handle id="bottom-source" type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-transparent !border-0" />
    </>
  );
}

export default memo(DeviceNodeComponent);
