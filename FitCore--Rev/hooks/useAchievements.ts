"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import type { Achievement, BadgeDefinition } from "@/lib/types";
import { getSessionUserId } from "@/lib/supabase/session";

export function useAchievements() {
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAchievements = async () => {
    setLoading(true);
    const userId = await getSessionUserId();
    if (!userId) {
      setEarned([]);
      setLoading(false);
      return [];
    }

    const { data } = await supabase.from("achievements").select("*").eq("user_id", userId).order("earned_at", { ascending: false });
    const records = (data ?? []) as Achievement[];
    setEarned(records);
    setLoading(false);
    return records;
  };

  useEffect(() => {
    void loadAchievements();
  }, []);

  const checkAndUnlock = async (triggerType: BadgeDefinition["triggerType"], currentValue: number) => {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const currentEarned = earned.length ? earned : (await loadAchievements());
    const earnedIds = new Set(currentEarned.map((achievement) => achievement.badge_id));
    const matching = BADGE_DEFINITIONS.filter((badge) => badge.triggerType === triggerType && currentValue >= badge.threshold && !earnedIds.has(badge.id));

    for (const badge of matching) {
      const { data } = await supabase.from("achievements").insert({ user_id: userId, badge_id: badge.id }).select("*").single();
      if (data) {
        const achievement = data as Achievement;
        setEarned((current) => [achievement, ...current]);
        window.dispatchEvent(new CustomEvent("fitcore:achievement-unlocked", { detail: badge }));
      }
    }

    return matching;
  };

  const locked = useMemo(
    () => BADGE_DEFINITIONS.filter((badge) => !earned.some((achievement) => achievement.badge_id === badge.id)),
    [earned]
  );

  return { earned, locked, loading, checkAndUnlock, refreshAchievements: loadAchievements };
}

export default useAchievements;