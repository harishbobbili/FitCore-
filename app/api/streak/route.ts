import { getAuthUser, isSupabaseConfigured, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { ok, unauthorized, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    if (!isSupabaseConfigured()) {
      const data = await mockDb.getStreak(user.id);
      return ok(data);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return ok(
      data ?? {
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        last_workout_date: null,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
