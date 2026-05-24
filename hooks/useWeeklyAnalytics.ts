"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { DailyLog } from "@/lib/types";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";
import { useAppStore } from "@/store/useAppStore";

const CACHE_KEY = "weekly_analytics";
const CACHE_TTL_MS = 60000; // 60 seconds

export interface WeeklyChartPoint {
  date: string;
  calories: number;
  protein: number;
  weight: number;
}

type DailyLogRow = {
  date: string;
  calories_consumed: number | null;
  protein_g: number | null;
  weight_kg: number | null;
};

type WorkoutSessionRow = {
  date: string;
};

export function useWeeklyAnalytics() {
  const [weeklyData, setWeeklyData] = useState<WeeklyChartPoint[]>([]);
  const [weeklyConsistencyScore, setWeeklyConsistencyScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const lastFetched = useAppStore((state) => state.lastFetched);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);

  useEffect(() => {
    let mounted = true;

    const loadWeekly = async () => {
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!userId) {
          if (mounted) {
            setWeeklyData([]);
            setWeeklyConsistencyScore(0);
          }
          return;
        }

        // Check cache
        const cachedTime = lastFetched[CACHE_KEY];
        const now = Date.now();
        if (cachedTime && now - cachedTime < CACHE_TTL_MS && weeklyData.length > 0) {
          setLoading(false);
          return;
        }

        const { data: logs, error: logsError } = await supabase
          .from("daily_logs")
          .select("date, calories_consumed, protein_g, weight_kg")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(7);

        if (logsError) throw logsError;

        const mapped = (logs ?? [])
          .slice()
          .reverse()
          .map((log: DailyLogRow) => ({
            date: new Date(log.date).toLocaleDateString("en-US", { weekday: "short" }),
            calories: log.calories_consumed ?? 0,
            protein: Number(log.protein_g ?? 0),
            weight: Number(log.weight_kg ?? 0),
          }));

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        const { data: workoutSessions, error: workoutError } = await supabase
          .from("workout_sessions")
          .select("date")
          .eq("user_id", userId)
          .gte("date", weekStart.toISOString().split("T")[0]);

        if (workoutError) throw workoutError;

        const workoutDays = new Set((workoutSessions ?? []).map((session: WorkoutSessionRow) => session.date)).size;

        if (mounted) {
          setWeeklyData(mapped);
          setWeeklyConsistencyScore(Math.round((workoutDays / 7) * 100));
          updateLastFetched(CACHE_KEY);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load weekly analytics.";
        showErrorToast(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWeekly();

    return () => {
      mounted = false;
    };
  }, [lastFetched, weeklyData, updateLastFetched]);

  return { weeklyData, weeklyConsistencyScore, loading };
}

export default useWeeklyAnalytics;
