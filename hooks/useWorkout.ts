"use client";

import { useMemo } from "react";
import type { ExerciseSet, WorkoutSession } from "@/lib/types";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAppStore } from "@/store/useAppStore";
import { getSessionUserId } from "@/lib/supabase/session";
import useAchievements from "@/hooks/useAchievements";
import { workoutCaloriesBurned } from "@/lib/calories";
import { WorkoutService, StreakService, WorkoutBusinessService } from "@/lib/services";
import { getWorkoutsRepository, getStreakRepository, getAchievementsRepository } from "@/lib/repositories";

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

  const workoutRepo = useMemo(() => getWorkoutsRepository(), []);
  const streakRepo = useMemo(() => getStreakRepository(), []);
  const achievementsRepo = useMemo(() => getAchievementsRepository(), []);

  const startSession = async (splitName: string) => {
    const userId = await getSessionUserId();
    if (!userId) {
      return null;
    }

    const { data, error } = await workoutRepo.createSession(
      userId,
      splitName,
      new Date().toISOString().split("T")[0]
    );

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

    const { data: priorMax, error: priorError } = await workoutRepo.getPriorMax(userId, exerciseName);

    if (priorError) {
      showErrorToast(priorError.message);
      return { isPR: false };
    }

    const { isPR } = WorkoutBusinessService.isPersonalRecord(weightKg, reps, priorMax);

    const { data, error } = await workoutRepo.logExerciseSets(session.id, [{
      session_id: session.id,
      user_id: userId,
      exercise_name: exerciseName,
      set_number: setNum,
      reps,
      weight_kg: weightKg,
      rest_seconds: 90,
      is_pr: isPR,
    }]);

    if (error || !data) {
      showErrorToast(error?.message ?? "Failed to log set");
      return { isPR: false };
    }

    const loggedSet = data[0] as ExerciseSet;
    addExerciseSetToStore(loggedSet);

    if (isPR) {
      const { data: prCount } = await workoutRepo.countPRs(userId);
      if (prCount) {
        void checkAndUnlock("pr_count", prCount);
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

    const durationMins = WorkoutService.calculateDurationMinutes(session.started_at);
    const currentProfile = useAppStore.getState().profile;
    const weightKg = currentProfile?.weight_kg ?? 70;
    const caloriesBurned = workoutCaloriesBurned(session.split_name, durationMins, weightKg);

    const { data: finishedSession, error: finishError } = await workoutRepo.finishSession(
      session.id,
      durationMins,
      caloriesBurned,
      notes
    );

    if (finishError || !finishedSession) {
      showErrorToast(finishError?.message ?? "Failed to finish session");
      return null;
    }

    const today = new Date().toISOString().split("T")[0];

    // Calculate streak update
    const streakUpdate = WorkoutBusinessService.calculateStreakUpdate(streak, today);
    const { data: updatedStreak } = await streakRepo.update(userId, streakUpdate);

    if (updatedStreak) {
      setStreak(updatedStreak as typeof streak);
    }

    const nextCurrent = updatedStreak?.current_streak ?? 1;

    const { data: workoutCount } = await workoutRepo.countAllWorkouts(userId);
    if (workoutCount) {
      void checkAndUnlock("workout_count", workoutCount);
    }
    void checkAndUnlock("streak", nextCurrent);

    // Check achievements
    const { data: achievements } = await achievementsRepo.getByUserId(userId);
    const earnedBadges = new Set((achievements ?? []).map((a) => a.badge_id));
    const { data: prCount } = await workoutRepo.countPRs(userId);

    const unlocked = WorkoutBusinessService.checkWorkoutAchievements(
      workoutCount ?? 0,
      nextCurrent,
      prCount ?? 0,
      earnedBadges
    );

    await Promise.all(
      unlocked.map((badgeId) =>
        achievementsRepo.earn(userId, badgeId)
      )
    );

    setActiveSession(null);
    setExerciseSets([]);
    showSuccessToast("Workout session saved");
    return finishedSession as WorkoutSession;
  };

  const getExerciseHistory = async (exerciseName: string) => {
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { data: sessions } = await workoutRepo.getRecentSessions(userId, 8);
    if (!sessions?.length) {
      return [];
    }

    const sessionIds = sessions.map((s) => s.id);
    const { data: sets } = await workoutRepo.getExerciseHistory(userId, exerciseName);

    if (!sets?.length) {
      return [];
    }

    const history = WorkoutBusinessService.buildExerciseHistory(
      sets as ExerciseSet[],
      sessions
    );

    return history;
  };

  return useMemo(
    () => ({ activeSession, exerciseSets, startSession, logSet, finishSession, getExerciseHistory }),
    [activeSession, exerciseSets]
  );
}

export default useWorkout;
