import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { CreateWorkoutSessionSchema } from "@/lib/validation";
import { ok, unauthorized, handleApiError } from "@/lib/api-response";
import { workoutCaloriesBurned } from "@/lib/calories";
import { StreakService } from "@/lib/services/StreakService";

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

      // Update streak using StreakService (non-fatal)
      try {
        const streakClient = createClient();
        const { data: streak } = await streakClient
          .from("streaks")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        const currentStreak = streak ? {
          currentStreak: streak.current_streak ?? 0,
          longestStreak: streak.longest_streak ?? 0,
          lastWorkoutDate: streak.last_workout_date ?? null,
        } : { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };

        const updatedStreak = StreakService.calculateUpdatedStreak(currentStreak, sessionDate);

        if (!streak) {
          await streakClient.from("streaks").insert({
            user_id: user.id,
            current_streak: updatedStreak.currentStreak,
            longest_streak: updatedStreak.longestStreak,
            last_workout_date: updatedStreak.lastWorkoutDate,
          });
        } else {
          await streakClient
            .from("streaks")
            .update({
              current_streak: updatedStreak.currentStreak,
              longest_streak: updatedStreak.longestStreak,
              last_workout_date: updatedStreak.lastWorkoutDate,
            })
            .eq("user_id", user.id);
        }
      } catch (e) {
        console.warn("Streak update failed:", e);
      }
    }

    return ok(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
