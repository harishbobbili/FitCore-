import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string;
  split_name: string;
  started_at: string;
  finished_at: string | null;
  duration_mins: number;
  calories_burned: number;
  notes: string | null;
}

export interface ExerciseSet {
  id: string;
  session_id: string;
  user_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  is_pr: boolean;
}

export class WorkoutsRepository extends BaseRepository {
  /**
   * Create workout session
   */
  async createSession(
    userId: string,
    splitName: string,
    date: string,
    notes?: string
  ): Promise<RepositoryResult<WorkoutSession>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.createWorkoutSession(userId, date, splitName, notes);
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: userId,
          split_name: splitName,
          date,
          notes: notes ?? null,
        })
        .select("*")
        .single();

      return { data: data as WorkoutSession | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get workout session by date
   */
  async getSessionByDate(userId: string, date: string): Promise<RepositoryResult<WorkoutSession>> {
    try {
      if (this.isDemo) {
        // Mock implementation
        return { data: null, error: null };
      }

      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      return { data: data as WorkoutSession | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Finish workout session
   */
  async finishSession(
    sessionId: string,
    durationMins: number,
    caloriesBurned: number,
    notes?: string
  ): Promise<RepositoryResult<WorkoutSession>> {
    try {
      if (this.isDemo) {
        // Mock implementation
        return { data: null, error: null };
      }

      const { data, error } = await supabase
        .from("workout_sessions")
        .update({
          finished_at: new Date().toISOString(),
          duration_mins: durationMins,
          calories_burned: caloriesBurned,
          notes: notes ?? null,
        })
        .eq("id", sessionId)
        .select("*")
        .single();

      return { data: data as WorkoutSession | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Log exercise sets
   */
  async logExerciseSets(sessionId: string, sets: ExerciseSet[]): Promise<RepositoryResult<ExerciseSet[]>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.logExerciseSets(sessionId, sets);
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("exercise_sets")
        .insert(sets.map(set => ({
          session_id: sessionId,
          user_id: set.user_id,
          exercise_name: set.exercise_name,
          set_number: set.set_number,
          reps: set.reps,
          weight_kg: set.weight_kg,
          rest_seconds: set.rest_seconds,
          is_pr: set.is_pr,
        })))
        .select("*");

      return { data: (data as ExerciseSet[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get exercise history for an exercise
   */
  async getExerciseHistory(userId: string, exerciseName: string): Promise<RepositoryResult<ExerciseSet[]>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getExerciseHistory(userId, exerciseName);
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("exercise_sets")
        .select("*")
        .eq("user_id", userId)
        .eq("exercise_name", exerciseName)
        .order("logged_at", { ascending: false })
        .limit(50);

      return { data: (data as ExerciseSet[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Count workout sessions in date range
   */
  async countSessionsInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<RepositoryResult<number>> {
    try {
      if (this.isDemo) {
        return { data: 0, error: null };
      }

      const { count, error } = await supabase
        .from("workout_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate);

      return { data: count ?? 0, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get prior max weight for an exercise
   */
  async getPriorMax(userId: string, exerciseName: string): Promise<RepositoryResult<{ weight_kg: number | null; reps: number | null }>> {
    try {
      if (this.isDemo) {
        const history = await mockDb.getExerciseHistory(userId, exerciseName);
        if (history.length === 0) return { data: null, error: null };
        const max = history.reduce((prev, curr) => curr.weight_kg > prev.weight_kg ? curr : prev);
        return { data: { weight_kg: max.weight_kg, reps: max.reps }, error: null };
      }

      const { data, error } = await supabase
        .from("exercise_sets")
        .select("weight_kg, reps")
        .eq("user_id", userId)
        .eq("exercise_name", exerciseName)
        .order("weight_kg", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      return { data: data as { weight_kg: number | null; reps: number | null } | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Count total PRs for user
   */
  async countPRs(userId: string): Promise<RepositoryResult<number>> {
    try {
      if (this.isDemo) {
        return { data: 0, error: null };
      }

      const { count, error } = await supabase
        .from("exercise_sets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_pr", true);

      return { data: count ?? 0, error };
    } catch (error) {
      return { data: 0, error: this.handleError(error) };
    }
  }

  /**
   * Count total workout sessions for user
   */
  async countAllWorkouts(userId: string): Promise<RepositoryResult<number>> {
    try {
      if (this.isDemo) {
        return { data: 0, error: null };
      }

      const { count, error } = await supabase
        .from("workout_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      return { data: count ?? 0, error };
    } catch (error) {
      return { data: 0, error: this.handleError(error) };
    }
  }

  /**
   * Get recent workout sessions
   */
  async getRecentSessions(userId: string, limit: number = 8): Promise<RepositoryResult<{ id: string; date: string }[]>> {
    try {
      if (this.isDemo) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from("workout_sessions")
        .select("id, date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(limit);

      return { data: (data as { id: string; date: string }[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}
