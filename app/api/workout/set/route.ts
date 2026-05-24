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
    
    // Accept a single set object or an array of set objects
    const sets = Array.isArray(body) ? body : [body];

    if (sets.length === 0) {
      return NextResponse.json({ success: false, error: "Empty sets array provided" }, { status: 400 });
    }

    const sessionId = sets[0].session_id;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing required field: session_id" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const data = await mockDb.logExerciseSets(sessionId, sets);
      return NextResponse.json({ success: true, data });
    }

    const supabase = createClient();
    const loggedSets = [];

    // Fetch user id from the session to confirm authorization
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from("workout_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError || !sessionData) {
      return NextResponse.json(
        { success: false, error: "Workout session not found or unauthorized" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (sessionData.user_id !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized access to workout session" }, { status: 403 });
    }

    for (const setData of sets) {
      const { exercise_name, set_number, reps, weight_kg, rest_seconds } = setData;

      if (!exercise_name || set_number === undefined || reps === undefined || weight_kg === undefined) {
        return NextResponse.json({ success: false, error: "Missing required fields in set data" }, { status: 400 });
      }

      // Check for PR by querying past exercises for this user
      // We need to fetch the sessions list first to filter sets by user
      const { data: userSessions, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id);

      let isPr = false;

      if (!sessionsError && userSessions && userSessions.length > 0) {
        const sessionIds = (userSessions as { id: string }[]).map(s => s.id);
        const { data: historicalSets, error: histError } = await supabase
          .from("exercise_sets")
          .select("weight_kg, reps")
          .eq("exercise_name", exercise_name)
          .in("session_id", sessionIds);

        if (!histError && historicalSets) {
          const setsList = historicalSets as { weight_kg: number; reps: number }[];
          if (setsList.length === 0) {
            isPr = true;
          } else {
            const maxPastWeight = Math.max(...setsList.map(s => s.weight_kg));
            const currentWeight = Number(weight_kg);
            const currentReps = Number(reps);

            if (currentWeight > maxPastWeight) {
              isPr = true;
            } else if (currentWeight === maxPastWeight) {
              const maxRepsAtWeight = Math.max(
                ...setsList.filter(s => s.weight_kg === maxPastWeight).map(s => s.reps)
              );
              if (currentReps > maxRepsAtWeight) {
                isPr = true;
              }
            }
          }
        }
      } else {
        isPr = true; // First time logging the exercise is a PR
      }

      const { data: setRow, error: insertError } = await supabase
        .from("exercise_sets")
        .insert({
          session_id: sessionId,
          exercise_name,
          set_number: Number(set_number),
          reps: Number(reps),
          weight_kg: Number(weight_kg),
          rest_seconds: rest_seconds !== undefined ? Number(rest_seconds) : 90,
          is_pr: isPr,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      loggedSets.push(setRow);
    }

    return NextResponse.json({ success: true, data: loggedSets });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
