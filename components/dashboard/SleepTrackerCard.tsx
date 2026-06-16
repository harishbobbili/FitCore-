"use client";

import React, { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { Moon, Plus } from "lucide-react";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useProfile } from "@/hooks/useProfile";
import SkeletonCard from "@/components/ui/SkeletonCard";

export const SleepTrackerCard: React.FC = () => {
  const [sleepVal, setSleepVal] = useState("");
  const { log, logSleep, loading } = useDailyLog();
  const { profile, loading: profileLoading } = useProfile();

  const handleLogSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(sleepVal);
    if (!isNaN(hrs) && hrs >= 0 && hrs <= 24) {
      logSleep(hrs);
      setSleepVal("");
    }
  };

  if (loading || profileLoading || !profile) {
    return <SkeletonCard className="flex flex-col justify-between h-full min-h-[220px]" />;
  }

  const sleepHours = log?.sleep_hours ?? 0;
  const isHealthySleep = sleepHours >= 7.0;

  return (
    <GlassCard className="flex flex-col justify-between h-full min-h-[220px]" hoverable>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#6C63FF]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sleep Tracker</h3>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${
            isHealthySleep 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-orange-500/10 text-orange-400 border-orange-500/20"
          }`}>
            Today: {sleepHours} hrs
          </span>
        </div>

        <div className="my-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Recovery target</span>
            <span>{profile.workout_days_per_week ?? 5} workout days/week</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
            <div className={`h-full rounded-full ${isHealthySleep ? "bg-emerald-400" : "bg-[#6C63FF]"}`} style={{ width: `${Math.min((sleepHours / 9) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleLogSleep} className="flex gap-2 items-center border-t border-white/5 pt-3">
        <input
          type="number"
          step="0.5"
          max="24"
          placeholder="Last night hrs..."
          value={sleepVal}
          onChange={(e) => setSleepVal(e.target.value)}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-neonPurple/50 font-mono transition-colors"
        />
        <NeonButton type="submit" variant="purple-outline" className="px-2 py-1 text-xs h-7 min-w-[50px] flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 mr-0.5" /> Log
        </NeonButton>
      </form>
    </GlassCard>
  );
};

export default SleepTrackerCard;
