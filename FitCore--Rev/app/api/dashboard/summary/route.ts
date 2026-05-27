import { NextResponse } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    if (!isSupabaseConfigured()) {
      // Mock mode - fetch all data in parallel
      const [profile, dailyLog, streak, analytics] = await Promise.all([
        mockDb.getUser(user.id),
        mockDb.getDailyLog(user.id, today),
        mockDb.getStreak(user.id),
        mockDb.getWeeklyAnalytics(user.id),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          profile,
          log: dailyLog,
          streak,
          analytics,
        },
      });
    }

    const supabase = createClient();

    // Fetch all data in parallel
    const [profileResult, dailyLogResult, streakResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("daily_logs")
        .upsert({ user_id: user.id, date: today }, { onConflict: "user_id,date", ignoreDuplicates: true })
        .select("*")
        .single(),
      supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    // Fetch meals for today
    const mealsResult = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("time_logged", `${today}T00:00:00.000Z`)
      .lte("time_logged", `${today}T23:59:59.999Z`);

    // Fetch weekly analytics
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - 6);

    const endDate = endDateObj.toISOString().split("T")[0];
    const startDate = startDateObj.toISOString().split("T")[0];

    const [logsResult, workoutsResult] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate),
      supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate),
    ]);

    // Handle profile
    let profile = profileResult.data as any;
    if (!profile) {
      const { data: insertedProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name: "Gym Goer",
          height_cm: 162.5,
          weight_kg: 63,
          goal: "fat_loss",
          experience: "intermediate",
          maintenance_kcal: 2200,
          target_kcal: 1800,
          protein_goal_g: 120,
          carbs_goal_g: 180,
          fat_goal_g: 55,
          water_goal_ml: 3000,
          step_goal: 9000,
          workout_days_per_week: 5,
        })
        .select("*")
        .single();
      profile = insertedProfile;
    }

    // Handle streak
    let streak = streakResult.data as any;
    if (!streak) {
      const { data: insertedStreak } = await supabase
        .from("streaks")
        .insert({ user_id: user.id })
        .select("*")
        .single();
      streak = insertedStreak;
    }

    // Build analytics summary
    const logs = logsResult.data || [];
    const workoutCount = workoutsResult.data?.length || 0;

    const activeLogs = logs.filter((l: any) => l.id !== "");
    const loggedDays = activeLogs.length || 1;

    const totalCalories = activeLogs.reduce((acc: number, curr: any) => acc + (curr.calories_consumed || 0), 0);
    const totalProtein = activeLogs.reduce((acc: number, curr: any) => acc + (curr.protein_g || 0), 0);
    const totalSteps = activeLogs.reduce((acc: number, curr: any) => acc + (curr.steps || 0), 0);
    const totalSleepHours = activeLogs.reduce((acc: number, curr: any) => acc + (curr.sleep_hours || 0), 0);
    const totalWater = activeLogs.reduce((acc: number, curr: any) => acc + (curr.water_ml || 0), 0);

    const weights = activeLogs.map((l: any) => l.weight_kg).filter((w: any) => w !== null);
    const avgWeight = weights.length ? (weights.reduce((acc: number, curr: number) => acc + curr, 0) / weights.length) : null;

    const analytics = {
      daily_history: logs,
      summary: {
        avg_calories: Math.round(totalCalories / loggedDays),
        avg_protein: Math.round(totalProtein / loggedDays),
        avg_steps: Math.round(totalSteps / loggedDays),
        avg_sleep: Number((totalSleepHours / loggedDays).toFixed(1)),
        avg_water: Math.round(totalWater / loggedDays),
        avg_weight: avgWeight ? Number(avgWeight.toFixed(1)) : null,
        workout_count: workoutCount,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        profile,
        log: dailyLogResult.data,
        meals: mealsResult.data || [],
        streak,
        analytics,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
