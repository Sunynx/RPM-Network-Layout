"use client";

import { Search, Filter, Plus, Upload, Download, Cloud, Loader2 } from "lucide-react";
import { DEVICE_TYPES, STATUS_LIST } from "@/lib/constants";
import type { DeviceType, DeviceStatus } from "@/types/network";

interface DeviceToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onAdd: () => void;
  onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCSV: () => void;
  onSyncRuijie: () => void;
  syncingRuijie: boolean;
}

export default function DeviceToolbar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onAdd,
  onImportCSV,
  onExportCSV,
  onSyncRuijie,
  syncingRuijie,
}: DeviceToolbarProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between glass-card p-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-3xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อ, IP, MAC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[140px]">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-9 pr-8 py-2.5 w-full rounded-xl text-sm border outline-none appearance-none"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            >
              <option value="ALL">ทุกประเภท (Type)</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2.5 w-full rounded-xl text-sm border outline-none appearance-none"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            >
              <option value="ALL">ทุกสถานะ (Status)</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">นำเข้า CSV</span>
          <input type="file" accept=".csv" className="hidden" onChange={onImportCSV} />
        </label>
        
        <button onClick={onExportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border hover:bg-[var(--bg-secondary)] transition-colors" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">ส่งออก CSV</span>
        </button>

        <button
          onClick={onSyncRuijie}
          disabled={syncingRuijie}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
        >
          {syncingRuijie ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
          <span className="hidden sm:inline">Sync Ruijie</span>
        </button>

        <button onClick={onAdd} className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-lg shadow-blue-500/20">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
