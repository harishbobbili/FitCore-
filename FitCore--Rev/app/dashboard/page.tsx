"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import StatChip from "@/components/ui/StatChip";
import WeightSparklineCard from "@/components/dashboard/WeightSparklineCard";
import BmiCalculatorCard from "@/components/dashboard/BmiCalculatorCard";
import SleepTrackerCard from "@/components/dashboard/SleepTrackerCard";
import WeeklyProgressChart from "@/components/dashboard/WeeklyProgressChart";
import DeficitTrackerCard from "@/components/dashboard/DeficitTrackerCard";
import ConsistencyScoreCard from "@/components/dashboard/ConsistencyScoreCard";
import QuoteCard from "@/components/dashboard/QuoteCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useAppStore, selectTotalCaloriesToday, selectTotalProteinToday } from "@/store/useAppStore";
import { Flame, Plus, RefreshCw } from "lucide-react";
import type { Profile, DailyLog, Streak } from "@/lib/types";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [weeklyConsistencyScore, setWeeklyConsistencyScore] = useState(0);

  const setProfileStore = useAppStore((state) => state.setProfile);
  const setTodayLog = useAppStore((state) => state.setTodayLog);
  const setMeals = useAppStore((state) => state.setMeals);
  const setStreakStore = useAppStore((state) => state.setStreak);
  const updateTodayLog = useAppStore((state) => state.updateTodayLog);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);

  const totalCaloriesToday = useAppStore(selectTotalCaloriesToday);
  const totalProteinToday = useAppStore(selectTotalProteinToday);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/summary");
      const result = await response.json();

      if (result.success && result.data) {
        const { profile: profileData, log: logData, meals: mealsData, streak: streakData, analytics } = result.data;

        setProfile(profileData);
        setProfileStore(profileData);
        setLog(logData);
        setTodayLog(logData);
        setMeals(mealsData || []);
        setStreak(streakData);
        setStreakStore(streakData);
        setWeeklyConsistencyScore(analytics?.summary?.workout_count || 0);

        // Update cache timestamps
        updateLastFetched("profile");
        updateLastFetched("daily_log:" + new Date().toISOString().split("T")[0]);
        updateLastFetched("streak");
        updateLastFetched("weekly_analytics");
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const logWater = (ml: number) => {
    if (!log) return;
    updateTodayLog({ water_ml: ml });
    setLog({ ...log, water_ml: ml });
  };

  const logSleep = (hours: number) => {
    if (!log) return;
    updateTodayLog({ sleep_hours: hours });
    setLog({ ...log, sleep_hours: hours });
  };

  const logSteps = (steps: number) => {
    if (!log) return;
    updateTodayLog({ steps });
    setLog({ ...log, steps });
  };

  const logWeight = (weightKg: number) => {
    if (!log) return;
    updateTodayLog({ weight_kg: weightKg });
    setLog({ ...log, weight_kg: weightKg });
  };

  const breadcrumbs = [{ label: "Dashboard" }];

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6 pb-12">
        <PageHeader
          title="Dashboard"
          subtitle="Your live training, nutrition, and recovery data now comes from Supabase."
          breadcrumbs={breadcrumbs}
        />

      {loading ? (
        <SkeletonCard className="h-[72px] w-full" />
      ) : (
        <GlassCard className="py-3.5 px-5 flex flex-wrap items-center justify-between gap-4 border-neonPurple/20 bg-brandCard/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neonPurple animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/70 font-mono">Quick Log Panel</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <NeonButton variant="purple-outline" className="py-1 px-3 text-xs h-8" onClick={() => logWater((log?.water_ml ?? 0) + 250)}>
              <Plus className="w-3.5 h-3.5 text-neonPurple" /> +250ml Water
            </NeonButton>
            <NeonButton variant="cyan-outline" className="py-1 px-3 text-xs h-8" onClick={() => logSteps((log?.steps ?? 0) + 1000)}>
              <Plus className="w-3.5 h-3.5 text-neonCyan" /> +1,000 Steps
            </NeonButton>
            <NeonButton variant="purple-outline" className="py-1 px-3 text-xs h-8" onClick={() => logSleep(Math.max(0, (log?.sleep_hours ?? 0) + 0.5))}>
              <Plus className="w-3.5 h-3.5 text-neonPurple" /> +0.5h Sleep
            </NeonButton>
            <NeonButton variant="cyan-outline" className="py-1 px-3 text-xs h-8" onClick={() => logWeight(profile?.weight_kg ?? 63)}>
              <Plus className="w-3.5 h-3.5 text-neonCyan" /> Sync Weight
            </NeonButton>
            <NeonButton variant="ghost" className="py-1 px-2.5 text-xs h-8 border border-white/5 hover:border-white/10 text-white/40 hover:text-white/80" onClick={() => loadDashboardData()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </NeonButton>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatChip
          progress={{ value: totalCaloriesToday, max: profile?.target_kcal ?? 1800, color: "#00D4FF" }}
          label="Calories Intake"
          value={totalCaloriesToday}
          unit={`/ ${profile?.target_kcal ?? 1800} kcal`}
          color="cyan"
        />
        <StatChip
          progress={{ value: totalProteinToday, max: profile?.protein_goal_g ?? 120, color: "#6C63FF" }}
          label="Protein Logged"
          value={totalProteinToday}
          unit={`/ ${profile?.protein_goal_g ?? 120} g`}
          color="purple"
        />
        <StatChip
          progress={{ value: log?.water_ml ?? 0, max: profile?.water_goal_ml ?? 3000, color: "#3b82f6" }}
          label="Water Intake"
          value={log?.water_ml ?? 0}
          unit={`/ ${profile?.water_goal_ml ?? 3000} ml`}
          color="blue"
        />
        <StatChip
          icon={<Flame className="w-5 h-5 animate-pulse" />}
          label="Workout Streak"
          value={streak?.current_streak ?? 0}
          unit=" days"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WeightSparklineCard />
        <BmiCalculatorCard />
        <SleepTrackerCard />
      </div>

      <WeeklyProgressChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><DeficitTrackerCard /></div>
        <div className="lg:col-span-1"><ConsistencyScoreCard /></div>
      </div>

      <QuoteCard />
    </div>
    </ErrorBoundary>
  );
}
