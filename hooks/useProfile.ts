"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DAILY_GOALS, USER_PROFILE } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";

const CACHE_KEY = "profile";
const CACHE_TTL_MS = 60000; // 60 seconds

const defaultProfileValues = {
  name: USER_PROFILE.name,
  height_cm: USER_PROFILE.heightCm,
  weight_kg: USER_PROFILE.weightKg,
  goal: "fat_loss",
  experience: "intermediate",
  maintenance_kcal: DAILY_GOALS.MAINTENANCE_CALORIES,
  target_kcal: DAILY_GOALS.DEFICIT_CALORIES,
  protein_goal_g: DAILY_GOALS.PROTEIN_GOAL,
  carbs_goal_g: 180,
  fat_goal_g: 55,
  water_goal_ml: DAILY_GOALS.WATER_GOAL,
  step_goal: DAILY_GOALS.STEP_GOAL,
  workout_days_per_week: 5,
};

export function useProfile() {
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const lastFetched = useAppStore((state) => state.lastFetched);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!userId) {
          if (mounted) setProfile(null);
          return;
        }

        // Check cache
        const cachedTime = lastFetched[CACHE_KEY];
        const now = Date.now();
        if (cachedTime && now - cachedTime < CACHE_TTL_MS && profile) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        let resolvedProfile = data as Profile | null;

        if (!resolvedProfile) {
          const { data: inserted, error: insertError } = await supabase
            .from("profiles")
            .insert({ id: userId, ...defaultProfileValues })
            .select("*")
            .single();

          if (insertError) throw insertError;
          resolvedProfile = inserted as Profile;
        }

        if (mounted) {
          setProfile(resolvedProfile);
          updateLastFetched(CACHE_KEY);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load profile.";
        showErrorToast(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [setProfile, lastFetched, profile, updateLastFetched]);

  const updateProfile = async (fields: Partial<Profile>) => {
    const snapshot = useAppStore.getState().profile;
    const userId = await getSessionUserId();
    if (!userId) return null;

    const optimisticProfile = { ...(snapshot || { id: userId, created_at: new Date().toISOString() }), ...fields } as Profile;
    setProfile(optimisticProfile);

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...fields })
      .select("*")
      .single();

    if (error) {
      setProfile(snapshot);
      showErrorToast(error.message);
      return null;
    }

    setProfile(data as Profile);
    showSuccessToast("Your daily targets have been updated");
    return data as Profile;
  };

  return { profile, loading, updateProfile };
}

export default useProfile;
