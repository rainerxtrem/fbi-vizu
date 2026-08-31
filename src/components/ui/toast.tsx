"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastCtx = createContext<{
  toast: (kind: ToastKind, message: string) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-lg",
                t.kind === "success" && "border-emerald-200",
                t.kind === "error" && "border-red-200",
                t.kind === "info" && "border-navy-200",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  t.kind === "success" && "text-emerald-600",
                  t.kind === "error" && "text-red-600",
                  t.kind === "info" && "text-navy-600",
                )}
              />
              <p className="flex-1 text-navy-800">{t.message}</p>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="text-navy-400 hover:text-navy-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
