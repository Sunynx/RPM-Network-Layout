"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "text-emerald-400" },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "text-red-400" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "text-amber-400" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss
      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type];
          const colors = TOAST_COLORS[toast.type];

          return (
            <div
              key={toast.id}
              className={`toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-[420px] ${colors.bg} ${colors.border}`}
              style={{ background: "rgba(15, 23, 42, 0.95)" }}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${colors.icon}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
