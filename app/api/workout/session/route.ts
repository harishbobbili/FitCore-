import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { CreateWorkoutSessionSchema } from "@/lib/validation";
import { ok, unauthorized, handleApiError } from "@/lib/api-response";
import { workoutCaloriesBurned } from "@/lib/calories";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const body = await request.json();
    const validated = CreateWorkoutSessionSchema.parse(body);

    const sessionDate = validated.date ?? new Date().toISOString().split("T")[0];
    const duration = validated.duration_mins ?? 60;

    // Fetch user weight for MET-based calorie calculation
    let userWeightKg = 70; // safe default
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("weight_kg")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.weight_kg) userWeightKg = profile.weight_kg;
      } catch { /* non-fatal — use default */ }
    }

    const caloriesBurned = workoutCaloriesBurned(validated.split_name, duration, userWeightKg);

    if (!isSupabaseConfigured()) {
      const data = await mockDb.createWorkoutSession(
        user.id, sessionDate, validated.split_name, duration, validated.notes ?? undefined
      );
      return ok(data, 201);
    }

    const supabase = createClient();
    let result;

    if (validated.id) {
      // Update existing session
      const { data, error } = await supabase
        .from("workout_sessions")
        .update({ split_name: validated.split_name, duration_mins: duration, calories_burned: caloriesBurned, notes: validated.notes ?? null })
        .eq("id", validated.id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert new session
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({ user_id: user.id, date: sessionDate, split_name: validated.split_name, duration_mins: duration, calories_burned: caloriesBurned, notes: validated.notes ?? null })
        .select()
        .single();
      if (error) throw error;
      result = data;

      // Update streak (non-fatal)
      await updateStreak(user.id, sessionDate).catch(e => console.warn("Streak update failed:", e));
    }

    return ok(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

async function updateStreak(userId: string, sessionDate: string) {
  const supabase = createClient();
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!streak) {
    await supabase.from("streaks").insert({
      user_id: userId, current_streak: 1, longest_streak: 1, last_workout_date: sessionDate,
    });
    return;
  }

  let current = streak.current_streak ?? 0;
  let longest = streak.longest_streak ?? 0;
  const last = streak.last_workout_date;

  if (last) {
    const lastDate = new Date(last);
    const currentDate = new Date(sessionDate);
    // Normalise to calendar days — compare date strings to avoid timezone edge cases
    const lastDay = lastDate.toISOString().split("T")[0];
    const currentDay = currentDate.toISOString().split("T")[0];

    if (currentDay === lastDay) {
      // Same day — don't double-count
      return;
    }

    const diffMs = currentDate.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffMs / 86_400_000);

    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  } else {
    current = 1;
    longest = Math.max(longest, 1);
  }

  await supabase
    .from("streaks")
    .update({ current_streak: current, longest_streak: longest, last_workout_date: sessionDate })
    .eq("user_id", userId);
}
