import { getDailyLogsRepository, getMealsRepository } from "@/lib/repositories";
import { useEffect, useState } from "react";
import type { DailyLog, Meal } from "@/lib/types";
import { useAppStore, selectTotalCaloriesToday } from "@/store/useAppStore";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";

const CACHE_KEY_PREFIX = "daily_log";
const CACHE_TTL_MS = 60000; // 60 seconds;

export const useDailyLog = (date: string = new Date().toISOString().split("T")[0]) => {
  const log = useAppStore((state) => state.todayLog);
  const meals = useAppStore((state) => state.meals);
  const setTodayLog = useAppStore((state) => state.setTodayLog);
  const updateTodayLog = useAppStore((state) => state.updateTodayLog);
  const setMeals = useAppStore((state) => state.setMeals);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheKey = `${CACHE_KEY_PREFIX}:${date}`;

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    const load = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!mounted) return;
        
        if (!userId) {
          if (mounted) {
            setTodayLog(null);
            setMeals([]);
          }
          return;
        }

        const state = useAppStore.getState();
        const cachedTime = state.lastFetched[cacheKey];
        const now = Date.now();
        if (cachedTime && now - cachedTime < CACHE_TTL_MS && state.todayLog?.date === date) {
          if (mounted) setLoading(false);
          return;
        }

        const dailyLogRepo = getDailyLogsRepository();
        const mealsRepo = getMealsRepository();
        
        const { data: resolvedLog, error: logError } = await dailyLogRepo.upsert(userId, date, {});

        if (abortController.signal.aborted || !mounted) return;
        
        if (logError) throw new Error(logError.message);

        const { data: mealsData, error: mealsError } = await mealsRepo.getByDate(userId, date);

        if (abortController.signal.aborted || !mounted) return;
        
        if (mealsError) throw new Error(mealsError.message);

        if (mounted) {
          setTodayLog(resolvedLog);
          setMeals((mealsData ?? []) as Meal[]);
          updateLastFetched(cacheKey);
        }
      } catch (error: unknown) {
        if (abortController.signal.aborted || !mounted) return;
        
        console.error("Daily log error:", error);
        const err = error instanceof Error ? error : new Error("Failed to load daily log.");
        setError(err);
        showErrorToast(err.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [date, setMeals, setTodayLog, updateLastFetched, cacheKey]);

  const updateField = async (field: keyof DailyLog, value: number) => {
    const snapshot = useAppStore.getState().todayLog;
    if (!snapshot) return;

    const userId = await getSessionUserId();
    if (!userId) return;

    updateTodayLog({ [field]: value } as Partial<DailyLog>);

    const repo = getDailyLogsRepository();
    const { error } = await repo.updateField(userId, date, field, value);

    if (error) {
      setTodayLog(snapshot);
      showErrorToast(error.message);
    }
  };

  const retry = () => {
    setError(null);
    // Trigger reload by changing cache key temporarily
    updateLastFetched(`${cacheKey}:retry`);
  };

  return {
    log,
    meals,
    loading,
    error,
    retry,
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
