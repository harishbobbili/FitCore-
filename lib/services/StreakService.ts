import type { StreakData } from "./types";

/**
 * StreakService - handles streak calculation and management logic
 */
export class StreakService {
  /**
   * Calculate if a workout continues a streak
   */
  static continuesStreak(lastWorkoutDate: string | null, currentDate: string): boolean {
    if (!lastWorkoutDate) return true;

    const lastDate = new Date(lastWorkoutDate);
    const current = new Date(currentDate);
    const diffDays = Math.floor((current.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    // Streak continues only if worked out on consecutive days (no day-skipping allowed)
    return diffDays === 1;
  }

  /**
   * Calculate updated streak data after a workout
   */
  static calculateUpdatedStreak(
    currentStreak: StreakData,
    workoutDate: string
  ): StreakData {
    const continues = this.continuesStreak(currentStreak.lastWorkoutDate, workoutDate);

    if (continues) {
      return {
        currentStreak: currentStreak.currentStreak + 1,
        longestStreak: Math.max(currentStreak.longestStreak, currentStreak.currentStreak + 1),
        lastWorkoutDate: workoutDate,
      };
    }

    // Streak broken, start new one
    return {
      currentStreak: 1,
      longestStreak: currentStreak.longestStreak,
      lastWorkoutDate: workoutDate,
    };
  }

  /**
   * Calculate streak status for display
   */
  static getStreakStatus(currentStreak: number): {
    label: string;
    color: string;
    emoji: string;
  } {
    if (currentStreak === 0) {
      return { label: "No streak", color: "gray", emoji: "💪" };
    }
    if (currentStreak < 7) {
      return { label: `${currentStreak} day streak`, color: "blue", emoji: "🔥" };
    }
    if (currentStreak < 30) {
      return { label: `${currentStreak} day streak`, color: "purple", emoji: "⚡" };
    }
    if (currentStreak < 100) {
      return { label: `${currentStreak} day streak`, color: "orange", emoji: "🏆" };
    }
    return { label: `${currentStreak} day legend`, color: "gold", emoji: "👑" };
  }

  /**
   * Calculate days until streak milestone
   */
  static getDaysToMilestone(currentStreak: number, milestone: number): number {
    return Math.max(0, milestone - currentStreak);
  }

  /**
   * Get next milestone for streak
   */
  static getNextMilestone(currentStreak: number): number {
    const milestones = [7, 14, 30, 60, 90, 100, 365];
    return milestones.find(m => m > currentStreak) || milestones[milestones.length - 1];
  }
}
