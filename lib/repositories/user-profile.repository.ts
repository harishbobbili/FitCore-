import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";
import type { Profile } from "@/lib/types";

const defaultProfileValues = {
  name: "Athlete",
  goal: "general",
  experience: "beginner",
  target_kcal: 2000,
  protein_goal_g: 140,
  carbs_goal_g: 200,
  fat_goal_g: 65,
  water_goal_ml: 3000,
  step_goal: 8000,
  workout_days_per_week: 3,
};

export class UserProfileRepository extends BaseRepository {
  /**
   * Get user profile
   */
  async getByUserId(userId: string): Promise<RepositoryResult<Profile>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getUser(userId);
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      return { data: data as Profile | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get or create user profile
   */
  async getOrCreate(userId: string): Promise<RepositoryResult<Profile>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getUser(userId);
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return { data: data as Profile, error: null };
      }

      // Create profile with defaults
      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...defaultProfileValues }, { onConflict: "id", ignoreDuplicates: true })
        .select("*")
        .single();

      return { data: inserted as Profile | null, error: insertError };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Update user profile
   */
  async update(userId: string, fields: Partial<Profile>): Promise<RepositoryResult<Profile>> {
    try {
      if (this.isDemo) {
        // Mock implementation - return updated profile
        const current = await mockDb.getUser(userId);
        const data = current ? { ...current, ...fields } : null;
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...fields })
        .select("*")
        .single();

      return { data: data as Profile | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}
