"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Streak } from "@/lib/types";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";
import { getStreakRepository } from "@/lib/repositories";

const CACHE_KEY = "streak";
const CACHE_TTL_MS = 60000; // 60 seconds

export const useStreak = () => {
  const streak = useAppStore((state) => state.streak);
  const setStreak = useAppStore((state) => state.setStreak);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);
  const [loading, setLoading] = useState(true);

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
          if (mounted) setStreak(null);
          return;
        }

        const state = useAppStore.getState();
        const cachedTime = state.lastFetched[CACHE_KEY];
        const now = Date.now();
        if (cachedTime && now - cachedTime < CACHE_TTL_MS && state.streak) {
          if (mounted) setLoading(false);
          return;
        }

        const repo = getStreakRepository();
        const { data, error } = await repo.getOrCreate(userId);

        if (abortController.signal.aborted || !mounted) return;
        
        if (error) throw new Error(error.message);

        const resolvedStreak = data as Streak | null;

        if (mounted) {
          setStreak(resolvedStreak);
          updateLastFetched(CACHE_KEY);
        }
      } catch (error) {
        if (abortController.signal.aborted || !mounted) return;
        
        const message = error instanceof Error ? error.message : "Failed to load streak.";
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
      abortController.abort();
    };
  }, [setStreak, updateLastFetched]);

  return {
    streak,
    loading,
  };
};

export default useStreak;
