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

  const maintenance = profile.maintenance_kcal ?? 0;
  const targetCal = profile.target_kcal ?? 0;

  // Only show a deficit if both values are set and make sense
  const dailyDeficit = maintenance > 0 && targetCal > 0
    ? Math.max(0, maintenance - targetCal)
    : null;
  const weeklyDeficit = dailyDeficit != null ? dailyDeficit * 7 : null;

  // ~7700 kcal deficit ≈ 1 kg of fat
  const estWeeklyFatLoss = weeklyDeficit != null
    ? Number((weeklyDeficit / 7700).toFixed(2))
    : null;

  // Goal weight: use profile goal if available, else use a conservative estimate
  // No magic hardcoded -5 kg — we don't know the user's goal weight without asking
  const goalWeight = profile.goal === "fat_loss" && currentWeight > 0
    ? Math.max(currentWeight - 10, 40) // up to 10 kg below current, floor at 40 kg
    : currentWeight; // for non-fat-loss goals, show current as target

  const startingWeight = currentWeight > 0 ? currentWeight : goalWeight;
  const totalLossNeeded = startingWeight - goalWeight;
  const progressPercent = totalLossNeeded > 0
    ? Math.min(100, Math.max(0, ((startingWeight - currentWeight) / totalLossNeeded) * 100))
    : 100; // already at or past goal

  const hasDeficitData = dailyDeficit != null && dailyDeficit > 0;

  return (
    <GlassCard className="h-full min-h-[220px]" hoverable>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* Left Column: Caloric Deficit */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-neonCyan" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Deficit Tracker</h3>
            </div>
            <p className="text-xs text-white/50">
              {hasDeficitData
                ? "Your calorie deficit is set for safe, sustainable fat loss."
                : "Set your maintenance and target calories in Profile to see deficit stats."}
            </p>
          </div>

          {hasDeficitData ? (
            <div className="grid grid-cols-2 gap-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
              <div>
                <span className="text-[10px] text-white/40 block uppercase tracking-wider">Daily Deficit</span>
                <span className="text-lg font-extrabold text-neonCyan font-mono">
                  -{dailyDeficit} <span className="text-xs font-normal text-white/50">kcal</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/40 block uppercase tracking-wider">Weekly Deficit</span>
                <span className="text-lg font-extrabold text-neonCyan font-mono">
                  -{weeklyDeficit} <span className="text-xs font-normal text-white/50">kcal</span>
                </span>
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
          ) : (
            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-center text-xs text-white/30">
              Go to <span className="text-neonCyan">Profile</span> → Daily Targets to configure
            </div>
          )}

          {maintenance > 0 && targetCal > 0 && (
            <div className="flex justify-between items-center text-xs text-white/40 border-t border-white/5 pt-2">
              <span>Maintenance: <strong className="text-white font-mono">{maintenance} kcal</strong></span>
              <span>Target: <strong className="text-neonCyan font-mono">{targetCal} kcal</strong></span>
            </div>
          )}
        </div>

        {/* Right Column: Weight Goal */}
        <div className="flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-neonPurple" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weight Goal</h3>
            </div>
            <p className="text-xs text-white/50">
              Tracking your progress toward your target weight.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Start</span>
                <span className="text-white font-mono">{startingWeight > 0 ? `${startingWeight} kg` : "—"}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-neonCyan uppercase tracking-wider">Current</span>
                <span className="text-neonCyan font-mono text-sm">{currentWeight > 0 ? `${currentWeight} kg` : "—"}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-neonPurple uppercase tracking-wider">Goal</span>
                <span className="text-neonPurple font-mono">{goalWeight > 0 ? `${goalWeight} kg` : "—"}</span>
              </div>
            </div>

            <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden mt-1 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-neonCyan to-neonPurple rounded-full shadow-neon-cyan"
              />
            </div>

            <div className="flex justify-between text-[10px] text-white/30 font-mono mt-0.5">
              <span>Lost: {currentWeight > 0 ? `${Math.max(0, startingWeight - currentWeight).toFixed(1)} kg` : "—"}</span>
              <span>Remaining: {currentWeight > 0 && goalWeight > 0 ? `${Math.max(0, currentWeight - goalWeight).toFixed(1)} kg` : "—"}</span>
            </div>
          </div>

          <div className="text-xs text-center text-white/40 border-t border-white/5 pt-2">
            Progress: <strong className="text-white font-mono">{progressPercent.toFixed(0)}%</strong> of target reached
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default DeficitTrackerCard;
