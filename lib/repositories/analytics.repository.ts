import { supabase } from "@/lib/supabase/client";
import { mockDb } from "@/lib/supabase/mockDb";
import { BaseRepository, RepositoryResult } from "./base";
import type { DailyLog } from "@/lib/types";

export class AnalyticsRepository extends BaseRepository {
  /**
   * Get weekly analytics for dashboard
   */
  async getWeeklySummary(userId: string): Promise<RepositoryResult<{
    logs: DailyLog[];
    workoutCount: number;
    consistencyScore: number;
    plannedDays: number;
  }>> {
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - 6);
      const startDate = startDateObj.toISOString().split("T")[0];

      if (this.isDemo) {
        const analytics = await mockDb.getWeeklyAnalytics(userId);
        return {
          data: {
            logs: analytics.daily_history as DailyLog[],
            workoutCount: analytics.summary.workout_count,
            consistencyScore: 0, // calculated by service
            plannedDays: 3,
          },
          error: null,
        };
      }

      const [logsResult, workoutsResult, profileResult] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true }),
        supabase
          .from("workout_sessions")
          .select("id")
          .eq("user_id", userId)
          .gte("date", startDate)
          .lte("date", endDate),
        supabase
          .from("profiles")
          .select("workout_days_per_week")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      if (logsResult.error) throw logsResult.error;
      if (workoutsResult.error) throw workoutsResult.error;

      const logs = (logsResult.data ?? []) as DailyLog[];
      const workoutCount = workoutsResult.data?.length ?? 0;
      const plannedDays = (profileResult.data?.workout_days_per_week as number) ?? 5;
      const consistencyScore = Math.min(100, Math.round((workoutCount / plannedDays) * 100));

      return {
        data: { logs, workoutCount, consistencyScore, plannedDays },
        error: null,
      };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}
