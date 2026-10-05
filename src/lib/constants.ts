import {
  Router,
  Network,
  Shield,
  HardDrive,
  Radio,
  Cable,
  Zap,
  Monitor,
  ArrowLeftRight,
} from "lucide-react";
import type { DeviceType, DeviceStatus, RoomType } from "@/types/network";

// ─── Device Icons (was duplicated in 5 files) ─────────────────────
export const DEVICE_ICONS: Record<DeviceType | string, React.ElementType> = {
  ROUTER: Router,
  SWITCH: Network,
  FIREWALL: Shield,
  SERVER: HardDrive,
  AP: Radio,
  PATCH_PANEL: Cable,
  UPS: Zap,
  MEDIA_CONVERTER: ArrowLeftRight,
};

export const FALLBACK_DEVICE_ICON = Monitor;

// ─── Device Types & Status Lists ──────────────────────────────────
export const DEVICE_TYPES: DeviceType[] = [
  "ROUTER", "SWITCH", "FIREWALL", "SERVER", "AP", "PATCH_PANEL", "UPS", "MEDIA_CONVERTER",
];

export const STATUS_LIST: DeviceStatus[] = [
  "ONLINE", "OFFLINE", "WARNING", "MAINTENANCE",
];

// ─── Color Tokens ─────────────────────────────────────────────────
export const STATUS_COLORS: Record<DeviceStatus | string, string> = {
  ONLINE: "#34d399",
  OFFLINE: "#f87171",
  WARNING: "#fbbf24",
  MAINTENANCE: "#a78bfa",
};

export const ROOM_COLORS: Record<RoomType | string, string> = {
  SERVER_ROOM: "border-violet-500/40 bg-violet-500/5",
  MDF: "border-blue-500/40 bg-blue-500/5",
  IDF: "border-cyan-500/40 bg-cyan-500/5",
  OFFICE: "border-slate-500/30 bg-slate-500/5",
};

// ─── Connection Edge Styles ───────────────────────────────────────
export const CONNECTION_TYPES = ["ETHERNET", "FIBER", "WIRELESS"] as const;
export type ConnectionMediaType = (typeof CONNECTION_TYPES)[number];

export function getEdgeStyle(type: string) {
  switch (type) {
    case "FIBER":
      return { stroke: "#f59e0b", strokeWidth: 3 };
    case "WIRELESS":
      return { stroke: "#a78bfa", strokeWidth: 2, strokeDasharray: "8 4" };
    default:
      return { stroke: "#3b82f6", strokeWidth: 2 };
  }
}
