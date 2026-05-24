"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { DailyLog, Meal } from "@/lib/types";
import { useAppStore, selectTotalCaloriesToday } from "@/store/useAppStore";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";

const CACHE_KEY_PREFIX = "daily_log";
const CACHE_TTL_MS = 60000; // 60 seconds

export const useDailyLog = (date: string = new Date().toISOString().split("T")[0]) => {
  const log = useAppStore((state) => state.todayLog);
  const meals = useAppStore((state) => state.meals);
  const setTodayLog = useAppStore((state) => state.setTodayLog);
  const updateTodayLog = useAppStore((state) => state.updateTodayLog);
  const setMeals = useAppStore((state) => state.setMeals);
  const lastFetched = useAppStore((state) => state.lastFetched);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);
  const [loading, setLoading] = useState(true);
  const cacheKey = `${CACHE_KEY_PREFIX}:${date}`;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!userId) {
          if (mounted) {
            setTodayLog(null);
            setMeals([]);
          }
          return;
        }

        // Check cache
        const cachedTime = lastFetched[cacheKey];
        const now = Date.now();
        if (cachedTime && now - cachedTime < CACHE_TTL_MS && log && meals.length > 0) {
          setLoading(false);
          return;
        }

        const { data: resolvedLog, error: logError } = await supabase
          .from("daily_logs")
          .upsert({ user_id: userId, date }, { onConflict: "user_id,date", ignoreDuplicates: true })
          .select("*")
          .single();

        if (logError) throw logError;

        const { data: mealsData, error: mealsError } = await supabase
          .from("meals")
          .select("*")
          .eq("user_id", userId)
          .eq("date", date)
          .order("logged_at", { ascending: true });

        if (mealsError) throw mealsError;

        if (mounted) {
          setTodayLog(resolvedLog);
          setMeals((mealsData ?? []) as Meal[]);
          updateLastFetched(cacheKey);
        }
      } catch (error: any) {
        console.error("Daily log error:", error);
        const message = error?.message || (error instanceof Error ? error.message : "Failed to load daily log.");
        showErrorToast(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [date, setMeals, setTodayLog, lastFetched, log, meals, updateLastFetched, cacheKey]);

  const updateField = async (field: keyof DailyLog, value: number) => {
    const snapshot = useAppStore.getState().todayLog;
    if (!snapshot) return;

    const userId = await getSessionUserId();
    if (!userId) return;

    updateTodayLog({ [field]: value } as Partial<DailyLog>);

    const { error } = await supabase
      .from("daily_logs")
      .upsert({ user_id: userId, date, ...useAppStore.getState().todayLog, [field]: value }, { onConflict: "user_id,date" });

    if (error) {
      setTodayLog(snapshot);
      showErrorToast(error.message);
    }
  };

  return {
    log,
    meals,
    loading,
    logCalories: () => {
      const totalCalories = selectTotalCaloriesToday(useAppStore.getState());
      updateField("calories_consumed", totalCalories);
    },
    logWater: (ml: number) => updateField("water_ml", ml),
    logSteps: (steps: number) => updateField("steps", steps),
    logSleep: (hours: number) => updateField("sleep_hours", hours),
    logWeight: (weightKg: number) => updateField("weight_kg", weightKg),
  };
};

export default useDailyLog;
