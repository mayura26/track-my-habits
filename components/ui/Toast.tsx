"use client";

import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface ToastData {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="h-4 w-4 text-green-400" />,
  error: <AlertCircle className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
};

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgba(216,196,160,0.16)] bg-[rgba(18,25,22,0.96)] px-4 py-3 shadow-lg animate-in slide-in-from-right-5">
      {icons[toast.type ?? "info"]}
      <p className="flex-1 text-sm text-[#f7f0e1]">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-[#b4a58a] hover:text-[#f7f0e1]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed right-4 z-50 flex max-w-sm w-full flex-col gap-2 bottom-[calc(12rem+env(safe-area-inset-bottom,0px))] md:bottom-4">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: ToastData["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismiss };
}
