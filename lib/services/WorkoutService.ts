import type { WorkoutSessionData, ExerciseSetData } from "./types";

/**
 * WorkoutService - handles workout-related business logic
 */
export class WorkoutService {
  /**
   * Calculate duration in minutes between two timestamps
   */
  static calculateDurationMinutes(startedAt: string): number {
    return Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000));
  }

  /**
   * Calculate total volume from exercise sets
   */
  static calculateTotalVolume(sets: ExerciseSetData[]): number {
    return sets.reduce((total, set) => total + set.weightKg * set.reps, 0);
  }

  /**
   * Determine if a set is a personal record
   * Compares weight × reps against previous sets for the same exercise
   */
  static isPersonalRecord(
    currentSet: ExerciseSetData,
    previousSets: ExerciseSetData[],
    exerciseName: string
  ): boolean {
    const exerciseHistory = previousSets.filter(s => s.exerciseName === exerciseName);
    if (exerciseHistory.length === 0) return true;

    const currentVolume = currentSet.weightKg * currentSet.reps;
    const maxPreviousVolume = Math.max(...exerciseHistory.map(s => s.weightKg * s.reps));

    return currentVolume > maxPreviousVolume;
  }

  /**
   * Calculate estimated one-rep max (1RM) using the Epley formula
   * 1RM = weight × (1 + reps / 30)
   */
  static calculateEstimated1RM(weightKg: number, reps: number): number {
    if (reps === 1) return weightKg;
    return Math.round(weightKg * (1 + reps / 30));
  }

  /**
   * Calculate training intensity (percentage of 1RM)
   */
  static calculateIntensityPercentage(weightKg: number, oneRepMax: number): number {
    if (oneRepMax === 0) return 0;
    return Math.round((weightKg / oneRepMax) * 100);
  }

  /**
   * Determine training zone based on intensity percentage
   */
  static getTrainingZone(intensityPercentage: number): string {
    if (intensityPercentage >= 90) return "Strength (90%+)";
    if (intensityPercentage >= 80) return "Power (80-89%)";
    if (intensityPercentage >= 70) return "Hypertrophy (70-79%)";
    if (intensityPercentage >= 60) return "Endurance (60-69%)";
    return "Warm-up (<60%)";
  }

  /**
   * Calculate rest time recommendation based on intensity
   */
  static getRecommendedRestTime(intensityPercentage: number): number {
    if (intensityPercentage >= 90) return 180; // 3 minutes for strength
    if (intensityPercentage >= 80) return 120; // 2 minutes for power
    if (intensityPercentage >= 70) return 90;  // 1.5 minutes for hypertrophy
    if (intensityPercentage >= 60) return 60;  // 1 minute for endurance
    return 45; // 45 seconds for warm-up
  }
}
