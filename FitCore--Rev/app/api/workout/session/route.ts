import { NextResponse, NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized: no active session." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, date, split_name, duration_mins, notes } = body;

    if (!split_name) {
      return NextResponse.json(
        { success: false, error: "Missing required field: split_name" },
        { status: 400 }
      );
    }

    const sessionDate = date || new Date().toISOString().split("T")[0];
    const duration = duration_mins !== undefined ? Number(duration_mins) : 60;
    const caloriesBurned = duration * 6; // ~6 kcal per minute estimation

    if (!isSupabaseConfigured()) {
      const data = await mockDb.createWorkoutSession(user.id, sessionDate, split_name, duration, notes);
      return NextResponse.json({ success: true, data });
    }

    const supabase = createClient();
    let result;

    if (id) {
      // Update existing session
      const { data, error } = await supabase
        .from("workout_sessions")
        .update({
          split_name,
          duration_mins: duration,
          calories_burned: caloriesBurned,
          notes: notes || null,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new session
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          date: sessionDate,
          split_name,
          duration_mins: duration,
          calories_burned: caloriesBurned,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Update streaks in Supabase
      const { data: streak, error: streakError } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!streakError) {
        if (!streak) {
          await supabase.from("streaks").insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_workout_date: sessionDate,
          });
        } else {
          let current = streak.current_streak;
          let longest = streak.longest_streak;
          const last = streak.last_workout_date;

          if (last) {
            const lastDate = new Date(last);
            const currentDate = new Date(sessionDate);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
            .update({
              current_streak: current,
              longest_streak: longest,
              last_workout_date: sessionDate,
            })
            .eq("user_id", user.id);
        }
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
