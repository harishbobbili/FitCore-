"use client";

import { useEffect, useState } from "react";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";
import { useAppStore } from "@/store/useAppStore";
import { getAnalyticsRepository } from "@/lib/repositories";
import { AnalyticsService } from "@/lib/services";
import type { WeeklyChartPoint } from "@/lib/services";

const CACHE_KEY = "weekly_analytics";
const CACHE_TTL_MS = 60_000; // 60 seconds

export function useWeeklyAnalytics() {
  const [weeklyData, setWeeklyData] = useState<WeeklyChartPoint[]>([]);
  const [weeklyConsistencyScore, setWeeklyConsistencyScore] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  const profile = useAppStore((state) => state.profile);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    const loadWeekly = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!mounted) return;
        
        if (!userId) {
          if (mounted) {
            setWeeklyData([]);
            setWeeklyConsistencyScore(0);
            setWorkoutsThisWeek(0);
          }
          return;
        }

        // Serve from cache if fresh
        const cachedTime = useAppStore.getState().lastFetched[CACHE_KEY];
        if (cachedTime && Date.now() - cachedTime < CACHE_TTL_MS && weeklyData.length > 0) {
          if (mounted) setLoading(false);
          return;
        }

        const repo = getAnalyticsRepository();
        const { data, error } = await repo.getWeeklySummary(userId);

        if (abortController.signal.aborted || !mounted) return;
        
        if (error) throw new Error(error.message);
        if (!data) throw new Error("No analytics data available");

        const summary = AnalyticsService.calculateWeeklySummary(
          data.logs,
          [], // workoutDates not needed for this simplified calculation
          profile?.workout_days_per_week
        );

        if (mounted) {
          setWeeklyData(summary.chartPoints);
          setWeeklyConsistencyScore(summary.consistencyScore);
          setWorkoutsThisWeek(summary.workoutsThisWeek);
          updateLastFetched(CACHE_KEY);
        }
      } catch (error) {
        if (abortController.signal.aborted || !mounted) return;
        
        const msg = error instanceof Error ? error.message : "Failed to load weekly analytics.";
        showErrorToast(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadWeekly();
    return () => {
      mounted = false;
      abortController.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.workout_days_per_week, updateLastFetched]);

  return { weeklyData, weeklyConsistencyScore, workoutsThisWeek, loading };
}

export default useWeeklyAnalytics;
