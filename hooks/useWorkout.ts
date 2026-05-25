"use client";

import { useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import type { ExerciseSet, WorkoutSession } from "@/lib/types";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAppStore } from "@/store/useAppStore";
import { getSessionUserId } from "@/lib/supabase/session";
import useAchievements from "@/hooks/useAchievements";

function minutesBetween(startedAt: string) {
  return Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000));
}

function workoutMet(splitName: string) {
  const lower = splitName.toLowerCase();
  if (lower.includes("legs")) return 6.5;
  if (lower.includes("back")) return 6.2;
  if (lower.includes("shoulders")) return 5.8;
  return 5.5;
}

export function useWorkout() {
  const activeSession = useAppStore((state) => state.activeSession);
  const exerciseSets = useAppStore((state) => state.exerciseSets);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const setExerciseSets = useAppStore((state) => state.setExerciseSets);
  const addExerciseSetToStore = useAppStore((state) => state.addExerciseSet);
  const profile = useAppStore((state) => state.profile);
  const streak = useAppStore((state) => state.streak);
  const setStreak = useAppStore((state) => state.setStreak);
  const { checkAndUnlock } = useAchievements();

  const startSession = async (splitName: string) => {
    const userId = await getSessionUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, split_name: splitName, date: new Date().toISOString().split("T")[0] })
      .select("*")
      .single();

    if (error) {
      showErrorToast(error.message);
      return null;
    }

    setActiveSession(data as WorkoutSession);
    setExerciseSets([]);
    return data as WorkoutSession;
  };

  const logSet = async (exerciseName: string, setNum: number, reps: number, weightKg: number) => {
    const session = useAppStore.getState().activeSession;
    const userId = await getSessionUserId();
    if (!session || !userId) {
      return { isPR: false };
    }

    const { data: priorMax, error: priorError } = await supabase
      .from("exercise_sets")
      .select("weight_kg, reps")
      .eq("user_id", userId)
      .eq("exercise_name", exerciseName)
      .order("weight_kg", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (priorError) {
      showErrorToast(priorError.message);
      return { isPR: false };
    }

    const isPR = !priorMax
      ? weightKg > 0 && reps > 0
      : (weightKg > (priorMax.weight_kg ?? 0)) || (weightKg === (priorMax.weight_kg ?? 0) && reps > (priorMax.reps ?? 0));

    const { data, error } = await supabase
      .from("exercise_sets")
      .insert({
        session_id: session.id,
        user_id: userId,
        exercise_name: exerciseName,
        set_number: setNum,
        reps,
        weight_kg: weightKg,
        is_pr: isPR,
      })
      .select("*")
      .single();

    if (error) {
      showErrorToast(error.message);
      return { isPR: false };
    }

    addExerciseSetToStore(data as ExerciseSet);

    if (isPR) {
      const { count } = await supabase.from("exercise_sets").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_pr", true);
      if (count) {
        void checkAndUnlock("pr_count", count);
      }
    }

    return { isPR };
  };

  const finishSession = async (notes?: string) => {
    const session = useAppStore.getState().activeSession;
    const userId = await getSessionUserId();
    if (!session || !userId) {
      return null;
    }

    const durationMins = minutesBetween(session.started_at);
    const currentProfile = useAppStore.getState().profile;
    const weightKg = currentProfile?.weight_kg ?? 70;
    const caloriesBurned = Math.round(0.0175 * workoutMet(session.split_name) * weightKg * durationMins);

    const { data, error } = await supabase
      .from("workout_sessions")
      .update({ finished_at: new Date().toISOString(), duration_mins: durationMins, calories_burned: caloriesBurned, notes: notes ?? null })
      .eq("id", session.id)
      .select("*")
      .single();

    if (error) {
      showErrorToast(error.message);
      return null;
    }

    const today = new Date().toISOString().split("T")[0];
    const { data: streakRow } = await supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle();

    const lastWorkoutDate = streakRow?.last_workout_date ?? null;
    const shouldIncrement = lastWorkoutDate !== today;
    const nextCurrent = shouldIncrement ? (streakRow?.current_streak ?? 0) + 1 : streakRow?.current_streak ?? 0;
    const nextLongest = Math.max(streakRow?.longest_streak ?? 0, nextCurrent);

    const { data: updatedStreak } = await supabase
      .from("streaks")
      .upsert({
        user_id: userId,
        current_streak: nextCurrent,
        longest_streak: nextLongest,
        last_workout_date: today,
      }, { onConflict: "user_id" })
      .select("*")
      .single();

    if (updatedStreak) {
      setStreak(updatedStreak as typeof streak);
    }

    const { count: workoutCount } = await supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (workoutCount) {
      void checkAndUnlock("workout_count", workoutCount);
    }
    void checkAndUnlock("streak", nextCurrent);

    const { data: achievements } = await supabase.from("achievements").select("badge_id").eq("user_id", userId);
    const earnedBadges = new Set((achievements ?? []).map((row: { badge_id: string }) => row.badge_id));

    const { count: prCount } = await supabase.from("exercise_sets").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_pr", true);

    const unlocked: string[] = [];
    BADGE_DEFINITIONS.forEach((badge) => {
      if (badge.triggerType === "workout_count" && (workoutCount ?? 0) >= badge.threshold && !earnedBadges.has(badge.id)) {
        unlocked.push(badge.title);
      }
      if (badge.triggerType === "streak" && nextCurrent >= badge.threshold && !earnedBadges.has(badge.id)) {
        unlocked.push(badge.title);
      }
      if (badge.triggerType === "pr_count" && (prCount ?? 0) >= badge.threshold && !earnedBadges.has(badge.id)) {
        unlocked.push(badge.title);
      }
    });

    await Promise.all(
      unlocked.map((badgeId) =>
        supabase.from("achievements").upsert({ user_id: userId, badge_id: badgeId }, { onConflict: "user_id,badge_id" })
      )
    );

    setActiveSession(null);
    setExerciseSets([]);
    showSuccessToast("Workout session saved");
    return data as WorkoutSession;
  };

  const getExerciseHistory = async (exerciseName: string) => {
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { data: sessions, error: sessionsError } = await supabase
      .from("workout_sessions")
      .select("id, date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(8);

    if (sessionsError || !sessions?.length) {
      return [];
    }

    const sessionIds = sessions.map((session: { id: string }) => session.id);
    const { data: sets, error } = await supabase
      .from("exercise_sets")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_name", exerciseName)
      .in("session_id", sessionIds);

    if (error || !sets?.length) {
      return [];
    }

    const history = (sets as ExerciseSet[])
      .map((set) => ({
        ...set,
        date: sessions.find((session: { id: string; date: string }) => session.id === set.session_id)?.date ?? new Date().toISOString().split("T")[0],
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return history;
  };

  return useMemo(
    () => ({ activeSession, exerciseSets, startSession, logSet, finishSession, getExerciseHistory }),
    [activeSession, exerciseSets]
  );
}

export default useWorkout;
