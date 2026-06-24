import type { WorkoutSession, ExerciseSet, Streak, Achievement, BadgeDefinition } from "@/lib/types";
import { BADGE_DEFINITIONS } from "@/lib/constants";
import { StreakService } from "./StreakService";
import { AchievementService } from "./AchievementService";

export interface PRResult {
  isPR: boolean;
  priorMax: { weight_kg: number | null; reps: number | null } | null;
}

export interface FinishSessionResult {
  session: WorkoutSession | null;
  streak: Streak | null;
  unlockedAchievements: string[];
  workoutCount: number;
}

/**
 * WorkoutBusinessService - orchestrates workout business logic
 * Handles PR calculations, streak updates, achievements, and data aggregation
 */
export class WorkoutBusinessService {
  /**
   * Determine if a set is a personal record
   */
  static isPersonalRecord(
    weightKg: number,
    reps: number,
    priorMax: { weight_kg: number | null; reps: number | null } | null
  ): PRResult {
    const isPR = !priorMax
      ? weightKg > 0 && reps > 0
      : (weightKg > (priorMax.weight_kg ?? 0)) ||
        (weightKg === (priorMax.weight_kg ?? 0) && reps > (priorMax.reps ?? 0));

    return { isPR, priorMax };
  }

  /**
   * Check which achievements should be unlocked after a workout
   */
  static checkWorkoutAchievements(
    workoutCount: number,
    streak: number,
    prCount: number,
    earnedBadgeIds: Set<string>
  ): string[] {
    const unlocked: string[] = [];

    BADGE_DEFINITIONS.forEach((badge) => {
      if (badge.triggerType === "workout_count" && workoutCount >= badge.threshold && !earnedBadgeIds.has(badge.id)) {
        unlocked.push(badge.id);
      }
      if (badge.triggerType === "streak" && streak >= badge.threshold && !earnedBadgeIds.has(badge.id)) {
        unlocked.push(badge.id);
      }
      if (badge.triggerType === "pr_count" && prCount >= badge.threshold && !earnedBadgeIds.has(badge.id)) {
        unlocked.push(badge.id);
      }
    });

    return unlocked;
  }

  /**
   * Calculate exercise history from sessions and sets
   */
  static buildExerciseHistory(
    sets: ExerciseSet[],
    sessions: { id: string; date: string }[]
  ): (ExerciseSet & { date: string })[] {
    const sessionMap = new Map(sessions.map((s) => [s.id, s.date]));

    return sets
      .map((set) => ({
        ...set,
        date: sessionMap.get(set.session_id) ?? new Date().toISOString().split("T")[0],
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
