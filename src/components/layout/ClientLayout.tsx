"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import CommandPalette from "@/components/command-palette/CommandPalette";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const isTopology = pathname === "/topology";

  // Close mobile sidebar when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar 
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
          <div 
            className={`flex-1 transition-all w-full max-w-full min-w-0 overflow-x-hidden duration-300 flex flex-col min-h-screen ${
              collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
            }`}
          >
            <Header onMobileMenuClick={() => setMobileOpen(true)} />
            <main className={`flex-1 ${isTopology ? "p-0" : "p-4 lg:p-6"}`} style={{ background: "var(--bg-primary)" }}>
              {children}
            </main>
          </div>
        </div>
        <CommandPalette />
      </ToastProvider>
    </ThemeProvider>
  );
}
