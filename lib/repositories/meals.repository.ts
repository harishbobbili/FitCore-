import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";
import type { Meal } from "@/lib/types";

export class MealsRepository extends BaseRepository {
  /**
   * Get meals for a specific date
   */
  async getByDate(userId: string, date: string): Promise<RepositoryResult<Meal[]>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getMeals(userId, date);
        return { data: data as Meal[] | null, error: null };
      }

      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .order("logged_at", { ascending: true });

      return { data: (data as Meal[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get meals for a time range
   */
  async getByDateRange(userId: string, startDate: string, endDate: string): Promise<RepositoryResult<Meal[]>> {
    try {
      if (this.isDemo) {
        // For demo, return all meals in the date range
        const data = await mockDb.getMeals(userId, startDate);
        return { data: data as Meal[] | null, error: null };
      }

      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("logged_at", { ascending: true });

      return { data: (data as Meal[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Add a meal
   */
  async add(userId: string, meal: Omit<Meal, "id" | "user_id">): Promise<RepositoryResult<Meal>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.addMeal(userId, meal);
        return { data: data as Meal | null, error: null };
      }

      const { data, error } = await supabase
        .from("meals")
        .insert({ user_id: userId, ...meal })
        .select("*")
        .single();

      return { data: data as Meal | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Delete a meal
   */
  async delete(userId: string, mealId: string): Promise<RepositoryResult<void>> {
    try {
      if (this.isDemo) {
        await mockDb.deleteMeal(userId, mealId);
        return { data: null, error: null };
      }

      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", mealId)
        .eq("user_id", userId);

      return { data: null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}
