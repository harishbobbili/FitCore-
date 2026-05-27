"use client";

import React from "react";
import GlassCard from "@/components/ui/GlassCard";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { useProfile } from "@/hooks/useProfile";
import { Flame, TrendingDown, Target } from "lucide-react";
import { motion } from "framer-motion";
import SkeletonCard from "@/components/ui/SkeletonCard";

export const DeficitTrackerCard: React.FC = () => {
  const { currentWeight, loading: metricsLoading } = useBodyMetrics();
  const { profile, loading: profileLoading } = useProfile();

  if (metricsLoading || profileLoading || !profile) {
    return <SkeletonCard className="h-full min-h-[220px]" />;
  }

  const startingWeight = Math.max(currentWeight + 4, currentWeight);
  const maintenance = profile.maintenance_kcal ?? 2200;
  const targetCal = profile.target_kcal ?? 1800;
  const dailyDeficit = maintenance - targetCal;
  const weeklyDeficit = dailyDeficit * 7;
  const estWeeklyFatLoss = Number((weeklyDeficit / 7700).toFixed(2));
  const absTargetWeight = Math.max(currentWeight - 5, 50);

  const totalLossNeeded = startingWeight - absTargetWeight;
  const currentLoss = startingWeight - currentWeight;
  const progressPercent = totalLossNeeded > 0
    ? Math.min(Math.max((currentLoss / totalLossNeeded) * 100, 0), 100)
    : 0;

  return (
    <GlassCard className="h-full min-h-[220px]" hoverable>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* Left Column: Caloric Deficit details */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-neonCyan" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Deficit Tracker</h3>
            </div>
            <p className="text-xs text-white/50">
              Your caloric deficit is optimized for safe fat loss while retaining lean muscle.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
            <div>
              <span className="text-[10px] text-white/40 block uppercase tracking-wider">Daily Deficit</span>
              <span className="text-lg font-extrabold text-neonCyan font-mono">-{dailyDeficit} <span className="text-xs font-normal text-white/50">kcal</span></span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block uppercase tracking-wider">Weekly Deficit</span>
              <span className="text-lg font-extrabold text-neonCyan font-mono">-{weeklyDeficit} <span className="text-xs font-normal text-white/50">kcal</span></span>
            </div>
            <div className="col-span-2 border-t border-white/5 pt-2 mt-1 flex items-center justify-between">
              <span className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-400" /> Est. Fat Loss
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ~{estWeeklyFatLoss} kg / wk
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-white/40 border-t border-white/5 pt-2">
            <span>Maintenance: <strong className="text-white font-mono">{maintenance} kcal</strong></span>
            <span>Target: <strong className="text-neonCyan font-mono">{targetCal} kcal</strong></span>
          </div>
        </div>

        {/* Right Column: Weight Goal Progress */}
        <div className="flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-neonPurple" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weight Goal Progress</h3>
            </div>
            <p className="text-xs text-white/50">
              Tracking your progress down to target for visible abs.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* Weight labels */}
            <div className="flex justify-between text-xs font-semibold">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Start</span>
                <span className="text-white font-mono">{startingWeight} kg</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-neonCyan uppercase tracking-wider">Current</span>
                <span className="text-neonCyan font-mono text-sm">{currentWeight} kg</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-neonPurple uppercase tracking-wider">Goal</span>
                <span className="text-neonPurple font-mono">{absTargetWeight} kg</span>
              </div>
            </div>

            {/* Custom progress bar */}
            <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden mt-1 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-neonCyan to-neonPurple rounded-full shadow-neon-cyan"
              />
            </div>

            {/* Remaining loss text */}
            <div className="flex justify-between text-[10px] text-white/30 font-mono mt-0.5">
              <span>Lost: {(startingWeight - currentWeight).toFixed(1)} kg</span>
              <span>Remaining: {Math.max(0, currentWeight - absTargetWeight).toFixed(1)} kg</span>
            </div>
          </div>

          <div className="text-xs text-center text-white/40 border-t border-white/5 pt-2">
            Progress Score: <strong className="text-white font-mono">{progressPercent.toFixed(0)}%</strong> of target reached
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default DeficitTrackerCard;
