/**
 * Service layer types and interfaces
 */

export interface WorkoutSessionData {
  splitName: string;
  date: string;
  notes?: string;
}

export interface ExerciseSetData {
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  restSeconds?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

export interface AchievementData {
  badgeId: string;
  triggerType: string;
  threshold: number;
}
