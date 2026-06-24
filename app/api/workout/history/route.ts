import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { ok, unauthorized, badRequest, handleApiError } from "@/lib/api-response";
import type { ExerciseSetRow } from "@/types/database.types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const { searchParams } = new URL(request.url);
    const exerciseName = searchParams.get("exercise");

    if (!exerciseName) return badRequest("Missing required parameter: exercise");
    if (exerciseName.length > 100) return badRequest("Exercise name too long.");

    if (!isSupabaseConfigured()) {
      const sets = await mockDb.getExerciseHistory(user.id, exerciseName);
      const history = sets
        .map(set => ({
          ...set,
          date: set.session_id === "session-1"
            ? new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0]
            : set.session_id === "session-2"
            ? new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const pr = history.length
        ? history.reduce((best, curr) => {
            if (curr.weight_kg > best.weight_kg) return curr;
            if (curr.weight_kg === best.weight_kg && curr.reps > best.reps) return curr;
            return best;
          }, history[0])
        : null;

      return ok({ history, pr });
    }

    const supabase = createClient();

    const { data: sessions, error: sessionsError } = await supabase
      .from("workout_sessions")
      .select("id, date")
      .eq("user_id", user.id);

    if (sessionsError) throw sessionsError;
    if (!sessions?.length) return ok({ history: [], pr: null });

    const sessionMap = new Map((sessions as { id: string; date: string }[]).map(s => [s.id, s.date]));
    const sessionIds = Array.from(sessionMap.keys());

    const { data: sets, error: setsError } = await supabase
      .from("exercise_sets")
      .select("*")
      .eq("exercise_name", exerciseName)
      .in("session_id", sessionIds);

    if (setsError) throw setsError;

    const history = ((sets ?? []) as ExerciseSetRow[])
      .map(set => ({ ...set, date: sessionMap.get(set.session_id) ?? "" }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pr = history.length
      ? history.reduce((best, curr) => {
          if (curr.weight_kg > best.weight_kg) return curr;
          if (curr.weight_kg === best.weight_kg && curr.reps > best.reps) return curr;
          return best;
        }, history[0])
      : null;

    return ok({ history, pr });
  } catch (error) {
    return handleApiError(error);
  }
}
