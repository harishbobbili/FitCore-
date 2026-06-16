import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";
import type { Streak } from "@/lib/types";

export class StreakRepository extends BaseRepository {
  /**
   * Get streak for user
   */
  async getByUserId(userId: string): Promise<RepositoryResult<Streak>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getStreak(userId);
        return { data: data as Streak | null, error: null };
      }

      const { data, error } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      return { data: data as Streak | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get or create streak for user
   */
  async getOrCreate(userId: string): Promise<RepositoryResult<Streak>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getStreak(userId);
        return { data: data as Streak | null, error: null };
      }

      const { data, error } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return { data: data as Streak, error: null };
      }

      // Create default streak
      const { data: inserted, error: insertError } = await supabase
        .from("streaks")
        .insert({ user_id: userId, current_streak: 0, longest_streak: 0 })
        .select("*")
        .single();

      return { data: inserted as Streak | null, error: insertError };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Update streak after workout
   */
  async update(userId: string, updates: Partial<Streak>): Promise<RepositoryResult<Streak>> {
    try {
      if (this.isDemo) {
        await mockDb.updateStreak(userId, updates.last_workout_date ?? new Date().toISOString().split("T")[0]);
        const data = await mockDb.getStreak(userId);
        return { data: data as Streak | null, error: null };
      }

      const { data, error } = await supabase
        .from("streaks")
        .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" })
        .select("*")
        .single();

      return { data: data as Streak | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}
