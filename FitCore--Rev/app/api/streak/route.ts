import { NextResponse } from "next/server";
import { isSupabaseConfigured, getAuthUser, createClient } from "@/lib/supabase/server";
import { mockDb } from "@/lib/supabase/mockDb";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    const data = await mockDb.getStreak(user.id);
    return NextResponse.json({ success: true, data });
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      // Default return format if no streak record yet exists in the DB
      return NextResponse.json({
        success: true,
        data: {
          user_id: user.id,
          current_streak: 0,
          longest_streak: 0,
          last_workout_date: null,
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
