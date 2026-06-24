"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type { BadgeDefinition } from "@/lib/types";

export default function AchievementUnlockOverlay() {
  const [badge, setBadge] = useState<BadgeDefinition | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      setBadge((event as CustomEvent<BadgeDefinition>).detail);
      window.setTimeout(() => setBadge(null), 4000);
    };

    window.addEventListener("fitcore:achievement-unlocked", handler as EventListener);
    return () => window.removeEventListener("fitcore:achievement-unlocked", handler as EventListener);
  }, []);

  useEffect(() => {
    if (!badge) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBadge(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [badge]);

  return (
    <AnimatePresence>
      {badge ? (
        <motion.div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.5, y: 20 }} animate={{ scale: [0.5, 1.15, 1], y: 0 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 180, damping: 12 }} className="relative rounded-3xl border border-neonPurple/30 bg-[#11111A] px-8 py-10 text-center shadow-[0_0_40px_rgba(108,99,255,0.4)]">
            <button
              onClick={() => setBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neonPurple/15 text-4xl shadow-[0_0_20px_rgba(108,99,255,0.4)]">{badge.icon ?? "✨"}</div>
            <div className="text-xs uppercase tracking-[0.4em] text-white/40">Achievement Unlocked!</div>
            <h3 className="mt-2 text-2xl font-bold text-white">{badge.title}</h3>
            <p className="mt-2 max-w-xs text-sm text-white/70">{badge.description}</p>
            <Sparkles className="mx-auto mt-4 h-5 w-5 text-neonCyan" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              {Array.from({ length: 20 }).map((_, index) => (
                <motion.span
                  key={index}
                  className="absolute left-1/2 top-1/2 block h-2 w-2 rounded-full bg-white"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((index / 20) * Math.PI * 2) * (60 + (index % 3) * 18),
                    y: Math.sin((index / 20) * Math.PI * 2) * (60 + (index % 3) * 18),
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}