import { NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { CreateExerciseSetsSchema } from "@/lib/validation";
import { ok, unauthorized, badRequest, forbidden, handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) return unauthorized();

    const body = await request.json();
    const sets = CreateExerciseSetsSchema.parse(body);

    if (sets.length === 0) return badRequest("No sets provided.");

    const sessionId = sets[0].session_id;

    if (!isSupabaseConfigured()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await mockDb.logExerciseSets(sessionId, sets as any);
      return ok(data, 201);
    }

    const supabase = createClient();

    // Verify session ownership once for all sets
    const { data: sessionData, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) return badRequest("Workout session not found.");
    if (sessionData.user_id !== user.id) return forbidden();

    // Fetch user's all-time best for PR detection in one query
    const exerciseNames = Array.from(new Set(sets.map(s => s.exercise_name)));
    const { data: allSessions } = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("user_id", user.id);

    const sessionIds = (allSessions ?? []).map((s: { id: string }) => s.id);

    // Build a PR map: exercise_name → { maxWeight, maxRepsAtMaxWeight }
    const prMap = new Map<string, { maxWeight: number; maxRepsAtMaxWeight: number }>();

    if (sessionIds.length > 0) {
      const { data: historicalSets } = await supabase
        .from("exercise_sets")
        .select("exercise_name, weight_kg, reps")
        .in("session_id", sessionIds)
        .in("exercise_name", exerciseNames);

      for (const hs of (historicalSets ?? []) as { exercise_name: string; weight_kg: number; reps: number }[]) {
        const current = prMap.get(hs.exercise_name);
        if (!current || hs.weight_kg > current.maxWeight) {
          prMap.set(hs.exercise_name, { maxWeight: hs.weight_kg, maxRepsAtMaxWeight: hs.reps });
        } else if (hs.weight_kg === current.maxWeight && hs.reps > current.maxRepsAtMaxWeight) {
          prMap.set(hs.exercise_name, { maxWeight: hs.weight_kg, maxRepsAtMaxWeight: hs.reps });
        }
      }
    }

    // Insert all sets
    const insertPayload = sets.map(s => {
      const prev = prMap.get(s.exercise_name);
      let isPr = false;
      if (!prev) {
        isPr = true; // first ever log for this exercise
      } else if (s.weight_kg > prev.maxWeight) {
        isPr = true;
      } else if (s.weight_kg === prev.maxWeight && s.reps > prev.maxRepsAtMaxWeight) {
        isPr = true;
      }

      return {
        session_id: sessionId,
        exercise_name: s.exercise_name,
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: s.weight_kg,
        rest_seconds: s.rest_seconds ?? 90,
        is_pr: isPr,
      };
    });

    const { data: loggedSets, error: insertError } = await supabase
      .from("exercise_sets")
      .insert(insertPayload)
      .select();

    if (insertError) throw insertError;
    return ok(loggedSets, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
