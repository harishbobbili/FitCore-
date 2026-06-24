"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { HistoricalSet } from "../WorkoutSessionManager";

interface PRBadgeProps {
  set: HistoricalSet;
  index: number;
}

export function PRBadge({ set, index }: PRBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neonPurple/20 border border-neonPurple/40 text-xs font-semibold text-neonPurple"
    >
      <Trophy className="w-3.5 h-3.5" />
      <span>PR: {set.exercise_name} — {set.weight_kg}kg × {set.reps}</span>
    </motion.div>
  );
}

interface WorkoutSummaryPanelProps {
  duration: number;
  volume: number;
  prs: HistoricalSet[];
  exerciseCount: number;
  setCount: number;
}

export function WorkoutSummaryPanel({ duration, volume, prs, exerciseCount, setCount }: WorkoutSummaryPanelProps) {
  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-neonCyan" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Session Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-2xl font-bold text-neonCyan font-mono">{duration}</div>
          <div className="text-xs text-white/50 mt-1">Minutes</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-2xl font-bold text-neonPurple font-mono">{volume.toLocaleString()}</div>
          <div className="text-xs text-white/50 mt-1">Total Volume (kg)</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-2xl font-bold text-white font-mono">{exerciseCount}</div>
          <div className="text-xs text-white/50 mt-1">Exercises</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-2xl font-bold text-white font-mono">{setCount}</div>
          <div className="text-xs text-white/50 mt-1">Sets</div>
        </div>
      </div>

      <AnimatePresence>
        {prs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Personal Records</h4>
            <div className="flex flex-wrap gap-2">
              {prs.map((pr, i) => (
                <PRBadge key={pr.id} set={pr} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
