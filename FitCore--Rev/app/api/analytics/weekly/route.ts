import { NextResponse } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { DailyLogRow } from "@/types/database.types";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    const data = await mockDb.getWeeklyAnalytics(user.id);
    return NextResponse.json({ success: true, data });
  }

  try {
    const supabase = createClient();
    
    // Calculate start date (today - 6 days) and end date (today)
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - 6);

    const endDate = endDateObj.toISOString().split("T")[0];
    const startDate = startDateObj.toISOString().split("T")[0];

    // Fetch daily logs in date range
    const { data: logs, error: logsError } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (logsError) throw logsError;

    // Fetch workouts in date range
    const { data: workouts, error: workoutsError } = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (workoutsError) throw workoutsError;

    // Build the 7-day history array (filling in missing days with empty values)
    const dailyHistory: DailyLogRow[] = [];
    const logMap = new Map(((logs || []) as DailyLogRow[]).map(l => [l.date, l]));

    for (let i = -6; i <= 0; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logMap.get(dateStr);

      if (log) {
        dailyHistory.push(log);
      } else {
        dailyHistory.push({
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
        });
      }
    }

    // Calculate averages
    const activeLogs = dailyHistory.filter(l => l.id !== "");
    const loggedDays = activeLogs.length || 1;

    const totalCalories = activeLogs.reduce((acc, curr) => acc + curr.calories_consumed, 0);
    const totalProtein = activeLogs.reduce((acc, curr) => acc + curr.protein_g, 0);
    const totalSteps = activeLogs.reduce((acc, curr) => acc + curr.steps, 0);
    const totalSleepHours = activeLogs.reduce((acc, curr) => acc + curr.sleep_hours, 0);
    const totalWater = activeLogs.reduce((acc, curr) => acc + curr.water_ml, 0);

    const weights = activeLogs.map(l => l.weight_kg).filter((w): w is number => w !== null);
    const avgWeight = weights.length ? (weights.reduce((acc, curr) => acc + curr, 0) / weights.length) : null;

    const summary = {
      avg_calories: Math.round(totalCalories / loggedDays),
      avg_protein: Math.round(totalProtein / loggedDays),
      avg_steps: Math.round(totalSteps / loggedDays),
      avg_sleep: Number((totalSleepHours / loggedDays).toFixed(1)),
      avg_water: Math.round(totalWater / loggedDays),
      avg_weight: avgWeight ? Number(avgWeight.toFixed(1)) : null,
      workout_count: workouts ? workouts.length : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        daily_history: dailyHistory,
        summary,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
