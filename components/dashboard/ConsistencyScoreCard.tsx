"use client";

import React, { useMemo } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { ShieldCheck, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import SkeletonCard from "@/components/ui/SkeletonCard";

interface DayStatus {
  label: string;
  workedOut: boolean;
  isFuture: boolean;
}

export const ConsistencyScoreCard = React.memo(() => {
  const weeklyAnalytics = useAppStore((state) => state.weeklyAnalytics);
  const streak = useAppStore((state) => state.streak);
  const profile = useAppStore((state) => state.profile);

  if (!weeklyAnalytics || !streak || !profile) {
    return <SkeletonCard className="flex flex-col justify-between h-full min-h-[220px]" />;
  }

  const plannedDays = profile?.workout_days_per_week ?? 5;
  const score = weeklyAnalytics?.summary?.consistency_score ?? 0;
  const workoutsThisWeek = weeklyAnalytics?.summary?.workout_count ?? 0;

  // Build 7-day status from actual workout data in chart
  const weeklyStatus: DayStatus[] = useMemo(() => {
    const dailyHistory = weeklyAnalytics?.daily_history || [];
    return Array.from({ length: 7 }).map((_, idx) => {
      const source = dailyHistory[idx];
      const date = new Date(Date.now() - (6 - idx) * 24 * 60 * 60 * 1000);
      const isFuture = idx > (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 + (6 - idx) < 0 ? 0 : -1);
      // A day "worked out" if calories OR protein were logged (proxy for activity)
      const workedOut = !!(source && (source.calories_consumed > 0 || source.protein_g > 0));
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        workedOut,
        isFuture: date > new Date(),
      };
    });
  }, [weeklyAnalytics]);

  const getMotivationalLabel = (s: number) => {
    if (s >= 100) return "Perfect week! Absolutely elite.";
    if (s >= 86) return "Outstanding — one more day to perfect the week!";
    if (s >= 70) return "Great week. Stay the course.";
    if (s >= 50) return "Good progress. Push for your target days.";
    return "Consistency is everything. Refocus now.";
  };

  const dotStyle = (day: DayStatus) => {
    if (day.isFuture) return "bg-white/5 border-white/10";
    if (day.workedOut) return "bg-neonCyan shadow-neon-cyan border-neonCyan/50";
    return "bg-rose-500/20 border-rose-500/30";
  };

  return (
    <GlassCard className="flex flex-col justify-between h-full min-h-[220px]" hoverable>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neonPurple" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Consistency Score</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-neonPurple/10 text-neonPurple border border-neonPurple/20 font-medium">
            Weekly
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 mb-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.02] border border-white/5 shadow-inner">
            <Award className="w-6 h-6 text-neonPurple" />
            <div className="absolute inset-0 rounded-full border border-neonPurple/30 blur-[2px]" />
          </div>

          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{score}</span>
              <span className="text-xs text-white/40">/ 100</span>
            </div>
            <p className="text-[11px] text-white/50 font-medium mt-0.5">
              {getMotivationalLabel(score)}
            </p>
            {/* Show real fractions */}
            <p className="text-[10px] text-white/30 font-mono mt-0.5">
              {workoutsThisWeek} / {plannedDays} days this week
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Dots Grid */}
      <div className="border-t border-white/5 pt-3 mt-2">
        <div className="flex justify-between items-center px-1">
          {weeklyStatus.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-bold text-white/40 uppercase font-mono">{day.label}</span>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300",
                  dotStyle(day)
                )}
                title={`${day.label}: ${day.isFuture ? "upcoming" : day.workedOut ? "active" : "missed"}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[8px] text-white/30 font-mono mt-3 px-1">
          <span>Active streak: {streak?.current_streak ?? 0} days</span>
          <span>Target: {plannedDays} days / wk</span>
        </div>
      </div>
    </GlassCard>
  );
});

ConsistencyScoreCard.displayName = "ConsistencyScoreCard";

export default ConsistencyScoreCard;
