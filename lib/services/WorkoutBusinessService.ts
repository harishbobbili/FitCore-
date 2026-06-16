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
   * Calculate updated streak after workout
   */
  static calculateStreakUpdate(
    currentStreak: Streak | null,
    today: string
  ): Partial<Streak> {
    const lastWorkoutDate = currentStreak?.last_workout_date ?? null;

    let nextCurrent = currentStreak?.current_streak ?? 0;
    let nextLongest = currentStreak?.longest_streak ?? 0;

    if (lastWorkoutDate === today) {
      // Already logged today — don't touch the streak
    } else if (lastWorkoutDate) {
      const last = new Date(lastWorkoutDate);
      const todayDate = new Date(today);
      const diffDays = Math.round((todayDate.getTime() - last.getTime()) / 86_400_000);
      if (diffDays === 1) {
        nextCurrent = (currentStreak?.current_streak ?? 0) + 1;
      } else if (diffDays > 1) {
        nextCurrent = 1;
      }
      nextLongest = Math.max(currentStreak?.longest_streak ?? 0, nextCurrent);
    } else {
      nextCurrent = 1;
      nextLongest = 1;
    }

    return {
      current_streak: nextCurrent,
      longest_streak: nextLongest,
      last_workout_date: today,
    };
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
