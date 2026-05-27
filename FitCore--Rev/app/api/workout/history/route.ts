import { NextResponse, NextRequest } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";
import { ExerciseSetRow } from "@/types/database.types";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const exerciseName = searchParams.get("exercise");

  if (!exerciseName) {
    return NextResponse.json(
      { success: false, error: "Missing required parameter: exercise" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    const sets = await mockDb.getExerciseHistory(user.id, exerciseName);
    
    // Let's implement dynamic session date mapping for mock data
    const history = sets.map((set) => {
      let date = new Date().toISOString().split("T")[0];
      if (set.session_id === "session-1") date = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (set.session_id === "session-2") date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (set.session_id === "session-3") date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      return {
        ...set,
        date
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let prSet = null;
    if (history.length > 0) {
      prSet = history.reduce((maxSet, currSet) => {
        if (currSet.weight_kg > maxSet.weight_kg) return currSet;
        if (currSet.weight_kg === maxSet.weight_kg && currSet.reps > maxSet.reps) return currSet;
        return maxSet;
      }, history[0]);
    }

    return NextResponse.json({ success: true, data: { history, pr: prSet } });
  }

  try {
    const supabase = createClient();

    // 1. Get all session IDs for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from("workout_sessions")
      .select("id, date")
      .eq("user_id", user.id);

    if (sessionsError) {
      return NextResponse.json({ success: false, error: sessionsError.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ success: true, data: { history: [], pr: null } });
    }

    const sessionMap = new Map((sessions as { id: string; date: string }[]).map(s => [s.id, s.date]));
    const sessionIds = Array.from(sessionMap.keys());

    // 2. Fetch all sets matching the exercise name
    const { data: sets, error: setsError } = await supabase
      .from("exercise_sets")
      .select("*")
      .eq("exercise_name", exerciseName)
      .in("session_id", sessionIds);

    if (setsError) {
      return NextResponse.json({ success: false, error: setsError.message }, { status: 500 });
    }

    // Attach dates to sets and sort them chronologically (descending)
    const history = ((sets || []) as ExerciseSetRow[]).map(set => ({
      ...set,
      date: sessionMap.get(set.session_id) || "",
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate PR
    let pr = null;
    if (history.length > 0) {
      pr = history.reduce((maxSet, currSet) => {
        if (currSet.weight_kg > maxSet.weight_kg) return currSet;
        if (currSet.weight_kg === maxSet.weight_kg && currSet.reps > maxSet.reps) return currSet;
        return maxSet;
      }, history[0]);
    }

    return NextResponse.json({ success: true, data: { history, pr } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
