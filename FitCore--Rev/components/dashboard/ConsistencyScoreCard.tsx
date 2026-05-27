"use client";

import React from "react";
import GlassCard from "@/components/ui/GlassCard";
import { ShieldCheck, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWeeklyAnalytics } from "@/hooks/useWeeklyAnalytics";
import { useStreak } from "@/hooks/useStreak";
import SkeletonCard from "@/components/ui/SkeletonCard";

interface DayStatus {
  day: string;
  label: string;
  status: "completed" | "partial" | "missed" | "upcoming";
}

export const ConsistencyScoreCard: React.FC = () => {
  const { weeklyConsistencyScore, weeklyData, loading } = useWeeklyAnalytics();
  const { streak, loading: streakLoading } = useStreak();

  if (loading || streakLoading) {
    return <SkeletonCard className="flex flex-col justify-between h-full min-h-[220px]" />;
  }

  const score = weeklyConsistencyScore;

  const weeklyConsistency: DayStatus[] = Array.from({ length: 7 }).map((_, idx) => {
    const source = weeklyData[idx];
    const date = new Date(Date.now() - (6 - idx) * 24 * 60 * 60 * 1000);
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      status: source && (source.calories > 0 || source.protein > 0 || source.weight > 0) ? "completed" : idx <= 3 ? "completed" : "upcoming",
    };
  });

  const getStatusStyle = (status: DayStatus["status"]) => {
    switch (status) {
      case "completed":
        return {
          dot: "bg-neonCyan shadow-neon-cyan border-neonCyan/50",
          text: "text-neonCyan",
        };
      case "partial":
        return {
          dot: "bg-neonPurple/50 border-neonPurple/30 shadow-neon-purple/20 animate-pulse",
          text: "text-neonPurple/70",
        };
      case "missed":
        return {
          dot: "bg-rose-500/20 border-rose-500/30",
          text: "text-rose-400",
        };
      default: // upcoming
        return {
          dot: "bg-white/5 border-white/10",
          text: "text-white/30",
        };
    }
  };

  const getMotivationalLabel = (scoreVal: number) => {
    if (scoreVal >= 90) return "Elite consistency! Absolutely crushing it.";
    if (scoreVal >= 80) return "Excellent work! Keep defending the deficit.";
    if (scoreVal >= 70) return "Good progress, but stay disciplined.";
    return "Consistency is key. Refocus on your goals!";
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

        {/* Score Display */}
        <div className="flex items-center gap-4 mt-2 mb-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.02] border border-white/5 shadow-inner">
            <Award className="w-6 h-6 text-neonPurple" />
            {/* Simple glowing circle background element */}
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
          </div>
        </div>
      </div>

      {/* 7-Day Dots Grid */}
      <div className="border-t border-white/5 pt-3 mt-2">
        <div className="flex justify-between items-center px-1">
          {weeklyConsistency.map((dayData, idx) => {
            const styles = getStatusStyle(dayData.status);
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold text-white/40 uppercase font-mono">{dayData.label}</span>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300",
                    styles.dot
                  )}
                  title={`${dayData.label}: ${dayData.status}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[8px] text-white/30 font-mono mt-3 px-1">
          <span>Active Streak: {streak?.current_streak ?? 0} days</span>
          <span>Target: 6 days / wk</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default ConsistencyScoreCard;
