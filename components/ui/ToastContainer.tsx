"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const activeKeysRef = useRef(new Set<string>());
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => {
      const toast = current.find((item) => item.id === id);
      if (toast) {
        activeKeysRef.current.delete(`${toast.kind}:${toast.message}`);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    const activeKeys = activeKeysRef.current;

    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; kind?: ToastKind }>;
      const message = customEvent.detail.message;
      const kind = customEvent.detail.kind ?? "info";
      const key = `${kind}:${message}`;

      if (!message || activeKeys.has(key)) {
        return;
      }

      const id = crypto.randomUUID();
      activeKeys.add(key);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, durations[kind]);
      timers.set(id, timer);

      setToasts((current) => {
        const next = [...current, { id, message, kind }];
        const overflow = next.slice(0, Math.max(0, next.length - 3));
        for (const toast of overflow) {
          activeKeys.delete(`${toast.kind}:${toast.message}`);
          const overflowTimer = timers.get(toast.id);
          if (overflowTimer) {
            clearTimeout(overflowTimer);
            timers.delete(toast.id);
          }
        }

        return next.slice(-3);
      });
    };

    window.addEventListener("fitcore:toast", handleToast as EventListener);
    return () => {
      window.removeEventListener("fitcore:toast", handleToast as EventListener);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      activeKeys.clear();
    };
  }, [dismissToast]);

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
              onClick={() => dismissToast(toast.id)}
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
