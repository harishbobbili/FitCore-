import { getAuthUser, isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { ok, unauthorized, handleApiError } from "@/lib/api-response";
import type { DailyLogRow } from "@/types/database.types";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    if (!isSupabaseConfigured()) {
      const data = await mockDb.getWeeklyAnalytics(user.id);
      return ok(data);
    }

    const supabase = createClient();

    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - 6);
    const endDate = endDateObj.toISOString().split("T")[0];
    const startDate = startDateObj.toISOString().split("T")[0];

    const [logsResult, workoutsResult, profileResult] = await Promise.all([
      supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("date", startDate).lte("date", endDate),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id).gte("date", startDate).lte("date", endDate),
      supabase.from("profiles").select("workout_days_per_week").eq("id", user.id).maybeSingle(),
    ]);

    if (logsResult.error) throw logsResult.error;
    if (workoutsResult.error) throw workoutsResult.error;

    const logMap = new Map(((logsResult.data ?? []) as DailyLogRow[]).map(l => [l.date, l]));

    const dailyHistory: DailyLogRow[] = [];
    for (let i = -6; i <= 0; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logMap.get(dateStr);
      dailyHistory.push(
        log ?? {
          id: "",
          user_id: user.id,
          date: dateStr,
          calories_consumed: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          water_ml: 0,
          steps: 0,
          sleep_hours: 0,
          mood_score: null,
          weight_kg: null,
        }
      );
    }

    const activeLogs = dailyHistory.filter(l => l.id !== "");
    const n = activeLogs.length || 1;

    const sum = (field: keyof DailyLogRow) =>
      activeLogs.reduce((a, c) => a + (Number(c[field]) || 0), 0);

    const weights = activeLogs.map(l => l.weight_kg).filter((w): w is number => w != null);
    const avgWeight = weights.length
      ? Number((weights.reduce((a, c) => a + c, 0) / weights.length).toFixed(1))
      : null;

    const workoutCount = workoutsResult.data?.length ?? 0;
    const plannedDays = profileResult.data?.workout_days_per_week ?? 5;
    const consistencyScore = Math.min(100, Math.round((workoutCount / plannedDays) * 100));

    return ok({
      daily_history: dailyHistory,
      summary: {
        avg_calories: Math.round(sum("calories_consumed") / n),
        avg_protein: Math.round(sum("protein_g") / n),
        avg_steps: Math.round(sum("steps") / n),
        avg_sleep: Number((sum("sleep_hours") / n).toFixed(1)),
        avg_water: Math.round(sum("water_ml") / n),
        avg_weight: avgWeight,
        workout_count: workoutCount,
        planned_days_per_week: plannedDays,
        consistency_score: consistencyScore,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
