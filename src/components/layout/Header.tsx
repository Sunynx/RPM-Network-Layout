"use client";

import { Search, Sun, Moon, Command, Menu } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export default function Header({ onMobileMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="h-16 flex items-center gap-4 px-4 lg:px-6 border-b sticky top-0 z-30 backdrop-blur-xl"
      style={{
        background: theme === "dark" ? "rgba(10, 14, 26, 0.8)" : "rgba(248, 250, 252, 0.8)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Mobile Menu Toggle */}
      {onMobileMenuClick && (
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-500/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      {/* Search — triggers Command Palette via Ctrl+K */}
      <button
        onClick={() => {
          // Dispatch Ctrl+K to open CommandPalette
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        }}
        className="relative flex-1 max-w-md group cursor-pointer"
      >
        <div
          className="flex items-center gap-3 w-full pl-4 pr-3 py-2.5 rounded-xl text-sm transition-all group-hover:ring-2 group-hover:ring-blue-500/30"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <Search
            className="w-4 h-4 shrink-0"
            style={{ color: "var(--text-muted)" }}
          />
          <span
            className="flex-1 text-left text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            ค้นหาอุปกรณ์, IP, VLAN...
          </span>
          <kbd
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border"
            style={{
              color: "var(--text-muted)",
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <Command className="w-3 h-3" />K
          </kbd>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl transition-all hover:scale-105"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4.5 h-4.5" />
          ) : (
            <Moon className="w-4.5 h-4.5" />
          )}
        </button>
      </div>
    </header>
  );
}
