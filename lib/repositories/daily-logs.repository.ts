import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";
import type { DailyLog } from "@/lib/types";

export class DailyLogsRepository extends BaseRepository {
  /**
   * Get daily log for a specific date
   */
  async getByDate(userId: string, date: string): Promise<RepositoryResult<DailyLog>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getDailyLog(userId, date);
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      return { data: data as DailyLog | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get daily logs for a date range
   */
  async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<RepositoryResult<DailyLog[]>> {
    try {
      if (this.isDemo) {
        // Mock implementation for date range
        const data = await mockDb.getDailyLog(userId, startDate);
        return { data: data ? [data] : [], error: null };
      }

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      return { data: (data as DailyLog[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Upsert daily log
   */
  async upsert(
    userId: string,
    date: string,
    fields: Partial<DailyLog>
  ): Promise<RepositoryResult<DailyLog>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.upsertDailyLog(userId, date, fields);
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("daily_logs")
        .upsert({ user_id: userId, date, ...fields }, { onConflict: "user_id,date" })
        .select("*")
        .single();

      return { data: data as DailyLog | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Update specific field in daily log
   */
  async updateField(
    userId: string,
    date: string,
    field: keyof DailyLog,
    value: number
  ): Promise<RepositoryResult<DailyLog>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.upsertDailyLog(userId, date, { [field]: value });
        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("daily_logs")
        .update({ [field]: value })
        .eq("user_id", userId)
        .eq("date", date)
        .select("*")
        .single();

      return { data: data as DailyLog | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}
