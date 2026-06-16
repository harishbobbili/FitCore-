"use client";

import { getAchievementsRepository } from "@/lib/repositories";
import { useEffect, useMemo, useState } from "react";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import type { Achievement, BadgeDefinition } from "@/lib/types";
import { getSessionUserId } from "@/lib/supabase/session";

export function useAchievements() {
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const userId = await getSessionUserId();
      if (!userId) {
        setEarned([]);
        setLoading(false);
        return [];
      }

      const repo = getAchievementsRepository();
      const { data } = await repo.getByUserId(userId);
      const records = (data ?? []) as Achievement[];
      setEarned(records);
      setLoading(false);
      return records;
    } catch {
      setEarned([]);
      setLoading(false);
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    const loadAchievementsSafe = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        const userId = await getSessionUserId();
        if (!mounted) return;
        
        if (!userId) {
          if (mounted) {
            setEarned([]);
            setLoading(false);
          }
          return [];
        }

        const repo = getAchievementsRepository();
        const { data } = await repo.getByUserId(userId);
        
        if (abortController.signal.aborted || !mounted) return;
        
        const records = (data ?? []) as Achievement[];
        
        if (mounted) {
          setEarned(records);
          setLoading(false);
        }
        return records;
      } catch {
        if (abortController.signal.aborted || !mounted) return;
        
        if (mounted) {
          setEarned([]);
          setLoading(false);
        }
        return [];
      }
    };

    void loadAchievementsSafe();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, []);

  const checkAndUnlock = async (triggerType: BadgeDefinition["triggerType"], currentValue: number) => {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const currentEarned = earned.length ? earned : (await loadAchievements());
    // Memoize earnedIds calculation to prevent recalculation
    const earnedIds = new Set(currentEarned.map((achievement) => achievement.badge_id));
    const matching = BADGE_DEFINITIONS.filter((badge) => badge.triggerType === triggerType && currentValue >= badge.threshold && !earnedIds.has(badge.id));

    const repo = getAchievementsRepository();
    for (const badge of matching) {
      const { data } = await repo.earn(userId, badge.id);
      if (data) {
        const achievement = data as Achievement;
        setEarned((current) => [achievement, ...current]);
        window.dispatchEvent(new CustomEvent("fitcore:achievement-unlocked", { detail: badge }));
      }
    }

    return matching;
  };

  // Memoize locked badges calculation (already present, documented for clarity)
  const locked = useMemo(
    () => BADGE_DEFINITIONS.filter((badge) => !earned.some((achievement) => achievement.badge_id === badge.id)),
    [earned]
  );

  // Memoize earned IDs for external use
  const earnedIds = useMemo(
    () => new Set(earned.map((achievement) => achievement.badge_id)),
    [earned]
  );

  return { earned, locked, earnedIds, loading, checkAndUnlock, refreshAchievements: loadAchievements };
}

export default useAchievements;