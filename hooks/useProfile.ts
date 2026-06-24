"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { getSessionUserId } from "@/lib/supabase/session";
import { getUserProfileRepository } from "@/lib/repositories";

const CACHE_KEY = "profile";
const CACHE_TTL_MS = 300000; // 5 minutes (300 seconds)

const defaultProfileValues = {
  name: "Athlete",
  goal: "general",
  experience: "beginner",
  target_kcal: 2000,
  protein_goal_g: 140,
  carbs_goal_g: 200,
  fat_goal_g: 65,
  water_goal_ml: 3000,
  step_goal: 8000,
  workout_days_per_week: 3,
};

export function useProfile() {
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const updateLastFetched = useAppStore((state) => state.updateLastFetched);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    const loadProfile = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!mounted) return;
        
        if (!userId) {
          if (mounted) setProfile(null);
          return;
        }

        // Check cache inside the effect
        const cachedTime = useAppStore.getState().lastFetched[CACHE_KEY];
        const currentProfile = useAppStore.getState().profile;
        const now = Date.now();
        if (cachedTime && now - cachedTime < CACHE_TTL_MS && currentProfile) {
          if (mounted) setLoading(false);
          return;
        }

        const repo = getUserProfileRepository();
        const { data: profileData, error: repoError } = await repo.getOrCreate(userId);

        if (abortController.signal.aborted || !mounted) return;
        
        if (repoError) throw new Error(repoError.message);

        let resolvedProfile = profileData;

        if (!resolvedProfile) {
          const { data: inserted, error: insertError } = await repo.update(userId, defaultProfileValues);
          if (abortController.signal.aborted || !mounted) return;
          if (insertError) throw new Error(insertError.message);
          resolvedProfile = inserted;
        }

        if (mounted) {
          setProfile(resolvedProfile);
          updateLastFetched(CACHE_KEY);
        }
      } catch (err) {
        if (abortController.signal.aborted || !mounted) return;
        
        const error = err instanceof Error ? err : new Error("Failed to load profile.");
        setError(error);
        showErrorToast(error.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [setProfile, updateLastFetched]);

  const updateProfile = async (fields: Partial<Profile>) => {
    const snapshot = useAppStore.getState().profile;
    const userId = await getSessionUserId();
    if (!userId) return null;

    const optimisticProfile = { ...(snapshot || { id: userId, created_at: new Date().toISOString() }), ...fields } as Profile;
    setProfile(optimisticProfile);

    const repo = getUserProfileRepository();
    const { data, error } = await repo.update(userId, fields);

    if (error) {
      setProfile(snapshot);
      showErrorToast(error.message);
      return null;
    }

    setProfile(data);
    showSuccessToast("Your daily targets have been updated");
    return data;
  };
  
  const retry = () => {
    setError(null);
    updateLastFetched(`${CACHE_KEY}:retry`);
  };

  return { profile, loading, error, retry, updateProfile };
}

export default useProfile;
