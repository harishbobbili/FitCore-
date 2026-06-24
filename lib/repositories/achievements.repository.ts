import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";
import type { Achievement, BadgeDefinition } from "@/lib/types";

export class AchievementsRepository extends BaseRepository {
  /**
   * Get all achievements for a user
   */
  async getByUserId(userId: string): Promise<RepositoryResult<Achievement[]>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getAchievements(userId);
        return { data: data as Achievement[] | null, error: null };
      }

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      return { data: (data as Achievement[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Check if a specific badge is earned
   */
  async isEarned(userId: string, badgeId: string): Promise<RepositoryResult<boolean>> {
    try {
      if (this.isDemo) {
        const achievements = await mockDb.getAchievements(userId);
        return { data: achievements.some(a => a.badge_id === badgeId), error: null };
      }

      const { data, error } = await supabase
        .from("achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", badgeId)
        .maybeSingle();

      return { data: !!data, error };
    } catch (error) {
      return { data: false, error: this.handleError(error) };
    }
  }

  /**
   * Earn a new achievement
   */
  async earn(userId: string, badgeId: string): Promise<RepositoryResult<Achievement>> {
    try {
      if (this.isDemo) {
        // Demo achievements are static, but we can simulate
        return { data: null, error: null };
      }

      const { data, error } = await supabase
        .from("achievements")
        .insert({ user_id: userId, badge_id: badgeId })
        .select("*")
        .single();

      return { data: data as Achievement | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Count PRs for a user
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
   * Count workout sessions for a user
   */
  async countWorkouts(userId: string): Promise<RepositoryResult<number>> {
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
}
