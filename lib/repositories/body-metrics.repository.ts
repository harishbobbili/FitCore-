import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";
import type { BodyMetric } from "@/lib/types";

export class BodyMetricsRepository extends BaseRepository {
  /**
   * Get body metrics for a user in a date range
   */
  async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<RepositoryResult<BodyMetric[]>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.getBodyMetrics(userId);
        return { data: (data as BodyMetric[]).filter(m => m.date >= startDate && m.date <= endDate), error: null };
      }

      const { data, error } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      return { data: (data as BodyMetric[]) ?? null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  /**
   * Get recent body metrics (default 30 days)
   */
  async getRecent(userId: string, days: number = 30): Promise<RepositoryResult<BodyMetric[]>> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.getByDateRange(userId, cutoff.toISOString().split("T")[0], new Date().toISOString().split("T")[0]);
  }

  /**
   * Log body metrics
   */
  async log(userId: string, fields: Partial<BodyMetric>): Promise<RepositoryResult<BodyMetric>> {
    try {
      if (this.isDemo) {
        const data = await mockDb.logBodyMetrics(userId, fields as Omit<BodyMetric, "id" | "user_id">);
        return { data: data as BodyMetric | null, error: null };
      }

      const date = fields.date || new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("body_metrics")
        .upsert({ user_id: userId, ...fields, date }, { onConflict: "user_id,date" })
        .select("*")
        .single();

      return { data: data as BodyMetric | null, error };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}
