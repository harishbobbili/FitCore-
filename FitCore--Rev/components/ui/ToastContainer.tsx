"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type ToastKind = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

const durations: Record<ToastKind, number> = {
  success: 3000,
  info: 4000,
  warning: 4500,
  error: 5000,
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; kind?: ToastKind }>;
      const message = customEvent.detail.message;
      const kind = customEvent.detail.kind ?? "info";

      setToasts((current) => {
        if (current.some((toast) => toast.message === message)) {
          return current;
        }

        const next = [...current, { id: crypto.randomUUID(), message, kind }];
        // Keep only the 3 most recent toasts
        return next.slice(-3);
      });
    };

    window.addEventListener("fitcore:toast", handleToast as EventListener);
    return () => window.removeEventListener("fitcore:toast", handleToast as EventListener);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, durations[toast.kind])
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts]);

  const styles = useMemo(
    () => ({
      success: "border-l-4 border-l-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      error: "border-l-4 border-l-rose-500 border-rose-500/30 bg-rose-500/10 text-rose-200",
      warning: "border-l-4 border-l-amber-500 border-amber-500/30 bg-amber-500/10 text-amber-200",
      info: "border-l-4 border-l-sky-500 border-sky-500/30 bg-sky-500/10 text-sky-200",
    }),
    []
  );

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border backdrop-blur-xl px-4 py-3 shadow-2xl ${styles[toast.kind]}`}
          >
            <div className="text-sm font-medium leading-5">{toast.message}</div>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}