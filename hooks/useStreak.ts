"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type { Streak } from "@/lib/types";
import { showErrorToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";

const CACHE_KEY = "streak";
const CACHE_TTL_MS = 60000; // 60 seconds

export const useStreak = () => {
  const streak = useAppStore((state) => state.streak);
  const setStreak = useAppStore((state) => state.setStreak);
  const lastFetched = useAppStore((state) => state.lastFetched);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!userId) {
          if (mounted) setStreak(null);
          return;
        }

        // Check cache
        const cachedTime = lastFetched[CACHE_KEY];
        const now = Date.now();
        if (cachedTime && now - cachedTime < CACHE_TTL_MS && streak) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        let resolvedStreak = data as Streak | null;
        if (!resolvedStreak) {
          const { data: inserted, error: insertError } = await supabase
            .from("streaks")
            .insert({ user_id: userId })
            .select("*")
            .single();

          if (insertError) throw insertError;
          resolvedStreak = inserted as Streak;
        }

        if (mounted) {
          setStreak(resolvedStreak);
          updateLastFetched(CACHE_KEY);
        }
      } catch (error) {
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
    };
  }, [setStreak, lastFetched, streak, updateLastFetched]);

  return {
    streak,
    loading,
  };
};

export default useStreak;
