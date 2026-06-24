import { getAuthUser, isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { ok, unauthorized, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const today = new Date().toISOString().split("T")[0];

    if (!isSupabaseConfigured()) {
      const [profile, dailyLog, streak, analytics] = await Promise.all([
        mockDb.getUser(user.id),
        mockDb.getDailyLog(user.id, today),
        mockDb.getStreak(user.id),
        mockDb.getWeeklyAnalytics(user.id),
      ]);
      return ok({ profile, log: dailyLog, streak, analytics });
    }

    const supabase = createClient();

    const endDate = today;
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 6);
    const startDate = startDateObj.toISOString().split("T")[0];

    // All fetches in parallel to eliminate waterfall
    const [profileResult, dailyLogResult, streakResult, mealsResult, logsResult, workoutsResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("daily_logs")
        .upsert({ user_id: user.id, date: today }, { onConflict: "user_id,date", ignoreDuplicates: true })
        .select("*")
        .single(),
      supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("time_logged", `${today}T00:00:00.000Z`)
        .lte("time_logged", `${today}T23:59:59.999Z`),
      supabase.from("daily_logs").select("*").eq("user_id", user.id).gte("date", startDate).lte("date", endDate),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id).gte("date", startDate).lte("date", endDate),
    ]);

    // Auto-create profile if missing (new user)
    let profile = profileResult.data;
    if (!profile) {
      const { data: insertedProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name: user.name ?? "Athlete",
          goal: "general",
          experience: "beginner",
          target_kcal: 2000,
          protein_goal_g: 150,
          carbs_goal_g: 200,
          fat_goal_g: 65,
          water_goal_ml: 3000,
          step_goal: 8000,
          workout_days_per_week: 3,
        })
        .select("*")
        .single();
      profile = insertedProfile;
    }

    // Auto-create streak if missing
    let streak = streakResult.data;
    if (!streak) {
      const { data: insertedStreak } = await supabase
        .from("streaks")
        .insert({ user_id: user.id, current_streak: 0, longest_streak: 0 })
        .select("*")
        .single();
      streak = insertedStreak;
    }

    // Build analytics summary
    const logs = logsResult.data ?? [];
    const activeLogs = logs.filter((l: { id: string }) => l.id !== "");
    const n = activeLogs.length || 1;

    const sum = (field: string) =>
      activeLogs.reduce((a: number, c: Record<string, number | null>) => a + (Number(c[field]) || 0), 0);

    const weights = activeLogs
      .map((l: Record<string, number | null>) => l.weight_kg)
      .filter((w: number | null): w is number => w != null);
    const avgWeight = weights.length
      ? Number((weights.reduce((a: number, c: number) => a + c, 0) / weights.length).toFixed(1))
      : null;

    const workoutCount = workoutsResult.data?.length ?? 0;
    const plannedDays = (profile as { workout_days_per_week?: number } | null)?.workout_days_per_week ?? 5;
    const consistencyScore = Math.min(100, Math.round((workoutCount / plannedDays) * 100));

    return ok({
      profile,
      log: dailyLogResult.data,
      meals: mealsResult.data ?? [],
      streak,
      analytics: {
        daily_history: logs,
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
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
