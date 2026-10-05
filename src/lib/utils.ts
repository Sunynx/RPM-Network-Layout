import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: string) {
  switch (status) {
    case "ONLINE":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "OFFLINE":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "WARNING":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "MAINTENANCE":
      return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function getStatusDot(status: string) {
  switch (status) {
    case "ONLINE":
      return "bg-emerald-400";
    case "OFFLINE":
      return "bg-red-400";
    case "WARNING":
      return "bg-amber-400";
    case "MAINTENANCE":
      return "bg-purple-400";
    default:
      return "bg-gray-400";
  }
}

export function getDeviceColor(type: string) {
  switch (type) {
    case "ROUTER":
      return { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400", gradient: "from-blue-500/20 to-blue-600/20" };
    case "SWITCH":
      return { bg: "bg-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-400", gradient: "from-cyan-500/20 to-cyan-600/20" };
    case "FIREWALL":
      return { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-400", gradient: "from-orange-500/20 to-orange-600/20" };
    case "SERVER":
      return { bg: "bg-violet-500/20", border: "border-violet-500/40", text: "text-violet-400", gradient: "from-violet-500/20 to-violet-600/20" };
    case "AP":
      return { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-400", gradient: "from-green-500/20 to-green-600/20" };
    case "PATCH_PANEL":
      return { bg: "bg-slate-500/20", border: "border-slate-500/40", text: "text-slate-400", gradient: "from-slate-500/20 to-slate-600/20" };
    case "UPS":
      return { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400", gradient: "from-yellow-500/20 to-yellow-600/20" };
    default:
      return { bg: "bg-gray-500/20", border: "border-gray-500/40", text: "text-gray-400", gradient: "from-gray-500/20 to-gray-600/20" };
  }
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMacAddress(mac: string | null | undefined): string {
  if (!mac) return "";
  // Remove all non-hex characters
  const clean = mac.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  // Group into pairs and join with colon
  return clean.match(/.{1,2}/g)?.join(":") || mac;
}
